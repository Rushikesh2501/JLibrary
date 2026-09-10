import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  TextField,
  InputAdornment,
  Typography,
  Button,
  Box,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import AddIcon from '@mui/icons-material/Add';
import { IUserInfo } from '../../interfaces/user-interface/iuserinfo';
import { getUsers, createUser, getUserAvatarUrl } from '../../services/userService';
import { MemberProfileView } from './MemberProfileView';
import { AddMemberModal } from './AddMemberModal';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { PaginationBar } from '../common/PaginationBar';
import styles from './Members.module.css';

const fallbackGradients = [
  'linear-gradient(135deg, #1b4332 0%, #2d5a27 100%)',
  'linear-gradient(135deg, #3d2b1f 0%, #594132 100%)',
  'linear-gradient(135deg, #2b3a4a 0%, #1e2936 100%)',
  'linear-gradient(135deg, #5c3a21 0%, #8a5732 100%)',
  'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
];

interface MemberCardProps {
  user: IUserInfo;
  bgGradient: string;
  onClick: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ user, bgGradient, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const picUrl = getUserAvatarUrl(user);

  useEffect(() => {
    setImgError(false);
  }, [user.profile_pic_url, user.avatar_url]);

  return (
    <Card className={styles.bookCard} onClick={onClick} elevation={0}>
      {/* Left: Thumbnail Cover */}
      <Box className={styles.coverWrapper}>
        {picUrl && !imgError ? (
          <img
            src={picUrl}
            alt={user.user_name}
            className={styles.coverImage}
            onError={() => setImgError(true)}
          />
        ) : (
          <Box className={styles.fallbackCover} style={{ background: bgGradient }}>
            <Box className={styles.coverSpine} />
            <PersonOutlinedIcon className={styles.coverIcon} />
            <Typography className={styles.fallbackTitle}>
              {user.user_name}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right: Member Details & Badges */}
      <Box className={styles.cardContent}>
        <Box className={styles.mainInfo}>
          <Typography variant="h6" className={styles.bookTitle} title={user.user_name}>
            {user.user_name}
          </Typography>

          <Typography variant="body2" className={styles.authorYear}>
            {user.user_id}{user.city ? ` · ${user.city}${user.state ? `, ${user.state}` : ''}` : ''}
          </Typography>
        </Box>

        <Box className={styles.pillRow}>
          <span className={styles.statusPill}>Active</span>
          <span className={styles.ownedPill}>{user.user_id}</span>
          <span className={styles.langPill}>{(user.city || 'Member').toUpperCase()}</span>
          <Button
            size="small"
            className={styles.summaryBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Profile
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export const Members: React.FC = () => {
  const [users, setUsers] = useState<IUserInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('ASCENDING');
  const [selectedUser, setSelectedUser] = useState<IUserInfo | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Pagination state (10 members per page)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

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

  const handleAddMember = async (userData: {
    user_name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    profile_pic_url?: string;
  }) => {
    const created = await createUser(userData);
    setUsers((prev) => [created, ...prev]);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortBy('ASCENDING');
  };

  const isFilterActive = Boolean(searchQuery.trim() || sortBy !== 'ASCENDING');

  // Filter & sort members
  const filteredAndSortedUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = users.filter((u) => {
      if (!q) return true;
      return (
        u.user_name.toLowerCase().includes(q) ||
        u.user_id.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'ASCENDING' || sortBy === 'DEFAULT') {
      result.sort((a, b) => a.user_name.localeCompare(b.user_name, 'en', { sensitivity: 'base', numeric: true }));
    } else if (sortBy === 'DESCENDING') {
      result.sort((a, b) => b.user_name.localeCompare(a.user_name, 'en', { sensitivity: 'base', numeric: true }));
    } else if (sortBy === 'DATE_ADDED') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'USER_ID') {
      result.sort((a, b) => a.user_id.localeCompare(b.user_id, undefined, { numeric: true }));
    }

    return result;
  }, [users, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedUsers, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>
      {selectedUser ? (
        /* In-Page Facebook Style Profile View */
        <MemberProfileView
          user={selectedUser}
          onBack={handleBackToList}
          onUpdate={(updated) => {
            setSelectedUser(updated);
            setUsers((prev) => prev.map((u) => (u.user_id === updated.user_id ? updated : u)));
          }}
        />
      ) : (
        /* Members Directory List View */
        <>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <div className={styles.headerLeft}>
              <Typography variant="h4" className={styles.title}>
                Library Members
              </Typography>
              <Typography variant="body1" className={styles.subtitle}>
                Browse directory of registered members and view member profiles
              </Typography>
            </div>

            <div className={styles.headerRight}>
              <div className={styles.totalMemberBadge}>
                {users.length} {users.length === 1 ? 'Member' : 'Members'}
              </div>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddModalOpen(true)}
                className={styles.addMemberTopButton}
              >
                Add Member
              </Button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <Box className={styles.toolbarRow}>
            <Paper className={styles.toolbarPaper} elevation={0}>
              <Box sx={{ width: '100%', flex: { lg: 1 } }}>
                <TextField
                  placeholder="Search members by Name, User ID (e.g. JL-01), or City..."
                  variant="outlined"
                  size="small"
                  fullWidth
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
              </Box>

              <Box sx={{ width: { xs: '100%', lg: 'auto' }, flexShrink: 0 }}>
                <Box className={styles.filterContainer}>
                  <FormControl size="small" className={styles.formControl}>
                    <InputLabel id="member-sort-label" sx={{ color: 'var(--text-muted)' }}>
                      Sort By
                    </InputLabel>
                    <Select
                      labelId="member-sort-label"
                      id="member-sort"
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value === 'DEFAULT' ? 'ASCENDING' : e.target.value)}
                      className={styles.selectField}
                    >
                      <MenuItem value="DEFAULT">Reset</MenuItem>
                      <MenuItem value="ASCENDING">A-Z</MenuItem>
                      <MenuItem value="DESCENDING">Z-A</MenuItem>
                      <MenuItem value="DATE_ADDED">Date Added</MenuItem>
                      <MenuItem value="USER_ID">Member ID</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    disabled={!isFilterActive}
                    onClick={handleClearFilters}
                    startIcon={<FilterAltOffIcon fontSize="small" />}
                    className={styles.clearButton}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Content Rendering States */}
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchUsersData} />
          ) : filteredAndSortedUsers.length === 0 ? (
            <EmptyState
              title="No Members Found"
              subtitle={
                searchQuery
                  ? `No members found matching "${searchQuery}". Try a different search term.`
                  : 'There are currently no registered library members.'
              }
            />
          ) : (
            <>
              <div className={styles.userGrid}>
                {paginatedUsers.map((user) => {
                  const numericId = parseInt(user.user_id.replace(/\D/g, ''), 10) || 1;
                  const bgGradient = fallbackGradients[numericId % fallbackGradients.length];

                  return (
                    <MemberCard
                      key={user.user_id}
                      user={user}
                      bgGradient={bgGradient}
                      onClick={() => handleCardClick(user)}
                    />
                  );
                })}
              </div>
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </>
      )}



      {/* Add Member Modal */}
      <AddMemberModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMember}
      />
    </div>
  );

};

export default Members;