import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { Book, ViewMode, SortOption } from './interfaces/book.interface';
import { getBooks } from './services/bookService';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { BookFilters } from './components/Books/BookFilters';
import { BookGrid } from './components/Books/BookGrid';
import { BookDetailsView } from './components/Books/BookDetailsView';
import { Button } from './components/shared/Button/Button';
import styles from './App.module.css';

export const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('title-asc');
  const viewMode: ViewMode = 'grid';

  // Selected Book for Full In-Page Details View (not a popup modal)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (err: any) {
      console.error('Error fetching book collection:', err);
      setError(
        err.message || 'Unable to connect to JLibrary backend API. Please make sure backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Sync selectedBook with URL query parameter ?book=
  useEffect(() => {
    if (books.length === 0) return;

    const url = new URL(window.location.href);
    const bookId = url.searchParams.get('book');
    if (bookId) {
      const found = books.find((b) => String(b.book_id) === String(bookId));
      if (found) {
        setSelectedBook(found);
      }
    }

    const onPopState = () => {
      const currentUrl = new URL(window.location.href);
      const currentBookId = currentUrl.searchParams.get('book');
      if (currentBookId) {
        const matching = books.find((b) => String(b.book_id) === String(currentBookId));
        if (matching) {
          setSelectedBook(matching);
          return;
        }
      }
      setSelectedBook(null);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [books]);

  const languagesList = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.language && b.language.trim() && b.language !== 'N/A') {
        set.add(b.language.trim());
      }
    });
    return Array.from(set).sort();
  }, [books]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = books.filter((book) => {
      // 1. Search Query filter (matches English title, Marathi title, author, ID, genre, section, isbn)
      if (query) {
        const titleMatch = book.book_name?.toLowerCase().includes(query);
        const nativeMatch =
          book.native_title?.toLowerCase().includes(query) ||
          book.book_name_native_lang?.toLowerCase().includes(query);
        const authorMatch = book.author?.toLowerCase().includes(query);
        const idMatch = book.book_id?.toLowerCase().includes(query);
        const genreMatch = book.genre?.toLowerCase().includes(query);
        const sectionMatch = book.section?.toLowerCase().includes(query);
        const isbnMatch = book.isbn?.toLowerCase().includes(query);

        if (
          !titleMatch &&
          !nativeMatch &&
          !authorMatch &&
          !idMatch &&
          !genreMatch &&
          !sectionMatch &&
          !isbnMatch
        ) {
          return false;
        }
      }

      // 2. Language filter
      if (selectedLanguage !== 'all' && book.language !== selectedLanguage) {
        return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'title-asc':
          return (a.book_name || '').localeCompare(b.book_name || '', undefined, {
            sensitivity: 'base',
          });
        case 'title-desc':
          return (b.book_name || '').localeCompare(a.book_name || '', undefined, {
            sensitivity: 'base',
          });
        case 'date-added': {
          const tA = new Date(a.date_added || 0).getTime();
          const tB = new Date(b.date_added || 0).getTime();
          if (tA !== tB) return tB - tA;
          return (a.book_name || '').localeCompare(b.book_name || '', undefined, { sensitivity: 'base' });
        }
        case 'date-modified': {
          const tA = new Date(a.date_modified || a.date_added || 0).getTime();
          const tB = new Date(b.date_modified || b.date_added || 0).getTime();
          if (tA !== tB) return tB - tA;
          return (a.book_name || '').localeCompare(b.book_name || '', undefined, { sensitivity: 'base' });
        }
        case 'id-asc':
          return (a.book_id || '').localeCompare(b.book_id || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        case 'id-desc':
          return (b.book_id || '').localeCompare(a.book_id || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        case 'borrowed-desc':
          return (b.number_of_times_borrowed ?? 0) - (a.number_of_times_borrowed ?? 0);
        case 'year-desc':
          return (Number(b.published_year) || 0) - (Number(a.published_year) || 0);
        default:
          return 0;
      }
    });
  }, [
    books,
    searchQuery,
    selectedLanguage,
    sortOption,
  ]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedLanguage !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('all');
    setSortOption('title-asc');
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const url = new URL(window.location.href);
    url.searchParams.set('book', book.book_id);
    window.history.pushState({ bookId: book.book_id }, '', url.toString());
  };

  const handleBackToList = () => {
    setSelectedBook(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const url = new URL(window.location.href);
    url.searchParams.delete('book');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className={styles.app}>
      <Header totalBooks={books.length} />

      <main className={styles.main}>
        {selectedBook ? (
          /* Full In-Page Details View (Opens like a page with Back button, exactly matching JLIB_FE) */
          <BookDetailsView
            book={selectedBook}
            onBack={handleBackToList}
          />
        ) : (
          /* Main Library Collection Catalog List View */
          <>
            <div className={styles.topSection}>
              <div className={styles.topInfo}>
                <h2 className={styles.collectionTitle}>Library Collection</h2>
                <p className={styles.collectionSubtitle}>
                  Browse and discover books in our collection.
                </p>
              </div>
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <div className={styles.errorInfo}>
                  <AlertCircle size={24} />
                  <div>
                    <div className={styles.errorTitle}>Error Loading Collection</div>
                    <div className={styles.errorDesc}>{error}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw size={15} />}
                  onClick={fetchBooks}
                >
                  Retry
                </Button>
              </div>
            )}

            <BookFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              languagesList={languagesList}
              sortOption={sortOption}
              onSortChange={setSortOption}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            <BookGrid
              books={filteredAndSortedBooks}
              isLoading={isLoading}
              viewMode={viewMode}
              onSelectBook={handleSelectBook}
              onResetFilters={handleResetFilters}
            />
          </>
        )}
      </main>

      <Footer totalBooks={books.length} />
    </div>
  );
};

export default App;
