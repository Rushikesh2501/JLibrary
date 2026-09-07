import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import styles from './BookFilters.module.css';

interface BookFiltersProps {
  genres: string[];
  sections: string[];
  selectedGenre: string;
  selectedSection: string;
  selectedAvailability: string;
  onGenreChange: (genre: string) => void;
  onSectionChange: (section: string) => void;
  onAvailabilityChange: (availability: string) => void;
}

export const BookFilters: React.FC<BookFiltersProps> = ({
  genres,
  sections,
  selectedGenre,
  selectedSection,
  selectedAvailability,
  onGenreChange,
  onSectionChange,
  onAvailabilityChange,
}) => {
  return (
    <Box className={styles.filterContainer}>
      <FormControl size="small" className={styles.formControl}>
        <InputLabel id="genre-filter-label" sx={{ color: 'var(--text-muted)' }}>
          Genre
        </InputLabel>
        <Select
          labelId="genre-filter-label"
          id="genre-filter"
          value={selectedGenre}
          label="Genre"
          onChange={(e) => onGenreChange(e.target.value)}
          className={styles.selectField}
        >
          <MenuItem value="ALL">All Genres</MenuItem>
          {genres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" className={styles.formControl}>
        <InputLabel id="availability-filter-label" sx={{ color: 'var(--text-muted)' }}>
          Availability
        </InputLabel>
        <Select
          labelId="availability-filter-label"
          id="availability-filter"
          value={selectedAvailability}
          label="Availability"
          onChange={(e) => onAvailabilityChange(e.target.value)}
          className={styles.selectField}
        >
          <MenuItem value="ALL">All Statuses</MenuItem>
          <MenuItem value="Available">Available</MenuItem>
          <MenuItem value="Borrowed">Borrowed</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" className={styles.formControl}>
        <InputLabel id="section-filter-label" sx={{ color: 'var(--text-muted)' }}>
          Section / Shelf
        </InputLabel>
        <Select
          labelId="section-filter-label"
          id="section-filter"
          value={selectedSection}
          label="Section / Shelf"
          onChange={(e) => onSectionChange(e.target.value)}
          className={styles.selectField}
        >
          <MenuItem value="ALL">All Sections</MenuItem>
          {sections.map((section) => (
            <MenuItem key={section} value={section}>
              Shelf {section}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};



