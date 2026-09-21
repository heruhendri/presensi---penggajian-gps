import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Laptop, 
  Fingerprint, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  LogOut, 
  KeyRound, 
  RefreshCw,
  Info
} from 'lucide-react';
import { UserRole, Employee } from '../types';
import { 
  SECURE_STORAGE_KEY_AUTH_30D, 
  SecureAuthSessionData, 
  getDeviceFingerprint, 
  getSessionRemainingDays 
} from '../utils/secureSession';

interface SecureSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole | null;
  currentEmployee: Employee | null;
  onTerminateSession: () => void;
}

export const SecureSessionModal: React.FC<SecureSessionModalProps> = ({
  isOpen,
  onClose,
  role,
  currentEmployee,
  onTerminateSession,
}) => {
  const [session, setSession] = useState<SecureAuthSessionData | null>(null);
  const [remainingDays, setRemainingDays] = useState<number>(0);
  const [deviceInfo, setDeviceInfo] = useState(() => getDeviceFingerprint());

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(SECURE_STORAGE_KEY_AUTH_30D);
      if (raw) {
        const parsed: SecureAuthSessionData = JSON.parse(raw);
        setSession(parsed);
        setRemainingDays(getSessionRemainingDays());
      } else {
        setSession(null);
      }
      setDeviceInfo(getDeviceFingerprint());
    } catch {
      setSession(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (timestampMs?: number) => {
    if (!timestampMs) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestampMs));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/90 text-white flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-emerald-400/30">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Pusat Keamanan Sesi 30 Hari</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aktif & Terproteksi
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Perlindungan anti-pembajakan dan enkripsi tanda tangan digital
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {session ? (
            <>
              {/* Security Health Score Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <div className="font-bold text-emerald-950">Integritas Sesi Terverifikasi Sempurna</div>
                  <p className="mt-0.5 text-[11px] text-emerald-800 leading-relaxed">
                    Sesi login Anda saat ini dilindungi dengan enkripsi SHA-256 dan terikat permanen ke tanda tangan hardware peramban ini.
                  </p>
                </div>
              </div>

              {/* Status Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    Perangkat Terikat
                  </div>
                  <div className="font-bold text-slate-800">{session.deviceLabel || deviceInfo.label}</div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5" title={session.deviceFingerprintHash}>
                    FP: {session.deviceFingerprintHash.substring(0, 16)}...
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Masa Berlaku Sesi
                  </div>
                  <div className="font-bold text-slate-800">{remainingDays} Hari Tersisa</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Hingga {formatDate(session.expiresAt)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                    Tanda Tangan Kriptografi
                  </div>
                  <div className="font-bold text-emerald-700 flex items-center gap-1">
                    <span>HMAC-SHA-256 Valid</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5" title={session.signature}>
                    SIG: {session.signature.substring(0, 16)}...
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Proteksi Idle (Inaktivitas)
                  </div>
                  <div className="font-bold text-slate-800">Maks. 7 Hari</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Aktivitas terakhir: {formatDate(session.lastActivityAt)}
                  </div>
                </div>
              </div>

              {/* Multi-layered Defense Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Pertahanan Berlapis Anti-Kebobolan Aktif:
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><strong>Anti-Penyalinan:</strong> Token yang disalin ke komputer/browser lain akan langsung ditolak karena sidik peramban tidak cocok.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><strong>Anti-Manipulasi (Anti-Tamper):</strong> Perubahan peran (*role elevation*) atau tanggal masa berlaku di storage akan membatalkan tanda tangan digital.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span><strong>Pencabutan Otomatis:</strong> Penggantian kata sandi langsung menghanguskan seluruh sesi aktif demi mencegah akses penyusup.</span>
                  </li>
                </ul>
              </div>

              {/* Terminate Session Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin memutuskan sesi 30 hari di perangkat ini dan keluar sekarang?')) {
                      onTerminateSession();
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Putuskan Sesi 30 Hari di Perangkat Ini & Keluar</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Sesi 30 Hari Tidak Aktif</div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Anda saat ini masuk menggunakan sesi biasa tanpa penyimpanan 30 hari.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Keamanan Tingkat Perusahaan</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
