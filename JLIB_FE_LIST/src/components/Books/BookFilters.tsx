import React from 'react';
import { Search, X, ChevronDown, FilterX } from 'lucide-react';
import type { SortOption } from '../../interfaces/book.interface';
import styles from './BookFilters.module.css';

interface BookFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  languagesList: string[];
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const BookFilters: React.FC<BookFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedLanguage,
  onLanguageChange,
  languagesList,
  sortOption,
  onSortChange,
  onResetFilters,
  hasActiveFilters,
}) => {
  return (
    <div className={styles.toolbarPaper}>
      {/* 1. Search Bar */}
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>
          <Search size={18} />
        </span>
        <input
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your library (title, book ID, author, genre)..."
        />
        {searchQuery && (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={() => onSearchChange('')}
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 2. Controls Group (Language Dropdown, Sort By Dropdown, Clear Filters Button) */}
      <div className={styles.controlsGroup}>
        {/* Language Dropdown with floating label */}
        <div className={styles.selectWrapper}>
          <label className={styles.floatingLabel}>Language</label>
          <select
            className={styles.selectField}
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
          >
            <option value="all">All Languages</option>
            {languagesList.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className={styles.selectChevron} />
        </div>

        {/* Sort By Dropdown with floating label */}
        <div className={styles.selectWrapper}>
          <label className={styles.floatingLabel}>Sort By</label>
          <select
            className={styles.selectField}
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
          >
            <option value="title-asc">A-Z</option>
            <option value="title-desc">Z-A</option>
            <option value="date-added">Date Added</option>
            <option value="date-modified">Date Modified</option>
            <option value="borrowed-desc">Most Borrowed</option>
            <option value="id-asc">Book ID (Asc)</option>
            <option value="id-desc">Book ID (Desc)</option>
            <option value="year-desc">Published Year</option>
          </select>
          <ChevronDown size={16} className={styles.selectChevron} />
        </div>

        {/* Clear Filters Button */}
        <button
          type="button"
          className={styles.clearFiltersBtn}
          disabled={!hasActiveFilters}
          onClick={onResetFilters}
          title={hasActiveFilters ? 'Clear all active filters' : 'No filters applied'}
        >
          <FilterX size={16} />
          <span>Clear Filters</span>
        </button>
      </div>
    </div>
  );
};

export default BookFilters;
