import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Building2,
  Compass,
  FileText,
  Search,
  Filter,
  Check,
  ShieldCheck,
  Send,
  Navigation,
  ExternalLink,
  Sparkles,
  LocateFixed,
  RefreshCw,
  BookmarkPlus
} from 'lucide-react';
import { Employee, TemporaryLocationAssignment } from '../types';
import {
  CityLocation,
  getStoredCities,
  saveCustomCity,
  deleteCustomCity,
  findCityCoordinates
} from '../data/indonesianCities';
import { getCurrentCoordinates, getGpsAccuracyLevel, formatDistance } from '../utils/geo';

interface TemporaryDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  assignments: TemporaryLocationAssignment[];
  onSaveAssignment: (assignment: TemporaryLocationAssignment) => void;
  onUpdateAssignmentStatus?: (id: string, newStatus: 'active' | 'completed' | 'cancelled') => void;
  onUpdateStatus?: (id: string, newStatus: 'active' | 'completed' | 'cancelled') => void;
  onDeleteAssignment: (id: string) => void;
}

export const TemporaryDutyModal: React.FC<TemporaryDutyModalProps> = ({
  isOpen,
  onClose,
  employees,
  assignments,
  onSaveAssignment,
  onUpdateAssignmentStatus,
  onUpdateStatus,
  onDeleteAssignment,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Master Cities State (Built-in + Custom Saved)
  const [citiesList, setCitiesList] = useState<CityLocation[]>([]);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('Semua');

  // Add Custom City Modal / Drawer State
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityProvince, setNewCityProvince] = useState('Jawa Timur');
  const [newCityLat, setNewCityLat] = useState<number | string>('');
  const [newCityLng, setNewCityLng] = useState<number | string>('');
  const [isFetchingAdminGpsForCity, setIsFetchingAdminGpsForCity] = useState(false);
  const [addCityError, setAddCityError] = useState<string | null>(null);
  const [addCitySuccess, setAddCitySuccess] = useState<string | null>(null);

  // Form State for creating new assignment
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Surabaya');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState<number>(-7.2575);
  const [lng, setLng] = useState<number>(112.7521);
  const [radiusMeters, setRadiusMeters] = useState<number>(300);

  // Admin GPS hardware coordinates capture state
  const [isFetchingAdminLocation, setIsFetchingAdminLocation] = useState(false);
  const [adminGpsSuccess, setAdminGpsSuccess] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    accuracyLabel: string;
    time: string;
  } | null>(null);
  const [adminGpsError, setAdminGpsError] = useState<string | null>(null);

  // Auto-detected city notification
  const [autoDetectedCity, setAutoDetectedCity] = useState<CityLocation | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeek);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Load cities from storage on modal open
  useEffect(() => {
    if (isOpen) {
      setCitiesList(getStoredCities());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateAssignmentStatusUnified = (
    id: string,
    newStatus: 'active' | 'completed' | 'cancelled'
  ) => {
    if (onUpdateAssignmentStatus) {
      onUpdateAssignmentStatus(id, newStatus);
    } else if (onUpdateStatus) {
      onUpdateStatus(id, newStatus);
    }
  };

  const handleApplyPreset = (preset: CityLocation) => {
    setCity(preset.name);
    setLat(preset.lat);
    setLng(preset.lng);
    setAutoDetectedCity(preset);
    setAdminGpsSuccess(null);
    setAdminGpsError(null);
    if (!locationName || locationName.startsWith('Kantor Cabang')) {
      setLocationName(`Kantor Cabang / Area Proyek ${preset.name}`);
    }
  };

  // Handle city input typing with automatic coordinate match
  const handleCityInputChange = (typedCity: string) => {
    setCity(typedCity);
    if (!typedCity.trim()) {
      setAutoDetectedCity(null);
      return;
    }

    const matched = findCityCoordinates(typedCity);
    if (matched) {
      setAutoDetectedCity(matched);
    } else {
      setAutoDetectedCity(null);
    }
  };

  // Auto apply coordinates from matched city
  const handleApplyAutoCoords = () => {
    if (!autoDetectedCity) return;
    setLat(autoDetectedCity.lat);
    setLng(autoDetectedCity.lng);
    setCity(autoDetectedCity.name);
    if (!locationName || locationName.startsWith('Kantor Cabang')) {
      setLocationName(`Kantor Cabang / Area Proyek ${autoDetectedCity.name}`);
    }
  };

  // Capture GPS hardware coordinates directly from Admin's current device
  const handleGetAdminDeviceLocation = async () => {
    setIsFetchingAdminLocation(true);
    setAdminGpsError(null);
    try {
      const coords = await getCurrentCoordinates({
        enableHighAccuracy: true,
        timeout: 12000,
      });

      const preciseLat = Number(coords.lat.toFixed(6));
      const preciseLng = Number(coords.lng.toFixed(6));

      setLat(preciseLat);
      setLng(preciseLng);

      const accInfo = getGpsAccuracyLevel(coords.accuracy);
      const currentTimeStr = new Date().toLocaleTimeString('id-ID');

      setAdminGpsSuccess({
        lat: preciseLat,
        lng: preciseLng,
        accuracy: coords.accuracy,
        accuracyLabel: accInfo.label,
        time: currentTimeStr,
      });

      // Suggest location name if empty or default
      if (!locationName || locationName.startsWith('Kantor Cabang') || locationName.startsWith('Titik Lapangan Admin')) {
        setLocationName(`Titik Lapangan Admin (${currentTimeStr.slice(0, 5)})`);
      }
    } catch (err: any) {
      setAdminGpsError(
        err.message ||
          'Gagal membaca sensor GPS dari perangkat Admin. Pastikan akses lokasi (GPS) diizinkan di browser.'
      );
    } finally {
      setIsFetchingAdminLocation(false);
    }
  };

  // Capture GPS hardware coordinates for new custom city registration
  const handleGetAdminDeviceForNewCity = async () => {
    setIsFetchingAdminGpsForCity(true);
    setAddCityError(null);
    try {
      const coords = await getCurrentCoordinates({
        enableHighAccuracy: true,
        timeout: 12000,
      });
      setNewCityLat(coords.lat.toFixed(6));
      setNewCityLng(coords.lng.toFixed(6));
    } catch (err: any) {
      setAddCityError(
        err.message || 'Gagal membaca sensor GPS perangkat admin untuk pendaftaran kota.'
      );
    } finally {
      setIsFetchingAdminGpsForCity(false);
    }
  };

  // Save new custom city
  const handleSaveNewCity = (e: React.FormEvent) => {
    e.preventDefault();
    setAddCityError(null);
    setAddCitySuccess(null);

    if (!newCityName.trim()) {
      setAddCityError('Nama kota wajib diisi.');
      return;
    }

    const latitudeNum = parseFloat(String(newCityLat));
    const longitudeNum = parseFloat(String(newCityLng));

    if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
      setAddCityError('Koordinat Latitude & Longitude harus berupa angka yang valid.');
      return;
    }

    const updated = saveCustomCity({
      name: newCityName.trim(),
      province: newCityProvince.trim(),
      lat: latitudeNum,
      lng: longitudeNum,
    });

    setCitiesList(updated);
    setAddCitySuccess(`Kota "${newCityName.trim()}" berhasil disimpan ke daftar penugasan.`);

    // Automatically apply to active form
    setCity(newCityName.trim());
    setLat(latitudeNum);
    setLng(longitudeNum);
    if (!locationName || locationName.startsWith('Kantor Cabang')) {
      setLocationName(`Area Proyek / Kantor Cabang ${newCityName.trim()}`);
    }

    // Reset fields after 1 second
    setTimeout(() => {
      setIsAddCityOpen(false);
      setAddCitySuccess(null);
      setNewCityName('');
      setNewCityLat('');
      setNewCityLng('');
    }, 1200);
  };

  // Delete custom city
  const handleDeleteCustomCity = (cityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Hapus kota kustom "${cityName}" dari daftar penugasan?`)) {
      const updated = deleteCustomCity(cityName);
      setCitiesList(updated);
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emp = employees.find((x) => x.id === selectedEmpId);
    if (!emp) {
      setFormError('Pilih karyawan yang sah.');
      return;
    }

    if (!title.trim()) {
      setFormError('Judul penugasan wajib diisi.');
      return;
    }

    if (!locationName.trim()) {
      setFormError('Nama lokasi spesifik wajib diisi.');
      return;
    }

    if (startDate > endDate) {
      setFormError('Tanggal mulai tidak boleh melebihi tanggal selesai.');
      return;
    }

    const newAssignment: TemporaryLocationAssignment = {
      id: `DUTY-${Date.now().toString().slice(-6)}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      title: title.trim(),
      locationName: locationName.trim(),
      city: city.trim(),
      lat: Number(lat),
      lng: Number(lng),
      radiusMeters: Number(radiusMeters),
      startDate,
      endDate,
      status: 'active',
      assignedBy: 'Administrator HRD',
      assignedAt: new Date().toLocaleString('id-ID'),
      notes: notes.trim(),
    };

    onSaveAssignment(newAssignment);
    setActiveTab('list');
    // Reset fields
    setTitle('');
    setLocationName('');
    setNotes('');
    setAdminGpsSuccess(null);
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.employeeName.toLowerCase().includes(q) ||
        a.employeeId.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.locationName.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter cities for presets
  const filteredPresetCities = citiesList.filter((c) => {
    if (regionFilter === 'Kustom' && !c.isCustom) return false;
    if (regionFilter !== 'Semua' && regionFilter !== 'Kustom') {
      const prov = c.province.toLowerCase();
      if (regionFilter === 'Jawa' && !prov.includes('jawa') && !prov.includes('jakarta') && !prov.includes('yogyakarta') && !prov.includes('banten')) {
        return false;
      }
      if (regionFilter === 'Sumatera' && !prov.includes('sumatera') && !prov.includes('riau') && !prov.includes('aceh') && !prov.includes('lampung') && !prov.includes('jambi') && !prov.includes('bengkulu') && !prov.includes('belitung')) {
        return false;
      }
      if (regionFilter === 'Kalimantan' && !prov.includes('kalimantan')) {
        return false;
      }
      if (regionFilter === 'Sulawesi' && !prov.includes('sulawesi') && !prov.includes('gorontalo')) {
        return false;
      }
      if (regionFilter === 'Bali & Nusa' && !prov.includes('bali') && !prov.includes('nusa')) {
        return false;
      }
      if (regionFilter === 'Maluku & Papua' && !prov.includes('maluku') && !prov.includes('papua')) {
        return false;
      }
    }

    if (citySearchQuery.trim()) {
      const q = citySearchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.province.toLowerCase().includes(q);
    }
    return true;
  });

  const customCitiesCount = citiesList.filter((c) => c.isCustom).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Penugasan Khusus Absensi Luar Kota</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Geofence Otomatis & GPS Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Atur titik koordinat GPS sementara, tambahkan kota tujuan, atau ambil koordinat langsung dari perangkat Admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-200 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-4 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daftar Penugasan ({assignments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`px-4 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Buat Penugasan Baru</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari karyawan, kota, tugas..."
                  className="w-full pl-8 pr-3 py-1 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Belum Ada Penugasan Luar Kota</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Karyawan yang ditugaskan dinas luar kota akan dapat melakukan presensi check-in/out di koordinat khusus lokasi penugasan jika terdaftar di sini.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Penugasan Sekarang</span>
                  </button>
                </div>
              ) : (
                filteredAssignments.map((assignment) => {
                  const isCurrentlyActive =
                    assignment.status === 'active' &&
                    todayStr >= assignment.startDate &&
                    todayStr <= assignment.endDate;

                  return (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-slate-400">
                            {assignment.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              assignment.status === 'active'
                                ? isCurrentlyActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : assignment.status === 'completed'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCurrentlyActive
                                  ? 'bg-emerald-500 animate-pulse'
                                  : assignment.status === 'active'
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>
                              {assignment.status === 'active'
                                ? isCurrentlyActive
                                  ? 'Sedang Aktif Hari Ini'
                                  : 'Terjadwal'
                                : assignment.status === 'completed'
                                ? 'Selesai'
                                : 'Dibatalkan'}
                            </span>
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            {assignment.city}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{assignment.title}</h4>
                          <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-800">{assignment.employeeName}</strong> ({assignment.employeeId}) • {assignment.department}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{assignment.locationName}</span>
                          </span>
                          <span className="font-mono text-slate-600 flex items-center gap-1">
                            <span>GPS: {assignment.lat.toFixed(4)}, {assignment.lng.toFixed(4)}</span>
                            <span className="text-slate-400">(Radius {assignment.radiusMeters}m)</span>
                            <a
                              href={`https://www.google.com/maps?q=${assignment.lat},${assignment.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center"
                              title="Buka Peta Google Maps"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Calendar className="w-3 h-3 text-emerald-600" />
                            <span>{assignment.startDate} s/d {assignment.endDate}</span>
                          </span>
                        </div>

                        {assignment.notes && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                            "{assignment.notes}"
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        {assignment.status === 'active' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateAssignmentStatusUnified(assignment.id, 'completed')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="Tandai Selesai"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Selesai</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateAssignmentStatusUnified(assignment.id, 'cancelled')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                              title="Batalkan Penugasan"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateAssignmentStatusUnified(assignment.id, 'active')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition cursor-pointer"
                          >
                            Aktifkan Kembali
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteAssignment(assignment.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECTION: Preset Kota & Tambah Kota Baru */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <span>Katalog Kota Penugasan & Koordinat Otomatis:</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddCityOpen(!isAddCityOpen);
                      setAddCityError(null);
                      setAddCitySuccess(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Kota Penugasan Baru</span>
                  </button>
                </div>

                {/* Inline Form / Modal: Tambah Kota Baru */}
                {isAddCityOpen && (
                  <div className="p-4 bg-white rounded-xl border-2 border-emerald-500/30 shadow-sm space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                        <BookmarkPlus className="w-4 h-4 text-emerald-600" />
                        <span>Form Pendaftaran Kota Penugasan Baru</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddCityOpen(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {addCityError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span>{addCityError}</span>
                      </div>
                    )}

                    {addCitySuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>{addCitySuccess}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Nama Kota / Wilayah <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCityName}
                          onChange={(e) => setNewCityName(e.target.value)}
                          placeholder="Contoh: Labuan Bajo, Morowali, Tarakan"
                          className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Provinsi / Pulau
                        </label>
                        <input
                          type="text"
                          value={newCityProvince}
                          onChange={(e) => setNewCityProvince(e.target.value)}
                          placeholder="Contoh: NTT, Sulawesi Tengah, Kaltim"
                          className="w-full p-2 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Latitude Titik Kota <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={newCityLat}
                          onChange={(e) => setNewCityLat(e.target.value)}
                          placeholder="-8.4964"
                          className="w-full p-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Longitude Titik Kota <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={newCityLng}
                          onChange={(e) => setNewCityLng(e.target.value)}
                          placeholder="119.8877"
                          className="w-full p-2 rounded-lg border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleGetAdminDeviceForNewCity}
                        disabled={isFetchingAdminGpsForCity}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                        title="Ambil koordinat sensor GPS admin untuk mengisi koordinat kota baru"
                      >
                        <LocateFixed className={`w-3.5 h-3.5 text-emerald-600 ${isFetchingAdminGpsForCity ? 'animate-spin' : ''}`} />
                        <span>{isFetchingAdminGpsForCity ? 'Membaca GPS Admin...' : 'Isi dari GPS Perangkat Admin Saat Ini'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddCityOpen(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNewCity}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Simpan Kota</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters & Search for City Presets */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      placeholder="Cari preset kota (misal: Batam, Solo, Denpasar)..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {['Semua', 'Jawa', 'Sumatera', 'Kalimantan', 'Sulawesi', 'Bali & Nusa', 'Maluku & Papua', 'Kustom'].map((reg) => (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setRegionFilter(reg)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          regionFilter === reg
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {reg === 'Kustom' ? `Kota Kustom (${customCitiesCount})` : reg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset City Buttons List */}
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {filteredPresetCities.map((preset) => {
                    const isSelected = city === preset.name;
                    return (
                      <div
                        key={preset.name}
                        onClick={() => handleApplyPreset(preset)}
                        className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{preset.name}</span>
                        {preset.isCustom ? (
                          <span className={`text-[9px] px-1 rounded font-bold ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-amber-100 text-amber-800'}`}>
                            Kustom
                          </span>
                        ) : (
                          <span className={`text-[9px] ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                            ({preset.province.slice(0, 10)})
                          </span>
                        )}

                        {preset.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomCity(preset.name, e)}
                            className={`p-0.5 rounded hover:bg-rose-500 hover:text-white transition ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}
                            title="Hapus kota kustom ini"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Core Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Employee Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Karyawan yang Ditugaskan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.id}) — {emp.department} / {emp.position}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duty Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama / Judul Penugasan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Instalasi Server Proyek Surabaya"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                {/* City and Location Name */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 mb-1">
                    Kota / Wilayah Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="city-suggestions"
                      value={city}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      placeholder="Surabaya, Bandung, Medan, Labuan Bajo..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                    <datalist id="city-suggestions">
                      {citiesList.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.province}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* Auto-detect notification pill */}
                  {autoDetectedCity && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-[11px] text-emerald-900 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Koordinat terdaftar untuk <strong>{autoDetectedCity.name}</strong> ({autoDetectedCity.province})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyAutoCoords}
                        className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition cursor-pointer shrink-0"
                      >
                        Terapkan Otomatis
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lokasi / Alamat Spesifik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Contoh: Gedung Rungkut Industri Blok C-2"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* SECTION: AMBIL KOORDINAT DARI PERANGKAT ADMIN & INPUT KOORDINAT */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50 border border-emerald-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <LocateFixed className="w-4 h-4 text-emerald-700" />
                      <span>Titik Koordinat GPS Penugasan (Geofence Khusus)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Anda dapat mengisi manual, memilih preset kota otomatis, atau mengambil koordinat langsung dari sensor satelit GPS perangkat Admin.
                    </p>
                  </div>

                  {/* TOMBOL UTAMA: AMBIL KOORDINAT DARI PERANGKAT ADMIN */}
                  <button
                    type="button"
                    onClick={handleGetAdminDeviceLocation}
                    disabled={isFetchingAdminLocation}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    <Compass className={`w-4 h-4 ${isFetchingAdminLocation ? 'animate-spin text-emerald-200' : 'text-emerald-300'}`} />
                    <span>
                      {isFetchingAdminLocation
                        ? 'Membaca Satelit GPS Admin...'
                        : '🛰️ Ambil Koordinat dari Perangkat Admin'}
                    </span>
                  </button>
                </div>

                {/* Admin GPS Success Card */}
                {adminGpsSuccess && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Koordinat Terkunci dari Sensor GPS Perangkat Admin</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>Lat: <strong>{adminGpsSuccess.lat}</strong></span>
                        <span>Lng: <strong>{adminGpsSuccess.lng}</strong></span>
                        <span className="text-emerald-700 font-semibold">
                          Akurasi Satelit: ±{Math.round(adminGpsSuccess.accuracy)}m ({adminGpsSuccess.accuracyLabel})
                        </span>
                        <span className="text-slate-400">Pukul {adminGpsSuccess.time}</span>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${adminGpsSuccess.lat},${adminGpsSuccess.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-[11px] hover:bg-emerald-100 transition shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verifikasi di Peta</span>
                    </a>
                  </div>
                )}

                {/* Admin GPS Error Card */}
                {adminGpsError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{adminGpsError}</span>
                  </div>
                )}

                {/* Coordinate Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Latitude Titik Presensi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={lat}
                      onChange={(e) => {
                        setLat(parseFloat(e.target.value));
                        setAdminGpsSuccess(null);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Longitude Titik Presensi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={lng}
                      onChange={(e) => {
                        setLng(parseFloat(e.target.value));
                        setAdminGpsSuccess(null);
                      }}
                      className="w-full p-2 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Radius Geofence Presensi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={radiusMeters}
                      onChange={(e) => setRadiusMeters(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value={100}>100 Meter (Gedung Standar)</option>
                      <option value={200}>200 Meter (Pabrik / Kompleks)</option>
                      <option value={300}>300 Meter (Area Industri)</option>
                      <option value={500}>500 Meter (Zona Proyek Luas)</option>
                      <option value={1000}>1.000 Meter (1 KM - Lapangan)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Range & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Mulai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Selesai <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Notes / Surat Tugas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Surat Tugas / Keterangan Penugasan
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: No. SPT/2026/OPS-0920 - Pemasangan Jaringan"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Terbitkan Penugasan Khusus</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Presensi karyawan otomatis tervalidasi di titik khusus ini selama periode penugasan berlangsung.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
