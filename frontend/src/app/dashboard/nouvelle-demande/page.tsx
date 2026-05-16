'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { congesAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { TypeConge, TYPE_LABELS } from '../../../types';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Info, Paperclip, X } from 'lucide-react';
import Link from 'next/link';

export default function NouvelleDemandePage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    dateDebut: '',
    dateFin: '',
    typeConge: 'annuel' as TypeConge,
    motif: '',
    adresse_conge: '',
  });
  const [certificat, setCertificat] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [nombreJours, setNombreJours] = useState(0);

  const calcJours = (debut: string, fin: string) => {
    if (debut && fin) {
      const d1 = new Date(debut), d2 = new Date(fin);
      if (d2 >= d1) {
        setNombreJours(Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1);
        return;
      }
    }
    setNombreJours(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dateDebut || !form.dateFin) { toast.error('Sélectionnez les dates'); return; }
    if (nombreJours <= 0) { toast.error('Dates invalides'); return; }
    if (form.typeConge === 'annuel' && Number(user?.soldeConge) < nombreJours) {
      toast.error(`Solde insuffisant (${user?.soldeConge}j disponibles)`);
      return;
    }
    if (form.typeConge === 'maladie' && !certificat) {
      toast.error('Le certificat médical est obligatoire pour un congé maladie');
      return;
    }
    setLoading(true);
    try {
      const res = await congesAPI.create({
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        typeConge: form.typeConge,
        motif: form.motif,
        adresse_conge: form.adresse_conge,
      });
      if (certificat && form.typeConge === 'maladie') {
        await congesAPI.uploadCertificat(res.data.id, certificat);
      }
      await refreshProfile();
      toast.success('Demande envoyée avec succès');
      router.push('/dashboard/conges');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-slate-200">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="font-black text-slate-800">Nouvelle demande de congé</h1>
      </div>

      <div className="px-4 py-4">
        {/* Solde info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-800">Votre solde de congés</p>
            <p className="text-2xl font-black text-blue-700">{user?.soldeConge} <span className="text-sm font-normal">jours disponibles</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Type de congé</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_LABELS).map(([value, label]) => {
                const isAnnuelBloque = value === 'annuel' && Number(user?.soldeConge) === 0;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isAnnuelBloque}
                    onClick={() => !isAnnuelBloque && setForm(f => ({ ...f, typeConge: value as TypeConge }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      isAnnuelBloque
                        ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                        : form.typeConge === value
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {label}
                    {isAnnuelBloque && <span className="block text-[10px] font-normal mt-0.5">Solde épuisé</span>}
                  </button>
                );
              })}
            </div>
            {Number(user?.soldeConge) === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
                Votre solde de congé annuel est épuisé. Vous pouvez uniquement demander un congé maladie, exceptionnel ou sans solde.
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Date début</label>
              <input
                type="date"
                value={form.dateDebut}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => { setForm(f => ({ ...f, dateDebut: e.target.value })); calcJours(e.target.value, form.dateFin); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Date fin</label>
              <input
                type="date"
                value={form.dateFin}
                min={form.dateDebut || new Date().toISOString().split('T')[0]}
                onChange={e => { setForm(f => ({ ...f, dateFin: e.target.value })); calcJours(form.dateDebut, e.target.value); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Jours summary */}
          {nombreJours > 0 && (
            <div className={`rounded-xl p-3 text-center slide-up ${
              form.typeConge === 'annuel' && Number(user?.soldeConge) < nombreJours
                ? 'bg-red-50 border border-red-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <span className="text-2xl font-black text-slate-800">{nombreJours}</span>
              <span className="text-slate-600 ml-1">jour{nombreJours > 1 ? 's' : ''} demandé{nombreJours > 1 ? 's' : ''}</span>
              {form.typeConge === 'annuel' && Number(user?.soldeConge) < nombreJours && (
                <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Solde insuffisant</p>
              )}
            </div>
          )}

          {/* Adresse pendant le congé */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Adresse pendant le congé <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={form.adresse_conge}
              onChange={e => setForm(f => ({ ...f, adresse_conge: e.target.value }))}
              placeholder="Ex: 12 rue Ibn Khaldoun, Tunis"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Certificat médical — obligatoire pour maladie */}
          {form.typeConge === 'maladie' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Certificat médical <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => setCertificat(e.target.files?.[0] ?? null)}
              />
              {certificat ? (
                <div className="flex items-center gap-2 px-3 py-2.5 border border-green-300 bg-green-50 rounded-xl text-sm">
                  <Paperclip size={14} className="text-green-600 flex-shrink-0" />
                  <span className="flex-1 truncate text-green-700 font-medium">{certificat.name}</span>
                  <button type="button" onClick={() => { setCertificat(null); if (fileRef.current) fileRef.current.value = ''; }}>
                    <X size={14} className="text-green-600" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                  <Paperclip size={14} />
                  Joindre le certificat médical (image ou PDF)
                </button>
              )}
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Motif (optionnel)</label>
            <textarea
              value={form.motif}
              onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
              placeholder="Précisez la raison de votre congé..."
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || nombreJours <= 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Send size={18} /> Envoyer la demande</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
