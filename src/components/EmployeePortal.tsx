import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  Navigation, 
  Sparkles, 
  Camera,
  Download,
  Info,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  MessageSquare,
  Edit3,
  BarChart3,
  List,
  LayoutGrid
} from 'lucide-react';
import { AttendanceRecord, CompanyConfig, Employee, Shift, WorkReport } from '../types';
import { calculateDistanceMeters, formatDistance, getCurrentCoordinates } from '../utils/geo';
import { computeEmployeePayroll, formatIDR, getPayrollCycleInfo } from '../utils/payroll';
import { exportSingleEmployeeSlipPDF } from '../utils/exportPdf';
import { WorkReportModal } from './WorkReportModal';
import { EmployeePerformanceCharts } from './EmployeePerformanceCharts';

interface EmployeePortalProps {
  employee: Employee;
  shifts: Shift[];
  config: CompanyConfig;
  attendanceRecords: AttendanceRecord[];
  workReports?: WorkReport[];
  onSubmitWorkReport?: (reportData: Partial<WorkReport>) => void;
  onCheckIn: (record: Partial<AttendanceRecord>) => void;
  onCheckOut: (recordId: string, checkOutData: Partial<AttendanceRecord>) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  employee,
  shifts,
  config,
  attendanceRecords,
  workReports = [],
  onSubmitWorkReport,
  onCheckIn,
  onCheckOut,
}) => {
  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Portal Tab state
  const [activePortalTab, setActivePortalTab] = useState<'attendance' | 'performance' | 'work-reports'>('attendance');
  const [historyViewMode, setHistoryViewMode] = useState<'card' | 'table'>('table');
  const [isWorkReportModalOpen, setIsWorkReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<WorkReport | undefined>(undefined);
  const [showCheckoutPrompt, setShowCheckoutPrompt] = useState(false);

  // GPS State
  const [currentLat, setCurrentLat] = useState<number>(config.officeLat);
  const [currentLng, setCurrentLng] = useState<number>(config.officeLng);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(10);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Checkin Form notes
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Find employee's assigned shift
  const currentShift = shifts.find((s) => s.id === employee.currentShiftId) || shifts[0];

  // Today's date string YYYY-MM-DD
  const todayStr = currentTime.toISOString().slice(0, 10);

  // Today's attendance record for this employee
  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === employee.id && r.date === todayStr
  );

  // Calculate Distance to Office
  const distanceToOffice = calculateDistanceMeters(
    currentLat,
    currentLng,
    config.officeLat,
    config.officeLng
  );
  const isInsideRadius = distanceToOffice <= config.officeRadiusMeters;

  // Real-time payroll calculation for this employee
  const payrollSummary = computeEmployeePayroll(employee, attendanceRecords, config);
  const cycleInfo = getPayrollCycleInfo(config);

  // Fetch Real GPS coordinates from device
  const handleDetectGPS = async () => {
    setIsGettingLocation(true);
    setGpsError(null);
    try {
      const coords = await getCurrentCoordinates();
      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);
      setGpsAccuracy(coords.accuracy);
    } catch (err: any) {
      setGpsError(err.message || 'Gagal mendeteksi koordinat GPS.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle Photo Capture simulation
  const handleCapturePhoto = () => {
    // Generates a mock selfie SVG/DataUrl
    const timestampText = new Date().toLocaleTimeString('id-ID');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" fill="#1e293b"/>
      <circle cx="120" cy="90" r="45" fill="#10b981"/>
      <circle cx="120" cy="85" r="35" fill="#334155"/>
      <path d="M50 200 C50 150, 190 150, 190 200" fill="#047857"/>
      <rect x="10" y="195" width="220" height="35" rx="6" fill="rgba(15, 23, 42, 0.8)"/>
      <text x="120" y="215" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">VERIFIKASI PRESENSI GPS</text>
      <text x="120" y="226" fill="#10b981" font-family="sans-serif" font-size="9" text-anchor="middle">${todayStr} ${timestampText} • ${formatDistance(distanceToOffice)}</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setPhotoPreview(dataUrl);
  };

  const handlePerformCheckIn = () => {
    if (!isInsideRadius) {
      alert(`Peringatan GPS: Anda berada ${formatDistance(distanceToOffice)} dari kantor. Maksimal radius yang diizinkan admin adalah ${config.officeRadiusMeters} meter.`);
      return;
    }

    const checkInTimeStr = currentTime.toTimeString().slice(0, 8);
    
    // Check if late based on shift startTime + gracePeriodMinutes
    const [shiftHour, shiftMinute] = currentShift.startTime.split(':').map(Number);
    const shiftStartTotalMins = shiftHour * 60 + shiftMinute;
    const nowTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const isLate = nowTotalMins > (shiftStartTotalMins + currentShift.gracePeriodMinutes);

    onCheckIn({
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      date: todayStr,
      checkInTime: checkInTimeStr,
      checkInLat: currentLat,
      checkInLng: currentLng,
      checkInDistanceMeters: distanceToOffice,
      checkInAddress: `Terverifikasi GPS (${formatDistance(distanceToOffice)} dari titik pusat kantor)`,
      status: isLate ? 'terlambat' : 'hadir',
      workDurationHours: 0,
      overtimeHours: 0,
      overtimePay: 0,
      isOvertimeApproved: false,
      notes: attendanceNotes || (isLate ? 'Presensi terlambat' : 'Presensi tepat waktu'),
    });

    setAttendanceNotes('');
  };

  const proceedCheckOut = () => {
    setShowCheckoutPrompt(false);
    if (!todayRecord) return;
    const checkOutTimeStr = currentTime.toTimeString().slice(0, 8);

    // Calculate actual work duration from checkInTime
    let durationHours = 8.0; // fallback
    if (todayRecord.checkInTime) {
      const [inH, inM] = todayRecord.checkInTime.split(':').map(Number);
      const [outH, outM] = checkOutTimeStr.split(':').map(Number);
      const totalInMins = inH * 60 + inM;
      const totalOutMins = outH * 60 + outM;
      durationHours = Math.max(0.1, Math.round(((totalOutMins - totalInMins) / 60) * 100) / 100);
    }

    // Determine overtime if worked duration > 8 hours or past shift endTime
    const [shiftEndH, shiftEndM] = currentShift.endTime.split(':').map(Number);
    const shiftEndTotalMins = shiftEndH * 60 + shiftEndM;
    const nowTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    let overtimeHours = 0;
    if (nowTotalMins > shiftEndTotalMins + config.minOvertimeMinutes) {
      overtimeHours = Math.round(((nowTotalMins - shiftEndTotalMins) / 60) * 10) / 10;
    }

    onCheckOut(todayRecord.id, {
      checkOutTime: checkOutTimeStr,
      checkOutLat: currentLat,
      checkOutLng: currentLng,
      checkOutDistanceMeters: distanceToOffice,
      checkOutAddress: `Terverifikasi GPS (${formatDistance(distanceToOffice)} dari kantor)`,
      workDurationHours: durationHours,
      overtimeHours,
      status: overtimeHours > 0 ? 'lembur' : todayRecord.status,
      notes: todayRecord.notes + (overtimeHours > 0 ? ` | Lembur tercatat: ${overtimeHours} jam` : ''),
    });
  };

  const handlePerformCheckOut = () => {
    if (!todayRecord) return;
    // If employee is required to report and has not submitted today's report
    if (employee.requiresWorkReport && !todayReport) {
      setShowCheckoutPrompt(true);
      return;
    }
    proceedCheckOut();
  };

  const myHistoryRecords = attendanceRecords
    .filter((r) => r.employeeId === employee.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Work Reports for this employee
  const myReports = workReports
    .filter((r) => r.employeeId === employee.id)
    .sort((a, b) => (b.date + b.submittedAt).localeCompare(a.date + a.submittedAt));
  const todayReport = myReports.find((r) => r.date === todayStr);

  const isSupervisorOrManager = 
    employee.position.toLowerCase().includes('supervisor') ||
    employee.position.toLowerCase().includes('manager') ||
    employee.position.toLowerCase().includes('lead') ||
    Boolean(employee.requiresWorkReport);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Greeting & Shift Notice Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Karyawan Aktif
            </span>
            {isSupervisorOrManager && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                {employee.position.toLowerCase().includes('manager') ? 'Peran: Manager Divisi' : employee.position.toLowerCase().includes('supervisor') ? 'Peran: Supervisor Lapangan' : 'Peran: Supervisi / Lead'}
              </span>
            )}
            <span className="text-xs text-slate-500">ID: {employee.id} • {employee.department}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Selamat Datang, {employee.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {currentTime.toLocaleTimeString('id-ID')} WIB
          </p>
        </div>

        {/* Current Shift Badge */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">{currentShift.name}</div>
            <div className="text-xs text-slate-600 font-medium">
              {currentShift.startTime} - {currentShift.endTime} WIB
            </div>
            <div className="text-[10px] text-amber-700">
              Toleransi Keterlambatan: {currentShift.gracePeriodMinutes} Menit
            </div>
          </div>
        </div>
      </div>

      {/* WORK REPORT STATUS CARD (Highlighted for Supervisor, Manager & Staff) */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
        todayReport
          ? 'bg-emerald-50/70 border-emerald-200'
          : employee.requiresWorkReport
          ? 'bg-amber-50/80 border-amber-300'
          : 'bg-indigo-50/60 border-indigo-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-xl shrink-0 ${
            todayReport 
              ? 'bg-emerald-600 text-white' 
              : employee.requiresWorkReport 
              ? 'bg-amber-500 text-white' 
              : 'bg-indigo-600 text-white'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900">
                {todayReport ? 'Laporan Pekerjaan Hari Ini Telah Diserahkan' : 'Laporan Pekerjaan Shift Hari Ini'}
              </h3>
              {employee.requiresWorkReport && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900">
                  Wajib Lapor (SOP Supervisi)
                </span>
              )}
              {todayReport && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  todayReport.status === 'reviewed' 
                    ? 'bg-emerald-200 text-emerald-900' 
                    : todayReport.status === 'needs_revision'
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-blue-100 text-blue-900'
                }`}>
                  {todayReport.status === 'reviewed' ? 'Disetujui HRD' : todayReport.status === 'needs_revision' ? 'Perlu Revisi' : 'Menunggu Review'}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {todayReport ? (
                <>
                  <strong className="text-slate-800">{todayReport.title}</strong> • Diserahkan pukul {todayReport.submittedAt} WIB ({todayReport.completionPercentage}% capaian target).
                  {todayReport.reviewFeedback && (
                    <span className="block text-emerald-800 mt-0.5 font-medium">
                      Feedback Manajemen: &ldquo;{todayReport.reviewFeedback}&rdquo;
                    </span>
                  )}
                </>
              ) : employee.requiresWorkReport ? (
                <>
                  Sebagai <strong className="text-amber-900">{employee.position}</strong>, Anda diwajibkan menyusun ringkasan output regu/divisi, kendala lapangan, dan rencana kerja esok hari.
                </>
              ) : (
                'Laporkan hasil pekerjaan, tugas yang selesai, kendala, atau rencana esok hari untuk transparansi kinerja Anda.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => {
              setEditingReport(todayReport);
              setIsWorkReportModalOpen(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              todayReport
                ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {todayReport ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{todayReport ? 'Edit / Lihat Laporan Hari Ini' : 'Tulis Laporan Pekerjaan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab(activePortalTab === 'work-reports' ? 'attendance' : 'work-reports')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition cursor-pointer"
          >
            {activePortalTab === 'work-reports' ? 'Kembali ke Presensi' : `Riwayat (${myReports.length})`}
          </button>
        </div>
      </div>

      {/* PORTAL TAB SWITCHER - RESPONSIVE */}
      <div className="space-y-2">
        {/* Mobile Dropdown Selector */}
        <div className="block sm:hidden bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 px-1">
            Menu Karyawan
          </label>
          <div className="relative">
            <select
              value={activePortalTab}
              onChange={(e) => setActivePortalTab(e.target.value as any)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm rounded-xl py-2.5 pl-3 pr-10 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="attendance">📍 Presensi GPS & Estimasi Gaji</option>
              <option value="performance">📈 Grafik & Rekomendasi Kinerja</option>
              <option value="work-reports">📝 Laporan Kerja ({myReports.length})</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>

        {/* Desktop / Tablet Segmented Tabs */}
        <div className="hidden sm:flex overflow-x-auto whitespace-nowrap scrollbar-none border border-slate-200/80 bg-white rounded-2xl p-1.5 shadow-sm gap-1.5">
          <button
            type="button"
            onClick={() => setActivePortalTab('attendance')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activePortalTab === 'attendance'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Presensi GPS & Gaji</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('performance')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activePortalTab === 'performance'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <span>Grafik & Rekomendasi Kinerja</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('work-reports')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activePortalTab === 'work-reports'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan Kerja</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activePortalTab === 'work-reports' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {myReports.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1 CONTENT: GPS CHECK-IN & SALARY ESTIMATOR */}
      {activePortalTab === 'attendance' && (
        <>

      {/* Main 2-Column Grid: GPS Check-in & Real-Time Salary Estimator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: GPS Check-in Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-base text-slate-900">Presensi GPS Check-In</h2>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                isInsideRadius 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {isInsideRadius ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Dalam Radius Kantor
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Di Luar Radius Kantor
                  </>
                )}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* GPS Geofence Visual Meter */}
              <div className="rounded-xl p-4 bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Jarak Aktual Anda ke Kantor</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatDistance(distanceToOffice)}
                  </span>
                </div>

                {/* Progress bar representing distance vs radius */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isInsideRadius ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, (distanceToOffice / (config.officeRadiusMeters * 3)) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Batas Geofence: {config.officeRadiusMeters} meter</span>
                  <span>Akurasi GPS: ±{Math.round(gpsAccuracy)}m</span>
                </div>

                {/* Office Target & Coordinates */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Koordinat Kantor:</span>
                    <span className="font-mono text-slate-200">{config.officeLat.toFixed(5)}, {config.officeLng.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Koordinat Anda:</span>
                    <span className="font-mono text-emerald-400">{currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
                  </div>
                </div>
              </div>

              {gpsError && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>{gpsError} Pastikan izin lokasi (Geolocation) diizinkan di peramban Anda.</span>
                </div>
              )}

              {/* GPS Detection Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isGettingLocation}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Navigation className={`w-4 h-4 text-emerald-600 ${isGettingLocation ? 'animate-spin' : ''}`} />
                  <span>{isGettingLocation ? 'Mencari Sinyal Satelit GPS...' : 'Segarkan Titik GPS Perangkat'}</span>
                </button>
              </div>

              {/* Selfie Snapshot / Photo Verifier */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-slate-500" />
                    Foto Verifikasi Presensi (Opsional)
                  </label>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    {photoPreview ? 'Ambil Ulang' : 'Ambil Foto Presensi'}
                  </button>
                </div>

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-200 bg-slate-900 flex items-center justify-center p-2">
                    <img src={photoPreview} alt="Selfie Presensi" className="max-h-36 rounded-lg object-contain" />
                    <span className="absolute bottom-3 left-3 bg-slate-950/80 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono">
                      Watermark GPS Valid
                    </span>
                  </div>
                ) : (
                  <div 
                    onClick={handleCapturePhoto}
                    className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-4 text-center text-slate-500 hover:bg-emerald-50/40 transition"
                  >
                    <Camera className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                    <span className="text-xs">Klik untuk mengambil foto presensi dengan watermark koordinat</span>
                  </div>
                )}
              </div>

              {/* Attendance Notes input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pekerjaan / Shift
                </label>
                <input
                  type="text"
                  value={attendanceNotes}
                  onChange={(e) => setAttendanceNotes(e.target.value)}
                  placeholder="Contoh: Bekerja di kantor tim IT, meeting pagi..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Check-In / Check-Out Actions */}
              <div className="pt-2">
                {!todayRecord ? (
                  <button
                    type="button"
                    onClick={handlePerformCheckIn}
                    disabled={!isInsideRadius}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-md ${
                      isInsideRadius
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/25 cursor-pointer'
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Check-In Sekarang ({currentTime.toLocaleTimeString('id-ID').slice(0, 5)})</span>
                  </button>
                ) : !todayRecord.checkOutTime ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold">Status: Sudah Check-In</span>
                        <div className="text-[11px] text-emerald-700">Pukul {todayRecord.checkInTime} WIB</div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px]">
                        Sedang Bekerja
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handlePerformCheckOut}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-indigo-700/25"
                    >
                      <Clock className="w-5 h-5" />
                      <span>Check-Out Pulang ({currentTime.toLocaleTimeString('id-ID').slice(0, 5)})</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center space-y-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 text-emerald-700">
                      <CheckCircle className="w-4 h-4" /> Presensi Hari Ini Selesai
                    </div>
                    <div className="text-xs text-slate-600">
                      Masuk: <span className="font-semibold">{todayRecord.checkInTime}</span> | Pulang: <span className="font-semibold">{todayRecord.checkOutTime}</span>
                    </div>
                    <div className="text-xs font-medium text-indigo-700">
                      Durasi Kerja: {todayRecord.workDurationHours} Jam {todayRecord.overtimeHours > 0 ? `(${todayRecord.overtimeHours} jam lembur)` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Transparent Salary Estimator & Slip (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                  <h2 className="font-bold text-base tracking-tight">Estimasi Gaji Real-Time</h2>
                </div>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Dihitung otomatis secara transparan berdasarkan presensi & durasi kerja aktual
                </p>
              </div>

              <button
                type="button"
                onClick={() => exportSingleEmployeeSlipPDF(employee, payrollSummary, attendanceRecords, config)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 shadow-sm transition shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                Unduh Slip Gaji (PDF)
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Big Take Home Pay Estimate Card */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>ESTIMASI TAKE HOME PAY BULAN INI</span>
                  <span className="text-emerald-400 font-medium">Transparan & Real-Time</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                  {formatIDR(payrollSummary.netSalary)}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>{cycleInfo.cutoffDateText}</span>
                  <span className="text-emerald-400 font-semibold">Tgl Gajian: {config.payrollDateDay} Setiap Bulan</span>
                </div>
              </div>

              {/* Transparent Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rincian Komponen Transparan
                </h3>

                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                  {/* Gaji Pokok */}
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <div className="font-semibold text-slate-900">Gaji Pokok (Monthly Base)</div>
                      <div className="text-[11px] text-slate-500">Sesuai kontrak kerja dan jabatan</div>
                    </div>
                    <div className="font-bold text-slate-800 font-mono text-sm">
                      {formatIDR(payrollSummary.baseSalary)}
                    </div>
                  </div>

                  {/* Tunjangan Tetap */}
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <div className="font-semibold text-slate-900">Tunjangan Tetap</div>
                      <div className="text-[11px] text-slate-500">Tunjangan jabatan & keahlian</div>
                    </div>
                    <div className="font-bold text-slate-800 font-mono text-sm">
                      {formatIDR(payrollSummary.allowance)}
                    </div>
                  </div>

                  {/* Uang Makan & Transport Harian */}
                  <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <div className="font-semibold text-slate-900">
                        Uang Makan & Transport ({payrollSummary.attendanceDays} Hari Hadir)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatIDR(employee.dailyTransport)} per hari presensi terverifikasi
                      </div>
                    </div>
                    <div className="font-bold text-emerald-700 font-mono text-sm">
                      +{formatIDR(payrollSummary.transportAllowance)}
                    </div>
                  </div>

                  {/* Uang Lembur Transparan */}
                  <div className="p-3 flex items-center justify-between bg-emerald-50/50 hover:bg-emerald-50 transition">
                    <div>
                      <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Uang Lembur Terkumpul ({payrollSummary.totalOvertimeHours} Jam)
                      </div>
                      <div className="text-[11px] text-emerald-800">
                        Rumus kelipatan perusahaan: Jam 1 (1.5x), Jam 2+ (2.0x) dari rate/jam
                      </div>
                    </div>
                    <div className="font-bold text-emerald-700 font-mono text-sm">
                      +{formatIDR(payrollSummary.totalOvertimePay)}
                    </div>
                  </div>

                  {/* Potongan Keterlambatan */}
                  {payrollSummary.lateDeduction > 0 && (
                    <div className="p-3 flex items-center justify-between bg-rose-50/50 hover:bg-rose-50 transition">
                      <div>
                        <div className="font-semibold text-rose-950">Potongan Keterlambatan</div>
                        <div className="text-[11px] text-rose-700">
                          Penalti Rp {config.latePenaltyPerMinute.toLocaleString('id-ID')}/menit melebihi grace period
                        </div>
                      </div>
                      <div className="font-bold text-rose-700 font-mono text-sm">
                        -{formatIDR(payrollSummary.lateDeduction)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Working Hours Metric Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Total Kehadiran</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {payrollSummary.attendanceDays} <span className="text-xs font-normal text-slate-500">Hari</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500">Durasi Kerja</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {payrollSummary.totalWorkHours} <span className="text-xs font-normal text-slate-500">Jam</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-medium">Total Lembur</div>
                  <div className="text-lg font-bold text-emerald-900 mt-0.5">
                    {payrollSummary.totalOvertimeHours} <span className="text-xs font-normal text-emerald-700">Jam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900">Riwayat Presensi & Catatan GPS Pribadi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Log kehadiran bulan berjalan beserta verifikasi jarak koordinat
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {myHistoryRecords.length} Catatan
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setHistoryViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  historyViewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryViewMode('card')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  historyViewMode === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Kartu Mobile"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card View Mode for Attendance History */}
        {historyViewMode === 'card' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {myHistoryRecords.map((rec) => (
              <div key={rec.id} className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-900">{rec.date}</span>
                    <div className="mt-0.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
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
                  </div>

                  {rec.checkInDistanceMeters !== undefined && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3" />
                      {rec.checkInDistanceMeters}m
                    </span>
                  )}
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

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Durasi Kerja:</span>
                  <span className="font-medium text-slate-900">{rec.workDurationHours > 0 ? `${rec.workDurationHours} Jam` : '-'}</span>
                </div>

                {rec.overtimeHours > 0 && (
                  <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 font-medium">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Lembur: {rec.overtimeHours} Jam
                    </span>
                    <span className="font-mono font-bold text-indigo-700">+{formatIDR(rec.overtimePay)}</span>
                  </div>
                )}

                {rec.notes && (
                  <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                    "{rec.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Table View Mode for Attendance History */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Jam Masuk</th>
                  <th className="py-3 px-4">Jam Pulang</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Lembur</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Validasi GPS</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {myHistoryRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{rec.date}</td>
                    <td className="py-3 px-4 font-mono">{rec.checkInTime || '-'}</td>
                    <td className="py-3 px-4 font-mono">{rec.checkOutTime || '-'}</td>
                    <td className="py-3 px-4">{rec.workDurationHours > 0 ? `${rec.workDurationHours} Jam` : '-'}</td>
                    <td className="py-3 px-4 font-medium text-emerald-700">
                      {rec.overtimeHours > 0 ? (
                        <span>{rec.overtimeHours} Jam (+{formatIDR(rec.overtimePay)})</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
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
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {rec.checkInDistanceMeters !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {rec.checkInDistanceMeters}m ke kantor
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={rec.notes}>
                      {rec.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )}

      {/* TAB: GRAFIK & REKOMENDASI KINERJA KARYAWAN */}
      {activePortalTab === 'performance' && (
        <EmployeePerformanceCharts
          employee={employee}
          shift={currentShift}
          attendanceRecords={attendanceRecords}
          workReports={workReports}
        />
      )}

      {/* TAB 3 CONTENT: WORK REPORTS MANAGEMENT */}
      {activePortalTab === 'work-reports' && (
        <div className="space-y-6">
          {/* Header & Quick Metric */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Manajemen Laporan Pekerjaan Harian</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Rekapitulasi pertanggungjawaban shift, koordinasi regu, kendala lapangan, dan rencana esok hari.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingReport(todayReport || undefined);
                setIsWorkReportModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{todayReport ? 'Edit Laporan Hari Ini' : 'Buat Laporan Pekerjaan'}</span>
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Total Laporan Dikirim</span>
              <span className="text-xl font-bold text-slate-900 mt-0.5 block">{myReports.length}</span>
              <span className="text-[11px] text-slate-400">Arsip riwayat kerja</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Rata-Rata Capaian Target</span>
              <span className="text-xl font-bold text-indigo-600 mt-0.5 block">
                {myReports.length > 0 
                  ? `${Math.round(myReports.reduce((acc, curr) => acc + (curr.completionPercentage || 0), 0) / myReports.length)}%` 
                  : '-'}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">Tingkat efektivitas shift</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 block">Laporan Telah Direview HRD</span>
              <span className="text-xl font-bold text-emerald-700 mt-0.5 block">
                {myReports.filter((r) => r.status === 'reviewed').length}
              </span>
              <span className="text-[11px] text-slate-400">Terverifikasi manajemen</span>
            </div>
          </div>

          {/* List of Reports */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                Riwayat Laporan Pekerjaan ({myReports.length})
              </h4>
            </div>

            {myReports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-800">Belum Ada Laporan Pekerjaan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Anda belum pernah membuat laporan kerja. Klik tombol di atas untuk mengirimkan laporan pekerjaan pertama Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setIsWorkReportModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Tulis Laporan Sekarang
                </button>
              </div>
            ) : (
              myReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition"
                >
                  {/* Report Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{report.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          report.status === 'reviewed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : report.status === 'needs_revision'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {report.status === 'reviewed' ? 'Disetujui HRD' : report.status === 'needs_revision' ? 'Perlu Revisi' : 'Menunggu Review'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tanggal: <strong className="text-slate-800">{report.date}</strong> • Pukul {report.submittedAt} WIB
                        {report.shiftName && ` • ${report.shiftName}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-indigo-700">{report.completionPercentage}% Selesai</div>
                        <div className="text-[10px] text-slate-400">{report.hoursSpent || 8} Jam Kerja</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingReport(report);
                          setIsWorkReportModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                        title="Edit / Lihat Lengkap"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks Completed Content */}
                  <div className="text-xs space-y-1.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pekerjaan yang Telah Diselesaikan:
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-line leading-relaxed">
                      {report.tasksCompleted}
                    </div>
                  </div>

                  {/* 2 Grid: In-Progress & Issues */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {report.inProgressTasks && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="font-bold text-slate-700 mb-0.5">Pekerjaan Sedang Berjalan:</div>
                        <div className="text-slate-600 whitespace-pre-line">{report.inProgressTasks}</div>
                      </div>
                    )}

                    {report.issuesOrBlockers && (
                      <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                        <div className="font-bold text-rose-900 mb-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Kendala / Hambatan Lapangan:
                        </div>
                        <div className="text-slate-700 whitespace-pre-line">{report.issuesOrBlockers}</div>
                      </div>
                    )}
                  </div>

                  {/* Next Day Plan */}
                  {report.nextDayPlan && (
                    <div className="text-xs p-3 rounded-xl bg-indigo-50/40 border border-indigo-100">
                      <div className="font-bold text-indigo-950 mb-0.5">Rencana Kerja Esok Hari:</div>
                      <div className="text-slate-700">{report.nextDayPlan}</div>
                    </div>
                  )}

                  {/* HRD Feedback Section if reviewed */}
                  {report.reviewFeedback && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-700" />
                        Catatan Evaluasi & Feedback Manajemen:
                      </div>
                      <div className="italic text-slate-800 leading-relaxed pl-5">
                        &ldquo;{report.reviewFeedback}&rdquo;
                      </div>
                      {report.reviewedBy && (
                        <div className="text-[10px] text-emerald-700 text-right">
                          Direview oleh {report.reviewedBy} ({report.reviewedAt})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* WORK REPORT SUBMISSION / EDIT MODAL */}
      {isWorkReportModalOpen && (
        <WorkReportModal
          isOpen={isWorkReportModalOpen}
          onClose={() => {
            setIsWorkReportModalOpen(false);
            setEditingReport(undefined);
          }}
          employee={employee}
          shift={currentShift}
          existingReport={editingReport}
          onSubmitReport={(reportData) => {
            if (onSubmitWorkReport) {
              onSubmitWorkReport(reportData);
            }
          }}
        />
      )}

      {/* CHECKOUT PROMPT DIALOG FOR SUPERVISORS/MANAGERS WITHOUT TODAY'S REPORT */}
      {showCheckoutPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Pengingat Laporan Kerja Shift</h3>
                <span className="text-xs font-semibold text-amber-700">Peran: {employee.position}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sebagai <strong>{employee.position}</strong> ({employee.department}), Anda memiliki kewajiban mengisi <strong>Laporan Pekerjaan Harian</strong> untuk shift hari ini.
              <br /><br />
              Apakah Anda ingin mengisi ringkasan laporan sekarang sebelum menyelesaikan check-out?
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={proceedCheckOut}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Tetap Lanjutkan Check-Out
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCheckoutPrompt(false);
                  setIsWorkReportModalOpen(true);
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <FileText className="w-4 h-4" />
                <span>Isi Laporan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Portal Watermark Note */}
      <div className="py-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Portal Karyawan Terverifikasi • Dibuat oleh <strong className="text-emerald-700 font-semibold">heruhendri</strong></span>
        </div>
      </div>
    </div>
  );
};
