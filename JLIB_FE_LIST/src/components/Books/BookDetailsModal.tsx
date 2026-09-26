import React, { useState } from 'react';
import { Book as BookIcon, Copy } from 'lucide-react';
import type { Book } from '../../interfaces/book.interface';
import { getSafeBookCoverUrl } from '../../services/bookService';
import { Modal } from '../shared/Modal/Modal';
import styles from './BookDetailsModal.module.css';

interface BookDetailsModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'summary'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!book) return null;

  const coverUrl = getSafeBookCoverUrl(book);
  const isAvailable =
    book.availability_status?.toLowerCase() === 'available' ||
    book.availability_status === 'Available';

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={book.book_name}
    >
      {/* Top Banner styled after JLIB_FE BookDetailsView */}
      <div className={styles.banner}>
        <div className={styles.bannerCoverWrapper}>
          {coverUrl && !imgError ? (
            <img
              src={coverUrl}
              alt={book.book_name}
              className={styles.bannerCover}
              onError={() => setImgError(true)}
            />
          ) : (
            <BookIcon size={38} color="#94a3b8" />
          )}
        </div>

        <div className={styles.bannerContent}>
          <div className={styles.topRow}>
            <span className={styles.bookIdBadge}>
              Book ID #{book.book_id}
            </span>
          </div>

          <h2 className={styles.bannerTitle}>{book.book_name}</h2>

          {book.native_title && book.native_title !== book.book_name && (
            <div className={styles.bannerNativeTitle}>{book.native_title}</div>
          )}

          <div className={styles.bannerMeta}>
            <span>{book.author || 'Unknown Author'}</span>
            {book.publication && book.publication !== 'N/A' && (
              <span> • Published by {book.publication}</span>
            )}
            {book.published_year && <span> ({book.published_year})</span>}
          </div>

          <div className={styles.bannerPills}>
            <span className={isAvailable ? styles.availPill : styles.borrowedPill}>
              {book.availability_status || 'Available'}
            </span>

            {book.section && (
              <span className={styles.bookIdBadge}>
                Shelf: {book.section}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overview & Summary Capsule Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'summary' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Tab 1: Overview Details */}
      {activeTab === 'overview' && (
        <div className={styles.detailsCard}>
          <h3 className={styles.detailsHeaderTitle}>Details</h3>
          <div className={styles.detailsRows}>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Book ID</span>
              <div className={styles.rowValueWrapper}>
                <span className={styles.rowValue}>{book.book_id}</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => handleCopy(book.book_id, 'id')}
                  title="Copy Book ID"
                >
                  {copiedField === 'id' ? (
                    <span className={styles.copiedText}>Copied!</span>
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>ISBN</span>
              <div className={styles.rowValueWrapper}>
                <span className={styles.rowValue}>{book.isbn || 'N/A'}</span>
                {book.isbn && book.isbn !== 'N/A' && (
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => handleCopy(book.isbn!, 'isbn')}
                    title="Copy ISBN"
                  >
                    {copiedField === 'isbn' ? (
                      <span className={styles.copiedText}>Copied!</span>
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Publisher</span>
              <span className={styles.rowValue}>{book.publication || 'N/A'}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Year</span>
              <span className={styles.rowValue}>{book.published_year || 'N/A'}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Shelf / Section</span>
              <span className={styles.rowValue}>{book.section || 'General'}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Language</span>
              <span className={styles.rowValue}>{book.language || 'N/A'}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Edition</span>
              <span className={styles.rowValue}>{book.edition || 'N/A'}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Pages</span>
              <span className={styles.rowValue}>{book.pages ? `${book.pages}` : 'N/A'}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Times Borrowed</span>
              <span className={styles.rowValue}>{book.number_of_times_borrowed ?? 0}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Reading Status</span>
              <span className={styles.rowValue}>{book.reading_status || 'Unread'}</span>
            </div>

            {book.borrowed_by && (
              <div className={styles.row}>
                <span className={styles.rowLabel}>Borrowed By</span>
                <span className={styles.rowValue}>{book.borrowed_by}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Summary */}
      {activeTab === 'summary' && (
        <div className={styles.summaryBox}>
          {book.description && book.description.trim() ? (
            <p>{book.description}</p>
          ) : (
            <div className={styles.emptySummary}>
              No summary or description available for this book.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
