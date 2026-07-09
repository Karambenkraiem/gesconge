'use client';
import { useState, useEffect } from 'react';
import { usersAPI, settingsAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Role, Equipe, ROLE_LABELS, EQUIPE_COLORS } from '../../../types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Plus, Edit3, Users, X, Save, Trash2, AlertTriangle, RefreshCw, Monitor } from 'lucide-react';

const ROLES: Role[] = ['super_admin','chef_exploitation','chef_quart','chef_bloc','operateur','autre'];
const EQUIPES: Equipe[] = ['A','B','C','D','NONE'];

const blankForm = {
  email:'', password:'', nom:'', prenom:'',
  role:'operateur' as Role, equipe:'A' as Equipe,
  telephone:'', matricule:'', unite:'', solde: 0,
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ ...blankForm });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'agents'|'soldes'>('agents');
  const [demoMode, setDemoMode] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.role !== 'chef_exploitation') {
      router.replace('/dashboard');
    }
    fetchUsers();
    if (user?.role === 'super_admin') fetchDemoMode();
  }, [user]);

  const fetchDemoMode = async () => {
    try {
      const res = await settingsAPI.getDemoMode();
      setDemoMode(res.data.enabled);
    } catch {}
  };

  const toggleDemoMode = async () => {
    setDemoLoading(true);
    try {
      const res = await settingsAPI.setDemoMode(!demoMode);
      setDemoMode(res.data.enabled);
      toast.success(res.data.enabled ? 'Mode démonstration activé' : 'Mode démonstration désactivé');
    } catch {
      toast.error('Erreur');
    }
    setDemoLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...blankForm });
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ email: u.email, password:'', nom: u.nom, prenom: u.prenom,
      role: u.role, equipe: u.equipe, telephone: u.telephone||'',
      matricule: u.matricule||'', unite: u.unite||'', solde: u.soldeConge });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.matricule.trim()) {
      toast.error('Le matricule est obligatoire (identifiant de connexion)');
      return;
    }
    setSaving(true);
    try {
      if (editUser) {
        const payload: any = { email: form.email, nom: form.nom, prenom: form.prenom, role: form.role, equipe: form.equipe, telephone: form.telephone, matricule: form.matricule, unite: form.unite };
        if (form.password) payload.password = form.password;
        await usersAPI.update(editUser.id, payload);
        toast.success('Agent mis à jour');
      } else {
        await usersAPI.create({ ...form, soldeConge: form.solde, soldeInitial: form.solde });
        toast.success('Agent créé');
      }
      await fetchUsers();
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setSaving(false);
  };

  const updateSolde = async (id: string, solde: number) => {
    try {
      await usersAPI.setSolde(id, solde);
      toast.success('Solde mis à jour');
      fetchUsers();
    } catch { toast.error('Erreur'); }
  };

  const deactivate = async (id: string, nom: string, prenom: string) => {
    if (!confirm(`Désactiver ${prenom} ${nom} ?\nL'agent ne pourra plus se connecter.`)) return;
    try {
      await usersAPI.deactivate(id);
      toast.success('Agent désactivé');
      fetchUsers();
    } catch { toast.error('Erreur'); }
  };

  const reactivate = async (id: string, nom: string, prenom: string) => {
    if (!confirm(`Réactiver ${prenom} ${nom} ?\nL'agent pourra à nouveau se connecter.`)) return;
    try {
      await usersAPI.reactivate(id);
      toast.success(`${prenom} ${nom} réactivé`);
      fetchUsers();
    } catch { toast.error('Erreur'); }
  };

  const deleteForever = async (id: string, nom: string, prenom: string) => {
    const confirmation = prompt(
      `⚠️ SUPPRESSION DÉFINITIVE\n\nVous allez supprimer ${prenom} ${nom} et toutes ses données.\nCette action est IRRÉVERSIBLE.\n\nTapez "SUPPRIMER" pour confirmer :`
    );
    if (confirmation !== 'SUPPRIMER') {
      if (confirmation !== null) toast.error('Confirmation incorrecte. Suppression annulée.');
      return;
    }
    try {
      await usersAPI.deleteForever(id);
      toast.success(`${prenom} ${nom} supprimé définitivement`);
      fetchUsers();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-slate-800">Administration</h1>
        {isSuperAdmin && (
          <button onClick={openCreate}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-3 py-2 rounded-xl active:scale-95 transition-all">
            <Plus size={16} /> Agent
          </button>
        )}
      </div>

      {isSuperAdmin && (
        <div className={`flex items-center justify-between gap-3 mb-4 p-3 rounded-xl border ${demoMode ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <Monitor size={16} className={demoMode ? 'text-amber-600' : 'text-slate-400'} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Mode démonstration</p>
              <p className="text-xs text-slate-500 truncate">Affiche des boutons de connexion rapide sur /login</p>
            </div>
          </div>
          <button
            onClick={toggleDemoMode}
            disabled={demoLoading}
            className={`flex-shrink-0 w-12 h-7 rounded-full transition-all relative disabled:opacity-50 ${demoMode ? 'bg-amber-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow ${demoMode ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['agents','soldes'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {t === 'agents' ? <><Users size={14} className="inline mr-1" />Agents</> : '💰 Soldes'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
      ) : tab === 'agents' ? (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className={`bg-white rounded-xl border border-slate-100 p-3 ${!u.actif ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: EQUIPE_COLORS[u.equipe] + '20', color: EQUIPE_COLORS[u.equipe] }}>
                  <span className="font-black text-sm">{u.prenom[0]}{u.nom[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/agents/${u.id}`}
                    className="font-bold text-slate-800 text-sm hover:text-blue-600 hover:underline transition-colors">
                    {u.prenom} {u.nom}
                  </Link>
                  <p className="text-xs text-slate-500">{ROLE_LABELS[u.role]} · Éq.{u.equipe}</p>
                  <p className="text-xs text-slate-400 truncate">Matricule : {u.matricule || '—'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{u.soldeConge}j</span>
                  {isSuperAdmin && (
                    <>
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier">
                        <Edit3 size={14} className="text-slate-500" />
                      </button>
                      {u.id !== user?.id && (
                        <>
                          {u.actif ? (
                            <button onClick={() => deactivate(u.id, u.nom, u.prenom)} className="p-1.5 rounded-lg hover:bg-red-50" title="Désactiver">
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          ) : (
                            <button onClick={() => reactivate(u.id, u.nom, u.prenom)} className="p-1.5 rounded-lg hover:bg-green-50" title="Réactiver">
                              <RefreshCw size={14} className="text-green-600" />
                            </button>
                          )}
                          <button onClick={() => deleteForever(u.id, u.nom, u.prenom)} className="p-1.5 rounded-lg hover:bg-red-100" title="Supprimer définitivement">
                            <AlertTriangle size={14} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {users.filter(u => u.actif).map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">{u.prenom} {u.nom}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[u.role]}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={u.soldeConge}
                  min={0}
                  step={0.5}
                  onBlur={e => updateSolde(u.id, parseFloat(e.target.value))}
                  className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  disabled={!isSuperAdmin}
                />
                <span className="text-xs text-slate-500">jours</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto slide-up max-w-lg mx-auto">
            <div className="sticky top-0 bg-white px-4 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-slate-800">{editUser ? 'Modifier' : 'Nouvel agent'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {[
                { key: 'prenom', label: 'Prénom', type: 'text', required: true },
                { key: 'nom', label: 'Nom', type: 'text', required: true },
                { key: 'matricule', label: 'Matricule (identifiant de connexion)', type: 'text', required: true },
                { key: 'password', label: editUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe', type: 'password', required: !editUser },
                { key: 'email', label: 'Email (contact, non utilisé pour la connexion)', type: 'email', required: false },
                { key: 'unite', label: 'Unité', type: 'text', required: false },
                { key: 'telephone', label: 'Téléphone', type: 'tel', required: false },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {label}{required && <span className="text-red-500"> *</span>}
                  </label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={label}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Rôle</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Équipe</label>
                <div className="flex gap-2">
                  {EQUIPES.map(eq => (
                    <button key={eq} type="button" onClick={() => setForm(f => ({ ...f, equipe: eq }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${form.equipe === eq ? 'text-white' : 'bg-slate-100 text-slate-600'}`}
                      style={form.equipe === eq ? { backgroundColor: EQUIPE_COLORS[eq] } : {}}>
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              {!editUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Solde initial (jours)</label>
                  <input type="number" value={form.solde} min={0} step={0.5}
                    onChange={e => setForm(f => ({ ...f, solde: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button onClick={handleSubmit} disabled={saving}
                className="w-full py-3 bg-blue-600 text-white font-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> {editUser ? 'Mettre à jour' : 'Créer'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
