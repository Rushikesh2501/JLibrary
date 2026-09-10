import React, { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  InputAdornment,
  Avatar,
  Chip,
  Typography,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IUserInfo } from '../../interfaces/user-interface/iuserinfo';
import { getUsers } from '../../services/userService';
import { MemberProfileView } from './MemberProfileView';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import styles from './Members.module.css';

export const Members: React.FC = () => {
  const [users, setUsers] = useState<IUserInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<IUserInfo | null>(null);

  const fetchUsersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load library members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  const handleCardClick = (user: IUserInfo) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filter users by name, user_id, email, or city
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.user_name.toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className={styles.container}>
      {selectedUser ? (
        /* In-Page Facebook Style Profile View */
        <MemberProfileView
          user={selectedUser}
          onBack={handleBackToList}
        />
      ) : (
        /* Members Directory List View */
        <>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <Typography variant="h4" className={styles.title}>
              Library Members
            </Typography>
            <Typography variant="body1" className={styles.subtitle}>
              Browse directory of registered members and view member profiles
            </Typography>
          </div>

          {/* Search & Filter Toolbar */}
          <div className={styles.toolbarRow}>
            <Paper className={styles.toolbarPaper} elevation={0}>
              <TextField
                placeholder="Search members by Name, User ID (e.g. JL-01), or City..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchField}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon style={{ color: 'var(--text-muted)' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <div className={styles.toolbarActions}>
                <div className={styles.memberCountBadge}>
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'Member' : 'Members'}
                </div>

                <Button
                  variant="outlined"
                  disabled={!searchQuery.trim()}
                  onClick={() => setSearchQuery('')}
                  startIcon={<FilterAltOffIcon fontSize="small" />}
                  className={styles.clearButton}
                >
                  Clear Filters
                </Button>
              </div>
            </Paper>
          </div>

          {/* Content Rendering States */}
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchUsersData} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No Members Found"
              subtitle={
                searchQuery
                  ? `No members found matching "${searchQuery}". Try a different search term.`
                  : 'There are currently no registered library members.'
              }
            />
          ) : (
            <div className={styles.userGrid}>
              {filteredUsers.map((user) => (
                <div
                  key={user.user_id}
                  className={styles.userCard}
                  onClick={() => handleCardClick(user)}
                >
                  <Avatar className={styles.avatar}>
                    {getInitials(user.user_name)}
                  </Avatar>

                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.user_name}</div>
                    <div className={styles.userMeta}>
                      <Chip
                        label={user.user_id}
                        size="small"
                        className={styles.userIdChip}
                      />
                      {user.city && (
                        <span className={styles.locationText}>
                          • {user.city}{user.state ? `, ${user.state}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRightIcon className={styles.arrowIcon} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Members;