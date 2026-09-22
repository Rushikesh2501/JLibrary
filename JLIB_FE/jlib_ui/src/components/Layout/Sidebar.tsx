import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import appIcon from '../../assets/icon.png';
import styles from './Sidebar.module.css';

export type NavView = 'dashboard' | 'books' | 'members';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onCloseMobileDrawer,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const handleClearCacheAndRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      // 1. Clear Web Storage (localStorage & sessionStorage)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn('Could not clear web storage:', err);
      }

      // 2. Clear Cache Storage API (Service Worker & dynamic asset caches)
      if ('caches' in window) {
        try {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((key) => window.caches.delete(key)));
        } catch (err) {
          console.warn('Could not clear Cache Storage:', err);
        }
      }

      // 3. Unregister active service workers
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((reg) => reg.unregister()));
        } catch (err) {
          console.warn('Could not unregister service workers:', err);
        }
      }

      // 4. Clear IndexedDB if accessible
      if ('indexedDB' in window && typeof window.indexedDB.databases === 'function') {
        try {
          const dbs = await window.indexedDB.databases();
          await Promise.all(
            dbs.map((db) => {
              if (db.name) {
                return new Promise<void>((resolve) => {
                  const req = window.indexedDB.deleteDatabase(db.name!);
                  req.onsuccess = () => resolve();
                  req.onerror = () => resolve();
                  req.onblocked = () => resolve();
                });
              }
              return Promise.resolve();
            })
          );
        } catch (err) {
          console.warn('Could not clear IndexedDB:', err);
        }
      }

      // Preserve active view so user returns to the same page
      try {
        sessionStorage.setItem('currentView', currentView);
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Error while clearing cache:', error);
    } finally {
      // Short delay for visual spinning animation before cache-busting reload
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('_t', Date.now().toString());
        window.location.href = url.toString();
      }, 350);
    }
  };

  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Dashboard',
      icon: <DashboardIcon fontSize="small" />,
    },
    {
      id: 'books' as NavView,
      label: 'Books',
      icon: <MenuBookIcon fontSize="small" />,
    },
    {
      id: 'members' as NavView,
      label: 'Members',
      icon: <PeopleIcon fontSize="small" />,
    },
  ];

  return (
    <Box className={styles.container}>
      <Box className={styles.brandBox}>
        <Box className={styles.brandLogo}>
          <img src={appIcon} alt="JLibrary Icon" className={styles.brandLogoImg} />
        </Box>
        <Box>
          <Typography className={styles.brandTitle}>JLibrary</Typography>
          <Typography className={styles.brandSubtitle}>Library Management System</Typography>
        </Box>
      </Box>

      <Box className={styles.navSection}>
        <List disablePadding>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <ListItemIcon className={styles.navIcon}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { className: styles.navText } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box className={styles.footer}>
        <Box className={styles.footerInfo}>
          <Typography variant="caption" className={styles.footerText}>
            JLibrary v1.0 • Catalog System
          </Typography>
        </Box>
        <Tooltip title="Clear Cache & Refresh" placement="top" arrow>
          <span>
            <IconButton
              size="small"
              className={styles.refreshBtn}
              onClick={handleClearCacheAndRefresh}
              disabled={isRefreshing}
              aria-label="Clear cache and refresh"
            >
              <RefreshIcon
                className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`}
              />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};
