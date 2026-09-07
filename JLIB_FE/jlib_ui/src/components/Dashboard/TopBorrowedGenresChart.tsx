import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import styles from './TopBorrowedGenresChart.module.css';

export interface GenreStat {
  genre: string;
  count: number;
  percentage: number;
}

interface TopBorrowedGenresChartProps {
  topGenres: GenreStat[];
  borrowedBooksCount: number;
}

const BAR_GRADIENTS = [
  'linear-gradient(180deg, #1b4332 0%, #2d5a27 100%)',
  'linear-gradient(180deg, #3d2b1f 0%, #594132 100%)',
  'linear-gradient(180deg, #2b3a4a 0%, #1e2936 100%)',
  'linear-gradient(180deg, #5c3a21 0%, #8a5732 100%)',
  'linear-gradient(180deg, #4a2b3a 0%, #66384e 100%)',
];

export const TopBorrowedGenresChart: React.FC<TopBorrowedGenresChartProps> = ({
  topGenres,
  borrowedBooksCount,
}) => {
  const maxGenreCount = Math.max(...topGenres.map((g) => g.count), 1);

  return (
    <Card
      className={styles.recentPaper}
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontFamily: 'var(--font-serif)', color: 'var(--primary-forest)', fontWeight: 700 }}
        >
          Top Borrowed Genres
        </Typography>
        <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>
          {borrowedBooksCount} Borrowed Books Total
        </Typography>
      </Box>

      {topGenres.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          No genre data available yet.
        </Typography>
      ) : (
        <Box>
          {/* Vertical Bar Chart Canvas */}
          <Box className={styles.chartCanvas}>
            {topGenres.map((item, idx) => {
              const heightPercent = Math.max((item.count / maxGenreCount) * 100, 15);
              const gradient = BAR_GRADIENTS[idx % BAR_GRADIENTS.length];

              return (
                <Box key={item.genre} className={styles.barColumn}>
                  {/* Number on top of bar */}
                  <Box className={styles.barValuePill}>{item.count}</Box>
                  <Box className={styles.barTrack}>
                    <Box
                      className={styles.verticalBar}
                      style={{
                        height: `${heightPercent}%`,
                        background: gradient,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* X-Axis Genre Labels */}
          <Box className={styles.xAxisLabels}>
            {topGenres.map((item) => (
              <Box key={item.genre} className={styles.xAxisCol}>
                <Typography className={styles.xLabelText} title={item.genre}>
                  {item.genre}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
};
