'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { congesAPI, usersAPI } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { Conge, User, TYPE_LABELS, ROLE_LABELS } from '../../../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import StatutBadge from '../../../../components/StatutBadge';
import {
  ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock,
  Printer, X, Paperclip, FileText, ExternalLink, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import api from '../../../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CongeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [conge, setConge] = useState<Conge | null>(null);
  const [demandeurUser, setDemandeurUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarque, setRemarque] = useState('');
  const [showDecision, setShowDecision] = useState(false);
  const [decisionType, setDecisionType] = useState<'approuve' | 'refuse' | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [certBlobUrl, setCertBlobUrl] = useState<string | null>(null);

  const isManager = user?.role === 'super_admin' || user?.role === 'chef_exploitation';

  useEffect(() => {
    congesAPI.getAll().then(r => {
      const found = r.data.find((c: Conge) => c.id === id);
      if (found) {
        setConge(found);
        if (isManager) {
          usersAPI.getOne(found.demandeur_id).then(ur => setDemandeurUser(ur.data)).catch(() => {});
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleDecision = async (statut: 'approuve' | 'refuse') => {
    setDecisionType(statut);
    setShowDecision(true);
  };

  const confirmDecision = async () => {
    if (!decisionType) return;
    setActionLoading(true);
    try {
      await congesAPI.decider(id, decisionType, remarque);
      toast.success(decisionType === 'approuve' ? 'Congé approuvé' : 'Congé refusé');
      router.push('/dashboard/conges');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
      setShowDecision(false);
    }
  };

  const handleAnnuler = async () => {
    if (!confirm('Annuler cette demande ?')) return;
    setActionLoading(true);
    try {
      await congesAPI.annuler(id);
      toast.success('Demande annulée');
      router.push('/dashboard/conges');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!conge) return (
    <div className="text-center py-12 px-4 text-slate-400">
      <p>Congé introuvable</p>
      <Link href="/dashboard/conges" className="text-blue-600 text-sm mt-2 block">Retour</Link>
    </div>
  );

  const isMine = conge.demandeur_id === user?.id;
  const agent = demandeurUser ?? conge.demandeur;
  const certFilename = conge.certificat_medical
    ? conge.certificat_medical.replace(/\\/g, '/').split('/').pop()
    : null;
  const isPdf = certFilename?.toLowerCase().endsWith('.pdf');

  const openCertificat = async () => {
    if (!certFilename) return;
    try {
      const res = await api.get(`/conges/file/${certFilename}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: (res.headers['content-type'] as string) || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch { toast.error('Impossible d\'ouvrir le fichier'); }
  };

  const loadCertPreview = async () => {
    if (!certFilename || isPdf || certBlobUrl) return;
    try {
      const res = await api.get(`/conges/file/${certFilename}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'image/jpeg' });
      setCertBlobUrl(URL.createObjectURL(blob));
    } catch {}
  };

  if (certFilename && !isPdf && !certBlobUrl) loadCertPreview();

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-14 z-10 bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <Link href="/dashboard/conges" className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <h1 className="font-black text-slate-800 flex-1">Détail du congé</h1>
        <StatutBadge statut={conge.statut} />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Demandeur card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Demandeur</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <span className="font-black text-blue-700">
                {conge.demandeur.prenom[0]}{conge.demandeur.nom[0]}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-800">{conge.demandeur.prenom} {conge.demandeur.nom}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[conge.demandeur.role]} — Équipe {conge.demandeur.equipe}</p>
              {conge.demandeur.matricule && (
                <p className="text-xs text-slate-400">Mat. {conge.demandeur.matricule}</p>
              )}
            </div>
          </div>

          {isManager && demandeurUser && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-2.5">
                <span className="text-xs text-blue-700 font-medium">Solde congés actuel</span>
                <span className="font-black text-blue-700 text-lg">{demandeurUser.soldeConge}j</span>
              </div>
            </div>
          )}
        </div>

        {/* Dates card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Période</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Date début</p>
              <p className="font-bold text-slate-800">{format(new Date(conge.dateDebut), 'dd MMM yyyy', { locale: fr })}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Date fin</p>
              <p className="font-bold text-slate-800">{format(new Date(conge.dateFin), 'dd MMM yyyy', { locale: fr })}</p>
            </div>
          </div>
          <div className="mt-3 bg-blue-50 rounded-xl p-3 text-center">
            <span className="text-2xl font-black text-blue-700">{conge.nombreJours}</span>
            <span className="text-blue-600 text-sm ml-1">jours · {TYPE_LABELS[conge.typeConge]}</span>
          </div>
          {conge.adresse_conge && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-0.5">Adresse pendant le congé</p>
              <p className="text-sm text-slate-700 font-medium">{conge.adresse_conge}</p>
            </div>
          )}
        </div>

        {/* Certificat médical */}
        {conge.typeConge === 'maladie' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Paperclip size={12} /> Certificat médical
            </p>
            {certFilename ? (
              <div className="space-y-2">
                {/* Aperçu image */}
                {!isPdf && certBlobUrl && (
                  <img
                    src={certBlobUrl}
                    alt="Certificat médical"
                    className="w-full rounded-xl border border-slate-200 max-h-64 object-contain bg-slate-50"
                  />
                )}
                {!isPdf && !certBlobUrl && (
                  <div className="w-full rounded-xl border border-slate-200 h-24 bg-slate-50 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={openCertificat}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                >
                  <FileText size={16} />
                  {isPdf ? 'Ouvrir le certificat PDF' : 'Voir en plein écran'}
                  <ExternalLink size={12} className="ml-auto" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertTriangle size={14} />
                Aucun certificat médical joint
              </div>
            )}
          </div>
        )}

        {/* Motif */}
        {conge.motif && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MessageSquare size={12} /> Motif
            </p>
            <p className="text-sm text-slate-700">{conge.motif}</p>
          </div>
        )}

        {/* Manager remarque */}
        {conge.remarqueManager && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              <MessageSquare size={12} /> Remarque du manager
            </p>
            <p className="text-sm text-amber-900">{conge.remarqueManager}</p>
          </div>
        )}

        {/* Decision info */}
        {conge.dateDecision && (
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={11} />
              Décision le {format(new Date(conge.dateDecision), 'dd MMM yyyy à HH:mm', { locale: fr })}
              {conge.manager && ` par ${conge.manager.prenom} ${conge.manager.nom}`}
            </p>
          </div>
        )}

        {/* Bouton imprimer PDF — congé annuel approuvé */}
        {conge.statut === 'approuve' && conge.typeConge === 'annuel' && (isMine || isManager) && (
          <button
            onClick={() => setShowPrint(true)}
            className="w-full py-3 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Printer size={16} /> Imprimer le formulaire de demande
          </button>
        )}

        {/* Actions manager */}
        {isManager && conge.statut === 'en_attente' && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleDecision('refuse')} disabled={actionLoading}
              className="flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50">
              <XCircle size={18} /> Refuser
            </button>
            <button onClick={() => handleDecision('approuve')} disabled={actionLoading}
              className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
              <CheckCircle size={18} /> Approuver
            </button>
          </div>
        )}

        {isMine && conge.statut === 'en_attente' && (
          <button onClick={handleAnnuler} disabled={actionLoading}
            className="w-full py-3 border border-slate-200 text-slate-500 font-semibold rounded-xl hover:bg-slate-100 active:scale-95 transition-all text-sm disabled:opacity-50">
            Annuler la demande
          </button>
        )}
      </div>

      {/* Decision Modal */}
      {showDecision && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDecision(false)} />
          <div className="relative bg-white w-full rounded-t-3xl p-6 space-y-4 slide-up max-w-lg mx-auto">
            <h3 className="font-black text-slate-800 text-lg">
              {decisionType === 'approuve' ? '✅ Approuver le congé' : '❌ Refuser le congé'}
            </h3>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Remarque {decisionType === 'refuse' ? '(recommandé)' : '(optionnelle)'}
              </label>
              <textarea value={remarque} onChange={e => setRemarque(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDecision(false)}
                className="py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl">
                Annuler
              </button>
              <button onClick={confirmDecision} disabled={actionLoading}
                className={`py-3 font-bold rounded-xl text-white disabled:opacity-60 ${
                  decisionType === 'approuve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                }`}>
                {actionLoading ? '...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal impression formulaire STEG */}
      {showPrint && (
        <div className="fixed inset-0 z-50">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #steg-print-root, #steg-print-root * { visibility: visible !important; }
              #steg-print-root { position: fixed; top: 0; left: 0; width: 100%; background: white; }
            }
          `}</style>

          <div className="absolute inset-0 bg-black/60 print:hidden" onClick={() => setShowPrint(false)} />

          <div className="relative h-full flex flex-col items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">

              {/* Barre d'actions */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 print:hidden flex-shrink-0">
                <p className="font-bold text-slate-700 text-sm">Aperçu — Formulaire de demande de congé</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()}
                    className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl">
                    <Printer size={14} /> Imprimer / PDF
                  </button>
                  <button onClick={() => setShowPrint(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Formulaire STEG */}
              <div id="steg-print-root" className="overflow-auto flex-1">
                <div dir="rtl" className="p-8 text-[13px] leading-relaxed min-h-[297mm] bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>

                  {/* En-tête */}
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-[14px]">الشركة التونسية للكهرباء والغاز</div>
                    <div className="text-[11px] text-slate-600">
                      {format(new Date(conge.createdAt), 'dd / MM / yyyy')} في
                    </div>
                  </div>
                  <div className="border-t border-dotted border-slate-400 mb-4" />

                  {/* Titre */}
                  <div className="text-center mb-4">
                    <h1 className="text-2xl font-black underline mb-1">طلب عطلـة</h1>
                    <p className="text-[12px]">(إستراحة سنوية - إستثنائية)</p>
                  </div>

                  <div className="border-t border-slate-400 mb-3" />

                  {/* Section agent */}
                  <div className="flex justify-center mb-2">
                    <div className="border border-slate-700 px-6 py-1 text-[13px] font-bold">خاص بالعـون</div>
                  </div>
                  <div className="border-t border-slate-400 mb-4" />

                  <div className="space-y-3 text-[12px]">
                    <div className="flex gap-8">
                      <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                        <span className="font-bold">الاسم واللقب :</span> {conge.demandeur.prenom} {conge.demandeur.nom}
                      </span>
                      <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                        <span className="font-bold">الرقم الآلي :</span> {conge.demandeur.matricule || '...........'}
                      </span>
                    </div>
                    <div className="flex gap-8">
                      <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                        <span className="font-bold">الوحدة :</span> {(conge.demandeur as any).unite || agent?.unite || '...........'}
                      </span>
                      <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                        <span className="font-bold">الخطة :</span> {ROLE_LABELS[conge.demandeur.role]}
                      </span>
                    </div>
                    <div className="flex gap-8">
                      <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                        <span className="font-bold">نوع العطلة :</span> {TYPE_LABELS[conge.typeConge]}
                      </span>
                      <span className="flex-1 border-b border-dotted border-slate-400 pb-0.5">
                        <span className="font-bold">المـدة :</span> {conge.nombreJours} يوم
                      </span>
                    </div>
                    <div className="border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold">سنة استحقاق العطلة :</span> {new Date(conge.dateDebut).getFullYear()}
                    </div>
                    <div className="border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold">تاريخ الدخول في العطلة :</span> {format(new Date(conge.dateDebut), 'dd / MM / yyyy')}
                    </div>
                    <div className="border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold">العنوان أثناء العطلة :</span> {conge.adresse_conge || '...........................................................'}
                    </div>
                  </div>

                  <div className="mt-6 text-right text-[12px] font-bold">إمضاء العون</div>
                  <div className="border-b border-dotted border-slate-400 mt-8 mb-4" />

                  {/* Section unité administrative */}
                  <div className="border-t border-slate-400 mb-3" />
                  <div className="flex justify-center mb-2">
                    <div className="border border-slate-700 px-6 py-1 text-[13px] font-bold">خاص بالوحدة الإدارية</div>
                  </div>
                  <div className="border-t border-slate-400 mb-4" />

                  <div className="space-y-3 text-[12px]">
                    <div className="border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold">رصيد العون من العطلة السنوية في تاريخ تقديم المطلب :</span>{' '}
                      ...........................................................
                    </div>
                    <div className="border-b border-dotted border-slate-400 pb-0.5">
                      <span className="font-bold">بعنوان سنة :</span> ...............
                    </div>
                  </div>

                  <div className="mt-6 text-right text-[12px] font-bold">ختم الوحدة الإدارية *</div>
                  <div className="border-b border-dotted border-slate-400 mt-10 mb-4" />

                  {/* Section unité responsable */}
                  <div className="border-t border-slate-400 mb-3" />
                  <div className="flex justify-center mb-2">
                    <div className="border border-slate-700 px-6 py-1 text-[13px] font-bold">خاص بالوحدة المسؤولة</div>
                  </div>
                  <div className="border-t border-slate-400 mb-4" />

                  <div className="text-[12px] font-bold mb-2">رأي وامضاء الرئيس المباشر</div>
                  <div className="mt-3 mb-2 text-[13px] font-black text-green-700 tracking-widest">APPROUVÉE</div>
                  {conge.manager && (
                    <div className="text-[11px] text-slate-600 mb-1">
                      {conge.manager.prenom} {conge.manager.nom}
                      {conge.dateDecision && ` — ${format(new Date(conge.dateDecision), 'dd/MM/yyyy')}`}
                    </div>
                  )}
                  <div className="border-b border-dotted border-slate-400 mt-6 mb-4" />

                  <div className="text-left text-[10px] text-slate-500 mt-4">* الختم إجباري</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
