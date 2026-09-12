import React, { useState, useEffect, useRef } from 'react';
import { Card, Box, Typography } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import styles from './BookCard.module.css';

interface BookCardProps {
  book: Book;
  onSelectBook: (book: Book) => void;
  viewMode?: 'grid' | 'list';
}

export const BOOK_PLACEHOLDERS = [
  '/assets/book-placeholder-brown.png',
  '/assets/book-placeholder-navy.png',
  '/assets/book-placeholder-walnut.png',
  '/assets/book-placeholder-blue.png',
  '/assets/book-placeholder-teal.png',
  '/assets/book-placeholder-green.png',
  '/assets/book-placeholder.png', // red
];

export const getDefaultBookCover = (numericId: number): string => {
  return BOOK_PLACEHOLDERS[Math.abs(numericId) % BOOK_PLACEHOLDERS.length];
};

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

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelectBook,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const strId = String(book.book_id);
  const numericId = typeof book.book_id === 'number'
    ? book.book_id
    : (parseInt(strId.replace(/\D/g, ''), 10) || 1);

  const yearMatch = book.publication?.match(/\b(19\d\d|20\d\d)\b/);
  const publishedYear = (book.published_year && String(book.published_year).trim())
    ? String(book.published_year).trim()
    : (yearMatch ? yearMatch[0] : 'NA');

  const coverUrl = getBookCoverUrl(book, numericId);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [coverUrl]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, [coverUrl]);

  const isAvailable = book.availability_status
    ? book.availability_status.toLowerCase() === 'available'
    : (book.is_available ?? (numericId % 3 !== 0));

  const statusText = isAvailable ? 'Available' : 'Borrowed';
  const languageText = (book.language || 'ENGLISH').toUpperCase();

  const fallbackGradients = [
    'linear-gradient(135deg, #1b4332 0%, #2d5a27 100%)',
    'linear-gradient(135deg, #3d2b1f 0%, #594132 100%)',
    'linear-gradient(135deg, #2b3a4a 0%, #1e2936 100%)',
    'linear-gradient(135deg, #5c3a21 0%, #8a5732 100%)',
  ];
  const bgGradient = fallbackGradients[numericId % fallbackGradients.length];

  return (
    <Card className={styles.bookCard} onClick={() => onSelectBook(book)} elevation={0}>
      {/* Left: Cover Thumbnail */}
      <Box className={styles.coverWrapper}>
        {/* Fallback Cover with Book Icon (stays visible until book cover loads or if error / no cover) */}
        <Box
          className={styles.fallbackCover}
          style={{
            background: bgGradient,
            position: coverUrl && !imgError ? 'absolute' : 'relative',
            inset: 0,
            zIndex: 1,
          }}
        >
          <Box className={styles.coverSpine} />
          <AutoStoriesIcon className={styles.coverIcon} />
          <Typography className={styles.fallbackTitle}>
            {book.book_name}
          </Typography>
        </Box>

        {/* Book Cover Image (smoothly fades in once loaded) */}
        {coverUrl && !imgError && (
          <img
            ref={imgRef}
            src={coverUrl}
            alt={book.book_name}
            className={styles.coverImage}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              const target = e.currentTarget;
              const defaultPlaceholder = getDefaultBookCover(numericId);
              if (!target.src.includes('book-placeholder')) {
                target.src = defaultPlaceholder;
                setImgLoaded(false);
              } else {
                setImgError(true);
              }
            }}
            style={{
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.25s ease-in-out',
              position: 'relative',
              zIndex: 2,
            }}
          />
        )}
      </Box>

      {/* Right: Book Details & Badges */}
      <Box className={styles.cardContent}>
        <Box className={styles.mainInfo}>
          <Typography variant="h6" className={styles.bookTitle} title={book.book_name}>
            {book.book_name}
          </Typography>
          {(book.book_name_native_lang || book.native_title) && (
            <Typography variant="body2" className={styles.nativeTitleCard} title={book.book_name_native_lang || book.native_title || ''}>
              {book.book_name_native_lang || book.native_title}
            </Typography>
          )}

          <Typography variant="body2" className={styles.authorYear}>
            {book.author}{publishedYear ? ` · ${publishedYear}` : ''}
          </Typography>
        </Box>

        <Box className={styles.pillRow}>
          <span className={isAvailable ? styles.statusAvailPill : styles.statusBorrowedPill}>
            {statusText}
          </span>
          <span className={styles.langPill} title={languageText}>
            {languageText}
          </span>
        </Box>
      </Box>
    </Card>
  );
};


