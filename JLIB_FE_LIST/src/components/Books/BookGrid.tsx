import React, { useState, useEffect } from 'react';
import { BookOpen, SearchX } from 'lucide-react';
import type { Book, ViewMode } from '../../interfaces/book.interface';
import { BookCard } from './BookCard';
import { BookListItem } from './BookListItem';
import { Skeleton } from '../shared/Skeleton/Skeleton';
import { Button } from '../shared/Button/Button';
import { PaginationBar } from '../shared/PaginationBar/PaginationBar';
import styles from './BookGrid.module.css';

interface BookGridProps {
  books: Book[];
  isLoading: boolean;
  viewMode: ViewMode;
  onSelectBook: (book: Book) => void;
  onResetFilters: () => void;
}

const ITEMS_PER_PAGE = 12;

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  isLoading,
  viewMode,
  onSelectBook,
  onResetFilters,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when book list changes (e.g. after search or filter)
  useEffect(() => {
    setCurrentPage(1);
  }, [books.length]);

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, books.length);
  const currentBooks = books.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.grid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.25rem',
                display: 'flex',
                gap: '1rem',
                border: '1px solid #e2e8f0',
              }}
            >
              <Skeleton width={105} height={150} borderRadius={10} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <Skeleton width="40%" height={16} />
                <Skeleton width="90%" height={22} />
                <Skeleton width="75%" height={18} />
                <Skeleton width="60%" height={14} />
                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.4rem' }}>
                  <Skeleton width={60} height={20} borderRadius={12} />
                  <Skeleton width={50} height={20} borderRadius={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <SearchX size={32} />
        </div>
        <h3 className={styles.emptyTitle}>No Matching Books Found</h3>
        <p className={styles.emptyDesc}>
          We couldn't find any books matching your current search query or filter selection. Try
          checking for typos or clearing active filters.
        </p>
        <Button variant="primary" onClick={onResetFilters} icon={<BookOpen size={16} />}>
          View All Books
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {viewMode === 'grid' ? (
        <div className={styles.grid}>
          {currentBooks.map((book) => (
            <BookCard key={book.book_id} book={book} onSelect={onSelectBook} />
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {currentBooks.map((book) => (
            <BookListItem key={book.book_id} book={book} onSelect={onSelectBook} />
          ))}
        </div>
      )}

      {/* Pagination Bar styled after JLIB_FE */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
