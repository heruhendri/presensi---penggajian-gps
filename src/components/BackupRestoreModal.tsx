import React, { useState, useRef } from 'react';
import { 
  Database, 
  Send, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Bot, 
  Clock, 
  ShieldCheck, 
  FileJson, 
  HelpCircle, 
  RefreshCw, 
  KeyRound, 
  Layers, 
  Sparkles,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { CompanyConfig, SystemBackupData } from '../types';
import { 
  testTelegramBotConnection, 
  sendTelegramBackupDocument, 
  downloadBackupJsonFile, 
  validateAndParseBackupContent, 
  formatIndonesianDateTime 
} from '../utils/telegramBackup';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CompanyConfig;
  onUpdateConfig: (newConfig: CompanyConfig) => void;
  backupData: SystemBackupData;
  onRestoreData: (data: SystemBackupData, mode: 'replace' | 'merge') => void;
  onShowToast?: (msg: string) => void;
  onSendTelegramBackup?: () => Promise<any>;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  backupData,
  onRestoreData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'download' | 'restore'>('telegram');

  // Telegram Config State
  const [botToken, setBotToken] = useState(config.telegramBotToken || '');
  const [chatId, setChatId] = useState(config.telegramChatId || '');
  const [topicId, setTopicId] = useState(config.telegramTopicId || '');
  const [autoDailyBackup, setAutoDailyBackup] = useState(config.telegramAutoDailyBackup ?? true);
  const [backupTime, setBackupTime] = useState(config.telegramDailyBackupTime || '23:00');

  // Bot test state
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{ success: boolean; botName?: string; username?: string; error?: string } | null>(null);

  // Sending state
  const [isSendingBackup, setIsSendingBackup] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Restore State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedFile, setParsedFile] = useState<SystemBackupData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  // Handle Save Telegram Config
  const handleSaveTelegramConfig = () => {
    const updated: CompanyConfig = {
      ...config,
      telegramBotToken: botToken.trim(),
      telegramChatId: chatId.trim(),
      telegramTopicId: topicId.trim() || undefined,
      telegramAutoDailyBackup: autoDailyBackup,
      telegramDailyBackupTime: backupTime,
    };
    onUpdateConfig(updated);
    onShowToast?.('Pengaturan backup bot Telegram berhasil disimpan!');
  };

  // Test Bot Connection
  const handleTestBot = async () => {
    if (!botToken.trim()) {
      setBotTestResult({ success: false, error: 'Masukkan Token Bot Telegram terlebih dahulu.' });
      return;
    }
    setIsTestingBot(true);
    setBotTestResult(null);
    const res = await testTelegramBotConnection(botToken.trim());
    setIsTestingBot(false);
    setBotTestResult(res);
  };

  // Send Backup to Telegram Now
  const handleSendBackupNow = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setSendResultMsg({ success: false, text: 'Token Bot dan Chat ID wajib diisi sebelum mengirim.' });
      return;
    }

    setIsSendingBackup(true);
    setSendResultMsg(null);

    const res = await sendTelegramBackupDocument(botToken.trim(), chatId.trim(), backupData, {
      topicId: topicId.trim() || undefined,
      isDailyAutomated: false,
    });

    setIsSendingBackup(false);
    setSendResultMsg({ success: res.success, text: res.message });

    // Update config with last backup info
    const nowReadable = formatIndonesianDateTime(new Date());
    const updated: CompanyConfig = {
      ...config,
      telegramBotToken: botToken.trim(),
      telegramChatId: chatId.trim(),
      telegramTopicId: topicId.trim() || undefined,
      telegramAutoDailyBackup: autoDailyBackup,
      telegramDailyBackupTime: backupTime,
      lastTelegramBackupDate: new Date().toISOString().slice(0, 10),
      lastTelegramBackupTime: nowReadable,
      lastTelegramBackupStatus: res.success ? 'success' : 'failed',
      lastTelegramBackupMessage: res.message,
    };
    onUpdateConfig(updated);

    if (res.success) {
      onShowToast?.('Backup database sukses terkirim ke Telegram!');
    }
  };

  // Handle Download File
  const handleDownload = () => {
    if (backupData) {
      downloadBackupJsonFile(backupData);
      onShowToast?.('File cadangan database berhasil diunduh (.json)!');
    }
  };

  // Handle File Upload for Restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setParsedFile(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseBackupContent(content);
      if (res.valid && res.data) {
        setParsedFile(res.data);
      } else {
        setParseError(res.error || 'Format file tidak valid.');
      }
    };
    reader.onerror = () => {
      setParseError('Gagal membaca berkas dari perangkat.');
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = () => {
    if (!parsedFile) return;
    setIsRestoring(true);
    try {
      onRestoreData(parsedFile, restoreMode);
      onShowToast?.('Database berhasil dipulihkan dari berkas cadangan!');
      onClose();
    } catch (err: any) {
      setParseError('Terjadi kesalahan saat memulihkan data: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">Pusat Backup & Pemulihan Database</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Telegram Bot
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Cadangan harian otomatis ke Telegram & ekspor/impor snapshot sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'telegram'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Send className="w-4 h-4 text-sky-500" />
            <span>Backup Bot Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'download'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh File (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Pulihkan (Restore)</span>
          </button>
        </div>

        {/* Tab 1: Telegram Bot Daily Backup */}
        {activeTab === 'telegram' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Status Card of Last Telegram Backup */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50/40 border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-sky-600" />
                  <span className="font-extrabold text-slate-900 text-xs">Status Cadangan Harian Telegram</span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Terakhir Dikirim: <strong>{config.lastTelegramBackupTime || 'Belum pernah dikirim'}</strong>
                  </span>
                </div>
                {config.lastTelegramBackupMessage && (
                  <p className="text-[10px] text-slate-500 italic max-w-md">
                    {config.lastTelegramBackupMessage}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {config.lastTelegramBackupStatus === 'success' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aktif & Terkirim</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                    <span>Siap Dikonfigurasi</span>
                  </span>
                )}
              </div>
            </div>

            {/* Telegram Form Inputs */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Telegram Bot Token (dari @BotFather)</span>
                  </label>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                  >
                    <span>Buka @BotFather</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestBot}
                    disabled={isTestingBot}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingBot ? 'Memeriksa...' : 'Uji Bot'}
                  </button>
                </div>
                {botTestResult && (
                  <div className={`mt-2 p-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 ${
                    botTestResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {botTestResult.success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Bot Valid: <strong>{botTestResult.botName}</strong> (@{botTestResult.username})</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Koneksi Gagal: {botTestResult.error}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Telegram Chat ID / ID Grup / Channel
                  </label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="Contoh: 123456789 atau -100123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ID pribadi Anda (dapat dicari via @userinfobot) atau ID grup Telegram.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Topic / Thread ID (Opsional untuk Supergroup Forum)
                  </label>
                  <input
                    type="text"
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    placeholder="Opsional, kosongkan jika chat biasa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Khusus jika grup Telegram menggunakan fitur Topics.
                  </p>
                </div>
              </div>

              {/* Automation settings */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Backup Harian Otomatis ke Telegram</span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Sistem akan otomatis mengirimkan snapshot database (.JSON) ke Telegram setiap hari.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoDailyBackup}
                    onChange={(e) => setAutoDailyBackup(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {autoDailyBackup && (
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Waktu Eksekusi Harian (WIB):
                    </label>
                    <input
                      type="time"
                      value={backupTime}
                      onChange={(e) => setBackupTime(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Status Message from Sending */}
              {sendResultMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  sendResultMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {sendResultMsg.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{sendResultMsg.text}</span>
                </div>
              )}
            </div>

            {/* Action Buttons for Telegram */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleSaveTelegramConfig}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer"
              >
                Simpan Pengaturan Telegram
              </button>

              <button
                type="button"
                disabled={isSendingBackup}
                onClick={handleSendBackupNow}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-4 h-4 text-white ${isSendingBackup ? 'animate-spin' : ''}`} />
                <span>{isSendingBackup ? 'Mengirim ke Telegram...' : 'Kirim Backup ke Telegram Sekarang'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Download JSON */}
        {activeTab === 'download' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-emerald-900 text-xs">Unduh Salinan Cadangan Sistem (.JSON)</h3>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Berkas cadangan memuat seluruh data penting perusahaan secara komprehensif: master karyawan, seluruh rekaman presensi GPS, akumulasi lembur & gaji, laporan kerja harian, shift, hingga profil dan kebijakan perusahaan.
              </p>
            </div>

            {/* Data summary being downloaded */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                Isi Berkas Cadangan Snapshot Saat Ini:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-slate-900">{backupData.summary.totalEmployees}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Karyawan</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-emerald-600">{backupData.summary.totalAttendances}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Log Presensi</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-indigo-600">{backupData.summary.totalWorkReports}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Laporan Kerja</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-purple-600">{backupData.summary.totalAssignments}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Tugas Lapangan</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 text-xs">File: backup-presensi-gps.json</div>
                <div className="text-[11px] text-slate-500">Format standar JSON mandiri, terenkapsulasi aman.</div>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Unduh File Backup Sekarang</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Restore Data */}
        {activeTab === 'restore' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-amber-900 text-xs">Pulihkan Database Sistem (Restore)</h3>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pilih berkas cadangan JSON yang sebelumnya telah diunduh atau dikirim oleh Bot Telegram untuk memulihkan seluruh data dan pengaturan sistem.
              </p>
            </div>

            {/* File Upload Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 transition text-center cursor-pointer space-y-2"
            >
              <FileJson className="w-10 h-10 text-indigo-500 mx-auto" />
              <div className="font-bold text-slate-800 text-xs">
                Klik untuk Memilih Berkas Cadangan (.JSON)
              </div>
              <p className="text-[11px] text-slate-500">
                Pilih file backup yang berakhiran <code className="bg-slate-200 px-1 py-0.5 rounded">.json</code>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Parsing error */}
            {parseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Valid Parsed File Summary Card */}
            {parsedFile && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-emerald-900 text-xs">
                      Berkas Cadangan Terverifikasi Valid
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {parsedFile.exportTimestampReadable}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white border border-emerald-200">
                    <div className="font-extrabold text-slate-900">{parsedFile.summary.totalEmployees}</div>
                    <div className="text-[10px] text-slate-500">Karyawan</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-emerald-200">
                    <div className="font-extrabold text-emerald-700">{parsedFile.summary.totalAttendances}</div>
                    <div className="text-[10px] text-slate-500">Presensi</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-emerald-200">
                    <div className="font-extrabold text-indigo-700">{parsedFile.summary.totalWorkReports}</div>
                    <div className="text-[10px] text-slate-500">Laporan</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-emerald-200">
                    <div className="font-extrabold text-purple-700">{parsedFile.summary.totalAssignments}</div>
                    <div className="text-[10px] text-slate-500">Tugas</div>
                  </div>
                </div>

                {/* Restore Mode Choice */}
                <div className="pt-2 border-t border-emerald-200/80 space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase">
                    Pilih Metode Pemulihan:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                      restoreMode === 'replace' ? 'bg-white border-emerald-600 shadow-2xs' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">Gantikan Semua Data (Replace)</div>
                        <div className="text-[10px] text-slate-500">Menimpa data sistem saat ini dengan isi backup</div>
                      </div>
                      <input
                        type="radio"
                        name="restoreMode"
                        value="replace"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="text-emerald-600"
                      />
                    </label>

                    <label className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between ${
                      restoreMode === 'merge' ? 'bg-white border-indigo-600 shadow-2xs' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">Gabungkan Data (Merge)</div>
                        <div className="text-[10px] text-slate-500">Menambahkan riwayat presensi tanpa menghapus data baru</div>
                      </div>
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="text-indigo-600"
                      />
                    </label>
                  </div>
                </div>

                {/* Execute Restore Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={handleExecuteRestore}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>{isRestoring ? 'Memulihkan Data...' : 'Konfirmasi & Pulihkan Database Sekarang'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Sistem Cadangan Aman & Terenkapsulasi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
