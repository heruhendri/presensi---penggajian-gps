import { AttendanceRecord, CompanyConfig, Employee, PayrollSummary } from '../types';
import { getDayClassification, DayClassification } from './holidays';

/**
 * Format number into Indonesian Rupiah format
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(amount)));
}

/**
 * Calculate hourly rate based on base salary (or daily rate) and company divisor
 */
export function calculateHourlyRate(
  employeeOrBaseSalary: Employee | number,
  divider: number
): number {
  if (typeof employeeOrBaseSalary === 'object' && employeeOrBaseSalary !== null) {
    const emp = employeeOrBaseSalary;
    if (emp.salaryType === 'daily') {
      const dailyRate = emp.dailyRate || emp.baseSalary || 0;
      // Standar shift kerja 8 jam untuk upah harian
      return dailyRate / 8;
    }
    const base = emp.baseSalary || 0;
    return divider > 0 ? base / divider : 0;
  }

  if (divider <= 0) return 0;
  return Number(employeeOrBaseSalary) / divider;
}

/**
 * Hitung upah lembur harian spesifik tanggal (Hari Kerja vs Hari Minggu vs Tanggal Merah / Custom)
 * Sesuai regulasi PP 35/2021 & kebijakan kustom perusahaan:
 * - Hari Kerja: Jam ke-1 (1.5x), Jam ke-2 dst (2.0x)
 * - Hari Minggu / Tanggal Merah: 7/8 jam pertama (2.0x), jam ke-8/9 (3.0x), jam ke-9/10 dst (4.0x)
 */
export function calculateDailyOvertimePay(
  overtimeHours: number,
  employeeOrBaseSalary: Employee | number,
  config: CompanyConfig,
  dateStr?: string
): {
  amount: number;
  isHolidayOrSunday: boolean;
  dayTypeTitle: string;
  hourlyRate: number;
  rateDescription: string;
} {
  if (overtimeHours <= 0) {
    return {
      amount: 0,
      isHolidayOrSunday: false,
      dayTypeTitle: 'Hari Kerja Biasa',
      hourlyRate: 0,
      rateDescription: '-',
    };
  }

  const hourlyRate = calculateHourlyRate(employeeOrBaseSalary, config.hourlyRateDivider);

  // Evaluasi klasifikasi hari (Hari Kerja vs Hari Minggu vs Tanggal Merah vs Custom)
  const dayInfo: DayClassification = dateStr
    ? getDayClassification(dateStr, config)
    : {
        isHolidayOrSunday: false,
        isSunday: false,
        isWeekendOffDay: false,
        isNationalHoliday: false,
        isCutiBersama: false,
        isCustomHoliday: false,
        type: 'regular',
        title: 'Hari Kerja Biasa',
        rateTierDescription: 'Tarif Reguler (1.5x - 2.0x)',
      };

  const isSpecialDay = dayInfo.isHolidayOrSunday;

  // Tentukan deret multiplier aktif
  const activeMultipliers = isSpecialDay
    ? (config.holidayOvertimeMultipliers && config.holidayOvertimeMultipliers.length > 0
        ? [...config.holidayOvertimeMultipliers]
        : [
            { tier: 1, multiplier: 2.0, description: 'Jam ke-1 s/d ke-7/8 (2.0x)' },
            { tier: 2, multiplier: 3.0, description: 'Jam ke-8/9 (3.0x)' },
            { tier: 3, multiplier: 4.0, description: 'Jam ke-9+ (4.0x)' },
          ])
    : (config.overtimeMultipliers && config.overtimeMultipliers.length > 0
        ? [...config.overtimeMultipliers]
        : [
            { tier: 1, multiplier: 1.5, description: 'Jam ke-1 (1.5x)' },
            { tier: 2, multiplier: 2.0, description: 'Jam ke-2 dst (2.0x)' },
          ]);

  activeMultipliers.sort((a, b) => a.tier - b.tier);

  let totalPay = 0;
  let remainingHours = overtimeHours;

  if (dayInfo.customMultiplier && dayInfo.customMultiplier > 0) {
    // Custom multiplier override untuk hari libur / hari tertentu khusus ini (e.g. 2.5x flat)
    totalPay = overtimeHours * hourlyRate * dayInfo.customMultiplier;
  } else if (isSpecialDay) {
    // Perhitungan Lembur Hari Libur / Hari Minggu / Tanggal Merah:
    // Tier 1 (7 jam pertama): 2.0x
    const tier1 = activeMultipliers[0] || { tier: 1, multiplier: 2.0, description: 'Jam ke-1 s/d 7 (2.0x)' };
    const tier2 = activeMultipliers[1] || { tier: 2, multiplier: 3.0, description: 'Jam ke-8 (3.0x)' };
    const tier3 = activeMultipliers[2] || { tier: 3, multiplier: 4.0, description: 'Jam ke-9+ (4.0x)' };

    const tier1Hours = Math.min(7, remainingHours);
    totalPay += tier1Hours * hourlyRate * tier1.multiplier;
    remainingHours -= tier1Hours;

    if (remainingHours > 0) {
      const tier2Hours = Math.min(1, remainingHours);
      totalPay += tier2Hours * hourlyRate * tier2.multiplier;
      remainingHours -= tier2Hours;
    }

    if (remainingHours > 0) {
      totalPay += remainingHours * hourlyRate * tier3.multiplier;
    }
  } else {
    // Perhitungan Lembur Hari Kerja Biasa:
    // Tier 1 (1 jam pertama): 1.5x
    const tier1 = activeMultipliers[0] || { tier: 1, multiplier: 1.5, description: 'Jam ke-1 (1.5x)' };
    const tier2 = activeMultipliers[1] || { tier: 2, multiplier: 2.0, description: 'Jam ke-2 dst (2.0x)' };

    const tier1Hours = Math.min(1, remainingHours);
    totalPay += tier1Hours * hourlyRate * tier1.multiplier;
    remainingHours -= tier1Hours;

    if (remainingHours > 0) {
      totalPay += remainingHours * hourlyRate * tier2.multiplier;
    }
  }

  return {
    amount: Math.round(totalPay),
    isHolidayOrSunday: isSpecialDay,
    dayTypeTitle: dayInfo.title,
    hourlyRate: Math.round(hourlyRate),
    rateDescription: isSpecialDay
      ? 'Tarif Lembur Libur / Tanggal Merah (2.0x - 4.0x)'
      : 'Tarif Lembur Hari Kerja (1.5x - 2.0x)',
  };
}

/**
 * Calculate overtime compensation based on custom company multiplier rules
 * Mendukung kalkulasi harian maupun akumulasi jam
 */
export function calculateOvertimePay(
  overtimeHours: number,
  employeeOrBaseSalary: Employee | number,
  config: CompanyConfig,
  dateStr?: string
): number {
  return calculateDailyOvertimePay(overtimeHours, employeeOrBaseSalary, config, dateStr).amount;
}

/**
 * Compute daily attendance salary estimation for today's attendance record
 */
export function computeDailyAttendanceSalary(
  employee: Employee,
  record: AttendanceRecord | undefined,
  config: CompanyConfig,
  targetDate?: string
): {
  isAttendedToday: boolean;
  baseRate: number;
  transport: number;
  overtime: number;
  lateDeduction: number;
  total: number;
  statusText: string;
  isHolidayOrSunday: boolean;
  dayTypeTitle: string;
} {
  const isDaily = employee.salaryType === 'daily';
  const dailyWage = isDaily ? (employee.dailyRate || employee.baseSalary || 0) : Math.round(employee.baseSalary / 25);
  const effectiveDate = targetDate || record?.date || new Date().toISOString().slice(0, 10);
  const dayInfo = getDayClassification(effectiveDate, config);
  
  if (!record || !record.checkInTime) {
    // Belum check in hari ini: tampilkan potensi penghasilan jika hadir
    const holidayBadge = dayInfo.isHolidayOrSunday ? ` [${dayInfo.title}]` : '';
    return {
      isAttendedToday: false,
      baseRate: dailyWage,
      transport: employee.dailyTransport || 0,
      overtime: 0,
      lateDeduction: 0,
      total: dailyWage + (employee.dailyTransport || 0),
      statusText: `Belum Check-In (Potensi Penghasilan Hari Ini${holidayBadge})`,
      isHolidayOrSunday: dayInfo.isHolidayOrSunday,
      dayTypeTitle: dayInfo.title,
    };
  }

  const isAttended = record.status === 'hadir' || record.status === 'terlambat' || record.status === 'lembur';
  const baseRate = isAttended ? dailyWage : 0;
  const transport = isAttended ? (employee.dailyTransport || 0) : 0;
  
  const otRes = record.overtimeHours > 0
    ? calculateDailyOvertimePay(record.overtimeHours, employee, config, effectiveDate)
    : { amount: 0, isHolidayOrSunday: dayInfo.isHolidayOrSunday };

  const overtime = otRes.amount;
  const lateDeduction = record.status === 'terlambat' ? 15 * (config.latePenaltyPerMinute || 0) : 0;
  const total = Math.max(0, baseRate + transport + overtime - lateDeduction);

  let statusText = 'Sedang Berjalan (Shift Aktif)';
  if (record.checkOutTime) {
    if (record.overtimeHours > 0) {
      statusText = `Shift Selesai (+${record.overtimeHours}j lembur ${dayInfo.isHolidayOrSunday ? 'Tarif Libur/Minggu' : 'Normal'})`;
    } else {
      statusText = dayInfo.isHolidayOrSunday ? `Shift Selesai (${dayInfo.title})` : 'Shift Selesai Terverifikasi';
    }
  } else if (record.status === 'terlambat') {
    statusText = 'Hadir Terlambat';
  }

  return {
    isAttendedToday: true,
    baseRate,
    transport,
    overtime,
    lateDeduction,
    total,
    statusText,
    isHolidayOrSunday: dayInfo.isHolidayOrSunday,
    dayTypeTitle: dayInfo.title,
  };
}

/**
 * Compute real-time transparent payroll summary for an employee
 */
export function computeEmployeePayroll(
  employee: Employee,
  attendanceRecords: AttendanceRecord[],
  config: CompanyConfig,
  todayStr?: string
): PayrollSummary {
  // Filter records for this employee
  const empRecords = attendanceRecords.filter((r) => r.employeeId === employee.id);

  // Attendance days (status hadir or terlambat or lembur)
  const attendedRecords = empRecords.filter(
    (r) => r.status === 'hadir' || r.status === 'terlambat' || r.status === 'lembur'
  );
  const attendanceDays = attendedRecords.length;

  const isDaily = employee.salaryType === 'daily';
  const dailyRate = isDaily ? (employee.dailyRate || employee.baseSalary || 0) : undefined;

  // Nilai pokok akumulasi berdasarkan jenis gaji
  // Jika harian: Upah Pokok = Hari Hadir x Upah Harian
  // Jika bulanan: Gaji Pokok = Base salary bulanan tetap
  const dailyBaseEarnings = isDaily ? attendanceDays * (dailyRate || 0) : employee.baseSalary;

  // Transport allowance (per day of presence)
  const transportAllowance = attendanceDays * (employee.dailyTransport || 0);

  // Total actual work duration in hours
  const totalWorkHours = empRecords.reduce((acc, r) => acc + (r.workDurationHours || 0), 0);

  // Total overtime hours & accurate pay per day (Hari Kerja vs Hari Minggu vs Tanggal Merah)
  let regularOvertimeHours = 0;
  let regularOvertimePay = 0;
  let holidayOvertimeHours = 0;
  let holidayOvertimePay = 0;

  empRecords.forEach((r) => {
    if (r.overtimeHours > 0) {
      const otResult = calculateDailyOvertimePay(r.overtimeHours, employee, config, r.date);
      if (otResult.isHolidayOrSunday) {
        holidayOvertimeHours += r.overtimeHours;
        holidayOvertimePay += otResult.amount;
      } else {
        regularOvertimeHours += r.overtimeHours;
        regularOvertimePay += otResult.amount;
      }
    }
  });

  const totalOvertimeHours = regularOvertimeHours + holidayOvertimeHours;
  const totalOvertimePay = regularOvertimePay + holidayOvertimePay;

  // Late deduction (if late minutes recorded in notes or status)
  let lateMinutesTotal = 0;
  empRecords.forEach((r) => {
    if (r.status === 'terlambat') {
      lateMinutesTotal += 15; // default estimated 15 mins or parsed from record
    }
  });
  const lateDeduction = lateMinutesTotal * (config.latePenaltyPerMinute || 0);

  // Gross Salary
  const grossSalary = dailyBaseEarnings + employee.allowance + transportAllowance + totalOvertimePay;

  // Net Salary
  const netSalary = Math.max(0, grossSalary - lateDeduction);

  // Today's attendance calculation
  const targetTodayStr = todayStr || new Date().toISOString().slice(0, 10);
  const todayRecord = empRecords.find((r) => r.date === targetTodayStr);
  const todayEstimate = computeDailyAttendanceSalary(employee, todayRecord, config, targetTodayStr);

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    position: employee.position,
    salaryType: employee.salaryType || 'monthly',
    dailyRate,
    dailyBaseEarnings,
    baseSalary: employee.baseSalary,
    allowance: employee.allowance,
    attendanceDays,
    transportAllowance,
    totalWorkHours: Math.round(totalWorkHours * 10) / 10,
    totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
    totalOvertimePay,
    regularOvertimeHours: Math.round(regularOvertimeHours * 10) / 10,
    regularOvertimePay,
    holidayOvertimeHours: Math.round(holidayOvertimeHours * 10) / 10,
    holidayOvertimePay,
    lateDeduction,
    grossSalary,
    netSalary,
    todayEstimatedSalary: todayEstimate.total,
    todayBreakdown: {
      baseRate: todayEstimate.baseRate,
      transport: todayEstimate.transport,
      overtime: todayEstimate.overtime,
      lateDeduction: todayEstimate.lateDeduction,
      total: todayEstimate.total,
      status: todayEstimate.statusText,
    },
  };
}

/**
 * Get current payroll cycle dates description
 */
export function getPayrollCycleInfo(config: CompanyConfig): {
  cutoffDateText: string;
  payrollDateText: string;
  cyclePeriodText: string;
} {
  const now = new Date();
  const currentMonth = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  
  return {
    cutoffDateText: `Tanggal ${config.cutoffDateDay} setiap bulan`,
    payrollDateText: `Tanggal ${config.payrollDateDay} setiap bulan`,
    cyclePeriodText: `Periode Cut-Off: ${config.cutoffDateDay + 1} bulan lalu s.d. ${config.cutoffDateDay} ${currentMonth}`,
  };
}

/**
 * Konversi angka rupiah ke teks terbilang dalam bahasa Indonesia
 */
export function terbilang(n: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  const num = Math.floor(Math.abs(n));
  if (num < 12) {
    return bilangan[num];
  } else if (num < 20) {
    return terbilang(num - 10) + ' Belas';
  } else if (num < 100) {
    const sisa = num % 10;
    return terbilang(Math.floor(num / 10)) + ' Puluh' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  } else if (num < 200) {
    const sisa = num - 100;
    return 'Seratus' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  } else if (num < 1000) {
    const sisa = num % 100;
    return terbilang(Math.floor(num / 100)) + ' Ratus' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  } else if (num < 2000) {
    const sisa = num - 1000;
    return 'Seribu' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  } else if (num < 1000000) {
    const sisa = num % 1000;
    return terbilang(Math.floor(num / 1000)) + ' Ribu' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  } else if (num < 1000000000) {
    const sisa = num % 1000000;
    return terbilang(Math.floor(num / 1000000)) + ' Juta' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  } else if (num < 1000000000000) {
    const sisa = num % 1000000000;
    return terbilang(Math.floor(num / 1000000000)) + ' Miliar' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  } else {
    const sisa = num % 1000000000000;
    return terbilang(Math.floor(num / 1000000000000)) + ' Triliun' + (sisa !== 0 ? ' ' + terbilang(sisa) : '');
  }
}

export function terbilangRupiah(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded <= 0) return 'Nol Rupiah';
  return `${terbilang(rounded)} Rupiah`;
}

