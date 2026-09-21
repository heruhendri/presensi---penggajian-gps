import React, { useState, useRef } from 'react';
import {
  Building2,
  Sparkles,
  Check,
  RefreshCw,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  Trash2,
  Eye,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Stamp,
  Sliders,
  Info,
  Bot,
  Send,
  KeyRound,
  Clock
} from 'lucide-react';
import { CompanyConfig } from '../types';
import { INITIAL_CONFIG } from '../data/mockData';
import { testTelegramBotConnection } from '../utils/telegramBackup';

interface CompanyProfileSettingsProps {
  config: CompanyConfig;
  onUpdateConfig: (newConfig: CompanyConfig) => void;
  onShowToast?: (message: string) => void;
}

export const CompanyProfileSettings: React.FC<CompanyProfileSettingsProps> = ({
  config,
  onUpdateConfig,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<CompanyConfig>({
    ...config,
    appName: config.appName || 'Sistem Presensi & Payroll GPS',
    appTagline: config.appTagline || 'Presensi Real-Time GPS, Lembur Otomatis & Penggajian Terintegrasi',
    appVersion: config.appVersion || 'v3.5 Enterprise GPS',
    companyCity: config.companyCity || 'Jakarta Selatan, DKI Jakarta',
    companyPostalCode: config.companyPostalCode || '12190',
    companyIndustry: config.companyIndustry || 'Teknologi Informasi & Rekayasa Konstruksi',
    companyDirectorTitle: config.companyDirectorTitle || 'Direktur Utama',
    companyStampUrl: config.companyStampUrl || '',
  });

  const [activeSubTab, setActiveSubTab] = useState<'app-identity' | 'company-legal' | 'contact-location' | 'logo-branding' | 'telegram-backup' | 'preview'>('app-identity');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{ success: boolean; botName?: string; username?: string; error?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (key: keyof CompanyConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaveSuccess(null);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateConfig(formData);
    setSaveSuccess('Perubahan profil perusahaan dan nama aplikasi berhasil disimpan!');
    if (onShowToast) {
      onShowToast('Profil perusahaan & nama aplikasi berhasil diperbarui!');
    }
    setTimeout(() => {
      setSaveSuccess(null);
    }, 4000);
  };

  // Handle Logo Upload File (converts file to Base64 data URL)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('File harus berupa gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('Ukuran file logo maksimal 2MB agar performa tetap cepat.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleFieldChange('companyLogo', result);
        if (onShowToast) {
          onShowToast('Logo perusahaan berhasil dimuat. Klik "Simpan Perubahan" untuk menerapkan.');
        }
      }
    };
    reader.onerror = () => {
      setLogoUploadError('Gagal membaca file gambar logo.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleFieldChange('companyLogo', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset to default factory configuration
  const handleResetToDefault = () => {
    setFormData({
      ...INITIAL_CONFIG,
      adminUsername: config.adminUsername || INITIAL_CONFIG.adminUsername,
      adminPassword: config.adminPassword || INITIAL_CONFIG.adminPassword,
    });
    setIsResetConfirmOpen(false);
    onUpdateConfig({
      ...INITIAL_CONFIG,
      adminUsername: config.adminUsername || INITIAL_CONFIG.adminUsername,
      adminPassword: config.adminPassword || INITIAL_CONFIG.adminPassword,
    });
    setSaveSuccess('Profil perusahaan dan nama aplikasi telah dikembalikan ke standar awal.');
    if (onShowToast) {
      onShowToast('Profil berhasil di-reset ke standar bawaan.');
    }
  };

  // Preset logo options for fast corporate customization
  const presetLogos = [
    {
      name: 'Modern Emerald Corporate',
      preview: '🏢',
      color: 'from-emerald-600 to-teal-500',
    },
    {
      name: 'Royal Indigo Tech',
      preview: '⚡',
      color: 'from-indigo-600 to-blue-500',
    },
    {
      name: 'Industrial Amber & Slate',
      preview: '🏗️',
      color: 'from-amber-600 to-orange-500',
    },
    {
      name: 'Sovereign Crimson Pro',
      preview: '🛡️',
      color: 'from-rose-600 to-red-500',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sliders className="w-3.5 h-3.5" />
              <span>Pengaturan Branding & Identitas Bisnis</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Profil Perusahaan & Nama Aplikasi</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Ubah nama aplikasi, logo, alamat kantor pusat, nama Direktur, serta informasi legalitas perusahaan. Semua perubahan akan langsung diterapkan pada Navbar, portal karyawan, kop surat laporan, dan slip gaji PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Bawaan</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('app-identity')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'app-identity'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nama & Branding Aplikasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('company-legal')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'company-legal'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Profil & Legalitas Perusahaan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contact-location')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'contact-location'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>Kontak & Lokasi Kantor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logo-branding')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'logo-branding'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>Logo & Stempel Perusahaan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('telegram-backup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'telegram-backup'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-sky-400" />
          <span>Cadangan Harian Bot Telegram</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('preview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'preview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-teal-400" />
          <span>Pratinjau Langsung (Preview)</span>
        </button>
      </div>

      {/* SUB-TAB 1: NAMA & BRANDING APLIKASI */}
      {activeSubTab === 'app-identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Identitas & Judul Aplikasi</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasikan nama aplikasi yang tampil di bagian atas navigasi, tab peramban, portal absensi, dan dokumen resmi.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Aplikasi Utama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.appName || ''}
                  onChange={(e) => handleFieldChange('appName', e.target.value)}
                  placeholder="Contoh: Sistem Presensi & Payroll GPS, Nusantara Attendance Pro"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tampil pada header aplikasi, kartu login, serta judul tab browser pengguna.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Slogan / Tagline Aplikasi
                </label>
                <input
                  type="text"
                  value={formData.appTagline || ''}
                  onChange={(e) => handleFieldChange('appTagline', e.target.value)}
                  placeholder="Contoh: Presensi Real-Time GPS, Lembur Otomatis & Penggajian Terintegrasi"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Deskripsi singkat yang tampil tepat di bawah nama aplikasi pada header.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor / Versi Rilis Aplikasi
                  </label>
                  <input
                    type="text"
                    value={formData.appVersion || ''}
                    onChange={(e) => handleFieldChange('appVersion', e.target.value)}
                    placeholder="Contoh: v3.5 Enterprise GPS"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Teks Hak Cipta & Pengenal Footer
                  </label>
                  <input
                    type="text"
                    value={`© ${new Date().getFullYear()} ${formData.companyName}`}
                    disabled
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dihasilkan otomatis mengikuti nama perusahaan dan tahun berjalan.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Nama Aplikasi</span>
              </button>
            </div>
          </div>

          {/* Side Info Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Lokasi Penayangan Nama Aplikasi</span>
            </div>
            <ul className="space-y-2 text-slate-600 text-[11px] leading-relaxed list-disc list-inside">
              <li><strong>Bilah Navigasi Atas (Navbar):</strong> Judul utama aplikasi berdampingan dengan logo perusahaan.</li>
              <li><strong>Portal Presensi Karyawan:</strong> Kartu ucapan selamat datang dan formulir check-in/out GPS.</li>
              <li><strong>Laporan Payroll & PDF:</strong> Judul header pada slip gaji, surat penugasan dinas, dan rekapitulasi penggajian.</li>
              <li><strong>Tab Browser:</strong> Judul halaman web yang terlihat di peramban pengguna.</li>
            </ul>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contoh Tampilan Header:</span>
              <div className="font-extrabold text-sm text-slate-900">{formData.appName || 'Sistem Presensi GPS'}</div>
              <div className="text-[11px] text-slate-500">{formData.appTagline || 'Presensi & Penggajian Terintegrasi'}</div>
              <div className="text-[10px] font-semibold text-emerald-700 mt-1">Perusahaan: {formData.companyName}</div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PROFIL & LEGALITAS PERUSAHAAN */}
      {activeSubTab === 'company-legal' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Informasi Legalitas & Pimpinan Perusahaan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Detail resmi perusahaan yang dicantumkan pada kop surat, formulir penugasan, slip gaji resmi, dan stempel dokumen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Resmi Lembaga / Perusahaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                placeholder="Contoh: PT Nusantara Sinergi Utama, CV Maju Bersama"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Dicantumkan sebagai badan usaha resmi pada seluruh laporan PDF dan slip gaji.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Bidang Usaha / Sektor Industri
              </label>
              <input
                type="text"
                value={formData.companyIndustry || ''}
                onChange={(e) => handleFieldChange('companyIndustry', e.target.value)}
                placeholder="Contoh: Teknologi Informasi, Manufaktur, Konstruksi & Rekayasa"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Pokok Wajib Pajak (NPWP Perusahaan)
              </label>
              <input
                type="text"
                value={formData.companyTaxNumber || ''}
                onChange={(e) => handleFieldChange('companyTaxNumber', e.target.value)}
                placeholder="01.234.567.8-012.000"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tercetak pada kop surat resmi laporan pajak penggajian (PPh 21).
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Situs Web Resmi (Website)
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={formData.companyWebsite || ''}
                  onChange={(e) => handleFieldChange('companyWebsite', e.target.value)}
                  placeholder="https://perusahaan.co.id"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Direktur Utama / Penandatangan Dokumen <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.companyDirector || ''}
                onChange={(e) => handleFieldChange('companyDirector', e.target.value)}
                placeholder="Contoh: Ir. Heru Hendriawan, M.M."
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Nama yang dibubuhkan pada kolom tanda tangan slip gaji dan surat perintah lembur.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jabatan Penandatangan Dokumen
              </label>
              <input
                type="text"
                value={formData.companyDirectorTitle || ''}
                onChange={(e) => handleFieldChange('companyDirectorTitle', e.target.value)}
                placeholder="Contoh: Direktur Utama, Human Resource Director, General Manager"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Keterangan jabatan di bawah tanda tangan resmi.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Profil Legalitas</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: KONTAK & LOKASI KANTOR */}
      {activeSubTab === 'contact-location' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Alamat Kantor Pusat & Kontak Perusahaan</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Alamat fisik gedung kantor dan saluran komunikasi resmi yang digunakan dalam surat-menyurat dan informasi karyawan.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alamat Lengkap Kantor Pusat <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={formData.companyAddress}
                onChange={(e) => handleFieldChange('companyAddress', e.target.value)}
                placeholder="Nama Gedung, Lantai, Jalan, Kelurahan, Kecamatan, Kota"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Alamat ini akan dicetak di baris kedua kop surat dokumen resmi perusahaan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kota / Wilayah Domisili
                </label>
                <input
                  type="text"
                  value={formData.companyCity || ''}
                  onChange={(e) => handleFieldChange('companyCity', e.target.value)}
                  placeholder="Jakarta Selatan, DKI Jakarta"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={formData.companyPostalCode || ''}
                  onChange={(e) => handleFieldChange('companyPostalCode', e.target.value)}
                  placeholder="12190"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Telepon Kantor
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formData.companyPhone || ''}
                    onChange={(e) => handleFieldChange('companyPhone', e.target.value)}
                    placeholder="+62 21 520 8899"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Resmi Perusahaan
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.companyEmail || ''}
                    onChange={(e) => handleFieldChange('companyEmail', e.target.value)}
                    placeholder="kontak@perusahaan.co.id"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block font-bold text-slate-700 mb-1">
                Email Administrator HRD (Penerima Notifikasi & Laporan Penggajian)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.adminAlertEmail || ''}
                  onChange={(e) => handleFieldChange('adminAlertEmail', e.target.value)}
                  placeholder="hrd.admin@perusahaan.co.id"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Alamat & Kontak</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LOGO & STEMPEL PERUSAHAAN */}
      {activeSubTab === 'logo-branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Upload Logo & Identitas Visual Perusahaan</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah file gambar logo asli perusahaan Anda atau masukkan link URL logo. Logo akan otomatis muncul di navigasi, portal absensi, dan kop surat PDF.
              </p>
            </div>

            {logoUploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{logoUploadError}</span>
              </div>
            )}

            {/* Current Logo & Uploader Box */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              {/* Logo Preview Avatar */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md border-2 border-white overflow-hidden">
                  {formData.companyLogo ? (
                    <img
                      src={formData.companyLogo}
                      alt={formData.companyName}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setLogoUploadError('URL gambar logo gagal dimuat.');
                      }}
                    />
                  ) : (
                    <Building2 className="w-12 h-12" />
                  )}
                </div>

                {formData.companyLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer"
                    title="Hapus Logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-3 flex-1 text-xs text-center sm:text-left">
                <div>
                  <h4 className="font-bold text-slate-900">
                    {formData.companyLogo ? 'Logo Kustom Sedang Digunakan' : 'Belum Ada Logo Kustom (Menggunakan Ikon Bawaan)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung format PNG, JPG, SVG, WebP (Rasio 1:1 persegi direkomendasikan, maks 2MB).
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/*"
                    className="hidden"
                    id="company-logo-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Logo dari Komputer</span>
                  </button>

                  {formData.companyLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold text-xs transition cursor-pointer"
                    >
                      Hapus Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Alternatif: Input URL Gambar Logo */}
            <div className="text-xs space-y-1.5">
              <label className="block font-bold text-slate-700">
                Atau Masukkan URL Gambar Logo Online:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={formData.companyLogo?.startsWith('data:') ? '' : formData.companyLogo || ''}
                  onChange={(e) => handleFieldChange('companyLogo', e.target.value)}
                  placeholder="https://contoh-perusahaan.com/logo.png"
                  className="flex-1 p-2.5 rounded-xl border border-slate-300 text-slate-800 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {formData.companyLogo?.startsWith('data:') && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    File Base64 Terpilih
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Jika Anda memiliki logo yang di-host online, Anda dapat menempelkan tautan langsungnya di sini.
              </p>
            </div>

            {/* Pengaturan Stempel Digital Perusahaan */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Stamp className="w-4 h-4 text-emerald-600" />
                <span>Stempel Resmi / Cap Perusahaan pada Dokumen PDF</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sistem secara otomatis membuat stempel bulat resmi berkode hash digital yang memuat nama perusahaan <strong>{formData.companyName}</strong> pada setiap slip gaji dan rekapitulasi.
              </p>

              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-900">Stempel Bulat Otomatis Aktif</div>
                  <div className="text-[11px] text-emerald-700">
                    Memuat nama instansi: "{formData.companyName.toUpperCase()}" & nomor dokumen verifikasi.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                  Aktif Otomatis
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Pengaturan Logo</span>
              </button>
            </div>
          </div>

          {/* Quick Presets Box */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Preset Gaya Logo Alternatif</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Jika Anda belum memiliki file logo, Anda dapat memilih palet warna kartu identitas perusahaan di bawah ini:
              </p>

              <div className="space-y-2 pt-1">
                {presetLogos.map((preset, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition flex items-center gap-3"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${preset.color} flex items-center justify-center text-white text-base shadow-xs shrink-0`}>
                      {preset.preview}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-400">Siap untuk identitas brand</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 rounded-2xl p-5 border border-indigo-100 text-xs space-y-2">
              <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Penyimpanan Aman di Browser</span>
              </div>
              <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                Seluruh logo dan konfigurasi profil tersimpan secara persisten di penyimpanan lokal (Local Storage) dan otomatis tersinkronisasi saat membuat laporan dan slip gaji.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: CADANGAN HARIAN TELEGRAM BOT */}
      {activeSubTab === 'telegram-backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Konfigurasi Cadangan Otomatis Harian Bot Telegram
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kirim dokumen snapshot basis data (.JSON) secara otomatis setiap hari langsung ke Bot atau Grup Telegram HRD Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan Telegram</span>
            </button>
          </div>

          {/* Status info of last backup */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Status Cadangan Telegram Terakhir</span>
              </span>
              <div className="text-slate-600 text-[11px]">
                Waktu: <strong>{formData.lastTelegramBackupTime || 'Belum ada pengiriman'}</strong>
                {formData.lastTelegramBackupMessage && (
                  <span className="block text-slate-500 mt-0.5">{formData.lastTelegramBackupMessage}</span>
                )}
              </div>
            </div>

            <div>
              {formData.lastTelegramBackupStatus === 'success' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cadangan Terakhir Berhasil</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                  <span>Siap Dijalankan</span>
                </span>
              )}
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Telegram Bot Token</span>
                </label>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
                >
                  <span>Dapatkan dari @BotFather</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={formData.telegramBotToken || ''}
                  onChange={(e) => handleFieldChange('telegramBotToken', e.target.value)}
                  placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={isTestingBot}
                  onClick={async () => {
                    if (!formData.telegramBotToken) {
                      setBotTestResult({ success: false, error: 'Masukkan Token Bot terlebih dahulu' });
                      return;
                    }
                    setIsTestingBot(true);
                    setBotTestResult(null);
                    const res = await testTelegramBotConnection(formData.telegramBotToken);
                    setIsTestingBot(false);
                    setBotTestResult(res);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition shrink-0 cursor-pointer"
                >
                  {isTestingBot ? 'Memeriksa...' : 'Uji Token Bot'}
                </button>
              </div>

              {botTestResult && (
                <div className={`mt-2 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
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
                      <span>Gagal: {botTestResult.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Telegram Chat ID (Akun Anda atau ID Grup HRD)
                </label>
                <input
                  type="text"
                  value={formData.telegramChatId || ''}
                  onChange={(e) => handleFieldChange('telegramChatId', e.target.value)}
                  placeholder="Contoh: 123456789 atau -100123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Untuk akun pribadi, cari ID Anda melalui bot Telegram <code>@userinfobot</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Topic / Message Thread ID (Khusus Supergroup Forum)
                </label>
                <input
                  type="text"
                  value={formData.telegramTopicId || ''}
                  onChange={(e) => handleFieldChange('telegramTopicId', e.target.value)}
                  placeholder="Opsional, biarkan kosong untuk chat biasa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Automation settings */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-sky-600" />
                    <span>Jalankan Cadangan Otomatis Harian ke Telegram</span>
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Sistem akan otomatis mengekspor snapshot database dan mengirimkannya langsung ke Telegram setiap hari.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.telegramAutoDailyBackup ?? true}
                  onChange={(e) => handleFieldChange('telegramAutoDailyBackup', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {(formData.telegramAutoDailyBackup ?? true) && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Waktu Pengiriman Harian (WIB):
                  </label>
                  <input
                    type="time"
                    value={formData.telegramDailyBackupTime || '23:00'}
                    onChange={(e) => handleFieldChange('telegramDailyBackupTime', e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PRATINJAU LANGSUNG (LIVE PREVIEW) */}
      {activeSubTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600" />
                  <span>Pratinjau Interaktif Identitas Brand & Dokumen Resmi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Beginilah tampilan nama aplikasi, logo, dan profil perusahaan Anda di berbagai bagian sistem.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Semua Sekarang</span>
              </button>
            </div>

            {/* PREVIEW 1: TAMPILAN NAVBAR HEADER */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Tampilan Header / Bilah Navigasi Aplikasi
              </span>
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md overflow-hidden shrink-0">
                    {formData.companyLogo ? (
                      <img src={formData.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                        {formData.appName || formData.companyName}
                      </span>
                      {formData.appName && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {formData.companyName}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        GPS {formData.officeRadiusMeters}m
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {formData.appTagline || 'Presensi Real-Time GPS, Lembur Otomatis & Penggajian Terintegrasi'}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Portal Admin</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    AD
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW 2: TAMPILAN KOP SURAT RESMI (OFFICIAL LETTERHEAD UNTUK LAPORAN & SLIP) */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Tampilan Kop Surat Resmi Laporan Penggajian & Rekapitulasi PDF
              </span>
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-md space-y-4">
                {/* Official PDF Letterhead Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-xl relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-black text-base sm:text-lg tracking-wide uppercase text-white">
                        {formData.companyName}
                      </h3>
                      <p className="text-[11px] text-slate-300">
                        {formData.companyAddress}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Telp: {formData.companyPhone || '-'} | Email: {formData.companyEmail || '-'} | Web: {formData.companyWebsite || '-'}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-mono">
                        NPWP: {formData.companyTaxNumber || '01.234.567.8-012.000'} • Bidang: {formData.companyIndustry || 'Teknologi Informasi'}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 overflow-hidden">
                      {formData.companyLogo ? (
                        <img src={formData.companyLogo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
                </div>

                {/* Dummy Body Content */}
                <div className="py-2 px-1 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-center uppercase tracking-wider">
                    SLIP PEMBAYARAN GAJI & UPAH LEMBUR KARYAWAN
                  </div>
                  <div className="text-[11px] text-slate-500 text-center">
                    Periode: 21 Agustus 2026 s/d 20 September 2026 (Bulan September 2026)
                  </div>
                  <div className="border-t border-b border-slate-200 py-2 grid grid-cols-2 text-[11px] text-slate-700">
                    <div>Nama: <strong>Budi Santoso</strong> (EMP001)</div>
                    <div className="text-right">Jabatan: <strong>Senior Software Engineer</strong></div>
                  </div>
                </div>

                {/* Official Signature & Digital Circular Stamp */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <div className="text-[10px] text-slate-400">
                    <div>Dicetak melalui: {formData.appName || 'Sistem Presensi GPS'} ({formData.appVersion || 'v3.5'})</div>
                    <div>Verifikasi Digital: VALID & TERDATA RESMI</div>
                  </div>

                  {/* Signatory Box */}
                  <div className="text-right space-y-1">
                    <div className="text-[11px] text-slate-500">
                      {formData.companyCity?.split(',')[0] || 'Jakarta'}, {new Date().toLocaleDateString('id-ID')}
                    </div>
                    <div className="relative inline-block py-3 px-6">
                      {/* Stamp watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
                        <div className="w-20 h-20 rounded-full border-2 border-emerald-600 border-dashed flex flex-col items-center justify-center text-emerald-800 text-[8px] font-black uppercase text-center p-1 transform -rotate-12">
                          <span>★ {formData.companyName.slice(0, 16)} ★</span>
                          <span className="text-[7px] text-emerald-600 font-mono">RESMI PAYROLL</span>
                        </div>
                      </div>
                      <div className="font-cursive text-base text-slate-800 pt-3 italic font-serif">
                        {formData.companyDirector}
                      </div>
                    </div>
                    <div className="font-bold text-xs text-slate-900 border-t border-slate-300 pt-0.5">
                      {formData.companyDirector}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formData.companyDirectorTitle || 'Direktur Utama'} • {formData.companyName}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW 3: TAMPILAN FOOTER SISTEM */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                3. Tampilan Watermark Footer Sistem
              </span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <strong className="text-slate-900">{formData.companyName}</strong>
                  <span>•</span>
                  <span>{formData.appName || 'Sistem Presensi GPS'}</span>
                  <span>•</span>
                  <span className="text-[11px] text-slate-400">{formData.appVersion || 'v3.5 Enterprise'}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Dibuat oleh <strong className="text-emerald-700 font-bold">heruhendri</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Reset to Defaults */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">
                Kembalikan ke Profil Standar Bawaan?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Nama aplikasi, nama perusahaan, logo kustom, dan seluruh informasi profil akan di-reset ke nilai default bawaan pabrik (PT Nusantara Sinergi Utama). Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Ya, Reset ke Standar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
