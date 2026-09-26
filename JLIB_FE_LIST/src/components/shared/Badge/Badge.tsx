import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'gold'
  | 'neutral'
  | 'outline';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const variantClass =
    variant === 'success'
      ? styles.variantSuccess
      : variant === 'warning'
      ? styles.variantWarning
      : variant === 'danger'
      ? styles.variantDanger
      : variant === 'primary'
      ? styles.variantPrimary
      : variant === 'gold'
      ? styles.variantGold
      : variant === 'outline'
      ? styles.variantOutline
      : styles.variantNeutral;

  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  return (
    <span className={`${styles.badge} ${variantClass} ${sizeClass} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
