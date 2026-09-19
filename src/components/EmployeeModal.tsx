import React, { useState, useEffect } from 'react';
import { X, UserPlus, Edit3, Shield, Clock, DollarSign, Building, Phone, Mail, CreditCard, Sparkles } from 'lucide-react';
import { Employee, Shift } from '../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  employeeToEdit?: Employee | null;
  existingEmployees: Employee[];
  shifts: Shift[];
}

const DEPARTMENTS = [
  'Operasional',
  'IT & Engineering',
  'HR & Legal',
  'Finance & Accounting',
  'Marketing & Sales',
  'Logistik & Gudang',
];

const COMMON_BANKS = ['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB Niaga', 'Bank Danamon'];

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employeeToEdit,
  existingEmployees,
  shifts,
}) => {
  if (!isOpen) return null;

  const isEditMode = Boolean(employeeToEdit);

  // Generate next ID if new
  const defaultNextId = () => {
    const ids = existingEmployees
      .map((e) => {
        const match = e.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    return `EMP${String(max + 1).padStart(3, '0')}`;
  };

  const [id, setId] = useState(employeeToEdit?.id || defaultNextId());
  const [name, setName] = useState(employeeToEdit?.name || '');
  const [username, setUsername] = useState(employeeToEdit?.username || '');
  const [phone, setPhone] = useState(employeeToEdit?.phone || '');
  const [password, setPassword] = useState(employeeToEdit?.password || 'karyawan123');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [department, setDepartment] = useState(employeeToEdit?.department || DEPARTMENTS[0]);
  const [customDepartment, setCustomDepartment] = useState('');
  const [position, setPosition] = useState(employeeToEdit?.position || '');
  const [currentShiftId, setCurrentShiftId] = useState(employeeToEdit?.currentShiftId || (shifts[0]?.id || 'shift-1'));
  const [baseSalary, setBaseSalary] = useState<number>(employeeToEdit?.baseSalary ?? 5500000);
  const [allowance, setAllowance] = useState<number>(employeeToEdit?.allowance ?? 750000);
  const [dailyTransport, setDailyTransport] = useState<number>(employeeToEdit?.dailyTransport ?? 35000);
  const [bankName, setBankName] = useState(employeeToEdit?.bankName || 'BCA');
  const [bankAccount, setBankAccount] = useState(employeeToEdit?.bankAccount || '');
  const [requiresWorkReport, setRequiresWorkReport] = useState<boolean>(employeeToEdit?.requiresWorkReport ?? false);
  const [reportRequirementReason, setReportRequirementReason] = useState(
    employeeToEdit?.reportRequirementReason || 'Tanggung Jawab Supervisi / Output Shift'
  );

  // Custom working hours toggle
  const [useCustomHours, setUseCustomHours] = useState<boolean>(Boolean(employeeToEdit?.customHours));
  const [customStartTime, setCustomStartTime] = useState(employeeToEdit?.customHours?.startTime || '08:00');
  const [customEndTime, setCustomEndTime] = useState(employeeToEdit?.customHours?.endTime || '17:00');

  const [errorMsg, setErrorMsg] = useState('');

  // Auto-detect work report requirement recommendation on position change
  useEffect(() => {
    if (!isEditMode && position) {
      const lower = position.toLowerCase();
      if (lower.includes('supervisor') || lower.includes('spv') || lower.includes('manager') || lower.includes('lead') || lower.includes('kepala')) {
        setRequiresWorkReport(true);
        setReportRequirementReason(`Jabatan Struktural: ${position}`);
      }
    }
  }, [position, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama lengkap karyawan wajib diisi');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Username login wajib diisi');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Nomor telepon / WhatsApp wajib diisi');
      return;
    }
    if (!position.trim()) {
      setErrorMsg('Jabatan karyawan wajib diisi');
      return;
    }

    // Check ID conflict if adding new
    if (!isEditMode && existingEmployees.some((e) => e.id.toLowerCase() === id.trim().toLowerCase())) {
      setErrorMsg(`ID Karyawan ${id} sudah terdaftar. Gunakan ID lain.`);
      return;
    }

    const finalDepartment = department === 'OTHER' ? customDepartment || 'Umum' : department;

    const newEmployee: Employee = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      phone: phone.trim(),
      password: password.trim() || 'karyawan123',
      email: email.trim() || `${username.trim().toLowerCase()}@company.id`,
      department: finalDepartment,
      position: position.trim(),
      currentShiftId,
      baseSalary: Number(baseSalary) || 0,
      allowance: Number(allowance) || 0,
      dailyTransport: Number(dailyTransport) || 0,
      bankName,
      bankAccount: bankAccount.trim(),
      requiresWorkReport,
      reportRequirementReason: requiresWorkReport ? reportRequirementReason : undefined,
      customHours: useCustomHours ? { startTime: customStartTime, endTime: customEndTime } : undefined,
    };

    onSave(newEmployee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              {isEditMode ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {isEditMode ? 'Edit Data & Penggajian Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditMode ? `Memperbarui profil ${employeeToEdit?.name} (${employeeToEdit?.id})` : 'Daftarkan karyawan baru ke dalam sistem HRD'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Profil & Identitas */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              1. Identitas & Kredensial Login
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Karyawan</label>
                <input
                  type="text"
                  required
                  value={id}
                  disabled={isEditMode}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="EMP001"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-slate-50 disabled:opacity-70"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username (Login)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="budi.santoso"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Karyawan</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Departemen & Shift Kerja */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              2. Penempatan & Jam Kerja
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departemen</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="OTHER">+ Departemen Lain...</option>
                </select>
                {department === 'OTHER' && (
                  <input
                    type="text"
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="Ketik nama departemen..."
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan / Posisi</label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: Supervisor Operasional / Staff"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Pilihan Shift Kerja</label>
                <select
                  value={currentShiftId}
                  onChange={(e) => setCurrentShiftId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime}) {s.isCustom ? '• [Custom]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Working Hours Toggle */}
              <div className="sm:col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomHours}
                    onChange={(e) => setUseCustomHours(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Gunakan Jam Kerja Khusus (Kustom untuk Karyawan Ini)
                  </span>
                </label>
                {useCustomHours && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Jam Masuk Khusus</label>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Jam Pulang Khusus</label>
                      <input
                        type="time"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Struktur Gaji & Rekening */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              3. Komponen Gaji & Rekening Payroll
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok (IDR/Bulan)</label>
                <input
                  type="number"
                  step="50000"
                  required
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tunjangan Tetap (IDR)</label>
                <input
                  type="number"
                  step="25000"
                  value={allowance}
                  onChange={(e) => setAllowance(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uang Transport/Makan (IDR/Hari)</label>
                <input
                  type="number"
                  step="5000"
                  value={dailyTransport}
                  onChange={(e) => setDailyTransport(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Penerima</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {COMMON_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening Payroll</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Contoh: 1234567890 a.n Budi Santoso"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Kewajiban Laporan Pekerjaan (Supervisi / Manager) */}
          <div className="space-y-3 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresWorkReport}
                onChange={(e) => setRequiresWorkReport(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Wajib Mengisi Laporan Pekerjaan Shift (Work Report)
              </span>
            </label>
            <p className="text-[11px] text-slate-600 pl-6">
              Direkomendasikan untuk posisi Manager, Supervisor, Koordinator, atau Lead tim lapangan guna mempertanggungjawabkan capaian shift harian.
            </p>

            {requiresWorkReport && (
              <div className="pl-6 pt-1">
                <label className="block font-semibold text-slate-700 mb-1">Alasan / Catatan Kebijakan:</label>
                <input
                  type="text"
                  value={reportRequirementReason}
                  onChange={(e) => setReportRequirementReason(e.target.value)}
                  placeholder="Contoh: Tanggung Jawab Supervisi Divisi"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              {isEditMode ? 'Simpan Perubahan Karyawan' : 'Daftarkan Karyawan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
