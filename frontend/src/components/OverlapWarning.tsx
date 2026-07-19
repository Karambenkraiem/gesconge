import { Conge, ROLE_LABELS } from '../types';
import { format, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

// Alerte non-bloquante : n'empêche jamais une soumission ou une décision,
// elle informe seulement que d'autres agents du même rôle sont déjà en congé.
export default function OverlapWarning({ overlaps }: { overlaps: Conge[] }) {
  if (overlaps.length < 2) return null;
  const role = overlaps[0].demandeur.role;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 slide-up">
      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs font-bold text-amber-800">
          {overlaps.length} {ROLE_LABELS[role]}s déjà en congé sur cette période
        </p>
        <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
          {overlaps.slice(0, 4).map(c => (
            <li key={c.id} className="truncate">
              {c.demandeur.prenom} {c.demandeur.nom} · Éq.{c.demandeur.equipe}
              {' — '}
              {format(parseISO(c.dateDebut), 'dd/MM')} → {format(parseISO(c.dateFin), 'dd/MM')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
