import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import styles from './BookFilters.module.css';

interface BookFiltersProps {
  sortBy: string;
  isFilterActive: boolean;
  onSortChange: (sortBy: string) => void;
  onClearFilters: () => void;
}

export const BookFilters: React.FC<BookFiltersProps> = ({
  sortBy,
  isFilterActive,
  onSortChange,
  onClearFilters,
}) => {
  return (
    <Box className={styles.filterContainer}>
      <FormControl size="small" className={styles.formControl}>
        <InputLabel id="sort-filter-label" sx={{ color: 'var(--text-muted)' }}>
          Sort By
        </InputLabel>
        <Select
          labelId="sort-filter-label"
          id="sort-filter"
          value={sortBy}
          label="Sort By"
          onChange={(e) => onSortChange(e.target.value)}
          className={styles.selectField}
        >
          <MenuItem value="DEFAULT">Reset</MenuItem>
          <MenuItem value="ASCENDING">A-Z</MenuItem>
          <MenuItem value="DESCENDING">Z-A</MenuItem>
          <MenuItem value="DATE_ADDED">Date Added</MenuItem>
          <MenuItem value="DATE_MODIFIED">Date Modified</MenuItem>
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        disabled={!isFilterActive}
        onClick={onClearFilters}
        startIcon={<FilterAltOffIcon fontSize="small" />}
        className={styles.clearButton}
      >
        Clear Filters
      </Button>
    </Box>
  );
};




