'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notifAPI } from '../lib/api';
import { ROLE_LABELS, EQUIPE_COLORS } from '../types';
import NotificationPanel from './NotificationPanel';

export default function TopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await notifAPI.getUnreadCount();
      setUnread(res.data.count);
    } catch {}
  };

  if (!user) return null;

  const equipeColor = EQUIPE_COLORS[user.equipe];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">G</span>
            </div>
            <span className="font-black text-blue-700 text-lg">GesConge</span>
          </div>

          {/* User info - center */}
          <div className="flex items-center gap-2">
            <div
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: equipeColor }}
            >
              Équipe {user.equipe}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Notifications bell */}
            <button
              onClick={() => setShowNotif(true)}
              className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Bell size={20} className="text-slate-600" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pulse-dot">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={() => { logout(); router.replace('/login'); }}
              className="p-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <LogOut size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* User role strip */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
            <User size={12} className="text-slate-500" />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {user.prenom} {user.nom} · {ROLE_LABELS[user.role]}
          </span>
          <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {user.soldeConge}j
          </span>
        </div>
      </header>

      {showNotif && (
        <NotificationPanel
          onClose={() => { setShowNotif(false); fetchUnread(); }}
        />
      )}
    </>
  );
}
