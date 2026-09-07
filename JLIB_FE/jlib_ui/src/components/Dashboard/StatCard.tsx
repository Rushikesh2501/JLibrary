import React from 'react';
import { Card, Box, Typography, Chip } from '@mui/material';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, badgeText }) => {
  return (
    <Card className={styles.card} elevation={0}>
      <Box className={styles.contentBox}>
        <Typography variant="caption" className={styles.label}>
          {title}
        </Typography>
        <Typography variant="h4" className={styles.value}>
          {value}
        </Typography>
        {badgeText && <Chip label={badgeText} size="small" className={styles.badge} />}
      </Box>
      <Box className={styles.iconWrapper}>{icon}</Box>
    </Card>
  );
};
