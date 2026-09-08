import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import styles from './BarcodeScannerModal.module.css';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (scannedIsbn: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  open,
  onClose,
  onScanSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const theme = useTheme();
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobileDevice = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  );
  const isMobileView = isMobileBreakpoint || isMobileDevice;

  useEffect(() => {
    if (!open) {
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
      setErrorMsg(null);
      setFacingMode('environment');
      return;
    }

    let isMounted = true;
    let controls: any = null;

    // Explicitly configure barcode formats for ISBNs (EAN_13, EAN_8, CODE_128)
    const hints = new Map();
    const formats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const codeReader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 100,
    });
    codeReaderRef.current = codeReader;
    setErrorMsg(null);

    const startScanner = async () => {
      try {
        // Enumerate devices if available before stream
        let videoInputDevices: MediaDeviceInfo[] = [];
        try {
          videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
          if (isMounted && videoInputDevices && videoInputDevices.length > 0) {
            setDevices(videoInputDevices);
          }
        } catch (e) {
          console.warn('Could not enumerate video devices ahead of stream:', e);
        }

        if (videoRef.current && isMounted) {
          let constraints: MediaStreamConstraints;

          if (isMobileView) {
            constraints = {
              video: {
                facingMode: { ideal: facingMode },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                // @ts-ignore
                advanced: [{ focusMode: 'continuous' }],
              },
            };
          } else {
            const currentDevice =
              videoInputDevices && videoInputDevices.length > 0
                ? videoInputDevices[activeDeviceIndex % videoInputDevices.length]
                : null;
            const selectedDeviceId = currentDevice?.deviceId;
            const isBackCam = currentDevice?.label
              ? currentDevice.label.toLowerCase().includes('back') ||
                currentDevice.label.toLowerCase().includes('rear') ||
                currentDevice.label.toLowerCase().includes('environment')
              : false;

            constraints = {
              video: {
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: isBackCam ? 'environment' : 'user',
                // @ts-ignore
                advanced: [{ focusMode: 'continuous' }],
              },
            };
          }

          controls = await codeReader.decodeFromConstraints(
            constraints,
            videoRef.current,
            (result) => {
              if (result && isMounted) {
                const text = result.getText().trim();
                // Clean non-digits/X
                const cleaned = text.replace(/[^0-9X]/gi, '');
                if (cleaned.length >= 8) {
                  onScanSuccess(cleaned);
                  onClose();
                }
              }
            }
          );

          if (!isMounted) {
            if (controls) {
              try {
                controls.stop();
              } catch {}
            }
            return;
          }

          // Once permission is granted and stream is active, re-enumerate devices
          try {
            const updatedDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            if (isMounted && updatedDevices && updatedDevices.length > 0) {
              setDevices(updatedDevices);
            }
          } catch {
            // Ignore re-enumeration failure
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Camera Scanner Error:', err);
          setErrorMsg(err.message || 'Unable to access camera. Please check camera permissions.');
        }
      }
    };

    // Small timeout to ensure video element is rendered inside dialog DOM
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    const videoEl = videoRef.current;

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (controls) {
        try {
          controls.stop();
        } catch (e) {
          console.error(e);
        }
      }
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoEl.srcObject = null;
      }
    };
  }, [open, activeDeviceIndex, facingMode, isMobileView, onClose, onScanSuccess]);

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    if (devices.length > 1) {
      setActiveDeviceIndex((prev) => (prev + 1) % devices.length);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { style: { borderRadius: 16 } } }}>
      <DialogTitle className={styles.dialogTitle}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideocamIcon style={{ color: '#1b4332' }} />
          <Typography variant="h6" className={styles.titleText}>Scan ISBN Barcode</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {(isMobileView || devices.length > 1) && (
            <Tooltip title={`Switch Camera (${facingMode === 'environment' ? 'Front' : 'Back'})`}>
              <IconButton onClick={handleSwitchCamera} size="small" color="primary" aria-label="switch camera">
                <CameraswitchIcon />
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className={styles.dialogContent}>
        <Box className={styles.videoContainer}>
          <video ref={videoRef} className={styles.videoElement} />
          <Box className={styles.scanOverlay}>
            <Box className={styles.targetFrame}>
              <Box className={styles.scanLine} />
            </Box>
          </Box>
        </Box>

        <Typography className={styles.instructions}>
          Position the book barcode (ISBN-10 or ISBN-13) within the frame to scan automatically.
        </Typography>

        {errorMsg && (
          <Typography className={styles.errorText}>
            {errorMsg}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};
