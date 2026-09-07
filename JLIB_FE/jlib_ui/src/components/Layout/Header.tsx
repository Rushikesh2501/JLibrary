import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  onToggleMobileDrawer: () => void;
  bookCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ title, onToggleMobileDrawer, bookCount }) => {
  return (
    <Box className={styles.headerBar}>
      <Box className={styles.leftSection}>
        <IconButton
          className={styles.menuButton}
          onClick={onToggleMobileDrawer}
          sx={{ display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" className={styles.pageTitle}>
          {title}
        </Typography>
      </Box>
    </Box>
  );
};
