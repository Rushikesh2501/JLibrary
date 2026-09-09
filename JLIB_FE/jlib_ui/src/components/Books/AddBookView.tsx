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
  Tooltip,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CropIcon from '@mui/icons-material/Crop';
import { ImageCropModal } from '../common/ImageCropModal';
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

  // Book Profile Photo & Crop State (strictly for Front Cover only)
  const [usePhotoForProfile, setUsePhotoForProfile] = useState(false);
  const [croppedCoverUrl, setCroppedCoverUrl] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [isSubmittingOnCrop, setIsSubmittingOnCrop] = useState(false);

  const saveBookWithCover = async (coverUrlToUse?: string | null) => {
    if (!title.trim() || !shelfNo.trim()) return;

    let finalBookId = bookId;
    const upperShelf = shelfNo.trim().toUpperCase();
    if (!finalBookId) {
      const cleanPrefix = upperShelf.endsWith('-') ? upperShelf : `${upperShelf}-`;
      finalBookId = await getNextBookId(cleanPrefix);
    }

    const finalCover = coverUrlToUse ?? (usePhotoForProfile && frontPhotoUrl ? (croppedCoverUrl || frontPhotoUrl) : null);

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
      ...(finalCover ? { cover_url: finalCover } : {}),
    };
    console.log("newBookData", newBookData);
    if (onAddBook) {
      onAddBook(newBookData);
    }
    onBack();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !shelfNo.trim()) return;

    // If user checked "use front cover for book profile" and hasn't cropped it yet, open the crop tool before saving
    if (usePhotoForProfile && frontPhotoUrl && !croppedCoverUrl) {
      setIsSubmittingOnCrop(true);
      setCropModalOpen(true);
      return;
    }

    await saveBookWithCover(usePhotoForProfile && frontPhotoUrl ? (croppedCoverUrl || frontPhotoUrl) : null);
  };

  const handleCropSave = async (croppedDataUrl: string) => {
    setCroppedCoverUrl(croppedDataUrl);
    setCropModalOpen(false);
    if (isSubmittingOnCrop) {
      setIsSubmittingOnCrop(false);
      await saveBookWithCover(croppedDataUrl);
    }
  };

  const handleCropClose = () => {
    setCropModalOpen(false);
    setIsSubmittingOnCrop(false);
  };

  // Photo tab State (Front and Back cover - Default Native File Inputs)
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

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
    setUsePhotoForProfile(false);
    setCroppedCoverUrl(null);
    setIsSubmittingOnCrop(false);
  };

  const handleFrontPhotoSelect = (file: File) => {
    setFrontPhoto(file);
    setHasPhotoFound(false);
    setUsePhotoForProfile(true);
    setCroppedCoverUrl(null);
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
                onClick={() => frontFileInputRef.current?.click()}
              >
                {frontPhotoUrl ? (
                  <Box className={styles.uploadedStateContainer}>
                    <img
                      src={croppedCoverUrl || frontPhotoUrl}
                      alt="Front cover preview"
                      className={styles.photoPreviewThumb}
                    />
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

              {/* Option to use Front Cover photo for book profile - Mobile view only (below front cover drag area) */}
              {frontPhoto && (
                <Box
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    flexDirection: 'column',
                    width: '100%',
                    mt: 1.5,
                    gap: 1.25,
                    p: 1.5,
                    borderRadius: '12px',
                    backgroundColor: '#fbf8f2',
                    border: '1px solid var(--border-parchment, #e8ded0)',
                    boxSizing: 'border-box',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={usePhotoForProfile}
                        onChange={(e) => setUsePhotoForProfile(e.target.checked)}
                        sx={{
                          color: 'var(--primary-forest, #1b4332)',
                          '&.Mui-checked': { color: 'var(--primary-forest, #1b4332)' },
                          p: 0.5,
                          mr: 0.5,
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--primary-forest, #1b4332)', lineHeight: 1.3 }}>
                        Use this front cover for book profile
                      </Typography>
                    }
                    sx={{ m: 0, width: '100%', alignItems: 'center' }}
                  />

                  {usePhotoForProfile && (
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<CropIcon fontSize="small" />}
                      onClick={() => {
                        setIsSubmittingOnCrop(false);
                        setCropModalOpen(true);
                      }}
                      sx={{
                        width: '100%',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        borderColor: 'var(--primary-forest, #1b4332)',
                        color: 'var(--primary-forest, #1b4332)',
                        bgcolor: '#ffffff',
                        py: 0.75,
                        '&:hover': { bgcolor: '#f4efe6' },
                      }}
                    >
                      {croppedCoverUrl ? 'Adjust crop' : 'Crop now'}
                    </Button>
                  )}
                </Box>
              )}
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
                onClick={() => backFileInputRef.current?.click()}
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

          {/* Option to use Front Cover photo for book profile - Desktop view (100% full width below grid) */}
          {frontPhoto && (
            <Box
              sx={{
                width: '100%',
                mt: 2,
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                px: 2,
                borderRadius: '12px',
                backgroundColor: '#fbf8f2',
                border: '1px solid var(--border-parchment, #e8ded0)',
                boxSizing: 'border-box',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={usePhotoForProfile}
                    onChange={(e) => setUsePhotoForProfile(e.target.checked)}
                    sx={{
                      color: 'var(--primary-forest, #1b4332)',
                      '&.Mui-checked': { color: 'var(--primary-forest, #1b4332)' },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-forest, #1b4332)' }}>
                    Use this front cover for book profile
                  </Typography>
                }
                sx={{ m: 0 }}
              />

              {usePhotoForProfile && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CropIcon fontSize="small" />}
                  onClick={() => {
                    setIsSubmittingOnCrop(false);
                    setCropModalOpen(true);
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    borderColor: 'var(--primary-forest, #1b4332)',
                    color: 'var(--primary-forest, #1b4332)',
                    bgcolor: '#ffffff',
                    py: 0.3,
                    px: 1.25,
                    '&:hover': { bgcolor: '#f4efe6' },
                  }}
                >
                  {croppedCoverUrl ? 'Adjust crop' : 'Crop now'}
                </Button>
              )}
            </Box>
          )}

          {/* Hidden File Inputs (Default Native Device Options) */}
          <input
            ref={frontFileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFrontPhotoSelect(e.target.files[0])}
          />
          <input
            ref={backFileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
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
                    'Auto-fill book details'
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

          {/* Book Profile Cover Photo Banner if front photo selected for profile */}
          {usePhotoForProfile && frontPhotoUrl && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                px: 2,
                mb: 2.5,
                borderRadius: '12px',
                backgroundColor: '#fbf8f2',
                border: '1px solid var(--border-parchment, #e8ded0)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <img
                  src={croppedCoverUrl || frontPhotoUrl}
                  alt="Front cover preview"
                  style={{
                    width: 44,
                    height: 60,
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid #d6cebf',
                  }}
                />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--primary-forest, #1b4332)' }}>
                    Front Cover Attached as Book Profile
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#57534e' }}>
                    {croppedCoverUrl
                      ? '✓ Cropped and ready for book profile'
                      : 'Will prompt to crop & adjust when clicking "Add to library"'}
                  </Typography>
                </Box>
              </Box>

              <Button
                type="button"
                size="small"
                variant="outlined"
                startIcon={<CropIcon fontSize="small" />}
                onClick={() => {
                  setIsSubmittingOnCrop(false);
                  setCropModalOpen(true);
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  borderColor: 'var(--primary-forest, #1b4332)',
                  color: 'var(--primary-forest, #1b4332)',
                  bgcolor: '#ffffff',
                  '&:hover': { bgcolor: '#f4efe6' },
                }}
              >
                {croppedCoverUrl ? 'Adjust Crop' : 'Crop Now'}
              </Button>
            </Box>
          )}

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
          <Box className={styles.actionButtonsRow} sx={{ flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { xs: 'stretch', sm: 'flex-end' }, width: '100%', gap: 1.75 }}>
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

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Interactive Crop & Adjust Modal (Always uses Front Cover) */}
      {frontPhotoUrl && (
        <ImageCropModal
          open={cropModalOpen}
          imageSrc={frontPhotoUrl}
          onClose={handleCropClose}
          onCropSave={handleCropSave}
          onImageSrcChange={(newSrc) => setFrontPhotoUrl(newSrc)}
          aspectRatio={13 / 18}
        />
      )}
    </Box>
  );
};
