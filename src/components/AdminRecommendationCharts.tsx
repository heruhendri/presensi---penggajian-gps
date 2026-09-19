import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Sparkles, CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { Employee, WorkReport } from '../types';

interface AdminRecommendationChartsProps {
  employees: Employee[];
  workReports: WorkReport[];
}

export const AdminRecommendationCharts: React.FC<AdminRecommendationChartsProps> = ({
  employees,
  workReports,
}) => {
  const departments = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department)));
  }, [employees]);

  // 1. Compliance Rate per Department (% of employees with requiresWorkReport who have submitted report)
  const complianceData = useMemo(() => {
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.department === dept);
      const requiredEmployees = deptEmployees.filter((e) => e.requiresWorkReport);
      const requiredCount = requiredEmployees.length || 1;

      // Count unique required employees who submitted at least 1 report
      const reportingIds = new Set(workReports.map((r) => r.employeeId));
      const submittedCount = requiredEmployees.filter((e) => reportingIds.has(e.id)).length;
      const complianceRate = Math.round((submittedCount / requiredCount) * 100);

      // Average completion % reported in this dept
      const deptReports = workReports.filter((r) => r.department === dept);
      const avgCompletion = deptReports.length > 0
        ? Math.round(deptReports.reduce((acc, r) => acc + (r.completionPercentage || 0), 0) / deptReports.length)
        : 0;

      return {
        department: dept,
        complianceRate,
        submittedCount,
        requiredCount,
        avgCompletion,
      };
    });
  }, [departments, employees, workReports]);

  // 2. Review Status Distribution
  const reviewStatusData = useMemo(() => {
    const reviewed = workReports.filter((r) => r.status === 'reviewed').length;
    const needsRevision = workReports.filter((r) => r.status === 'needs_revision').length;
    const pending = workReports.filter((r) => r.status === 'submitted').length;
    const total = reviewed + needsRevision + pending || 1;

    return [
      { name: 'Disetujui HRD', value: reviewed, color: '#10b981', pct: Math.round((reviewed / total) * 100) },
      { name: 'Menunggu Review', value: pending, color: '#f59e0b', pct: Math.round((pending / total) * 100) },
      { name: 'Perlu Revisi', value: needsRevision, color: '#f43f5e', pct: Math.round((needsRevision / total) * 100) },
    ];
  }, [workReports]);

  // 3. Smart Advisor Priority Breakdown
  const priorityDistribution = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    employees.forEach((emp) => {
      const pos = emp.position.toLowerCase();
      if (pos.includes('manager') || pos.includes('supervisor') || pos.includes('lead') || pos.includes('kepala')) {
        high++;
      } else if (pos.includes('senior') || pos.includes('analyst') || pos.includes('spv')) {
        medium++;
      } else {
        low++;
      }
    });

    return [
      { name: 'Prioritas Tinggi (Supervisi/Manager)', count: high, color: '#6366f1' },
      { name: 'Prioritas Sedang (Senior Staff/PIC)', count: medium, color: '#0ea5e9' },
      { name: 'Prioritas Standar (Staff Reguler)', count: low, color: '#94a3b8' },
    ];
  }, [employees]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Department Compliance & Target Completion Rate (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Tingkat Kepatuhan & Rata-rata Capaian Shift Per Departemen
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan kepatuhan pengisian laporan dan efektivitas output kerja per divisi
              </p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="complianceRate" name="Tingkat Kepatuhan (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgCompletion" name="Rata-rata Capaian (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Review Status Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Status Verifikasi & Evaluasi Laporan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Proposi laporan yang telah diaudit oleh HRD & Manajemen
            </p>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reviewStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {reviewStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {reviewStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">
                  {item.value} <span className="text-slate-400 font-sans font-normal">({item.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgency Distribution Bar */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <span className="text-xs font-bold text-slate-700 block mb-2">
          Distribusi Rekomendasi Pegawai Wajib Lapor Berdasarkan Peran
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {priorityDistribution.map((p) => (
            <div key={p.name} className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block truncate">{p.name}</span>
              <span className="text-lg font-bold mt-0.5 block" style={{ color: p.color }}>
                {p.count} Karyawan
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
