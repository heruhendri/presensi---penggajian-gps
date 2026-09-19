import React, { useState } from 'react';
import { 
  Plane, 
  MapPin, 
  Building2, 
  Upload, 
  Camera, 
  FileCheck, 
  AlertCircle, 
  X, 
  Send,
  Navigation,
  Briefcase,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Employee, CompanyConfig } from '../types';
import { formatDistance } from '../utils/geo';

interface RemoteAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  config: CompanyConfig;
  currentLat: number;
  currentLng: number;
  distanceToOffice: number;
  accuracy: number;
  onSubmit: (data: {
    reasonType: 'dinas_luar_kota' | 'luar_pulau' | 'kunjungan_klien' | 'wfh_remote' | 'proyek_lapangan' | 'lainnya';
    notes: string;
    photoAttachment?: string;
  }) => void;
}

export const RemoteAttendanceModal: React.FC<RemoteAttendanceModalProps> = ({
  isOpen,
  onClose,
  employee,
  config,
  currentLat,
  currentLng,
  distanceToOffice,
  accuracy,
  onSubmit,
}) => {
  const [reasonType, setReasonType] = useState<'dinas_luar_kota' | 'luar_pulau' | 'kunjungan_klien' | 'wfh_remote' | 'proyek_lapangan' | 'lainnya'>('luar_pulau');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isOutOfIsland = distanceToOffice > 150000; // > 150 km typically across province / islands in Indonesia

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert('Silakan tuliskan keterangan atau alasan penugasan luar radius/pulau.');
      return;
    }

    setIsSubmitting(true);
    onSubmit({
      reasonType,
      notes: notes.trim(),
      photoAttachment: photoPreview || undefined,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Form Absen Luar Radius / Luar Pulau</h3>
              <p className="text-xs text-indigo-200">Pengajuan presensi khusus dengan persetujuan Admin HRD</p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* GPS Location Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                <Navigation className="w-4 h-4 text-indigo-400" />
                <span>Titik GPS Terdeteksi Saat Ini</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isOutOfIsland ? 'bg-purple-500/30 text-purple-300 border border-purple-400/40' : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
              }`}>
                {isOutOfIsland ? 'Terdeteksi Luar Pulau / Kota' : 'Luar Radius Kantor'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1 border-t border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block font-sans text-[10px]">Koordinat:</span>
                <span>{currentLat.toFixed(5)}, {currentLng.toFixed(5)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[10px]">Jarak ke Kantor Pusat:</span>
                <span className="font-bold text-amber-400">{formatDistance(distanceToOffice)}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400">
              Pusat Kantor: {config.companyName} ({config.officeRadiusMeters}m radius geofence resmi)
            </div>
          </div>

          {/* Workflow Alert */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Absen di luar radius resmi atau di luar pulau akan berstatus <strong>Menunggu Persetujuan (Pending)</strong> hingga Admin HRD memvalidasi alasan dan bukti penugasan Anda.
            </p>
          </div>

          {/* Reason Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Jenis Keperluan / Penugasan Luar:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'luar_pulau', label: 'Dinas Luar Pulau / Antar Kota', icon: '✈️' },
                { id: 'dinas_luar_kota', label: 'Dinas Lapangan / Site Cabang', icon: '🏢' },
                { id: 'kunjungan_klien', label: 'Kunjungan Klien / Mitra', icon: '🤝' },
                { id: 'proyek_lapangan', label: 'Pekerjaan Proyek Lapangan', icon: '🏗️' },
                { id: 'wfh_remote', label: 'Work From Home (WFH) Terjadwal', icon: '🏠' },
                { id: 'lainnya', label: 'Tugas Operasional Lainnya', icon: '📋' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setReasonType(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    reasonType === item.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-800">
              Keterangan Tugas & Alamat Lokasi Dinas <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Penugasan audit cabang logistik Surabaya selama 3 hari. Menginap di Hotel X, koordinasi dengan PIC Bpk. Ahmad."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Photo Attachment / Selfie Proof (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Lampiran Bukti Foto Lokasi / Surat Tugas (Opsional)
            </label>
            
            {photoPreview ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900 max-h-48 flex items-center justify-center">
                <img src={photoPreview} alt="Bukti penugasan" className="max-h-48 object-contain" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition"
                  title="Hapus foto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition hover:bg-slate-50">
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="font-semibold text-slate-700 text-xs">Ambil Foto / Unggah Bukti Lapangan</span>
                <span className="text-[10px] text-slate-400">JPG, PNG atau WebP (Selfie lokasi atau foto surat tugas)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pengajuan ke Admin HRD</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
