import React, { useState } from 'react';
import { FileSpreadsheet, Copy, Check, ExternalLink, RefreshCw, X, Database } from 'lucide-react';
import { CompanyConfig } from '../types';
import { getGoogleAppsScriptTemplate } from '../utils/sheetsSync';

interface SpreadsheetSyncModalProps {
  isOpen: boolean;
  config: CompanyConfig;
  onClose: () => void;
  onManualSync: () => void;
  isSyncing: boolean;
  lastSyncTime?: string;
}

export const SpreadsheetSyncModal: React.FC<SpreadsheetSyncModalProps> = ({
  isOpen,
  config,
  onClose,
  onManualSync,
  isSyncing,
  lastSyncTime,
}) => {
  const [copied, setCopied] = useState(false);
  const scriptCode = getGoogleAppsScriptTemplate();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/50">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Integrasi Google Spreadsheet Sebagai Basis Data Utama</h3>
              <p className="text-xs text-emerald-100/80">
                Hubungkan Google Sheets Anda secara langsung untuk sinkronisasi dua arah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Status Bar */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-950 flex items-center gap-2 text-sm">
                <Database className="w-4 h-4 text-emerald-700" />
                Basis Data Spreadsheet: Terhubung
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Sinkronisasi terakhir: {lastSyncTime || 'Baru saja'} • Webhook: {config.spreadsheetWebhookUrl ? 'Terkonfigurasi' : 'Mode Lokal'}
              </p>
            </div>

            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>

          {/* Guide Steps */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">
              Cara Menghubungkan Google Sheets Anda (3 Langkah Mudah):
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 leading-relaxed">
              <li>
                Buka Google Sheets baru di browser Anda (atau ketik <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">sheets.new</code>).
              </li>
              <li>
                Buka menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
              </li>
              <li>
                Salin kode di bawah ini, tempelkan, lalu klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan Baru (New Deployment)</strong> sebagai Web App (Akses: Siapa Saja).
              </li>
            </ol>
          </div>

          {/* Script Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 font-mono text-[11px]">
                Google Apps Script (GAS) Kode Backend:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin Kode
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-56 border border-slate-800 leading-relaxed">
              {scriptCode}
            </pre>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
