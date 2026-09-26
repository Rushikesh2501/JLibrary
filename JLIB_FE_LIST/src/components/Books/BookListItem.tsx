import React, { useState } from 'react';
import { Book as BookIcon, ChevronRight } from 'lucide-react';
import type { Book } from '../../interfaces/book.interface';
import { getSafeBookCoverUrl } from '../../services/bookService';
import { Badge } from '../shared/Badge/Badge';
import styles from './BookListItem.module.css';

interface BookListItemProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export const BookListItem: React.FC<BookListItemProps> = ({ book, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const coverUrl = getSafeBookCoverUrl(book);

  return (
    <div
      className={styles.item}
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
      <div className={styles.leftCol}>
        <div className={styles.thumbWrapper}>
          {coverUrl && !imgError ? (
            <img
              src={coverUrl}
              alt={book.book_name}
              className={styles.thumbImage}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <BookIcon size={20} color="#94a3b8" />
          )}
        </div>

        <div className={styles.titleCol}>
          <div className={styles.titleRow}>
            <span className={styles.idBadge}>#{book.book_id}</span>
            <span className={styles.title} title={book.book_name}>
              {book.book_name}
            </span>
          </div>

          {book.native_title && book.native_title !== book.book_name && (
            <div className={styles.nativeTitle} title={book.native_title}>
              {book.native_title}
            </div>
          )}

          <div className={styles.authorLine}>
            <span>{book.author || 'Unknown Author'}</span>
            {book.publication && book.publication !== 'N/A' && (
              <span> • {book.publication}</span>
            )}
            {book.section && <span> • Shelf: {book.section}</span>}
          </div>
        </div>
      </div>

      <div className={styles.rightCol}>
        {book.language && (
          <Badge variant="neutral" size="sm">
            {book.language}
          </Badge>
        )}

        <ChevronRight size={18} color="#94a3b8" />
      </div>
    </div>
  );
};
