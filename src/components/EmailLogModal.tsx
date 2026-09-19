import React, { useState } from 'react';
import { Mail, CheckCircle, Clock, X, Send, Eye, Shield } from 'lucide-react';
import { EmailLog } from '../types';

interface EmailLogModalProps {
  isOpen: boolean;
  emailLogs: EmailLog[];
  onClose: () => void;
  adminEmail: string;
}

export const EmailLogModal: React.FC<EmailLogModalProps> = ({
  isOpen,
  emailLogs,
  onClose,
  adminEmail,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base">Log Notifikasi Email Real-Time</h3>
              <p className="text-xs text-slate-400">
                Pembaruan data signifikan otomatis diteruskan ke email admin & karyawan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Target Email Admin HRD: <strong className="text-slate-900">{adminEmail}</strong></span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
            Real-Time Engine Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 max-h-[480px]">
          {/* Left: Email List */}
          <div className="overflow-y-auto max-h-[480px] divide-y divide-slate-100">
            {emailLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Belum ada aktivitas email tercatat.
              </div>
            ) : (
              emailLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedEmail(log)}
                  className={`p-4 text-xs cursor-pointer hover:bg-slate-50 transition space-y-1 ${
                    selectedEmail?.id === log.id ? 'bg-blue-50/70 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                      {log.to}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800 truncate">{log.subject}</div>
                  <div className="text-[11px] text-slate-500 truncate">{log.bodySnippet}</div>
                </div>
              ))
            )}
          </div>

          {/* Right: Email Detail Viewer */}
          <div className="p-5 overflow-y-auto max-h-[480px] bg-white">
            {selectedEmail ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Kepada:</span>
                    <span className="font-bold text-slate-900">{selectedEmail.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Subjek:</span>
                    <span className="font-bold text-slate-900">{selectedEmail.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Waktu Kirim:</span>
                    <span className="text-slate-700">{selectedEmail.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle className="w-3.5 h-3.5" /> Terkirim Real-Time
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Isi Pesan Email:</h4>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 font-sans leading-relaxed text-slate-700 whitespace-pre-line text-xs">
                    {selectedEmail.bodySnippet}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8">
                <Mail className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs">Pilih salah satu log email di sebelah kiri untuk melihat rincian pengiriman.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
