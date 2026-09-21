import React, { useState, useEffect, useRef } from 'react';
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
  LayoutGrid,
  Compass,
  ShieldAlert,
  Lock,
  RotateCw,
  Maximize2,
  Trash2,
  Upload,
  Check,
  X,
  Eye
} from 'lucide-react';
import { AttendanceRecord, CompanyConfig, Employee, Shift, WorkReport, TemporaryLocationAssignment } from '../types';
import { 
  calculateDistanceMeters, 
  formatDistance, 
  getCurrentCoordinates,
  getGpsAccuracyLevel,
  getOffsetCoordinates
} from '../utils/geo';
import { computeEmployeePayroll, formatIDR, getPayrollCycleInfo } from '../utils/payroll';
import { exportSingleEmployeeSlipPDF, PAYSLIP_TEMPLATES, PayslipTemplateId } from '../utils/exportPdf';
import { WorkReportModal } from './WorkReportModal';
import { EmployeePerformanceCharts } from './EmployeePerformanceCharts';
import { AttendanceMapsDashboard } from './AttendanceMapsDashboard';
import { CameraVerificationModal } from './CameraVerificationModal';
import { drawGpsWatermark, GpsWatermarkData } from '../utils/cameraWatermark';

interface EmployeePortalProps {
  employee: Employee;
  shifts: Shift[];
  config: CompanyConfig;
  attendanceRecords: AttendanceRecord[];
  workReports?: WorkReport[];
  assignments?: TemporaryLocationAssignment[];
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
  assignments = [],
  onSubmitWorkReport,
  onCheckIn,
  onCheckOut,
}) => {
  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Portal Tab state
  const [activePortalTab, setActivePortalTab] = useState<'attendance' | 'performance' | 'work-reports' | 'gps-map'>('attendance');
  const [historyViewMode, setHistoryViewMode] = useState<'card' | 'table'>('table');
  const [isWorkReportModalOpen, setIsWorkReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<WorkReport | undefined>(undefined);
  const [showCheckoutPrompt, setShowCheckoutPrompt] = useState(false);

  // GPS State & Precision Validation
  const [currentLat, setCurrentLat] = useState<number>(config.officeLat);
  const [currentLng, setCurrentLng] = useState<number>(config.officeLng);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(8);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isVerifyingBeforeAction, setIsVerifyingBeforeAction] = useState<'checkin' | 'checkout' | null>(null);
  const [lastLocationCheckTime, setLastLocationCheckTime] = useState<Date | null>(null);
  const [autoGpsStatus, setAutoGpsStatus] = useState<'verified' | 'checking' | 'error' | 'idle'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSourceMode, setGpsSourceMode] = useState<'device' | 'preset'>('device');
  const [activeLocationPreset, setActiveLocationPreset] = useState<string>('device_real');
  const [showDiagnosticTools, setShowDiagnosticTools] = useState(false);
  const [selectedSlipTemplate, setSelectedSlipTemplate] = useState<PayslipTemplateId>('corporate-emerald');

  // Geofence Radius Out-of-bounds Alert Modal
  const [radiusAlertModalOpen, setRadiusAlertModalOpen] = useState(false);
  const [radiusAlertData, setRadiusAlertData] = useState<{
    distance: number;
    allowedRadius: number;
    excess: number;
    accuracy: number;
  } | null>(null);
  const [checkInSuccessBanner, setCheckInSuccessBanner] = useState<string | null>(null);

  // Checkin Form notes
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [previewZoomPhoto, setPreviewZoomPhoto] = useState<string | null>(null);
  const directFileInputRef = useRef<HTMLInputElement>(null);

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Automatic real location check on portal mount - MUST use real device GPS sensor
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setAutoGpsStatus('checking');
      getCurrentCoordinates({ enableHighAccuracy: true, timeout: 8000 })
        .then((coords) => {
          setCurrentLat(coords.lat);
          setCurrentLng(coords.lng);
          setGpsAccuracy(coords.accuracy);
          setGpsSourceMode('device');
          setActiveLocationPreset('device_real');
          setLastLocationCheckTime(new Date());
          setAutoGpsStatus('verified');
        })
        .catch((err: any) => {
          // Never fall back to simulated office center; real hardware sensor status is required
          setGpsSourceMode('device');
          setActiveLocationPreset('device_real');
          setAutoGpsStatus('error');
          setGpsError(err.message || 'Izin akses lokasi (GPS) belum aktif. Aktifkan GPS pada perangkat untuk presensi.');
          setLastLocationCheckTime(new Date());
        });
    } else {
      setGpsSourceMode('device');
      setActiveLocationPreset('device_real');
      setAutoGpsStatus('error');
      setGpsError('Browser perangkat tidak mendukung Geolocation GPS.');
      setLastLocationCheckTime(new Date());
    }
  }, []);

  // Find employee's assigned shift
  const currentShift = shifts.find((s) => s.id === employee.currentShiftId) || shifts[0];

  // Today's date string YYYY-MM-DD
  const todayStr = currentTime.toISOString().slice(0, 10);

  // Today's attendance record for this employee
  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === employee.id && r.date === todayStr
  );

  // Active temporary out-of-town / project duty assignment check for today
  const activeDuty = assignments?.find(
    (a) =>
      a.employeeId === employee.id &&
      a.status === 'active' &&
      todayStr >= a.startDate &&
      todayStr <= a.endDate
  );

  // Target coordinates and allowed radius based on active duty assignment or primary office
  const targetLat = activeDuty ? activeDuty.lat : config.officeLat;
  const targetLng = activeDuty ? activeDuty.lng : config.officeLng;
  const targetRadiusMeters = activeDuty ? activeDuty.radiusMeters : config.officeRadiusMeters;
  const targetLocationTitle = activeDuty
    ? `Penugasan Luar Kota: ${activeDuty.title} (${activeDuty.locationName}, ${activeDuty.city})`
    : config.companyName;

  // Calculate Distance to designated Target location
  const distanceToOffice = calculateDistanceMeters(
    currentLat,
    currentLng,
    targetLat,
    targetLng
  );
  const isInsideRadius = distanceToOffice <= targetRadiusMeters;

  // Real-time payroll calculation for this employee
  const payrollSummary = computeEmployeePayroll(employee, attendanceRecords, config, todayStr);
  const cycleInfo = getPayrollCycleInfo(config);

  // Mandatory automatic location check before check-in or check-out to ensure coordinate accuracy
  // STRICT RULE: Attendance MUST ALWAYS use real hardware sensor. Simulated presets are strictly disallowed for check-in / check-out.
  const verifyLocationAccurately = async (): Promise<{
    lat: number;
    lng: number;
    accuracy: number;
    distance: number;
    isInside: boolean;
    isRealSensor: boolean;
  }> => {
    setIsGettingLocation(true);
    setAutoGpsStatus('checking');
    setGpsError(null);

    let lat = currentLat;
    let lng = currentLng;
    let accuracy = gpsAccuracy;

    try {
      // Always query fresh hardware satellite coordinates for attendance
      const fresh = await getCurrentCoordinates({ enableHighAccuracy: true, timeout: 10000 });
      lat = fresh.lat;
      lng = fresh.lng;
      accuracy = fresh.accuracy;
      setCurrentLat(lat);
      setCurrentLng(lng);
      setGpsAccuracy(accuracy);
      setGpsSourceMode('device');
      setActiveLocationPreset('device_real');

      const distance = calculateDistanceMeters(lat, lng, targetLat, targetLng);
      const isInside = distance <= targetRadiusMeters;
      setLastLocationCheckTime(new Date());
      setAutoGpsStatus('verified');
      return { lat, lng, accuracy, distance, isInside, isRealSensor: true };
    } catch (err: any) {
      setAutoGpsStatus('error');
      const msg = err.message || 'Gagal membaca sensor GPS perangkat asli. Izin lokasi (GPS) diperlukan untuk presensi.';
      setGpsError(msg);
      const distance = calculateDistanceMeters(lat, lng, targetLat, targetLng);
      // When real sensor fails, attendance is STRICTLY disallowed
      return { lat, lng, accuracy, distance, isInside: false, isRealSensor: false };
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Fetch Real GPS coordinates from device with high-accuracy satellite signal
  const handleDetectGPS = async () => {
    setIsGettingLocation(true);
    setAutoGpsStatus('checking');
    setGpsError(null);
    setCheckInSuccessBanner(null);
    try {
      const coords = await getCurrentCoordinates({ enableHighAccuracy: true, timeout: 10000 });
      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);
      setGpsAccuracy(coords.accuracy);
      setGpsSourceMode('device');
      setActiveLocationPreset('device_real');
      setLastLocationCheckTime(new Date());
      setAutoGpsStatus('verified');
    } catch (err: any) {
      setAutoGpsStatus('error');
      setGpsError(err.message || 'Gagal mendeteksi koordinat GPS. Pastikan izin lokasi diberikan.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Switch location presets for demonstration / testing accuracy
  const handleSelectLocationPreset = (presetKey: string) => {
    setActiveLocationPreset(presetKey);
    setGpsError(null);
    setCheckInSuccessBanner(null);

    if (presetKey === 'device_real') {
      handleDetectGPS();
      return;
    }

    setGpsSourceMode('preset');
    setLastLocationCheckTime(new Date());
    setAutoGpsStatus('verified');

    switch (presetKey) {
      case 'office_center':
      case 'duty_center':
      case 'assigned_duty':
        // Exactly at designated target coordinates (distance = 0m, 100% inside)
        setCurrentLat(targetLat);
        setCurrentLng(targetLng);
        setGpsAccuracy(5);
        break;

      case 'lobby':
      case 'duty_lobby': {
        // ~15m from target (well inside standard 50m radius)
        const offsetDist = Math.min(15, Math.max(5, Math.round(targetRadiusMeters * 0.3)));
        const coords = getOffsetCoordinates(targetLat, targetLng, offsetDist, 45);
        setCurrentLat(coords.lat);
        setCurrentLng(coords.lng);
        setGpsAccuracy(8);
        break;
      }

      case 'parking':
      case 'duty_perimeter': {
        // ~35m or 70% of radius (still safely inside)
        const offsetDist = Math.min(38, Math.max(10, Math.round(targetRadiusMeters * 0.7)));
        const coords = getOffsetCoordinates(targetLat, targetLng, offsetDist, 120);
        setCurrentLat(coords.lat);
        setCurrentLng(coords.lng);
        setGpsAccuracy(12);
        break;
      }

      case 'outside_close':
      case 'outside_duty': {
        // Strictly outside radius (+35m beyond targetRadiusMeters) -> DITOLAK
        const offsetDist = targetRadiusMeters + 35;
        const coords = getOffsetCoordinates(targetLat, targetLng, offsetDist, 90);
        setCurrentLat(coords.lat);
        setCurrentLng(coords.lng);
        setGpsAccuracy(16);
        break;
      }

      case 'outside_far': {
        // ~2.5 km away (completely outside -> DITOLAK)
        const coords = getOffsetCoordinates(targetLat, targetLng, 2500, 210);
        setCurrentLat(coords.lat);
        setCurrentLng(coords.lng);
        setGpsAccuracy(35);
        break;
      }

      case 'outside_city': {
        // ~45 km away (out of town / different area -> DITOLAK)
        const coords = getOffsetCoordinates(targetLat, targetLng, 45000, 315);
        setCurrentLat(coords.lat);
        setCurrentLng(coords.lng);
        setGpsAccuracy(55);
        break;
      }

      case 'weak_signal': {
        // Low accuracy signal & outside radius (+85m) -> DITOLAK
        const offsetDist = targetRadiusMeters + 85;
        const coords = getOffsetCoordinates(targetLat, targetLng, offsetDist, 180);
        setCurrentLat(coords.lat);
        setCurrentLng(coords.lng);
        setGpsAccuracy(120);
        break;
      }

      default:
        setCurrentLat(targetLat);
        setCurrentLng(targetLng);
        setGpsAccuracy(8);
    }
  };

  // Prepare GPS Watermark payload
  const getWatermarkPayload = (): GpsWatermarkData => ({
    lat: currentLat,
    lng: currentLng,
    accuracy: gpsAccuracy,
    distanceToOffice: distanceToOffice,
    officeRadius: targetRadiusMeters,
    employeeName: employee.name,
    employeeId: employee.id,
    department: employee.department,
    companyName: config.companyName,
    appName: config.appName,
    timestamp: currentTime,
    statusLabel: isInsideRadius ? 'TERVERIFIKASI RADIUS KANTOR' : (activeDuty ? 'TERVERIFIKASI TUGAS DINAS' : 'DI LUAR RADIUS RESMI'),
  });

  // Handle Photo Capture using live camera modal
  const handleCapturePhoto = () => {
    setIsCameraModalOpen(true);
  };

  // Handle direct file upload / gallery fallback with GPS coordinate watermark
  const handleDirectPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        try {
          const watermarked = drawGpsWatermark(img, getWatermarkPayload());
          setPhotoPreview(watermarked);
        } catch (err) {
          console.error('Failed to watermark uploaded photo:', err);
          alert('Gagal menyematkan koordinat ke foto.');
        }
      };
      img.onerror = () => {
        alert('Berkas foto tidak valid.');
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers change
    e.target.value = '';
  };

  // Check-In verification with automatic real location verification
  const handlePerformCheckIn = async () => {
    // 0. Simulation Lock: Presensi DILARANG menggunakan titik simulasi/preset
    if (activeLocationPreset !== 'device_real') {
      setGpsError('Presensi Ditolak: Anda sedang berada dalam mode simulasi uji radar. Presensi resmi WAJIB menggunakan Sensor GPS Asli dari hardware perangkat Anda.');
      setRadiusAlertData({
        distance: distanceToOffice,
        allowedRadius: targetRadiusMeters,
        excess: Math.max(1, distanceToOffice - targetRadiusMeters),
        accuracy: gpsAccuracy,
      });
      setRadiusAlertModalOpen(true);
      return;
    }

    // 1. Strict Geofence Pre-Check: immediately block if outside radius
    if (!isInsideRadius) {
      const excess = Math.max(1, distanceToOffice - targetRadiusMeters);
      setRadiusAlertData({
        distance: distanceToOffice,
        allowedRadius: targetRadiusMeters,
        excess,
        accuracy: gpsAccuracy,
      });
      setRadiusAlertModalOpen(true);
      return;
    }

    setIsVerifyingBeforeAction('checkin');
    setCheckInSuccessBanner(null);

    // Mandatory automatic real hardware sensor check before check-in to ensure coordinate accuracy
    const locResult = await verifyLocationAccurately();
    setIsVerifyingBeforeAction(null);

    // CRITICAL: Block if real hardware sensor was not acquired
    if (!locResult.isRealSensor) {
      setGpsError('Gagal memverifikasi sensor GPS perangkat asli. Aktifkan GPS dan berikan izin lokasi pada browser Anda untuk check-in.');
      return;
    }

    // CRITICAL: Strict Geofence Enforcement for Check-In
    if (!locResult.isInside) {
      const excess = Math.max(1, locResult.distance - targetRadiusMeters);
      setRadiusAlertData({
        distance: locResult.distance,
        allowedRadius: targetRadiusMeters,
        excess,
        accuracy: locResult.accuracy,
      });
      setRadiusAlertModalOpen(true);
      return;
    }

    const checkInTimeStr = currentTime.toTimeString().slice(0, 8);
    
    // Check if late based on shift startTime + gracePeriodMinutes
    const [shiftHour, shiftMinute] = currentShift.startTime.split(':').map(Number);
    const shiftStartTotalMins = shiftHour * 60 + shiftMinute;
    const nowTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const isLate = nowTotalMins > (shiftStartTotalMins + currentShift.gracePeriodMinutes);

    const isDuty = !!activeDuty;
    const locLabel = isDuty ? `Penugasan Luar Kota (${activeDuty.city})` : 'Kantor';

    onCheckIn({
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      date: todayStr,
      checkInTime: checkInTimeStr,
      checkInLat: locResult.lat,
      checkInLng: locResult.lng,
      checkInDistanceMeters: locResult.distance,
      isRemoteOrOutIsland: isDuty,
      remoteReasonType: isDuty ? 'dinas_luar_kota' : undefined,
      checkInAddress: isDuty
        ? `Terverifikasi Titik Tugas Khusus: ${activeDuty.title} di ${activeDuty.city} (${formatDistance(locResult.distance)} dari koordinat, Akurasi ±${Math.round(locResult.accuracy)}m)`
        : `Terverifikasi GPS Otomatis (${formatDistance(locResult.distance)} dari titik pusat kantor, Akurasi ±${Math.round(locResult.accuracy)}m)`,
      status: isLate ? 'terlambat' : 'hadir',
      workDurationHours: 0,
      overtimeHours: 0,
      overtimePay: 0,
      isOvertimeApproved: false,
      notes: attendanceNotes || (isDuty ? `[Penugasan Khusus: ${activeDuty.city} - ${activeDuty.title}] ${isLate ? 'Presensi terlambat' : 'Presensi tepat waktu'}` : (isLate ? 'Presensi terlambat' : 'Presensi tepat waktu terverifikasi')),
      verificationPhoto: photoPreview || undefined,
    });

    setCheckInSuccessBanner(
      `Check-in berhasil tercatat! Lokasi GPS otomatis terkunci: Lat ${locResult.lat.toFixed(6)}, Lng ${locResult.lng.toFixed(6)} (${formatDistance(locResult.distance)} dari ${locLabel}, Akurasi: ±${Math.round(locResult.accuracy)}m).`
    );
    setAttendanceNotes('');
    setPhotoPreview(null);
  };

  const proceedCheckOut = async () => {
    setShowCheckoutPrompt(false);
    if (!todayRecord) return;

    // 0. Simulation Lock: Check-Out DILARANG menggunakan titik simulasi/preset
    if (activeLocationPreset !== 'device_real') {
      setGpsError('Check-Out Ditolak: Anda sedang berada dalam mode simulasi uji radar. Presensi resmi WAJIB menggunakan Sensor GPS Asli dari hardware perangkat Anda.');
      setRadiusAlertData({
        distance: distanceToOffice,
        allowedRadius: targetRadiusMeters,
        excess: Math.max(1, distanceToOffice - targetRadiusMeters),
        accuracy: gpsAccuracy,
      });
      setRadiusAlertModalOpen(true);
      return;
    }

    // Strict Geofence Pre-Check: immediately block if outside radius
    if (!isInsideRadius) {
      const excess = Math.max(1, distanceToOffice - targetRadiusMeters);
      setRadiusAlertData({
        distance: distanceToOffice,
        allowedRadius: targetRadiusMeters,
        excess,
        accuracy: gpsAccuracy,
      });
      setRadiusAlertModalOpen(true);
      return;
    }

    setIsVerifyingBeforeAction('checkout');
    // Mandatory automatic location check before check-out using real hardware sensor
    const locResult = await verifyLocationAccurately();
    setIsVerifyingBeforeAction(null);

    // CRITICAL: Block if real hardware sensor was not acquired
    if (!locResult.isRealSensor) {
      setGpsError('Gagal memverifikasi sensor GPS perangkat asli. Aktifkan GPS dan berikan izin lokasi pada browser Anda untuk check-out.');
      return;
    }

    // CRITICAL: Strict Geofence Enforcement for Check-Out
    if (!locResult.isInside) {
      const excess = Math.max(1, locResult.distance - targetRadiusMeters);
      setRadiusAlertData({
        distance: locResult.distance,
        allowedRadius: targetRadiusMeters,
        excess,
        accuracy: locResult.accuracy,
      });
      setRadiusAlertModalOpen(true);
      return;
    }

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

    const isDuty = !!activeDuty;
    const locLabel = isDuty ? `Penugasan Luar Kota (${activeDuty.city})` : 'Kantor';

    onCheckOut(todayRecord.id, {
      checkOutTime: checkOutTimeStr,
      checkOutLat: locResult.lat,
      checkOutLng: locResult.lng,
      checkOutDistanceMeters: locResult.distance,
      checkOutAddress: isDuty
        ? `Terverifikasi Titik Tugas Pulang: ${activeDuty.city} (${formatDistance(locResult.distance)} dari koordinat, Akurasi ±${Math.round(locResult.accuracy)}m)`
        : `Terverifikasi GPS Otomatis Pulang (${formatDistance(locResult.distance)} dari kantor, Akurasi ±${Math.round(locResult.accuracy)}m)`,
      workDurationHours: durationHours,
      overtimeHours,
      status: overtimeHours > 0 ? 'lembur' : todayRecord.status,
      notes: todayRecord.notes + (overtimeHours > 0 ? ` | Lembur tercatat: ${overtimeHours} jam` : ''),
    });

    setCheckInSuccessBanner(
      `Check-out berhasil diverifikasi! Lokasi kepulangan otomatis terkunci: Lat ${locResult.lat.toFixed(6)}, Lng ${locResult.lng.toFixed(6)} (${formatDistance(locResult.distance)} dari ${locLabel}, Durasi Kerja: ${durationHours} Jam).`
    );
  };

  const handlePerformCheckOut = () => {
    if (!todayRecord) return;

    // Strict Geofence Pre-Check: immediately block if outside radius
    if (!isInsideRadius) {
      const excess = Math.max(1, distanceToOffice - targetRadiusMeters);
      setRadiusAlertData({
        distance: distanceToOffice,
        allowedRadius: targetRadiusMeters,
        excess,
        accuracy: gpsAccuracy,
      });
      setRadiusAlertModalOpen(true);
      return;
    }

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
              <option value="gps-map">🗺️ Peta Lokasi Presensi GPS</option>
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
            onClick={() => setActivePortalTab('gps-map')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activePortalTab === 'gps-map'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Peta Lokasi GPS</span>
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
          {/* Active Temporary Out-of-Town Assignment Banner */}
          {activeDuty && (
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-400 text-purple-950 tracking-wider uppercase">
                      Penugasan Luar Kota Aktif
                    </span>
                    <span className="text-xs font-bold text-purple-200">
                      📍 {activeDuty.city}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    {activeDuty.title}
                  </h3>
                  <p className="text-xs text-purple-200/90 mt-0.5">
                    Lokasi: <span className="font-semibold text-white">{activeDuty.locationName}</span> • Toleransi Radius: <strong className="text-emerald-400 font-mono">{activeDuty.radiusMeters} meter</strong>.
                  </p>
                  <p className="text-[11px] text-purple-300/80 mt-1">
                    Periode Berlaku: {activeDuty.startDate} s/d {activeDuty.endDate}. Catatan: {activeDuty.notes || 'Penugasan khusus proyek resmi'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentLat(activeDuty.lat);
                    setCurrentLng(activeDuty.lng);
                    setGpsAccuracy(8);
                    setActiveLocationPreset('assigned_duty');
                    setGpsSourceMode('preset');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-purple-950 font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Kunci Titik Penugasan</span>
                </button>
              </div>
            </div>
          )}

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
                    <ShieldCheck className="w-3.5 h-3.5" /> Dalam Radius {activeDuty ? 'Penugasan' : 'Kantor'}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" /> Di Luar Radius {activeDuty ? 'Penugasan' : 'Kantor'}
                  </>
                )}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Check-In Success Banner */}
              {checkInSuccessBanner && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold">Presensi Berhasil Diverifikasi</div>
                    <p className="text-[11px] text-emerald-700 mt-0.5">{checkInSuccessBanner}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckInSuccessBanner(null)}
                    className="text-emerald-500 hover:text-emerald-800 text-xs cursor-pointer font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Status Pengecekan Lokasi Otomatis */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation className={`w-4 h-4 ${isGettingLocation ? 'text-amber-500 animate-spin' : 'text-emerald-600'}`} />
                    Pengecekan Lokasi GPS Otomatis
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    autoGpsStatus === 'checking'
                      ? 'bg-amber-100 text-amber-800'
                      : autoGpsStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      autoGpsStatus === 'checking'
                        ? 'bg-amber-500 animate-ping'
                        : autoGpsStatus === 'verified'
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`} />
                    {autoGpsStatus === 'checking'
                      ? 'Mengunci Koordinat...'
                      : autoGpsStatus === 'verified'
                      ? 'Lokasi Terkunci Akurat'
                      : 'Perlu Cek Ulang'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Koordinat Anda:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tingkat Presisi GPS:</span>
                    <span className="font-semibold text-emerald-700">
                      ±{Math.round(gpsAccuracy)} meter ({getGpsAccuracyLevel(gpsAccuracy).label})
                    </span>
                  </div>
                  {lastLocationCheckTime && (
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Terakhir Diperiksa:</span>
                      <span>{lastLocationCheckTime.toLocaleTimeString('id-ID')} WIB</span>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isGettingLocation}
                    className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Compass className={`w-3.5 h-3.5 text-emerald-600 ${isGettingLocation ? 'animate-spin' : ''}`} />
                    <span>{isGettingLocation ? 'Memeriksa Satelit GPS...' : 'Cek Ulang Lokasi GPS Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Location Mode & Signal Quality Selector */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    Sumber & Uji Sinyal GPS
                  </span>
                  {(() => {
                    const accInfo = getGpsAccuracyLevel(gpsAccuracy);
                    return (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        accInfo.level === 'high'
                          ? 'bg-emerald-100 text-emerald-800'
                          : accInfo.level === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          accInfo.level === 'high' ? 'bg-emerald-500 animate-pulse' : accInfo.level === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {accInfo.label} (±{Math.round(gpsAccuracy)}m)
                      </span>
                    );
                  })()}
                </div>

                {/* Live Geofence Status Badge */}
                <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                  isInsideRadius
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {isInsideRadius ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        {isInsideRadius ? 'Status Geofence: DALAM RADIUS' : 'Status Geofence: DI LUAR RADIUS'}
                      </span>
                      <div className="text-[11px] opacity-90 font-normal">
                        {isInsideRadius
                          ? `Jarak ${formatDistance(distanceToOffice)} ≤ ${targetRadiusMeters}m (Check-In & Check-Out Diizinkan)`
                          : `Jarak ${formatDistance(distanceToOffice)} > ${targetRadiusMeters}m (Check-In & Check-Out Terkunci)`}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    isInsideRadius ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {isInsideRadius ? 'Bisa Presensi' : 'Terkunci'}
                  </span>
                </div>

                {/* Primary Hardware Sensor Status */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span>Sensor GPS Perangkat Asli</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      activeLocationPreset === 'device_real'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {activeLocationPreset === 'device_real' ? '🛰️ Sensor Asli Aktif' : '⚠️ Mode Simulasi (Absen Terkunci)'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Koordinat Saat Ini:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Akurasi Sinyal Satelit:</span>
                      <span className="font-semibold text-emerald-700">
                        ±{Math.round(gpsAccuracy)} meter ({getGpsAccuracyLevel(gpsAccuracy).label})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jarak ke Titik Resmi:</span>
                      <span className={`font-bold ${isInsideRadius ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatDistance(distanceToOffice)} (Batas: {targetRadiusMeters}m)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectLocationPreset('device_real')}
                      disabled={isGettingLocation}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      <Compass className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin' : ''}`} />
                      <span>{isGettingLocation ? 'Membaca Satelit GPS...' : 'Segarkan Sensor GPS Asli'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiagnosticTools(!showDiagnosticTools)}
                      className="py-2 px-2.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Buka Alat Uji Diagnostik Visual Radar"
                    >
                      <Navigation className="w-3.5 h-3.5 text-slate-600" />
                      <span>{showDiagnosticTools ? 'Tutup Uji' : 'Uji Visual'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Diagnostic Simulation Section (Strictly preview only - Attendance Locked) */}
                {showDiagnosticTools && (
                  <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2.5 animate-fadeIn">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Simulasi Diagnostik Visual Geofence</span>
                        </div>
                        <p className="text-[10px] text-amber-800 mt-0.5">
                          Hanya untuk menguji respons radar visual. <strong>Presensi (Check-In & Check-Out) otomatis terkunci</strong> saat mode simulasi aktif.
                        </p>
                      </div>
                      {activeLocationPreset !== 'device_real' && (
                        <button
                          type="button"
                          onClick={() => handleSelectLocationPreset('device_real')}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold shrink-0 transition"
                        >
                          Beralih ke Sensor Asli
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wide">
                        Pilih Titik Uji Radar (Simulasi Tampilan):
                      </label>
                      <select
                        value={activeLocationPreset}
                        onChange={(e) => handleSelectLocationPreset(e.target.value)}
                        className="w-full text-xs bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                      >
                        <option value="device_real">🛰️ Sensor GPS Perangkat Asli (Hardware Satelit — Valid untuk Absen)</option>
                        {activeDuty ? (
                          <>
                            <option value="outside_duty">⛔ Uji Luar Radius Tugas (+35m • Terkunci ❌)</option>
                            <option value="outside_far">🚗 Uji Jarak Jauh (~2.5 km • Terkunci ❌)</option>
                            <option value="outside_city">✈️ Uji Luar Kota (~45 km • Terkunci ❌)</option>
                            <option value="weak_signal">⚠️ Uji Sinyal Lemah (Akurasi ±120m • Terkunci ❌)</option>
                          </>
                        ) : (
                          <>
                            <option value="outside_close">⛔ Uji Luar Radius Dekat (+35m • Jarak ~{targetRadiusMeters + 35}m • Terkunci ❌)</option>
                            <option value="outside_far">🚗 Uji Jarak Jauh / Beda Kelurahan (~2.5 km • Terkunci ❌)</option>
                            <option value="outside_city">✈️ Uji Luar Kota / Beda Daerah (~45 km • Terkunci ❌)</option>
                            <option value="weak_signal">⚠️ Uji Sinyal Lemah & Di Luar Radius (Akurasi ±120m • Terkunci ❌)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {activeLocationPreset !== 'device_real' && (
                      <div className="p-2 bg-amber-100/90 rounded-lg border border-amber-300 text-[11px] text-amber-950 font-medium flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Mode simulasi aktif: <strong>Tombol presensi terkunci</strong>. Wajib kembalikan ke sensor asli untuk absen.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectLocationPreset('device_real')}
                          className="px-2 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded text-[10px] font-bold shrink-0 transition"
                        >
                          Kembalikan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-slate-500">
                  {activeDuty
                    ? `Presensi ditugaskan di ${activeDuty.city} (${activeDuty.locationName}). Batas geofence resmi: ${targetRadiusMeters} meter.`
                    : `Sistem memverifikasi koordinat hardware satelit ke titik kantor (${config.officeRadiusMeters}m). Presensi hanya diproses jika sensor asli berada di dalam radius resmi.`}
                </p>
              </div>

              {/* GPS Geofence Visual Meter */}
              <div className="rounded-xl p-4 bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Jarak ke Titik {activeDuty ? 'Penugasan' : 'Kantor'}</span>
                  <span className={`font-mono font-bold text-sm ${isInsideRadius ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatDistance(distanceToOffice)}
                  </span>
                </div>

                {/* Progress bar representing distance vs radius */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isInsideRadius ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, (distanceToOffice / (targetRadiusMeters * 2)) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Batas Geofence: {targetRadiusMeters} meter</span>
                  <span className={isInsideRadius ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {isInsideRadius 
                      ? `Sisa toleransi: ${Math.round(targetRadiusMeters - distanceToOffice)}m (Aman)` 
                      : `Lebih ${Math.round(distanceToOffice - targetRadiusMeters)}m di luar batas (Terkunci)`}
                  </span>
                </div>

                {/* Target & Coordinates */}
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Titik Target:</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[210px]" title={targetLocationTitle}>
                      {activeDuty ? `${activeDuty.city} (${activeDuty.locationName})` : config.companyName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Koordinat Target:</span>
                    <span className="font-mono text-slate-200">{targetLat.toFixed(5)}, {targetLng.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Koordinat Anda:</span>
                    <span className={`font-mono ${isInsideRadius ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>
                      {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
                    </span>
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
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Foto Verifikasi Presensi</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Geotagged
                    </span>
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Ambil Ulang</span>
                    </button>
                  )}
                </div>

                {photoPreview ? (
                  <div className="rounded-2xl border border-emerald-300/80 bg-slate-900 p-2.5 shadow-sm space-y-2">
                    <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center group min-h-[160px]">
                      <img 
                        src={photoPreview} 
                        alt="Foto Presensi Terverifikasi" 
                        className="max-h-52 w-full object-contain rounded-lg" 
                      />
                      {/* Hover / Overlay action buttons */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => setPreviewZoomPhoto(photoPreview)}
                          className="px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Lihat Penuh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCameraModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Foto Ulang</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoPreview(null)}
                          className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white shadow transition cursor-pointer"
                          title="Hapus foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="absolute bottom-2 left-2 bg-slate-950/85 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Watermark Koordinat Aktif</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] truncate max-w-[240px]">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>Lat {currentLat.toFixed(5)}, Lng {currentLng.toFixed(5)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewZoomPhoto(photoPreview)}
                        className="text-slate-400 hover:text-emerald-300 text-[11px] underline cursor-pointer shrink-0"
                      >
                        Perbesar Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20 p-4 transition text-center space-y-3">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-xs text-slate-800">
                        Ambil Foto Bukti Presensi
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                        Kamera akan otomatis menyematkan titik koordinat satelit GPS, waktu presisi, dan nama Anda ke dalam foto.
                      </p>
                    </div>

                    {/* Coordinates preview pill */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono">
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>Siap Watermark: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="flex-1 max-w-[200px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/20 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Buka Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => directFileInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-white bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        title="Pilih foto dari berkas galeri atau kamera HP"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Pilih File</span>
                      </button>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={directFileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleDirectPhotoFile}
                      className="hidden"
                    />
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
              <div className="pt-2 space-y-2.5">
                {isVerifyingBeforeAction && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs flex items-center gap-3 animate-pulse">
                    <Navigation className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                    <div>
                      <div className="font-bold">Memeriksa & Mengunci Lokasi GPS Otomatis...</div>
                      <div className="text-[11px] text-amber-800">
                        Mengambil koordinat satelit presisi sebelum {isVerifyingBeforeAction === 'checkin' ? 'Check-In' : 'Check-Out'} diproses.
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning message if simulation mode is active */}
                {activeLocationPreset !== 'device_real' && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-2 shadow-2xs">
                    <div className="font-extrabold flex items-center gap-2 text-amber-800">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Presensi Terkunci: Mode Simulasi Radar Aktif</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Anda sedang memilih titik simulasi tampilan. Sesuai SOP keamanan, <strong>presensi dilarang menggunakan simulasi</strong> dan wajib menggunakan <strong>Sensor GPS Asli</strong> perangkat fisik Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectLocationPreset('device_real')}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      <span>Beralih ke Sensor GPS Asli Sekarang</span>
                    </button>
                  </div>
                )}

                {/* Warning message if outside radius */}
                {activeLocationPreset === 'device_real' && !isInsideRadius && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs space-y-1.5 shadow-2xs">
                    <div className="font-extrabold flex items-center gap-2 text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Presensi Terkunci: Di Luar Radius Geofence ({formatDistance(distanceToOffice)})</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Jarak sensor GPS Anda saat ini <strong>{formatDistance(distanceToOffice)}</strong> dari titik {activeDuty ? 'penugasan' : 'kantor'} (batas maksimal <strong>{targetRadiusMeters}m</strong>, selisih <strong>+{formatDistance(distanceToOffice - targetRadiusMeters)}</strong>). Sesuai aturan akurat geofence, <strong>Check-In dan Check-Out tidak dapat diproses</strong> hingga Anda berada di dalam radius resmi.
                    </p>
                  </div>
                )}

                {!todayRecord ? (
                  <button
                    type="button"
                    onClick={handlePerformCheckIn}
                    disabled={isGettingLocation || activeLocationPreset !== 'device_real'}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                      activeLocationPreset !== 'device_real'
                        ? 'bg-slate-400 cursor-not-allowed opacity-80'
                        : isInsideRadius
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/25'
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/25 border border-rose-700'
                    } ${isGettingLocation ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {isGettingLocation ? (
                      <>
                        <Navigation className="w-5 h-5 animate-spin" />
                        <span>Memverifikasi Sinyal GPS Satelit...</span>
                      </>
                    ) : activeLocationPreset !== 'device_real' ? (
                      <>
                        <ShieldAlert className="w-5 h-5 text-amber-200" />
                        <span>Presensi Terkunci (Mode Simulasi Aktif — Gunakan Sensor Asli)</span>
                      </>
                    ) : isInsideRadius ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Check-In Sekarang ({currentTime.toLocaleTimeString('id-ID').slice(0, 5)} WIB)</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-rose-200" />
                        <span>Check-In Terkunci: Di Luar Radius ({formatDistance(distanceToOffice)}) — Ditolak</span>
                      </>
                    )}
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
                      disabled={isGettingLocation || activeLocationPreset !== 'device_real'}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                        activeLocationPreset !== 'device_real'
                          ? 'bg-slate-400 cursor-not-allowed opacity-80'
                          : isInsideRadius
                          ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-700/25'
                          : 'bg-rose-600 hover:bg-rose-700 shadow-rose-700/25 border border-rose-700'
                      } ${isGettingLocation ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {isGettingLocation ? (
                        <>
                          <Navigation className="w-5 h-5 animate-spin" />
                          <span>Memverifikasi GPS Check-Out...</span>
                        </>
                      ) : activeLocationPreset !== 'device_real' ? (
                        <>
                          <ShieldAlert className="w-5 h-5 text-amber-200" />
                          <span>Check-Out Terkunci (Mode Simulasi Aktif — Gunakan Sensor Asli)</span>
                        </>
                      ) : isInsideRadius ? (
                        <>
                          <Clock className="w-5 h-5" />
                          <span>Check-Out Pulang ({currentTime.toLocaleTimeString('id-ID').slice(0, 5)} WIB)</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-5 h-5 text-rose-200" />
                          <span>Check-Out Terkunci: Di Luar Radius ({formatDistance(distanceToOffice)}) — Ditolak</span>
                        </>
                      )}
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

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">Template Slip:</span>
                  <select
                    value={selectedSlipTemplate}
                    onChange={(e) => setSelectedSlipTemplate(e.target.value as PayslipTemplateId)}
                    className="bg-emerald-900 text-white text-xs font-bold rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-300 cursor-pointer border-0"
                  >
                    {PAYSLIP_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id} className="bg-slate-900 text-white">
                        {tmpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => exportSingleEmployeeSlipPDF(employee, payrollSummary, attendanceRecords, config, selectedSlipTemplate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-900 hover:bg-emerald-50 shadow-sm transition shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  Unduh Slip Gaji (PDF)
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Big Take Home Pay Estimate Card */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    employee.salaryType === 'daily'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {employee.salaryType === 'daily' ? '⚡ Skema: Upah Harian (Sesuai Presensi)' : '🏢 Skema: Gaji Pokok Bulanan'}
                  </span>
                  {employee.salaryType === 'daily' && (
                    <span className="text-xs text-emerald-300 font-mono font-bold">
                      Rate: {formatIDR(employee.dailyRate || employee.baseSalary)} / hari
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>ESTIMASI TAKE HOME PAY BULAN INI</span>
                  <span className="text-emerald-400 font-medium">Transparan & Real-Time</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                  {formatIDR(payrollSummary.netSalary)}
                </div>
                <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>{cycleInfo.cutoffDateText}</span>
                  <span className="text-emerald-400 font-semibold">Tgl Gajian: {config.payrollDateDay} Setiap Bulan</span>
                </div>
              </div>

              {/* Estimasi Gaji Sesuai Absensi Hari Ini */}
              <div className="rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-white">Estimasi Gaji Sesuai Absensi Hari Ini</h4>
                      <p className="text-[11px] text-slate-300">
                        Tanggal: {todayStr} • Dihitung otomatis dari catatan kehadiran Anda
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    todayRecord?.checkOutTime
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : todayRecord
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {payrollSummary.todayBreakdown?.status || 'Belum Presensi'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {employee.salaryType === 'daily' ? 'Upah Pokok Harian' : 'Prorata Hari Ini (1/25)'}
                    </span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatIDR(payrollSummary.todayBreakdown?.baseRate || 0)}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-sans">Uang Makan / Transport</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      +{formatIDR(payrollSummary.todayBreakdown?.transport || 0)}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-sans">Upah Lembur Hari Ini</span>
                    <span className="font-bold text-indigo-400 text-sm">
                      +{formatIDR(payrollSummary.todayBreakdown?.overtime || 0)}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block font-sans">Potongan Keterlambatan</span>
                    <span className="font-bold text-rose-400 text-sm">
                      -{formatIDR(payrollSummary.todayBreakdown?.lateDeduction || 0)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-300 font-medium">Total Estimasi Penghasilan Hari Ini:</span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    {formatIDR(payrollSummary.todayEstimatedSalary || 0)}
                  </span>
                </div>
              </div>

              {/* Transparent Breakdown Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rincian Komponen Transparan
                </h3>

                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                  {/* Gaji Pokok (Harian atau Bulanan) */}
                  {employee.salaryType === 'daily' ? (
                    <div className="p-3 flex items-center justify-between bg-emerald-50/40 hover:bg-emerald-50 transition">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          Gaji Pokok Harian ({payrollSummary.attendanceDays} Hari Hadir × {formatIDR(employee.dailyRate || employee.baseSalary)})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Upah pokok harian diakumulasikan dari kehadiran terverifikasi GPS
                        </div>
                      </div>
                      <div className="font-bold text-emerald-700 font-mono text-sm">
                        {formatIDR(payrollSummary.dailyBaseEarnings || 0)}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="font-semibold text-slate-900">Gaji Pokok Bulanan (Monthly Base)</div>
                        <div className="text-[11px] text-slate-500">Sesuai kontrak kerja dan jabatan</div>
                      </div>
                      <div className="font-bold text-slate-800 font-mono text-sm">
                        {formatIDR(payrollSummary.baseSalary)}
                      </div>
                    </div>
                  )}

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

                {rec.verificationPhoto && (
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1">
                      <Camera className="w-3 h-3 text-emerald-600" />
                      <span>Foto Bukti Geotag:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoomPhoto(rec.verificationPhoto || null)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>Lihat Foto GPS</span>
                    </button>
                  </div>
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
                  <th className="py-3 px-4">Foto Bukti</th>
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
                    <td className="py-3 px-4">
                      {rec.verificationPhoto ? (
                        <button
                          type="button"
                          onClick={() => setPreviewZoomPhoto(rec.verificationPhoto || null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold transition cursor-pointer"
                          title="Lihat foto terstempel koordinat GPS"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Foto GPS</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
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

      {/* TAB: PETA LOKASI PRESENSI GPS */}
      {activePortalTab === 'gps-map' && (
        <AttendanceMapsDashboard
          employees={[employee]}
          attendanceRecords={attendanceRecords}
          config={config}
          shifts={shifts}
          initialSelectedEmployeeId={employee.id}
        />
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

      {/* GEOFENCE RADIUS VERIFICATION ALERT MODAL */}
      {radiusAlertModalOpen && radiusAlertData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-950">Validasi Geofence Gagal: Di Luar Radius</h3>
                <p className="text-xs text-rose-700">Presensi Masuk maupun Pulang Ditolak Sistem</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Titik Target Sah:</span>
                  <span className="font-bold text-slate-100 text-right truncate max-w-[240px]">
                    {activeDuty ? `${activeDuty.city} (${activeDuty.locationName})` : config.companyName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Jarak Terdeteksi ke Lokasi:</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    {formatDistance(radiusAlertData.distance)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Batas Maksimal Radius:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {radiusAlertData.allowedRadius} meter
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Kelebihan Jarak di Luar Area:</span>
                  <span className="font-mono font-bold text-rose-300">
                    +{formatDistance(radiusAlertData.excess)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Akurasi Sinyal GPS:</span>
                  <span className="font-mono text-slate-300">
                    ±{Math.round(radiusAlertData.accuracy)} meter ({getGpsAccuracyLevel(radiusAlertData.accuracy).label})
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  Sistem Anti-Celah Presensi (Zero-Bypass Geofencing):
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sistem secara ketat mengunci proses <strong>Check-In</strong> dan <strong>Check-Out</strong>. Karyawan <strong>wajib hadir secara fisik</strong> di area kantor ({config.officeRadiusMeters}m) atau di titik lokasi tugas resmi ({radiusAlertData.allowedRadius}m) yang telah ditugaskan admin. Presensi tidak dapat diproses jika berada di luar jangkauan.
                </p>
              </div>

              <p className="text-slate-500 text-[11px]">
                Jika Anda sudah tiba di lokasi namun sinyal GPS perangkat belum stabil, pastikan izin lokasi aktif pada peramban/browser, cari area terbuka atau klik <strong>Segarkan GPS Ulang</strong>.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRadiusAlertModalOpen(false);
                  setActivePortalTab('gps-map');
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Lihat Titik di Peta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRadiusAlertModalOpen(false);
                  handleDetectGPS();
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Navigation className="w-4 h-4" />
                <span>Segarkan GPS Ulang</span>
              </button>

              <button
                type="button"
                onClick={() => setRadiusAlertModalOpen(false)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-white transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE CAMERA VERIFICATION MODAL WITH COORDINATE WATERMARK */}
      {isCameraModalOpen && (
        <CameraVerificationModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onPhotoCaptured={(photoData) => {
            setPhotoPreview(photoData);
            setIsCameraModalOpen(false);
          }}
          watermarkData={getWatermarkPayload()}
          title="Foto Verifikasi Presensi Geotagged"
        />
      )}

      {/* FULL PHOTO ZOOM LIGHTBOX MODAL */}
      {previewZoomPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col my-auto">
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Camera className="w-4 h-4" />
                <span>Foto Verifikasi Presensi Terstempel Koordinat Satelit GPS</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewZoomPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-black flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewZoomPhoto}
                alt="Foto Presensi Resolusi Penuh"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <span>Koordinat satelit, akurasi, waktu, dan NIP karyawan tercetak permanen pada foto</span>
              <button
                type="button"
                onClick={() => setPreviewZoomPhoto(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                Tutup
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
