'use client';
import { useState, useEffect, useMemo } from 'react';
import { congesAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Conge, StatutConge, Role, ROLE_LABELS, EQUIPE_COLORS } from '../../../types';
import OverlapWarning from '../../../components/OverlapWarning';
import { format, isSameDay, parseISO, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Link from 'next/link';

const STATUT_COLORS: Record<StatutConge, string> = {
  en_attente: '#f59e0b',
  approuve: '#10b981',
  refuse: '#ef4444',
  annule: '#9ca3af',
};

const STATUT_BG: Record<StatutConge, string> = {
  en_attente: 'bg-amber-100 border-amber-300 text-amber-800',
  approuve: 'bg-green-100 border-green-300 text-green-800',
  refuse: 'bg-red-100 border-red-300 text-red-800',
  annule: 'bg-gray-100 border-gray-300 text-gray-600',
};

// Rôles suivis en équipe de quart — ceux pour lesquels un chevauchement de congés
// entre plusieurs agents du même rôle a un vrai impact opérationnel.
const ROLE_TABS: { value: Role | 'tous'; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'chef_quart', label: 'Chef de Quart' },
  { value: 'chef_bloc', label: 'Chef de Bloc' },
  { value: 'operateur', label: 'Opérateur' },
];

export default function CalendrierPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';

  const [conges, setConges] = useState<Conge[]>([]);
  const [roleFilter, setRoleFilter] = useState<Role | 'tous'>('tous');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    congesAPI.getCalendrier().then(r => setConges(r.data)).catch(() => {});
  }, []);

  const byRole = roleFilter !== 'tous';

  const filteredConges = useMemo(
    () => (byRole ? conges.filter(c => c.demandeur.role === roleFilter) : conges),
    [conges, roleFilter],
  );

  const getCongesForDate = (list: Conge[], date: Date) =>
    list.filter(c => {
      const days = eachDayOfInterval({ start: parseISO(c.dateDebut), end: parseISO(c.dateFin) });
      return days.some(d => isSameDay(d, date));
    });

  const selectedConges = useMemo(
    () => getCongesForDate(filteredConges, selectedDate),
    [selectedDate, filteredConges],
  );

  const handleDateChange = (date: Date) => setSelectedDate(date);

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const dayConges = getCongesForDate(filteredConges, date);
    if (dayConges.length === 0) return null;
    const conflict = byRole && dayConges.length >= 2;
    return (
      <div className="flex flex-col items-center mt-0.5 gap-0.5">
        <div
          className="flex justify-center gap-0.5 flex-wrap rounded-full px-0.5"
          style={conflict ? { boxShadow: '0 0 0 1.5px #ef4444' } : undefined}
        >
          {dayConges.slice(0, 4).map((c, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: byRole ? EQUIPE_COLORS[c.demandeur.equipe] : STATUT_COLORS[c.statut] }} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <h1 className="text-xl font-black text-slate-800">Calendrier des congés</h1>

      {/* Filtre par rôle — chef d'exploitation / super admin */}
      {isManager && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                roleFilter === tab.value
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {byRole ? (
          <>
            {(['A', 'B', 'C', 'D'] as const).map(eq => (
              <div key={eq} className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EQUIPE_COLORS[eq] }} />
                <span className="text-xs font-medium text-slate-600">Équipe {eq}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-red-200">
              <div className="w-2.5 h-2.5 rounded-full ring-2 ring-red-500 ring-offset-1" />
              <span className="text-xs font-medium text-red-600">2+ agents ce jour</span>
            </div>
          </>
        ) : (
          Object.entries(STATUT_COLORS).map(([statut, color]) => (
            <div key={statut} className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-medium text-slate-600 capitalize">{statut.replace('_', ' ')}</span>
            </div>
          ))
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <Calendar
          onChange={handleDateChange as any}
          value={selectedDate}
          locale="fr-FR"
          tileContent={tileContent}
          className="w-full"
          navigationLabel={({ date }) =>
            format(date, 'MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())
          }
        />
      </div>

      {/* Selected day */}
      <div className="space-y-2">
        <h2 className="font-bold text-slate-700 text-sm">
          {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
          {selectedConges.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {selectedConges.length} congé{selectedConges.length > 1 ? 's' : ''}
              {byRole ? ` · ${ROLE_LABELS[roleFilter as Role]}` : ''}
            </span>
          )}
        </h2>

        {byRole && <OverlapWarning overlaps={selectedConges} />}

        {selectedConges.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-4 text-center text-slate-400 text-sm">
            Aucun congé ce jour
          </div>
        ) : (
          <div className="space-y-2">
            {selectedConges.map(conge => (
              <Link key={conge.id} href={`/dashboard/conges/${conge.id}`}
                className={`flex items-center gap-3 rounded-xl border p-3 hover:opacity-80 transition-opacity ${STATUT_BG[conge.statut]}`}>
                <div className="w-1.5 h-10 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUT_COLORS[conge.statut] }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">
                    {conge.demandeur.prenom} {conge.demandeur.nom}
                  </p>
                  <p className="text-xs opacity-75">
                    {isManager && !byRole && `${ROLE_LABELS[conge.demandeur.role]} · `}
                    {format(parseISO(conge.dateDebut), 'dd/MM')} → {format(parseISO(conge.dateFin), 'dd/MM/yyyy')}
                    {' · '}{conge.nombreJours}j
                  </p>
                </div>
                <span className="text-xs font-bold uppercase opacity-70">Éq.{conge.demandeur.equipe}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
