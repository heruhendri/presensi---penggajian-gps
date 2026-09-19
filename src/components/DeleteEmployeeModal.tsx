import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Employee } from '../types';

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
}

export const DeleteEmployeeModal: React.FC<DeleteEmployeeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  employee,
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-rose-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Konfirmasi Hapus Karyawan</h3>
              <p className="text-xs text-rose-100">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus data karyawan berikut dari sistem HRD dan basis data presensi?
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
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

          <p className="text-[11px] text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
            Perhatian: Menghapus karyawan akan menghapus akses login akun dan mencabut penugasan shift kerja.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Ya, Hapus Karyawan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
