import React, { useState, useRef } from 'react';
import {
  Avatar,
  Chip,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { IUserInfo } from '../../interfaces/user-interface/iuserinfo';
import { uploadUserProfilePic, getUserAvatarUrl } from '../../services/userService';
import { ImageCropModal } from '../common/ImageCropModal';
import styles from './MemberProfileView.module.css';

interface MemberProfileViewProps {
  user: IUserInfo;
  onBack: () => void;
  onUpdate?: (updatedUser: IUserInfo) => void;
}

const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  user,
  onBack,
  onUpdate,
}) => {
  const [currentUser, setCurrentUser] = useState<IUserInfo>(user);
  const [isUploading, setIsUploading] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (e.g. JPG, PNG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setRawImageSrc(dataUrl);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  const handleCropSave = async (croppedDataUrl: string) => {
    setIsCropModalOpen(false);
    setIsUploading(true);
    try {
      const file = dataUrlToFile(croppedDataUrl, 'avatar.jpg');
      const uploadedUrl = await uploadUserProfilePic(currentUser.user_id, file);
      const updatedUser: IUserInfo = {
        ...currentUser,
        profile_pic_url: uploadedUrl,
      };
      setCurrentUser(updatedUser);
      onUpdate?.(updatedUser);
    } catch (err) {
      console.error('Failed to upload user avatar to Supabase storage:', err);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
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
    <div className={styles.profileContainer}>
      {/* Top Left Back Button */}
      <div className={styles.backButtonRow}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          className={styles.backButton}
        >
          Back to Members List
        </Button>
      </div>

      {/* Main Profile Canvas Card */}
      <div className={styles.profileCard}>
        {/* Facebook Style Cover Header */}
        <div className={styles.coverContainer}>
          <div className={styles.coverPattern} />
          {/* <div className={styles.coverBadge}>JLIB MEMBER PROFILE</div> */}
        </div>

        {/* Profile Avatar & Header Details */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <Avatar
              className={styles.avatar}
              src={getUserAvatarUrl(currentUser)}
            >
              {getInitials(currentUser.user_name)}
            </Avatar>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <Tooltip title="Upload Profile Picture" arrow>
              <button
                type="button"
                className={styles.avatarUploadBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <CircularProgress size={16} style={{ color: '#ffffff' }} />
                ) : (
                  <PhotoCameraIcon style={{ fontSize: 18, color: '#ffffff' }} />
                )}
              </button>
            </Tooltip>
          </div>

          <div className={styles.userNameRow}>
            <span className={styles.userName}>{currentUser.user_name}</span>
            <Chip
              label={currentUser.user_id}
              size="small"
              className={styles.userIdChip}
            />
          </div>

          <div className={styles.userBio}>
            Library Member • Joined {formatDate(currentUser.created_at)}
          </div>
        </div>

        <Divider style={{ margin: '0 32px 28px 32px' }} />

        {/* Details Grid Section */}
        <div className={styles.contentBody}>
          <h3 className={styles.sectionTitle}>Profile Details</h3>
          <div className={styles.infoGrid}>
            <Tooltip title={`Email: ${user.email || 'N/A'}`} arrow placement="top">
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <EmailOutlinedIcon fontSize="small" />
                </div>
                <div className={styles.infoTextWrapper}>
                  <div className={styles.infoLabel}>Email Address</div>
                  <div className={styles.infoValue}>{user.email || 'N/A'}</div>
                </div>
              </div>
            </Tooltip>

            <Tooltip title={`Phone: ${user.phone || 'N/A'}`} arrow placement="top">
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <PhoneOutlinedIcon fontSize="small" />
                </div>
                <div className={styles.infoTextWrapper}>
                  <div className={styles.infoLabel}>Phone Number</div>
                  <div className={styles.infoValue}>{user.phone || 'N/A'}</div>
                </div>
              </div>
            </Tooltip>

            <Tooltip title={`Location: ${formattedLocation || 'N/A'}`} arrow placement="top">
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <LocationOnOutlinedIcon fontSize="small" />
                </div>
                <div className={styles.infoTextWrapper}>
                  <div className={styles.infoLabel}>Location</div>
                  <div className={styles.infoValue}>{formattedLocation || 'N/A'}</div>
                </div>
              </div>
            </Tooltip>
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

      {/* Image Crop Modal */}
      {rawImageSrc && (
        <ImageCropModal
          open={isCropModalOpen}
          imageSrc={rawImageSrc}
          onClose={() => setIsCropModalOpen(false)}
          onCropSave={handleCropSave}
          onImageSrcChange={(newSrc) => setRawImageSrc(newSrc)}
          aspectRatio={1}
        />
      )}
    </div>
  );
};

export default MemberProfileView;
