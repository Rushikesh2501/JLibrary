import React from 'react';
import { BooksPage as BooksPageComponent } from '../components/Books/BooksPage';
import { IBook as Book } from 'interfaces/book-interface/ibook';

interface BooksPageProps {
  books: Book[];
}

export const BooksPage: React.FC<BooksPageProps> = ({ books }) => {
  return <BooksPageComponent books={books} />;
};
