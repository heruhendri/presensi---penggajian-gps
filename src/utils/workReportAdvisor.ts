import { Employee, WorkReport, WorkReportRecommendation, AttendanceRecord } from '../types';

/**
 * Menganalisis seluruh karyawan dan menghasilkan rekomendasi cerdas
 * tentang siapa yang sebaiknya diwajibkan menyusun Laporan Pekerjaan (Work Report).
 */
export function generateWorkReportRecommendations(
  employees: Employee[],
  attendanceRecords: AttendanceRecord[] = []
): WorkReportRecommendation[] {
  return employees.map((emp) => {
    const posLower = emp.position.toLowerCase();
    const deptLower = emp.department.toLowerCase();

    // 1. Manajerial / Supervisi Tim (Tingkat Kritis Tinggi)
    const isManagerial = 
      posLower.includes('manager') || 
      posLower.includes('supervisor') || 
      posLower.includes('head') || 
      posLower.includes('lead') || 
      posLower.includes('koordinator') ||
      posLower.includes('mandor') ||
      posLower.includes('kepala');

    // 2. Karyawan yang baru-baru ini memiliki jam lembur signifikan
    const empOvertimeCount = attendanceRecords
      .filter((a) => a.employeeId === emp.id && a.overtimeHours >= 2)
      .length;

    // 3. Posisi spesialis / proyek penting
    const isSpecialistOrField = 
      posLower.includes('specialist') || 
      posLower.includes('engineer') || 
      posLower.includes('executive') ||
      deptLower.includes('produksi') ||
      deptLower.includes('operasional');

    let recommended = false;
    let priority: 'high' | 'medium' | 'low' = 'low';
    let reason = 'Laporan opsional/rutin harian';

    if (isManagerial) {
      recommended = true;
      priority = 'high';
      reason = 'Jabatan Manajerial & Supervisi Tim (Pertanggungjawaban operasional & koordinasi regu)';
    } else if (empOvertimeCount > 0) {
      recommended = true;
      priority = 'medium';
      reason = `Tercatat lembur aktif (${empOvertimeCount}x lembur ≥2 jam). Memerlukan justifikasi output pekerjaan`;
    } else if (isSpecialistOrField) {
      recommended = true;
      priority = 'medium';
      reason = 'Posisi Spesialis Teknis / Lapangan dengan target output proyek spesifik';
    } else {
      recommended = false;
      priority = 'low';
      reason = 'Staf administratif umum - pelaporan dapat bersifat opsional atau berkala';
    }

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      department: emp.department,
      recommended,
      reason,
      priority,
      currentRequiredStatus: Boolean(emp.requiresWorkReport),
    };
  });
}

/**
 * Menghitung tingkat kepatuhan (compliance) pelaporan kerja hari ini
 */
export function getDailyReportCompliance(
  employees: Employee[],
  reports: WorkReport[],
  targetDate: string
) {
  const requiredEmployees = employees.filter((e) => e.requiresWorkReport);
  const reportsToday = reports.filter((r) => r.date === targetDate);

  const submittedEmployeeIds = new Set(reportsToday.map((r) => r.employeeId));

  const submitted = requiredEmployees.filter((e) => submittedEmployeeIds.has(e.id));
  const pending = requiredEmployees.filter((e) => !submittedEmployeeIds.has(e.id));

  const compliancePercentage = requiredEmployees.length > 0
    ? Math.round((submitted.length / requiredEmployees.length) * 100)
    : 100;

  return {
    targetDate,
    totalRequired: requiredEmployees.length,
    submittedCount: submitted.length,
    pendingCount: pending.length,
    compliancePercentage,
    submittedEmployees: submitted,
    pendingEmployees: pending,
    reportsToday,
  };
}
