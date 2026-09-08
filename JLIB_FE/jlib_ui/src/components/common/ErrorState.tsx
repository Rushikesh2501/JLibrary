import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { API_BASE_URL } from '../../config/api';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  onRetry,
  message = 'Unable to connect to JLibrary backend.',
}) => {
  return (
    <Paper className={styles.paper} elevation={0}>
      <Box className={styles.badge}>Connection Failed</Box>
      <Typography variant="h6" className={styles.title}>
        {message}
      </Typography>
      <Typography variant="body2" className={styles.subtitle}>
        Please ensure the FastAPI service is running and accessible
        {API_BASE_URL ? (
          <>
            {' '}at <code>{API_BASE_URL}</code>
          </>
        ) : (
          '.'
        )}
      </Typography>
      <Button
        variant="contained"
        startIcon={<RefreshIcon />}
        className={styles.button}
        onClick={onRetry}
      >
        Retry Connection
      </Button>
    </Paper>
  );
};
