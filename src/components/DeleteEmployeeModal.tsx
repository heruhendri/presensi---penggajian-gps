import React from 'react';
import { Trash2, PowerOff, CheckCircle2, X, AlertTriangle, UserX, ShieldAlert } from 'lucide-react';
import { Employee } from '../types';

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeletePermanent?: (employeeId: string) => void;
  onConfirm?: (employeeId: string) => void; // Compatibility alias
  onToggleActive?: (employeeId: string) => void;
  employee: Employee | null;
}

export const DeleteEmployeeModal: React.FC<DeleteEmployeeModalProps> = ({
  isOpen,
  onClose,
  onDeletePermanent,
  onConfirm,
  onToggleActive,
  employee,
}) => {
  if (!isOpen || !employee) return null;

  const isCurrentlyActive = employee.isActive !== false;

  const handleDelete = () => {
    if (onDeletePermanent) {
      onDeletePermanent(employee.id);
    } else if (onConfirm) {
      onConfirm(employee.id);
    }
    onClose();
  };

  const handleToggle = () => {
    if (onToggleActive) {
      onToggleActive(employee.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-rose-950 p-5 text-white flex items-center justify-between border-b border-rose-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Hapus / Nonaktifkan Karyawan</h3>
              <p className="text-xs text-rose-200/80">Kelola status dan penghapusan data karyawan dari sistem</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Employee Card Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-700 pb-1.5 border-b border-slate-200 flex items-center justify-between">
              <span>Data Karyawan Terpilih:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCurrentlyActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                Status: {isCurrentlyActive ? 'Aktif Bekerja' : 'Non-Aktif / Diarsipkan'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ID Karyawan:</span>
              <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 rounded bg-slate-200/60">
                {employee.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nama Lengkap:</span>
              <span className="font-bold text-slate-900">{employee.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Departemen / Jabatan:</span>
              <span className="font-medium text-slate-800">{employee.department} • {employee.position}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Username / Telepon:</span>
              <span className="font-mono text-slate-700">@{employee.username} ({employee.phone})</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Pilihan Penghapusan & Pengelolaan
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed">
              Anda dapat memilih untuk <strong>menghapus karyawan secara permanen</strong> dari daftar, atau cukup <strong>menonaktifkan (arsip)</strong> akunnya jika masih ingin mempertahankan riwayat presensinya.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {/* Option to toggle inactive status if onToggleActive is provided */}
              {onToggleActive && (
                <button
                  type="button"
                  onClick={handleToggle}
                  className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition cursor-pointer"
                >
                  <PowerOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isCurrentlyActive ? 'Nonaktifkan Saja' : 'Aktifkan Kembali'}</span>
                </button>
              )}

              {/* Delete Permanent Button */}
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Permanen Karyawan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
