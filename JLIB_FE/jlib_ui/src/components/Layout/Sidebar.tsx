import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
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
  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
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
        <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
          JLibrary v1.0 • Catalog System
        </Typography>
      </Box>
    </Box>
  );
};
