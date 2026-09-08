import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditNoteIcon from '@mui/icons-material/EditNote';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CollectionsIcon from '@mui/icons-material/Collections';
import { BackButton } from '../common/BackButton';
import { fetchBookDetailsByIsbn } from '../../services/bookService';
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
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [hasIsbnFound, setHasIsbnFound] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(false);

  // Theme & Responsive Media Query (Mobile & Tablet: Take Photo / Upload Image buttons; Desktop: Drag & Drop)
  const theme = useTheme();
  const isTouchOrTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Form State
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

  const handleIsbnLookup = async () => {
    if (!isbn.trim()) return;
    setIsLookingUp(true);
    setLookupError(null);

    try {
      const details = await fetchBookDetailsByIsbn(isbn);
      if (details && (details.title || details.authors)) {
        if (details.title) setTitle(details.title);
        if (details.nativeTitle) setNativeTitle(details.nativeTitle);
        if (details.authors) setAuthors(details.authors);
        if (details.publisher) setPublisher(details.publisher);
        if (details.publishedDate) setYear(details.publishedDate);
        if (details.pageCount) setPages(details.pageCount);
        if (details.language) setLanguage(details.language);
        if (details.edition) setEdition(details.edition);
        if (details.categories) setTags(details.categories);
        if (details.description) setDescription(details.description);
        setHasIsbnFound(true);
        setIsFormEditable(false);
      } else {
        setHasIsbnFound(false);
        setIsFormEditable(false);
        setLookupError('No book details found.');
      }
    } catch (err) {
      console.error('ISBN lookup error:', err);
      setHasIsbnFound(false);
      setIsFormEditable(false);
      setLookupError('Failed to fetch details.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newBookData = {
      book_name: title,
      native_title: nativeTitle,
      author: authors || 'Unknown Author',
      genre: tags ? tags.split(',')[0].trim() : 'General',
      publication: publisher || 'Self Published',
      section: 'General',
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      console.log('File dropped:', e.dataTransfer.files[0].name);
    }
  };

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
            startIcon={<QrCodeScannerIcon fontSize="small" />}
          >
            ISBN
          </Button>

          <Button
            disableRipple
            className={`${styles.tabBtn} ${activeTab === 'photo' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('photo')}
            startIcon={<PhotoCameraIcon fontSize="small" />}
          >
            Photo
          </Button>

          <Button
            disableRipple
            className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('manual')}
            startIcon={<EditNoteIcon fontSize="small" />}
          >
            Manual
          </Button>
        </Box>
      </Box>

      {/* ISBN Box Section */}
      {activeTab === 'isbn' && (
        <Box className={styles.isbnBoxCard}>
          <Button
            variant="contained"
            startIcon={<PhotoCameraIcon />}
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
                {isLookingUp ? 'Searching...' : 'Look up'}
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

      {/* Photo Box Section */}
      {activeTab === 'photo' && (
        <Box className={styles.photoBoxCard}>
          <Typography variant="body2" className={styles.photoBoxNotice}>
            Photograph the front cover, back cover, spine or title page. The photo is saved with the book.
          </Typography>

          {isTouchOrTablet ? (
            <Box className={styles.photoButtonRow}>
              <Button
                variant="contained"
                startIcon={<AddAPhotoIcon />}
                className={styles.takePhotoButton}
              >
                Take a photo
              </Button>
              <Button
                variant="outlined"
                startIcon={<CollectionsIcon />}
                className={styles.uploadImageButton}
              >
                Upload an image
              </Button>
            </Box>
          ) : (
            /* Desktop Drag & Drop Box */
            <Box
              className={`${styles.dragDropArea} ${isDragActive ? styles.dragActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              component="label"
            >
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    console.log('File selected:', e.target.files[0].name);
                  }
                }}
              />
              <CloudUploadOutlinedIcon className={styles.uploadCloudIcon} />
              <Typography className={styles.dragDropText}>
                Drag and Drop here or <span className={styles.browseLink}>Browse files</span>
              </Typography>
              <Typography className={styles.fileMetaText}>
                Accepted File Types: .png, .jpg, .jpeg, .webp
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Form Section - Shown for photo/manual tabs OR when ISBN lookup successfully finds book details */}
      {(activeTab !== 'isbn' || hasIsbnFound) && (
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

          {/* Title */}
          <Box className={styles.fieldGroup}>
            <Typography className={styles.fieldLabel}>Title *</Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              value={title}
              disabled={hasIsbnFound && !isFormEditable}
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => setAuthors(e.target.value)}
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
                  onChange={(e) => setPublisher(e.target.value)}
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
                  onChange={(e) => setLanguage(e.target.value)}
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
          <Box className={styles.actionButtonsRow}>
            <Button
              type="submit"
              variant="contained"
              disabled={!title.trim()}
              className={styles.submitButton}
            >
              Add to library
            </Button>

            <Button
              type="button"
              variant="outlined"
              onClick={onBack}
              className={styles.cancelButton}
            >
              Cancel
            </Button>
          </Box>
        </form>
      )}
    </Box>
  );
};
