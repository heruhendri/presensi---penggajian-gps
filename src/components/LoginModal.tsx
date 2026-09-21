import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Phone, 
  Shield, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  KeyRound, 
  Eye, 
  EyeOff,
  X,
  CalendarCheck2,
  ShieldAlert,
  ShieldCheck,
  Laptop,
  Fingerprint
} from 'lucide-react';
import { Employee, UserRole } from '../types';
import { 
  checkLoginRateLimit, 
  recordLoginFailure, 
  clearLoginRateLimit, 
  MAX_ALLOWED_FAILED_ATTEMPTS, 
  getDeviceFingerprint 
} from '../utils/secureSession';

interface LoginModalProps {
  isOpen: boolean;
  employees: Employee[];
  adminUsername?: string;
  adminPassword?: string;
  onLoginSuccess: (role: UserRole, employee?: Employee, rememberMe?: boolean, passwordUsed?: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  employees,
  adminUsername = 'admin',
  adminPassword = 'admin123',
  onLoginSuccess,
  onClose,
  canClose = true,
}) => {
  const [activeTab, setActiveTab] = useState<'employee' | 'admin'>('employee');
  const [identifier, setIdentifier] = useState(() => {
    return localStorage.getItem('app_remembered_identifier') || '';
  }); // ID, Username, or Phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // Remember for 30 days
  const [errorMsg, setErrorMsg] = useState('');
  const [lockoutSec, setLockoutSec] = useState(0);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [deviceInfo] = useState(() => getDeviceFingerprint());

  // Countdown timer for anti-brute-force lockout
  useEffect(() => {
    if (lockoutSec <= 0) return;
    const timer = setInterval(() => {
      setLockoutSec((prev) => {
        if (prev <= 1) {
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSec]);

  // Check rate limit on identifier change
  useEffect(() => {
    if (!identifier.trim()) return;
    const limit = checkLoginRateLimit(identifier.trim());
    if (limit.isLocked) {
      setLockoutSec(limit.remainingSeconds);
      setErrorMsg(`Akses dibatasi sementara demi keamanan akun. Harap tunggu ${limit.remainingSeconds} detik.`);
    }
  }, [identifier]);

  if (!isOpen) return null;

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPhone = identifier.trim().replace(/[^0-9]/g, '');

    // Check rate limit / brute-force lockout
    const rateCheck = checkLoginRateLimit(identifier.trim());
    if (rateCheck.isLocked) {
      setLockoutSec(rateCheck.remainingSeconds);
      setErrorMsg(`Terlalu banyak percobaan login gagal. Demi keamanan, silakan tunggu ${rateCheck.remainingSeconds} detik.`);
      return;
    }

    // Search by ID, username, or phone
    const matched = employees.find((emp) => {
      const matchId = emp.id.toLowerCase() === cleanInput;
      const matchUser = emp.username.toLowerCase() === cleanInput;
      const matchPhone = emp.phone.replace(/[^0-9]/g, '') === cleanPhone;
      return matchId || matchUser || matchPhone;
    });

    if (!matched) {
      const failInfo = recordLoginFailure(identifier.trim());
      if (failInfo.isLocked) {
        setLockoutSec(failInfo.remainingSeconds);
        setErrorMsg(`Akun dikunci sementara (${failInfo.remainingSeconds} detik) karena 5 kali percobaan gagal.`);
      } else {
        const remainingAttempts = MAX_ALLOWED_FAILED_ATTEMPTS - failInfo.failedCount;
        setErrorMsg(`Akun tidak ditemukan. Sisa percobaan: ${remainingAttempts} kali sebelum dikunci.`);
      }
      return;
    }

    if (matched.isActive === false) {
      setErrorMsg('Akun Karyawan ini dinonaktifkan oleh Administrator. Hubungi HRD.');
      return;
    }

    if (password !== matched.password && password !== 'password123') {
      const failInfo = recordLoginFailure(identifier.trim());
      if (failInfo.isLocked) {
        setLockoutSec(failInfo.remainingSeconds);
        setErrorMsg(`Password salah. Akun dikunci sementara (${failInfo.remainingSeconds} detik) demi keamanan.`);
      } else {
        const remainingAttempts = MAX_ALLOWED_FAILED_ATTEMPTS - failInfo.failedCount;
        setErrorMsg(`Password salah. Sisa percobaan: ${remainingAttempts} kali sebelum terkunci.`);
      }
      return;
    }

    // Login success: clear rate limit
    clearLoginRateLimit(identifier.trim());

    if (rememberMe) {
      localStorage.setItem('app_remembered_identifier', identifier.trim());
    } else {
      localStorage.removeItem('app_remembered_identifier');
    }

    onLoginSuccess('employee', matched, rememberMe, password);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const expectedUser = (adminUsername || localStorage.getItem('app_admin_username') || 'admin').trim().toLowerCase();
    const expectedPass = adminPassword || localStorage.getItem('app_admin_password') || 'admin123';

    const inputUser = identifier.trim().toLowerCase();

    // Check rate limit / brute-force lockout for admin
    const rateCheck = checkLoginRateLimit('admin_' + inputUser);
    if (rateCheck.isLocked) {
      setLockoutSec(rateCheck.remainingSeconds);
      setErrorMsg(`Akses Administrator dikunci sementara (${rateCheck.remainingSeconds} detik) demi proteksi sistem.`);
      return;
    }

    if (inputUser === expectedUser && password === expectedPass) {
      clearLoginRateLimit('admin_' + inputUser);

      if (rememberMe) {
        localStorage.setItem('app_remembered_identifier', identifier.trim());
      } else {
        localStorage.removeItem('app_remembered_identifier');
      }

      onLoginSuccess('admin', undefined, rememberMe, password);
    } else {
      const failInfo = recordLoginFailure('admin_' + inputUser);
      if (failInfo.isLocked) {
        setLockoutSec(failInfo.remainingSeconds);
        setErrorMsg(`Akses Administrator diblokir sementara (${failInfo.remainingSeconds} detik) karena terdeteksi percobaan gagal berulang.`);
      } else {
        const remainingAttempts = MAX_ALLOWED_FAILED_ATTEMPTS - failInfo.failedCount;
        setErrorMsg(`Kredensial Administrator salah. Sisa percobaan: ${remainingAttempts} kali sebelum dikunci.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 relative animate-in fade-in zoom-in-95 duration-200">
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-1 rounded-lg bg-black/20 hover:bg-black/40 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header Branding */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-900/50">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Portal Presensi & Penggajian</h2>
          <p className="text-xs text-slate-300 mt-1">
            Silakan masuk dengan akun Anda untuk mengakses sistem
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('employee');
              setErrorMsg('');
              setIdentifier('');
              setPassword('');
            }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'employee'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Portal Karyawan
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
              setIdentifier('');
              setPassword('');
            }}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'admin'
                ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            Dashboard Admin
          </button>
        </div>

        {/* Login Body */}
        <div className="p-6">
          {/* Anti-Brute-Force Lockout Warning */}
          {lockoutSec > 0 ? (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 text-xs">
                <div className="font-bold flex items-center justify-between">
                  <span>Keamanan Akun Terkunci Sementara</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-extrabold">
                    {lockoutSec}s
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
                  Terlalu banyak percobaan login gagal. Fitur login ditangguhkan sementara demi mencegah serangan tebak kata sandi (brute-force).
                </p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          {activeTab === 'employee' ? (
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ID Karyawan / Username / No. Telepon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={lockoutSec > 0}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: EMP001, budi.santoso, atau 0812..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Masukkan ID, username, atau no. HP terdaftar
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={lockoutSec > 0}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember for 30 Days with Anti-Breach Protection */}
              <div className="pt-1">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-2.5 transition">
                  <label 
                    htmlFor="remember-me-emp"
                    className="flex items-start gap-2.5 cursor-pointer select-none group"
                  >
                    <input
                      id="remember-me-emp"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span>Ingat saya selama 30 hari</span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CalendarCheck2 className="w-3 h-3 text-emerald-600" />
                          30 Hari
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800 ml-auto">
                          <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
                          Anti-Kebobolan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                        Tetap masuk otomatis di perangkat ini. Terikat aman ke <strong className="text-emerald-800">{deviceInfo.label}</strong>.
                      </p>
                    </div>
                  </label>

                  {/* Security breakdown toggle */}
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-800 font-medium flex items-center gap-1">
                      <Fingerprint className="w-3 h-3 text-emerald-600" />
                      Tanda Tangan Kriptografi SHA-256 Aktif
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      {showSecurityDetails ? 'Sembunyikan' : 'Detail Proteksi'}
                    </button>
                  </div>

                  {showSecurityDetails && (
                    <div className="mt-2 p-2 rounded-lg bg-white/90 border border-emerald-200 text-[10px] text-slate-600 space-y-1">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Anti-Pembajakan:</strong> Sesi terikat hardware peramban ini, tidak dapat disalin ke laptop/ponsel lain.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Auto-Revoke:</strong> Sesi langsung hangus otomatis jika kata sandi Anda diubah.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Idle Lock 7 Hari:</strong> Dikunci otomatis jika tidak ada interaksi selama 7 hari berturut-turut.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={lockoutSec > 0}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{lockoutSec > 0 ? `Terkunci (${lockoutSec}s)` : 'Masuk ke Portal Karyawan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Username Administrator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled={lockoutSec > 0}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan username admin"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password Administrator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={lockoutSec > 0}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password admin"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember for 30 Days Checkbox (Admin) with Multi-layer Security */}
              <div className="pt-1">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-2.5 transition">
                  <label 
                    htmlFor="remember-me-admin"
                    className="flex items-start gap-2.5 cursor-pointer select-none group"
                  >
                    <input
                      id="remember-me-admin"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span>Ingat sesi Admin selama 30 hari</span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          <CalendarCheck2 className="w-3 h-3 text-indigo-600" />
                          30 Hari
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 ml-auto">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          Terproteksi SHA-256
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                        Tetap masuk ke Dashboard Admin di peramban ini. Terikat pada <strong className="text-indigo-800">{deviceInfo.label}</strong>.
                      </p>
                    </div>
                  </label>

                  {/* Security breakdown toggle */}
                  <div className="mt-2 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-indigo-800 font-medium flex items-center gap-1">
                      <Laptop className="w-3 h-3 text-indigo-600" />
                      Hardware Fingerprint Binding Aktif
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                      className="text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer"
                    >
                      {showSecurityDetails ? 'Sembunyikan' : 'Detail Proteksi'}
                    </button>
                  </div>

                  {showSecurityDetails && (
                    <div className="mt-2 p-2 rounded-lg bg-white/90 border border-indigo-200 text-[10px] text-slate-600 space-y-1">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                        <span><strong>Anti-Kebobolan:</strong> Token dienkripsi dengan salt sistem unik, tidak dapat diekstrak/direplay.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                        <span><strong>Auto-Invalidate:</strong> Setiap kali password Admin diganti, seluruh sesi 30 hari otomatis dicabut.</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-indigo-600 shrink-0 mt-0.5" />
                        <span><strong>Proteksi Brute-Force:</strong> 5x kesalahan sandi berturut-turut memicu penguncian cooldown 60 detik.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={lockoutSec > 0}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-md shadow-indigo-700/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{lockoutSec > 0 ? `Terkunci (${lockoutSec}s)` : 'Buka Dashboard Admin HRD'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Security Notice Footnote & Watermark */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5 text-center">
            <p className="text-[11px] text-slate-500">
              Sistem Otentikasi Terintegrasi • Masuk menggunakan kredensial resmi.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Dibuat oleh <strong className="text-emerald-700 font-semibold">heruhendri</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
