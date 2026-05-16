'use client';
import { useState, useEffect } from 'react';
import { congesAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Conge, StatutConge, TYPE_LABELS } from '../../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import StatutBadge from '../../../components/StatutBadge';
import { Search, Filter } from 'lucide-react';

const STATUTS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'approuve', label: 'Approuvés' },
  { value: 'refuse', label: 'Refusés' },
  { value: 'annule', label: 'Annulés' },
];

export default function CongesPage() {
  const { user } = useAuth();
  const [conges, setConges] = useState<Conge[]>([]);
  const [filtered, setFiltered] = useState<Conge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');

  const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';

  useEffect(() => {
    const fn = isManager ? congesAPI.getAll : congesAPI.getMine;
    fn().then(r => { setConges(r.data); setFiltered(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = conges;
    if (statut) result = result.filter(c => c.statut === statut);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        `${c.demandeur.prenom} ${c.demandeur.nom}`.toLowerCase().includes(q) ||
        TYPE_LABELS[c.typeConge].toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, statut, conges]);

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <h1 className="text-xl font-black text-slate-800 mb-4">
        {isManager ? 'Toutes les demandes' : 'Mes congés'}
      </h1>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatut(s.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statut === s.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Filter size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucune demande trouvée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(conge => (
            <Link key={conge.id} href={`/dashboard/conges/${conge.id}`}
              className="block bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 transition-all active:scale-98">
              {isManager && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-black text-blue-700">
                      {conge.demandeur.prenom[0]}{conge.demandeur.nom[0]}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {conge.demandeur.prenom} {conge.demandeur.nom}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">Équipe {conge.demandeur.equipe}</span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{TYPE_LABELS[conge.typeConge]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {format(new Date(conge.dateDebut), 'dd MMM', { locale: fr })} →{' '}
                    {format(new Date(conge.dateFin), 'dd MMM yyyy', { locale: fr })}
                    {' '}· <span className="font-semibold text-slate-700">{conge.nombreJours}j</span>
                  </p>
                  {conge.motif && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{conge.motif}</p>
                  )}
                </div>
                <StatutBadge statut={conge.statut} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Soumis le {format(new Date(conge.createdAt), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
