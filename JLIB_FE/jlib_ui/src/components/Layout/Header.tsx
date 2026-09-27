import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import styles from './Header.module.css';

interface HeaderProps {
  title: string;
  onToggleMobileDrawer: () => void;
  bookCount?: number;
}

export const CATALOGUE_URL = 'https://jlibrary-catalog.vercel.app/';

export const getCatalogueUrl = (): string => {
  return CATALOGUE_URL;
};

export const Header: React.FC<HeaderProps> = ({ title, onToggleMobileDrawer, bookCount }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getCatalogueUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpen = () => {
    const url = getCatalogueUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box className={styles.headerBar}>
      <Box className={styles.leftSection}>
        <IconButton
          className={styles.menuButton}
          onClick={onToggleMobileDrawer}
          sx={{ display: { md: 'none' } }}
          aria-label="Open navigation menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" className={styles.pageTitle}>
          {title}
        </Typography>
      </Box>

      <Box className={styles.rightSection}>
        <Tooltip title={copied ? 'Catalogue link copied to clipboard!' : 'Copy public catalogue link'} arrow>
          <Button
            className={`${styles.copyLinkBtn} ${copied ? styles.copyLinkBtnCopied : ''}`}
            onClick={handleCopy}
            startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            size="small"
            aria-label={copied ? 'Catalogue link copied' : 'Copy catalogue link'}
          >
            <span className={styles.btnText}>{copied ? 'Copied' : 'Copy Link'}</span>
          </Button>
        </Tooltip>

        <Tooltip title="Open public catalogue in new tab" arrow>
          <Button
            className={styles.openCatalogueBtn}
            onClick={handleOpen}
            endIcon={<OpenInNewIcon fontSize="small" />}
            size="small"
            aria-label="Open catalogue in new tab"
          >
            <span className={styles.btnText}>Open Catalogue</span>
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};
