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

  // Theme & Responsive Media Query (Mobile & Tablet: Take Photo / Upload Image buttons; Desktop: Drag & Drop)
  const theme = useTheme();
  const isTouchOrTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Form State
  const [title, setTitle] = useState('');
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
  const [shelves, setShelves] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newBookData = {
      book_name: title,
      author: authors || 'Unknown Author',
      genre: tags ? tags.split(',')[0].trim() : 'General',
      publication: publisher || 'Self Published',
      section: shelves ? shelves.split(',')[0].trim() : 'General',
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
                disabled={isbn.trim().length < 2}
                className={styles.lookupBtn}
              >
                Look up
              </Button>
            </Box>
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

      {/* Form Section */}
      <form id="add-book-form" onSubmit={handleSubmit} className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionHeading}>
          Review and save
        </Typography>

        {/* Title */}
        <Box className={styles.fieldGroup}>
          <Typography className={styles.fieldLabel}>Title *</Typography>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
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
                onChange={(e) => setReadingStatus(e.target.value)}
                className={styles.inputField}
              >
                <MenuItem value="To read">To read</MenuItem>
                <MenuItem value="Currently reading">Currently reading</MenuItem>
                <MenuItem value="Read">Read</MenuItem>
              </TextField>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>Tags (comma separated)</Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={styles.inputField}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>Shelves / collections (comma separated)</Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={shelves}
                onChange={(e) => setShelves(e.target.value)}
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
            className={styles.submitButton}
            onSubmit={handleSubmit}
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
    </Box>
  );
};
