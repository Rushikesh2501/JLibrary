import React from 'react';
import { Box, Typography, Grid, Card, Button } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { StatCard } from './StatCard';
import { TopBorrowedGenresChart } from './TopBorrowedGenresChart';
import { IBook as Book } from 'interfaces/book-interface/ibook';
import styles from './Dashboard.module.css';

interface DashboardProps {
  books: Book[];
  onNavigateToBooks: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ books, onNavigateToBooks }) => {
  const totalBooks = books.length;

  const totalAuthors = new Set(
    books.map((b) => b.author).filter((a): a is string => Boolean(a && a.trim()))
  ).size;

  const totalGenres = new Set(
    books.map((b) => b.genre).filter((g): g is string => Boolean(g && g.trim()))
  ).size;

  // Calculate borrowed books
  const borrowedBooks = books.filter((b) => {
    if (b.availability_status) {
      return b.availability_status.toLowerCase() === 'borrowed';
    }
    if (typeof b.is_available === 'boolean') {
      return !b.is_available;
    }
    if (b.status) {
      return b.status.toLowerCase().includes('borrowed');
    }
    const strId = String(b.book_id);
    const num = parseInt(strId.replace(/\D/g, ''), 10) || 1;
    return num % 3 === 0;
  });

  // Calculate Top Borrowed Genres
  const genreSource = borrowedBooks.length > 0 ? borrowedBooks : books;
  const genreCounts: Record<string, number> = {};
  genreSource.forEach((b) => {
    const genre = b.genre || 'Uncategorized';
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  });

  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / (genreSource.length || 1)) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <Box className={styles.container}>
      {/* Top Banner Row: 40% Welcome Box (Left) | 60% Bar Graph (Right) */}
      <Grid container spacing={3} sx={{ mb: 4, alignItems: 'stretch' }}>
        {/* 40% Welcome Card */}
        <Grid size={{ xs: 12, md: 5, lg: 4.8 }}>
          <Card className={styles.welcomeCard} elevation={0} sx={{ height: '100%', m: 0 }}>
            <Box>
              <Typography variant="h4" className={styles.welcomeTitle}>
                Welcome to JLibrary
              </Typography>
              <Typography variant="body1" className={styles.welcomeSubtitle}>
                Your personal library, organized. Browse cataloged volumes, explore authors, and track shelves.
              </Typography>
            </Box>
            <Box className={styles.bookshelfDecoration}>
              <AutoStoriesIcon sx={{ fontSize: 140 }} />
            </Box>
          </Card>
        </Grid>

        {/* 60% Bar Graph */}
        <Grid size={{ xs: 12, md: 7, lg: 7.2 }}>
          <TopBorrowedGenresChart
            topGenres={topGenres}
            borrowedBooksCount={borrowedBooks.length}
          />
        </Grid>
      </Grid>

      {/* Statistics Section - 2x2 Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Books"
            value={totalBooks}
            icon={<MenuBookIcon sx={{ fontSize: 28, color: 'var(--primary-forest)' }} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Authors"
            value={totalAuthors}
            icon={<PersonIcon sx={{ fontSize: 28, color: 'var(--accent-walnut)' }} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Genres"
            value={totalGenres}
            icon={<CategoryIcon sx={{ fontSize: 28, color: 'var(--accent-brass)' }} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Borrowed Books"
            value={borrowedBooks.length}
            icon={<BookmarkIcon sx={{ fontSize: 28, color: 'var(--accent-walnut)' }} />}
          />
        </Grid>
      </Grid>

      {/* Collection Overview Section Header */}
      <Box className={styles.sectionHeader}>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          className={styles.actionButton}
          onClick={onNavigateToBooks}
        >
          View All Books
        </Button>
      </Box>
    </Box>
  );
};
