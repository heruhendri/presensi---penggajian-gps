import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Send, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { Employee, Shift, WorkReport } from '../types';

interface WorkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  shift?: Shift;
  existingReport?: WorkReport;
  onSubmitReport: (reportData: Partial<WorkReport>) => void;
}

export const WorkReportModal: React.FC<WorkReportModalProps> = ({
  isOpen,
  onClose,
  employee,
  shift,
  existingReport,
  onSubmitReport,
}) => {
  const [title, setTitle] = useState(
    existingReport?.title || 
    (employee.position.toLowerCase().includes('manager')
      ? `Laporan Manajerial & Supervisi Divisi - ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : employee.position.toLowerCase().includes('supervisor')
      ? `Laporan Supervisi Lapangan & Shift - ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : `Laporan Hasil Pekerjaan Harian - ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`)
  );

  const [tasksCompleted, setTasksCompleted] = useState(
    existingReport?.tasksCompleted || 
    (employee.position.toLowerCase().includes('supervisor')
      ? '1. Memimpin briefing koordinasi shift & pembagian tugas regu.\n2. Monitoring kepatuhan SOP dan target ritase operasional.\n3. Evaluasi serah terima shift dan inventaris alat kerja.'
      : employee.position.toLowerCase().includes('manager')
      ? '1. Review progres KPI mingguan divisi operasional & logistik.\n2. Koordinasi mitigasi kendala operasional cabang dengan para supervisor.\n3. Approval jadwal lembur dan rekonsiliasi laporan kebutuhan armada.'
      : '1. Menyelesaikan tugas utama sesuai target sprint/proyek harian.\n2. Melakukan sinkronisasi dan koordinasi tim.')
  );

  const [inProgressTasks, setInProgressTasks] = useState(
    existingReport?.inProgressTasks || ''
  );
  const [issuesOrBlockers, setIssuesOrBlockers] = useState(
    existingReport?.issuesOrBlockers || ''
  );
  const [nextDayPlan, setNextDayPlan] = useState(
    existingReport?.nextDayPlan || 'Melanjutkan koordinasi target kerja esok hari dan monitoring kepatuhan SOP tim.'
  );
  const [hoursSpent, setHoursSpent] = useState<number>(existingReport?.hoursSpent || 8);
  const [completionPercentage, setCompletionPercentage] = useState<number>(
    existingReport?.completionPercentage || 95
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksCompleted.trim()) {
      alert('Mohon isi uraian pekerjaan yang telah diselesaikan.');
      return;
    }

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    onSubmitReport({
      id: existingReport?.id || `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      position: employee.position,
      date: existingReport?.date || new Date().toISOString().slice(0, 10),
      submittedAt: existingReport?.submittedAt || nowStr,
      shiftName: shift?.name || 'Shift Reguler',
      title,
      tasksCompleted,
      inProgressTasks,
      issuesOrBlockers,
      nextDayPlan,
      hoursSpent: Number(hoursSpent),
      completionPercentage: Number(completionPercentage),
      status: existingReport?.status || 'submitted',
    });

    onClose();
  };

  const isManagerial = 
    employee.position.toLowerCase().includes('manager') || 
    employee.position.toLowerCase().includes('supervisor') ||
    employee.position.toLowerCase().includes('lead');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/50 border border-indigo-400/30">
              <FileText className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {existingReport ? 'Edit Laporan Pekerjaan' : 'Form Laporan Pekerjaan Harian'}
                </h3>
                {isManagerial && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] tracking-wide uppercase">
                    Wajib: Supervisi / Manajerial
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {employee.name} • {employee.position} ({employee.department})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Pertanggungjawaban Kerja Shift:</span> Laporan ini diteruskan otomatis ke rekapitulasi HRD & Dashboard Manajemen sebagai dasar penilaian kinerja, pertanggungjawaban shift, dan verifikasi lembur.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
          {/* Judul Laporan */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Judul / Topik Utama Laporan Kerja <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Supervisi Shift Pagi, Monitoring SOP & Logistik"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
            />
          </div>

          {/* Tugas Selesai */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Pekerjaan & Pencapaian yang Telah Selesai Hari Ini <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-1.5">
              Tuliskan secara rinci hasil koordinasi, penugasan regu, pemeriksaan fisik, atau deliverables yang rampung.
            </p>
            <textarea
              required
              rows={4}
              value={tasksCompleted}
              onChange={(e) => setTasksCompleted(e.target.value)}
              placeholder="1. Memimpin briefing operasional...&#10;2. Verifikasi 40 dokumen pengiriman...&#10;3. Koordinasi serah terima shift..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-slate-800 leading-relaxed"
            />
          </div>

          {/* 2 Kolom: Tugas Sedang Berjalan & Kendala Lapangan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Pekerjaan Sedang Berjalan (In-Progress)
              </label>
              <textarea
                rows={3}
                value={inProgressTasks}
                onChange={(e) => setInProgressTasks(e.target.value)}
                placeholder="Pekerjaan yang belum selesai atau sedang menunggu konfirmasi..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Kendala Lapangan / Eskalasi Masalah
              </label>
              <textarea
                rows={3}
                value={issuesOrBlockers}
                onChange={(e) => setIssuesOrBlockers(e.target.value)}
                placeholder="Hambatan alat, cuaca, sistem, atau kebutuhan bantuan manajemen..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Rencana Kerja Esok Hari */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Rencana Target Kerja Hari Berikutnya (Next Plan)
            </label>
            <input
              type="text"
              value={nextDayPlan}
              onChange={(e) => setNextDayPlan(e.target.value)}
              placeholder="Target utama yang akan dikerjakan pada shift selanjutnya..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Metrik Jam Kerja & Capaian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estimasi Jam Kerja Efektif
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 bg-white"
                />
                <span className="text-slate-500 font-medium">Jam kerja</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">
                  Tingkat Capaian Target Hari Ini:
                </label>
                <span className="font-mono font-bold text-indigo-700">
                  {completionPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={completionPercentage}
                onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              Batal
            </button>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{existingReport ? 'Perbarui Laporan' : 'Kirim Laporan Pekerjaan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
