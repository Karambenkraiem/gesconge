'use client';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { usersAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import { User, Shield, Phone, Hash, Calendar, TrendingUp } from 'lucide-react';
import { ROLE_LABELS, EQUIPE_COLORS } from '../../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    matricule: user?.matricule || '',
    unite: user?.unite || '',
    password: '',
    confirmPwd: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (form.password && form.password !== form.confirmPwd) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone,
        matricule: form.matricule,
        unite: form.unite,
      };
      if (form.password) payload.password = form.password;
      await usersAPI.updateMe(payload);
      await refreshProfile();
      toast.success('Profil mis à jour');
      setEditing(false);
      setForm(f => ({ ...f, password: '', confirmPwd: '' }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setSaving(false);
  };

  if (!user) return null;

  const equipeColor = EQUIPE_COLORS[user.equipe];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* Avatar card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black backdrop-blur-sm border border-white/30">
          {user.prenom[0]}{user.nom[0]}
        </div>
        <h1 className="text-xl font-black">{user.prenom} {user.nom}</h1>
        <p className="text-blue-200 text-sm mt-0.5">{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
            {ROLE_LABELS[user.role]}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: equipeColor }}>
            Équipe {user.equipe}
          </span>
        </div>
      </div>

      {/* Solde card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
          <TrendingUp size={12} /> Solde de congés
        </p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-blue-700">{user.soldeConge}</span>
          <span className="text-slate-500 mb-1">/ {user.soldeInitial} jours</span>
        </div>
        <div className="mt-2 bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (Number(user.soldeConge) / Math.max(1, Number(user.soldeInitial))) * 100)}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          +2 jours ajoutés automatiquement chaque mois
        </p>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
          <User size={12} /> Informations
        </p>
        {[
          { icon: Hash, label: 'Matricule', value: user.matricule || '—' },
          { icon: Phone, label: 'Téléphone', value: user.telephone || '—' },
          { icon: Shield, label: 'Unité', value: user.unite || '—' },
          { icon: Shield, label: 'Rôle', value: ROLE_LABELS[user.role] },
          { icon: Calendar, label: 'Membre depuis', value: format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr }) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={14} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-slate-700">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit section */}
      {!editing ? (
        <button onClick={() => setEditing(true)}
          className="w-full py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm">
          ✏️ Modifier mon profil
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Modifier</p>

          {[
            { key: 'prenom', label: 'Prénom', type: 'text' },
            { key: 'nom', label: 'Nom', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'matricule', label: 'Matricule', type: 'text' },
            { key: 'telephone', label: 'Téléphone', type: 'tel' },
            { key: 'unite', label: 'Unité', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={label}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Nouveau mot de passe</label>
            <input type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Laisser vide pour ne pas changer"
            />
          </div>

          {form.password && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Confirmer le mot de passe</label>
              <input type="password" value={form.confirmPwd}
                onChange={e => setForm(f => ({ ...f, confirmPwd: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Répéter le mot de passe"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setEditing(false)}
              className="py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
              {saving ? '...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
