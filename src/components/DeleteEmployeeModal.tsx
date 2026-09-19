import React from 'react';
import { ShieldAlert, ShieldCheck, PowerOff, CheckCircle2, X, Info } from 'lucide-react';
import { Employee } from '../types';

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // This will toggle / set employee.isActive = false
  employee: Employee | null;
}

export const DeleteEmployeeModal: React.FC<DeleteEmployeeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  employee,
}) => {
  if (!isOpen || !employee) return null;

  const isCurrentlyActive = employee.isActive !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Proteksi Data: Karyawan Tidak Dapat Dihapus</h3>
              <p className="text-xs text-slate-400">Kebijakan audit kepatuhan rekam jejak presensi & penggajian</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              Mengapa Karyawan Tidak Boleh Dihapus Permanen?
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Sistem memproteksi database dari penghapusan permanen agar riwayat absensi GPS, jam lembur, laporan kerja, dan slip gaji masa lalu <strong>tetap utuh 100% dan dapat diaudit secara legal</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-700 pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>Data Karyawan Terpilih:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCurrentlyActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                Status: {isCurrentlyActive ? 'Aktif Bekerja' : 'Non-Aktif / Diarsipkan'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ID Karyawan:</span>
              <span className="font-mono font-bold text-slate-900">{employee.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Lengkap:</span>
              <span className="font-bold text-slate-900">{employee.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Departemen:</span>
              <span className="font-medium text-slate-800">{employee.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jabatan:</span>
              <span className="font-medium text-slate-800">{employee.position}</span>
            </div>
          </div>

          <div className="text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">
              Solusi yang Disediakan Sistem:
            </p>
            <p className="text-[11px] leading-relaxed">
              Sebagai pengganti hapus permanen, Anda dapat <strong>menonaktifkan (mengarsipkan)</strong> akun karyawan ini. Karyawan non-aktif tidak dapat melakukan login presensi harian, namun seluruh data historisnya tetap aman dan dapat diaktifkan kembali kapan pun diperlukan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full sm:w-auto py-2.5 px-5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer ${
                isCurrentlyActive
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isCurrentlyActive ? (
                <>
                  <PowerOff className="w-4 h-4" />
                  <span>Non-aktifkan Akun Karyawan</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aktifkan Kembali Karyawan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
