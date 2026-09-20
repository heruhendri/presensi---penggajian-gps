import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Edit3,
  Shield,
  Clock,
  DollarSign,
  Building,
  Phone,
  Mail,
  CreditCard,
  Sparkles,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Employee, Shift } from '../types';
import { generateUniqueEmployeeId, isEmployeeIdTaken } from '../utils/employeeUtils';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee, originalId?: string) => void;
  employeeToEdit?: Employee | null;
  employee?: Employee | null; // Compatibility with both prop names
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
  employee,
  existingEmployees,
  shifts,
}) => {
  // Resolve either prop so edit mode is never broken
  const activeEmployee = employeeToEdit || employee;
  const isEditMode = Boolean(activeEmployee);

  // Generate next unique ID
  const defaultNextId = () => {
    return generateUniqueEmployeeId(existingEmployees);
  };

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('karyawan123');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [customDepartment, setCustomDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [currentShiftId, setCurrentShiftId] = useState(shifts[0]?.id || 'shift-1');

  // Salary system: 'monthly' (Gaji Pokok Bulanan) or 'daily' (Upah Harian Berdasarkan Absensi)
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily'>('monthly');
  const [baseSalary, setBaseSalary] = useState<number>(5500000);
  const [allowance, setAllowance] = useState<number>(750000);
  const [dailyTransport, setDailyTransport] = useState<number>(35000);
  const [bankName, setBankName] = useState('BCA');
  const [bankAccount, setBankAccount] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [requiresWorkReport, setRequiresWorkReport] = useState<boolean>(false);
  const [reportRequirementReason, setReportRequirementReason] = useState(
    'Tanggung Jawab Supervisi / Output Shift'
  );

  // Custom working hours toggle
  const [useCustomHours, setUseCustomHours] = useState<boolean>(false);
  const [customStartTime, setCustomStartTime] = useState('08:00');
  const [customEndTime, setCustomEndTime] = useState('17:00');

  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize state whenever modal opens or target employee changes
  useEffect(() => {
    if (isOpen) {
      if (activeEmployee) {
        setId(activeEmployee.id);
        setName(activeEmployee.name);
        setUsername(activeEmployee.username);
        setPhone(activeEmployee.phone);
        setPassword(activeEmployee.password);
        setEmail(activeEmployee.email);
        setDepartment(DEPARTMENTS.includes(activeEmployee.department) ? activeEmployee.department : 'OTHER');
        setCustomDepartment(DEPARTMENTS.includes(activeEmployee.department) ? '' : activeEmployee.department);
        setPosition(activeEmployee.position);
        setCurrentShiftId(activeEmployee.currentShiftId || shifts[0]?.id || 'shift-1');
        
        const empSalaryType = activeEmployee.salaryType || 'monthly';
        setSalaryType(empSalaryType);
        setBaseSalary(empSalaryType === 'daily' ? (activeEmployee.dailyRate || activeEmployee.baseSalary || 200000) : (activeEmployee.baseSalary ?? 5500000));
        setAllowance(activeEmployee.allowance ?? 750000);
        setDailyTransport(activeEmployee.dailyTransport ?? 35000);
        setBankName(activeEmployee.bankName || 'BCA');
        setBankAccount(activeEmployee.bankAccount || '');
        setIsActive(activeEmployee.isActive !== false);
        setRequiresWorkReport(Boolean(activeEmployee.requiresWorkReport));
        setReportRequirementReason(
          activeEmployee.reportRequirementReason || 'Tanggung Jawab Supervisi / Output Shift'
        );
        setUseCustomHours(Boolean(activeEmployee.customHours));
        setCustomStartTime(activeEmployee.customHours?.startTime || '08:00');
        setCustomEndTime(activeEmployee.customHours?.endTime || '17:00');
      } else {
        setId(defaultNextId());
        setName('');
        setUsername('');
        setPhone('');
        setPassword('karyawan123');
        setEmail('');
        setDepartment(DEPARTMENTS[0]);
        setCustomDepartment('');
        setPosition('');
        setCurrentShiftId(shifts[0]?.id || 'shift-1');
        setSalaryType('monthly');
        setBaseSalary(5500000);
        setAllowance(750000);
        setDailyTransport(35000);
        setBankName('BCA');
        setBankAccount('');
        setIsActive(true);
        setRequiresWorkReport(false);
        setReportRequirementReason('Tanggung Jawab Supervisi / Output Shift');
        setUseCustomHours(false);
        setCustomStartTime('08:00');
        setCustomEndTime('17:00');
      }
      setShowPassword(false);
      setErrorMsg('');
    }
  }, [isOpen, activeEmployee]);

  // Auto-detect work report requirement recommendation on position change
  useEffect(() => {
    if (!isEditMode && position) {
      const lower = position.toLowerCase();
      if (
        lower.includes('supervisor') ||
        lower.includes('spv') ||
        lower.includes('manager') ||
        lower.includes('lead') ||
        lower.includes('kepala')
      ) {
        setRequiresWorkReport(true);
        setReportRequirementReason(`Jabatan Struktural: ${position}`);
      }
    }
  }, [position, isEditMode]);

  // When switching salaryType on new employee, provide sensible default
  const handleSalaryTypeChange = (newType: 'monthly' | 'daily') => {
    setSalaryType(newType);
    if (!isEditMode) {
      if (newType === 'daily' && baseSalary > 1000000) {
        setBaseSalary(200000); // 200rb / hari
      } else if (newType === 'monthly' && baseSalary < 1000000) {
        setBaseSalary(5500000); // 5.5jt / bln
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const formattedId = id.trim().toUpperCase();
    if (!formattedId) {
      setErrorMsg('ID Karyawan wajib diisi (contoh: EMP001)');
      return;
    }

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

    // Check ID conflict with other employees
    const isIdInUseByOther = existingEmployees.some(
      (emp) =>
        emp.id.toUpperCase() === formattedId &&
        emp.id.toUpperCase() !== activeEmployee?.id.toUpperCase()
    );
    if (isIdInUseByOther) {
      setErrorMsg(
        `ID Karyawan "${formattedId}" sudah terdaftar pada karyawan lain. Gunakan ID yang unik.`
      );
      return;
    }

    const finalDepartment =
      department === 'OTHER' ? customDepartment.trim() || 'Umum' : department;

    const salaryVal = Number(baseSalary) || 0;

    const newEmployee: Employee = {
      id: formattedId,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      phone: phone.trim(),
      password: password.trim() || 'karyawan123',
      email: email.trim() || `${username.trim().toLowerCase()}@company.id`,
      department: finalDepartment,
      position: position.trim(),
      currentShiftId,
      salaryType,
      baseSalary: salaryVal,
      dailyRate: salaryType === 'daily' ? salaryVal : undefined,
      allowance: Number(allowance) || 0,
      dailyTransport: Number(dailyTransport) || 0,
      bankName,
      bankAccount: bankAccount.trim(),
      isActive,
      requiresWorkReport,
      reportRequirementReason: requiresWorkReport ? reportRequirementReason : undefined,
      customHours: useCustomHours
        ? { startTime: customStartTime, endTime: customEndTime }
        : undefined,
    };

    onSave(newEmployee, activeEmployee?.id);
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
                {isEditMode
                  ? `Memperbarui profil ${activeEmployee?.name} (${activeEmployee?.id})`
                  : 'Daftarkan karyawan baru ke dalam sistem HRD'}
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
            <div className="flex items-center justify-between border-b pb-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                1. Identitas & Kredensial Login
              </h4>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-semibold">Status Karyawan Aktif</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    ID Karyawan (Harus Unik){' '}
                    {isEditMode && (
                      <span className="text-[10px] text-indigo-600 font-normal ml-1">
                        (Bisa dikoreksi)
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={() => setId(defaultNextId())}
                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer underline"
                    title="Buat ID unik baru otomatis"
                  >
                    + Buat ID Unik Baru
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value.toUpperCase().trim())}
                    placeholder="Contoh: EMP001"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {/* Real-time Unique ID validation indicator */}
                <div className="mt-1">
                  {(() => {
                    const formattedTrimmed = id.trim().toUpperCase();
                    if (!formattedTrimmed) {
                      return <span className="text-[10px] text-rose-500 font-medium">⚠️ ID wajib diisi.</span>;
                    }
                    const conflictEmp = existingEmployees.find(
                      (emp) =>
                        emp.id.trim().toUpperCase() === formattedTrimmed &&
                        emp.id.trim().toUpperCase() !== (activeEmployee?.id || '').trim().toUpperCase()
                    );
                    if (conflictEmp) {
                      return (
                        <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                          ⚠️ ID sudah digunakan oleh {conflictEmp.name} ({conflictEmp.department}). Gunakan ID lain.
                        </span>
                      );
                    }
                    return (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        ✓ ID Unik &amp; Dapat Digunakan
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="budi.santoso"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password Login
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata sandi akun"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Perusahaan</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@perusahaan.id"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Departemen, Posisi & Shift */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              2. Divisi, Posisi & Jadwal Shift
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departemen / Divisi</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
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
                <label className="block font-semibold text-slate-700 mb-1">Pilihan Master Shift Kerja</label>
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
                    Gunakan Jam Kerja Khusus (Kustom Jam Masuk & Pulang)
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

          {/* Section 3: Skema Penggajian: Bulanan vs Harian */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 border-b pb-1">
              3. Skema Penggajian & Komponen Upah
            </h4>

            {/* Salary Type Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Tipe / Skema Penggajian Karyawan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSalaryTypeChange('monthly')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                    salaryType === 'monthly'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 ${salaryType === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Gaji Bulanan (Tetap)</span>
                      {salaryType === 'monthly' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Gaji pokok dibayarkan bulanan secara utuh, ditambah transport harian dan lembur.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSalaryTypeChange('daily')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                    salaryType === 'daily'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mt-0.5 ${salaryType === 'daily' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Gaji Harian (Upah Presensi)</span>
                      {salaryType === 'daily' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Upah pokok dihitung per hari hadir (Total = Hari Hadir × Upah Harian). Cocok untuk staf lapangan & harian.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {salaryType === 'daily' ? 'Upah Pokok Harian (IDR / Hari)' : 'Gaji Pokok Bulanan (IDR / Bulan)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={salaryType === 'daily' ? '10000' : '50000'}
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {salaryType === 'daily'
                    ? 'Dihitung per hari presensi hadir'
                    : 'Gaji pokok bulanan tetap'}
                </span>
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
                <span className="text-[10px] text-slate-500 mt-0.5 block">Tunjangan bulanan / operasional</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uang Transport & Makan (IDR/Hari)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={dailyTransport}
                  onChange={(e) => setDailyTransport(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Diberikan setiap hari hadir</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Payroll</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {COMMON_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
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
              Direkomendasikan untuk posisi Manager, Supervisor, Koordinator, atau Lead tim lapangan guna
              mempertanggungjawabkan capaian shift harian.
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
