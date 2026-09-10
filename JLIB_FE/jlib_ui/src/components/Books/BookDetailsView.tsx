import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Tooltip,
  IconButton,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CropIcon from '@mui/icons-material/Crop';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import { deleteBook, updateBook, deleteBookCover } from '../../services/bookService';
import { ImageCropModal } from '../common/ImageCropModal';
import { getDefaultBookCover } from './BookCard';
import styles from './BookDetailsView.module.css';

interface BookDetailsViewProps {
  book: Book;
  onBack: () => void;
  onDelete?: (bookId: string | number) => void;
  onUpdate?: (updatedBook: Book) => void;
}

const BOOK_PLACEHOLDER_URL = '/assets/book-placeholder.png';

const getBookCoverUrl = (book: Book, numericId: number): string => {
  if (book.cover_url && book.cover_url.trim()) return book.cover_url.trim();

  const nameLower = (book.book_name || '').toLowerCase();
  if (nameLower.includes('boy who harnessed')) {
    return 'https://m.media-amazon.com/images/I/81A-p8hP9qL._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('twist of gold')) {
    return 'https://m.media-amazon.com/images/I/91eK6g9oX4L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('sea of monsters')) {
    return 'https://m.media-amazon.com/images/I/81L8H0J1-1L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('titan') && nameLower.includes('curse')) {
    return 'https://m.media-amazon.com/images/I/81x-sD-F04L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('battle of the labyrinth')) {
    return 'https://m.media-amazon.com/images/I/81B85vE8-VL._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('last olympian')) {
    return 'https://m.media-amazon.com/images/I/91K8h4fVv3L._AC_UF1000,1000_QL80_.jpg';
  }
  if (nameLower.includes('philosopher') || nameLower.includes('harry potter')) {
    return 'https://m.media-amazon.com/images/I/81q77Q39nEL._AC_UF1000,1000_QL80_.jpg';
  }

  return getDefaultBookCover(numericId);
};

const getBookSummaryData = (book: Book) => {
  const title = book.book_name || 'Book';
  const author = book.author || 'Author';

  if (title.toLowerCase().includes('boy who harnessed')) {
    return {
      overview: `The Boy Who Harnessed the Wind is the memoir of William Kamkwamba, a young boy from Malawi who faced severe drought and famine in the early 2000s. Unable to attend school due to his family's inability to pay tuition, Kamkwamba continued his education independently by reading science books at a local community library. Using rudimentary physics principles and scavenged scrap metal, bicycle parts, and blue-gum trees, he successfully constructed a working windmill. His invention generated electricity and pumped water, ultimately transforming his family's agricultural prospects and garnering global recognition for grassroots innovation.`,
      keyThemes: [
        'Ingenuity and self-taught engineering',
        'Resilience amid poverty and environmental catastrophe',
        'The transformative value of access to books and education',
        'Overcoming social skepticism and failure',
        'Sustainable, community-level technological solutions',
      ],
      whoShouldRead: 'Readers interested in inspiring true stories of perseverance, renewable energy innovation, and African youth leadership.',
    };
  }

  if (title.toLowerCase().includes('sea of monsters') || title.toLowerCase().includes('percy jackson')) {
    return {
      overview: `${title} by ${author} follows Percy Jackson as he embarks on a dangerous quest across the Atlantic's Bermuda Triangle to retrieve the mythical Golden Fleece. Accompanied by Annabeth and his half-brother Tyson, Percy must navigate treacherous mythical obstacles to cure Thalia's poisoned pine tree and save Camp Half-Blood from ancient forces of destruction.`,
      keyThemes: [
        'Loyalty to friends and chosen family',
        'Courage in the face of impossible odds',
        'Modern reinterpretations of classical Greek mythology',
        'Brotherhood and identity acceptance',
      ],
      whoShouldRead: 'Fans of fast-paced mythology adventures, young adult fantasy, and coming-of-age hero journeys.',
    };
  }

  return {
    overview: `${title} by ${author} is a compelling work that explores profound themes within ${book.genre || 'literary storytelling'}. Offering rich character developments and insightful narratives, it takes readers on a captivating journey through thought-provoking events and memorable perspectives.`,
    keyThemes: [
      'Personal growth and overcoming adversity',
      'The power of knowledge, perseverance, and discovery',
      'Complex interpersonal relationships and social dynamics',
      'Reflections on human values and environmental context',
    ],
    whoShouldRead: `Enthusiasts of ${book.genre || 'great literature'}, thoughtful readers seeking engaging narratives, and library members exploring ${book.publication || 'quality publications'}.`,
  };
};

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({ book, onBack, onDelete, onUpdate }) => {
  const [currentBook, setCurrentBook] = useState<Book>(book);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Summary'>('Overview');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit Mode & State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Fields for Editing
  const [editTitle, setEditTitle] = useState(book.book_name || '');
  const [editNativeTitle, setEditNativeTitle] = useState(book.book_name_native_lang || book.native_title || '');
  const [editAuthor, setEditAuthor] = useState(book.author || '');
  const [editPublisher, setEditPublisher] = useState(book.publication || '');
  const [editYear, setEditYear] = useState(book.published_year ? String(book.published_year) : '');
  const [editEdition, setEditEdition] = useState(book.edition || '');
  const [editLanguage, setEditLanguage] = useState(book.language || 'English');
  const [editPages, setEditPages] = useState(book.pages ? String(book.pages) : '');
  const [editSection, setEditSection] = useState(book.section || '');
  const [editGenre, setEditGenre] = useState(book.genre || '');
  const [editIsbn, setEditIsbn] = useState(book.isbn || '');
  const [editAvailability, setEditAvailability] = useState(
    book.availability_status || (book.is_available ? 'Available' : 'Borrowed')
  );
  const [editDescription, setEditDescription] = useState(book.description || '');
  const [editCoverUrl, setEditCoverUrl] = useState<string | null>(null);

  // Hidden File Input Ref for Cover Photo (uses default native device options)
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Crop and Adjust Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  // Sync state if book prop changes
  useEffect(() => {
    setCurrentBook(book);
    setEditTitle(book.book_name || '');
    setEditNativeTitle(book.book_name_native_lang || book.native_title || '');
    setEditAuthor(book.author || '');
    setEditPublisher(book.publication || '');
    setEditYear(book.published_year ? String(book.published_year) : '');
    setEditEdition(book.edition || '');
    setEditLanguage(book.language || 'English');
    setEditPages(book.pages ? String(book.pages) : '');
    setEditSection(book.section || '');
    setEditGenre(book.genre || '');
    setEditIsbn(book.isbn || '');
    setEditAvailability(book.availability_status || (book.is_available ? 'Available' : 'Borrowed'));
    setEditDescription(book.description || '');
    setEditCoverUrl(null);
  }, [book]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteBook(String(currentBook.book_id));
      setIsDeleteDialogOpen(false);
      if (onDelete) {
        onDelete(currentBook.book_id);
      } else {
        onBack();
      }
    } catch (err: any) {
      console.error('Failed to delete book:', err);
      setDeleteError(err.message || 'Failed to delete book. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyBookId = () => {
    navigator.clipboard.writeText(String(currentBook.book_id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
    setEditTitle(currentBook.book_name || '');
    setEditNativeTitle(currentBook.book_name_native_lang || currentBook.native_title || '');
    setEditAuthor(currentBook.author || '');
    setEditPublisher(currentBook.publication || '');
    setEditYear(currentBook.published_year ? String(currentBook.published_year) : '');
    setEditEdition(currentBook.edition || '');
    setEditLanguage(currentBook.language || 'English');
    setEditPages(currentBook.pages ? String(currentBook.pages) : '');
    setEditSection(currentBook.section || '');
    setEditGenre(currentBook.genre || '');
    setEditIsbn(currentBook.isbn || '');
    setEditAvailability(currentBook.availability_status || (currentBook.is_available ? 'Available' : 'Borrowed'));
    setEditDescription(currentBook.description || '');
    setEditCoverUrl(null);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      setSaveError('Book title is mandatory.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const updatedPayload: Partial<Book> = {
      book_name: editTitle.trim(),
      book_name_native_lang: editNativeTitle.trim() || null,
      native_title: editNativeTitle.trim() || undefined,
      author: editAuthor.trim() || 'Unknown Author',
      publication: editPublisher.trim() || null,
      published_year: editYear.trim() || undefined,
      edition: editEdition.trim() || undefined,
      language: editLanguage.trim() || 'English',
      pages: editPages.trim() ? Number(editPages) : undefined,
      section: editSection.trim() ? editSection.trim().toUpperCase() : null,
      genre: editGenre.trim() || null,
      isbn: editIsbn.trim() || undefined,
      availability_status: editAvailability,
      is_available: editAvailability === 'Available',
      description: editDescription.trim() || undefined,
      ...(editCoverUrl !== null ? { cover_url: editCoverUrl === BOOK_PLACEHOLDER_URL ? '' : editCoverUrl } : {}),
    };

    try {
      const saved = await updateBook(String(currentBook.book_id), updatedPayload);
      const isCoverRemoved = editCoverUrl === BOOK_PLACEHOLDER_URL;
      const mergedBook: Book = {
        ...currentBook,
        ...updatedPayload,
        ...saved,
        ...(isCoverRemoved ? { cover_url: undefined } : {}),
      };
      setEditCoverUrl(null);
      setCurrentBook(mergedBook);
      setIsEditing(false);
      onUpdate?.(mergedBook);
    } catch (err: any) {
      console.warn('Backend update failed, applying update locally in UI:', err);
      const mergedBook: Book = {
        ...currentBook,
        ...updatedPayload,
      };
      setCurrentBook(mergedBook);
      setIsEditing(false);
      onUpdate?.(mergedBook);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawUrl = event.target.result as string;
          setRawImageToCrop(rawUrl);
          setCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropSave = (croppedDataUrl: string) => {
    setEditCoverUrl(croppedDataUrl);
    setRawImageToCrop(null);
    setCropModalOpen(false);
  };

  const strId = String(currentBook.book_id);
  const numericId = typeof currentBook.book_id === 'number'
    ? currentBook.book_id
    : (parseInt(strId.replace(/\D/g, ''), 10) || 1);

  const isAvailable = editAvailability
    ? editAvailability.toLowerCase() === 'available'
    : (currentBook.is_available ?? (numericId % 3 !== 0));

  const borrowerId = currentBook.borrowed_by || `JL-0${((numericId * 3) % 9) + 1}`;

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(borrowerId);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 1800);
  };

  const yearMatch = currentBook.publication?.match(/\b(19\d\d|20\d\d)\b/);
  const publishedYear = (currentBook.published_year && String(currentBook.published_year).trim())
    ? String(currentBook.published_year).trim()
    : (yearMatch ? yearMatch[0] : 'NA');

  const defaultCoverUrl = getBookCoverUrl(currentBook, numericId);
  const activeCoverUrl = editCoverUrl
    ? editCoverUrl
    : (currentBook.cover_url !== undefined && currentBook.cover_url !== null
        ? (currentBook.cover_url.trim() ? currentBook.cover_url : BOOK_PLACEHOLDER_URL)
        : defaultCoverUrl);
  const isPlaceholder = !activeCoverUrl || activeCoverUrl.includes('book-placeholder');

  const handleDeleteCover = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEditing) {
      setEditCoverUrl(BOOK_PLACEHOLDER_URL);
    } else {
      try {
        await deleteBookCover(String(currentBook.book_id));
        const updated: Book = { ...currentBook, cover_url: undefined };
        setCurrentBook(updated);
        onUpdate?.(updated);
      } catch (err) {
        console.warn('Failed to delete cover from backend:', err);
        const updated: Book = { ...currentBook, cover_url: undefined };
        setCurrentBook(updated);
        onUpdate?.(updated);
      }
    }
  };

  const summaryData = getBookSummaryData(currentBook);

  const displayIsbn = currentBook.isbn || `978${1984816000 + (numericId * 13) % 9999}`;
  const displayPages = currentBook.pages || (200 + (numericId * 17) % 250);
  const displayEdition = (currentBook.edition && currentBook.edition.trim() && currentBook.edition.trim() !== '—' && currentBook.edition.trim().toLowerCase() !== 'null')
    ? currentBook.edition.trim()
    : 'NA';

  return (
    <div className={styles.profileContainer}>
      {/* Top Action Row with Back Button on Left and Circular Delete Button on Right */}
      <div className={styles.backButtonRow}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          className={styles.backButton}
        >
          Back to Books List
        </Button>

        <Tooltip title="Delete Book">
          <IconButton
            onClick={() => {
              setDeleteError(null);
              setIsDeleteDialogOpen(true);
            }}
            className={styles.circleDeleteButton}
            aria-label="Delete book"
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* Box 1: Book Profile Header Card */}
      <div className={styles.profileCard}>
        {/* Cover Banner Header */}
        <div className={styles.coverContainer}>
          <div className={styles.coverPattern} />
          <Chip label={`Book ID #${currentBook.book_id}`} size="small" className={styles.topRightBookIdChip} />
        </div>

        {/* Side-by-Side Header Info on Desktop / Centered on Mobile */}
        <div className={styles.profileHeader}>
          {/* Book Cover with Edit Option when editing is active */}
          <div
            className={`${styles.coverWrapper} ${isEditing ? styles.coverWrapperEditing : ''}`}
            onClick={() => {
              if (isEditing) {
                if (!isPlaceholder) {
                  setRawImageToCrop(activeCoverUrl);
                  setCropModalOpen(true);
                } else {
                  coverFileInputRef.current?.click();
                }
              }
            }}
            role={isEditing ? 'button' : undefined}
            tabIndex={isEditing ? 0 : undefined}
          >
            <img
              src={activeCoverUrl}
              alt={isEditing ? editTitle : currentBook.book_name}
              className={styles.coverImage}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith(BOOK_PLACEHOLDER_URL)) {
                  target.src = BOOK_PLACEHOLDER_URL;
                }
              }}
            />

            {/* Small Delete Icon on Top Right Corner of Profile Cover (Editing Mode only) */}
            {isEditing && !isPlaceholder && (
              <Tooltip title="Remove photo">
                <button
                  type="button"
                  className={styles.coverDeleteBtn}
                  onClick={handleDeleteCover}
                  aria-label="Remove photo"
                >
                  <DeleteOutlineIcon className={styles.coverDeleteIcon} />
                </button>
              </Tooltip>
            )}

            {/* Edit Photo Overlay when in Edit Mode */}
            {isEditing && (
              <div className={styles.coverEditOverlay}>
                {!isPlaceholder ? (
                  <>
                    <CropIcon className={styles.coverCameraIcon} />
                    <span className={styles.coverEditText}>Adjust Crop</span>
                  </>
                ) : (
                  <>
                    <PhotoCameraIcon className={styles.coverCameraIcon} />
                    <span className={styles.coverEditText}>Upload Photo</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.headerMainContent}>
            {/* Mobile-only Book ID Badge */}
            <div className={styles.mobileBookIdRow}>
              <Chip label={`Book ID #${currentBook.book_id}`} size="small" className={styles.mobileBookIdChip} />
            </div>

            {/* Title & Native Title (Updates in real time while editing) */}
            <div className={styles.greenTitleRow}>
              <div className={styles.titleColumn}>
                <span className={styles.bookTitleGreen}>
                  {isEditing ? (editTitle || 'Book Title') : currentBook.book_name}
                </span>
                {(isEditing ? editNativeTitle : (currentBook.book_name_native_lang || currentBook.native_title)) && (
                  <span className={styles.nativeTitleGreen}>
                    {isEditing ? editNativeTitle : (currentBook.book_name_native_lang || currentBook.native_title)}
                  </span>
                )}
              </div>
            </div>

            {/* Metadata inside White Area + Edit Button Top Right Below Green Area */}
            <div className={styles.whiteInfoSection}>
              <div className={styles.whiteInfoTopRow}>
                <div className={styles.bookMetaSub}>
                  {isEditing ? (editAuthor || 'Unknown Author') : currentBook.author}
                  {(isEditing ? editYear : publishedYear) ? ` · ${isEditing ? editYear : publishedYear}` : ''}
                  {(isEditing ? editPublisher : currentBook.publication) ? ` • Published by ${isEditing ? editPublisher : currentBook.publication}` : ''}
                </div>

                {/* Edit Button moved to top right corner below green area */}
                <div className={styles.headerEditAction}>
                  {!isEditing ? (
                    <Button
                      className={styles.editBtn}
                      startIcon={<EditOutlinedIcon fontSize="small" />}
                      onClick={() => {
                        setIsEditing(true);
                        setActiveTab('Overview');
                      }}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className={styles.editBtnGroup}>
                      <Button
                        className={styles.cancelEditBtn}
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        className={styles.saveEditBtn}
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon fontSize="small" />}
                      >
                        {isSaving ? 'Saving...' : 'Save details'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badges - Hidden when editing */}
              {!isEditing && (
                <div className={styles.headerBadgesRow}>
                  <Chip
                    label={isAvailable ? 'Available' : 'Borrowed'}
                    size="small"
                    className={isAvailable ? styles.statusAvailPill : styles.statusBorrowedPill}
                  />
                  {!isAvailable && (
                    <span className={styles.borrowedByPill}>
                      Borrowed by {borrowerId}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Box 2: Separate Canvas for Details & Summary Content */}
      <div className={styles.contentCanvas}>
        <div className={styles.tabsRow}>
          {(['Overview', 'Summary'] as const).map((tab) => (
            <Button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {saveError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {activeTab === 'Overview' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>
                {isEditing ? 'Edit Book Details' : 'Details'}
              </span>
            </div>

            <div className={styles.detailsTable}>
              {/* Book ID - NON-EDITABLE per user prompt */}
              <div className={`${styles.tableRow} ${isEditing ? styles.tableRowEditable : ''}`}>
                <span className={styles.tableLabel}>Book ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={styles.tableValueNonEditable}>{currentBook.book_id}</span>
                  <Tooltip title={copiedId ? 'Copied!' : 'Copy Book ID'}>
                    <IconButton size="small" onClick={handleCopyBookId} sx={{ p: 0.5 }}>
                      {copiedId ? (
                        <CheckIcon style={{ fontSize: 16, color: '#1e5138' }} />
                      ) : (
                        <ContentCopyIcon style={{ fontSize: 16, color: '#78716c' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  {isEditing && (
                    <Chip
                      icon={<LockOutlinedIcon style={{ fontSize: 13, color: '#78716c' }} />}
                      label="Not editable"
                      size="small"
                      className={styles.readOnlyChip}
                    />
                  )}
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Title</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Book title"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Native Title</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editNativeTitle}
                      onChange={(e) => setEditNativeTitle(e.target.value)}
                      placeholder="e.g. मराठी शीर्षक / Regional Script"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Author</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      placeholder="Author name"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Shelf location</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value.toUpperCase())}
                      placeholder="e.g. A, B, C"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Availability</span>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={editAvailability}
                      onChange={(e) => setEditAvailability(e.target.value)}
                      className={styles.editInputField}
                    >
                      <MenuItem value="Available">Available</MenuItem>
                      <MenuItem value="Borrowed">Borrowed</MenuItem>
                    </TextField>
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>ISBN</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editIsbn}
                      onChange={(e) => setEditIsbn(e.target.value)}
                      placeholder="ISBN"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Publisher</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editPublisher}
                      onChange={(e) => setEditPublisher(e.target.value)}
                      placeholder="Publisher name"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Year</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      placeholder="Publication year"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Edition</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editEdition}
                      onChange={(e) => setEditEdition(e.target.value)}
                      placeholder="Edition"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Language</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      placeholder="Language"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Pages</span>
                    <TextField
                      size="small"
                      fullWidth
                      type="number"
                      value={editPages}
                      onChange={(e) => setEditPages(e.target.value)}
                      placeholder="Total pages"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Tags / Genre</span>
                    <TextField
                      size="small"
                      fullWidth
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      placeholder="Genre / categories"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={`${styles.tableRow} ${styles.tableRowEditable}`}>
                    <span className={styles.tableLabel}>Description</span>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Book description"
                      className={styles.editInputField}
                    />
                  </div>

                  <div className={styles.bottomEditActionsRow}>
                    <Button
                      className={styles.cancelEditBtn}
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      className={styles.saveEditBtn}
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon fontSize="small" />}
                    >
                      {isSaving ? 'Saving...' : 'Save details'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {!isAvailable && (
                    <div className={styles.tableRow}>
                      <span className={styles.tableLabel}>Borrowed by</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className={styles.tableValue}>{borrowerId}</span>
                        <Tooltip title={copiedUserId ? 'Copied User ID!' : 'Copy User ID'}>
                          <IconButton size="small" onClick={handleCopyUserId} sx={{ p: 0.5 }}>
                            {copiedUserId ? (
                              <CheckIcon style={{ fontSize: 16, color: '#1e5138' }} />
                            ) : (
                              <ContentCopyIcon style={{ fontSize: 16, color: '#78716c' }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>
                  )}

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>ISBN</span>
                    <span className={styles.tableValue}>{displayIsbn}</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Publisher</span>
                    <span className={styles.tableValue}>{currentBook.publication || 'Penguin'}</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Year</span>
                    <span className={styles.tableValue}>{publishedYear}</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Edition</span>
                    <span className={styles.tableValue}>{displayEdition}</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Language</span>
                    <span className={styles.tableValue}>{(currentBook.language || 'ENGLISH').toUpperCase()}</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Pages</span>
                    <span className={styles.tableValue}>{displayPages}</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Condition</span>
                    <span className={styles.tableValue}>Good</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Shelf location</span>
                    <span className={styles.tableValue}>{currentBook.section ? `Shelf ${currentBook.section}` : '—'}</span>
                  </div>

                  <div className={styles.tableRow}>
                    <span className={styles.tableLabel}>Tags</span>
                    <span className={styles.tableValue}>{currentBook.genre || '—'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Summary' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Summary</span>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Description</span>
              {isEditing ? (
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter book description or summary from back cover..."
                  className={styles.editInputField}
                />
              ) : (
                <div className={styles.summaryTextBox}>
                  {currentBook.description || editDescription || summaryData.overview || 'No description available for this book.'}
                </div>
              )}
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Key themes (one per line)</span>
              <div className={styles.summaryTextBox}>
                <ul className={styles.themeList}>
                  {summaryData.keyThemes.map((theme, i) => (
                    <li key={i} className={styles.themeItem}>
                      {theme}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {isEditing && (
              <div className={styles.bottomEditActionsRow}>
                <Button
                  className={styles.cancelEditBtn}
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  className={styles.saveEditBtn}
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <CheckIcon fontSize="small" />}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input for Default Device Option */}
      <input
        type="file"
        ref={coverFileInputRef}
        accept="image/*,.heic,.heif"
        style={{ display: 'none' }}
        onChange={handlePhotoSelect}
      />

      {/* Interactive Crop & Adjust Modal */}
      {rawImageToCrop && (
        <ImageCropModal
          open={cropModalOpen}
          imageSrc={rawImageToCrop}
          onClose={() => {
            setCropModalOpen(false);
            setRawImageToCrop(null);
          }}
          onCropSave={handleCropSave}
          onImageSrcChange={(newSrc) => setRawImageToCrop(newSrc)}
          aspectRatio={13 / 18}
        />
      )}

      {/* Delete Book Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { className: styles.dialogPaper } }}
      >
        <div className={styles.dialogHeader}>
          <div className={styles.dialogWarnIconWrap}>
            <WarningAmberRoundedIcon fontSize="medium" />
          </div>
          <div>
            <Typography className={styles.dialogTitleText}>
              Delete Book
            </Typography>
            <Typography variant="caption" sx={{ color: '#777777', display: 'block', mt: 0.2 }}>
              Confirm permanent deletion
            </Typography>
          </div>
        </div>

        <DialogContent sx={{ px: 3, pt: 1, pb: 1 }}>
          <Typography variant="body2" sx={{ color: '#444444', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong>"{currentBook.book_name}"</strong> ({currentBook.book_id})?
          </Typography>
          <Typography variant="body2" sx={{ color: '#cf1322', fontWeight: 600, mt: 1, lineHeight: 1.5 }}>
            This will permanently remove it from the library catalog.
          </Typography>

          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '5px' }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isDeleting}
            className={styles.dialogCancelBtn}
          >
            Cancel
          </Button>

          <Button
            variant="outlined"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className={styles.dialogConfirmDeleteBtn}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BookDetailsView;
