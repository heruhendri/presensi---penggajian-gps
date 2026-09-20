import { CompanyConfig, HolidayOrSpecialDay } from '../types';

export const DAYS_OF_WEEK = [
  { index: 0, name: 'Minggu', short: 'Min', isDefaultOff: true },
  { index: 1, name: 'Senin', short: 'Sen', isDefaultOff: false },
  { index: 2, name: 'Selasa', short: 'Sel', isDefaultOff: false },
  { index: 3, name: 'Rabu', short: 'Rab', isDefaultOff: false },
  { index: 4, name: 'Kamis', short: 'Kam', isDefaultOff: false },
  { index: 5, name: 'Jumat', short: 'Jum', isDefaultOff: false },
  { index: 6, name: 'Sabtu', short: 'Sab', isDefaultOff: false },
];

/**
 * Daftar Hari Libur Nasional & Cuti Bersama Resmi Indonesia (SKB 3 Menteri)
 * Meliputi tahun 2025, 2026, dan 2027
 */
export const INDONESIAN_NATIONAL_HOLIDAYS: HolidayOrSpecialDay[] = [
  // ================= TAHUN 2025 =================
  { id: 'HOL-2025-01-01', date: '2025-01-01', name: 'Tahun Baru 2025 Masehi', type: 'national_holiday' },
  { id: 'HOL-2025-01-27', date: '2025-01-27', name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'national_holiday' },
  { id: 'HOL-2025-01-28', date: '2025-01-28', name: 'Cuti Bersama Isra Mi\'raj', type: 'cuti_bersama' },
  { id: 'HOL-2025-01-29', date: '2025-01-29', name: 'Tahun Baru Imlek 2576 Kongzili', type: 'national_holiday' },
  { id: 'HOL-2025-01-30', date: '2025-01-30', name: 'Cuti Bersama Tahun Baru Imlek', type: 'cuti_bersama' },
  { id: 'HOL-2025-03-28', date: '2025-03-28', name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti_bersama' },
  { id: 'HOL-2025-03-29', date: '2025-03-29', name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', type: 'national_holiday' },
  { id: 'HOL-2025-03-31', date: '2025-03-31', name: 'Hari Raya Idul Fitri 1446 Hijriah (Hari 1)', type: 'national_holiday' },
  { id: 'HOL-2025-04-01', date: '2025-04-01', name: 'Hari Raya Idul Fitri 1446 Hijriah (Hari 2)', type: 'national_holiday' },
  { id: 'HOL-2025-04-02', date: '2025-04-02', name: 'Cuti Bersama Hari Raya Idul Fitri', type: 'cuti_bersama' },
  { id: 'HOL-2025-04-03', date: '2025-04-03', name: 'Cuti Bersama Hari Raya Idul Fitri', type: 'cuti_bersama' },
  { id: 'HOL-2025-04-04', date: '2025-04-04', name: 'Cuti Bersama Hari Raya Idul Fitri', type: 'cuti_bersama' },
  { id: 'HOL-2025-04-07', date: '2025-04-07', name: 'Cuti Bersama Hari Raya Idul Fitri', type: 'cuti_bersama' },
  { id: 'HOL-2025-04-18', date: '2025-04-18', name: 'Wafat Yesus Kristus (Jumat Agung)', type: 'national_holiday' },
  { id: 'HOL-2025-04-20', date: '2025-04-20', name: 'Hari Paskah', type: 'national_holiday' },
  { id: 'HOL-2025-05-01', date: '2025-05-01', name: 'Hari Buruh Internasional (May Day)', type: 'national_holiday' },
  { id: 'HOL-2025-05-12', date: '2025-05-12', name: 'Hari Raya Waisak 2569 BE', type: 'national_holiday' },
  { id: 'HOL-2025-05-13', date: '2025-05-13', name: 'Cuti Bersama Hari Raya Waisak', type: 'cuti_bersama' },
  { id: 'HOL-2025-05-29', date: '2025-05-29', name: 'Kenaikan Yesus Kristus', type: 'national_holiday' },
  { id: 'HOL-2025-05-30', date: '2025-05-30', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti_bersama' },
  { id: 'HOL-2025-06-01', date: '2025-06-01', name: 'Hari Lahir Pancasila', type: 'national_holiday' },
  { id: 'HOL-2025-06-06', date: '2025-06-06', name: 'Hari Raya Idul Adha 1446 Hijriah', type: 'national_holiday' },
  { id: 'HOL-2025-06-09', date: '2025-06-09', name: 'Cuti Bersama Hari Raya Idul Adha', type: 'cuti_bersama' },
  { id: 'HOL-2025-06-27', date: '2025-06-27', name: 'Tahun Baru Islam 1447 Hijriah', type: 'national_holiday' },
  { id: 'HOL-2025-08-17', date: '2025-08-17', name: 'Proklamasi Kemerdekaan RI ke-80', type: 'national_holiday' },
  { id: 'HOL-2025-09-05', date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', type: 'national_holiday' },
  { id: 'HOL-2025-12-25', date: '2025-12-25', name: 'Hari Raya Natal', type: 'national_holiday' },
  { id: 'HOL-2025-12-26', date: '2025-12-26', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti_bersama' },

  // ================= TAHUN 2026 =================
  { id: 'HOL-2026-01-01', date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', type: 'national_holiday' },
  { id: 'HOL-2026-01-16', date: '2026-01-16', name: 'Isra Mi\'raj Nabi Muhammad SAW', type: 'national_holiday' },
  { id: 'HOL-2026-02-16', date: '2026-02-16', name: 'Cuti Bersama Tahun Baru Imlek', type: 'cuti_bersama' },
  { id: 'HOL-2026-02-17', date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', type: 'national_holiday' },
  { id: 'HOL-2026-03-18', date: '2026-03-18', name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti_bersama' },
  { id: 'HOL-2026-03-19', date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', type: 'national_holiday' },
  { id: 'HOL-2026-03-20', date: '2026-03-20', name: 'Hari Raya Idul Fitri 1447 Hijriah (Hari 1)', type: 'national_holiday' },
  { id: 'HOL-2026-03-21', date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 Hijriah (Hari 2)', type: 'national_holiday' },
  { id: 'HOL-2026-03-23', date: '2026-03-23', name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti_bersama' },
  { id: 'HOL-2026-03-24', date: '2026-03-24', name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti_bersama' },
  { id: 'HOL-2026-03-25', date: '2026-03-25', name: 'Cuti Bersama Idul Fitri 1447 H', type: 'cuti_bersama' },
  { id: 'HOL-2026-04-03', date: '2026-04-03', name: 'Wafat Yesus Kristus (Jumat Agung)', type: 'national_holiday' },
  { id: 'HOL-2026-04-05', date: '2026-04-05', name: 'Hari Paskah', type: 'national_holiday' },
  { id: 'HOL-2026-05-01', date: '2026-05-01', name: 'Hari Buruh Internasional (May Day)', type: 'national_holiday' },
  { id: 'HOL-2026-05-14', date: '2026-05-14', name: 'Kenaikan Yesus Kristus', type: 'national_holiday' },
  { id: 'HOL-2026-05-15', date: '2026-05-15', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti_bersama' },
  { id: 'HOL-2026-05-27', date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 Hijriah', type: 'national_holiday' },
  { id: 'HOL-2026-05-28', date: '2026-05-28', name: 'Cuti Bersama Idul Adha 1447 H', type: 'cuti_bersama' },
  { id: 'HOL-2026-05-31', date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', type: 'national_holiday' },
  { id: 'HOL-2026-06-01', date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'national_holiday' },
  { id: 'HOL-2026-06-02', date: '2026-06-02', name: 'Cuti Bersama Hari Raya Waisak', type: 'cuti_bersama' },
  { id: 'HOL-2026-06-16', date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriah', type: 'national_holiday' },
  { id: 'HOL-2026-08-17', date: '2026-08-17', name: 'HUT Proklamasi Kemerdekaan RI ke-81', type: 'national_holiday' },
  { id: 'HOL-2026-08-25', date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', type: 'national_holiday' },
  { id: 'HOL-2026-12-24', date: '2026-12-24', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti_bersama' },
  { id: 'HOL-2026-12-25', date: '2026-12-25', name: 'Hari Raya Natal', type: 'national_holiday' },
  { id: 'HOL-2026-12-28', date: '2026-12-28', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti_bersama' },

  // ================= TAHUN 2027 =================
  { id: 'HOL-2027-01-01', date: '2027-01-01', name: 'Tahun Baru 2027 Masehi', type: 'national_holiday' },
  { id: 'HOL-2027-02-05', date: '2027-02-05', name: 'Cuti Bersama Tahun Baru Imlek', type: 'cuti_bersama' },
  { id: 'HOL-2027-02-06', date: '2027-02-06', name: 'Tahun Baru Imlek 2578 Kongzili', type: 'national_holiday' },
  { id: 'HOL-2027-03-09', date: '2027-03-09', name: 'Hari Raya Idul Fitri 1448 H (Hari 1)', type: 'national_holiday' },
  { id: 'HOL-2027-03-10', date: '2027-03-10', name: 'Hari Raya Idul Fitri 1448 H (Hari 2)', type: 'national_holiday' },
  { id: 'HOL-2027-03-11', date: '2027-03-11', name: 'Cuti Bersama Hari Raya Idul Fitri', type: 'cuti_bersama' },
  { id: 'HOL-2027-03-12', date: '2027-03-12', name: 'Cuti Bersama Hari Raya Idul Fitri', type: 'cuti_bersama' },
  { id: 'HOL-2027-03-26', date: '2027-03-26', name: 'Wafat Yesus Kristus (Jumat Agung)', type: 'national_holiday' },
  { id: 'HOL-2027-05-01', date: '2027-05-01', name: 'Hari Buruh Internasional', type: 'national_holiday' },
  { id: 'HOL-2027-05-06', date: '2027-05-06', name: 'Kenaikan Yesus Kristus', type: 'national_holiday' },
  { id: 'HOL-2027-05-07', date: '2027-05-07', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti_bersama' },
  { id: 'HOL-2027-05-20', date: '2027-05-20', name: 'Hari Raya Waisak 2571 BE', type: 'national_holiday' },
  { id: 'HOL-2027-05-21', date: '2027-05-21', name: 'Cuti Bersama Hari Raya Waisak', type: 'cuti_bersama' },
  { id: 'HOL-2027-06-01', date: '2027-06-01', name: 'Hari Lahir Pancasila', type: 'national_holiday' },
  { id: 'HOL-2027-08-17', date: '2027-08-17', name: 'HUT Kemerdekaan RI ke-82', type: 'national_holiday' },
  { id: 'HOL-2027-12-24', date: '2027-12-24', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti_bersama' },
  { id: 'HOL-2027-12-25', date: '2027-12-25', name: 'Hari Raya Natal', type: 'national_holiday' },
];

/**
 * Mendapatkan indeks hari (0=Minggu, 1=Senin, ..., 6=Sabtu)
 * Menggunakan parsing aman tanpa offset timezone
 */
export function getDayOfWeek(dateStr: string): number {
  if (!dateStr) return -1;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return -1;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.getDay();
}

/**
 * Cek apakah sebuah tanggal jatuh pada hari Minggu
 */
export function isDateSunday(dateStr: string): boolean {
  return getDayOfWeek(dateStr) === 0;
}

/**
 * Mendapatkan nama hari dalam Bahasa Indonesia dari tanggal YYYY-MM-DD
 */
export function getDayNameIndonesian(dateStr: string): string {
  const dayIdx = getDayOfWeek(dateStr);
  if (dayIdx < 0 || dayIdx > 6) return '';
  return DAYS_OF_WEEK[dayIdx].name;
}

/**
 * Format tanggal string YYYY-MM-DD ke format nama hari dan tanggal Indonesia
 * e.g. "Minggu, 06 Sep 2026"
 */
export function formatIndonesianDateWithDay(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface DayClassification {
  isHolidayOrSunday: boolean;
  isSunday: boolean;
  isWeekendOffDay: boolean;
  isNationalHoliday: boolean;
  isCutiBersama: boolean;
  isCustomHoliday: boolean;
  type: 'sunday' | 'weekend_off' | 'national_holiday' | 'cuti_bersama' | 'custom' | 'regular';
  title: string;
  holidayName?: string;
  customMultiplier?: number;
  rateTierDescription: string;
}

/**
 * Klasifikasi Hari Lengkap untuk Perhitungan Lembur:
 * Mengecek apakah tanggal merupakan:
 * 1. Hari Libur Tertentu (Custom Perusahaan)
 * 2. Tanggal Merah Nasional Resmi (SKB 3 Menteri)
 * 3. Cuti Bersama Resmi Pemerintah
 * 4. Hari Minggu (Sunday Rest Day)
 * 5. Hari Tertentu Mingguan / Weekend Khusus (misal Hari Sabtu untuk 5-day week)
 * 6. Hari Kerja Reguler
 */
export function getDayClassification(
  dateStr: string,
  config: CompanyConfig
): DayClassification {
  const dayIdx = getDayOfWeek(dateStr);
  const isSunday = dayIdx === 0;

  // 1. Cek Hari Libur / Hari Tertentu Kustom Perusahaan
  const customHolidays = config.customHolidays || [];
  const matchedCustom = customHolidays.find((h) => h.date === dateStr);
  if (matchedCustom) {
    const rateDesc = matchedCustom.customMultiplier
      ? `Tarif Lembur Kustom (${matchedCustom.customMultiplier}x Flat)`
      : 'Tarif Lembur Hari Libur / Tanggal Merah';

    return {
      isHolidayOrSunday: true,
      isSunday,
      isWeekendOffDay: isSunday,
      isNationalHoliday: false,
      isCutiBersama: false,
      isCustomHoliday: true,
      type: 'custom',
      title: 'Hari Libur Tertentu (Custom Perusahaan)',
      holidayName: matchedCustom.name,
      customMultiplier: matchedCustom.customMultiplier,
      rateTierDescription: rateDesc,
    };
  }

  // 2. Cek Tanggal Merah Nasional & Cuti Bersama (jika sinkronisasi otomatis aktif)
  const isAutoNational = config.autoNationalHolidays !== false;
  if (isAutoNational) {
    const matchedNational = INDONESIAN_NATIONAL_HOLIDAYS.find((h) => h.date === dateStr);
    if (matchedNational) {
      const isCuti = matchedNational.type === 'cuti_bersama';
      const allowCuti = config.includeCutiBersama !== false;

      if (!isCuti || allowCuti) {
        return {
          isHolidayOrSunday: true,
          isSunday,
          isWeekendOffDay: isSunday,
          isNationalHoliday: !isCuti,
          isCutiBersama: isCuti,
          isCustomHoliday: false,
          type: isCuti ? 'cuti_bersama' : 'national_holiday',
          title: isCuti ? 'Cuti Bersama Resmi RI' : 'Tanggal Merah (Libur Nasional)',
          holidayName: matchedNational.name,
          rateTierDescription: isCuti
            ? 'Tarif Lembur Cuti Bersama Resmi (2.0x - 4.0x)'
            : 'Tarif Lembur Tanggal Merah Resmi (2.0x - 4.0x)',
        };
      }
    }
  }

  // 3. Cek Hari Minggu (Sunday Rest Day)
  const isAutoSunday = config.autoSundayOvertime !== false;
  if (isSunday && isAutoSunday) {
    return {
      isHolidayOrSunday: true,
      isSunday: true,
      isWeekendOffDay: true,
      isNationalHoliday: false,
      isCutiBersama: false,
      isCustomHoliday: false,
      type: 'sunday',
      title: 'Hari Minggu (Hari Istirahat Mingguan)',
      holidayName: 'Hari Minggu',
      rateTierDescription: 'Tarif Lembur Hari Minggu (2.0x - 4.0x)',
    };
  }

  // 4. Cek Hari Tertentu Mingguan (Hari Istirahat Mingguan Custom, e.g. Sabtu untuk 5 hari kerja atau hari lain)
  const designatedOffDays = config.customWeekendDays || [0]; // default: Minggu
  if (dayIdx >= 0 && designatedOffDays.includes(dayIdx)) {
    const dayName = DAYS_OF_WEEK[dayIdx]?.name || 'Hari Libur';
    return {
      isHolidayOrSunday: true,
      isSunday: isSunday,
      isWeekendOffDay: true,
      isNationalHoliday: false,
      isCutiBersama: false,
      isCustomHoliday: false,
      type: 'weekend_off',
      title: `Hari Tertentu Libur Mingguan (${dayName})`,
      holidayName: `Libur Mingguan ${dayName}`,
      rateTierDescription: `Tarif Lembur Hari Libur Tertentu (${dayName})`,
    };
  }

  // 5. Hari Kerja Reguler
  return {
    isHolidayOrSunday: false,
    isSunday,
    isWeekendOffDay: false,
    isNationalHoliday: false,
    isCutiBersama: false,
    isCustomHoliday: false,
    type: 'regular',
    title: isSunday ? 'Hari Minggu (Tarif Normal)' : 'Hari Kerja Biasa',
    holidayName: undefined,
    rateTierDescription: 'Tarif Lembur Hari Kerja Standar (1.5x - 2.0x)',
  };
}
