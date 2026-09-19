export type UserRole = 'admin' | 'employee';

export interface Employee {
  id: string;              // e.g. EMP001
  username: string;        // e.g. budi.santoso
  phone: string;           // e.g. 081234567890
  password: string;
  name: string;
  department: string;      // Operasional, IT, HR, Finance, Marketing
  position: string;
  baseSalary: number;      // Gaji Pokok per bulan (IDR)
  allowance: number;       // Tunjangan tetap bulanan
  dailyTransport: number;  // Uang makan / transport per hari hadir
  currentShiftId: string;
  email: string;
  avatarUrl?: string;
  bankAccount?: string;
  bankName?: string;
  requiresWorkReport?: boolean; // Wajib mengirimkan laporan pekerjaan harian (contoh: Supervisor, Manager)
  reportRequirementReason?: string; // Alasan kewajiban lapor (e.g., 'Jabatan Manajerial/Supervisi')
  customHours?: {
    startTime: string;
    endTime: string;
  };
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;       // e.g. '08:00'
  endTime: string;         // e.g. '17:00'
  gracePeriodMinutes: number; // e.g. 15 mins
  description?: string;
  isCustom?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;            // YYYY-MM-DD
  checkInTime?: string;    // HH:mm:ss
  checkOutTime?: string;   // HH:mm:ss
  checkInLat?: number;
  checkInLng?: number;
  checkInDistanceMeters?: number;
  checkInAddress?: string;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutDistanceMeters?: number;
  checkOutAddress?: string;
  status: 'hadir' | 'terlambat' | 'izin' | 'alpha' | 'lembur';
  workDurationHours: number;
  overtimeHours: number;
  overtimePay: number;
  isOvertimeApproved: boolean;
  notes?: string;
}

export interface OvertimeMultiplierRule {
  tier: number;            // 1 = jam pertama, 2 = jam ke-2 dst
  multiplier: number;      // e.g. 1.5x, 2.0x, or 3.0x
  description: string;
}

export interface CompanyConfig {
  companyName: string;
  companyAddress: string;
  // GPS Geofence Coordinate
  officeLat: number;
  officeLng: number;
  officeRadiusMeters: number;
  
  // Payroll dates
  payrollDateDay: number;   // e.g. 25th of month
  cutoffDateDay: number;    // e.g. 20th of month
  
  // Overtime rules
  hourlyRateDivider: number; // e.g. 173 (standard Indonesia Depnaker: Gaji Pokok / 173)
  overtimeMultipliers: OvertimeMultiplierRule[];
  minOvertimeMinutes: number; // e.g. 30
  
  // Late penalty per minute (optional)
  latePenaltyPerMinute: number;
  
  // Spreadsheet integration
  spreadsheetWebhookUrl: string;
  spreadsheetId: string;
  autoSyncToSheets: boolean;
  lastSheetsSyncTime?: string;
  
  // Email alert settings
  notifyEmailOnAttendance: boolean;
  notifyEmailOnShiftChange: boolean;
  notifyEmailOnPayrollRuleChange: boolean;
  adminAlertEmail: string;

  // Admin security credentials
  adminUsername?: string;
  adminPassword?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'shift' | 'attendance' | 'payroll' | 'info';
  read: boolean;
  targetEmployeeId?: string; // empty means all
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  bodySnippet: string;
  timestamp: string;
  triggerEvent: string;
  status: 'sent' | 'delivered';
}

export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  baseSalary: number;
  allowance: number;
  attendanceDays: number;
  transportAllowance: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  totalOvertimePay: number;
  lateDeduction: number;
  grossSalary: number;
  netSalary: number;
}

export interface WorkReport {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  date: string; // YYYY-MM-DD
  submittedAt: string; // e.g. "17:15"
  shiftName?: string;
  title: string;
  tasksCompleted: string; // Uraian pekerjaan yang telah diselesaikan
  inProgressTasks?: string; // Pekerjaan yang sedang berjalan / belum tuntas
  issuesOrBlockers?: string; // Kendala, hambatan lapangan, atau eskalasi
  nextDayPlan?: string; // Target & rencana kerja esok hari
  hoursSpent?: number; // Jam kerja efektif
  completionPercentage: number; // 0 - 100%
  status: 'submitted' | 'reviewed' | 'needs_revision';
  reviewFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface WorkReportRecommendation {
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  recommended: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  currentRequiredStatus: boolean;
}

