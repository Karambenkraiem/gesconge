'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, PlusCircle, List, UserCircle, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';

  const items = [
    { href: '/dashboard', label: 'Accueil', icon: Home },
    { href: '/dashboard/calendrier', label: 'Calendrier', icon: Calendar },
    { href: '/dashboard/nouvelle-demande', label: 'Demande', icon: PlusCircle, primary: true },
    { href: '/dashboard/conges', label: 'Congés', icon: List },
    isManager
      ? { href: '/dashboard/admin', label: 'Admin', icon: Users }
      : { href: '/dashboard/profile', label: 'Profil', icon: UserCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map(({ href, label, icon: Icon, primary }: any) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all active:scale-90 ${
                primary ? 'relative' : active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              {primary ? (
                <>
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30 -mt-5">
                    <Icon size={22} className="text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</span>
                </>
              ) : (
                <>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                  <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
