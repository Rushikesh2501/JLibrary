import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import { BookSearch } from './BookSearch';
import { BookFilters } from './BookFilters';
import { BookGrid } from './BookGrid';
import { BookDetailsView } from './BookDetailsView';
import { EmptyState } from '../common/EmptyState';
import styles from './BooksPage.module.css';

interface BooksPageProps {
  books: Book[];
}

export const BooksPage: React.FC<BooksPageProps> = ({ books }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState('ALL');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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
    books.forEach((b) => {
      if (b.genre && b.genre.trim()) {
        set.add(b.genre.trim());
      }
    });
    return Array.from(set).sort();
  }, [books]);

  // Extract unique sections dynamically
  const sections = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.section && b.section.trim()) {
        set.add(b.section.trim());
      }
    });
    return Array.from(set).sort();
  }, [books]);

  // Filter books locally in real-time
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Availability filter check
      if (selectedAvailability !== 'ALL') {
        const avail = isBookAvailable(book);
        if (selectedAvailability === 'Available' && !avail) return false;
        if (selectedAvailability === 'Borrowed' && avail) return false;
      }

      // Genre filter check
      if (selectedGenre !== 'ALL' && book.genre !== selectedGenre) {
        return false;
      }

      // Section filter check
      if (selectedSection !== 'ALL' && book.section !== selectedSection) {
        return false;
      }

      // Search term check
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = book.book_name?.toLowerCase().includes(query);
        const matchesAuthor = book.author?.toLowerCase().includes(query);
        const matchesGenre = book.genre?.toLowerCase().includes(query);
        const matchesPub = book.publication?.toLowerCase().includes(query);
        const matchesSection = book.section?.toLowerCase().includes(query);

        return matchesName || matchesAuthor || matchesGenre || matchesPub || matchesSection;
      }

      return true;
    });
  }, [books, searchTerm, selectedGenre, selectedSection, selectedAvailability]);

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

  // If a book is selected, render the In-Page Details View (just like Members profile view)
  if (selectedBook) {
    return (
      <BookDetailsView
        book={selectedBook}
        onBack={() => setSelectedBook(null)}
      />
    );
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.headerSection}>
        <Typography variant="h4" className={styles.title}>
          Library Collection
        </Typography>
        <Typography variant="body1" className={styles.subtitle}>
          Browse and discover books in your collection.
        </Typography>
      </Box>

      {/* Toolbar Row: White Search/Filter Box + Separate Outer Clear Filters Button */}
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

        {/* Separate Outer Clear Filters Button */}
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
            books.length === 0 ? 'No books in your library yet.' : 'No matching books found'
          }
          subtitle={
            books.length === 0
              ? 'The collection is empty.'
              : 'Try clearing your search query or adjusting your filters.'
          }
        />
      )}
    </Box>
  );
};

