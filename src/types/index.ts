/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'comptable' | 'rh' | 'commercial' | 'employe' | 'chef_equipe';

export interface User {
  id: string;
  employee_id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  last_login?: string;
  failed_attempts: number;
  locked_until?: string | null;
  must_change_password?: boolean;
}

export type ContractType = 'CDI' | 'CDD' | 'Freelance' | 'Stage';
export type EmployeeStatus = 'actif' | 'suspendu' | 'sorti';
export type PaymentMethod = 'virement' | 'chèque' | 'espèces' | 'carte';

export interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  cin: string;
  date_naissance: string;
  telephone: string;
  email: string;
  adresse: string;
  poste: string;
  departement: string;
  type_contrat: ContractType;
  date_embauche: string;
  date_fin_contrat?: string;
  salaire_brut_base: number;
  salaire_net_base: number;
  numero_cnss: string;
  mode_paiement: PaymentMethod;
  rib: string;
  statut: EmployeeStatus;
  manager_id?: string;
  photo_url?: string;
  hourly_cost?: number; // estimated internal hourly rate for project profitability
  created_at?: string;
}

export interface EmployeeHistory {
  id: string;
  employee_id: string;
  type: 'changement poste' | 'salaire' | 'contrat' | 'statut';
  ancienne_valeur: string;
  nouvelle_valeur: string;
  date_effet: string;
  motif: string;
  created_at?: string;
}

export type PayrollStatus = 'brouillon' | 'validée' | 'payée';

export interface Payroll {
  id: string;
  employee_id: string;
  mois: string; // YYYY-MM
  salaire_brut: number;
  primes: number;
  heures_sup: number;
  indemnites_deplacement: number;
  cnss_salarie: number;
  amo: number;
  ir: number;
  autres_retenues: number;
  avances: number;
  net_a_payer: number;
  statut: PayrollStatus;
  date_paiement?: string;
  expense_id?: string;
  created_at?: string;
}

export type ClientType = 'société' | 'particulier';
export type ClientStatus = 'prospect' | 'actif' | 'inactif';

export interface Client {
  id: string;
  code_client: string;
  raison_sociale: string;
  type: ClientType;
  ice: string;
  if: string;
  rc: string;
  contact_nom: string;
  contact_fonction: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  statut: ClientStatus;
  commercial_id: string;
  date_creation: string;
  notes: string;
}

export type ProjectType = 'site web' | 'application' | 'POS' | 'gestion' | 'autre';
export type ProjectStatus = 'en cours' | 'livré' | 'suspendu' | 'annulé';

export interface Project {
  id: string;
  client_id: string;
  nom_systeme: string;
  type: ProjectType;
  description: string;
  technologies: string;
  date_signature: string;
  date_livraison: string;
  prix_vente_ht: number;
  statut: ProjectStatus;
  chef_projet_id: string;
  url_production?: string;
  lien_documentation?: string;
}

export type MaintenancePeriodicity = 'mensuelle' | 'trimestrielle' | 'annuelle';
export type ContractStatus = 'actif' | 'expiré' | 'résilié' | 'suspendu';

export interface Contract {
  id: string;
  numero_contrat: string;
  client_id: string;
  project_id: string;
  type: 'maintenance corrective' | 'évolutive' | 'complète';
  date_debut: string;
  date_fin: string;
  periodicite: MaintenancePeriodicity;
  montant_ht: number;
  renouvellement_auto: boolean;
  preavis_jours: number;
  prochaine_facturation: string;
  sla_description: string;
  heures_incluses: number;
  statut: ContractStatus;
  fichier_pdf_url?: string;
}

export type InvoiceType = 'vente' | 'maintenance' | 'service' | 'avoir';
export type InvoiceStatus = 'brouillon' | 'envoyée' | 'validée' | 'payée partiellement' | 'payée' | 'annulée';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  designation: string;
  quantite: number;
  unite: string;
  prix_unitaire_ht: number;
  remise_ligne: number;
  total_ligne_ht: number;
}

export interface Invoice {
  id: string;
  numero: string; // FA-YYYY-NNNN or AV-YYYY-NNNN
  type: InvoiceType;
  client_id: string;
  project_id?: string;
  contract_id?: string;
  date_emission: string;
  date_echeance: string;
  total_ht: number;
  taux_tva: number; // default 20%
  montant_tva: number;
  total_ttc: number;
  remise: number;
  statut: InvoiceStatus;
  montant_paye: number;
  reste_a_payer: number;
  validee_par?: string;
  date_validation?: string;
  pdf_url?: string;
  facture_origine_id?: string;
  notes?: string;
  items?: InvoiceItem[];
  created_at?: string;
}

export type QuoteStatus = 'brouillon' | 'envoyé' | 'accepté' | 'refusé' | 'converti';

export interface Quote {
  id: string;
  numero: string; // DE-YYYY-NNNN
  client_id: string;
  project_id?: string;
  date_emission: string;
  date_validite: string;
  total_ht: number;
  taux_tva: number;
  montant_tva: number;
  total_ttc: number;
  statut: QuoteStatus;
  items: InvoiceItem[];
  notes?: string;
  converted_invoice_id?: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  client_id: string;
  date_paiement: string;
  montant: number;
  mode: PaymentMethod;
  reference: string;
  banque: string;
  justificatif_url?: string;
  enregistre_par: string;
  statut: 'encaissé' | 'en attente' | 'rejeté';
  created_at?: string;
}

export interface ExpenseCategory {
  id: string;
  nom: string;
  type: 'fixe' | 'variable';
  parent_id?: string;
}

export type ExpenseSource = 'manuelle' | 'paie' | 'déplacement';
export type ExpenseStatus = 'en attente' | 'validée' | 'rejetée';

export interface Expense {
  id: string;
  date: string;
  categorie_id: string;
  libelle: string;
  fournisseur: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  mode_paiement: PaymentMethod;
  recurrente: boolean;
  periodicite?: 'mensuelle' | 'trimestrielle' | 'annuelle';
  source: ExpenseSource;
  payroll_id?: string;
  visit_expense_id?: string;
  justificatif_url?: string;
  statut: ExpenseStatus;
  valide_par?: string;
  created_at?: string;
}

export type WorkLocation = 'bureau' | 'télétravail' | 'chez client';
export type ReportStatus = 'brouillon' | 'soumis' | 'validé';
export type TaskStatus = 'terminée' | 'en cours' | 'bloquée';

export interface ReportTask {
  id: string;
  report_id: string;
  client_id?: string;
  project_id?: string;
  description: string;
  heures: number;
  statut_tache: TaskStatus;
}

export interface DailyReport {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  lieu: WorkLocation;
  heures_total: number;
  blocages: string;
  plan_demain: string;
  statut: ReportStatus;
  soumis_le?: string;
  commentaire_manager?: string;
  valide_par?: string;
  tasks?: ReportTask[];
}

export type VisitResult = 'résolu' | 'partiel' | 'à revoir';
export type VisitExpenseType = 'transport' | 'essence' | 'repas' | 'hébergement' | 'autre';

export interface VisitExpense {
  id: string;
  visit_id: string;
  type: VisitExpenseType;
  montant: number;
  justificatif_url?: string;
  statut: 'en attente' | 'validé' | 'rejeté';
  expense_id?: string;
}

export interface SiteVisit {
  id: string;
  report_id?: string;
  employee_id: string;
  client_id: string;
  project_id?: string;
  contract_id?: string;
  date: string;
  motif: string;
  heure_depart: string;
  heure_arrivee: string;
  heure_retour: string;
  travail_effectue: string;
  resultat: VisitResult;
  problemes?: string;
  materiel_utilise?: string;
  facturable: boolean;
  montant_facturable?: number;
  bon_intervention_url?: string;
  signature_client_url?: string;
  invoice_id?: string;
  expenses?: VisitExpense[];
  gps_lat?: number;
  gps_lng?: number;
}

export interface AppSettings {
  company_name: string;
  ice: string;
  if_number: string;
  rc: string;
  patente: string;
  rib: string;
  adresse: string;
  ville: string;
  telephone: string;
  email: string;
  logo_url: string;
  default_vat_rate: number; // e.g. 20%
  cnss_rate_employee: number; // e.g. 4.48%
  cnss_ceiling: number; // e.g. 6000 DH
  amo_rate_employee: number; // e.g. 2.26%
  daily_report_cutoff_hour: string; // e.g. "18:30"
  reminder_delay_days: number; // e.g. 15
  session_timeout_hours: number; // e.g. 8
  invoice_legal_notes: string;
  sheets_webhook_url?: string;
  enable_gps: boolean;
}

export interface AuditLogEntry {
  id: string;
  horodatage: string;
  user_id: string;
  user_name: string;
  action: 'créer' | 'modifier' | 'valider' | 'supprimer' | 'connexion' | 'paiement';
  table: string;
  enregistrement_id: string;
  ancien?: Record<string, unknown> | null;
  nouveau?: Record<string, unknown> | null;
  ip: string;
}

export interface PaymentReminder {
  id: string;
  invoice_id: string;
  client_id: string;
  date_envoi: string;
  type: 'email' | 'whatsapp';
  destinataire: string;
  message: string;
  statut: 'envoyé' | 'lu' | 'en attente';
}
