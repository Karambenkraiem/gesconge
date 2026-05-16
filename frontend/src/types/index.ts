export type Role =
  | 'super_admin'
  | 'chef_exploitation'
  | 'chef_quart'
  | 'chef_bloc'
  | 'operateur'
  | 'autre';

export type Equipe = 'A' | 'B' | 'C' | 'D' | 'NONE';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  equipe: Equipe;
  soldeConge: number;
  soldeInitial: number;
  telephone?: string;
  matricule?: string;
  unite?: string;
  actif: boolean;
  createdAt: string;
}

export type StatutConge = 'en_attente' | 'approuve' | 'refuse' | 'annule';
export type TypeConge = 'annuel' | 'maladie' | 'exceptionnel' | 'sans_solde';

export interface Conge {
  id: string;
  demandeur: User;
  demandeur_id: string;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  typeConge: TypeConge;
  statut: StatutConge;
  motif?: string;
  adresse_conge?: string;
  certificat_medical?: string;
  solde_au_depot?: number;
  remarqueManager?: string;
  manager?: User;
  dateDecision?: string;
  createdAt: string;
}

export type TypeNotification = 'nouvelle_demande' | 'conge_approuve' | 'conge_refuse';

export interface Notification {
  id: string;
  destinataire_id: string;
  conge?: Conge;
  type: TypeNotification;
  message: string;
  lu: boolean;
  createdAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  chef_exploitation: 'Chef d\'Exploitation',
  chef_quart: 'Chef de Quart',
  chef_bloc: 'Chef de Bloc',
  operateur: 'Opérateur',
  autre: 'Autre',
};

export const STATUT_LABELS: Record<StatutConge, string> = {
  en_attente: 'En Attente',
  approuve: 'Approuvé',
  refuse: 'Refusé',
  annule: 'Annulé',
};

export const TYPE_LABELS: Record<TypeConge, string> = {
  annuel: 'Congé Annuel',
  maladie: 'Congé Maladie',
  exceptionnel: 'Congé Exceptionnel',
  sans_solde: 'Sans Solde',
};

export const EQUIPE_COLORS: Record<Equipe, string> = {
  A: '#7c3aed',
  B: '#0891b2',
  C: '#059669',
  D: '#d97706',
  NONE: '#6b7280',
};
