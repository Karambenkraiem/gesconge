'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { congesAPI } from '../../lib/api';
import { Conge, STATUT_LABELS, TYPE_LABELS, ROLE_LABELS } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import StatutBadge from '../../components/StatutBadge';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recentConges, setRecentConges] = useState<Conge[]>([]);
  const [stats, setStats] = useState({ total: 0, en_attente: 0, approuve: 0, refuse: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';
      const [congesRes] = await Promise.all([
        isManager ? congesAPI.getAll() : congesAPI.getMine(),
      ]);
      setRecentConges(congesRes.data.slice(0, 5));

      if (isManager) {
        const statsRes = await congesAPI.getStats();
        setStats(statsRes.data);
      }
    } catch {}
    setLoading(false);
  };

  const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Bonjour' : greetingHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
      {/* Welcome card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
        <p className="text-blue-200 text-sm">{greeting} 👋</p>
        <h1 className="text-xl font-black mt-0.5">{user?.prenom} {user?.nom}</h1>
        <p className="text-blue-200 text-xs mt-1">{ROLE_LABELS[user?.role!]} — Équipe {user?.equipe}</p>

        {/* Solde */}
        <div className="mt-4 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">Solde de congés</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black">{user?.soldeConge}</span>
                <span className="text-blue-200 text-sm">jours</span>
              </div>
            </div>
            <div className="w-14 h-14">
              <svg viewBox="0 0 56 56" className="rotate-[-90deg]">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="white" strokeWidth="6"
                  strokeDasharray={`${Math.min(100, (Number(user?.soldeConge || 0) / Math.max(1, Number(user?.soldeInitial || 30))) * 138)} 138`}
                  strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="mt-2 bg-white/20 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all"
              style={{ width: `${Math.min(100, (Number(user?.soldeConge || 0) / Math.max(1, Number(user?.soldeInitial || 30))) * 100)}%` }} />
          </div>
          <p className="text-blue-100 text-xs mt-1">sur {user?.soldeInitial} jours initiaux</p>
        </div>
      </div>

      {/* Manager stats */}
      {isManager && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'En attente', value: stats.en_attente, icon: Clock, color: 'amber' },
            { label: 'Approuvés', value: stats.approuve, icon: CheckCircle, color: 'green' },
            { label: 'Refusés', value: stats.refuse, icon: XCircle, color: 'red' },
            { label: 'Total', value: stats.total, icon: TrendingUp, color: 'blue' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`bg-white rounded-xl p-3 border border-slate-100`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-${color}-50`}>
                <Icon size={16} className={`text-${color}-600`} />
              </div>
              <p className="text-2xl font-black text-slate-800">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick action */}
      <Link href="/dashboard/nouvelle-demande"
        className="block bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-50 active:scale-98 transition-all">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Calendar size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">Nouvelle demande de congé</p>
          <p className="text-xs text-slate-500">Soumettre une demande</p>
        </div>
        <ChevronRight size={18} className="text-slate-300" />
      </Link>

      {/* Calendrier des congés par rôle — chef d'exploitation / super admin */}
      {isManager && (
        <Link href="/dashboard/calendrier"
          className="block bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:bg-slate-50 active:scale-98 transition-all">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 text-sm">Calendrier des congés par rôle</p>
            <p className="text-xs text-slate-500">Planning Opérateurs, Chefs de Bloc, Chefs de Quart</p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </Link>
      )}

      {/* Recent conges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-slate-800">
            {isManager ? 'Demandes récentes' : 'Mes congés récents'}
          </h2>
          <Link href="/dashboard/conges" className="text-xs text-blue-600 font-medium">
            Voir tout
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : recentConges.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune demande de congé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentConges.map(conge => (
              <Link key={conge.id} href={`/dashboard/conges/${conge.id}`}
                className="block bg-white border border-slate-100 rounded-xl p-3 hover:border-blue-100 transition-all active:scale-98">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {isManager && (
                      <p className="text-xs font-bold text-blue-600 truncate">
                        {conge.demandeur.prenom} {conge.demandeur.nom}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-slate-800">{TYPE_LABELS[conge.typeConge]}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(conge.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                      {format(new Date(conge.dateFin), 'dd MMM yyyy', { locale: fr })}
                      <span className="ml-1 font-medium text-slate-600">({conge.nombreJours}j)</span>
                    </p>
                  </div>
                  <StatutBadge statut={conge.statut} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
