import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Clock,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Search,
  Check,
  Sliders,
  CalendarDays,
  Sun,
  AlertCircle
} from 'lucide-react';
import { CompanyConfig, HolidayOrSpecialDay } from '../types';
import {
  INDONESIAN_NATIONAL_HOLIDAYS,
  DAYS_OF_WEEK,
  formatIndonesianDateWithDay,
  isDateSunday,
  getDayNameIndonesian,
  getDayClassification,
} from '../utils/holidays';
import { formatIDR, calculateDailyOvertimePay } from '../utils/payroll';

interface HolidayOvertimeManagerProps {
  config: CompanyConfig;
  onChangeConfig: (newConfig: CompanyConfig) => void;
  sampleBaseSalary?: number;
}

export const HolidayOvertimeManager: React.FC<HolidayOvertimeManagerProps> = ({
  config,
  onChangeConfig,
  sampleBaseSalary = 10000000, // Rp 10.000.000 untuk simulasi
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [filterType, setFilterType] = useState<'all' | 'national' | 'cuti_bersama' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newHolidayDate, setNewHolidayDate] = useState<string>('');
  const [newHolidayName, setNewHolidayName] = useState<string>('');
  const [newHolidayDesc, setNewHolidayDesc] = useState<string>('');
  const [newHolidayType, setNewHolidayType] = useState<'custom' | 'cuti_bersama' | 'special_day'>('custom');
  const [useCustomMultiplierOverride, setUseCustomMultiplierOverride] = useState<boolean>(false);
  const [customMultiplierValue, setCustomMultiplierValue] = useState<number>(2.5);

  // Simulation State
  const [simulatedHours, setSimulatedHours] = useState<number>(4);
  const [simulatedDateType, setSimulatedDateType] = useState<'workday' | 'sunday' | 'national' | 'custom'>('sunday');

  // Fallback holiday multipliers
  const holidayMultipliers = config.holidayOvertimeMultipliers && config.holidayOvertimeMultipliers.length >= 2
    ? config.holidayOvertimeMultipliers
    : [
        { tier: 1, multiplier: 2.0, description: 'Jam 1 s/d jam ke-7 (2.0x)' },
        { tier: 2, multiplier: 3.0, description: 'Jam ke-8 (3.0x)' },
        { tier: 3, multiplier: 4.0, description: 'Jam ke-9 dst (4.0x)' },
      ];

  const customHolidays = config.customHolidays || [];
  const designatedWeekendDays = config.customWeekendDays || [0]; // default: 0 (Minggu)

  // Combine national holidays + custom holidays for selected year
  const allHolidaysForYear = [
    ...(config.autoNationalHolidays !== false
      ? INDONESIAN_NATIONAL_HOLIDAYS.filter((h) => {
          if (!h.date.startsWith(`${selectedYear}-`)) return false;
          if (h.type === 'cuti_bersama' && config.includeCutiBersama === false) return false;
          return true;
        })
      : []),
    ...customHolidays.filter((h) => h.date.startsWith(`${selectedYear}-`)),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const filteredHolidays = allHolidaysForYear.filter((h) => {
    if (filterType === 'national' && h.type !== 'national_holiday') return false;
    if (filterType === 'cuti_bersama' && h.type !== 'cuti_bersama') return false;
    if (filterType === 'custom' && h.type !== 'custom' && h.type !== 'special_day') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.date.includes(q) ||
        (h.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Toggle Day of Week in customWeekendDays
  const handleToggleWeekendDay = (dayIndex: number) => {
    let nextDays = [...designatedWeekendDays];
    if (nextDays.includes(dayIndex)) {
      if (nextDays.length === 1 && nextDays[0] === dayIndex) {
        // Minimum 1 off day
        return;
      }
      nextDays = nextDays.filter((d) => d !== dayIndex);
    } else {
      nextDays.push(dayIndex);
      nextDays.sort((a, b) => a - b);
    }

    onChangeConfig({
      ...config,
      customWeekendDays: nextDays,
      autoSundayOvertime: nextDays.includes(0),
    });
  };

  // Preset Multipliers
  const handleApplyPreset = (preset: 'depnaker' | 'flat' | 'premium') => {
    let newMultipliers = [...holidayMultipliers];
    if (preset === 'depnaker') {
      newMultipliers = [
        { tier: 1, multiplier: 2.0, description: 'Jam ke-1 s/d ke-7/8 (2.0x Upah Per Jam)' },
        { tier: 2, multiplier: 3.0, description: 'Jam ke-8/9 (3.0x Upah Per Jam)' },
        { tier: 3, multiplier: 4.0, description: 'Jam ke-9+ dst (4.0x Upah Per Jam)' },
      ];
    } else if (preset === 'flat') {
      newMultipliers = [
        { tier: 1, multiplier: 2.0, description: 'Jam ke-1 s/d ke-7 (2.0x Upah Per Jam)' },
        { tier: 2, multiplier: 2.0, description: 'Jam ke-8 (2.0x Upah Per Jam)' },
        { tier: 3, multiplier: 2.0, description: 'Jam ke-9+ (2.0x Upah Per Jam)' },
      ];
    } else if (preset === 'premium') {
      newMultipliers = [
        { tier: 1, multiplier: 2.5, description: 'Jam ke-1 s/d ke-7 (2.5x Upah Per Jam)' },
        { tier: 2, multiplier: 3.5, description: 'Jam ke-8 (3.5x Upah Per Jam)' },
        { tier: 3, multiplier: 4.5, description: 'Jam ke-9+ (4.5x Upah Per Jam)' },
      ];
    }

    onChangeConfig({
      ...config,
      holidayOvertimeMultipliers: newMultipliers,
    });
  };

  // Add Custom Holiday / Hari Tertentu
  const handleAddCustomHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayName.trim()) return;

    const newHoliday: HolidayOrSpecialDay = {
      id: `CUSTOM-HOL-${Date.now()}`,
      date: newHolidayDate,
      name: newHolidayName.trim(),
      type: newHolidayType,
      description: newHolidayDesc.trim() || undefined,
      customMultiplier: useCustomMultiplierOverride ? customMultiplierValue : undefined,
    };

    const updatedCustoms = [...customHolidays, newHoliday];
    onChangeConfig({
      ...config,
      customHolidays: updatedCustoms,
    });

    setNewHolidayDate('');
    setNewHolidayName('');
    setNewHolidayDesc('');
    setUseCustomMultiplierOverride(false);
    setIsAddModalOpen(false);
  };

  // Delete Custom Holiday
  const handleDeleteCustomHoliday = (id: string) => {
    const updatedCustoms = customHolidays.filter((h) => h.id !== id);
    onChangeConfig({
      ...config,
      customHolidays: updatedCustoms,
    });
  };

  // Update Holiday Multiplier Tier
  const handleUpdateHolidayMultiplier = (tierIdx: number, newMultiplier: number) => {
    const updated = [...holidayMultipliers];
    if (updated[tierIdx]) {
      updated[tierIdx] = {
        ...updated[tierIdx],
        multiplier: Math.max(1, Number(newMultiplier)),
      };
      onChangeConfig({
        ...config,
        holidayOvertimeMultipliers: updated,
      });
    }
  };

  // Simulation calculations
  const regSimulation = calculateDailyOvertimePay(simulatedHours, sampleBaseSalary, config, '2026-09-02'); // Wednesday
  const sunSimulation = calculateDailyOvertimePay(simulatedHours, sampleBaseSalary, config, '2026-09-06'); // Sunday
  const natSimulation = calculateDailyOvertimePay(simulatedHours, sampleBaseSalary, config, '2026-08-17'); // 17 Agustus
  const customSimulation = calculateDailyOvertimePay(simulatedHours, sampleBaseSalary, config, '2026-09-04'); // HUT Perusahaan

  const activeSimulation =
    simulatedDateType === 'workday'
      ? regSimulation
      : simulatedDateType === 'sunday'
      ? sunSimulation
      : simulatedDateType === 'national'
      ? natSimulation
      : customSimulation;

  return (
    <div className="space-y-6" id="holiday-overtime-manager">
      {/* Top Banner Card: Mode Otomatis vs Custom */}
      <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-rose-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                Kalender Hari Libur & Lembur Khusus
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PP 35/2021 & Depnaker Compliant
              </span>
              {config.overtimeHolidayMode === 'custom' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Mode: Kustom Perusahaan
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Mode: Otomatis Kalender Resmi
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Gaji Lembur Hari Minggu, Hari Tertentu & Tanggal Merah
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Kalkulasi lembur transparan & otomatis: lembur pada <strong>Hari Kerja Biasa</strong> menggunakan tarif reguler (1.5x - 2.0x), sedangkan lembur pada <strong>Hari Minggu</strong>, <strong>Hari Tertentu Mingguan</strong>, <strong>Tanggal Merah Nasional (SKB 3 Menteri)</strong>, atau <strong>Hari Libur Kustom</strong> otomatis menggunakan tarif lembur libur khusus (2.0x - 4.0x) atau pengali kustom per hari.
            </p>
          </div>

          {/* Mode Switcher Toggle */}
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-700/80 shrink-0 space-y-2 min-w-[280px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilihan Mode Kebijakan Lembur
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="btn-mode-auto"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    overtimeHolidayMode: 'auto',
                    autoSundayOvertime: true,
                    autoNationalHolidays: true,
                  })
                }
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  config.overtimeHolidayMode !== 'custom'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Otomatis Kalender</span>
              </button>
              <button
                type="button"
                id="btn-mode-custom"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    overtimeHolidayMode: 'custom',
                  })
                }
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  config.overtimeHolidayMode === 'custom'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kustom Perusahaan</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              {config.overtimeHolidayMode !== 'custom'
                ? '✓ Mengikuti kalender nasional Indonesia resmi & Hari Minggu'
                : '✓ Menggunakan daftar tanggal & hari libur kustom perusahaan'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns (Left: Settings & Multipliers, Right: Live Simulator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Toggles & Multipliers (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Pengaturan Hari Minggu, Hari Tertentu & Tanggal Merah */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-rose-600" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Pengaturan Deteksi Hari Minggu & Tanggal Merah
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tentukan hari istirahat mingguan dan kalender libur yang dihitung lembur khusus
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Toggle Hari Minggu */}
              <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs text-slate-900">
                      Otomatis Lembur Hari Minggu
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Sunday Off-Day
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Setiap presensi lembur pada hari Minggu otomatis dihitung tarif libur (Tier 1: 2.0x, Tier 2: 3.0x, Tier 3: 4.0x) tanpa perlu persetujuan manual.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={config.autoSundayOvertime !== false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      let days = [...designatedWeekendDays];
                      if (checked && !days.includes(0)) days.push(0);
                      if (!checked && days.includes(0)) days = days.filter((d) => d !== 0);
                      onChangeConfig({
                        ...config,
                        autoSundayOvertime: checked,
                        customWeekendDays: days,
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Hari Tertentu dalam Seminggu (Weekly Off-Days Selector) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs text-slate-900">
                      Hari Tertentu Mingguan (Hari Istirahat Rutin)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Pilih hari off-day rutin perusahaan
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pilih hari apa saja dalam seminggu yang diberlakukan tarif lembur libur (Contoh: aktifkan <strong>Sabtu & Minggu</strong> untuk sistem 5 hari kerja, atau hanya <strong>Minggu</strong> untuk 6 hari kerja):
                </p>

                {/* Day selector pills */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = designatedWeekendDays.includes(day.index);
                    return (
                      <button
                        key={day.index}
                        type="button"
                        onClick={() => handleToggleWeekendDay(day.index)}
                        className={`py-2 px-1 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                        title={`${day.name} - Klik untuk ${isSelected ? 'menonaktifkan' : 'mengaktifkan'} tarif libur`}
                      >
                        <span className="text-xs font-bold leading-tight">{day.short}</span>
                        <span className="text-[9px] mt-0.5 opacity-80">
                          {isSelected ? 'Libur' : 'Kerja'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Hari Istirahat Aktif:{' '}
                    <strong>
                      {designatedWeekendDays
                        .map((d) => DAYS_OF_WEEK[d]?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </strong>{' '}
                    (Otomatis tarif lembur khusus 2x - 4x)
                  </span>
                </div>
              </div>

              {/* Toggle Tanggal Merah Nasional (SKB 3 Menteri) */}
              <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Otomatis Tanggal Merah Nasional (SKB 3 Menteri)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      Kalender Resmi RI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sinkronisasi otomatis dengan kalender libur nasional resmi Republik Indonesia (Tahun Baru, Idul Fitri, Kemerdekaan RI 17 Agustus, Natal, Waisak, Nyepi, dsb.).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={config.autoNationalHolidays !== false}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        autoNationalHolidays: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Toggle Cuti Bersama Pemerintah */}
              <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      Sertakan Cuti Bersama Resmi Pemerintah
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Cuti Bersama
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Hari cuti bersama resmi pemerintah (misal cuti bersama Lebaran, Natal, Imlek) juga diperlakukan otomatis dengan tarif lembur hari libur jika karyawan ditugaskan masuk kerja.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={config.includeCutiBersama !== false}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        includeCutiBersama: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Kelipatan Multiplier Lembur Libur (Tiers) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Tarif Kelipatan Lembur Hari Minggu & Libur (Tiers)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Kustomisasi kelipatan upah per jam untuk hari istirahat & tanggal merah
                  </p>
                </div>
              </div>
              
              {/* Presets Button */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('depnaker')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                  title="2.0x, 3.0x, 4.0x (Sesuai PP 35/2021)"
                >
                  Standar Depnaker
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('flat')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                  title="Flat 2.0x untuk semua jam"
                >
                  Flat 2.0x
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('premium')}
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                  title="2.5x, 3.5x, 4.5x"
                >
                  Premium
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tier 1 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/40 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider block">
                  Tier 1 (Jam 1 s/d Jam ke-7)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={holidayMultipliers[0]?.multiplier || 2.0}
                    onChange={(e) => handleUpdateHolidayMultiplier(0, Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-black text-slate-900 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-700">x</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Regulasi PP 35: 2.0x upah per jam
                </span>
              </div>

              {/* Tier 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/40 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider block">
                  Tier 2 (Jam ke-8)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={holidayMultipliers[1]?.multiplier || 3.0}
                    onChange={(e) => handleUpdateHolidayMultiplier(1, Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-black text-slate-900 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-700">x</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Regulasi PP 35: 3.0x upah per jam
                </span>
              </div>

              {/* Tier 3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/40 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider block">
                  Tier 3 (Jam ke-9+ dst)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={holidayMultipliers[2]?.multiplier || 4.0}
                    onChange={(e) => handleUpdateHolidayMultiplier(2, Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-black text-slate-900 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-slate-700">x</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Regulasi PP 35: 4.0x upah per jam
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <span>
                Rumus Upah Lembur Per Jam = <strong>Gaji Pokok ÷ {config.hourlyRateDivider}</strong>. Hari kerja biasa: Jam ke-1 ({config.overtimeMultipliers[0]?.multiplier || 1.5}x), Jam ke-2+ ({config.overtimeMultipliers[1]?.multiplier || 2.0}x).
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Comparison & Interactive Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">
                  Kalkulator Simulasi Lembur Live
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Basis: {formatIDR(sampleBaseSalary)}
              </span>
            </div>

            {/* Select Day Type for Simulator */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Uji Tipe Hari:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSimulatedDateType('workday')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    simulatedDateType === 'workday'
                      ? 'bg-slate-700 text-white border border-slate-500'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Hari Kerja Biasa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDateType('sunday')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    simulatedDateType === 'sunday'
                      ? 'bg-amber-600 text-white border border-amber-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Hari Minggu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDateType('national')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    simulatedDateType === 'national'
                      ? 'bg-rose-600 text-white border border-rose-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Tanggal Merah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDateType('custom')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    simulatedDateType === 'custom'
                      ? 'bg-purple-600 text-white border border-purple-400'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Hari Tertentu</span>
                </button>
              </div>
            </div>

            {/* Slider / Input for hours */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Durasi Jam Lembur:</span>
                <span className="text-lg font-mono font-extrabold text-emerald-400">
                  {simulatedHours} Jam
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={simulatedHours}
                onChange={(e) => setSimulatedHours(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 Jam</span>
                <span>4 Jam</span>
                <span>8 Jam</span>
                <span>12 Jam</span>
              </div>
            </div>

            {/* Active Simulation Result Banner */}
            <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  {activeSimulation.dayTypeTitle}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeSimulation.isHolidayOrSunday ? 'Tarif Lembur Libur' : 'Tarif Reguler'}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatIDR(activeSimulation.amount)}
                </span>
                <span className="text-xs text-slate-400">
                  ({simulatedHours} jam kerja lembur)
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-700/60 pt-2">
                {activeSimulation.rateDescription} • Upah per jam: {formatIDR(activeSimulation.hourlyRate)}
              </p>
            </div>

            {/* Comparison Side-by-Side Cards */}
            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-300 font-semibold">Hari Kerja Reguler</div>
                  <div className="text-[10px] text-slate-400">1.5x (jam 1) + 2.0x (jam 2+)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-200">{formatIDR(regSimulation.amount)}</div>
                  <span className="text-[10px] text-slate-400">Standar</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs">
                <div>
                  <div className="text-rose-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Hari Minggu / Tanggal Merah
                  </div>
                  <div className="text-[10px] text-rose-200/70">2.0x (1-7j) + 3.0x (8j) + 4.0x (9j+)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-emerald-400">{formatIDR(sunSimulation.amount)}</div>
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    +{Math.round(((sunSimulation.amount - regSimulation.amount) / (regSimulation.amount || 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Calendar Table (National, Cuti Bersama, & Custom Holidays) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="calendar-table-section">
        {/* Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-base text-slate-900">
                Kalender Tanggal Merah & Hari Tertentu
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar tanggal merah resmi, cuti bersama SKB 3 Menteri, dan hari libur tertentu perusahaan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
            >
              <option value={2025}>Tahun 2025</option>
              <option value={2026}>Tahun 2026</option>
              <option value={2027}>Tahun 2027</option>
            </select>

            {/* Filter Type */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua ({allHolidaysForYear.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('national')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'national' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Nasional
              </button>
              <button
                type="button"
                onClick={() => setFilterType('cuti_bersama')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'cuti_bersama' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cuti Bersama
              </button>
              <button
                type="button"
                onClick={() => setFilterType('custom')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterType === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Kustom ({customHolidays.filter((h) => h.date.startsWith(`${selectedYear}-`)).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari hari libur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 text-slate-800 bg-white w-36 sm:w-44 focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Add Custom Button */}
            <button
              type="button"
              id="btn-add-custom-holiday"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Hari Tertentu</span>
            </button>
          </div>
        </div>

        {/* Calendar Table */}
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Tanggal & Hari</th>
                <th className="py-3 px-4">Nama Hari Libur / Acara</th>
                <th className="py-3 px-4">Kategori Libur</th>
                <th className="py-3 px-4">Kelipatan Lembur</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada tanggal libur tercatat untuk filter ini di tahun {selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((h) => {
                  const isSunday = isDateSunday(h.date);
                  const isCustom = h.type === 'custom' || h.type === 'special_day';
                  const isCuti = h.type === 'cuti_bersama';

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isCustom
                                ? 'bg-purple-500'
                                : isCuti
                                ? 'bg-blue-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <div>
                            <div className="font-bold text-slate-900">{h.date}</div>
                            <div className="text-[11px] text-slate-500 font-sans">
                              {formatIndonesianDateWithDay(h.date)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{h.name}</div>
                        {h.description && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            {h.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isCustom ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            🏢 Kustom Perusahaan
                          </span>
                        ) : isCuti ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            🏖️ Cuti Bersama RI
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            🇮🇩 Libur Nasional Resmi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {h.customMultiplier ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Tarif Khusus: {h.customMultiplier}x Flat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Tarif Libur (2x - 4x)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isCustom ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomHoliday(h.id)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                            title="Hapus Tanggal Kustom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Otomatis SKB</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Tanggal Merah / Hari Tertentu Custom */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-600" />
                <h4 className="font-bold text-base text-slate-900">
                  Tambah Hari Tertentu / Libur Custom
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomHoliday} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Tanggal Tertentu / Libur Khusus
                </label>
                <input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                />
                {newHolidayDate && (
                  <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                    {formatIndonesianDateWithDay(newHolidayDate)}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Hari Tertentu / Keterangan Acara
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: HUT Perusahaan ke-15, Hari Libur Pabrik, Pilkada"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={newHolidayType}
                  onChange={(e) => setNewHolidayType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                >
                  <option value="custom">Hari Libur Kustom Perusahaan</option>
                  <option value="special_day">Hari Khusus Proyek / Lapangan</option>
                  <option value="cuti_bersama">Cuti Bersama Internal</option>
                </select>
              </div>

              {/* Custom Multiplier Override */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Kustomisasi Tarif Pengali Khusus Hari Ini
                  </span>
                  <input
                    type="checkbox"
                    checked={useCustomMultiplierOverride}
                    onChange={(e) => setUseCustomMultiplierOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                </div>
                {useCustomMultiplierOverride ? (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-600">Pengali Flat:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="10.0"
                      value={customMultiplierValue}
                      onChange={(e) => setCustomMultiplierValue(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                    />
                    <span className="text-xs font-bold text-slate-700">x Upah Per Jam</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    Default: Mengikuti deret tarif lembur libur standar (Tier 1: 2.0x, Tier 2: 3.0x, Tier 3: 4.0x).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kebijakan atau divisi operasional yang berhak..."
                  value={newHolidayDesc}
                  onChange={(e) => setNewHolidayDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-900 bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  Simpan Tanggal Libur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
