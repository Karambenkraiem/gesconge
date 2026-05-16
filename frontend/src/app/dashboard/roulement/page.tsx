'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const JOURS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// Cycle 8 jours, 2 jours par état — référence ancrée sur mai 2026 (vérifié sur image)
const STATES = [
  { Q1:'B', Q2:'D', Q3:'C', R:'A' },
  { Q1:'D', Q2:'A', Q3:'B', R:'C' },
  { Q1:'A', Q2:'C', Q3:'D', R:'B' },
  { Q1:'C', Q2:'B', Q3:'A', R:'D' },
];
const REF = new Date('2026-04-30T00:00:00');

function getState(date: Date) {
  const days = Math.round((date.getTime() - REF.getTime()) / 86400000);
  const idx  = (((Math.floor(days / 2)) % 4) + 4) % 4;
  return STATES[idx];
}

const TEAM: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg:'#ede9fe', text:'#6d28d9', border:'#c4b5fd' },
  B: { bg:'#e0f2fe', text:'#0369a1', border:'#7dd3fc' },
  C: { bg:'#d1fae5', text:'#065f46', border:'#6ee7b7' },
  D: { bg:'#fef3c7', text:'#92400e', border:'#fcd34d' },
};

function Badge({ eq }: { eq: string }) {
  const s = TEAM[eq];
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {eq}
    </span>
  );
}

export default function RoulementPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const now      = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';

  useEffect(() => {
    if (user && !isManager) router.replace('/dashboard');
  }, [user, isManager, router]);

  const days = useMemo(() => {
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const d    = i + 1;
      const date = new Date(year, month, d);
      return { d, date, jour: JOURS[date.getDay()], state: getState(date) };
    });
  }, [year, month]);

  const goBack = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const isToday = (d: number) => d === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  if (!isManager) return null;

  return (
    <div className="max-w-lg mx-auto px-3 py-4">
      <h1 className="text-xl font-black text-slate-800 mb-3">Roulement des Quarts</h1>

      {/* Légende */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['A','B','C','D'] as const).map(eq => (
          <div key={eq} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: TEAM[eq].bg, border: `1px solid ${TEAM[eq].border}` }}>
            <span className="font-black text-xs" style={{ color: TEAM[eq].text }}>Équipe {eq}</span>
          </div>
        ))}
      </div>

      {/* Sélecteur mois */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 mb-4">
        <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-slate-100">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div className="text-center">
          <p className="font-black text-slate-800 text-lg">{MOIS[month]}</p>
          <p className="text-xs text-slate-400">{year}</p>
        </div>
        <button onClick={goNext} className="p-1.5 rounded-lg hover:bg-slate-100">
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* En-tête */}
        <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-200 text-center">
          <div className="col-span-2 px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Date</div>
          {[['7h','14h'],['14h','20h'],['20h','7h']].map(([a,b],i) => (
            <div key={i} className="py-2.5">
              <p className="text-xs font-bold text-slate-600">{a}</p>
              <p className="text-[10px] text-slate-400">{b}</p>
            </div>
          ))}
          <div className="py-2.5">
            <p className="text-xs font-bold text-slate-400">Repos</p>
          </div>
        </div>

        {/* Lignes */}
        <div className="divide-y divide-slate-100">
          {days.map(({ d, date, jour, state }) => {
            const today   = isToday(d);
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div key={d} className={`grid grid-cols-6 items-center ${today ? 'bg-blue-50' : weekend ? 'bg-slate-50/60' : ''}`}>
                {/* Date */}
                <div className="col-span-2 px-3 py-2 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${
                    today ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>{d}</div>
                  <span className={`text-xs font-medium ${today ? 'text-blue-700 font-bold' : weekend ? 'text-slate-500' : 'text-slate-600'}`}>
                    {jour.substring(0, 3)}.
                  </span>
                  {today && <span className="text-[9px] bg-blue-600 text-white px-1 py-0.5 rounded font-bold ml-auto">Auj.</span>}
                </div>
                <div className="flex justify-center py-2"><Badge eq={state.Q1} /></div>
                <div className="flex justify-center py-2"><Badge eq={state.Q2} /></div>
                <div className="flex justify-center py-2"><Badge eq={state.Q3} /></div>
                <div className="flex justify-center py-2 opacity-50"><Badge eq={state.R} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-3">Cycle 8 jours · 4 équipes A B C D</p>
    </div>
  );
}
