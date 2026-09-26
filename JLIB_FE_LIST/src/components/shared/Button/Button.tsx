import React from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  rightIcon,
  className = '',
  ...props
}) => {
  const variantClass =
    variant === 'primary'
      ? styles.variantPrimary
      : variant === 'secondary'
      ? styles.variantSecondary
      : variant === 'outline'
      ? styles.variantOutline
      : variant === 'ghost'
      ? styles.variantGhost
      : styles.variantGold;

  const sizeClass =
    size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  return (
    <button
      className={`${styles.button} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
      {rightIcon && <span style={{ display: 'inline-flex' }}>{rightIcon}</span>}
    </button>
  );
};
