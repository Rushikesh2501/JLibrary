import React, { useState, useCallback, useEffect, useRef } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import {
  Dialog,
  DialogContent,
  Typography,
  Slider,
  Button,
  IconButton,
  CircularProgress,
  Box,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import CheckIcon from '@mui/icons-material/Check';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropSave: (croppedDataUrl: string) => void;
  onImageSrcChange?: (newImageDataUrl: string) => void;
  aspectRatio?: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function calculateRotatedSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = calculateRotatedSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas bounds to fit rotated image
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Rotate around center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Read cropped portion
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Resize canvas to final cropped dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw cropped image
  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  imageSrc,
  onClose,
  onCropSave,
  onImageSrcChange,
  aspectRatio = 13 / 18, // Default portrait book cover ratio (130px / 180px)
}) => {
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentSrc(imageSrc);
  }, [imageSrc]);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newSrc = event.target.result as string;
          setCurrentSrc(newSrc);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setRotation(0);
          onImageSrcChange?.(newSrc);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleApply = async () => {
    if (!croppedAreaPixels || !currentSrc) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        currentSrc,
        croppedAreaPixels,
        rotation
      );
      onCropSave(croppedImage);
      onClose();
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          className: styles.dialogPaper,
        },
      }}
    >
      <div className={styles.modalHeader}>
        <Typography className={styles.modalTitle}>Crop & Adjust Cover Photo</Typography>
        <IconButton onClick={onClose} disabled={isProcessing} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent sx={{ p: 0 }}>
        <div className={styles.cropperContainer}>
          {currentSrc && (
            <Cropper
              image={currentSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </div>

        <div className={styles.controlsArea}>
          <div className={styles.sliderRow}>
            <Typography className={styles.controlLabel}>Zoom</Typography>
            <ZoomOutIcon className={styles.zoomIcon} />
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(_e, newZoom) => setZoom(newZoom as number)}
              sx={{
                color: 'var(--primary-forest, #1b4332)',
                '& .MuiSlider-thumb': {
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                },
              }}
            />
            <ZoomInIcon className={styles.zoomIcon} />
          </div>
        </div>

        <div className={styles.actionButtonsRow}>
          <Box className={styles.leftActions}>
            <Tooltip title="Change Photo" arrow>
              <Button
                startIcon={<PhotoCameraOutlinedIcon fontSize="small" />}
                onClick={() => fileInputRef.current?.click()}
                className={styles.changePhotoBtn}
                disabled={isProcessing}
                aria-label="Change Photo"
              >
                <span className={styles.btnText}>Change Photo</span>
              </Button>
            </Tooltip>
            <Tooltip title="Rotate 90°" arrow>
              <Button
                startIcon={<RotateRightIcon fontSize="small" />}
                onClick={handleRotate}
                className={styles.rotateBtn}
                disabled={isProcessing}
                aria-label="Rotate 90°"
              >
                <span className={styles.btnText}>Rotate 90°</span>
              </Button>
            </Tooltip>
          </Box>

          <Box className={styles.rightActions}>
            <Tooltip title="Cancel" arrow>
              <Button
                startIcon={<CloseIcon fontSize="small" />}
                onClick={onClose}
                disabled={isProcessing}
                className={styles.cancelBtn}
                aria-label="Cancel"
              >
                <span className={styles.btnText}>Cancel</span>
              </Button>
            </Tooltip>
            <Tooltip title="Set Cover" arrow>
              <Button
                variant="contained"
                onClick={handleApply}
                disabled={isProcessing}
                className={styles.applyBtn}
                aria-label="Set Cover"
                startIcon={
                  isProcessing ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CheckIcon fontSize="small" />
                  )
                }
              >
                <span className={styles.btnText}>
                  {isProcessing ? 'Cropping...' : 'Set Cover'}
                </span>
              </Button>
            </Tooltip>
          </Box>

          {/* Hidden File Input for Changing Photo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;
