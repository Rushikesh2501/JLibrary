import React from 'react';
import { Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import styles from './BackButton.module.css';

interface BackButtonProps {
  label?: string;
  onClick: () => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back to Collection',
  onClick,
  className,
}) => {
  return (
    <Button
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={onClick}
      className={`${styles.backButton} ${className || ''}`}
    >
      {label}
    </Button>
  );
};
