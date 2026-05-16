'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { usersAPI } from '../../../lib/api';
import { User, Role, ROLE_LABELS } from '../../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const JOURS = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATES = [
  { Q1:'B', Q2:'D', Q3:'C', R:'A' },
  { Q1:'D', Q2:'A', Q3:'B', R:'C' },
  { Q1:'A', Q2:'C', Q3:'D', R:'B' },
  { Q1:'C', Q2:'B', Q3:'A', R:'D' },
];
const REF = new Date('2026-04-30T00:00:00');

function getState(date: Date) {
  const days = Math.round((date.getTime() - REF.getTime()) / 86400000);
  return STATES[(((Math.floor(days / 2)) % 4) + 4) % 4];
}

const TEAM: Record<string, { bg: string; text: string; border: string; bgDark: string }> = {
  A: { bg:'#ede9fe', text:'#6d28d9', border:'#c4b5fd', bgDark:'#7c3aed' },
  B: { bg:'#e0f2fe', text:'#0369a1', border:'#7dd3fc', bgDark:'#0891b2' },
  C: { bg:'#d1fae5', text:'#065f46', border:'#6ee7b7', bgDark:'#059669' },
  D: { bg:'#fef3c7', text:'#92400e', border:'#fcd34d', bgDark:'#d97706' },
};

// Ordre d'affichage des rôles dans le tableau
const ROLE_ROWS: Role[] = ['chef_quart','chef_bloc','operateur','autre'];

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
  // members[role][equipe] = User[]
  const [members, setMembers] = useState<Record<string, Record<string, User[]>>>({});

  const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';

  useEffect(() => {
    if (user && !isManager) router.replace('/dashboard');
  }, [user, isManager, router]);

  useEffect(() => {
    usersAPI.getAll().then(res => {
      // grouped[role][equipe] = User[]
      const grouped: Record<string, Record<string, User[]>> = {};
      ROLE_ROWS.forEach(r => { grouped[r] = { A:[], B:[], C:[], D:[] }; });

      (res.data as User[])
        .filter(u => u.actif && ['A','B','C','D'].includes(u.equipe) && ROLE_ROWS.includes(u.role as Role))
        .forEach(u => grouped[u.role][u.equipe].push(u));

      setMembers(grouped);
    }).catch(() => {});
  }, []);

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
    <div className="max-w-lg mx-auto px-3 py-4 space-y-4">
      <h1 className="text-xl font-black text-slate-800">Roulement des Quarts</h1>

      {/* ── Tableau membres par équipe ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Membres par équipe</p>
        </div>

        {/* En-tête colonnes équipes */}
        <div className="grid grid-cols-4 border-b border-slate-200">
          {(['A','B','C','D'] as const).map(eq => (
            <div key={eq} className="py-2 text-center" style={{ backgroundColor: TEAM[eq].bg }}>
              <span className="text-xs font-black" style={{ color: TEAM[eq].text }}>Éq. {eq}</span>
            </div>
          ))}
        </div>

        {/* Lignes par rôle */}
        {ROLE_ROWS.map((role, ri) => {
          const rowMembers = members[role] ?? { A:[], B:[], C:[], D:[] };
          return (
            <div key={role} className={`grid grid-cols-4 border-b border-slate-100 last:border-0 ${ri % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
              {/* Cellules par équipe */}
              {(['A','B','C','D'] as const).map(eq => {
                const agents = rowMembers[eq] ?? [];
                return (
                  <div key={eq} className="py-1.5 px-1 flex flex-col items-center justify-center gap-1 border-l border-slate-100 min-h-[3rem]">
                    {agents.length === 0 ? (
                      <span className="text-[10px] text-slate-300">—</span>
                    ) : agents.map(u => (
                      <Link key={u.id} href={`/dashboard/agents/${u.id}`}
                        className="text-center w-full group">
                        <p className="text-[10px] font-bold leading-tight text-center truncate px-0.5 group-hover:text-blue-600 group-hover:underline transition-colors"
                          style={{ color: TEAM[eq].text }}>
                          {u.prenom} {u.nom}
                        </p>
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Sélecteur mois ── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3">
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

      {/* ── Tableau roulement ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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

        <div className="divide-y divide-slate-100">
          {days.map(({ d, date, jour, state }) => {
            const today   = isToday(d);
            const weekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div key={d} className={`grid grid-cols-6 items-center ${today ? 'bg-blue-50' : weekend ? 'bg-slate-50/60' : ''}`}>
                <div className="col-span-2 px-3 py-2 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${
                    today ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>{d}</div>
                  <span className={`text-xs font-medium ${today ? 'text-blue-700 font-bold' : weekend ? 'text-slate-500' : 'text-slate-600'}`}>
                    {jour.substring(0,3)}.
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

      <p className="text-center text-xs text-slate-400">Cycle 8 jours · 4 équipes A B C D</p>
    </div>
  );
}
