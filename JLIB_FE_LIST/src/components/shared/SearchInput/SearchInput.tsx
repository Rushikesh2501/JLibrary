import React from 'react';
import { Search, X } from 'lucide-react';
import styles from './SearchInput.module.css';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search by title, Marathi title, author, book ID, genre...',
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <span className={styles.searchIcon}>
        <Search size={18} />
      </span>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange('')}
          title="Clear search"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
