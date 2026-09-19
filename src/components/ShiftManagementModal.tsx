import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { Shift } from '../types';

interface ShiftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  onSaveShifts: (shifts: Shift[]) => void;
}

export const ShiftManagementModal: React.FC<ShiftManagementModalProps> = ({
  isOpen,
  onClose,
  shifts,
  onSaveShifts,
}) => {
  if (!isOpen) return null;

  const [localShifts, setLocalShifts] = useState<Shift[]>([...shifts]);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // New Shift form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [newGracePeriod, setNewGracePeriod] = useState<number>(15);
  const [newDescription, setNewDescription] = useState('');
  const [formError, setFormError] = useState('');

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('Nama shift kerja wajib diisi');
      return;
    }

    const newShift: Shift = {
      id: `shift-custom-${Date.now()}`,
      name: newName.trim(),
      startTime: newStartTime,
      endTime: newEndTime,
      gracePeriodMinutes: Number(newGracePeriod) || 0,
      description: newDescription.trim() || `Shift kustom ${newStartTime} - ${newEndTime}`,
      isCustom: true,
    };

    const updated = [...localShifts, newShift];
    setLocalShifts(updated);
    onSaveShifts(updated);

    // Reset
    setIsAddingNew(false);
    setNewName('');
    setNewStartTime('08:00');
    setNewEndTime('17:00');
    setNewGracePeriod(15);
    setNewDescription('');
  };

  const handleUpdateShift = (id: string, updatedFields: Partial<Shift>) => {
    const updated = localShifts.map((s) => (s.id === id ? { ...s, ...updatedFields } : s));
    setLocalShifts(updated);
    onSaveShifts(updated);
  };

  const handleDeleteShift = (id: string) => {
    if (localShifts.length <= 1) {
      alert('Sistem harus memiliki minimal 1 jadwal shift operasional.');
      return;
    }
    const updated = localShifts.filter((s) => s.id !== id);
    setLocalShifts(updated);
    onSaveShifts(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pengaturan Jam Kerja & Shift Kustom</h3>
              <p className="text-xs text-slate-400">
                Atur jadwal jam masuk, jam pulang, toleransi keterlambatan, dan buat shift fleksibel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Quick Header with Add Button */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">
              Daftar Shift Kerja Operasional ({localShifts.length})
            </span>
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Shift Kustom</span>
              </button>
            )}
          </div>

          {/* New Shift Inline Form */}
          {isAddingNew && (
            <form onSubmit={handleCreateShift} className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Formulir Pembuatan Shift Kustom Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Batal
                </button>
              </div>

              {formError && (
                <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Shift Kerja</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Misal: Shift Pagi Operasional / Shift Fleksibel"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat (Opsional)</label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Misal: Khusus Regu Gudang & Distribusi"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Masuk (Start Time)</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Pulang (End Time)</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Toleransi Keterlambatan / Grace Period (Menit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={newGracePeriod}
                    onChange={(e) => setNewGracePeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Simpan Shift
                </button>
              </div>
            </form>
          )}

          {/* List of Existing Shifts */}
          <div className="space-y-3">
            {localShifts.map((shift) => {
              const isEditing = editingShiftId === shift.id;

              return (
                <div
                  key={shift.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{shift.name}</span>
                        {shift.isCustom && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            Kustom
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{shift.description || 'Jadwal shift operasional'}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setEditingShiftId(isEditing ? null : shift.id)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Tutup' : 'Ubah Jam'}</span>
                      </button>

                      {localShifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteShift(shift.id)}
                          className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition"
                          title="Hapus Shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shift Times Display / Edit Grid */}
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Jam Masuk</label>
                        <input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => handleUpdateShift(shift.id, { startTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Jam Pulang</label>
                        <input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => handleUpdateShift(shift.id, { endTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Toleransi (Menit)</label>
                        <input
                          type="number"
                          min="0"
                          value={shift.gracePeriodMinutes}
                          onChange={(e) => handleUpdateShift(shift.id, { gracePeriodMinutes: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400 font-sans text-[11px] mr-1">Masuk:</span>
                        <strong className="text-slate-900 font-bold">{shift.startTime}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans text-[11px] mr-1">Pulang:</span>
                        <strong className="text-slate-900 font-bold">{shift.endTime}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans text-[11px] mr-1">Toleransi:</span>
                        <span className="text-emerald-700 font-bold">{shift.gracePeriodMinutes} menit</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
