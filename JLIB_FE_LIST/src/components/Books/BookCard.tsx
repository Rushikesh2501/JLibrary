import React, { useState } from 'react';
import { Book as BookIcon } from 'lucide-react';
import type { Book } from '../../interfaces/book.interface';
import { getSafeBookCoverUrl } from '../../services/bookService';
import styles from './BookCard.module.css';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const coverUrl = getSafeBookCoverUrl(book);

  return (
    <div
      className={styles.bookCard}
      onClick={() => onSelect(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(book);
        }
      }}
    >
      <div className={styles.coverWrapper}>
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={book.book_name}
            className={styles.coverImage}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.coverFallback}>
            <BookIcon size={24} />
            <span className={styles.fallbackId}>#{book.book_id}</span>
          </div>
        )}
      </div>

      <div className={styles.cardContent}>
        <div className={styles.mainInfo}>
          <h3 className={styles.bookTitle} title={book.book_name}>
            {book.book_name}
          </h3>

          {book.native_title && book.native_title !== book.book_name && (
            <div className={styles.nativeTitleCard} title={book.native_title}>
              {book.native_title}
            </div>
          )}

          <div className={styles.authorYear}>
            <span>{book.author || 'Unknown Author'}</span>
            {book.publication && book.publication !== 'N/A' && (
              <span> • {book.publication}</span>
            )}
          </div>
        </div>

        <div className={styles.pillRow}>
          {book.language && (
            <span className={styles.langPill}>
              {book.language}
            </span>
          )}

          {book.section && (
            <span className={styles.shelfPill}>
              {book.section}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
