import React from 'react';
import {
  Avatar,
  Chip,
  IconButton,
  // Button,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { IUserInfo } from '../../interfaces/user-interface/iuserinfo';
import styles from './MemberProfileModal.module.css';

interface MemberProfileModalProps {
  user: IUserInfo | null;
  open: boolean;
  onClose: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  user,
  open,
  onClose,
}) => {
  if (!open || !user) return null;

  // Formatting date string nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
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

  const formattedLocation = [user.city, user.state, user.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <IconButton
          className={styles.closeButton}
          onClick={onClose}
          aria-label="close"
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Facebook Style Cover Header */}
        <div className={styles.coverContainer}>
          <div className={styles.coverPattern} />
          {/* <div className={styles.coverBadge}>JLIB MEMBER PROFILE</div> */}
        </div>

        {/* Profile Avatar & Header Details */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <Avatar className={styles.avatar}>
              {getInitials(user.user_name)}
            </Avatar>
          </div>

          <div className={styles.userNameRow}>
            <span className={styles.userName}>{user.user_name}</span>
            <Chip
              label={user.user_id}
              size="small"
              className={styles.userIdChip}
            />
          </div>

          <div className={styles.userBio}>
            Library Member • Joined {formatDate(user.created_at)}
          </div>
        </div>

        <Divider style={{ margin: '0 28px 24px 28px' }} />

        {/* Details Grid Section */}
        <div className={styles.contentBody}>
          <h3 className={styles.sectionTitle}>Profile Details</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <EmailOutlinedIcon fontSize="small" />
              </div>
              <div>
                <div className={styles.infoLabel}>Email Address</div>
                <div className={styles.infoValue}>{user.email || 'N/A'}</div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <PhoneOutlinedIcon fontSize="small" />
              </div>
              <div>
                <div className={styles.infoLabel}>Phone Number</div>
                <div className={styles.infoValue}>{user.phone || 'N/A'}</div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <LocationOnOutlinedIcon fontSize="small" />
              </div>
              <div>
                <div className={styles.infoLabel}>Location</div>
                <div className={styles.infoValue}>{formattedLocation || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Borrowed Books Section */}
          <div className={styles.borrowedSection}>
            <div className={styles.borrowedHeader}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <MenuBookOutlinedIcon fontSize="small" /> Borrowed Books
              </h3>
              <span className={styles.borrowedBadge}>0 Books</span>
            </div>

            <div className={styles.emptyState}>
              <MenuBookOutlinedIcon className={styles.emptyIcon} />
              <div className={styles.emptyText}>No Books Currently Borrowed</div>
              <div className={styles.emptySubtext}>
                When this member borrows books from the library, they will be listed here.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfileModal;
