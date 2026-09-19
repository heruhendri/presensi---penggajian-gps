import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon 
} from 'lucide-react';
import { AttendanceRecord, Employee, Shift } from '../types';

interface AttendanceChartsProps {
  attendanceRecords: AttendanceRecord[];
  employees: Employee[];
  shifts: Shift[];
}

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  attendanceRecords,
  employees,
  shifts,
}) => {
  const [timeRange, setTimeRange] = useState<'7days' | '14days' | 'all'>('7days');
  const [chartView, setChartView] = useState<'trend' | 'distribution' | 'department'>('trend');

  // Filtered records based on selected timeRange
  const sortedRecords = useMemo(() => {
    return [...attendanceRecords].sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceRecords]);

  // Unique dates
  const uniqueDates = useMemo(() => {
    const dates = Array.from(new Set(sortedRecords.map((r) => r.date))).sort();
    if (timeRange === '7days') return dates.slice(-7);
    if (timeRange === '14days') return dates.slice(-14);
    return dates;
  }, [sortedRecords, timeRange]);

  // Daily Trend Data
  const dailyTrendData = useMemo(() => {
    return uniqueDates.map((date) => {
      const recordsForDate = sortedRecords.filter((r) => r.date === date);
      const hadir = recordsForDate.filter((r) => r.status === 'hadir').length;
      const terlambat = recordsForDate.filter((r) => r.status === 'terlambat').length;
      const izin = recordsForDate.filter((r) => r.status === 'izin').length;
      const alpha = recordsForDate.filter((r) => r.status === 'alpha').length;
      const lembur = recordsForDate.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);

      // Short label format (e.g. "17 Sep")
      const parts = date.split('-');
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;

      return {
        date,
        shortDate,
        hadir,
        terlambat,
        izin,
        alpha,
        total: recordsForDate.length,
        lemburHours: Number(lembur.toFixed(1)),
      };
    });
  }, [uniqueDates, sortedRecords]);

  // Overall Attendance Distribution Data
  const statusCounts = useMemo(() => {
    let hadir = 0;
    let terlambat = 0;
    let izin = 0;
    let alpha = 0;

    const filtered = sortedRecords.filter((r) => uniqueDates.includes(r.date));
    filtered.forEach((r) => {
      if (r.status === 'hadir') hadir++;
      else if (r.status === 'terlambat') terlambat++;
      else if (r.status === 'izin') izin++;
      else if (r.status === 'alpha') alpha++;
    });

    const total = hadir + terlambat + izin + alpha || 1;
    return [
      { name: 'Tepat Waktu', value: hadir, color: '#10b981', percentage: Math.round((hadir / total) * 100) },
      { name: 'Terlambat', value: terlambat, color: '#f59e0b', percentage: Math.round((terlambat / total) * 100) },
      { name: 'Izin / Cuti', value: izin, color: '#3b82f6', percentage: Math.round((izin / total) * 100) },
      { name: 'Alpha / Mangkir', value: alpha, color: '#ef4444', percentage: Math.round((alpha / total) * 100) },
    ];
  }, [sortedRecords, uniqueDates]);

  // Department Attendance & Overtime Comparison Data
  const departmentData = useMemo(() => {
    const departments = Array.from(new Set(employees.map((e) => e.department)));
    const filtered = sortedRecords.filter((r) => uniqueDates.includes(r.date));

    return departments.map((dept) => {
      const deptRecords = filtered.filter((r) => r.department === dept);
      const totalRecords = deptRecords.length || 1;
      const onTime = deptRecords.filter((r) => r.status === 'hadir').length;
      const late = deptRecords.filter((r) => r.status === 'terlambat').length;
      const overtimeHours = deptRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);
      const avgWorkHours = deptRecords.reduce((acc, r) => acc + (r.workDurationHours || 0), 0) / totalRecords;

      return {
        department: dept,
        hadir: onTime,
        terlambat: late,
        pctOnTime: Math.round((onTime / totalRecords) * 100),
        totalOvertimeHours: Number(overtimeHours.toFixed(1)),
        avgWorkHours: Number(avgWorkHours.toFixed(1)),
      };
    });
  }, [employees, sortedRecords, uniqueDates]);

  // KPIs
  const totalPresences = sortedRecords.filter((r) => uniqueDates.includes(r.date)).length;
  const onTimeCount = statusCounts.find((s) => s.name === 'Tepat Waktu')?.value || 0;
  const lateCount = statusCounts.find((s) => s.name === 'Terlambat')?.value || 0;
  const overallPunctuality = totalPresences > 0 ? Math.round((onTimeCount / totalPresences) * 100) : 100;
  const totalAccumulatedOvertime = dailyTrendData.reduce((acc, d) => acc + d.lemburHours, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Top Header & Range Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Analisis & Grafik Kehadiran Pekerja</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi tren ketepatan waktu, sebaran absensi harian, dan akumulasi lembur seluruh divisi
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartView('trend')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartView === 'trend' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren Harian
            </button>
            <button
              type="button"
              onClick={() => setChartView('distribution')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartView === 'distribution' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Komposisi
            </button>
            <button
              type="button"
              onClick={() => setChartView('department')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartView === 'department' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Departemen
            </button>
          </div>

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 cursor-pointer"
          >
            <option value="7days">7 Hari Terakhir</option>
            <option value="14days">14 Hari Terakhir</option>
            <option value="all">Semua Data Periode</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Ketepatan Waktu</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600">{overallPunctuality}%</span>
            <span className="text-[11px] text-slate-500">rata-rata</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
            {onTimeCount} presensi tepat waktu
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Keterlambatan</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-amber-600">{lateCount}</span>
            <span className="text-[11px] text-slate-500">kejadian</span>
          </div>
          <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
            {totalPresences > 0 ? Math.round((lateCount / totalPresences) * 100) : 0}% dari total log
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Akumulasi Lembur</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-indigo-600">{totalAccumulatedOvertime}</span>
            <span className="text-[11px] text-slate-500">Jam</span>
          </div>
          <span className="text-[10px] text-indigo-700 font-medium block mt-0.5">
            Terhitung otomatis sistem
          </span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Karyawan Aktif</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{employees.length}</span>
            <span className="text-[11px] text-slate-500">Orang</span>
          </div>
          <span className="text-[10px] text-slate-600 font-medium block mt-0.5">
            {shifts.length} shift kerja aktif
          </span>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="min-h-[300px]">
        {/* 1. TREN HARIAN (Stacked Bar / Area) */}
        {chartView === 'trend' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Grafik Log Kehadiran & Lembur Harian</span>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Hadir</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> Terlambat</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span> Izin</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span> Alpha</span>
              </div>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#cbd5e1' }}
                  />
                  <Bar dataKey="hadir" name="Tepat Waktu" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="terlambat" name="Terlambat" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="izin" name="Izin / Cuti" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="alpha" name="Alpha" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. KOMPOSISI STATUS KEHADIRAN (Donut Chart + Breakdown) */}
        {chartView === 'distribution' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Rincian Persentase Kehadiran
              </span>
              <div className="space-y-2">
                {statusCounts.map((s) => (
                  <div key={s.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></span>
                      <span className="font-semibold text-slate-700">{s.name}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900">{s.value} orang</span>
                      <span className="text-slate-400 ml-1.5 font-sans text-[11px]">({s.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. PERBANDINGAN PER DEPARTEMEN */}
        {chartView === 'department' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Tingkat Kehadiran & Total Lembur Per Departemen</span>
            </div>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="hadir" name="Tepat Waktu (Orang)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="terlambat" name="Terlambat (Orang)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalOvertimeHours" name="Lembur (Jam)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
