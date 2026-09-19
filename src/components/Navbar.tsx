import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Bell, 
  FileSpreadsheet, 
  Mail, 
  LogOut, 
  User, 
  ShieldCheck, 
  Smartphone,
  RefreshCw,
  Menu,
  X,
  KeyRound,
  Lock
} from 'lucide-react';
import { CompanyConfig, Employee, PushNotification, UserRole } from '../types';

interface NavbarProps {
  role: UserRole | null;
  currentEmployee: Employee | null;
  config: CompanyConfig;
  notifications: PushNotification[];
  unreadNotificationCount: number;
  emailLogCount: number;
  onOpenNotifications: () => void;
  onOpenEmailLogs: () => void;
  onOpenSpreadsheetModal: () => void;
  onOpenChangePassword?: () => void;
  onSwitchUser: () => void;
  onLogout: () => void;
  isSyncingSheets: boolean;
  onManualSyncSheets: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  currentEmployee,
  config,
  unreadNotificationCount,
  emailLogCount,
  onOpenNotifications,
  onOpenEmailLogs,
  onOpenSpreadsheetModal,
  onOpenChangePassword,
  onSwitchUser,
  onLogout,
  isSyncingSheets,
  onManualSyncSheets,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white truncate max-w-[170px] sm:max-w-none">
                  {config.companyName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                  <MapPin className="w-3 h-3" /> GPS {config.officeRadiusMeters}m
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate">
                Sistem Absensi GPS, Lembur & Penggajian Terintegrasi
              </p>
            </div>

            <div className="hidden xl:flex items-center ml-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/90 border border-slate-700 text-slate-300 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Dibuat oleh <strong className="text-emerald-400 font-semibold">heruhendri</strong></span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Controls */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {/* Spreadsheet Live Sync Button */}
            <button
              onClick={onManualSyncSheets}
              disabled={isSyncingSheets}
              title="Sinkronkan dengan Google Spreadsheet"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Spreadsheet DB</span>
              <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncingSheets ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Email Log Notification Trigger */}
            <button
              onClick={onOpenEmailLogs}
              title="Notifikasi Email Real-Time"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Mail className="w-5 h-5" />
              {emailLogCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
              )}
            </button>

            {/* Push Notifications Bell */}
            <button
              onClick={onOpenNotifications}
              title="Pemberitahuan Jadwal & Shift"
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            {/* User Profile Badge */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-semibold text-white leading-tight">
                  {!role ? 'Belum Masuk' : role === 'admin' ? 'Administrator HRD' : currentEmployee?.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {!role ? 'Silakan Login' : role === 'admin' ? 'Pusat Kontrol' : `${currentEmployee?.department} • ${currentEmployee?.id}`}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
                {role === 'admin' ? (
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                ) : role === 'employee' ? (
                  <User className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Admin Change Password Button (Desktop) */}
            {role === 'admin' && onOpenChangePassword && (
              <button
                onClick={onOpenChangePassword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 transition cursor-pointer"
                title="Ganti Password Administrator"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Ganti Password</span>
              </button>
            )}

            {/* Switch Account or Login */}
            {role ? (
              <button
                onClick={onSwitchUser}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition border border-slate-700 cursor-pointer"
                title="Ganti Akun (Admin / Karyawan)"
              >
                Ganti Akun
              </button>
            ) : (
              <button
                onClick={onSwitchUser}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm cursor-pointer"
              >
                Masuk
              </button>
            )}

            {/* Logout */}
            {role && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Right Controls: Compact & Clean */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Notifications Bell for quick touch */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Role indicator pill */}
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-[11px]">
              {role === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              ) : role === 'employee' ? (
                <User className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="font-semibold text-slate-200">
                {role === 'admin' ? 'Admin' : role === 'employee' ? 'Karyawan' : 'Tamu'}
              </span>
            </div>

            {/* Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Menu Navigasi"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown (Clean, Organized, No Overlap) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* User Profile Summary */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                {role === 'admin' ? (
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                ) : role === 'employee' ? (
                  <User className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {role === 'admin' ? 'Administrator HRD' : role === 'employee' ? currentEmployee?.name : 'Silakan Masuk Akun'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {role === 'admin' ? 'Pusat Kebijakan & Penggajian' : role === 'employee' ? `${currentEmployee?.department} • ${currentEmployee?.id}` : 'Login Karyawan / Admin'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {role === 'admin' ? 'Super Admin' : role === 'employee' ? 'Aktif' : 'Login'}
            </span>
          </div>

          {/* Quick Menu Actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                onManualSyncSheets();
                setIsMobileMenuOpen(false);
              }}
              disabled={isSyncingSheets}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-left cursor-pointer transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[11px]">Spreadsheet DB</div>
                <div className="text-[10px] text-slate-400">
                  {isSyncingSheets ? 'Sinkronisasi...' : 'Sinkron Otomatis'}
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenEmailLogs();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-left cursor-pointer transition"
            >
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="font-semibold text-[11px]">Log Notifikasi Email</div>
                <div className="text-[10px] text-slate-400">{emailLogCount} Email Terkirim</div>
              </div>
            </button>
          </div>

          {/* Account Actions */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            {role === 'admin' && onOpenChangePassword && (
              <button
                onClick={() => {
                  onOpenChangePassword();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 font-semibold text-xs border border-indigo-700/60 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ganti Password Admin</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onSwitchUser();
                  setIsMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{role ? 'Ganti Akun' : 'Masuk Akun'}</span>
              </button>

              {role && (
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              )}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[10px] text-slate-400">
                Dibuat oleh <strong className="text-emerald-400 font-semibold">heruhendri</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

