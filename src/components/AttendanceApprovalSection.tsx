import React, { useState } from 'react';
import { 
  Plane, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  Search, 
  Filter, 
  User, 
  Building2,
  FileText,
  Calendar,
  ShieldCheck,
  Check,
  X,
  Compass
} from 'lucide-react';
import { AttendanceRecord, CompanyConfig, Employee } from '../types';
import { formatDistance } from '../utils/geo';

interface AttendanceApprovalSectionProps {
  attendanceRecords: AttendanceRecord[];
  employees: Employee[];
  config: CompanyConfig;
  onApprove: (recordId: string, adminNotes?: string) => void;
  onReject: (recordId: string, rejectionReason: string) => void;
}

export const AttendanceApprovalSection: React.FC<AttendanceApprovalSectionProps> = ({
  attendanceRecords,
  employees,
  config,
  onApprove,
  onReject,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForReject, setSelectedRecordForReject] = useState<AttendanceRecord | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Filter records that are remote / out of island
  const remoteRecords = attendanceRecords.filter(
    (r) => r.isRemoteOrOutIsland || r.status === 'menunggu_persetujuan' || r.approvalStatus
  );

  const pendingCount = remoteRecords.filter((r) => r.approvalStatus === 'pending' || r.status === 'menunggu_persetujuan').length;
  const approvedCount = remoteRecords.filter((r) => r.approvalStatus === 'approved').length;
  const rejectedCount = remoteRecords.filter((r) => r.approvalStatus === 'rejected').length;

  const filteredList = remoteRecords.filter((r) => {
    const isPending = r.approvalStatus === 'pending' || r.status === 'menunggu_persetujuan';
    const isApproved = r.approvalStatus === 'approved';
    const isRejected = r.approvalStatus === 'rejected';

    if (filterStatus === 'pending' && !isPending) return false;
    if (filterStatus === 'approved' && !isApproved) return false;
    if (filterStatus === 'rejected' && !isRejected) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.employeeName.toLowerCase().includes(q) ||
        r.employeeId.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        (r.remoteReasonNotes || '').toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => (b.date + (b.checkInTime || '')).localeCompare(a.date + (a.checkInTime || '')));

  const handleConfirmReject = () => {
    if (!selectedRecordForReject) return;
    if (!rejectReasonInput.trim()) {
      alert('Mohon masukkan alasan penolakan presensi luar.');
      return;
    }
    onReject(selectedRecordForReject.id, rejectReasonInput.trim());
    setSelectedRecordForReject(null);
    setRejectReasonInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
            <Plane className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">
                Persetujuan Absen Luar Radius & Luar Pulau
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 animate-pulse">
                  {pendingCount} Menunggu
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Tinjau pengajuan presensi karyawan yang sedang bertugas di luar kota, pulau lain, atau di luar jangkauan geofence kantor ({config.companyName}).
            </p>
          </div>
        </div>

        {/* Quick Stats in Banner */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Menunggu</div>
            <div className="text-lg font-black text-amber-400">{pendingCount}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Disetujui</div>
            <div className="text-lg font-black text-emerald-400">{approvedCount}</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Ditolak</div>
            <div className="text-lg font-black text-rose-400">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disetujui ({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak ({rejectedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Semua Riwayat ({remoteRecords.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, ID, atau alasan..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900"
          />
        </div>
      </div>

      {/* Cards List of Remote Attendances */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tidak Ada Pengajuan yang Memerlukan Tindakan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {filterStatus === 'pending'
              ? 'Semua pengajuan presensi luar radius dan luar pulau telah ditinjau dan diverifikasi.'
              : 'Tidak ditemukan data pengajuan sesuai filter yang dipilih.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredList.map((record) => {
            const isPending = record.approvalStatus === 'pending' || record.status === 'menunggu_persetujuan';
            const isApproved = record.approvalStatus === 'approved';
            const isRejected = record.approvalStatus === 'rejected';

            const dist = record.checkInDistanceMeters || 0;
            const hasCoords = Boolean(record.checkInLat && record.checkInLng);
            const gmapsUrl = hasCoords 
              ? `https://www.google.com/maps?q=${record.checkInLat},${record.checkInLng}`
              : null;
            const gmapsRouteUrl = hasCoords
              ? `https://www.google.com/maps/dir/?api=1&origin=${record.checkInLat},${record.checkInLng}&destination=${config.officeLat},${config.officeLng}`
              : null;

            return (
              <div 
                key={record.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-300 transition"
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{record.date}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isApproved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {isPending ? 'Menunggu Persetujuan' : isApproved ? 'Disetujui Admin' : 'Ditolak'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{record.employeeName}</h3>
                    <p className="text-xs text-slate-500 font-mono">{record.employeeId} • {record.department}</p>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 shrink-0">
                    <Plane className="w-3.5 h-3.5" />
                    <span>{formatDistance(dist)}</span>
                  </span>
                </div>

                {/* Reason & Location Details */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>Tipe Penugasan:</span>
                    <span className="capitalize text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {(record.remoteReasonType || 'dinas_luar_kota').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Keterangan / Alasan Tugas:</span>
                    <p className="text-slate-900 font-medium mt-0.5 bg-white p-2 rounded-lg border border-slate-200/80">
                      {record.remoteReasonNotes || record.notes || 'Tidak ada catatan tambahan'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span>Jam Check-In: <strong className="font-mono text-slate-900">{record.checkInTime || '-'}</strong></span>
                    {hasCoords && (
                      <span className="font-mono text-slate-500">
                        {record.checkInLat?.toFixed(4)}, {record.checkInLng?.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Photo attachment preview if any */}
                {record.remoteAttachmentPhoto && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-700 block">Lampiran Bukti Lapangan / Foto:</span>
                    <div 
                      onClick={() => setPreviewPhotoUrl(record.remoteAttachmentPhoto || null)}
                      className="cursor-pointer rounded-xl border border-slate-200 overflow-hidden max-h-36 bg-slate-950 flex items-center justify-center hover:opacity-95 transition"
                    >
                      <img 
                        src={record.remoteAttachmentPhoto} 
                        alt="Bukti Dinas" 
                        className="max-h-36 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Google Maps Actions */}
                {hasCoords && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                    <a
                      href={gmapsUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    <a
                      href={gmapsRouteUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
                    >
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Rute ke Kantor</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                )}

                {/* Approval Action Footer */}
                {isPending ? (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedRecordForReject(record)}
                      className="py-2 px-3.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprove(record.id)}
                      className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui Presensi</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>
                      {isApproved ? 'Diverifikasi oleh:' : 'Ditolak karena:'} <strong className="text-slate-800">{isApproved ? (record.approvedBy || 'Admin HRD') : (record.rejectionReason || 'Tidak memenuhi kriteria')}</strong>
                    </span>
                    {record.approvedAt && (
                      <span className="font-mono text-slate-500">{record.approvedAt}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal Prompt */}
      {selectedRecordForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Tolak Presensi Luar Radius</h3>
                <p className="text-xs text-slate-500">{selectedRecordForReject.employeeName} ({selectedRecordForReject.date})</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-800">
                Alasan Penolakan:
              </label>
              <textarea
                required
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Contoh: Tidak ada surat tugas resmi yang terkonfirmasi oleh pimpinan divisi."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecordForReject(null);
                  setRejectReasonInput('');
                }}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div 
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
            <img src={previewPhotoUrl} alt="Preview Bukti" className="max-w-full max-h-[85vh] object-contain mx-auto" />
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
