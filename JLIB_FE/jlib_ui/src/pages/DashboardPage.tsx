import React from 'react';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { IBook as Book } from 'interfaces/book-interface/ibook';

interface DashboardPageProps {
  books: Book[];
  onNavigateToBooks: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ books, onNavigateToBooks }) => {
  return <Dashboard books={books} onNavigateToBooks={onNavigateToBooks} />;
};
