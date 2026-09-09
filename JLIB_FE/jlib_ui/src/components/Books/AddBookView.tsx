import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CollectionsIcon from '@mui/icons-material/Collections';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { BackButton } from '../common/BackButton';
import { AnimatedDots } from '../common/AnimatedDots';
import { fetchBookDetailsByIsbn, fetchBookDetailsByPhoto, formatLanguageName, getNextBookId, cleanDiacritics, determineNativeTitle, iastToDevanagari } from '../../services/bookService';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import styles from './AddBookView.module.css';

interface AddBookViewProps {
  onBack: () => void;
  onAddBook?: (newBook: any) => void;
}

type TabType = 'isbn' | 'photo' | 'manual';

export const AddBookView: React.FC<AddBookViewProps> = ({
  onBack,
  onAddBook,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('photo');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [hasIsbnFound, setHasIsbnFound] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Theme & Responsive Media Query (Mobile & Tablet: Take Photo / Upload Image buttons; Desktop: Drag & Drop)
  const theme = useTheme();
  const isTouchOrTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Form State
  const [shelfNo, setShelfNo] = useState('');
  const [bookId, setBookId] = useState('');
  const [isFetchingBookId, setIsFetchingBookId] = useState(false);
  const [title, setTitle] = useState('');
  const [nativeTitle, setNativeTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [pages, setPages] = useState('');
  const [language, setLanguage] = useState('');
  const [edition, setEdition] = useState('');
  const [status, setStatus] = useState('Owned');
  const [readingStatus, setReadingStatus] = useState('To read');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');

  const executeLookupForIsbn = async (targetIsbn: string) => {
    if (!targetIsbn.trim()) return;
    setIsLookingUp(true);
    setLookupError(null);

    try {
      const details = await fetchBookDetailsByIsbn(targetIsbn);
      if (details && (details.title || details.authors)) {
        const langName = details.language ? formatLanguageName(details.language) : 'English';
        const cleanTitle = cleanDiacritics(details.title || '');
        const computedNative = determineNativeTitle(details.title || '', details.nativeTitle || '', langName);

        if (cleanTitle) setTitle(cleanTitle);
        setNativeTitle(computedNative);
        if (details.authors) setAuthors(cleanDiacritics(details.authors));
        if (details.publisher) setPublisher(cleanDiacritics(details.publisher));
        if (details.publishedDate) setYear(details.publishedDate);
        if (details.pageCount) setPages(details.pageCount);
        setLanguage(langName);
        if (details.edition) setEdition(details.edition);
        if (details.categories) setTags(details.categories);
        if (details.description) setDescription(cleanDiacritics(details.description));
        setHasIsbnFound(true);
        setIsFormEditable(false);
      } else {
        setHasIsbnFound(false);
        setIsFormEditable(false);
        setLookupError('No book details found for this ISBN.');
      }
    } catch (err) {
      setHasIsbnFound(false);
      setIsFormEditable(false);
      setLookupError('Failed to fetch details.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleIsbnLookup = () => {
    executeLookupForIsbn(isbn);
  };

  const handleScanSuccess = (scannedIsbn: string) => {
    setIsbn(scannedIsbn);
    executeLookupForIsbn(scannedIsbn);
  };

  // Automatically compute the next sequential Book ID when Shelf No changes (e.g. shelf A -> A-1, A-2, etc.)
  useEffect(() => {
    const trimmedShelf = shelfNo.trim().toUpperCase();
    if (!trimmedShelf) {
      setBookId('');
      setIsFetchingBookId(false);
      return;
    }

    const cleanPrefix = trimmedShelf.endsWith('-') ? trimmedShelf : `${trimmedShelf}-`;
    let isMounted = true;
    setIsFetchingBookId(true);

    const timer = setTimeout(async () => {
      try {
        const nextId = await getNextBookId(cleanPrefix);
        if (isMounted) {
          setBookId(nextId);
        }
      } catch (err) {
        if (isMounted) {
          setBookId(`${cleanPrefix}1`);
        }
      } finally {
        if (isMounted) {
          setIsFetchingBookId(false);
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [shelfNo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shelfNo.trim()) return;

    let finalBookId = bookId;
    const upperShelf = shelfNo.trim().toUpperCase();
    if (!finalBookId) {
      const cleanPrefix = upperShelf.endsWith('-') ? upperShelf : `${upperShelf}-`;
      finalBookId = await getNextBookId(cleanPrefix);
    }

    const newBookData = {
      book_id: finalBookId,
      shelf_no: upperShelf,
      section: upperShelf,
      book_name: title,
      native_title: nativeTitle,
      book_name_native_lang: nativeTitle,
      author: authors || 'Unknown Author',

      genre: tags ? tags.split(',')[0].trim() : 'General',
      publication: publisher || 'Self Published',
      description: description,
      is_available: status === 'Owned',
      status: status,
      isbn,
      year,
      pages,
      language,
      edition,
      reading_status: readingStatus,
    };
    console.log("newBookData", newBookData);
    if (onAddBook) {
      onAddBook(newBookData);
    }
    onBack();
  };

  // Photo tab State (Front and Back cover)
  const [photoTarget, setPhotoTarget] = useState<'front' | 'back' | null>(null);
  const frontGalleryInputRef = useRef<HTMLInputElement>(null);
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const backGalleryInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);

  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string | null>(null);
  const [isFrontDragActive, setIsFrontDragActive] = useState(false);

  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [backPhotoUrl, setBackPhotoUrl] = useState<string | null>(null);
  const [isBackDragActive, setIsBackDragActive] = useState(false);

  const [isExtractingPhoto, setIsExtractingPhoto] = useState(false);
  const [photoExtractError, setPhotoExtractError] = useState<string | null>(null);
  const [hasPhotoFound, setHasPhotoFound] = useState(false);

  const handlePhotoExtract = async () => {
    if (!frontPhoto && !backPhoto) return;
    setIsExtractingPhoto(true);
    setPhotoExtractError(null);

    try {
      const details = await fetchBookDetailsByPhoto(frontPhoto, backPhoto);
      if (details && (details.title || details.authors)) {
        const langName = details.language ? formatLanguageName(details.language) : 'English';
        const cleanTitle = cleanDiacritics(details.title || '');
        const computedNative = determineNativeTitle(details.title || '', details.nativeTitle || '', langName);

        if (cleanTitle) setTitle(cleanTitle);
        setNativeTitle(computedNative);
        if (details.authors) setAuthors(cleanDiacritics(details.authors));
        if (details.publisher) setPublisher(cleanDiacritics(details.publisher));
        if (details.publishedDate) setYear(details.publishedDate);
        if (details.pageCount) setPages(details.pageCount);
        setLanguage(langName);
        if (details.edition) setEdition(details.edition);
        if (details.categories) setTags(details.categories);
        if (details.description) setDescription(cleanDiacritics(details.description));
        if (details.isbn) setIsbn(details.isbn);
        setHasPhotoFound(true);
      } else {
        setHasPhotoFound(false);
        setPhotoExtractError('Could not extract details from the uploaded photo. Please enter details manually.');
      }
    } catch (err) {
      setHasPhotoFound(false);
      setPhotoExtractError('Failed to process image with Gemini AI.');
    } finally {
      setIsExtractingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    setFrontPhoto(null);
    setFrontPhotoUrl(null);
    setBackPhoto(null);
    setBackPhotoUrl(null);
    setPhotoExtractError(null);
    setHasPhotoFound(false);
  };

  const handleFrontPhotoSelect = (file: File) => {
    setFrontPhoto(file);
    setHasPhotoFound(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFrontPhotoUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackPhotoSelect = (file: File) => {
    setBackPhoto(file);
    setHasPhotoFound(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBackPhotoUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const shouldShowDetailsForm =
    activeTab === 'manual' ||
    (activeTab === 'isbn' && hasIsbnFound) ||
    (activeTab === 'photo' && hasPhotoFound);

  // Mandatory fields validation and tooltip for Add to library button
  const missingMandatoryFields: string[] = [];
  if (!shelfNo.trim()) {
    missingMandatoryFields.push('Shelf No');
  }
  if (!title.trim()) {
    missingMandatoryFields.push('Title');
  }

  const isSubmitDisabled = missingMandatoryFields.length > 0 || isFetchingBookId;

  const submitTooltipText =
    missingMandatoryFields.length > 0
      ? `Please enter mandatory field${missingMandatoryFields.length > 1 ? 's' : ''}: ${missingMandatoryFields.join(', ')}`
      : isFetchingBookId
        ? 'Calculating next Book ID...'
        : '';

  return (
    <Box className={styles.container}>
      {/* Top Header Row with Reusable Back Button */}
      <Box className={styles.headerRow}>
        <BackButton label="Back to Collection" onClick={onBack} />
      </Box>

      {/* Top Header Card with Title and Pill Tabs */}
      <Box className={styles.topHeaderCard}>
        <Box className={styles.headerSection}>
          <Typography variant="h4" className={styles.headerTitle}>
            Add a book
          </Typography>
          <Typography variant="body1" className={styles.headerSubtitle}>
            Scan, photograph or type it in.
          </Typography>
        </Box>

        {/* Navigation Tabs Bar */}
        <Box className={styles.tabsRow}>
          <Button
            disableRipple
            className={`${styles.tabBtn} ${activeTab === 'isbn' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('isbn')}
            startIcon={(!isTouchOrTablet || activeTab === 'isbn') ? <QrCodeScannerIcon fontSize="small" /> : undefined}
          >
            {(!isTouchOrTablet || activeTab === 'isbn') ? 'ISBN' : <QrCodeScannerIcon fontSize="small" />}
          </Button>

          <Button
            disableRipple
            className={`${styles.tabBtn} ${activeTab === 'photo' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('photo')}
            startIcon={(!isTouchOrTablet || activeTab === 'photo') ? <PhotoCameraIcon fontSize="small" /> : undefined}
          >
            {(!isTouchOrTablet || activeTab === 'photo') ? 'Photo' : <PhotoCameraIcon fontSize="small" />}
          </Button>

          <Button
            disableRipple
            className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('manual')}
            startIcon={(!isTouchOrTablet || activeTab === 'manual') ? <EditNoteIcon fontSize="small" /> : undefined}
          >
            {(!isTouchOrTablet || activeTab === 'manual') ? 'Manual' : <EditNoteIcon fontSize="small" />}
          </Button>
        </Box>
      </Box>

      {/* ISBN Box Section */}
      {activeTab === 'isbn' && (
        <Box className={styles.isbnBoxCard}>
          <Button
            variant="contained"
            startIcon={<PhotoCameraIcon />}
            onClick={() => setIsScannerOpen(true)}
            className={styles.scanBarcodeBtn}
          >
            Scan barcode with camera
          </Button>

          <Box className={styles.fieldGroup}>
            <Typography className={styles.fieldLabel}>ISBN-10 or ISBN-13</Typography>
            <Box className={styles.lookupRow}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="9780141036144"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className={styles.inputField}
              />
              <Button
                variant="contained"
                disabled={isbn.trim().length < 2 || isLookingUp}
                onClick={handleIsbnLookup}
                className={styles.lookupBtn}
              >
                {isLookingUp ? (
                  <span>Searching<AnimatedDots /></span>
                ) : (
                  'Look up'
                )}
              </Button>
            </Box>
            {lookupError && (
              <Typography style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: 8 }}>
                {lookupError}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Photo Box Section (Front and Back cover) */}
      {activeTab === 'photo' && (
        <Box className={styles.photoBoxCard}>
          <Typography variant="body2" className={styles.photoBoxNotice}>
            Photograph the front cover and back cover of the book. The photos are saved with the book.
          </Typography>

          <Grid container spacing={2}>
            {/* Front Cover Box */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" className={styles.photoSubLabel}>
                Front Cover
              </Typography>
              <Box
                className={`${styles.dragDropArea} ${isFrontDragActive ? styles.dragActive : ''} ${frontPhoto ? styles.uploadedArea : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsFrontDragActive(true); }}
                onDragLeave={() => setIsFrontDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsFrontDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFrontPhotoSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => setPhotoTarget('front')}
              >
                {frontPhotoUrl ? (
                  <Box className={styles.uploadedStateContainer}>
                    <img src={frontPhotoUrl} alt="Front cover preview" className={styles.photoPreviewThumb} />
                    <Box className={styles.uploadedMetaBox}>
                      <Typography className={styles.uploadedFileName}>
                        ✓ Front cover attached
                      </Typography>
                      <Typography className={styles.dragDropText}>
                        Click or drop to replace
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <CloudUploadOutlinedIcon className={styles.uploadCloudIcon} />
                    <Typography className={styles.dragDropText}>
                      Upload Front Cover
                    </Typography>
                    <Typography className={styles.fileMetaText}>
                      Drag & drop or <span className={styles.browseLink}>Browse</span>
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>

            {/* Back Cover Box */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" className={styles.photoSubLabel}>
                Back Cover
              </Typography>
              <Box
                className={`${styles.dragDropArea} ${isBackDragActive ? styles.dragActive : ''} ${backPhoto ? styles.uploadedArea : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsBackDragActive(true); }}
                onDragLeave={() => setIsBackDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsBackDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleBackPhotoSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => setPhotoTarget('back')}
              >
                {backPhotoUrl ? (
                  <Box className={styles.uploadedStateContainer}>
                    <img src={backPhotoUrl} alt="Back cover preview" className={styles.photoPreviewThumb} />
                    <Box className={styles.uploadedMetaBox}>
                      <Typography className={styles.uploadedFileName}>
                        ✓ Back cover attached
                      </Typography>
                      <Typography className={styles.dragDropText}>
                        Click or drop to replace
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <CloudUploadOutlinedIcon className={styles.uploadCloudIcon} />
                    <Typography className={styles.dragDropText}>
                      Upload Back Cover
                    </Typography>
                    <Typography className={styles.fileMetaText}>
                      Drag & drop or <span className={styles.browseLink}>Browse</span>
                    </Typography>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Hidden File Inputs for Camera and Gallery */}
          <input
            ref={frontGalleryInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFrontPhotoSelect(e.target.files[0])}
          />
          <input
            ref={frontCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFrontPhotoSelect(e.target.files[0])}
          />
          <input
            ref={backGalleryInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleBackPhotoSelect(e.target.files[0])}
          />
          <input
            ref={backCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleBackPhotoSelect(e.target.files[0])}
          />

          {/* Action Row: Auto-fill button & Cancel button when photos attached */}
          {(frontPhoto || backPhoto) && (
            <Box sx={{ marginTop: 2.5, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 1.75 }}>
                <Button
                  variant="contained"
                  disabled={isExtractingPhoto}
                  onClick={handlePhotoExtract}
                  className={styles.extractPhotoBtn}
                  sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}
                >
                  {isExtractingPhoto ? (
                    <span>Extracting book details with Gemini<AnimatedDots /></span>
                  ) : (
                    'Auto-fill book details from photo'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCancelPhoto}
                  className={styles.cancelButton}
                  sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancel
                </Button>
              </Box>

              {photoExtractError && (
                <Typography style={{ color: '#d32f2f', fontSize: '0.85rem', marginTop: 4 }}>
                  {photoExtractError}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Form Section - Shown when book data is available or manual tab selected */}
      {shouldShowDetailsForm && (
        <form id="add-book-form" onSubmit={handleSubmit} className={styles.formSection}>
          <Box className={styles.sectionHeaderRow}>
            <Typography variant="h6" className={styles.sectionHeading}>
              Review and save
            </Typography>

            {hasIsbnFound && activeTab === 'isbn' && (
              <Button
                type="button"
                variant="outlined"
                onClick={() => setIsFormEditable((prev) => !prev)}
                className={styles.editDetailsBtn}
              >
                {isFormEditable ? 'Lock details' : 'Edit details'}
              </Button>
            )}
          </Box>

          {/* Shelf No & Auto-generated Book ID */}
          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>
                  Shelf No <span className={styles.requiredStar}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder='A/B/C'
                  value={shelfNo}
                  onChange={(e) => setShelfNo(e.target.value.toUpperCase())}
                  required
                  slotProps={{
                    htmlInput: {
                      style: { textTransform: 'uppercase', fontWeight: 600 },
                    },
                  }}
                  className={styles.inputField}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>
                  Book ID (Auto-assigned)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={
                    shelfNo.trim()
                      ? (isFetchingBookId ? 'Finding next ID...' : bookId)
                      : ''
                  }
                  disabled
                  slotProps={{
                    htmlInput: {
                      style: { fontWeight: 700, letterSpacing: '0.5px' },
                    },
                  }}
                  className={styles.inputField}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Title */}
          <Box className={styles.fieldGroup}>
            <Typography className={styles.fieldLabel}>
              Title <span className={styles.requiredStar}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              value={title}
              disabled={hasIsbnFound && !isFormEditable}
              onChange={(e) => {
                const clean = cleanDiacritics(e.target.value);
                setTitle(clean);
                if (language.toLowerCase() !== 'marathi') {
                  setNativeTitle(clean);
                }
              }}
              required
              className={styles.inputField}
            />
          </Box>

          {/* Native Title (e.g. Marathi / Regional Script) */}
          <Box className={styles.fieldGroup}>
            <Typography className={styles.fieldLabel}>
              Title in native language
            </Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="e.g. सॉल्स्टिस ॲट पानिपत"
              value={nativeTitle}
              disabled={hasIsbnFound && !isFormEditable}
              onChange={(e) => setNativeTitle(e.target.value)}
              className={styles.inputField}
            />
          </Box>

          {/* Authors */}
          <Box className={styles.fieldGroup}>
            <Typography className={styles.fieldLabel}>Authors (comma separated)</Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="Jane Doe, John Roe"
              value={authors}
              disabled={hasIsbnFound && !isFormEditable}
              onChange={(e) => setAuthors(cleanDiacritics(e.target.value))}
              className={styles.inputField}
            />
          </Box>

          {/* Grid 2 Columns */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>ISBN</Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={isbn}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setIsbn(e.target.value)}
                  className={styles.inputField}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Publisher</Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={publisher}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setPublisher(cleanDiacritics(e.target.value))}
                  className={styles.inputField}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Year</Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={year}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setYear(e.target.value)}
                  className={styles.inputField}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Pages</Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={pages}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setPages(e.target.value)}
                  className={styles.inputField}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Language</Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={language}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => {
                    const val = e.target.value;
                    const formatted = val ? formatLanguageName(val) : '';
                    setLanguage(formatted);
                    if (formatted.toLowerCase() === 'marathi') {
                      if (!nativeTitle || nativeTitle === title) {
                        setNativeTitle(iastToDevanagari(title));
                      }
                    } else if (formatted) {
                      setNativeTitle(title);
                    }
                  }}
                  className={styles.inputField}
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Edition</Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={edition}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setEdition(e.target.value)}
                  className={styles.inputField}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Status</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={status}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setStatus(e.target.value)}
                  className={styles.inputField}
                >
                  <MenuItem value="Owned">Owned</MenuItem>
                  <MenuItem value="Wishlist">Wishlist</MenuItem>
                  <MenuItem value="Borrowed">Borrowed</MenuItem>
                </TextField>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Reading status</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  variant="outlined"
                  value={readingStatus}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setReadingStatus(e.target.value)}
                  className={styles.inputField}
                >
                  <MenuItem value="To read">To read</MenuItem>
                  <MenuItem value="Currently reading">Currently reading</MenuItem>
                  <MenuItem value="Read">Read</MenuItem>
                </TextField>
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box className={styles.fieldGroup}>
                <Typography className={styles.fieldLabel}>Description</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  variant="outlined"
                  value={description}
                  disabled={hasIsbnFound && !isFormEditable}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.inputField}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Actions Row: Add to library & Red Cancel Button */}
          <Box className={styles.actionButtonsRow} sx={{ flexDirection: { xs: 'column', sm: 'row' }, width: '100%', gap: 1.75 }}>
            <Tooltip
              title={isSubmitDisabled ? submitTooltipText : ''}
              arrow
              placement="top"
              disableHoverListener={!isSubmitDisabled}
              slotProps={{
                tooltip: {
                  sx: {
                    fontSize: '0.85rem',
                    py: 0.75,
                    px: 1.5,
                    borderRadius: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                  },
                },
              }}
            >
              <span className={styles.submitButtonWrapper}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitDisabled}
                  className={styles.submitButton}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Add to library
                </Button>
              </span>
            </Tooltip>

            <Button
              type="button"
              variant="outlined"
              onClick={onBack}
              className={styles.cancelButton}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Cancel
            </Button>
          </Box>
        </form>
      )}

      {/* Photo Source Choice Dialog (Camera vs Gallery) */}
      <Dialog
        open={Boolean(photoTarget)}
        onClose={() => setPhotoTarget(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '20px',
              padding: '12px 8px 16px 8px',
              maxWidth: 400,
              width: '90%',
              backgroundColor: '#ffffff',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            fontWeight: 700,
            color: 'var(--primary-forest, #1b4332)',
            fontFamily: 'var(--font-serif)',
            fontSize: '1.25rem',
            pb: 1,
          }}
        >
          {photoTarget === 'front' ? 'Upload Front Cover' : 'Upload Back Cover'}
          <IconButton onClick={() => setPhotoTarget(null)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, pb: 1 }}>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2.5 }}>
            Choose how you would like to attach the {photoTarget === 'front' ? 'front' : 'back'} cover photo:
          </Typography>

          <List disablePadding>
            <ListItemButton
              onClick={() => {
                const target = photoTarget;
                setPhotoTarget(null);
                setTimeout(() => {
                  if (target === 'front') {
                    frontCameraInputRef.current?.click();
                  } else if (target === 'back') {
                    backCameraInputRef.current?.click();
                  }
                }, 100);
              }}
              sx={{
                borderRadius: '12px',
                border: '1.5px solid var(--border-parchment, #e8ded0)',
                mb: 1.5,
                p: '14px 16px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f4efe6',
                  borderColor: 'var(--primary-forest, #1b4332)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'var(--primary-forest, #1b4332)', minWidth: 44 }}>
                <PhotoCameraIcon fontSize="medium" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Take a photo</Typography>}
                secondary={<Typography sx={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Use camera to capture cover</Typography>}
              />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                const target = photoTarget;
                setPhotoTarget(null);
                setTimeout(() => {
                  if (target === 'front') {
                    frontGalleryInputRef.current?.click();
                  } else if (target === 'back') {
                    backGalleryInputRef.current?.click();
                  }
                }, 100);
              }}
              sx={{
                borderRadius: '12px',
                border: '1.5px solid var(--border-parchment, #e8ded0)',
                p: '14px 16px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f4efe6',
                  borderColor: 'var(--primary-forest, #1b4332)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'var(--primary-forest, #1b4332)', minWidth: 44 }}>
                <CollectionsIcon fontSize="medium" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Upload from gallery</Typography>}
                secondary={<Typography sx={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select photo from library</Typography>}
              />
            </ListItemButton>
          </List>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </Box>
  );
};
