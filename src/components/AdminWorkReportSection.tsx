import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  Sparkles, 
  Filter, 
  Download, 
  Search, 
  BellRing, 
  Check, 
  ShieldAlert, 
  Briefcase, 
  Calendar,
  Layers,
  ArrowRight,
  Send,
  BarChart3
} from 'lucide-react';
import { Employee, WorkReport, AttendanceRecord } from '../types';
import { generateWorkReportRecommendations, getDailyReportCompliance } from '../utils/workReportAdvisor';
import { WorkReportReviewModal } from './WorkReportReviewModal';
import { AdminRecommendationCharts } from './AdminRecommendationCharts';

interface AdminWorkReportSectionProps {
  employees: Employee[];
  workReports: WorkReport[];
  attendanceRecords: AttendanceRecord[];
  onUpdateEmployee: (updated: Employee) => void;
  onUpdateReportStatus: (reportId: string, status: 'submitted' | 'reviewed' | 'needs_revision', feedback: string) => void;
  onSendBroadcastReminder: (targetEmployeeIds: string[], message: string) => void;
}

export const AdminWorkReportSection: React.FC<AdminWorkReportSectionProps> = ({
  employees,
  workReports,
  attendanceRecords,
  onUpdateEmployee,
  onUpdateReportStatus,
  onSendBroadcastReminder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'recommendations' | 'compliance' | 'charts'>('charts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Modal Review
  const [selectedReportForReview, setSelectedReportForReview] = useState<WorkReport | null>(null);

  // Recommendations calculation
  const recommendations = generateWorkReportRecommendations(employees, attendanceRecords);

  // Compliance calculation for selected date
  const compliance = getDailyReportCompliance(employees, workReports, selectedDate);

  // Filtered reports
  const filteredReports = workReports.filter((rep) => {
    const matchSearch = 
      rep.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = selectedDept === 'all' || rep.department === selectedDept;
    const matchStatus = selectedStatus === 'all' || rep.status === selectedStatus;
    const matchDate = !selectedDate || rep.date === selectedDate;
    return matchSearch && matchDept && matchStatus && matchDate;
  });

  // Unique departments for filter
  const departments = Array.from(new Set(employees.map((e) => e.department)));

  // Batch apply all recommendations
  const handleApplyAllRecommendations = () => {
    let appliedCount = 0;
    recommendations.forEach((rec) => {
      if (rec.recommended && !rec.currentRequiredStatus) {
        const emp = employees.find((e) => e.id === rec.employeeId);
        if (emp) {
          onUpdateEmployee({
            ...emp,
            requiresWorkReport: true,
            reportRequirementReason: rec.reason,
          });
          appliedCount++;
        }
      }
    });
    alert(`Berhasil menerapkan rekomendasi: ${appliedCount} karyawan (Supervisor, Manager & Spesialis) kini diwajibkan melapor pekerjaan harian.`);
  };

  // Toggle single employee requirement
  const handleToggleRequirement = (emp: Employee) => {
    const nextStatus = !emp.requiresWorkReport;
    const rec = recommendations.find((r) => r.employeeId === emp.id);
    onUpdateEmployee({
      ...emp,
      requiresWorkReport: nextStatus,
      reportRequirementReason: nextStatus ? (rec?.reason || 'Penetapan Kebijakan Admin') : '',
    });
  };

  // Trigger reminder to pending employees
  const handleSendReminderToPending = () => {
    if (compliance.pendingEmployees.length === 0) {
      alert('Semua karyawan yang wajib lapor sudah mengirimkan laporan untuk tanggal ini.');
      return;
    }

    const pendingIds = compliance.pendingEmployees.map((e) => e.id);
    const msg = `Peringatan Pengisian Laporan: Sebagai Supervisor/Manager, Anda belum mengirimkan Laporan Pekerjaan untuk tanggal ${selectedDate}. Mohon lengkapi sebelum batas shift berakhir.`;
    
    onSendBroadcastReminder(pendingIds, msg);
    alert(`Notifikasi & Email pengingat berhasil dikirimkan ke ${pendingIds.length} karyawan (${compliance.pendingEmployees.map(e => e.name).join(', ')}).`);
  };

  // Export Work Reports to CSV/Text
  const handleExportWorkReportsCSV = () => {
    const headers = ['ID Laporan', 'Tanggal', 'Jam Kirim', 'Karyawan', 'ID Karyawan', 'Jabatan', 'Departemen', 'Judul Laporan', 'Pekerjaan Selesai', 'Pekerjaan Berjalan', 'Kendala', 'Rencana Esok', 'Durasi (Jam)', 'Capaian (%)', 'Status Review', 'Feedback HRD'];
    
    const rows = filteredReports.map((r) => [
      `"${r.id}"`,
      `"${r.date}"`,
      `"${r.submittedAt}"`,
      `"${r.employeeName}"`,
      `"${r.employeeId}"`,
      `"${r.position}"`,
      `"${r.department}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.tasksCompleted.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.inProgressTasks || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.issuesOrBlockers || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${(r.nextDayPlan || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      r.hoursSpent || 8,
      r.completionPercentage || 100,
      `"${r.status}"`,
      `"${(r.reviewFeedback || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Laporan_Kerja_${selectedDate || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Laporan Masuk</div>
            <div className="text-xl font-bold text-slate-900">{workReports.length}</div>
            <div className="text-[11px] text-indigo-600 font-semibold">{workReports.filter(r => r.status === 'submitted').length} menunggu review</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Karyawan Wajib Lapor</div>
            <div className="text-xl font-bold text-slate-900">
              {employees.filter((e) => e.requiresWorkReport).length}
            </div>
            <div className="text-[11px] text-slate-500">Supervisor & Manajerial</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Rekomendasi Sistem</div>
            <div className="text-xl font-bold text-slate-900">
              {recommendations.filter((r) => r.recommended).length}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold">Tersedia untuk diterapkan</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500 font-medium">Kepatuhan ({selectedDate})</div>
            <div className="text-xl font-bold text-slate-900">{compliance.compliancePercentage}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${compliance.compliancePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex flex-wrap gap-1.5 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveSubTab('charts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'charts'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-300" />
          <span>Grafik & Analitik Rekomendasi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daftar & Review Laporan Kerja</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeSubTab === 'reports' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {filteredReports.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('recommendations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'recommendations'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Rekomendasi Wajib Lapor</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            activeSubTab === 'recommendations' ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {recommendations.filter(r => r.recommended).length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('compliance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'compliance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Monitoring Kepatuhan Harian</span>
          {compliance.pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">
              {compliance.pendingCount} Belum Lapor
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 0: GRAFIK & ANALITIK REKOMENDASI */}
      {activeSubTab === 'charts' && (
        <AdminRecommendationCharts
          employees={employees}
          workReports={workReports}
          attendanceRecords={attendanceRecords}
        />
      )}

      {/* SUB-TAB 1: REKOMENDASI KARYAWAN WAJIB LAPOR */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-4">
          {/* Smart Recommendation Explainer Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Sistem Rekomendasi Cerdas Karyawan Wajib Lapor</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sistem otomatis mendeteksi posisi kunci yang memerlukan pengawasan ketat, seperti 
                <strong className="text-amber-300"> Supervisor Lapangan</strong>, 
                <strong className="text-amber-300"> Manager Divisi</strong>, 
                <strong className="text-amber-300"> Team Lead</strong>, serta karyawan yang memiliki catatan lembur signifikan (&ge;2 jam) untuk transparansi hasil kerja.
              </p>
            </div>

            <button
              onClick={handleApplyAllRecommendations}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Terapkan Semua Rekomendasi</span>
            </button>
          </div>

          {/* Recommendations Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Daftar Analisis Peran & Status Kewajiban Laporan Kerja
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Admin dapat mengaktifkan atau menonaktifkan kewajiban pelaporan per karyawan secara fleksibel.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Karyawan</th>
                    <th className="py-3 px-4">Jabatan & Departemen</th>
                    <th className="py-3 px-4">Analisis Sistem & Rekomendasi</th>
                    <th className="py-3 px-4 text-center">Prioritas</th>
                    <th className="py-3 px-4 text-center">Status Wajib Lapor</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recommendations.map((rec) => {
                    const emp = employees.find((e) => e.id === rec.employeeId);
                    if (!emp) return null;

                    return (
                      <tr key={rec.employeeId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{rec.employeeName}</div>
                          <span className="text-[10px] font-mono text-slate-400">{rec.employeeId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{rec.position}</div>
                          <div className="text-[11px] text-slate-500">{rec.department}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-start gap-1.5">
                            {rec.recommended ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0 mt-1.5 ml-1 mr-1" />
                            )}
                            <span className="text-[11px] text-slate-700 leading-relaxed font-sans">
                              {rec.reason}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rec.priority === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : rec.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rec.priority === 'high' ? 'Kritis / Tinggi' : rec.priority === 'medium' ? 'Direkomendasikan' : 'Standar'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            emp.requiresWorkReport
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {emp.requiresWorkReport ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Wajib Lapor</span>
                              </>
                            ) : (
                              <span>Opsional</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleRequirement(emp)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              emp.requiresWorkReport
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                          >
                            {emp.requiresWorkReport ? 'Nonaktifkan' : 'Aktifkan Wajib Lapor'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MONITORING KEPATUHAN HARIAN */}
      {activeSubTab === 'compliance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <label className="text-xs font-semibold text-slate-600 block">Pilih Tanggal Evaluasi Kepatuhan:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleSendReminderToPending}
              disabled={compliance.pendingCount === 0}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-sm ${
                compliance.pendingCount > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>Kirimkan Reminder ke {compliance.pendingCount} Karyawan Belum Lapor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* List Karyawan yang BELUM Lapor */}
            <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Belum Melapor Hari Ini ({compliance.pendingCount} Karyawan)</span>
                </div>
                <span className="text-[11px] font-bold text-rose-700">Perlu Pengawasan</span>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {compliance.pendingEmployees.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    Semua supervisor & manajer wajib lapor telah menyelesaikan laporan untuk tanggal ini!
                  </div>
                ) : (
                  compliance.pendingEmployees.map((emp) => (
                    <div key={emp.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {emp.position} • {emp.department}
                        </div>
                        {emp.reportRequirementReason && (
                          <span className="inline-block mt-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            {emp.reportRequirementReason}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onSendBroadcastReminder([emp.id], `Pengingat Laporan Kerja (${selectedDate}): Harap segera kirim laporan sebelum shift berakhir.`)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim Reminder</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* List Karyawan yang SUDAH Lapor */}
            <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sudah Melapor ({compliance.submittedCount} Karyawan)</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700">Tuntas</span>
              </div>

              <div className="p-4 divide-y divide-slate-100">
                {compliance.submittedEmployees.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Belum ada laporan yang diserahkan untuk tanggal ini.
                  </div>
                ) : (
                  compliance.submittedEmployees.map((emp) => {
                    const rep = compliance.reportsToday.find((r) => r.employeeId === emp.id);
                    return (
                      <div key={emp.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{emp.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {emp.position} • {emp.department}
                          </div>
                          {rep && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              Dikirim pukul {rep.submittedAt} WIB • Capaian: {rep.completionPercentage}%
                            </span>
                          )}
                        </div>
                        {rep && (
                          <button
                            onClick={() => setSelectedReportForReview(rep)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          >
                            Lihat Laporan
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DAFTAR & REVIEW LAPORAN KERJA */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari karyawan, judul, atau jabatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Dept */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">Semua Departemen</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">Semua Status Review</option>
                <option value="submitted">Menunggu Review</option>
                <option value="reviewed">Sudah Direview</option>
                <option value="needs_revision">Perlu Revisi</option>
              </select>

              {/* Filter Date */}
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline ml-1"
                  >
                    Semua Tgl
                  </button>
                )}
              </div>
            </div>

            {/* Export Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportWorkReportsCSV}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Ekspor CSV / Excel</span>
              </button>
            </div>
          </div>

          {/* List of Reports */}
          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="font-bold text-sm text-slate-700">Tidak ada laporan kerja yang sesuai filter</div>
              <p className="text-xs text-slate-400 mt-1">
                Silakan ganti kata kunci pencarian, departemen, atau pilih tanggal lain.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-indigo-300 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
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
                            {report.status === 'reviewed' ? 'Disetujui' : report.status === 'needs_revision' ? 'Perlu Revisi' : 'Menunggu Review'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <strong className="text-slate-800">{report.employeeName}</strong> • {report.position} ({report.department})
                          • {report.date} pukul {report.submittedAt} WIB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-indigo-700">{report.completionPercentage}% Capaian</div>
                        <div className="text-[10px] text-slate-400">{report.hoursSpent || 8} jam kerja</div>
                      </div>

                      <button
                        onClick={() => setSelectedReportForReview(report)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Buka Detail & Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks Snippet */}
                  <div className="text-xs text-slate-700 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Pekerjaan Selesai:
                    </div>
                    <p className="line-clamp-2 text-slate-600 whitespace-pre-line leading-relaxed">
                      {report.tasksCompleted}
                    </p>
                  </div>

                  {/* Review Feedback Preview if exists */}
                  {report.reviewFeedback && (
                    <div className="text-xs p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-100 text-emerald-950 flex items-start gap-2">
                      <span className="font-bold shrink-0">Catatan HRD:</span>
                      <span className="italic">{report.reviewFeedback}</span>
                      {report.reviewedBy && (
                        <span className="text-[10px] text-emerald-700 ml-auto shrink-0 font-medium">
                          Oleh {report.reviewedBy} ({report.reviewedAt})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedReportForReview && (
        <WorkReportReviewModal
          isOpen={Boolean(selectedReportForReview)}
          onClose={() => setSelectedReportForReview(null)}
          report={selectedReportForReview}
          onUpdateStatus={onUpdateReportStatus}
        />
      )}
    </div>
  );
};
