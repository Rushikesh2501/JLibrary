import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CropIcon from '@mui/icons-material/Crop';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import { ImageCropModal } from '../common/ImageCropModal';
import styles from './AddMemberModal.module.css';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    user_name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    profile_pic_url?: string;
  }) => Promise<void>;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedAvatarUrl, setCroppedAvatarUrl] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<{
    userName?: boolean;
    email?: boolean;
    phone?: boolean;
    city?: boolean;
    state?: boolean;
  }>({});

  const handleReset = () => {
    setUserName('');
    setEmail('');
    setPhone('');
    setCity('');
    setState('');
    setRawImageSrc(null);
    setCroppedAvatarUrl(null);
    setIsCropModalOpen(false);
    setIsDragActive(false);
    setTouched({});
    setSubmitting(false);
  };

  const handleClose = () => {
    if (!submitting) {
      handleReset();
      onClose();
    }
  };

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setRawImageSrc(null);
    setCroppedAvatarUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isNameValid = userName.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = phone.trim().replace(/\D/g, '').length >= 10;
  const isCityValid = city.trim().length > 0;
  const isStateValid = state.trim().length > 0;

  // Determine missing mandatory fields for dynamic tooltip
  const missingFields: string[] = [];
  if (!isNameValid) missingFields.push('Full Name');
  if (!isEmailValid) {
    missingFields.push(email.trim() ? 'Valid Email' : 'Email Address');
  }
  if (!isPhoneValid) {
    missingFields.push(phone.trim() ? '10-digit Phone' : 'Phone Number');
  }
  if (!isCityValid) missingFields.push('City');
  if (!isStateValid) missingFields.push('State');

  const isFormValid = missingFields.length === 0;

  const tooltipMessage = !isFormValid
    ? `Mandatory fields required: ${missingFields.join(', ')}`
    : 'Click to add member';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit({
        user_name: userName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        country: 'India',
        profile_pic_url: croppedAvatarUrl || undefined,
      });
      handleClose();
    } catch (err) {
      console.error('Error adding member:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { className: styles.dialogPaper } }}
      >
        <DialogTitle className={styles.dialogTitle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PersonAddAlt1Icon style={{ color: 'var(--primary-forest)' }} />
            <span>Add New Member</span>
          </div>
          <IconButton
            onClick={handleClose}
            size="small"
            disabled={submitting}
            className={styles.closeButton}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent className={styles.dialogContent}>
            {/* Profile Photo (Drag & Drop + Crop) */}
            <div className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>
                Profile Photo
              </Typography>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div
                className={`${styles.avatarDropArea} ${isDragActive ? styles.dragActive : ''} ${
                  croppedAvatarUrl ? styles.uploadedAvatarArea : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
                onClick={() => {
                  if (!croppedAvatarUrl) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {croppedAvatarUrl ? (
                  <div className={styles.avatarPreviewRow}>
                    <Avatar
                      src={croppedAvatarUrl}
                      className={styles.avatarPreviewThumb}
                    />
                    <div className={styles.avatarMeta}>
                      <Typography className={styles.avatarUploadedText}>
                        ✓ Profile photo attached
                      </Typography>
                      <div className={styles.avatarActionBtns}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CropIcon fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCropModalOpen(true);
                          }}
                          className={styles.cropBtn}
                        >
                          Adjust Crop
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DeleteOutlineIcon fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto();
                          }}
                          className={styles.removeBtn}
                        >
                          Remove
                        </Button>

                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.avatarEmptyDrop}>
                    <CloudUploadOutlinedIcon className={styles.uploadCloudIcon} />
                    <Typography className={styles.dragDropText}>
                      Drag & drop profile photo or <span className={styles.browseLink}>Browse</span>
                    </Typography>
                    <Typography className={styles.fileHintText}>
                      Supports JPG, PNG, WEBP (Square 1:1 ratio)
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>
                Full Name <span className={styles.requiredStar}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="e.g. Akshay More"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, userName: true }))}
                error={touched.userName && !isNameValid}
                helperText={touched.userName && !isNameValid ? 'Full name is required' : ''}
                className={styles.inputField}
              />
            </div>

            {/* Email Address */}
            <div className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>
                Email Address <span className={styles.requiredStar}>*</span>
              </Typography>
              <TextField
                fullWidth
                type="email"
                size="small"
                variant="outlined"
                placeholder="e.g. sneha.joshi@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                error={touched.email && !isEmailValid}
                helperText={
                  touched.email && !isEmailValid
                    ? email.trim()
                      ? 'Please enter a valid email address'
                      : 'Email address is mandatory'
                    : ''
                }
                className={styles.inputField}
              />
            </div>

            {/* Phone Number */}
            <div className={styles.fieldGroup}>
              <Typography className={styles.fieldLabel}>
                Phone Number <span className={styles.requiredStar}>*</span>
              </Typography>
              <TextField
                fullWidth
                type="tel"
                size="small"
                variant="outlined"
                placeholder="e.g. 9876543203"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                error={touched.phone && !isPhoneValid}
                helperText={
                  touched.phone && !isPhoneValid
                    ? phone.trim()
                      ? 'Enter a valid phone number (at least 10 digits)'
                      : 'Phone number is mandatory'
                    : ''
                }
                className={styles.inputField}
              />
            </div>

            {/* City & State */}
            <div className={styles.rowInputs}>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <Typography className={styles.fieldLabel}>
                  City <span className={styles.requiredStar}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, city: true }))}
                  error={touched.city && !isCityValid}
                  helperText={touched.city && !isCityValid ? 'City is mandatory' : ''}
                  className={styles.inputField}
                />
              </div>

              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <Typography className={styles.fieldLabel}>
                  State <span className={styles.requiredStar}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, state: true }))}
                  error={touched.state && !isStateValid}
                  helperText={touched.state && !isStateValid ? 'State is mandatory' : ''}
                  className={styles.inputField}
                />
              </div>
            </div>
          </DialogContent>

          <DialogActions className={styles.dialogActions}>
            <Button
              onClick={handleClose}
              disabled={submitting}
              variant="outlined"
              className={styles.cancelButton}
            >
              Cancel
            </Button>

            <Tooltip title={tooltipMessage} arrow placement="top">
              <span className={styles.submitButtonWrapper}>
                <Button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  variant="contained"
                  className={styles.submitButton}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {submitting ? 'Adding...' : 'Add Member'}
                </Button>
              </span>
            </Tooltip>
          </DialogActions>
        </form>
      </Dialog>

      {/* Interactive Crop Modal for Avatar */}
      {rawImageSrc && (
        <ImageCropModal
          open={isCropModalOpen}
          imageSrc={rawImageSrc}
          onClose={() => setIsCropModalOpen(false)}
          onCropSave={(croppedUrl) => {
            setCroppedAvatarUrl(croppedUrl);
            setIsCropModalOpen(false);
          }}
          onImageSrcChange={(newSrc) => setRawImageSrc(newSrc)}
          aspectRatio={1}
        />
      )}
    </>
  );
};



