import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Drawer } from '@mui/material';
import { IBook as Book } from './interfaces/book-interface/ibook';
import { getBooks } from './services/bookService';
import { Sidebar, NavView } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { Loading } from './components/common/Loading';
import { ErrorState } from './components/common/ErrorState';
import { ScrollToTop } from './components/common/ScrollToTop';
import styles from './App.module.css';
import { MembersPage } from './pages/MembersPage';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (err: any) {
      console.error('Error fetching books from backend:', err);
      setError('Unable to connect to the JLibrary backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const pageTitle =
    currentView === 'dashboard'
      ? 'Dashboard'
      : currentView === 'books'
        ? 'Books Collection'
        : 'Members Directory';


  return (
    <Box className={styles.appLayout}>
      <Grid container>
        {/* Desktop Sticky Sidebar Column */}
        <Grid
          size={{ xs: 0, md: 3, lg: 2.5 }}
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 0,
            height: '100vh',
            alignSelf: 'flex-start',
            backgroundColor: 'var(--bg-sidebar)',
          }}
        >
          <Sidebar currentView={currentView} onSelectView={setCurrentView} />
        </Grid>

        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          slotProps={{ paper: { className: styles.drawerPaper } }}
        >
          <Sidebar
            currentView={currentView}
            onSelectView={setCurrentView}
            onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
          />
        </Drawer>

        {/* Main Content Area */}
        <Grid size={{ xs: 12, md: 9, lg: 9.5 }} className={styles.mainColumn}>
          <Header
            title={pageTitle}
            onToggleMobileDrawer={() => setMobileDrawerOpen((prev) => !prev)}
            bookCount={isLoading || error ? undefined : books.length}
          />

          <Box className={styles.contentBox}>
            {isLoading ? (
              <Loading />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchBooks} />
            ) : currentView === 'dashboard' ? (
              <DashboardPage books={books} onNavigateToBooks={() => setCurrentView('books')} />
            ) : currentView === 'books' ? (
              <BooksPage books={books} />
            ) : (
              <MembersPage />
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Global Dynamic Floating Scroll To Top Arrow Button */}
      <ScrollToTop />
    </Box>
  );
};

export default App;
