import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
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
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!open) {
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
      setErrorMsg(null);
      return;
    }

    let isMounted = true;
    
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

    let controls: any = null;

    const startScanner = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!isMounted) return;

        if (!videoInputDevices || videoInputDevices.length === 0) {
          setErrorMsg('No camera devices found. Please ensure your camera is connected and permitted.');
          return;
        }

        // Prefer back camera if on mobile
        const backCamera = videoInputDevices.find(device =>
          device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear') || device.label.toLowerCase().includes('environment')
        );
        const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

        if (videoRef.current && isMounted) {
          const constraints: MediaStreamConstraints = {
            video: {
              deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: backCamera ? 'environment' : 'user',
              // @ts-ignore
              advanced: [{ focusMode: 'continuous' }],
            },
          };

          controls = await codeReader.decodeFromConstraints(
            constraints,
            videoRef.current,
            (result, err) => {
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
        stream.getTracks().forEach(track => track.stop());
        videoEl.srcObject = null;
      }
    };
  }, [open, onClose, onScanSuccess]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { style: { borderRadius: 16 } } }}>
      <DialogTitle className={styles.dialogTitle}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideocamIcon style={{ color: '#1b4332' }} />
          <Typography variant="h6" className={styles.titleText}>Scan ISBN Barcode</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
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
