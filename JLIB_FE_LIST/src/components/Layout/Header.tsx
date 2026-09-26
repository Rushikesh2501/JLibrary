import React from 'react';
import appIcon from '../../assets/icon.png';
import styles from './Header.module.css';

interface HeaderProps {
  totalBooks: number;
}

export const Header: React.FC<HeaderProps> = ({ totalBooks }) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img src={appIcon} alt="JLibrary Logo" className={styles.brandLogoImg} />
          </div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>JLibrary</span>
            <span className={styles.brandSubtitle}>Library Management System</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.bookCountPill}>
            <span>{totalBooks} Books</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
