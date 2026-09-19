import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Clock, 
  DollarSign, 
  Settings, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Search, 
  Filter, 
  Send,
  Navigation,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  Sliders,
  Check,
  Building,
  CheckSquare,
  BarChart2,
  Trash2,
  UserPlus,
  LayoutGrid,
  List,
  ChevronDown,
  KeyRound,
  Lock,
  Radio,
  Compass
} from 'lucide-react';
import { 
  AttendanceRecord, 
  CompanyConfig, 
  Employee, 
  PayrollSummary, 
  Shift, 
  OvertimeMultiplierRule,
  WorkReport
} from '../types';
import { calculateDistanceMeters, formatDistance, getCurrentCoordinates } from '../utils/geo';
import { computeEmployeePayroll, formatIDR, getPayrollCycleInfo } from '../utils/payroll';
import { exportPayrollReportPDF } from '../utils/exportPdf';
import { exportPayrollAndAttendanceExcel } from '../utils/exportExcel';
import { AdminWorkReportSection } from './AdminWorkReportSection';
import { AttendanceCharts } from './AttendanceCharts';
import { LiveEmployeeDashboard } from './LiveEmployeeDashboard';
import { AttendanceMapsDashboard } from './AttendanceMapsDashboard';
import { EmployeeModal } from './EmployeeModal';
import { DeleteEmployeeModal } from './DeleteEmployeeModal';
import { ShiftManagementModal } from './ShiftManagementModal';
import { ChangeAdminPasswordModal } from './ChangeAdminPasswordModal';

interface AdminDashboardProps {
  config: CompanyConfig;
  onUpdateConfig: (newConfig: CompanyConfig) => void;
  employees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendanceRecords: (records: AttendanceRecord[]) => void;
  shifts: Shift[];
  onUpdateShifts?: (shifts: Shift[]) => void;
  workReports?: WorkReport[];
  onUpdateWorkReports?: (reports: WorkReport[]) => void;
  onManualSyncSheets: () => void;
  isSyncingSheets: boolean;
  onTriggerEmailAlert: (to: string, subject: string, event: string, desc: string) => void;
  onSendPushNotification: (title: string, message: string, type: 'shift' | 'attendance' | 'payroll' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  config,
  onUpdateConfig,
  employees,
  onUpdateEmployees,
  attendanceRecords,
  onUpdateAttendanceRecords,
  shifts,
  onUpdateShifts,
  workReports = [],
  onUpdateWorkReports,
  onManualSyncSheets,
  isSyncingSheets,
  onTriggerEmailAlert,
  onSendPushNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'live-employees' | 'attendance-maps' | 'attendance' | 'attendance-charts' | 'payroll' | 'rules' | 'sheets' | 'reports' | 'employees' | 'work-reports'>('live-employees');
  const [targetMapEmployeeId, setTargetMapEmployeeId] = useState<string | undefined>(undefined);
  
  // Department filter
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Config edit state
  const [localConfig, setLocalConfig] = useState<CompanyConfig>({ ...config });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Sync when parent config updates
  useEffect(() => {
    setLocalConfig({ ...config });
  }, [config]);

  // Employee Add / Edit / Delete Modal states
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleChangeAdminPassword = (newPassword: string, newUsername?: string) => {
    const updated = {
      ...localConfig,
      adminPassword: newPassword,
      adminUsername: newUsername || localConfig.adminUsername || 'admin',
    };
    setLocalConfig(updated);
    onUpdateConfig(updated);
    onSendPushNotification(
      'Password Admin Diperbarui',
      'Kata sandi akun Administrator berhasil diubah.',
      'info'
    );
  };

  // Scheduled Export state
  const [scheduledFrequency, setScheduledFrequency] = useState<'mingguan' | 'bulanan'>('bulanan');
  const [scheduledDept, setScheduledDept] = useState<string>('Semua Departemen');
  const [scheduledStatus, setScheduledStatus] = useState<string>('Aktif Terjadwal (Otomatis diekspor setiap akhir periode cut-off)');

  // Departments list
  const departments = ['Semua', 'Operasional', 'IT & Digital', 'Finance & Accounting', 'Marketing & Sales', 'HR & GA', 'Produksi'];

  // View modes for mobile vs table
  const [payrollViewMode, setPayrollViewMode] = useState<'card' | 'table'>('table');
  const [attendanceViewMode, setAttendanceViewMode] = useState<'card' | 'table'>('table');
  const [employeeViewMode, setEmployeeViewMode] = useState<'card' | 'table'>('table');

  // Compute payroll summary for all employees
  const allSummaries: PayrollSummary[] = employees.map((emp) =>
    computeEmployeePayroll(emp, attendanceRecords, config)
  );

  // Filtered summaries
  const filteredSummaries = allSummaries.filter((s) => {
    const matchDept = selectedDepartment === 'Semua' || s.department === selectedDepartment;
    const matchSearch = s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchSearch;
  });

  // Filtered attendances
  const filteredAttendances = attendanceRecords.filter((a) => {
    const matchDept = selectedDepartment === 'Semua' || a.department === selectedDepartment;
    const matchSearch = a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchSearch;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Handle Save Policy Rules
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(localConfig);
    setSaveSuccessMsg('Kebijakan dan aturan perusahaan berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    // Trigger email alert
    onTriggerEmailAlert(
      localConfig.adminAlertEmail,
      'Pembaruan Kebijakan Penggajian & Koordinat GPS Kantor',
      'ADMIN_CONFIG_UPDATED',
      `Admin telah memperbarui tanggal tutup buku (Tgl ${localConfig.cutoffDateDay}), tanggal gajian (Tgl ${localConfig.payrollDateDay}), dan radius GPS (${localConfig.officeRadiusMeters}m).`
    );

    // Push notification to employees
    onSendPushNotification(
      'Pembaruan Kebijakan Perusahaan',
      `Tanggal tutup buku cut-off telah disesuaikan menjadi tanggal ${localConfig.cutoffDateDay} setiap bulan.`,
      'payroll'
    );
  };

  // Get current device GPS for office coordinates
  const handleLockCurrentGPSAsOffice = async () => {
    setIsGettingGps(true);
    try {
      const coords = await getCurrentCoordinates();
      setLocalConfig((prev) => ({
        ...prev,
        officeLat: Number(coords.lat.toFixed(6)),
        officeLng: Number(coords.lng.toFixed(6)),
      }));
    } catch (err: any) {
      alert('Gagal mengambil koordinat: ' + (err?.message || 'Izin ditolak'));
    } finally {
      setIsGettingGps(false);
    }
  };

  // Handle Overtime Approval
  const handleToggleOvertimeApproval = (recordId: string) => {
    const updated = attendanceRecords.map((r) => {
      if (r.id === recordId) {
        const nextApproved = !r.isOvertimeApproved;
        return { ...r, isOvertimeApproved: nextApproved };
      }
      return r;
    });
    onUpdateAttendanceRecords(updated);

    const targetRec = attendanceRecords.find((r) => r.id === recordId);
    if (targetRec) {
      onTriggerEmailAlert(
        targetRec.employeeId,
        `Status Persetujuan Lembur: ${targetRec.employeeName}`,
        'OVERTIME_APPROVAL_CHANGED',
        `Lembur tanggal ${targetRec.date} sebesar ${targetRec.overtimeHours} jam telah diverifikasi oleh HRD.`
      );
    }
  };

  // Handle Employee Add / Update with ID correction support
  const handleSaveEmployee = (savedEmp: Employee, originalId?: string) => {
    const targetId = originalId || savedEmp.id;
    const existingIndex = employees.findIndex((e) => e.id === targetId);
    let updatedList: Employee[];
    const shiftInfo = shifts.find((s) => s.id === savedEmp.currentShiftId)?.name || 'Shift Standar';

    if (existingIndex >= 0) {
      updatedList = employees.map((e) => (e.id === targetId ? savedEmp : e));

      // Cascade update to attendance records if ID or name changed
      if (originalId && originalId !== savedEmp.id) {
        const updatedAttendances = attendanceRecords.map((r) =>
          r.employeeId === originalId
            ? {
                ...r,
                employeeId: savedEmp.id,
                employeeName: savedEmp.name,
                department: savedEmp.department,
              }
            : r
        );
        onUpdateAttendanceRecords(updatedAttendances);

        // Cascade update to work reports if present
        if (onUpdateWorkReports && workReports) {
          const updatedReports = workReports.map((w) =>
            w.employeeId === originalId
              ? {
                  ...w,
                  employeeId: savedEmp.id,
                  employeeName: savedEmp.name,
                  department: savedEmp.department,
                  position: savedEmp.position,
                }
              : w
          );
          onUpdateWorkReports(updatedReports);
        }

        onSendPushNotification(
          'ID Karyawan Diperbarui',
          `ID Karyawan ${savedEmp.name} berhasil diperbarui dari ${originalId} menjadi ${savedEmp.id}. Riwayat presensi & laporan telah disinkronkan.`,
          'info'
        );
      }

      onTriggerEmailAlert(
        savedEmp.email,
        `Pembaruan Data Karyawan & Shift: ${savedEmp.name}`,
        'EMPLOYEE_UPDATED',
        `Data profil, ID Karyawan (${savedEmp.id}), gaji, dan pengaturan shift kerja Anda telah disesuaikan oleh Administrator (${shiftInfo}).`
      );
      onSendPushNotification(
        'Pembaruan Data Karyawan',
        `Data karyawan ${savedEmp.name} (${savedEmp.id}) telah diperbarui. Shift: ${shiftInfo}.`,
        'shift'
      );
    } else {
      updatedList = [...employees, savedEmp];
      onTriggerEmailAlert(
        savedEmp.email,
        `Selamat Bergabung di Sistem: ${savedEmp.name}`,
        'EMPLOYEE_CREATED',
        `Akun Anda telah dibuat. Anda dapat login dengan No. HP (${savedEmp.phone}), ID (${savedEmp.id}), atau Username (${savedEmp.username}).`
      );
      onSendPushNotification(
        'Karyawan Baru Terdaftar',
        `Karyawan baru ${savedEmp.name} (${savedEmp.id}) berhasil didaftarkan ke departemen ${savedEmp.department}.`,
        'info'
      );
    }

    onUpdateEmployees(updatedList);
    setIsAddEmployeeModalOpen(false);
    setEmployeeToEdit(null);
  };

  // Handle Employee Deletion
  const handleDeleteEmployeeConfirm = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    const updated = employees.filter((e) => e.id !== employeeId);
    onUpdateEmployees(updated);
    setEmployeeToDelete(null);

    if (emp) {
      onSendPushNotification(
        'Karyawan Dihapus',
        `Karyawan ${emp.name} (${emp.id}) telah dinonaktifkan dan dihapus dari sistem.`,
        'info'
      );
    }
  };

  // Trigger Scheduled Department PDF Export
  const handleRunScheduledDepartmentExport = (dept: string) => {
    const subset = dept === 'Semua Departemen'
      ? allSummaries
      : allSummaries.filter((s) => s.department === dept);

    exportPayrollReportPDF(subset, config, dept, 'September 2026');

    onTriggerEmailAlert(
      config.adminAlertEmail,
      `Ekspor Otomatis Laporan PDF Departemen: ${dept}`,
      'DEPARTMENT_REPORT_EXPORTED',
      `Laporan PDF untuk departemen ${dept} berhasil digenerate dan dikirim ke arsip direksi.`
    );
  };

  const cycleInfo = getPayrollCycleInfo(config);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Pusat Kontrol HR & Payroll
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {employees.length} Karyawan Terdaftar • {departments.length - 1} Departemen
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Manajemen Absensi & Penggajian
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {cycleInfo.cyclePeriodText} • Gajian: <span className="text-emerald-700 font-semibold">{cycleInfo.payrollDateText}</span>
          </p>
        </div>

        {/* Quick Export Actions & Live Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('live-employees')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
              activeTab === 'live-employees'
                ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
            title="Buka Dashboard Live Monitoring Karyawan"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Live Karyawan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance-maps')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
              activeTab === 'attendance-maps'
                ? 'bg-indigo-600 text-white shadow-indigo-900/30'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
            title="Buka Peta Presensi GPS Check-In & Check-Out"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span>Peta Presensi GPS</span>
          </button>

          <button
            type="button"
            onClick={() => exportPayrollReportPDF(filteredSummaries, config, selectedDepartment)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Ekspor PDF</span>
          </button>

          <button
            type="button"
            onClick={() => exportPayrollAndAttendanceExcel(filteredSummaries, attendanceRecords, employees, config, selectedDepartment)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsChangePasswordModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 shadow-2xs transition cursor-pointer"
            title="Ubah kata sandi akun Administrator"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-600" />
            <span>Ganti Password Admin</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Mobile-Friendly & Desktop Clean) */}
      <div className="space-y-2">
        {/* Mobile Tab Selector & Quick Touch Strip */}
        <div className="md:hidden bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Menu Aktif</span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {activeTab === 'live-employees' && 'Live Karyawan'}
              {activeTab === 'attendance-maps' && 'Peta Presensi GPS'}
              {activeTab === 'payroll' && 'Gaji & Lembur'}
              {activeTab === 'attendance' && 'Log Presensi GPS'}
              {activeTab === 'attendance-charts' && 'Grafik Kehadiran'}
              {activeTab === 'work-reports' && 'Laporan Kerja'}
              {activeTab === 'employees' && 'Karyawan & Shift'}
              {activeTab === 'rules' && 'Kebijakan HR'}
              {activeTab === 'reports' && 'Ekspor Laporan'}
              {activeTab === 'sheets' && 'Spreadsheet DB'}
            </span>
          </div>

          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 font-bold text-slate-800 text-xs py-2.5 px-3.5 pr-9 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="live-employees">🔴 Live Monitoring Karyawan (Real-Time)</option>
              <option value="attendance-maps">🗺️ Peta Presensi GPS (Checkin & Checkout)</option>
              <option value="payroll">💰 Gaji & Lembur</option>
              <option value="attendance">📍 Log Presensi GPS</option>
              <option value="attendance-charts">📊 Grafik Kehadiran Pekerja</option>
              <option value="work-reports">📝 Laporan Kerja & Rekomendasi</option>
              <option value="employees">👥 Karyawan & Shift Kerja</option>
              <option value="rules">⚙️ Kebijakan Lembur, GPS & Tutup Buku</option>
              <option value="reports">📑 Ekspor Laporan Departemen</option>
              <option value="sheets">🔗 Integrasi Spreadsheet (DB)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Quick Horizontal Swipeable Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('live-employees')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'live-employees' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
              <span>Live Karyawan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance-maps')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                activeTab === 'attendance-maps' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Compass className="w-3 h-3 text-indigo-300" />
              <span>Peta GPS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'payroll' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Gaji & Lembur
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'attendance' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Presensi GPS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance-charts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'attendance-charts' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Grafik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('work-reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'work-reports' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Laporan Kerja
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'employees' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Karyawan & Shift
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'rules' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Kebijakan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'reports' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Ekspor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sheets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'sheets' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Spreadsheet
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex overflow-x-auto scrollbar-none border border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('live-employees')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'live-employees'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20'
                : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <Radio className={`w-4 h-4 ${activeTab === 'live-employees' ? 'text-white animate-pulse' : 'text-emerald-500'}`} />
            <span>Live Karyawan</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance-maps')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'attendance-maps'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/20'
                : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-800'
            }`}
          >
            <Compass className={`w-4 h-4 ${activeTab === 'attendance-maps' ? 'text-white' : 'text-indigo-500'}`} />
            <span>Peta Presensi GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'payroll'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className={`w-4 h-4 ${activeTab === 'payroll' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Gaji & Lembur</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MapPin className={`w-4 h-4 ${activeTab === 'attendance' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Log Presensi GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attendance-charts')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'attendance-charts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart2 className={`w-4 h-4 ${activeTab === 'attendance-charts' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Grafik Kehadiran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('work-reports')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'work-reports'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'work-reports' ? 'text-amber-300' : 'text-amber-500'}`} />
            <span>Laporan Kerja</span>
            {workReports && workReports.filter(r => r.status === 'submitted').length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'work-reports' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
              }`}>
                {workReports.filter(r => r.status === 'submitted').length} Baru
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'employees' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Karyawan & Shift</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeTab === 'rules' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Kebijakan HR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Ekspor Laporan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`py-2.5 px-3.5 text-xs font-bold whitespace-nowrap rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'sheets' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Spreadsheet DB</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Shared across table tabs) */}
      {(activeTab === 'payroll' || activeTab === 'attendance') && (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 md:pb-0">
            <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Dept:
            </span>
            <div className="flex items-center gap-1">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, nama karyawan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>
        </div>
      )}

      {/* TAB: DASHBOARD LIVE KARYAWAN (Bisa Diaktifkan dan Dinonaktifkan) */}
      {activeTab === 'live-employees' && (
        <LiveEmployeeDashboard
          employees={employees}
          attendanceRecords={attendanceRecords}
          shifts={shifts}
          config={config}
          onUpdateEmployees={onUpdateEmployees}
          onOpenMapsTab={(empId) => {
            setTargetMapEmployeeId(empId);
            setActiveTab('attendance-maps');
          }}
          onSendPushNotification={onSendPushNotification}
        />
      )}

      {/* TAB: DASHBOARD KARYAWAN CHECKIN CHECKOUT MAPS */}
      {activeTab === 'attendance-maps' && (
        <AttendanceMapsDashboard
          employees={employees}
          attendanceRecords={attendanceRecords}
          config={config}
          shifts={shifts}
          initialSelectedEmployeeId={targetMapEmployeeId}
        />
      )}

      {/* TAB 1: REKAPITULASI PENGGAJIAN */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* KPI Micro Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium">Karyawan Terhitung</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {filteredSummaries.length} <span className="text-xs font-normal text-slate-500">Orang</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">Filter: {selectedDepartment}</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium">Total Jam Kerja</span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {filteredSummaries.reduce((a, b) => a + b.totalWorkHours, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">Jam</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                {filteredSummaries.reduce((a, b) => a + b.attendanceDays, 0)} Total Hari Hadir
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium">Total Jam Lembur</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {filteredSummaries.reduce((a, b) => a + b.totalOvertimeHours, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">Jam</span>
              </div>
              <div className="text-[11px] text-amber-700 font-bold mt-1">
                +{formatIDR(filteredSummaries.reduce((a, b) => a + b.totalOvertimePay, 0))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span className="font-medium">Total Net Payroll</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-emerald-400 truncate">
                {formatIDR(filteredSummaries.reduce((a, b) => a + b.netSalary, 0))}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Gajian: {cycleInfo.payrollDateText}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-900">Rekapitulasi Gaji & Lembur Real-Time</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dihitung transparan dari hari hadir, jam kerja reguler, dan kelipatan lembur
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPayrollViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      payrollViewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Tampilan Tabel Lengkap"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Tabel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayrollViewMode('card')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      payrollViewMode === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Tampilan Kartu Ramah Mobile"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Kartu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Payroll Card View (Default on mobile, or user selected) */}
            {payrollViewMode === 'card' ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSummaries.map((s) => (
                  <div key={s.employeeId} className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 hover:shadow-xs transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{s.employeeName}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{s.employeeId} • {s.position}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 shrink-0">
                        {s.department}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/70">
                      <div className="flex items-center gap-1 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{s.attendanceDays} Hari ({s.totalWorkHours} Jam)</span>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-700 font-bold justify-end">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Lembur: {s.totalOvertimeHours} Jam</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Gaji Pokok:</span>
                        <span className="font-mono text-slate-700">{formatIDR(s.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Tunjangan & Transport:</span>
                        <span className="font-mono">+{formatIDR(s.allowance + s.transportAllowance)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Uang Lembur:</span>
                        <span className="font-mono">+{formatIDR(s.totalOvertimePay)}</span>
                      </div>
                      {s.lateDeduction > 0 && (
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Potongan Terlambat:</span>
                          <span className="font-mono">-{formatIDR(s.lateDeduction)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Gaji Bersih (Net):</span>
                      <span className="text-base font-black font-mono text-emerald-700">
                        {formatIDR(s.netSalary)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Payroll Table View */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Karyawan</th>
                      <th className="py-3 px-4">Departemen</th>
                      <th className="py-3 px-4">Kehadiran</th>
                      <th className="py-3 px-4">Lembur</th>
                      <th className="py-3 px-4 text-right">Gaji Pokok</th>
                      <th className="py-3 px-4 text-right">Tunjangan & Transport</th>
                      <th className="py-3 px-4 text-right">Uang Lembur</th>
                      <th className="py-3 px-4 text-right">Potongan</th>
                      <th className="py-3 px-4 text-right font-bold">Gaji Bersih (Net)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSummaries.map((s) => (
                      <tr key={s.employeeId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.employeeName}</div>
                          <div className="text-[11px] text-slate-500">{s.employeeId} • {s.position}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {s.department}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {s.attendanceDays} Hari ({s.totalWorkHours} Jam)
                        </td>
                        <td className="py-3 px-4 font-medium text-indigo-700">
                          {s.totalOvertimeHours} Jam
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatIDR(s.baseSalary)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700">
                          +{formatIDR(s.allowance + s.transportAllowance)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          +{formatIDR(s.totalOvertimePay)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">
                          {s.lateDeduction > 0 ? `-${formatIDR(s.lateDeduction)}` : 'Rp 0'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                          {formatIDR(s.netSalary)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOG PRESENSI GPS */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">Log Presensi GPS Real-Time</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Koordinat check-in/out karyawan divalidasi dengan radius kantor {config.officeRadiusMeters} meter
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                Total Log: <span className="font-bold text-slate-900">{filteredAttendances.length}</span>
              </span>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    attendanceViewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('card')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    attendanceViewMode === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Kartu Mobile"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Card View */}
          {attendanceViewMode === 'card' ? (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredAttendances.map((rec) => {
                const dist = rec.checkInDistanceMeters || 0;
                const isSafe = dist <= config.officeRadiusMeters;

                return (
                  <div key={rec.id} className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-900">{rec.date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rec.status === 'hadir'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'lembur'
                              ? 'bg-indigo-100 text-indigo-800'
                              : rec.status === 'terlambat'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{rec.employeeName}</h4>
                        <p className="text-[11px] text-slate-500">{rec.employeeId} • {rec.department}</p>
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${
                        isSafe ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <MapPin className="w-3 h-3" />
                        {dist}m
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/70 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Jam Masuk</span>
                        <span className="font-bold text-slate-800">{rec.checkInTime || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Jam Pulang</span>
                        <span className="font-bold text-slate-800">{rec.checkOutTime || '-'}</span>
                      </div>
                    </div>

                    {rec.overtimeHours > 0 && (
                      <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                        <div className="font-semibold text-indigo-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Lembur: {rec.overtimeHours} Jam ({formatIDR(rec.overtimePay)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleOvertimeApproval(rec.id)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            rec.isOvertimeApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          <CheckSquare className="w-3 h-3" />
                          {rec.isOvertimeApproved ? 'Disetujui' : 'Approval'}
                        </button>
                      </div>
                    )}

                    {rec.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{rec.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Attendance Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Karyawan</th>
                    <th className="py-3 px-4">Jam Masuk</th>
                    <th className="py-3 px-4">Jam Pulang</th>
                    <th className="py-3 px-4">Status & Radius GPS</th>
                    <th className="py-3 px-4">Lembur</th>
                    <th className="py-3 px-4">Persetujuan Lembur</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAttendances.map((rec) => {
                    const dist = rec.checkInDistanceMeters || 0;
                    const isSafe = dist <= config.officeRadiusMeters;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">{rec.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{rec.employeeName}</div>
                          <div className="text-[11px] text-slate-500">{rec.employeeId} • {rec.department}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">{rec.checkInTime || '-'}</td>
                        <td className="py-3 px-4 font-mono">{rec.checkOutTime || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rec.status === 'hadir'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'lembur'
                                ? 'bg-indigo-100 text-indigo-800'
                                : rec.status === 'terlambat'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {rec.status}
                            </span>
                            <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                              isSafe ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              <MapPin className="w-3 h-3" />
                              {dist}m
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {rec.overtimeHours > 0 ? (
                            <span className="text-indigo-700">
                              {rec.overtimeHours} Jam ({formatIDR(rec.overtimePay)})
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {rec.overtimeHours > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleToggleOvertimeApproval(rec.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                rec.isOvertimeApproved
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              {rec.isOvertimeApproved ? 'Disetujui' : 'Perlu Approval'}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={rec.notes}>
                          {rec.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: GRAFIK KEHADIRAN PEKERJA LENGKAP */}
      {activeTab === 'attendance-charts' && (
        <AttendanceCharts
          attendanceRecords={attendanceRecords}
          employees={employees}
          shifts={shifts}
        />
      )}

      {/* TAB 3: PUSAT KEBIJAKAN LEMBUR, GPS & TUTUP BUKU */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          {saveSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {saveSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Tanggal Penggajian & Tutup Buku */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h3>Siklus Penggajian & Tanggal Tutup Buku</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Tutup Buku (Cut-Off)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={localConfig.cutoffDateDay}
                      onChange={(e) => setLocalConfig({ ...localConfig, cutoffDateDay: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">Tiap bulan</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Batas akhir kalkulasi absensi & lembur periode berjalan.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Penggajian (Payday)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={localConfig.payrollDateDay}
                      onChange={(e) => setLocalConfig({ ...localConfig, payrollDateDay: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">Tiap bulan</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tanggal resmi transfer take home pay ke rekening karyawan.
                  </p>
                </div>
              </div>

              {/* Late penalty settings */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Denda Keterlambatan Per Menit (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={localConfig.latePenaltyPerMinute}
                  onChange={(e) => setLocalConfig({ ...localConfig, latePenaltyPerMinute: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Dikenakan jika check-in melebihi batas toleransi shift.
                </p>
              </div>
            </div>

            {/* Right Card: Aturan Lembur Custom (Kelipatan X & Y) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3>Aturan Kelipatan Lembur (X & Y Multiplier)</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pembagi Gaji Pokok Per Jam (Depnaker = 173)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={localConfig.hourlyRateDivider}
                  onChange={(e) => setLocalConfig({ ...localConfig, hourlyRateDivider: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Rumus dasar rate/jam: Gaji Pokok ÷ {localConfig.hourlyRateDivider}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelipatan Jam ke-1 (Tier X)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      required
                      value={localConfig.overtimeMultipliers[0]?.multiplier || 1.5}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const mults = [...localConfig.overtimeMultipliers];
                        mults[0] = { ...mults[0], multiplier: val };
                        setLocalConfig({ ...localConfig, overtimeMultipliers: mults });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                    <span className="text-xs font-bold text-slate-600">x</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Standar: 1.5x upah per jam</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelipatan Jam ke-2 dst (Tier Y)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      required
                      value={localConfig.overtimeMultipliers[1]?.multiplier || 2.0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const mults = [...localConfig.overtimeMultipliers];
                        mults[1] = { ...mults[1], multiplier: val };
                        setLocalConfig({ ...localConfig, overtimeMultipliers: mults });
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                    <span className="text-xs font-bold text-slate-600">x</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Standar: 2.0x upah per jam</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimal Menit Lembur (Batas Mulai Dihitung)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={localConfig.minOvertimeMinutes}
                  onChange={(e) => setLocalConfig({ ...localConfig, minOvertimeMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Titik Koordinat GPS Kantor & Geofence Radius */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <MapPin className="w-5 h-5 text-rose-600" />
                  <h3>Penyesuaian Titik Koordinat GPS & Geofence Kantor</h3>
                </div>
                <button
                  type="button"
                  onClick={handleLockCurrentGPSAsOffice}
                  disabled={isGettingGps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                >
                  <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isGettingGps ? 'animate-spin' : ''}`} />
                  {isGettingGps ? 'Mendeteksi...' : 'Kunci GPS Perangkat Saya Sekarang'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude Kantor (Garis Lintang)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={localConfig.officeLat}
                    onChange={(e) => setLocalConfig({ ...localConfig, officeLat: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude Kantor (Garis Bujur)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={localConfig.officeLng}
                    onChange={(e) => setLocalConfig({ ...localConfig, officeLng: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Radius Geofence Presensi (Meter)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="10000"
                      step="10"
                      required
                      value={localConfig.officeRadiusMeters}
                      onChange={(e) => setLocalConfig({ ...localConfig, officeRadiusMeters: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-600">Meter</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Alamat Kantor: <span className="font-semibold text-slate-800">{localConfig.companyAddress}</span></span>
                <span className="text-[11px] text-slate-500">Koordinat akurat memastikan presensi hanya diizinkan di lokasi kantor</span>
              </div>
            </div>

            {/* Email Notifier Settings */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
                <Send className="w-5 h-5 text-blue-600" />
                <h3>Pengaturan Notifikasi Email Real-Time</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Admin HRD (Penerima Laporan & Peringatan)
                  </label>
                  <input
                    type="email"
                    required
                    value={localConfig.adminAlertEmail}
                    onChange={(e) => setLocalConfig({ ...localConfig, adminAlertEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyEmailOnShiftChange}
                      onChange={(e) => setLocalConfig({ ...localConfig, notifyEmailOnShiftChange: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Kirim email otomatis saat terjadi perubahan jadwal shift</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.notifyEmailOnPayrollRuleChange}
                      onChange={(e) => setLocalConfig({ ...localConfig, notifyEmailOnPayrollRuleChange: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Kirim email saat tanggal tutup buku atau kelipatan lembur diubah</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Keamanan & Kredensial Administrator Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3>Keamanan & Kredensial Akun Administrator</h3>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Kelola username dan kata sandi untuk akses hak penuh Dashboard Admin
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-700/20 transition cursor-pointer shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ubah Password Admin Sekarang</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login Admin
                  </label>
                  <input
                    type="text"
                    required
                    value={localConfig.adminUsername || 'admin'}
                    onChange={(e) => setLocalConfig({ ...localConfig, adminUsername: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Username yang digunakan saat login ke Portal Admin HRD.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Administrator
                  </label>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono text-sm tracking-widest text-slate-700">••••••••••</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Ganti Password</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Klik untuk mengganti kata sandi administrator secara aman.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Seluruh Kebijakan Perusahaan</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: INTEGRASI SPREADSHEET (BASIS DATA UTAMA) */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-base text-slate-900">
                    Integrasi Google Spreadsheet Sebagai Basis Data Utama
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seluruh data presensi, absensi, master karyawan, dan rekapitulasi gaji tersinkronisasi langsung ke Google Sheets.
                </p>
              </div>

              <button
                type="button"
                onClick={onManualSyncSheets}
                disabled={isSyncingSheets}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                <span>{isSyncingSheets ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Apps Script Webhook URL
                </label>
                <input
                  type="text"
                  value={localConfig.spreadsheetWebhookUrl}
                  onChange={(e) => setLocalConfig({ ...localConfig, spreadsheetWebhookUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  URL Web App yang diperoleh dari Google Sheets Anda melalui menu Apps Script.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spreadsheet Sheet ID (Database Key)
                </label>
                <input
                  type="text"
                  value={localConfig.spreadsheetId}
                  onChange={(e) => setLocalConfig({ ...localConfig, spreadsheetId: e.target.value })}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ID file spreadsheet utama untuk manajemen data HRD.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <div className="font-bold">Status Database: Terhubung & Aktif</div>
                <div className="text-[11px] text-emerald-700">Terakhir sinkron: {config.lastSheetsSyncTime || 'Baru saja'}</div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                Live Two-Way Ready
              </span>
            </div>
          </div>

          {/* Tabular Spreadsheet Viewer Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold">Sheet: Database_Presensi_Live</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {attendanceRecords.length} baris data tercatat
              </span>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">ID_Presensi</th>
                    <th className="py-2.5 px-3">ID_Karyawan</th>
                    <th className="py-2.5 px-3">Nama</th>
                    <th className="py-2.5 px-3">Departemen</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">CheckIn</th>
                    <th className="py-2.5 px-3">CheckOut</th>
                    <th className="py-2.5 px-3">Durasi_Jam</th>
                    <th className="py-2.5 px-3">Lembur_Jam</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Jarak_GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {attendanceRecords.slice(0, 15).map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">{a.id}</td>
                      <td className="py-2 px-3">{a.employeeId}</td>
                      <td className="py-2 px-3 font-sans font-medium">{a.employeeName}</td>
                      <td className="py-2 px-3">{a.department}</td>
                      <td className="py-2 px-3">{a.date}</td>
                      <td className="py-2 px-3">{a.checkInTime || '-'}</td>
                      <td className="py-2 px-3">{a.checkOutTime || '-'}</td>
                      <td className="py-2 px-3">{a.workDurationHours}</td>
                      <td className="py-2 px-3">{a.overtimeHours}</td>
                      <td className="py-2 px-3">{a.status}</td>
                      <td className="py-2 px-3">{a.checkInDistanceMeters || 0}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EKSPOR LAPORAN BERKALA PER DEPARTEMEN */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900">
                Fitur Ekspor Laporan Otomatis Berkala Ke PDF
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi jadwal otomatis pengiriman laporan PDF rekapitulasi gaji dan presensi per departemen
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Departemen Target
                </label>
                <select
                  value={scheduledDept}
                  onChange={(e) => setScheduledDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white"
                >
                  <option value="Semua Departemen">Semua Departemen</option>
                  {departments.filter(d => d !== 'Semua').map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Frekuensi Ekspor Berkala
                </label>
                <select
                  value={scheduledFrequency}
                  onChange={(e) => setScheduledFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-white"
                >
                  <option value="bulanan">Bulanan (Setiap Tanggal Tutup Buku Cut-Off)</option>
                  <option value="mingguan">Mingguan (Setiap Hari Jumat Sore)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleRunScheduledDepartmentExport(scheduledDept)}
                  className="w-full py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate & Unduh PDF ({scheduledDept})</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <span>Status Scheduler: <span className="font-bold text-emerald-700">{scheduledStatus}</span></span>
              <span className="text-[11px] text-slate-500">Departemen Target: {scheduledDept}</span>
            </div>
          </div>

          {/* Quick Department Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.filter(d => d !== 'Semua').map((dept) => {
              const deptEmployees = employees.filter(e => e.department === dept);
              const deptSummaries = allSummaries.filter(s => s.department === dept);
              const totalNetDept = deptSummaries.reduce((acc, s) => acc + s.netSalary, 0);

              return (
                <div key={dept} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{dept}</span>
                    <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                      {deptEmployees.length} Karyawan
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Gaji Departemen:</span>
                      <span className="font-mono font-bold text-slate-900">{formatIDR(totalNetDept)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Akumulasi Lembur:</span>
                      <span className="font-mono text-indigo-700">
                        {deptSummaries.reduce((a, b) => a + b.totalOvertimeHours, 0)} Jam
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => exportPayrollReportPDF(deptSummaries, config, dept)}
                    className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Unduh PDF Departemen
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: MANAJEMEN KARYAWAN & SHIFT */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-900">Manajemen Karyawan, Gaji & Shift</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengaturan lengkap ID, No. HP, Gaji Pokok, Tunjangan, Jam Kerja Kustom, dan Tambah/Hapus Karyawan
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mr-1">
                  <button
                    type="button"
                    onClick={() => setEmployeeViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      employeeViewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Tampilan Tabel"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeViewMode('card')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      employeeViewMode === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Tampilan Kartu Mobile"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kartu</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Atur Shift</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tambah</span>
                </button>
              </div>
            </div>

            {/* Employee Card View */}
            {employeeViewMode === 'card' ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {employees.map((emp) => {
                  const shiftName = shifts.find(s => s.id === emp.currentShiftId)?.name || 'Reguler';

                  return (
                    <div key={emp.id} className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{emp.name}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">{emp.id} • {emp.position}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700 shrink-0">
                          {emp.department}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs py-2 border-y border-slate-200/70">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Login / HP:</span>
                          <span className="font-medium text-slate-900">{emp.phone} (@{emp.username})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Shift Kerja:</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {shiftName}
                          </span>
                        </div>
                        {emp.customHours && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Jam Kustom:</span>
                            <span className="text-emerald-700 font-mono font-semibold">
                              {emp.customHours.startTime} - {emp.customHours.endTime}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gaji Pokok:</span>
                          <span className="font-mono text-slate-900 font-semibold">{formatIDR(emp.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tunjangan:</span>
                          <span className="font-mono text-emerald-700 font-semibold">{formatIDR(emp.allowance)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEmployeeToEdit(emp)}
                          className="flex-1 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmployeeToDelete(emp)}
                          className="py-1.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Employee Table View */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">ID & Nama</th>
                      <th className="py-3 px-4">Kontak (Fleksibel Login)</th>
                      <th className="py-3 px-4">Departemen & Jabatan</th>
                      <th className="py-3 px-4">Shift & Jam Kerja</th>
                      <th className="py-3 px-4 text-right">Gaji Pokok</th>
                      <th className="py-3 px-4 text-right">Tunjangan</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {employees.map((emp) => {
                      const shiftName = shifts.find(s => s.id === emp.currentShiftId)?.name || 'Reguler';

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{emp.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-900 font-medium">{emp.phone}</div>
                            <div className="text-[11px] text-slate-500">@{emp.username}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{emp.position}</div>
                            <div className="text-[11px] text-slate-500">{emp.department}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {shiftName}
                              </span>
                              {emp.customHours && (
                                <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Kustom: {emp.customHours.startTime}-{emp.customHours.endTime}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium">
                            {formatIDR(emp.baseSalary)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                            {formatIDR(emp.allowance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEmployeeToEdit(emp)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                                title="Edit Karyawan & Jam Kerja"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEmployeeToDelete(emp)}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition cursor-pointer"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: LAPORAN KERJA & REKOMENDASI (SUPERVISOR / MANAGER) */}
      {activeTab === 'work-reports' && (
        <AdminWorkReportSection
          employees={employees}
          workReports={workReports}
          attendanceRecords={attendanceRecords}
          onUpdateEmployee={(updatedEmp) => {
            onUpdateEmployees(employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
          }}
          onUpdateReportStatus={(reportId, status, feedback) => {
            if (onUpdateWorkReports) {
              const updated = workReports.map((r) =>
                r.id === reportId
                  ? {
                      ...r,
                      status,
                      reviewFeedback: feedback,
                      reviewedBy: 'Admin HRD & Manajemen',
                      reviewedAt:
                        new Date().toISOString().slice(0, 10) +
                        ' ' +
                        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    }
                  : r
              );
              onUpdateWorkReports(updated);
            }
          }}
          onSendBroadcastReminder={(targetIds, message) => {
            targetIds.forEach((id) => {
              const emp = employees.find((e) => e.id === id);
              if (emp) {
                onTriggerEmailAlert(
                  emp.email,
                  'Peringatan Pengisian Laporan Pekerjaan Shift',
                  'Pengingat Laporan Kerja',
                  message
                );
              }
            });
            onSendPushNotification('Pengingat Laporan Kerja', message, 'info');
          }}
        />
      )}

      {/* Modal Tambah Karyawan Baru */}
      <EmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        shifts={shifts}
        existingEmployees={employees}
      />

      {/* Modal Edit Karyawan & Custom Working Hours */}
      <EmployeeModal
        isOpen={Boolean(employeeToEdit)}
        onClose={() => setEmployeeToEdit(null)}
        onSave={handleSaveEmployee}
        employee={employeeToEdit}
        shifts={shifts}
        existingEmployees={employees}
      />

      {/* Modal Konfirmasi Hapus Karyawan */}
      <DeleteEmployeeModal
        isOpen={Boolean(employeeToDelete)}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={handleDeleteEmployeeConfirm}
        employee={employeeToDelete}
      />

      {/* Modal Shift Management & Custom Working Hours */}
      {onUpdateShifts && (
        <ShiftManagementModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          shifts={shifts}
          onSaveShifts={(updatedShifts) => {
            onUpdateShifts(updatedShifts);
            onSendPushNotification(
              'Perubahan Master Shift',
              'Master jam kerja & shift perusahaan telah disesuaikan oleh administrator.',
              'shift'
            );
          }}
        />
      )}

      {/* Modal Ganti Password Admin */}
      <ChangeAdminPasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentAdminPassword={config.adminPassword}
        currentAdminUsername={config.adminUsername}
        onSave={handleChangeAdminPassword}
      />

      {/* Admin Dashboard Watermark Footer Note */}
      <div className="py-4 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-slate-300 text-xs border border-slate-700 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Sistem Manajemen HRD & Penggajian • Dibuat oleh <strong className="text-white font-bold tracking-wide">heruhendri</strong></span>
        </div>
      </div>
    </div>
  );
};
