import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Employee, 
  CompanyConfig, 
  AttendanceRecord, 
  PushNotification, 
  EmailLog, 
  Shift,
  PayrollSummary,
  WorkReport 
} from './types';
import { 
  INITIAL_CONFIG, 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_SHIFTS,
  INITIAL_WORK_REPORTS 
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { EmployeePortal } from './components/EmployeePortal';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { EmailLogModal } from './components/EmailLogModal';
import { SpreadsheetSyncModal } from './components/SpreadsheetSyncModal';
import { ChangeAdminPasswordModal } from './components/ChangeAdminPasswordModal';
import { computeEmployeePayroll } from './utils/payroll';
import { syncToSpreadsheetWebhook } from './utils/sheetsSync';
import { createEmailAlert } from './utils/emailNotifier';
import { CheckCircle2, Shield, User, AlertTriangle, LogIn, Lock, Sparkles } from 'lucide-react';

export default function App() {
  // Strictly NO auto-login: Always start unauthenticated upon opening or reloading the application
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);

  const [config, setConfig] = useState<CompanyConfig>(() => {
    const saved = localStorage.getItem('app_company_config');
    const savedAdminPass = localStorage.getItem('app_admin_password');
    const savedAdminUser = localStorage.getItem('app_admin_username');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_CONFIG,
          ...parsed,
          adminUsername: savedAdminUser || parsed.adminUsername || INITIAL_CONFIG.adminUsername || 'admin',
          adminPassword: savedAdminPass || parsed.adminPassword || INITIAL_CONFIG.adminPassword || 'admin123',
        };
      } catch {
        // fallback to INITIAL_CONFIG
      }
    }
    return {
      ...INITIAL_CONFIG,
      adminUsername: savedAdminUser || INITIAL_CONFIG.adminUsername || 'admin',
      adminPassword: savedAdminPass || INITIAL_CONFIG.adminPassword || 'admin123',
    };
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('app_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('app_shifts');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('app_attendances');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCES;
  });

  const [workReports, setWorkReports] = useState<WorkReport[]>(() => {
    const saved = localStorage.getItem('app_work_reports');
    return saved ? JSON.parse(saved) : INITIAL_WORK_REPORTS;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem('app_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([
    {
      id: 'EMAIL-INIT-01',
      to: 'budi.santoso@nusantara.id',
      subject: 'Konfirmasi Presensi GPS & Jam Kerja Selesai',
      bodySnippet: 'Presensi tanggal 2026-09-05 berhasil tercatat. Durasi kerja 10.5 jam dengan 1.5 jam lembur terakumulasi.',
      timestamp: '17 Sep 2026, 08:30',
      triggerEvent: 'ATTENDANCE_CHECKOUT',
      status: 'delivered',
    },
    {
      id: 'EMAIL-INIT-02',
      to: 'hrd.admin@nusantarasinergi.co.id',
      subject: 'Sinkronisasi Otomatis Database Spreadsheet',
      bodySnippet: 'Sinkronisasi real-time data presensi dan rekapitulasi penggajian ke Google Sheets berhasil dieksekusi.',
      timestamp: '17 Sep 2026, 08:31',
      triggerEvent: 'SPREADSHEET_SYNC',
      status: 'delivered',
    },
  ]);

  // Modal Visibility
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isEmailLogOpen, setIsEmailLogOpen] = useState(false);
  const [isSpreadsheetModalOpen, setIsSpreadsheetModalOpen] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('app_company_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('app_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('app_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('app_attendances', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('app_work_reports', JSON.stringify(workReports));
  }, [workReports]);

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Submit Work Report handler
  const handleSubmitWorkReport = (reportData: Partial<WorkReport>) => {
    const existingIdx = workReports.findIndex(
      (r) => r.id === reportData.id || (r.employeeId === reportData.employeeId && r.date === reportData.date)
    );
    let updated: WorkReport[];
    if (existingIdx >= 0) {
      updated = [...workReports];
      updated[existingIdx] = { ...updated[existingIdx], ...reportData } as WorkReport;
    } else {
      updated = [reportData as WorkReport, ...workReports];
    }
    setWorkReports(updated);
    showToast('Laporan pekerjaan harian berhasil diserahkan ke Manajemen & HRD!');

    // Trigger real-time email notification to Admin
    handleTriggerEmailAlert(
      config.adminAlertEmail,
      `Laporan Kerja Masuk: ${reportData.employeeName} (${reportData.position})`,
      'WORK_REPORT_SUBMITTED',
      `Laporan shift tanggal ${reportData.date} diserahkan oleh ${reportData.employeeName} (${reportData.position} - ${reportData.department}). Capaian target: ${reportData.completionPercentage}%. Catatan kendala: ${reportData.issuesOrBlockers || 'Nihil'}.`
    );

    handleSendPushNotification(
      'Laporan Kerja Berhasil Diserahkan',
      `Laporan shift Anda tanggal ${reportData.date} telah tercatat dan masuk ke antrean review manajemen.`,
      'info'
    );
  };

  // Trigger Email Alert helper
  const handleTriggerEmailAlert = (
    to: string,
    subject: string,
    triggerEvent: string,
    description: string
  ) => {
    const newLog = createEmailAlert(to, subject, triggerEvent, {
      title: subject,
      description,
    });
    setEmailLogs((prev) => [newLog, ...prev]);
    showToast(`Email notifikasi real-time terkirim ke: ${to}`);
  };

  // Push Notification dispatcher
  const handleSendPushNotification = (
    title: string,
    message: string,
    type: 'shift' | 'attendance' | 'payroll' | 'info'
  ) => {
    const newNotif: PushNotification = {
      id: `NOTIF-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // CheckIn handler
  const handleCheckIn = (recordData: Partial<AttendanceRecord>) => {
    const newId = `ATT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const newRecord: AttendanceRecord = {
      id: newId,
      employeeId: recordData.employeeId || 'EMP001',
      employeeName: recordData.employeeName || 'Karyawan',
      department: recordData.department || 'Umum',
      date: recordData.date || new Date().toISOString().slice(0, 10),
      checkInTime: recordData.checkInTime,
      checkInLat: recordData.checkInLat,
      checkInLng: recordData.checkInLng,
      checkInDistanceMeters: recordData.checkInDistanceMeters,
      checkInAddress: recordData.checkInAddress,
      status: recordData.status || 'hadir',
      workDurationHours: 0,
      overtimeHours: 0,
      overtimePay: 0,
      isOvertimeApproved: false,
      notes: recordData.notes,
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    showToast(`Check-in berhasil! Terverifikasi GPS: ${recordData.checkInDistanceMeters}m dari kantor.`);

    // Email notification if late
    if (recordData.status === 'terlambat') {
      handleTriggerEmailAlert(
        config.adminAlertEmail,
        `Notifikasi Keterlambatan: ${newRecord.employeeName}`,
        'ATTENDANCE_LATE',
        `Karyawan ${newRecord.employeeName} melakukan check-in terlambat pada pukul ${newRecord.checkInTime} WIB.`
      );
    }
  };

  // CheckOut handler
  const handleCheckOut = (recordId: string, checkOutData: Partial<AttendanceRecord>) => {
    let completedRecord: AttendanceRecord | null = null;

    setAttendanceRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          const updated = {
            ...r,
            ...checkOutData,
          };
          completedRecord = updated;
          return updated;
        }
        return r;
      })
    );

    showToast(`Check-out berhasil! Durasi kerja tercatat: ${checkOutData.workDurationHours} Jam.`);

    // If overtime occurred, send email to employee & admin
    if (checkOutData.overtimeHours && checkOutData.overtimeHours > 0 && completedRecord) {
      handleTriggerEmailAlert(
        config.adminAlertEmail,
        `Pengajuan Lembur Otomatis: ${(completedRecord as any).employeeName}`,
        'OVERTIME_LOGGED',
        `Karyawan ${(completedRecord as any).employeeName} telah menyelesaikan shift dengan lembur sebesar ${checkOutData.overtimeHours} jam.`
      );
    }
  };

  // Manual Spreadsheet Sync
  const handleManualSyncSheets = async () => {
    setIsSyncingSheets(true);
    const summaries: PayrollSummary[] = employees.map((e) =>
      computeEmployeePayroll(e, attendanceRecords, config)
    );

    const res = await syncToSpreadsheetWebhook(config.spreadsheetWebhookUrl, {
      employees,
      attendances: attendanceRecords,
      summaries,
      config,
    });

    setIsSyncingSheets(false);
    setConfig((prev) => ({ ...prev, lastSheetsSyncTime: res.timestamp }));
    showToast(res.message);

    handleTriggerEmailAlert(
      config.adminAlertEmail,
      'Sinkronisasi Google Spreadsheet Database Berhasil',
      'SPREADSHEET_SYNC_SUCCESS',
      `Data absensi, lembur, dan gaji (${res.syncedRowsCount} baris) berhasil disinkronkan ke spreadsheet.`
    );
  };

  // Handle Login Modal Callback (Strictly no auto-login session persistence)
  const handleLoginSuccess = (newRole: UserRole, emp?: Employee) => {
    setRole(newRole);
    if (newRole === 'employee' && emp) {
      setCurrentEmployee(emp);
    } else {
      setCurrentEmployee(null);
    }
    setIsLoginModalOpen(false);
    showToast(`Masuk sebagai ${newRole === 'admin' ? 'Administrator HRD' : emp?.name}`);
  };

  // Handle Logout (Completely clear session)
  const handleLogout = () => {
    sessionStorage.removeItem('app_auth_session');
    setRole(null);
    setCurrentEmployee(null);
    setIsLoginModalOpen(true);
    showToast('Anda telah berhasil keluar (logout).');
  };

  // Handle Admin Password & Username update
  const handleUpdateAdminPassword = (newPassword: string, newUsername?: string) => {
    const finalUser = newUsername || config.adminUsername || 'admin';
    const updated: CompanyConfig = {
      ...config,
      adminPassword: newPassword,
      adminUsername: finalUser,
    };
    setConfig(updated);
    localStorage.setItem('app_admin_password', newPassword);
    localStorage.setItem('app_admin_username', finalUser);
    localStorage.setItem('app_company_config', JSON.stringify(updated));

    showToast('Password Administrator berhasil diperbarui dan disimpan.');
    handleSendPushNotification(
      'Password Admin Diperbarui',
      'Kata sandi akun Administrator berhasil diubah dan disimpan dengan aman.',
      'info'
    );
  };

  // Handle General Config Update from Admin Dashboard
  const handleUpdateConfig = (newConf: CompanyConfig) => {
    setConfig(newConf);
    if (newConf.adminPassword) {
      localStorage.setItem('app_admin_password', newConf.adminPassword);
    }
    if (newConf.adminUsername) {
      localStorage.setItem('app_admin_username', newConf.adminUsername);
    }
    localStorage.setItem('app_company_config', JSON.stringify(newConf));
    showToast('Kebijakan dan konfigurasi perusahaan berhasil disimpan!');
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        role={role}
        currentEmployee={currentEmployee}
        config={config}
        notifications={notifications}
        unreadNotificationCount={unreadNotifCount}
        emailLogCount={emailLogs.length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenEmailLogs={() => setIsEmailLogOpen(true)}
        onOpenSpreadsheetModal={() => setIsSpreadsheetModalOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onSwitchUser={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isSyncingSheets={isSyncingSheets}
        onManualSyncSheets={handleManualSyncSheets}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {!role ? (
          <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Sistem Presensi & Penggajian Terkunci</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Silakan masuk menggunakan akun Karyawan atau Administrator HRD untuk mengakses data presensi, lembur, dan slip gaji Anda.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Buka Formulir Masuk (Login)</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dibuat oleh <strong className="text-slate-700 font-semibold">heruhendri</strong></span>
            </div>
          </div>
        ) : role === 'employee' && currentEmployee ? (
          <EmployeePortal
            employee={currentEmployee}
            shifts={shifts}
            config={config}
            attendanceRecords={attendanceRecords}
            workReports={workReports}
            onSubmitWorkReport={handleSubmitWorkReport}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        ) : (
          <AdminDashboard
            config={config}
            onUpdateConfig={handleUpdateConfig}
            employees={employees}
            onUpdateEmployees={setEmployees}
            attendanceRecords={attendanceRecords}
            onUpdateAttendanceRecords={setAttendanceRecords}
            shifts={shifts}
            onUpdateShifts={setShifts}
            workReports={workReports}
            onUpdateWorkReports={setWorkReports}
            onManualSyncSheets={handleManualSyncSheets}
            isSyncingSheets={isSyncingSheets}
            onTriggerEmailAlert={handleTriggerEmailAlert}
            onSendPushNotification={handleSendPushNotification}
          />
        )}
      </main>

      {/* Universal Watermarked Footer */}
      <footer className="mt-auto py-5 border-t border-slate-200 bg-white/90 backdrop-blur-xs text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-slate-800 tracking-tight">{config.companyName}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 text-[11px]">Sistem Presensi GPS & Penggajian Terintegrasi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Dibuat oleh <strong className="text-emerald-700 font-bold tracking-wide">heruhendri</strong></span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-3.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        employees={employees}
        adminUsername={config.adminUsername}
        adminPassword={config.adminPassword}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsLoginModalOpen(false)}
        canClose={Boolean(role)}
      />

      <ChangeAdminPasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentAdminPassword={config.adminPassword}
        currentAdminUsername={config.adminUsername}
        onSave={handleUpdateAdminPassword}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
      />

      <EmailLogModal
        isOpen={isEmailLogOpen}
        emailLogs={emailLogs}
        onClose={() => setIsEmailLogOpen(false)}
        adminEmail={config.adminAlertEmail}
      />

      <SpreadsheetSyncModal
        isOpen={isSpreadsheetModalOpen}
        config={config}
        onClose={() => setIsSpreadsheetModalOpen(false)}
        onManualSync={handleManualSyncSheets}
        isSyncing={isSyncingSheets}
        lastSyncTime={config.lastSheetsSyncTime}
      />
    </div>
  );
}
