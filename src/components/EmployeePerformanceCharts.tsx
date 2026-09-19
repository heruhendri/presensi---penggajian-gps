import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { AttendanceRecord, Employee, Shift, WorkReport } from '../types';

interface EmployeePerformanceChartsProps {
  employee: Employee;
  shift?: Shift;
  attendanceRecords: AttendanceRecord[];
  workReports: WorkReport[];
}

export const EmployeePerformanceCharts: React.FC<EmployeePerformanceChartsProps> = ({
  employee,
  shift,
  attendanceRecords,
  workReports,
}) => {
  // Sort records
  const myRecords = useMemo(() => {
    return attendanceRecords
      .filter((r) => r.employeeId === employee.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // Last 10 days
  }, [attendanceRecords, employee.id]);

  const myReports = useMemo(() => {
    return workReports
      .filter((r) => r.employeeId === employee.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);
  }, [workReports, employee.id]);

  // Attendance & Hours Data
  const attendanceChartData = useMemo(() => {
    return myRecords.map((r) => {
      const parts = r.date.split('-');
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.date;
      return {
        date: shortDate,
        fullDate: r.date,
        workHours: Number((r.workDurationHours || 0).toFixed(1)),
        overtimeHours: Number((r.overtimeHours || 0).toFixed(1)),
        status: r.status,
      };
    });
  }, [myRecords]);

  // Target Completion Chart Data
  const reportProgressData = useMemo(() => {
    return myReports.map((r) => {
      const parts = r.date.split('-');
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : r.date;
      return {
        date: shortDate,
        fullDate: r.date,
        completion: r.completionPercentage || 0,
        title: r.title,
        status: r.status,
      };
    });
  }, [myReports]);

  // Stats calculation
  const totalDays = myRecords.length || 1;
  const onTimeDays = myRecords.filter((r) => r.status === 'hadir').length;
  const punctualityScore = Math.round((onTimeDays / totalDays) * 100);
  const totalOvertime = myRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);
  const avgCompletion = myReports.length > 0
    ? Math.round(myReports.reduce((acc, r) => acc + (r.completionPercentage || 0), 0) / myReports.length)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header & Personal AI Recommendation Cards */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Dashboard Kinerja & Rekomendasi Produktivitas</h3>
          </div>
          <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full text-indigo-200 border border-indigo-700">
            {employee.name} • {employee.position}
          </span>
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-indigo-200 text-xs block">Skor Ketepatan Waktu</span>
            <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">{punctualityScore}%</span>
            <span className="text-[11px] text-indigo-300">{onTimeDays} dari {totalDays} presensi tepat waktu</span>
          </div>

          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-indigo-200 text-xs block">Total Jam Lembur Terhitung</span>
            <span className="text-2xl font-bold text-amber-400 mt-0.5 block">{totalOvertime.toFixed(1)} Jam</span>
            <span className="text-[11px] text-indigo-300">Dikonversi ke upah lembur otomatis</span>
          </div>

          <div className="bg-white/10 rounded-xl p-3.5 border border-white/10 backdrop-blur-sm">
            <span className="text-indigo-200 text-xs block">Rata-Rata Capaian Target Shift</span>
            <span className="text-2xl font-bold text-indigo-300 mt-0.5 block">{avgCompletion}%</span>
            <span className="text-[11px] text-indigo-300">{myReports.length} laporan shift diajukan</span>
          </div>
        </div>

        {/* Personalized Recommendations Box */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Rekomendasi Peningkatan Produktivitas & Kepatuhan Kerja:</span>
          </div>
          <ul className="space-y-1.5 text-slate-200 pl-6 list-disc text-xs leading-relaxed">
            {punctualityScore >= 90 ? (
              <li>
                <strong className="text-emerald-300">Konsistensi Sangat Baik:</strong> Disiplin kehadiran Anda berada di kuartil teratas ({punctualityScore}%). Pertahankan untuk prioritas apresiasi dan bonus kinerja.
              </li>
            ) : (
              <li>
                <strong className="text-amber-300">Saran Ketepatan Waktu:</strong> Anda memiliki {totalDays - onTimeDays} catatan keterlambatan. Disarankan melakukan check-in minimal 10 menit sebelum jam shift dimulai.
              </li>
            )}

            {employee.requiresWorkReport ? (
              <li>
                <strong className="text-indigo-300">Kepatuhan Laporan Shift:</strong> Sebagai {employee.position}, pastikan mengisi laporan pekerjaan sebelum melakukan check-out presensi harian agar verifikasi upah berjalan lancar.
              </li>
            ) : (
              <li>
                <strong className="text-indigo-300">Inisiatif Pelaporan:</strong> Anda dapat mendokumentasikan pencapaian harian secara berkala melalui menu Laporan Pekerjaan untuk transparansi kinerja ke supervisor.
              </li>
            )}

            {totalOvertime > 15 && (
              <li>
                <strong className="text-rose-300">Perhatian Beban Kerja:</strong> Jam lembur Anda tercatat {totalOvertime.toFixed(1)} jam. Pastikan istirahat cukup dan jaga kesehatan untuk mencegah kelelahan berlebih.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hours & Overtime per Day */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              Grafik Durasi Kerja & Jam Lembur Harian
            </h4>
            <span className="text-[11px] text-slate-500">10 Hari Terakhir</span>
          </div>

          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit=" Jam" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="workHours" name="Jam Kerja Reguler" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overtimeHours" name="Jam Lembur" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task Completion Progress (%) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              Grafik Capaian Target Shift (%)
            </h4>
            <span className="text-[11px] text-slate-500">Laporan Pekerjaan</span>
          </div>

          <div className="w-full h-60">
            {reportProgressData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Target className="w-8 h-8 text-slate-300 mb-2" />
                <span>Belum ada data capaian target laporan shift.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    name="Capaian Target (%)"
                    stroke="#10b981"
                    fill="#d1fae5"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
