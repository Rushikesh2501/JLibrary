import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import styles from './BookSearch.module.css';

interface BookSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const BookSearch: React.FC<BookSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <Box className={styles.searchBox}>
      <TextField
        fullWidth
        placeholder="Search your library (title, author, genre, section)..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.searchField}
        variant="outlined"
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ color: 'var(--text-muted)' }} />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};
