import React, { useState, useEffect } from 'react';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
import styles from './PaginationBar.module.css';

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers with smart ellipsis windowing
  const getPageNumbers = (): (number | string)[] => {
    const maxVisible = isMobile ? 4 : 7;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    if (isMobile) {
      // Mobile: compact layout
      if (currentPage <= 2) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 1) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    } else {
      // Desktop: broader window
      if (currentPage <= 4) {
        for (let i = 1; i <= Math.min(5, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > 6) pages.push('...');
        if (totalPages > 5) pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav aria-label="Pagination Navigation" className={`${styles.paginationWrapper} ${className}`}>
      <div className={styles.paginationContainer}>
        {/* Previous Button */}
        <button
          type="button"
          aria-label="Previous Page"
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={`${styles.arrowButton} ${styles.prev}`}
        >
          <WestIcon fontSize="small" />
        </button>

        {/* Page Numbers */}
        <div className={styles.numbersList}>
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                  &hellip;
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onPageChange(pageNum)}
                className={`${styles.pageItem} ${isActive ? styles.active : ''}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          aria-label="Next Page"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`${styles.arrowButton} ${styles.next}`}
        >
          <EastIcon fontSize="small" />
        </button>
      </div>
    </nav>
  );
};
