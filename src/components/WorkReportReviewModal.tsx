import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Building2, 
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import { WorkReport } from '../types';

interface WorkReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WorkReport | null;
  onUpdateStatus: (reportId: string, status: 'submitted' | 'reviewed' | 'needs_revision', feedback: string) => void;
}

export const WorkReportReviewModal: React.FC<WorkReportReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateStatus,
}) => {
  const [feedback, setFeedback] = useState(report?.reviewFeedback || '');
  const [selectedStatus, setSelectedStatus] = useState<'submitted' | 'reviewed' | 'needs_revision'>(
    report?.status || 'reviewed'
  );

  if (!isOpen || !report) return null;

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(report.id, selectedStatus, feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/40 border border-indigo-400/30">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Detail & Review Laporan Kerja</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  report.status === 'reviewed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : report.status === 'needs_revision'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {report.status === 'reviewed' ? 'Telah Direview' : report.status === 'needs_revision' ? 'Perlu Revisi' : 'Menunggu Review'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ID: {report.id} • Tanggal: {report.date} pukul {report.submittedAt} WIB
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

        {/* Content View */}
        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-xs text-slate-700">
          {/* Employee Meta Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block">Karyawan</span>
              <span className="font-bold text-slate-900">{report.employeeName}</span>
              <span className="text-[10px] text-slate-500 block">{report.employeeId}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Jabatan / Posisi</span>
              <span className="font-semibold text-slate-800">{report.position}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Departemen</span>
              <span className="font-semibold text-slate-800">{report.department}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Capaian & Durasi</span>
              <span className="font-bold text-indigo-700">{report.completionPercentage}%</span>
              <span className="text-[10px] text-slate-500 block">({report.hoursSpent || 8} Jam Kerja)</span>
            </div>
          </div>

          {/* Judul & Shift */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Judul Laporan</div>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{report.title}</h4>
            {report.shiftName && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                {report.shiftName}
              </span>
            )}
          </div>

          {/* Tugas Selesai */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pekerjaan Selesai (Deliverables & Tugas Utama):
            </div>
            <div className="text-slate-800 whitespace-pre-line leading-relaxed pl-5 font-sans">
              {report.tasksCompleted}
            </div>
          </div>

          {/* Tugas Berjalan & Kendala */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Pekerjaan Sedang Berjalan:</span>
              <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                {report.inProgressTasks || 'Tidak ada pekerjaan pending.'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100">
              <span className="font-bold text-rose-900 block mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Kendala / Hambatan Lapangan:
              </span>
              <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                {report.issuesOrBlockers || 'Tidak ada kendala yang dilaporkan.'}
              </div>
            </div>
          </div>

          {/* Rencana Kerja Esok Hari */}
          <div className="p-3.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
            <span className="font-bold text-indigo-950 block mb-1">Rencana Kerja Esok Hari:</span>
            <div className="text-slate-700 leading-relaxed">
              {report.nextDayPlan || 'Melanjutkan jadwal rutin.'}
            </div>
          </div>

          {/* Form Review Admin / HRD */}
          <form onSubmit={handleSaveReview} className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Evaluasi & Catatan Feedback HRD / Manajemen</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition ${
                selectedStatus === 'reviewed'
                  ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="reviewStatus"
                  value="reviewed"
                  checked={selectedStatus === 'reviewed'}
                  onChange={() => setSelectedStatus('reviewed')}
                  className="text-emerald-600"
                />
                <span>Setujui (Reviewed)</span>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition ${
                selectedStatus === 'needs_revision'
                  ? 'border-rose-500 bg-rose-50/80 text-rose-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="reviewStatus"
                  value="needs_revision"
                  checked={selectedStatus === 'needs_revision'}
                  onChange={() => setSelectedStatus('needs_revision')}
                  className="text-rose-600"
                />
                <span>Minta Revisi Detail</span>
              </label>

              <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition ${
                selectedStatus === 'submitted'
                  ? 'border-amber-500 bg-amber-50/80 text-amber-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  type="radio"
                  name="reviewStatus"
                  value="submitted"
                  checked={selectedStatus === 'submitted'}
                  onChange={() => setSelectedStatus('submitted')}
                  className="text-amber-600"
                />
                <span>Tunda (Pending)</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Feedback untuk Karyawan:
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan instruksi tindak lanjut, apresiasi, atau arahan kendala lapangan..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Simpan Review</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
