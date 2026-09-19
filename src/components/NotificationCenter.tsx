import React from 'react';
import { Bell, Clock, Calendar, CheckCircle, Info, X } from 'lucide-react';
import { PushNotification } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  notifications: PushNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden mt-14 sm:mr-4 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">Notifikasi & Pengingat Shift</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">
            {notifications.filter((n) => !n.read).length} Belum dibaca
          </span>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            Tandai semua dibaca
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Tidak ada notifikasi aktif.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition flex gap-3 ${
                  notif.read ? 'bg-white opacity-75' : 'bg-amber-50/40 font-medium'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {notif.type === 'shift' ? (
                    <Clock className="w-4 h-4 text-indigo-600" />
                  ) : notif.type === 'payroll' ? (
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">{notif.title}</div>
                  <div className="text-slate-600 leading-relaxed">{notif.message}</div>
                  <div className="text-[10px] text-slate-400">{notif.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
