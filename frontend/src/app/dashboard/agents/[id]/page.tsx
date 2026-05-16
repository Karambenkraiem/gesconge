'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { usersAPI, congesAPI, notesAPI } from '../../../../lib/api';
import { User, Conge, ROLE_LABELS, TYPE_LABELS, EQUIPE_COLORS } from '../../../../types';
import StatutBadge from '../../../../components/StatutBadge';
import { ArrowLeft, Phone, Hash, Shield, Users, Calendar, Save } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const NOW = new Date();
const THIS_YEAR = NOW.getFullYear();

interface Notes {
  rendement: { id: string; annee: number; trimestre: number; note: number }[];
  productivite: { id: string; annee: number; note: number }[];
}

function NoteInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number" min={0} max={100} step={0.5}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-center border border-slate-200 rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
      placeholder="—"
    />
  );
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const router = useRouter();

  const [agent,  setAgent]  = useState<User | null>(null);
  const [conges, setConges] = useState<Conge[]>([]);
  const [notes,  setNotes]  = useState<Notes>({ rendement: [], productivite: [] });
  const [loading, setLoading] = useState(true);

  // Édition des notes
  const [rendEdit, setRendEdit] = useState<Record<string, string>>({});
  const [prodEdit, setProdEdit] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const isManager = me?.role === 'super_admin' || me?.role === 'chef_exploitation';

  useEffect(() => {
    if (me && !isManager) router.replace('/dashboard');
  }, [me, isManager, router]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      usersAPI.getOne(id),
      congesAPI.getAll(),
      notesAPI.getForAgent(id),
    ]).then(([uRes, cRes, nRes]) => {
      setAgent(uRes.data);
      setConges((cRes.data as Conge[]).filter(c => c.demandeur_id === id));
      const n: Notes = nRes.data;
      setNotes(n);
      // Initialiser les champs d'édition avec les valeurs existantes
      const re: Record<string, string> = {};
      n.rendement.forEach(r => { re[`${r.annee}-${r.trimestre}`] = String(r.note); });
      setRendEdit(re);
      const pe: Record<number, string> = {};
      n.productivite.forEach(p => { pe[p.annee] = String(p.note); });
      setProdEdit(pe);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const saveNotes = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      // Rendement : sauvegarder toutes les cases remplies
      const rendPromises = Object.entries(rendEdit)
        .filter(([, v]) => v !== '' && !isNaN(Number(v)))
        .map(([key, v]) => {
          const [annee, trimestre] = key.split('-').map(Number);
          return notesAPI.upsertRendement({ agent_id: agent.id, annee, trimestre, note: Number(v) });
        });
      // Productivité
      const prodPromises = Object.entries(prodEdit)
        .filter(([, v]) => v !== '' && !isNaN(Number(v)))
        .map(([annee, v]) => notesAPI.upsertProductivite({ agent_id: agent.id, annee: Number(annee), note: Number(v) }));

      await Promise.all([...rendPromises, ...prodPromises]);
      toast.success('Notes enregistrées');
      const nRes = await notesAPI.getForAgent(agent.id);
      setNotes(nRes.data);
    } catch { toast.error('Erreur lors de l\'enregistrement'); }
    setSaving(false);
  };

  if (!isManager) return null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!agent) return (
    <div className="text-center py-16 text-slate-400">Agent introuvable</div>
  );

  const equipeColor = EQUIPE_COLORS[agent.equipe] || '#6b7280';

  // Années pour productivité (du plus ancien au plus récent)
  const prodYears = [THIS_YEAR - 2, THIS_YEAR - 1, THIS_YEAR];
  // Années pour rendement (cette année + précédente)
  const rendYears = [THIS_YEAR, THIS_YEAR - 1];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-200">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="font-black text-slate-800 text-lg">Fiche agent</h1>
      </div>

      {/* Carte identité */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-black border border-white/30">
          {agent.prenom[0]}{agent.nom[0]}
        </div>
        <h2 className="text-xl font-black">{agent.prenom} {agent.nom}</h2>
        <p className="text-blue-200 text-sm">{agent.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">{ROLE_LABELS[agent.role]}</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: equipeColor }}>
            Équipe {agent.equipe}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${agent.actif ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
            {agent.actif ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      {/* Infos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Shield size={12}/> Informations</p>
        {[
          { icon: Hash,      label: 'Matricule',  value: agent.matricule || '—' },
          { icon: Phone,     label: 'Téléphone',  value: agent.telephone || '—' },
          { icon: Users,     label: 'Équipe',     value: `Équipe ${agent.equipe}` },
          { icon: Calendar,  label: 'Solde congé',value: `${agent.soldeConge} jours` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-slate-700">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Notes de rendement ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes de rendement (sur 100)</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Évaluée chaque trimestre par le manager</p>
        </div>
        {rendYears.map(annee => (
          <div key={annee}>
            <div className="px-4 py-2 bg-blue-50 border-b border-slate-100">
              <p className="text-xs font-bold text-blue-700">{annee}</p>
            </div>
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
              {[1,2,3,4].map(t => (
                <div key={t} className="p-2 text-center">
                  <p className="text-[10px] text-slate-400 mb-1">T{t}</p>
                  <NoteInput
                    value={rendEdit[`${annee}-${t}`] ?? ''}
                    onChange={v => setRendEdit(prev => ({ ...prev, [`${annee}-${t}`]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Notes de productivité ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes de productivité (sur 100)</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Évaluée chaque juillet</p>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {prodYears.map(annee => (
            <div key={annee} className="p-3 text-center">
              <p className="text-xs font-bold text-slate-600 mb-2">{annee}</p>
              <NoteInput
                value={prodEdit[annee] ?? ''}
                onChange={v => setProdEdit(prev => ({ ...prev, [annee]: v }))}
              />
            </div>
          ))}
          {/* Moyenne automatique */}
          <div className="p-3 text-center bg-blue-50">
            <p className="text-xs font-bold text-blue-600 mb-2">Moyenne</p>
            <div className="w-full text-center border border-blue-200 rounded-lg py-1.5 text-sm font-black text-blue-700 bg-white">
              {(() => {
                const vals = prodYears.map(a => prodEdit[a]).filter(v => v !== '' && v !== undefined && !isNaN(Number(v))).map(Number);
                return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '—';
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Bouton sauvegarder notes */}
      <button onClick={saveNotes} disabled={saving}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Save size={16}/> Enregistrer les notes</>}
      </button>

      {/* ── Congés ── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Demandes de congé</p>
          <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{conges.length}</span>
        </div>
        {conges.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Aucune demande</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {conges.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-700">{TYPE_LABELS[c.typeConge]}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(c.dateDebut), 'dd MMM', { locale: fr })} → {format(new Date(c.dateFin), 'dd MMM yyyy', { locale: fr })}
                    {' · '}<span className="font-semibold text-slate-600">{c.nombreJours}j</span>
                  </p>
                </div>
                <StatutBadge statut={c.statut} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
