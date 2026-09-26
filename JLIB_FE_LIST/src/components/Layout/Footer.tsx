import React from 'react';
import styles from './Footer.module.css';

interface FooterProps {
  totalBooks: number;
}

export const Footer: React.FC<FooterProps> = ({ totalBooks }) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>JLibrary Collection</div>
        <p className={styles.note}>
          Dedicated public library catalog for browsing, searching, and viewing collection
          details. This viewer is strictly read-only ({totalBooks} indexed titles).
        </p>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} JLibrary. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
