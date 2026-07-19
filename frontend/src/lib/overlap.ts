import { Conge, Role } from '../types';
import { parseISO } from 'date-fns';

const ACTIVE_STATUTS = ['en_attente', 'approuve'];

// Autres agents du même rôle déjà en congé (approuvé ou en attente) sur une période donnée.
export function findRoleOverlaps(
  conges: Conge[],
  role: Role,
  dateDebut: string,
  dateFin: string,
  excludeDemandeurId: string,
  excludeCongeId?: string,
): Conge[] {
  const debut = parseISO(dateDebut);
  const fin = parseISO(dateFin);
  return conges.filter(c => {
    if (c.id === excludeCongeId) return false;
    if (c.demandeur_id === excludeDemandeurId) return false;
    if (c.demandeur.role !== role) return false;
    if (!ACTIVE_STATUTS.includes(c.statut)) return false;
    return parseISO(c.dateDebut) <= fin && parseISO(c.dateFin) >= debut;
  });
}
