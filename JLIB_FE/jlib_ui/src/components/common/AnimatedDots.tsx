import React from 'react';
import styles from './AnimatedDots.module.css';

export const AnimatedDots: React.FC = () => {
  return (
    <span className={styles.dotsContainer}>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
      <span className={styles.dot}>.</span>
    </span>
  );
};
