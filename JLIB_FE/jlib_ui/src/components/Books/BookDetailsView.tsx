import React, { useState } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import { deleteBook } from '../../services/bookService';
import styles from './BookDetailsView.module.css';

interface BookDetailsViewProps {
  book: Book;
  onBack: () => void;
  onDelete?: (bookId: string | number) => void;
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

  return BOOK_PLACEHOLDER_URL;
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

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({ book, onBack, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Summary'>('Overview');
  const [reflection, setReflection] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteBook(String(book.book_id));
      setIsDeleteDialogOpen(false);
      if (onDelete) {
        onDelete(book.book_id);
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
    navigator.clipboard.writeText(String(book.book_id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const strId = String(book.book_id);
  const numericId = typeof book.book_id === 'number'
    ? book.book_id
    : (parseInt(strId.replace(/\D/g, ''), 10) || 1);

  const isAvailable = book.availability_status
    ? book.availability_status.toLowerCase() === 'available'
    : (book.is_available ?? (numericId % 3 !== 0));

  const borrowerId = book.borrowed_by || `JL-0${((numericId * 3) % 9) + 1}`;

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(borrowerId);
    setCopiedUserId(true);
    setTimeout(() => setCopiedUserId(false), 1800);
  };

  const yearMatch = book.publication?.match(/\b(19\d\d|20\d\d)\b/);
  const publishedYear = (book.published_year && String(book.published_year).trim())
    ? String(book.published_year).trim()
    : (yearMatch ? yearMatch[0] : 'NA');
  const coverUrl = getBookCoverUrl(book, numericId);
  const summaryData = getBookSummaryData(book);

  const displayIsbn = book.isbn || `978${1984816000 + (numericId * 13) % 9999}`;
  const displayPages = book.pages || (200 + (numericId * 17) % 250);
  const displayEdition = (book.edition && book.edition.trim() && book.edition.trim() !== '—' && book.edition.trim().toLowerCase() !== 'null')
    ? book.edition.trim()
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
          <Chip label={`Book ID #${book.book_id}`} size="small" className={styles.topRightBookIdChip} />
        </div>

        {/* Side-by-Side Header Info on Desktop / Centered on Mobile */}
        <div className={styles.profileHeader}>
          <div className={styles.coverWrapper}>
            <img
              src={coverUrl}
              alt={book.book_name}
              className={styles.coverImage}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith(BOOK_PLACEHOLDER_URL)) {
                  target.src = BOOK_PLACEHOLDER_URL;
                }
              }}
            />
          </div>

          <div className={styles.headerMainContent}>
            {/* Mobile-only Book ID Badge */}
            <div className={styles.mobileBookIdRow}>
              <Chip label={`Book ID #${book.book_id}`} size="small" className={styles.mobileBookIdChip} />
            </div>

            {/* Title & Native Title */}
            <div className={styles.greenTitleRow}>
              <div className={styles.titleColumn}>
                <span className={styles.bookTitleGreen}>{book.book_name}</span>
                {(book.book_name_native_lang || book.native_title) && (
                  <span className={styles.nativeTitleGreen}>
                    {book.book_name_native_lang || book.native_title}
                  </span>
                )}
              </div>

            </div>

            {/* Metadata inside White Area */}
            <div className={styles.whiteInfoSection}>
              <div className={styles.bookMetaSub}>
                {book.author}{publishedYear ? ` · ${publishedYear}` : ''}
                {book.publication ? ` • Published by ${book.publication}` : ''}
              </div>
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

        {activeTab === 'Overview' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Details</span>
              <Button className={styles.editBtn} startIcon={<EditOutlinedIcon fontSize="small" />}>
                Edit
              </Button>
            </div>

            <div className={styles.detailsTable}>
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Book ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className={styles.tableValue}>{book.book_id}</span>
                  <Tooltip title={copiedId ? 'Copied!' : 'Copy Book ID'}>
                    <IconButton size="small" onClick={handleCopyBookId} sx={{ p: 0.5 }}>
                      {copiedId ? (
                        <CheckIcon style={{ fontSize: 16, color: '#1e5138' }} />
                      ) : (
                        <ContentCopyIcon style={{ fontSize: 16, color: '#78716c' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

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
                <span className={styles.tableValue}>{book.publication || 'Penguin'}</span>
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
                <span className={styles.tableValue}>{(book.language || 'ENGLISH').toUpperCase()}</span>
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
                <span className={styles.tableValue}>{book.section ? `Shelf ${book.section}` : '—'}</span>
              </div>

              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Tags</span>
                <span className={styles.tableValue}>{book.genre || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Summary' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Summary</span>
              <Button className={styles.genSummaryBtn} startIcon={<AutoAwesomeIcon fontSize="small" />}>
                Generate summary draft
              </Button>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Overview</span>
              <div className={styles.summaryTextBox}>{summaryData.overview}</div>
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

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Who should read this</span>
              <div className={styles.summaryTextBox}>{summaryData.whoShouldRead}</div>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Your reflections</span>
              <textarea
                className={styles.reflectionTextarea}
                placeholder="Add your personal thoughts, key quotes, or reading reflections..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

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

        <DialogContent className={styles.dialogContent}>
          <Typography className={styles.dialogDescription}>
            Are you sure you want to delete this book? This will permanently remove it from the library collection and database.
          </Typography>

          {/* Book Details Summary Card */}
          <div className={styles.dialogBookCard}>
            <div className={styles.dialogBookRow}>
              <span className={styles.dialogBookName}>{book.book_name}</span>
              <Chip label={`ID #${book.book_id}`} size="small" className={styles.dialogBookIdBadge} />
            </div>
            {(book.book_name_native_lang || book.native_title) && (
              <span className={styles.dialogBookNativeTitle}>
                {book.book_name_native_lang || book.native_title}
              </span>
            )}
            <div className={styles.dialogBookAuthor}>
              Author: <strong>{book.author || 'Unknown'}</strong>
            </div>
            <div className={styles.dialogBookExtra}>
              {book.genre && <span>Genre: <strong>{book.genre}</strong></span>}
              {book.section && <span>Section: <strong>{book.section}</strong></span>}
            </div>
          </div>

          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions className={styles.dialogActions}>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isDeleting}
            className={styles.dialogCancelBtn}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            className={styles.dialogConfirmDeleteBtn}
          >
            {isDeleting ? 'Deleting...' : 'Delete Book'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BookDetailsView;

