'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Bell, CheckCheck, Calendar } from 'lucide-react';
import { notifAPI } from '../lib/api';
import { Notification } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    notifAPI.getAll().then(r => { setNotifs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const markRead = async (notif: Notification) => {
    if (!notif.lu) await notifAPI.markRead(notif.id);
    if (notif.conge) {
      onClose();
      router.push(`/dashboard/conges/${notif.conge.id}`);
    }
  };

  const markAll = async () => {
    await notifAPI.markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
  };

  const getIcon = (type: string) => {
    if (type === 'conge_approuve') return '✅';
    if (type === 'conge_refuse') return '❌';
    return '📋';
  };

  const getBg = (type: string) => {
    if (type === 'conge_approuve') return 'bg-green-50 border-green-100';
    if (type === 'conge_refuse') return 'bg-red-50 border-red-100';
    return 'bg-amber-50 border-amber-100';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-sm bg-white h-full flex flex-col shadow-2xl slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-800">Notifications</h2>
            {notifs.filter(n => !n.lu).length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {notifs.filter(n => !n.lu).length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAll} className="text-xs text-blue-600 font-medium flex items-center gap-1">
              <CheckCheck size={14} /> Tout lire
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifs.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!notif.lu ? 'border-l-2 border-blue-500' : ''}`}
                >
                  <div className={`rounded-xl p-3 border ${getBg(notif.type)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">{getIcon(notif.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium leading-snug">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar size={11} />
                          {format(new Date(notif.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      {!notif.lu && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
