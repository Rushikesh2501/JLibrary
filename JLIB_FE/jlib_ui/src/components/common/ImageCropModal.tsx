import React, { useState, useCallback } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import CheckIcon from '@mui/icons-material/Check';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropSave: (croppedDataUrl: string) => void;
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
  aspectRatio = 13 / 18, // Default portrait book cover ratio (130px / 180px)
}) => {
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

  const handleApply = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
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
          {imageSrc && (
            <Cropper
              image={imageSrc}
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
          <Button
            startIcon={<RotateRightIcon />}
            onClick={handleRotate}
            className={styles.rotateBtn}
            disabled={isProcessing}
          >
            Rotate 90°
          </Button>

          <Box className={styles.rightActions}>
            <Button
              onClick={onClose}
              disabled={isProcessing}
              className={styles.cancelBtn}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={isProcessing}
              className={styles.applyBtn}
              startIcon={
                isProcessing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CheckIcon fontSize="small" />
                )
              }
            >
              {isProcessing ? 'Cropping...' : 'Set Cover'}
            </Button>
          </Box>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropModal;
