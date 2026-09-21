import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  MapPin, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCw,
  Sparkles
} from 'lucide-react';
import { drawGpsWatermark, GpsWatermarkData } from '../utils/cameraWatermark';
import { formatDistance } from '../utils/geo';

interface CameraVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (dataUrl: string) => void;
  watermarkData: GpsWatermarkData;
  title?: string;
}

export const CameraVerificationModal: React.FC<CameraVerificationModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  watermarkData,
  title = 'Foto Verifikasi Presensi GPS',
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera tracks helper
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setCameraError(null);
    try {
      // Stop existing tracks first
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Peramban tidak mendukung akses kamera langsung (MediaDevices API). Silakan gunakan tombol Unggah Foto.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
        setCameraError('Izin akses kamera ditolak oleh browser. Silakan izinkan kamera di setelan situs atau gunakan tombol Unggah Foto.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('Kamera fisik tidak ditemukan pada perangkat Anda. Silakan gunakan opsi Unggah Foto.');
      } else {
        setCameraError('Tidak dapat membuka kamera. Pastikan kamera tidak sedang dipakai aplikasi lain atau gunakan opsi Unggah Foto.');
      }
    }
  }, [stream]);

  // Effect when modal opens / closes or facingMode changes
  useEffect(() => {
    if (isOpen && !capturedPreview) {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedPreview]);

  // Connect video element to stream when stream or modal updates
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedPreview]);

  // Handle Take Photo from live video stream
  const handleShutter = () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    try {
      // Draw watermark on canvas from video feed
      const watermarked = drawGpsWatermark(videoRef.current, watermarkData);
      setCapturedPreview(watermarked);
      stopStream();
    } catch (err) {
      console.error('Failed to capture and watermark photo:', err);
      alert('Gagal memproses foto. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Upload / File Fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        try {
          const watermarked = drawGpsWatermark(img, watermarkData);
          setCapturedPreview(watermarked);
          stopStream();
        } catch (err) {
          console.error('Failed to process uploaded image:', err);
          alert('Gagal menyematkan watermark koordinat pada gambar.');
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        alert('Format berkas gambar tidak valid.');
        setIsProcessing(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Switch between front and rear cameras
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPreview(null);
    startCamera(facingMode);
  };

  // Confirm photo
  const handleConfirm = () => {
    if (capturedPreview) {
      onPhotoCaptured(capturedPreview);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col">
        {/* Flash animation */}
        {isFlashActive && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none opacity-90 transition-opacity duration-200" />
        )}

        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Watermark GPS
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Otomatis menyematkan titik koordinat satelit & identitas karyawan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder / Preview Area */}
        <div className="relative bg-black min-h-[320px] sm:min-h-[380px] flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            // Captured Watermarked Preview
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2 bg-slate-950">
              <img
                src={capturedPreview}
                alt="Pratinjau Foto Presensi GPS"
                className="w-full max-h-[380px] object-contain rounded-lg border border-emerald-500/30 shadow-lg"
              />
              <div className="absolute top-4 left-4 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Watermark Koordinat Telah Disematkan</span>
              </div>
            </div>
          ) : cameraError ? (
            // Camera Error / Fallback UI
            <div className="p-6 text-center space-y-3.5 text-white max-w-sm">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-200">Kamera Tidak Tersedia</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah Foto dari Galeri / Kamera HP</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Coba Deteksi Ulang Kamera</span>
                </button>
              </div>
            </div>
          ) : (
            // Live Camera Stream
            <div className="relative w-full h-full min-h-[320px] sm:min-h-[380px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover min-h-[320px] sm:min-h-[380px] ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder Face Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-72 sm:w-64 sm:h-80 rounded-[48px] border-2 border-dashed border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex flex-col items-center justify-between p-4">
                  <span className="text-[10px] font-bold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    Posisikan Wajah di Sini
                  </span>
                  <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white/50 text-[10px]">
                    +
                  </div>
                  <span className="text-[10px] font-medium text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full">
                    GPS Ready
                  </span>
                </div>
              </div>

              {/* Live Coordinates HUD Top Badge */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 text-white text-[11px] font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LAT: {watermarkData.lat.toFixed(5)}</span>
                  <span className="text-slate-500">•</span>
                  <span>LNG: {watermarkData.lng.toFixed(5)}</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                  ±{Math.round(watermarkData.accuracy)}m
                </div>
              </div>

              {/* Switch Camera Button (floating top-right) */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Ganti Kamera Depan / Belakang"
                className="absolute top-12 right-3 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center shadow-lg transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-200" />
              </button>
            </div>
          )}

          {/* Hidden File Input for Gallery / System Camera Fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Live GPS Metadata Strip */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-900 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Titik Verifikasi: {formatDistance(watermarkData.distanceToOffice)} dari kantor</span>
            </span>
            <span className="text-slate-500 text-[10px]">
              Karyawan: <strong>{watermarkData.employeeName}</strong> ({watermarkData.employeeId})
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            {watermarkData.lat >= 0 ? '+' : ''}{watermarkData.lat.toFixed(6)}, {watermarkData.lng >= 0 ? '+' : ''}{watermarkData.lng.toFixed(6)} • Akurasi GPS ±{Math.round(watermarkData.accuracy)}m
          </div>
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          {capturedPreview ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Foto Verifikasi Ini</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="py-2.5 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Pilih foto dari berkas galeri atau kamera sistem"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Pilih Berkas</span>
              </button>

              {/* Big Center Shutter Button */}
              <button
                type="button"
                onClick={handleShutter}
                disabled={isProcessing || !stream}
                className={`flex-1 sm:flex-initial py-3 px-6 rounded-2xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                  isProcessing || !stream
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-900/20 active:scale-95'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isProcessing ? 'Menyematkan Watermark...' : 'Ambil Foto Presensi'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
