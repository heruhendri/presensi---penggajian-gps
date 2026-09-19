import * as XLSX from 'xlsx';
import { AttendanceRecord, CompanyConfig, Employee, PayrollSummary } from '../types';

export function exportPayrollAndAttendanceExcel(
  summaries: PayrollSummary[],
  attendances: AttendanceRecord[],
  employees: Employee[],
  config: CompanyConfig,
  departmentFilter: string = 'Semua'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rekap Penggajian
  const payrollRows = summaries.map((s, idx) => ({
    'No': idx + 1,
    'ID Karyawan': s.employeeId,
    'Nama Lengkap': s.employeeName,
    'Departemen': s.department,
    'Jabatan': s.position,
    'Hari Hadir': s.attendanceDays,
    'Total Jam Kerja': s.totalWorkHours,
    'Total Jam Lembur': s.totalOvertimeHours,
    'Gaji Pokok (Rp)': s.baseSalary,
    'Tunjangan Tetap (Rp)': s.allowance,
    'Uang Transport/Makan (Rp)': s.transportAllowance,
    'Uang Lembur (Rp)': s.totalOvertimePay,
    'Potongan Keterlambatan (Rp)': s.lateDeduction,
    'Gaji Kotor (Rp)': s.grossSalary,
    'Gaji Bersih (Net Rp)': s.netSalary,
  }));
  const wsPayroll = XLSX.utils.json_to_sheet(payrollRows);
  XLSX.utils.book_append_sheet(wb, wsPayroll, 'Rekap Penggajian');

  // Sheet 2: Log Presensi GPS
  const filteredAttendances = departmentFilter === 'Semua' || departmentFilter === 'Semua Departemen'
    ? attendances
    : attendances.filter(a => a.department === departmentFilter);

  const attendanceRows = filteredAttendances.map((a, idx) => ({
    'No': idx + 1,
    'Tanggal': a.date,
    'ID Karyawan': a.employeeId,
    'Nama Karyawan': a.employeeName,
    'Departemen': a.department,
    'Jam Masuk': a.checkInTime || '-',
    'Jam Pulang': a.checkOutTime || '-',
    'Durasi Kerja (Jam)': a.workDurationHours,
    'Jam Lembur': a.overtimeHours,
    'Nominal Lembur (Rp)': a.overtimePay,
    'Status Presensi': a.status.toUpperCase(),
    'Lat Checkin': a.checkInLat || '-',
    'Lng Checkin': a.checkInLng || '-',
    'Jarak ke Kantor (m)': a.checkInDistanceMeters !== undefined ? `${a.checkInDistanceMeters} m` : '-',
    'Status Lembur Disetujui': a.isOvertimeApproved ? 'YA' : 'TIDAK',
    'Catatan': a.notes || '-',
  }));
  const wsAttendance = XLSX.utils.json_to_sheet(attendanceRows);
  XLSX.utils.book_append_sheet(wb, wsAttendance, 'Log Presensi GPS');

  // Sheet 3: Master Karyawan
  const empRows = employees.map((e, idx) => ({
    'No': idx + 1,
    'ID': e.id,
    'Username': e.username,
    'No Telepon': e.phone,
    'Nama': e.name,
    'Departemen': e.department,
    'Jabatan': e.position,
    'Gaji Pokok (Rp)': e.baseSalary,
    'Tunjangan (Rp)': e.allowance,
    'Uang Transport/Hari (Rp)': e.dailyTransport,
    'Shift ID': e.currentShiftId,
    'Email': e.email,
  }));
  const wsEmployees = XLSX.utils.json_to_sheet(empRows);
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'Master Karyawan');

  // Sheet 4: Info Sistem & Watermark
  const infoRows = [
    { 'Informasi': 'Nama Aplikasi', 'Keterangan': 'Sistem Presensi GPS & Penggajian Real-Time' },
    { 'Informasi': 'Perusahaan', 'Keterangan': config.companyName },
    { 'Informasi': 'Alamat Kantor', 'Keterangan': config.companyAddress },
    { 'Informasi': 'Waktu Ekspor', 'Keterangan': new Date().toLocaleString('id-ID') },
    { 'Informasi': 'Filter Departemen', 'Keterangan': departmentFilter },
    { 'Informasi': 'Watermark / Pengembang', 'Keterangan': 'Dibuat oleh heruhendri' },
  ];
  const wsInfo = XLSX.utils.json_to_sheet(infoRows);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Info Sistem');

  const filename = `Rekap_Presensi_Gaji_${departmentFilter.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
