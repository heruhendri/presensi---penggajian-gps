import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  X,
  User,
  RotateCcw,
  Info
} from 'lucide-react';

interface ChangeAdminPasswordModalProps {
  isOpen: boolean;
  currentAdminPassword?: string;
  currentAdminUsername?: string;
  onClose: () => void;
  onSave: (newPassword: string, newUsername?: string) => void;
}

export const ChangeAdminPasswordModal: React.FC<ChangeAdminPasswordModalProps> = ({
  isOpen,
  currentAdminPassword,
  currentAdminUsername,
  onClose,
  onSave,
}) => {
  const activeExpectedPass = currentAdminPassword || localStorage.getItem('app_admin_password') || 'admin123';
  const activeExpectedUser = currentAdminUsername || localStorage.getItem('app_admin_username') || 'admin';

  const [username, setUsername] = useState(activeExpectedUser);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsername(activeExpectedUser);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, activeExpectedUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Verification of old password
    if (oldPassword !== activeExpectedPass) {
      setErrorMsg('Password lama tidak sesuai. Jika belum pernah diubah, gunakan password awal: admin123');
      return;
    }

    // Validation of new password
    if (newPassword.length < 5) {
      setErrorMsg('Password baru minimal 5 karakter demi keamanan data sistem.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok. Harap periksa kembali.');
      return;
    }

    if (newPassword === oldPassword) {
      setErrorMsg('Password baru tidak boleh sama persis dengan password lama.');
      return;
    }

    const finalUser = username.trim() || 'admin';
    onSave(newPassword, finalUser);
    localStorage.setItem('app_admin_password', newPassword);
    localStorage.setItem('app_admin_username', finalUser);

    setSuccessMsg('Password Administrator berhasil diperbarui dan disimpan!');
    
    setTimeout(() => {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('');
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset password Admin kembali ke bawaan sistem: "admin123"?')) {
      onSave('admin123', 'admin');
      localStorage.setItem('app_admin_password', 'admin123');
      localStorage.setItem('app_admin_username', 'admin');
      setUsername('admin');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Password Admin telah direset ke default: admin123');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-1 rounded-lg bg-black/20 hover:bg-black/40 transition cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-900/50">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Ganti Password Admin</h2>
          <p className="text-xs text-indigo-200 mt-1">
            Perbarui kata sandi administrator untuk hak akses penuh Dashboard HRD
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Info Badge */}
          <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
            <div>
              <p className="font-semibold">Info Kredensial Administrator</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Username default: <span className="font-mono font-bold">admin</span> • Password default: <span className="font-mono font-bold">admin123</span>
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Admin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Password Lama */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password Lama Saat Ini
                </label>
                <button
                  type="button"
                  onClick={() => setOldPassword(activeExpectedPass)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  title="Gunakan password admin saat ini"
                >
                  Isi password saat ini
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password admin saat ini"
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Baru (Minimal 5 karakter)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={5}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Buat password baru yang aman"
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password Baru */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ulangi Konfirmasi Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru Anda"
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Reset password kembali ke admin123"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset ke Default</span>
              </button>

              <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-700/20 transition cursor-pointer"
                >
                  Simpan Password
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
