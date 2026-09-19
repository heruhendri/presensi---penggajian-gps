import { AttendanceRecord, CompanyConfig, Employee, PayrollSummary } from '../types';

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
 * Calculate hourly rate based on base salary and company divisor (e.g., standard 173)
 */
export function calculateHourlyRate(baseSalary: number, divider: number): number {
  if (divider <= 0) return 0;
  return baseSalary / divider;
}

/**
 * Calculate overtime compensation based on custom company multiplier rules
 * e.g., Tier 1 (1st hour): 1.5x, Tier 2 (subsequent hours): 2.0x
 */
export function calculateOvertimePay(
  overtimeHours: number,
  baseSalary: number,
  config: CompanyConfig
): number {
  if (overtimeHours <= 0) return 0;
  
  const hourlyRate = calculateHourlyRate(baseSalary, config.hourlyRateDivider);
  let totalPay = 0;
  let remainingHours = overtimeHours;

  const multipliers = [...config.overtimeMultipliers].sort((a, b) => a.tier - b.tier);

  if (multipliers.length === 0) {
    // Default fallback: 1.5x
    return overtimeHours * hourlyRate * 1.5;
  }

  // Tier 1: first hour
  const firstTier = multipliers[0];
  const firstTierHours = Math.min(1, remainingHours);
  totalPay += firstTierHours * hourlyRate * firstTier.multiplier;
  remainingHours -= firstTierHours;

  if (remainingHours > 0) {
    // Tier 2 or beyond: subsequent hours
    const secondTier = multipliers[1] || firstTier;
    totalPay += remainingHours * hourlyRate * secondTier.multiplier;
  }

  return Math.round(totalPay);
}

/**
 * Compute real-time transparent payroll summary for an employee
 */
export function computeEmployeePayroll(
  employee: Employee,
  attendanceRecords: AttendanceRecord[],
  config: CompanyConfig
): PayrollSummary {
  // Filter records for this employee
  const empRecords = attendanceRecords.filter((r) => r.employeeId === employee.id);

  // Attendance days (status hadir or terlambat or lembur)
  const attendedRecords = empRecords.filter(
    (r) => r.status === 'hadir' || r.status === 'terlambat' || r.status === 'lembur'
  );
  const attendanceDays = attendedRecords.length;

  // Transport allowance (per day of presence)
  const transportAllowance = attendanceDays * (employee.dailyTransport || 0);

  // Total actual work duration in hours
  const totalWorkHours = empRecords.reduce((acc, r) => acc + (r.workDurationHours || 0), 0);

  // Total overtime hours
  const totalOvertimeHours = empRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);

  // Total overtime pay using custom rules
  const totalOvertimePay = calculateOvertimePay(totalOvertimeHours, employee.baseSalary, config);

  // Late deduction (if late minutes recorded in notes or status)
  let lateMinutesTotal = 0;
  empRecords.forEach((r) => {
    if (r.status === 'terlambat') {
      lateMinutesTotal += 15; // default estimated 15 mins or parsed from record
    }
  });
  const lateDeduction = lateMinutesTotal * (config.latePenaltyPerMinute || 0);

  // Gross Salary
  const grossSalary = employee.baseSalary + employee.allowance + transportAllowance + totalOvertimePay;

  // Net Salary
  const netSalary = Math.max(0, grossSalary - lateDeduction);

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    position: employee.position,
    baseSalary: employee.baseSalary,
    allowance: employee.allowance,
    attendanceDays,
    transportAllowance,
    totalWorkHours: Math.round(totalWorkHours * 10) / 10,
    totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
    totalOvertimePay,
    lateDeduction,
    grossSalary,
    netSalary,
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
