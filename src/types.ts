export type UserRole = 'admin' | 'employee';

export interface Employee {
  id: string;              // e.g. EMP001
  username: string;        // e.g. budi.santoso
  phone: string;           // e.g. 081234567890
  password: string;
  name: string;
  department: string;      // Operasional, IT, HR, Finance, Marketing
  position: string;
  salaryType?: 'monthly' | 'daily'; // 'monthly' (Bulanan Tetap) atau 'daily' (Upah Harian). Default: 'monthly'
  baseSalary: number;      // Gaji Pokok per bulan ATAU Upah pokok harian jika salaryType === 'daily' (IDR)
  dailyRate?: number;      // Nilai eksplisit upah per hari jika salaryType === 'daily'
  allowance: number;       // Tunjangan tetap bulanan / operasional
  dailyTransport: number;  // Uang makan / transport per hari hadir
  currentShiftId: string;
  email: string;
  avatarUrl?: string;
  bankAccount?: string;
  bankName?: string;
  requiresWorkReport?: boolean; // Wajib mengirimkan laporan pekerjaan harian (contoh: Supervisor, Manager)
  reportRequirementReason?: string; // Alasan kewajiban lapor (e.g., 'Jabatan Manajerial/Supervisi')
  isActive?: boolean; // Status aktif karyawan (bisa diaktifkan dan dinonaktifkan)
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
  status: 'hadir' | 'terlambat' | 'izin' | 'alpha' | 'lembur' | 'menunggu_persetujuan' | 'ditolak';
  workDurationHours: number;
  overtimeHours: number;
  overtimePay: number;
  isOvertimeApproved: boolean;
  notes?: string;
  // Out-of-radius / Out-of-island / Remote attendance attributes
  isRemoteOrOutIsland?: boolean;
  remoteReasonType?: 'dinas_luar_kota' | 'luar_pulau' | 'kunjungan_klien' | 'wfh_remote' | 'proyek_lapangan' | 'lainnya';
  remoteReasonNotes?: string;
  remoteAttachmentPhoto?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface OvertimeMultiplierRule {
  tier: number;            // 1 = jam pertama, 2 = jam ke-2 dst
  multiplier: number;      // e.g. 1.5x, 2.0x, or 3.0x
  description: string;
}

export interface HolidayOrSpecialDay {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // e.g. "Tahun Baru Masehi", "Cuti Bersama", "HUT Perusahaan"
  type: 'national_holiday' | 'sunday' | 'custom' | 'cuti_bersama' | 'special_day';
  description?: string;
  customMultiplier?: number; // Optional custom multiplier override for this specific day (e.g. 2.5x or 3.0x)
}

export interface CompanyConfig {
  // Application Identity & Branding
  appName?: string;
  appTagline?: string;
  appVersion?: string;

  // Company Profile Details
  companyName: string;
  companyAddress: string;
  companyCity?: string;
  companyPostalCode?: string;
  companyIndustry?: string;
  companyLogo?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyDirector?: string;
  companyDirectorTitle?: string;
  companyTaxNumber?: string;
  companyStampUrl?: string;
  allowRemoteOutIslandAttendance?: boolean;
  
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

  // Special Overtime for Sundays, Specific Days & Tanggal Merah (Otomatis Kalender / Custom)
  overtimeHolidayMode: 'auto' | 'custom'; // 'auto': ikuti kalender nasional & Minggu; 'custom': kalender/aturan kustom
  autoSundayOvertime: boolean; // default: true (hari Minggu otomatis tarif lembur libur)
  autoNationalHolidays: boolean; // default: true (otomatis kalender tanggal merah resmi Indonesia SKB 3 Menteri)
  includeCutiBersama?: boolean; // default: true (apakah cuti bersama resmi pemerintah otomatis tarif lembur libur)
  customWeekendDays?: number[]; // Hari istirahat mingguan tertentu (0=Minggu, 1=Senin, ..., 6=Sabtu). Default: [0]
  holidayOvertimeMultipliers: OvertimeMultiplierRule[]; // Tarif lembur hari libur/Minggu/tanggal merah
  customHolidays: HolidayOrSpecialDay[]; // Daftar hari libur tertentu / custom perusahaan
  
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
  salaryType?: 'monthly' | 'daily';
  dailyRate?: number;
  dailyBaseEarnings?: number; // Upah pokok akumulasi dari hari hadir (untuk gaji harian)
  baseSalary: number;
  allowance: number;
  attendanceDays: number;
  transportAllowance: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  totalOvertimePay: number;
  regularOvertimeHours?: number;
  regularOvertimePay?: number;
  holidayOvertimeHours?: number;
  holidayOvertimePay?: number;
  lateDeduction: number;
  grossSalary: number;
  netSalary: number;
  todayEstimatedSalary?: number;
  todayBreakdown?: {
    baseRate: number;
    transport: number;
    overtime: number;
    lateDeduction: number;
    total: number;
    status: string;
  };
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

export interface TemporaryLocationAssignment {
  id: string;                    // e.g. 'DUTY-2026-001'
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;                 // e.g. 'Proyek Lapangan Surabaya'
  locationName: string;          // e.g. 'Kantor Cabang Rungkut'
  city: string;                  // e.g. 'Surabaya'
  lat: number;
  lng: number;
  radiusMeters: number;          // e.g. 250m
  startDate: string;             // YYYY-MM-DD
  endDate: string;               // YYYY-MM-DD
  status: 'active' | 'completed' | 'cancelled';
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}


