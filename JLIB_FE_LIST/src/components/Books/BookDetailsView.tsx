import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Book as BookIcon } from 'lucide-react';
import type { Book } from '../../interfaces/book.interface';
import { getSafeBookCoverUrl } from '../../services/bookService';
import styles from './BookDetailsView.module.css';

interface BookDetailsViewProps {
  book: Book;
  onBack: () => void;
}

const hasDevanagari = (text?: string | null): boolean => {
  if (!text) return false;
  return /[\u0900-\u097F]/.test(text);
};

const isMarathiBook = (book: Book): boolean => {
  const lang = (book.language || '').toLowerCase().trim();
  if (lang === 'marathi' || lang === 'मराठी' || lang === 'mr' || lang === 'mar') return true;
  if (hasDevanagari(book.book_name_native_lang)) return true;
  if (hasDevanagari(book.native_title)) return true;
  return false;
};

const getFallbackSummary = (book: Book): string => {
  const isMarathi = isMarathiBook(book);
  const title = isMarathi
    ? (book.book_name_native_lang || book.native_title || book.book_name || 'पुस्तक')
    : (book.book_name || 'Book');
  const author = book.author || (isMarathi ? 'प्रसिद्ध लेखक' : 'Author');
  const genre = book.genre || (isMarathi ? 'साहित्य' : 'General');

  if (isMarathi) {
    return `'${title}' हे ${author} यांचे ${genre} विषयावरील एक महत्त्वपूर्ण व वाचनीय पुस्तक आहे. या पुस्तकात विषयाचे सखोल विश्लेषण, प्रभावी मांडणी आणि प्रेरणादायी विचार मांडण्यात आले आहेत. वाचकांना समृद्ध करणारा आणि नवीन दृष्टिकोन देणारा हा एक उत्कृष्ट ग्रंथ आहे.`;
  }

  return `${title} by ${author} is a compelling work that explores profound themes within ${book.genre || 'literary storytelling'}. Offering rich character developments and insightful narratives, it takes readers on a captivating journey through thought-provoking events and memorable perspectives.`;
};

export const BookDetailsView: React.FC<BookDetailsViewProps> = ({ book, onBack }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Summary'>('Overview');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedIsbn, setCopiedIsbn] = useState(false);
  const [imgError, setImgError] = useState(false);

  const coverUrl = getSafeBookCoverUrl(book);
  const isAvailable =
    book.availability_status?.toLowerCase() === 'available' ||
    book.availability_status === 'Available';

  const yearMatch = book.publication?.match(/\b(19\d\d|20\d\d)\b/);
  const publishedYear =
    book.published_year && String(book.published_year).trim() && String(book.published_year).trim() !== 'null'
      ? String(book.published_year).trim()
      : yearMatch
      ? yearMatch[0]
      : 'N/A';

  const handleCopyId = () => {
    navigator.clipboard.writeText(book.book_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyIsbn = () => {
    if (book.isbn && book.isbn !== 'N/A') {
      navigator.clipboard.writeText(book.isbn);
      setCopiedIsbn(true);
      setTimeout(() => setCopiedIsbn(false), 2000);
    }
  };

  const summaryText =
    book.description && book.description.trim() && book.description !== 'N/A'
      ? book.description
      : getFallbackSummary(book);

  return (
    <div className={styles.profileContainer}>
      {/* Top Action Row with Back Button */}
      <div className={styles.backButtonRow}>
        <button
          type="button"
          onClick={onBack}
          className={styles.backButton}
          aria-label="Back to Books List"
        >
          <ArrowLeft size={18} />
          <span>Back to Books List</span>
        </button>
      </div>

      {/* Box 1: Book Profile Header Card */}
      <div className={styles.profileCard}>
        {/* Cover Banner Header with Pattern and Top Right Book ID Chip */}
        <div className={styles.coverContainer}>
          <div className={styles.coverPattern} />
          <span className={styles.topRightBookIdChip}>
            Book ID #{book.book_id}
          </span>
        </div>

        {/* Side-by-Side Header Info */}
        <div className={styles.profileHeader}>
          {/* Book Cover */}
          <div className={styles.coverWrapper}>
            {coverUrl && !imgError ? (
              <img
                src={coverUrl}
                alt={book.book_name}
                className={styles.coverImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={styles.coverFallback}>
                <div className={styles.coverSpine} />
                <BookIcon size={36} />
                <span className={styles.fallbackTitle}>{book.book_name}</span>
                <span className={styles.fallbackId}>#{book.book_id}</span>
              </div>
            )}
          </div>

          <div className={styles.headerMainContent}>
            {/* Mobile-only Book ID Badge centered under book cover */}
            <div className={styles.mobileBookIdRow}>
              <span className={styles.mobileBookIdChip}>
                Book ID #{book.book_id}
              </span>
            </div>

            {/* Title & Native Title */}
            <div className={styles.greenTitleRow}>
              <div className={styles.titleColumn}>
                <span className={styles.bookTitleGreen}>
                  {book.book_name}
                </span>
                {(book.native_title || book.book_name_native_lang) && (
                  <span className={styles.nativeTitleGreen}>
                    {book.native_title || book.book_name_native_lang}
                  </span>
                )}
              </div>
            </div>

            {/* Metadata inside White Area */}
            <div className={styles.whiteInfoSection}>
              <div className={styles.whiteInfoTopRow}>
                <div className={styles.bookMetaSub}>
                  {book.author || 'Unknown Author'}
                  {publishedYear ? ` · ${publishedYear}` : ''}
                  {book.publication && book.publication !== 'N/A' ? ` • Published by ${book.publication}` : ''}
                </div>
              </div>

              {/* Status Badges */}
              <div className={styles.headerBadgesRow}>
                <span className={isAvailable ? styles.statusAvailPill : styles.statusBorrowedPill}>
                  {book.availability_status || (isAvailable ? 'Available' : 'Borrowed')}
                </span>
                {!isAvailable && book.borrowed_by && (
                  <span className={styles.borrowedByPill}>
                    Borrowed by {book.borrowed_by}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Box 2: Content Canvas for Details & Summary Content */}
      <div className={styles.contentCanvas}>
        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'Overview' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('Overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'Summary' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('Summary')}
          >
            Summary
          </button>
        </div>

        {activeTab === 'Overview' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Details</span>
            </div>

            <div className={styles.detailsTable}>
              {/* Book ID */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Book ID</span>
                <span className={styles.tableValue}>
                  {book.book_id}
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className={styles.copyBtn}
                    title="Copy Book ID"
                  >
                    {copiedId ? (
                      <Check size={14} className={styles.checkIcon} />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </span>
              </div>

              {/* ISBN */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>ISBN</span>
                <span className={styles.tableValue}>
                  {book.isbn || 'N/A'}
                  {book.isbn && book.isbn !== 'N/A' && (
                    <button
                      type="button"
                      onClick={handleCopyIsbn}
                      className={styles.copyBtn}
                      title="Copy ISBN"
                    >
                      {copiedIsbn ? (
                        <Check size={14} className={styles.checkIcon} />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>
                  )}
                </span>
              </div>

              {/* Publisher */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Publisher</span>
                <span className={styles.tableValue}>
                  {book.publication || 'N/A'}
                </span>
              </div>

              {/* Year */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Year</span>
                <span className={styles.tableValue}>
                  {publishedYear}
                </span>
              </div>

              {/* Edition */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Edition</span>
                <span className={styles.tableValue}>
                  {book.edition || 'N/A'}
                </span>
              </div>

              {/* Language */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Language</span>
                <span className={styles.tableValue}>
                  {(book.language || 'ENGLISH').toUpperCase()}
                </span>
              </div>

              {/* Shelf Location */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Shelf location</span>
                <span className={styles.tableValue}>
                  {book.section ? `Shelf ${book.section}` : '—'}
                </span>
              </div>

              {/* Genre / Tags */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Tags</span>
                <span className={styles.tableValue}>
                  {book.genre || '—'}
                </span>
              </div>

              {/* Pages */}
              {book.pages && (
                <div className={styles.tableRow}>
                  <span className={styles.tableLabel}>Pages</span>
                  <span className={styles.tableValue}>
                    {book.pages} pages
                  </span>
                </div>
              )}

              {/* Times Borrowed */}
              <div className={styles.tableRow}>
                <span className={styles.tableLabel}>Times Borrowed</span>
                <span className={styles.tableValue}>
                  {book.number_of_times_borrowed ?? 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Summary' && (
          <div className={styles.cardBox}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Summary</span>
            </div>

            <div className={styles.summaryBlock}>
              <span className={styles.summaryBlockLabel}>Description</span>
              <div className={styles.summaryTextBox}>
                {summaryText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailsView;
