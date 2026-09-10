import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import { BookSearch } from './BookSearch';
import { BookFilters } from './BookFilters';
import { BookGrid } from './BookGrid';
import { BookDetailsView } from './BookDetailsView';
import { AddBookView } from './AddBookView';
import { EmptyState } from '../common/EmptyState';
import { createBook } from '../../services/bookService';
import styles from './BooksPage.module.css';


interface BooksPageProps {
  books: Book[];
}

export const BooksPage: React.FC<BooksPageProps> = ({ books: initialBooks }) => {
  const [booksList, setBooksList] = useState<Book[]>(initialBooks);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('ASCENDING');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAddBookViewActive, setIsAddBookViewActive] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setBooksList(initialBooks);
  }, [initialBooks]);

  // Filter and sort books locally in real-time
  const filteredBooks = useMemo(() => {
    const result = booksList.filter((book) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = book.book_name?.toLowerCase().includes(query);
        const matchesNativeTitle = (book.book_name_native_lang || book.native_title)?.toLowerCase().includes(query);
        const matchesAuthor = book.author?.toLowerCase().includes(query);

        const matchesGenre = book.genre?.toLowerCase().includes(query);
        const matchesPub = book.publication?.toLowerCase().includes(query);
        const matchesSection = book.section?.toLowerCase().includes(query);
        const matchesIsbn = book.isbn?.toLowerCase().includes(query);

        return matchesName || matchesNativeTitle || matchesAuthor || matchesGenre || matchesPub || matchesSection || matchesIsbn;
      }

      return true;
    });

    if (sortBy === 'ASCENDING' || sortBy === 'DEFAULT') {
      return [...result].sort((a, b) => {
        const titleA = (a.book_name || '').trim();
        const titleB = (b.book_name || '').trim();
        return titleA.localeCompare(titleB, 'en', { sensitivity: 'base', numeric: true });
      });
    }

    if (sortBy === 'DESCENDING') {
      return [...result].sort((a, b) => {
        const titleA = (a.book_name || '').trim();
        const titleB = (b.book_name || '').trim();
        return titleB.localeCompare(titleA, 'en', { sensitivity: 'base', numeric: true });
      });
    }

    if (sortBy === 'DATE_ADDED') {
      return [...result].sort((a, b) => {
        const timeA = a.created_at || a.date_added ? new Date(a.created_at || a.date_added!).getTime() : 0;
        const timeB = b.created_at || b.date_added ? new Date(b.created_at || b.date_added!).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;

        const numA = parseInt(String(a.book_id).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.book_id).replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
    }

    if (sortBy === 'DATE_MODIFIED') {
      return [...result].sort((a, b) => {
        const timeA = a.updated_at || a.date_modified || a.created_at || a.date_added
          ? new Date(a.updated_at || a.date_modified || a.created_at || a.date_added!).getTime()
          : 0;
        const timeB = b.updated_at || b.date_modified || b.created_at || b.date_added
          ? new Date(b.updated_at || b.date_modified || b.created_at || b.date_added!).getTime()
          : 0;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;

        const numA = parseInt(String(a.book_id).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.book_id).replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
    }

    return result;
  }, [booksList, searchTerm, sortBy]);

  const isFilterActive = sortBy !== 'ASCENDING' || searchTerm.trim() !== '';

  const handleClearFilters = () => {
    setSortBy('ASCENDING');
    setSearchTerm('');
  };

  const handleAddNewBook = async (newBookData: any) => {
    try {
      const shelfPrefix = newBookData.shelf_no ? `${newBookData.shelf_no}-` : 'JL-';
      const now = new Date().toISOString();
      const savedBook = await createBook(newBookData, shelfPrefix);
      const bookWithTime: Book = {
        ...savedBook,
        created_at: savedBook.created_at || now,
        updated_at: savedBook.updated_at || now,
        date_added: savedBook.date_added || now,
        date_modified: savedBook.date_modified || now,
      };
      setBooksList((prev) => [bookWithTime, ...prev]);
    } catch (err) {
      console.error('Failed to create book in backend:', err);
      const now = new Date().toISOString();
      const fallbackBook: Book = {
        book_id: newBookData.book_id || (newBookData.shelf_no ? `${newBookData.shelf_no}-1` : `JL-${Date.now()}`),
        ...newBookData,
        created_at: now,
        updated_at: now,
        date_added: now,
        date_modified: now,
      };
      setBooksList((prev) => [fallbackBook, ...prev]);
    }
  };

  const handleDeleteBook = (deletedId: string | number) => {
    setBooksList((prev) => prev.filter((b) => String(b.book_id) !== String(deletedId)));
    setSelectedBook(null);
  };

  // If Add Book view is active, render full-page AddBookView (in-page, no popup)
  if (isAddBookViewActive) {
    return (
      <AddBookView
        onBack={() => setIsAddBookViewActive(false)}
        onAddBook={handleAddNewBook}
      />
    );
  }

  const handleUpdateBook = (updatedBook: Book) => {
    const now = new Date().toISOString();
    const bookWithTime: Book = {
      ...updatedBook,
      updated_at: now,
      date_modified: now,
    };
    setBooksList((prev) =>
      prev.map((b) => (String(b.book_id) === String(updatedBook.book_id) ? bookWithTime : b))
    );
    setSelectedBook(bookWithTime);
  };

  // If a book is selected, render the In-Page Details View
  if (selectedBook) {
    return (
      <BookDetailsView
        book={selectedBook}
        onBack={() => setSelectedBook(null)}
        onDelete={handleDeleteBook}
        onUpdate={handleUpdateBook}
      />
    );
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.headerSection}>
        <Box className={styles.headerLeft}>
          <Typography variant="h4" className={styles.title}>
            Library Collection
          </Typography>
          <Typography variant="body1" className={styles.subtitle}>
            Browse and discover books in your collection.
          </Typography>
        </Box>

        <Box className={styles.headerRight}>
          <div className={styles.totalBookBadge}>
            {booksList.length} {booksList.length === 1 ? 'Book' : 'Books'}
          </div>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddBookViewActive(true)}
            className={styles.addBookTopButton}
          >
            Add Book
          </Button>
        </Box>
      </Box>

      {/* Toolbar Row */}
      <Box className={styles.toolbarRow}>
        <Paper className={styles.toolbarPaper} elevation={0}>
          <Box sx={{ width: '100%', flex: { lg: 1 } }}>
            <BookSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </Box>

          <Box sx={{ width: { xs: '100%', lg: 'auto' }, flexShrink: 0 }}>
            <BookFilters
              sortBy={sortBy}
              isFilterActive={isFilterActive}
              onSortChange={(val) => setSortBy(val === 'DEFAULT' ? 'ASCENDING' : val)}
              onClearFilters={handleClearFilters}
            />
          </Box>
        </Paper>
      </Box>

      {/* List View or Empty State */}
      {filteredBooks.length > 0 ? (
        <BookGrid books={filteredBooks} onSelectBook={setSelectedBook} />
      ) : (
        <EmptyState
          title={
            booksList.length === 0 ? 'No books in your library yet.' : 'No matching books found'
          }
          subtitle={
            booksList.length === 0
              ? 'The collection is empty.'
              : 'Try clearing your search query or adjusting your filters.'
          }
        />
      )}
    </Box>
  );
};
