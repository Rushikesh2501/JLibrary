import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import styles from './BookDetails.module.css';

interface BookDetailsProps {
  book: Book | null;
  onClose: () => void;
}

export const getBookStatus = (book: Book) => {
  const statusStr = book.availability_status || book.status;
  if (statusStr) {
    const isAvail = statusStr.toLowerCase().includes('in lib') || statusStr.toLowerCase().includes('avail');
    return { label: statusStr, isAvailable: isAvail };
  }
  if (typeof book.is_available === 'boolean') {
    return {
      label: book.is_available ? 'Available' : 'Borrowed',
      isAvailable: book.is_available,
    };
  }
  const strId = String(book.book_id);
  const num = parseInt(strId.replace(/\D/g, ''), 10) || 1;
  const isAvailable = num % 3 !== 0;
  return {
    label: isAvailable ? 'Available' : 'Borrowed',
    isAvailable,
  };
};

export const BookDetails: React.FC<BookDetailsProps> = ({ book, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!book) return null;

  const formattedBookId = String(book.book_id).startsWith('#')
    ? String(book.book_id)
    : `#${String(book.book_id).padStart(3, '0')}`;

  const { label: statusLabel, isAvailable } = getBookStatus(book);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <Dialog open={Boolean(book)} onClose={onClose} slotProps={{ paper: { className: styles.dialogPaper } }}>
      <Box className={styles.headerBanner}>
        <IconButton className={styles.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Chip label={`Index Ref: ${formattedBookId}`} size="small" className={styles.catalogBadge} />
        <Typography variant="h5" className={styles.bookTitle}>
          {book.book_name}
        </Typography>
      </Box>

      <DialogContent className={styles.dialogContent}>
        <Box className={styles.detailRow}>
          <Typography className={styles.detailLabel}>Availability Status</Typography>
          <Chip
            icon={isAvailable ? <CheckCircleIcon style={{ fontSize: 18 }} /> : <HourglassEmptyIcon style={{ fontSize: 18 }} />}
            label={statusLabel}
            size="medium"
            className={isAvailable ? styles.statusInLib : styles.statusBorrowed}
          />
        </Box>

        {!isAvailable && (
          <Box className={styles.detailRow}>
            <Typography className={styles.detailLabel}>Borrowed By</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography className={styles.detailValue}>{book.borrowed_by || 'N/A'}</Typography>
              {book.borrowed_by && (
                <Tooltip title={copiedType === 'borrowedBy' ? 'Copied!' : 'Copy Member ID/Name'}>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(book.borrowed_by!, 'borrowedBy')}
                    sx={{ color: copiedType === 'borrowedBy' ? '#2e7d32' : 'var(--text-muted)', ml: 0.5 }}
                  >
                    {copiedType === 'borrowedBy' ? <CheckIcon style={{ fontSize: 16 }} /> : <ContentCopyIcon style={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}

        <Box className={styles.detailRow}>
          <Typography className={styles.detailLabel}>Book ID</Typography>
          <Typography className={styles.detailValue}>{book.book_id}</Typography>
        </Box>

        <Box className={styles.detailRow}>
          <Typography className={styles.detailLabel}>Book Name</Typography>
          <Typography className={styles.detailValue}>{book.book_name}</Typography>
        </Box>

        <Box className={styles.detailRow}>
          <Typography className={styles.detailLabel}>Author</Typography>
          <Typography className={styles.detailValue}>{book.author}</Typography>
        </Box>

        <Box className={styles.detailRow}>
          <Typography className={styles.detailLabel}>Genre / Category</Typography>
          <Typography className={styles.detailValue}>{book.genre || 'Uncategorized'}</Typography>
        </Box>

        <Box className={styles.detailRow} style={{ borderBottom: 'none' }}>
          <Typography className={styles.detailLabel}>Publication House</Typography>
          <Typography className={styles.detailValue}>{book.publication || 'Independent'}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

