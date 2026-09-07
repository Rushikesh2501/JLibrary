import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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
        Please ensure the FastAPI service is running at <code>http://127.0.0.1:8000</code> and accessible.
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
