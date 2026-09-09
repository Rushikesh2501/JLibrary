import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
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
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isAddBookViewActive, setIsAddBookViewActive] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setBooksList(initialBooks);
  }, [initialBooks]);

  // Helper to determine availability
  const isBookAvailable = (b: Book): boolean => {
    if (b.availability_status) {
      return b.availability_status.toLowerCase() === 'available';
    }
    if (typeof b.is_available === 'boolean') {
      return b.is_available;
    }
    if (b.status) {
      return b.status.toLowerCase().includes('avail') || b.status.toLowerCase().includes('in lib');
    }
    const strId = String(b.book_id);
    const num = parseInt(strId.replace(/\D/g, ''), 10) || 1;
    return num % 3 !== 0;
  };

  // Extract unique genres dynamically
  const genres = useMemo(() => {
    const set = new Set<string>();
    booksList.forEach((b) => {
      if (b.genre && b.genre.trim()) {
        set.add(b.genre.trim());
      }
    });
    return Array.from(set).sort();
  }, [booksList]);

  // Extract unique sections dynamically
  const sections = useMemo(() => {
    const set = new Set<string>();
    booksList.forEach((b) => {
      if (b.section && b.section.trim()) {
        set.add(b.section.trim());
      }
    });
    return Array.from(set).sort();
  }, [booksList]);

  // Filter books locally in real-time
  const filteredBooks = useMemo(() => {
    return booksList.filter((book) => {
      if (selectedAvailability !== 'ALL') {
        const avail = isBookAvailable(book);
        if (selectedAvailability === 'Available' && !avail) return false;
        if (selectedAvailability === 'Borrowed' && avail) return false;
      }

      if (selectedGenre !== 'ALL' && book.genre !== selectedGenre) {
        return false;
      }

      if (selectedSection !== 'ALL' && book.section !== selectedSection) {
        return false;
      }

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
  }, [booksList, searchTerm, selectedGenre, selectedSection, selectedAvailability]);

  const isFilterActive =
    selectedGenre !== 'ALL' ||
    selectedSection !== 'ALL' ||
    selectedAvailability !== 'ALL' ||
    searchTerm.trim() !== '';

  const handleClearFilters = () => {
    setSelectedGenre('ALL');
    setSelectedSection('ALL');
    setSelectedAvailability('ALL');
    setSearchTerm('');
  };

  const handleAddNewBook = async (newBookData: any) => {
    try {
      const shelfPrefix = newBookData.shelf_no ? `${newBookData.shelf_no}-` : 'JL-';
      const savedBook = await createBook(newBookData, shelfPrefix);
      setBooksList((prev) => [savedBook, ...prev]);
    } catch (err) {
      console.error('Failed to create book in backend:', err);
      const fallbackBook: Book = {
        book_id: newBookData.book_id || (newBookData.shelf_no ? `${newBookData.shelf_no}-1` : `JL-${Date.now()}`),
        ...newBookData,
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
    setBooksList((prev) =>
      prev.map((b) => (String(b.book_id) === String(updatedBook.book_id) ? updatedBook : b))
    );
    setSelectedBook(updatedBook);
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
        <Box>
          <Typography variant="h4" className={styles.title}>
            Library Collection
          </Typography>
          <Typography variant="body1" className={styles.subtitle}>
            Browse and discover books in your collection.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddBookViewActive(true)}
          className={styles.addBookTopButton}
        >
          Add Book
        </Button>
      </Box>

      {/* Toolbar Row */}
      <Box className={styles.toolbarRow}>
        <Paper className={styles.toolbarPaper} elevation={0}>
          <Box sx={{ width: '100%', flex: { lg: 1 } }}>
            <BookSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </Box>

          <Box sx={{ width: { xs: '100%', lg: 'auto' }, flexShrink: 0 }}>
            <BookFilters
              genres={genres}
              sections={sections}
              selectedGenre={selectedGenre}
              selectedSection={selectedSection}
              selectedAvailability={selectedAvailability}
              onGenreChange={setSelectedGenre}
              onSectionChange={setSelectedSection}
              onAvailabilityChange={setSelectedAvailability}
            />
          </Box>
        </Paper>

        <Button
          variant="outlined"
          disabled={!isFilterActive}
          onClick={handleClearFilters}
          startIcon={<FilterAltOffIcon fontSize="small" />}
          className={styles.outerClearButton}
        >
          Clear Filters
        </Button>
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
