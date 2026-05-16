import { StatutConge, STATUT_LABELS } from '../types';

const styles: Record<StatutConge, string> = {
  en_attente: 'bg-amber-100 text-amber-700 border-amber-200',
  approuve: 'bg-green-100 text-green-700 border-green-200',
  refuse: 'bg-red-100 text-red-700 border-red-200',
  annule: 'bg-gray-100 text-gray-500 border-gray-200',
};

const dots: Record<StatutConge, string> = {
  en_attente: 'bg-amber-400',
  approuve: 'bg-green-500',
  refuse: 'bg-red-500',
  annule: 'bg-gray-400',
};

export default function StatutBadge({ statut, small }: { statut: StatutConge; small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-semibold ${styles[statut]} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[statut]}`} />
      {STATUT_LABELS[statut]}
    </span>
  );
}
