import React from 'react';
import { Box, Typography, Grid, Skeleton } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { AnimatedDots } from './AnimatedDots';
import styles from './Loading.module.css';

export const Loading: React.FC = () => {
  return (
    <Box className={styles.container}>
      <Box className={styles.iconBox}>
        <MenuBookIcon sx={{ fontSize: 36 }} />
      </Box>
      <Typography variant="h5" className={styles.title}>
        Opening the library catalog<AnimatedDots />
      </Typography>
      <Typography variant="body2" className={styles.subtitle}>
        Fetching manuscript & collection records from JLibrary backend.
      </Typography>
      <Grid container spacing={3} sx={{ maxWidth: 1000, width: '100%' }}>
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
            <Box className={styles.skeletonCard}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2, mb: 2 }} />
              <Skeleton variant="text" height={24} width="80%" />
              <Skeleton variant="text" height={18} width="60%" />
              <Skeleton variant="text" height={18} width="40%" />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
