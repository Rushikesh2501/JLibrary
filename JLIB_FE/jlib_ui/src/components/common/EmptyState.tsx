import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No books in your library yet.',
  subtitle = 'The collection is empty or no books match your search filters.',
}) => {
  return (
    <Paper className={styles.paper} elevation={0}>
      <Box className={styles.iconBox}>
        <AutoStoriesIcon sx={{ fontSize: 40 }} />
      </Box>
      <Typography variant="h6" className={styles.title}>
        {title}
      </Typography>
      <Typography variant="body2" className={styles.subtitle}>
        {subtitle}
      </Typography>
    </Paper>
  );
};
