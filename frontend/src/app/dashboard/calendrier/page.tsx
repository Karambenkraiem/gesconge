'use client';
import { useState, useEffect } from 'react';
import { congesAPI } from '../../../lib/api';
import { Conge, StatutConge } from '../../../types';
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

export default function CalendrierPage() {
  const [conges, setConges] = useState<Conge[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedConges, setSelectedConges] = useState<Conge[]>([]);

  useEffect(() => {
    congesAPI.getCalendrier().then(r => setConges(r.data)).catch(() => {});
  }, []);

  const getCongesForDate = (date: Date) =>
    conges.filter(c => {
      const days = eachDayOfInterval({
        start: parseISO(c.dateDebut),
        end: parseISO(c.dateFin),
      });
      return days.some(d => isSameDay(d, date));
    });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedConges(getCongesForDate(date));
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const dayConges = getCongesForDate(date);
    if (dayConges.length === 0) return null;
    return (
      <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
        {dayConges.slice(0, 3).map((c, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: STATUT_COLORS[c.statut] }} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      <h1 className="text-xl font-black text-slate-800">Calendrier des congés</h1>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUT_COLORS).map(([statut, color]) => (
          <div key={statut} className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs font-medium text-slate-600 capitalize">{statut.replace('_', ' ')}</span>
          </div>
        ))}
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
      <div>
        <h2 className="font-bold text-slate-700 text-sm mb-2">
          {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
          {selectedConges.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {selectedConges.length} congé{selectedConges.length > 1 ? 's' : ''}
            </span>
          )}
        </h2>

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
