import React, { useState, useRef, useEffect, useMemo } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';
import { matchesAuthor } from '../../utils/authorSearchUtils';
import styles from './AuthorSelectDropdown.module.css';

export interface AuthorItem {
  name: string;
  count: number;
}

interface AuthorSelectDropdownProps {
  authors: AuthorItem[];
  selectedAuthor: string;
  onSelectAuthor: (author: string) => void;
  totalBooksCount?: number;
}

export const AuthorSelectDropdown: React.FC<AuthorSelectDropdownProps> = ({
  authors,
  selectedAuthor,
  onSelectAuthor,
  totalBooksCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter authors with multilingual, transliteration & semantic matching
  const filteredAuthors = useMemo(() => {
    if (!searchQuery.trim()) {
      return authors;
    }
    return authors.filter((a) => matchesAuthor(a.name, searchQuery));
  }, [authors, searchQuery]);

  const handleSelect = (authorName: string) => {
    onSelectAuthor(authorName);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectAuthor('all');
  };

  const isAuthorSelected = selectedAuthor !== 'all' && Boolean(selectedAuthor);

  return (
    <div className={styles.authorDropdownWrapper} ref={wrapperRef}>
      <label className={styles.floatingLabel}>Author</label>

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        className={`${styles.triggerButton} ${isOpen ? styles.triggerButtonActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={`${styles.triggerText} ${isAuthorSelected ? styles.triggerTextSelected : ''}`}
          title={isAuthorSelected ? selectedAuthor : 'All Authors'}
        >
          {isAuthorSelected ? selectedAuthor : 'All Authors'}
        </span>

        <div className={styles.triggerIcons}>
          {isAuthorSelected && (
            <button
              type="button"
              className={styles.clearSelectionBtn}
              onClick={handleClear}
              title="Clear author filter"
              aria-label="Clear author filter"
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </button>
          )}
          <span className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconOpen : ''}`}>
            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
          </span>
        </div>
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className={styles.dropdownPanel} role="listbox">
          {/* Search Header inside Dropdown */}
          <div className={styles.searchHeader}>
            <div className={styles.dropdownSearchBox}>
              <span className={styles.dropdownSearchIcon}>
                <SearchIcon sx={{ fontSize: 16 }} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.dropdownSearchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search author (e.g. white, pandhra, गुहा)..."
                aria-label="Search author name"
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery('')}
                  title="Clear search text"
                  aria-label="Clear search text"
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </button>
              )}
            </div>

            <div className={styles.statusRow}>
              <span>
                {searchQuery.trim()
                  ? `${filteredAuthors.length} matching`
                  : `${authors.length} authors`}
              </span>
              <span
                className={styles.multilingualHint}
                title="Search works in English, Marathi transliteration & Devanagari"
              >
                EN • MR • देव
              </span>
            </div>
          </div>

          {/* List of Authors */}
          <ul className={styles.authorList}>
            {/* 'All Authors' default option */}
            {!searchQuery.trim() && (
              <li
                className={`${styles.authorItem} ${!isAuthorSelected ? styles.authorItemSelected : ''}`}
                onClick={() => handleSelect('all')}
                role="option"
                aria-selected={!isAuthorSelected}
              >
                <div className={styles.authorNameCol}>
                  {!isAuthorSelected ? (
                    <CheckIcon className={styles.checkIcon} />
                  ) : (
                    <PersonIcon className={styles.personIcon} />
                  )}
                  <span>All Authors</span>
                </div>
                {totalBooksCount !== undefined && (
                  <span className={styles.countBadge}>{totalBooksCount}</span>
                )}
              </li>
            )}

            {filteredAuthors.length > 0 ? (
              filteredAuthors.map((author) => {
                const isSelected = selectedAuthor === author.name;
                return (
                  <li
                    key={author.name}
                    className={`${styles.authorItem} ${isSelected ? styles.authorItemSelected : ''}`}
                    onClick={() => handleSelect(author.name)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className={styles.authorNameCol}>
                      {isSelected ? (
                        <CheckIcon className={styles.checkIcon} />
                      ) : (
                        <PersonIcon className={styles.personIcon} />
                      )}
                      <span title={author.name}>{author.name}</span>
                    </div>
                    <span className={styles.countBadge}>{author.count}</span>
                  </li>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateTitle}>No authors found</div>
                <div className={styles.emptyStateDesc}>
                  Try English, transliteration (e.g. "pandhra"), or Devanagari script.
                </div>
              </div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
