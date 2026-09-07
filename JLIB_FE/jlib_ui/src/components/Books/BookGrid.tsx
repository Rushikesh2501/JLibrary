import React from 'react';
import { Grid } from '@mui/material';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import { BookCard } from './BookCard';
import styles from './BookGrid.module.css';

interface BookGridProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  viewMode?: 'grid' | 'list';
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  onSelectBook,
}) => {
  return (
    <Grid container spacing={2.5} className={styles.gridContainer}>
      {books.map((book) => (
        <Grid key={book.book_id} size={{ xs: 12, md: 6 }}>
          <BookCard book={book} onSelectBook={onSelectBook} />
        </Grid>
      ))}
    </Grid>
  );
};

