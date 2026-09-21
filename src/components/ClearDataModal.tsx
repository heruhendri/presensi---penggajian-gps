import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  Database, 
  RefreshCcw,
  Sparkles,
  Users,
  FileSpreadsheet,
  Clock,
  Send
} from 'lucide-react';
import { SystemBackupData } from '../types';
import { downloadBackupJsonFile } from '../utils/telegramBackup';

export interface ClearDataModalStats {
  employeesCount?: number;
  attendancesCount?: number;
  workReportsCount?: number;
  assignmentsCount?: number;
  notificationsCount?: number;
}

export interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: (mode: 'operational' | 'full') => void;
  currentStats?: ClearDataModalStats;
  totalEmployees?: number;
  totalAttendance?: number;
  totalReports?: number;
  totalAssignments?: number;
  totalNotifications?: number;
  backupData?: SystemBackupData;
  onSendTelegramBackup?: () => Promise<void> | Promise<any>;
  hasTelegramConfigured?: boolean;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  currentStats,
  totalEmployees,
  totalAttendance,
  totalReports,
  totalAssignments,
  totalNotifications,
  backupData,
  onSendTelegramBackup,
  hasTelegramConfigured = false,
}) => {
  const [clearMode, setClearMode] = useState<'operational' | 'full'>('operational');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramSentNotice, setTelegramSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const stats = {
    employeesCount: currentStats?.employeesCount ?? totalEmployees ?? backupData?.employees?.length ?? 0,
    attendancesCount: currentStats?.attendancesCount ?? totalAttendance ?? backupData?.attendanceRecords?.length ?? 0,
    workReportsCount: currentStats?.workReportsCount ?? totalReports ?? backupData?.workReports?.length ?? 0,
    assignmentsCount: currentStats?.assignmentsCount ?? totalAssignments ?? backupData?.assignments?.length ?? 0,
    notificationsCount: currentStats?.notificationsCount ?? totalNotifications ?? backupData?.notifications?.length ?? 0,
  };

  const targetConfirmWord = 'BERSIHKAN DATA';
  const isConfirmed = confirmationInput.trim().toUpperCase() === targetConfirmWord;

  const handleDownloadBackupFirst = () => {
    if (backupData) {
      downloadBackupJsonFile(backupData);
      setHasDownloadedBackup(true);
    }
  };

  const handleSendTelegramFirst = async () => {
    if (!onSendTelegramBackup) return;
    setIsSendingTelegram(true);
    try {
      await onSendTelegramBackup();
      setTelegramSentNotice('Backup sistem berhasil dikirim ke Telegram Bot Anda!');
    } catch {
      setTelegramSentNotice('Gagal mengirim ke Telegram. Pastikan token & Chat ID benar.');
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleExecuteClear = () => {
    if (!isConfirmed) return;
    onConfirmClear(clearMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Pembersihan Data Sistem (Clean Slate)</h2>
              <p className="text-xs text-rose-100 font-medium">
                Mulai baru secara profesional untuk operasional perusahaan riil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900 text-xs">
                Perhatian: Tindakan Ini Menghapus Data Secara Permanen
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Fitur ini dirancang bagi Manajemen & HRD yang ingin membersihkan data simulasi/percobaan agar sistem bersih dan siap digunakan untuk karyawan perusahaan sebenarnya.
              </p>
            </div>
          </div>

          {/* Backup Pre-check Action */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-800 text-xs">Amankan Data Anda Terlebih Dahulu</span>
              </div>
              {hasDownloadedBackup && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Backup Tersimpan
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Sangat disarankan untuk mengunduh atau mengirimkan cadangan data ke Telegram sebelum melakukan penghapusan:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                disabled={!backupData}
                onClick={handleDownloadBackupFirst}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unduh File Cadangan (.JSON)</span>
              </button>

              {hasTelegramConfigured && onSendTelegramBackup && (
                <button
                  type="button"
                  disabled={isSendingTelegram}
                  onClick={handleSendTelegramFirst}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 text-sky-200 ${isSendingTelegram ? 'animate-spin' : ''}`} />
                  <span>{isSendingTelegram ? 'Mengirim...' : 'Kirim Backup ke Telegram'}</span>
                </button>
              )}
            </div>
            {telegramSentNotice && (
              <p className="text-[11px] font-semibold text-emerald-700 pt-1">
                ✓ {telegramSentNotice}
              </p>
            )}
          </div>

          {/* Selection of Clear Mode */}
          <div className="space-y-2.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              Pilih Jenis Pembersihan Data:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Operational Only (Recommended) */}
              <label 
                className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  clearMode === 'operational' 
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">
                      1. Hapus Data Transaksional
                    </span>
                    <input
                      type="radio"
                      name="clearMode"
                      value="operational"
                      checked={clearMode === 'operational'}
                      onChange={() => setClearMode('operational')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                    ⭐ Direkomendasikan
                  </span>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Menghapus seluruh rekaman presensi, lembur, laporan kerja, tugas lapangan & notifikasi.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-emerald-800 font-semibold">
                  ✓ Master Karyawan, Shift & Profil Perusahaan TETAP UTUH
                </div>
              </label>

              {/* Option 2: Full Factory Reset */}
              <label 
                className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                  clearMode === 'full' 
                    ? 'border-rose-600 bg-rose-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">
                      2. Reset Pabrik (Total)
                    </span>
                    <input
                      type="radio"
                      name="clearMode"
                      value="full"
                      checked={clearMode === 'full'}
                      onChange={() => setClearMode('full')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                  </div>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                    ⚠️ Hapus Menyeluruh
                  </span>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Menghapus data presensi, laporan, tugas DAN menghapus data karyawan demo (kembali ke 1 akun Administrator utama).
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-rose-800 font-semibold">
                  ⚠️ Siap untuk input dari awal karyawan baru Anda
                </div>
              </label>
            </div>
          </div>

          {/* Summary of items to be deleted */}
          <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">
              Rincian Data yang Akan Dibersihkan Saat Ini:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-base font-extrabold text-rose-600">{stats.attendancesCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Log Presensi</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-base font-extrabold text-rose-600">{stats.workReportsCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Laporan Kerja</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-base font-extrabold text-rose-600">{stats.assignmentsCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Tugas Luar Kota</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <div className="text-base font-extrabold text-slate-700">
                  {clearMode === 'full' ? stats.employeesCount : 0}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {clearMode === 'full' ? 'Karyawan Dihapus' : 'Karyawan Aman'}
                </div>
              </div>
            </div>
          </div>

          {/* Security Confirmation Step */}
          <div className="space-y-2 pt-1 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-800">
              Konfirmasi Keamanan: Ketik <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{targetConfirmWord}</span> di bawah ini:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={`Ketik "${targetConfirmWord}" di sini...`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleExecuteClear}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md transition cursor-pointer ${
              isConfirmed
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/30'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Eksekusi Pembersihan Data Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
