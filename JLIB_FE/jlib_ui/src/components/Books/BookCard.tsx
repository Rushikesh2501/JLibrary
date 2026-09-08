import React, { useState } from 'react';
import { Card, Box, Typography, Button } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import styles from './BookCard.module.css';

interface BookCardProps {
  book: Book;
  onSelectBook: (book: Book) => void;
  viewMode?: 'grid' | 'list';
}

const getBookCoverUrl = (book: Book, numericId: number): string => {
  if (book.cover_url) return book.cover_url;

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

  const sampleCovers = [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
  ];
  return sampleCovers[Math.abs(numericId) % sampleCovers.length];
};

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelectBook,
}) => {
  const [imgError, setImgError] = useState(false);

  const strId = String(book.book_id);
  const numericId = typeof book.book_id === 'number'
    ? book.book_id
    : (parseInt(strId.replace(/\D/g, ''), 10) || 1);

  const yearMatch = book.publication?.match(/\b(19\d\d|20\d\d)\b/);
  const publishedYear = book.published_year || (yearMatch ? yearMatch[0] : (1995 + (numericId * 7) % 28));

  const coverUrl = getBookCoverUrl(book, numericId);

  const isAvailable = book.availability_status
    ? book.availability_status.toLowerCase() === 'available'
    : (book.is_available ?? (numericId % 3 !== 0));

  const statusText = isAvailable ? 'To read' : 'Borrowed';
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
        {!imgError ? (
          <img
            src={coverUrl}
            alt={book.book_name}
            className={styles.coverImage}
            onError={() => setImgError(true)}
          />
        ) : (
          <Box className={styles.fallbackCover} style={{ background: bgGradient }}>
            <Box className={styles.coverSpine} />
            <AutoStoriesIcon className={styles.coverIcon} />
            <Typography className={styles.fallbackTitle}>
              {book.book_name}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right: Book Details & Badges */}
      <Box className={styles.cardContent}>
        <Box className={styles.mainInfo}>
          <Typography variant="h6" className={styles.bookTitle} title={book.book_name}>
            {book.book_name}
          </Typography>
          {book.native_title && (
            <Typography variant="body2" className={styles.nativeTitleCard} title={book.native_title}>
              {book.native_title}
            </Typography>
          )}
          <Typography variant="body2" className={styles.authorYear}>
            {book.author}{publishedYear ? ` · ${publishedYear}` : ''}
          </Typography>
        </Box>

        <Box className={styles.pillRow}>
          <span className={styles.statusPill}>{statusText}</span>
          <span className={styles.ownedPill}>Owned</span>
          <span className={styles.langPill}>{languageText}</span>
          <Button
            size="small"
            className={styles.summaryBtn}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBook(book);
            }}
          >
            Summary
          </Button>
        </Box>
      </Box>
    </Card>
  );
};


