import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius,
  circle = false,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className}`}
      style={{
        width,
        height,
        borderRadius: borderRadius || (circle ? '50%' : undefined),
        ...style,
      }}
    />
  );
};
