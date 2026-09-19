import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  Power,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  ExternalLink,
  Sparkles,
  Send,
  LogOut,
  Building2,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { AttendanceRecord, CompanyConfig, Employee, Shift } from '../types';

interface LiveEmployeeDashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  shifts: Shift[];
  config: CompanyConfig;
  onUpdateEmployees?: (updatedEmployees: Employee[]) => void;
  onOpenMapsTab?: (employeeId?: string) => void;
  onSendPushNotification?: (title: string, message: string, type: 'attendance' | 'shift' | 'payroll' | 'info') => void;
}

export const LiveEmployeeDashboard: React.FC<LiveEmployeeDashboardProps> = ({
  employees,
  attendanceRecords,
  shifts,
  config,
  onUpdateEmployees,
  onOpenMapsTab,
  onSendPushNotification,
}) => {
  // Master Live Monitoring State: Bisa diaktifkan dan dinonaktifkan
  const [isLiveActive, setIsLiveActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_live_monitoring_active');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'out_radius' | 'checked_out' | 'absent' | 'inactive'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Save live active setting
  useEffect(() => {
    localStorage.setItem('app_live_monitoring_active', JSON.stringify(isLiveActive));
  }, [isLiveActive]);

  // Live real-time clock ticker (only ticks every second when isLiveActive is true)
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Toast feedback helper
  const showToast = (message: string) => {
    setToastFeedback(message);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  // Toggle Employee Active / Inactive status
  const handleToggleEmployeeActiveStatus = (employeeId: string) => {
    if (!onUpdateEmployees) return;

    const targetEmp = employees.find((e) => e.id === employeeId);
    if (!targetEmp) return;

    const newActiveState = targetEmp.isActive === false ? true : false;
    const updated = employees.map((e) =>
      e.id === employeeId ? { ...e, isActive: newActiveState } : e
    );

    onUpdateEmployees(updated);
    showToast(
      newActiveState
        ? `Status ${targetEmp.name} berhasil DIAKTIFKAN kembali.`
        : `Status ${targetEmp.name} berhasil DINONAKTIFKAN.`
    );

    if (onSendPushNotification) {
      onSendPushNotification(
        newActiveState ? 'Aktivasi Karyawan' : 'Penonaktifan Karyawan',
        `Karyawan ${targetEmp.name} (${targetEmp.id}) telah ${newActiveState ? 'diaktifkan' : 'dinonaktifkan'} oleh administrator.`,
        'info'
      );
    }
  };

  // Toggle master live monitor
  const handleToggleMasterLive = () => {
    const nextState = !isLiveActive;
    setIsLiveActive(nextState);
    setLastRefreshedAt(new Date());
    showToast(
      nextState
        ? 'Dashboard Live Monitoring REAL-TIME DIAKTIFKAN (Auto-Refresh Aktif).'
        : 'Dashboard Live Monitoring TELAH DINONAKTIFKAN (Mode Jeda).'
    );
  };

  // Manual refresh
  const handleManualRefresh = () => {
    setCurrentTime(new Date());
    setLastRefreshedAt(new Date());
    showToast('Data Live Karyawan berhasil diperbarui.');
  };

  // Today's date string YYYY-MM-DD
  const todayStr = currentTime.toISOString().slice(0, 10);
  const todayAttendances = attendanceRecords.filter((a) => a.date === todayStr);

  // Departments list
  const departments = ['Semua', ...Array.from(new Set(employees.map((e) => e.department)))];

  // Helper: Get Live status for an employee today
  const getEmployeeLiveStatus = (emp: Employee) => {
    if (emp.isActive === false) {
      return {
        key: 'inactive',
        label: 'Nonaktif',
        color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        badge: 'Nonaktif',
        record: null,
      };
    }

    const record = todayAttendances.find((a) => a.employeeId === emp.id);

    if (!record || !record.checkInTime) {
      return {
        key: 'absent',
        label: 'Belum Hadir',
        color: 'bg-slate-800 text-slate-400 border-slate-700',
        badge: 'Belum Check-In',
        record: null,
      };
    }

    if (record.checkOutTime) {
      return {
        key: 'checked_out',
        label: 'Selesai Pulang',
        color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        badge: `Pulang (${record.checkOutTime})`,
        record,
      };
    }

    // Still checked in
    const isOutRadius = (record.checkInDistanceMeters || 0) > config.officeRadiusMeters;
    if (isOutRadius) {
      return {
        key: 'out_radius',
        label: 'Bekerja (Luar Radius / WFA)',
        color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        badge: `WFA (${record.checkInDistanceMeters}m)`,
        record,
      };
    }

    return {
      key: 'working',
      label: 'Sedang Bekerja di Kantor',
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badge: `Aktif (${record.checkInTime})`,
      record,
    };
  };

  // Helper: Live duration timer calculation (HH:MM:SS)
  const calculateLiveDuration = (checkInTimeStr?: string, checkOutTimeStr?: string) => {
    if (!checkInTimeStr) return '00:00:00';

    const [inH, inM, inS = '0'] = checkInTimeStr.split(':').map(Number);
    const inDate = new Date(currentTime);
    inDate.setHours(inH, inM, Number(inS), 0);

    let endDate = currentTime;
    if (checkOutTimeStr) {
      const [outH, outM, outS = '0'] = checkOutTimeStr.split(':').map(Number);
      endDate = new Date(currentTime);
      endDate.setHours(outH, outM, Number(outS), 0);
    }

    const diffMs = Math.max(0, endDate.getTime() - inDate.getTime());
    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Aggregate summary counts
  const liveStatuses = employees.map((e) => ({
    employee: e,
    status: getEmployeeLiveStatus(e),
  }));

  const countTotalEmployees = employees.length;
  const countWorkingInRadius = liveStatuses.filter((s) => s.status.key === 'working').length;
  const countWorkingOutRadius = liveStatuses.filter((s) => s.status.key === 'out_radius').length;
  const countCheckedOut = liveStatuses.filter((s) => s.status.key === 'checked_out').length;
  const countAbsent = liveStatuses.filter((s) => s.status.key === 'absent').length;
  const countInactive = liveStatuses.filter((s) => s.status.key === 'inactive').length;

  // Filtered employees list
  const filteredEmployees = liveStatuses.filter(({ employee, status }) => {
    // Dept filter
    if (selectedDepartment !== 'Semua' && employee.department !== selectedDepartment) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && status.key !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        employee.name.toLowerCase().includes(q) ||
        employee.id.toLowerCase().includes(q) ||
        employee.position.toLowerCase().includes(q) ||
        employee.department.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner: Master Live Controller & Real-Time Status */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Background ambient gradient */}
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
            isLiveActive ? 'bg-emerald-500/10 opacity-100' : 'bg-rose-500/5 opacity-50'
          }`}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <Radio className={`w-5 h-5 ${isLiveActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Dashboard Live Karyawan</span>
              </span>

              {/* Live Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                  isLiveActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span>{isLiveActive ? 'LIVE MONITOR AKTIF' : 'MONITORING DINONAKTIFKAN'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Pantau status presensi kehadiran, durasi kerja detik-demi-detik, dan verifikasi geofence karyawan secara real-time. Anda dapat mengaktifkan atau menonaktifkan pemantauan otomatis kapan saja.
            </p>
          </div>

          {/* Master Live Toggle Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Button: Aktifkan / Nonaktifkan */}
            <button
              type="button"
              onClick={handleToggleMasterLive}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
                isLiveActive
                  ? 'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/50 shadow-rose-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/50 shadow-emerald-900/30'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isLiveActive ? 'Nonaktifkan Live Monitor' : 'Aktifkan Live Monitor'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={handleManualRefresh}
              title="Perbarui Data Sekarang"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLiveActive ? 'animate-spin' : ''}`} />
            </button>

            {/* Link to Maps Tab */}
            {onOpenMapsTab && (
              <button
                type="button"
                onClick={() => onOpenMapsTab()}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-900/30"
              >
                <MapPin className="w-4 h-4" />
                <span>Buka Peta GPS</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Clock Strip */}
        <div className="relative z-10 mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-slate-200 font-bold">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
              </span>
            </div>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Radius Kantor: <strong>{config.officeRadiusMeters}m</strong> ({config.companyName})</span>
            <span className="text-slate-600">•</span>
            <span>Diperbarui: {lastRefreshedAt.toLocaleTimeString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Total Terdaftar */}
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-700 shadow-md ring-2 ring-slate-500'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500">Total Karyawan</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{countTotalEmployees}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Semua Departemen</div>
        </button>

        {/* Sedang Bekerja di Kantor */}
        <button
          type="button"
          onClick={() => setStatusFilter('working')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'working'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-600 shadow-md ring-2 ring-emerald-400'
              : 'bg-white hover:bg-emerald-50/50 border-emerald-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-700">Di Kantor</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{countWorkingInRadius}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Valid Geofence ({config.officeRadiusMeters}m)</div>
        </button>

        {/* Luar Radius / WFA */}
        <button
          type="button"
          onClick={() => setStatusFilter('out_radius')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'out_radius'
              ? 'bg-amber-950 text-amber-100 border-amber-600 shadow-md ring-2 ring-amber-400'
              : 'bg-white hover:bg-amber-50/50 border-amber-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-amber-700">WFA / Remote</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">{countWorkingOutRadius}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">&gt;{config.officeRadiusMeters}m Dari Kantor</div>
        </button>

        {/* Sudah Check-Out */}
        <button
          type="button"
          onClick={() => setStatusFilter('checked_out')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'checked_out'
              ? 'bg-blue-950 text-blue-100 border-blue-600 shadow-md ring-2 ring-blue-400'
              : 'bg-white hover:bg-blue-50/50 border-blue-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-blue-700">Sudah Pulang</span>
            <LogOut className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700">{countCheckedOut}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">Check-out Lengkap</div>
        </button>

        {/* Belum Hadir */}
        <button
          type="button"
          onClick={() => setStatusFilter('absent')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'absent'
              ? 'bg-slate-900 text-white border-slate-700 shadow-md ring-2 ring-slate-400'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-600">Belum Masuk</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-700">{countAbsent}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Belum Melakukan Absen</div>
        </button>

        {/* Karyawan Nonaktif */}
        <button
          type="button"
          onClick={() => setStatusFilter('inactive')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            statusFilter === 'inactive'
              ? 'bg-rose-950 text-rose-100 border-rose-600 shadow-md ring-2 ring-rose-400'
              : 'bg-white hover:bg-rose-50/50 border-rose-200/80 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-rose-700">Nonaktif</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700">{countInactive}</div>
          <div className="text-[10px] text-rose-600 mt-0.5">Status Dinonaktifkan</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, ID, jabatan, atau divisi..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
          />
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 md:pb-0">
          <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Dept:
          </span>
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 cursor-pointer ${
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

      {/* Live Employee Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-700 text-sm">Tidak ada karyawan yang sesuai filter</div>
            <p className="text-xs text-slate-500">Silakan ubah filter status atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          filteredEmployees.map(({ employee, status }) => {
            const empShift = shifts.find((s) => s.id === employee.currentShiftId) || shifts[0];
            const liveDuration = status.record?.checkInTime
              ? calculateLiveDuration(status.record.checkInTime, status.record.checkOutTime)
              : null;

            return (
              <div
                key={employee.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition hover:shadow-md flex flex-col justify-between gap-3 ${
                  employee.isActive === false
                    ? 'border-rose-200 bg-rose-50/20 opacity-80'
                    : status.key === 'working'
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : status.key === 'out_radius'
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Avatar, Name & Live Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {employee.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                          <span>{employee.name}</span>
                          {employee.requiresWorkReport && (
                            <span
                              title="Wajib Laporan Kerja Manajerial"
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                            >
                              SPV
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {employee.department} • {employee.position}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${status.color}`}
                    >
                      {status.key === 'working' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                      <span>{status.badge}</span>
                    </span>
                  </div>

                  {/* Attendance & Shift Details */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Jadwal Shift:</span>
                      <span className="font-semibold text-slate-700">
                        {empShift.name} ({empShift.startTime} - {empShift.endTime})
                      </span>
                    </div>

                    {status.record?.checkInTime ? (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Waktu Masuk:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {status.record.checkInTime} WIB
                          </span>
                        </div>

                        {status.record.checkOutTime && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Waktu Pulang:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {status.record.checkOutTime} WIB
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Jarak Lokasi GPS:</span>
                          <span
                            className={`font-semibold flex items-center gap-1 ${
                              (status.record.checkInDistanceMeters || 0) <= config.officeRadiusMeters
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            <MapPin className="w-3 h-3" />
                            <span>
                              {status.record.checkInDistanceMeters !== undefined
                                ? `${status.record.checkInDistanceMeters}m dari kantor`
                                : 'Koordinat tervalidasi'}
                            </span>
                          </span>
                        </div>

                        {/* Real-Time Live Running Timer */}
                        {isLiveActive && liveDuration && (
                          <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Durasi Kerja Berjalan:</span>
                            </span>
                            <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {liveDuration}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic flex items-center gap-1.5 py-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Karyawan belum melakukan presensi hari ini.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Toggle Active / Inactive Employee */}
                  {onUpdateEmployees && (
                    <button
                      type="button"
                      onClick={() => handleToggleEmployeeActiveStatus(employee.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                        employee.isActive === false
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200'
                      }`}
                      title={
                        employee.isActive === false
                          ? 'Aktifkan status karyawan'
                          : 'Nonaktifkan status karyawan'
                      }
                    >
                      {employee.isActive === false ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Aktifkan</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-slate-500" />
                          <span>Nonaktifkan</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Actions: View on Map or Details */}
                  <div className="flex items-center gap-1.5">
                    {status.record && onOpenMapsTab && (
                      <button
                        type="button"
                        onClick={() => onOpenMapsTab(employee.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                        title="Lihat titik koordinat di Peta GPS"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Peta GPS</span>
                      </button>
                    )}

                    {status.record?.checkInLat && status.record?.checkInLng && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${status.record.checkInLat},${status.record.checkInLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        title="Buka titik koordinat di Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Feedback Alert */}
      {toastFeedback && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="p-3.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastFeedback}</span>
          </div>
        </div>
      )}
    </div>
  );
};
