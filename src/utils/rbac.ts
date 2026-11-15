/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PermissionKey, PermissionDefinition, Role, User, UserRole } from '../types';

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Général & Tableau de bord
  {
    key: 'view_dashboard',
    label: 'Tableau de bord',
    description: 'Accéder au tableau de bord, KPIs et graphiques de rentabilité',
    module: 'Général',
  },
  // Ressources Humaines
  {
    key: 'manage_employees',
    label: 'Gestion des Employés',
    description: 'Créer, modifier, consulter et archiver les fiches salariés',
    module: 'Ressources Humaines',
  },
  {
    key: 'manage_payroll',
    label: 'Paie du mois & Barème Marocain',
    description: 'Générer, calculer, valider et payer les bulletins de paie (IR, CNSS, AMO)',
    module: 'Ressources Humaines',
  },
  // Relation Client & Contrats
  {
    key: 'manage_clients',
    label: 'Clients & Fiche 360°',
    description: 'Gérer le fichier client, coordonnées, ICE, IF et historique commercial',
    module: 'Relation Client & Contrats',
  },
  {
    key: 'manage_projects',
    label: 'Systèmes vendus & Projets',
    description: 'Créer et suivre les projets livrés, technologies et coûts',
    module: 'Relation Client & Contrats',
  },
  {
    key: 'manage_contracts',
    label: 'Contrats de maintenance',
    description: 'Créer, renouveler et facturer les contrats de maintenance périodique',
    module: 'Relation Client & Contrats',
  },
  {
    key: 'cancel_pack',
    label: 'Annuler le pack / contrat (Workflow critique)',
    description: 'Résiliation ou annulation exceptionnelle de pack et contrat client',
    module: 'Relation Client & Contrats',
  },
  // Facturation & Trésorerie
  {
    key: 'manage_invoices',
    label: 'Factures & Avoirs',
    description: 'Créer, modifier, émettre et valider les factures officielles et avoirs',
    module: 'Facturation & Trésorerie',
  },
  {
    key: 'manage_quotes',
    label: 'Devis commerciaux',
    description: 'Créer, envoyer et convertir les devis clients en factures',
    module: 'Facturation & Trésorerie',
  },
  {
    key: 'manage_reminders',
    label: 'Relances des impayés',
    description: 'Générer et envoyer les relances par email ou WhatsApp',
    module: 'Facturation & Trésorerie',
  },
  {
    key: 'manage_expenses',
    label: 'Charges & Dépenses',
    description: 'Enregistrer et valider les dépenses fournisseurs, fixes et variables',
    module: 'Facturation & Trésorerie',
  },
  {
    key: 'cancel_extras',
    label: 'Extras cancellation (Workflow Caissier/Admin)',
    description: 'Annuler les suppléments, lignes d\'extras et ajustements de caisse',
    module: 'Facturation & Trésorerie',
  },
  // Activité & Terrain
  {
    key: 'fill_daily_report',
    label: 'Mon rapport journalier',
    description: 'Remplir et soumettre sa feuille d\'heures et tâches quotidiennes',
    module: 'Activité & Terrain',
  },
  {
    key: 'manage_team_reports',
    label: 'Rapports de l\'équipe',
    description: 'Consulter et valider les rapports journaliers des collaborateurs',
    module: 'Activité & Terrain',
  },
  {
    key: 'manage_site_visits',
    label: 'Déplacements terrain & Bons',
    description: 'Enregistrer les interventions sur site, signatures et notes de frais',
    module: 'Activité & Terrain',
  },
  {
    key: 'view_reports_exports',
    label: 'Exports & Synthèses',
    description: 'Générer les synthèses d\'heures et exporter les données en CSV/Sheets',
    module: 'Activité & Terrain',
  },
  // Administration & Paramètres
  {
    key: 'manage_users',
    label: 'Gestion des Utilisateurs',
    description: 'Créer, modifier, suspendre et supprimer les comptes utilisateurs',
    module: 'Administration & Paramètres',
  },
  {
    key: 'manage_roles',
    label: 'Gestion des Rôles & Permissions',
    description: 'Créer des rôles et configurer la matrice des droits d\'accès',
    module: 'Administration & Paramètres',
  },
  {
    key: 'manage_settings',
    label: 'Paramètres Société & Fiscaux',
    description: 'Modifier la raison sociale, ICE, taux TVA/CNSS et Apps Script',
    module: 'Administration & Paramètres',
  },
  {
    key: 'view_audit_log',
    label: 'Journal d\'audit & Sécurité',
    description: 'Consulter la traçabilité intégrale des actions et connexions',
    module: 'Administration & Paramètres',
  },
];

export const PERMISSION_MODULES = [
  'Général',
  'Ressources Humaines',
  'Relation Client & Contrats',
  'Facturation & Trésorerie',
  'Activité & Terrain',
  'Administration & Paramètres',
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_DEFINITIONS.map((p) => p.key);

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'ROLE-001',
    key: 'super_admin',
    name: 'Super Admin',
    description: 'Accès absolu à tous les modules, gestion des utilisateurs, rôles, permissions et annulations critiques',
    isSystem: true,
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
    permissions: [...ALL_PERMISSION_KEYS],
    created_at: '2026-01-01',
  },
  {
    id: 'ROLE-002',
    key: 'admin',
    name: 'Admin / Gérant',
    description: 'Gestion complète de la société, validation financière, RH, administration et paramètres',
    isSystem: true,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    permissions: [
      'view_dashboard',
      'manage_employees',
      'manage_payroll',
      'manage_clients',
      'manage_projects',
      'manage_contracts',
      'cancel_pack',
      'manage_invoices',
      'manage_quotes',
      'manage_reminders',
      'manage_expenses',
      'cancel_extras',
      'fill_daily_report',
      'manage_team_reports',
      'manage_site_visits',
      'view_reports_exports',
      'manage_users',
      'manage_roles',
      'manage_settings',
      'view_audit_log',
    ],
    created_at: '2026-01-01',
  },
  {
    id: 'ROLE-003',
    key: 'cashier',
    name: 'Caissier / Trésorier (Cashier)',
    description: 'Encaissements, facturation, trésorerie et workflows d\'annulation (Extras cancellation & Annuler le pack)',
    isSystem: true,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
    permissions: [
      'view_dashboard',
      'manage_invoices',
      'manage_quotes',
      'manage_reminders',
      'manage_expenses',
      'cancel_extras',
      'cancel_pack',
      'fill_daily_report',
      'manage_site_visits',
    ],
    created_at: '2026-01-01',
  },
  {
    id: 'ROLE-004',
    key: 'comptable',
    name: 'Comptable',
    description: 'Gestion comptable, déclarations fiscales, factures, paie, charges et annulation d\'extras',
    isSystem: true,
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
    permissions: [
      'view_dashboard',
      'manage_payroll',
      'manage_clients',
      'manage_projects',
      'manage_contracts',
      'manage_invoices',
      'manage_quotes',
      'manage_reminders',
      'manage_expenses',
      'cancel_extras',
      'view_reports_exports',
      'fill_daily_report',
    ],
    created_at: '2026-01-01',
  },
  {
    id: 'ROLE-005',
    key: 'rh',
    name: 'Ressources Humaines (RH)',
    description: 'Gestion du personnel, contrats de travail, suivi des congés et paie mensuelle',
    isSystem: true,
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
    permissions: [
      'view_dashboard',
      'manage_employees',
      'manage_payroll',
      'manage_team_reports',
      'manage_site_visits',
      'view_reports_exports',
      'fill_daily_report',
    ],
    created_at: '2026-01-01',
  },
  {
    id: 'ROLE-006',
    key: 'commercial',
    name: 'Commercial',
    description: 'Prospection, gestion clients 360°, devis commerciaux et suivi des contrats',
    isSystem: true,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
    permissions: [
      'view_dashboard',
      'manage_clients',
      'manage_projects',
      'manage_contracts',
      'manage_quotes',
      'manage_invoices',
      'fill_daily_report',
    ],
    created_at: '2026-01-01',
  },
  {
    id: 'ROLE-007',
    key: 'chef_equipe',
    name: 'Chef d\'équipe',
    description: 'Supervision technique, validation des rapports d\'activité et suivi de projets',
    isSystem: true,
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    permissions: [
      'view_dashboard',
      'manage_clients',
      'manage_projects',
      'manage_contracts',
      'manage_team_reports',
      'manage_site_visits',
      'fill_daily_report',
    ],
    created_at: '2026-01-01',
  },
  {
    id: 'ROLE-008',
    key: 'employe',
    name: 'Employé / Développeur',
    description: 'Saisie du rapport quotidien et enregistrement des déplacements sur le terrain',
    isSystem: true,
    badgeColor: 'bg-[#E2EAF5] text-[#1E355E] border-[#B8CAE2]',
    permissions: [
      'view_dashboard',
      'fill_daily_report',
      'manage_site_visits',
    ],
    created_at: '2026-01-01',
  },
];

/**
 * Normalizes role key strings (e.g. 'super admin' -> 'super_admin')
 */
export function normalizeRoleKey(roleStr: string): string {
  if (!roleStr) return '';
  return roleStr.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Finds a role object either by ID or key
 */
export function findRole(roleIdentifier: string, rolesList: Role[] = DEFAULT_ROLES): Role | undefined {
  if (!roleIdentifier) return undefined;
  const normalized = normalizeRoleKey(roleIdentifier);
  return (
    rolesList.find((r) => r.id === roleIdentifier) ||
    rolesList.find((r) => normalizeRoleKey(r.key) === normalized) ||
    rolesList.find((r) => r.key === roleIdentifier)
  );
}

/**
 * Checks whether a given role has a specific permission
 */
export function hasPermission(
  roleOrKey: string | Role | undefined,
  permission: PermissionKey,
  rolesList: Role[] = DEFAULT_ROLES
): boolean {
  if (!roleOrKey) return false;

  const roleObj = typeof roleOrKey === 'object' ? roleOrKey : findRole(roleOrKey, rolesList);
  if (!roleObj) {
    // Fallback: If role is string and equals super_admin
    const normalized = typeof roleOrKey === 'string' ? normalizeRoleKey(roleOrKey) : '';
    if (normalized === 'super_admin' || normalized === 'superadmin') {
      return true;
    }
    return false;
  }

  // Super admin always has all permissions
  if (normalizeRoleKey(roleObj.key) === 'super_admin') {
    return true;
  }

  return roleObj.permissions.includes(permission);
}

/**
 * Mapping between navigation item keys and required permission keys
 */
export const NAV_PERMISSION_MAP: Record<string, PermissionKey> = {
  dashboard: 'view_dashboard',
  employees: 'manage_employees',
  payroll: 'manage_payroll',
  clients: 'manage_clients',
  projects: 'manage_projects',
  contracts: 'manage_contracts',
  invoices: 'manage_invoices',
  quotes: 'manage_quotes',
  reminders: 'manage_reminders',
  expenses: 'manage_expenses',
  daily_report: 'fill_daily_report',
  team_reports: 'manage_team_reports',
  site_visits: 'manage_site_visits',
  reports_exports: 'view_reports_exports',
  users_admin: 'manage_users',
  settings: 'manage_settings',
  audit_log: 'view_audit_log',
};

/**
 * Checks whether a user with given role can access a navigation tab
 */
export function canAccessNav(
  navKey: string,
  roleOrKey: string | Role | undefined,
  rolesList: Role[] = DEFAULT_ROLES
): boolean {
  const requiredPerm = NAV_PERMISSION_MAP[navKey];
  if (!requiredPerm) {
    return true; // Unprotected route
  }
  return hasPermission(roleOrKey, requiredPerm, rolesList);
}

/**
 * Validates whether a role can be safely deleted.
 * Rejects deletion if:
 * 1. The role is assigned to one or more active users
 * 2. The role is a protected system role ('super_admin')
 */
export function canDeleteRole(
  roleIdOrKey: string,
  users: User[],
  rolesList: Role[] = DEFAULT_ROLES
): { allowed: boolean; reason?: string; userCount?: number } {
  const role = findRole(roleIdOrKey, rolesList);
  if (!role) {
    return { allowed: false, reason: 'Rôle introuvable dans le système.' };
  }

  const normalizedKey = normalizeRoleKey(role.key);
  if (normalizedKey === 'super_admin') {
    return {
      allowed: false,
      reason: 'Impossible de supprimer le rôle système critique "Super Admin".',
    };
  }

  // Check if any user is currently assigned this role
  const assignedUsers = users.filter((u) => {
    return u.role_id === role.id || normalizeRoleKey(u.role) === normalizedKey || u.role === role.key;
  });

  if (assignedUsers.length > 0) {
    return {
      allowed: false,
      reason: `Impossible de supprimer le rôle "${role.name}" : il est actuellement assigné à ${assignedUsers.length} utilisateur(s). Vous devez d'abord leur assigner un autre rôle.`,
      userCount: assignedUsers.length,
    };
  }

  return { allowed: true, userCount: 0 };
}

/**
 * Validates whether a user can be deleted.
 * Rejects deletion if:
 * 1. The user attempts to delete their own account
 * 2. The user is the last super admin in the system
 */
export function canDeleteUser(
  userIdToDelete: string,
  currentUserId: string,
  allUsers: User[],
  rolesList: Role[] = DEFAULT_ROLES
): { allowed: boolean; reason?: string } {
  if (!userIdToDelete) {
    return { allowed: false, reason: 'Identifiant d\'utilisateur manquant.' };
  }

  // Prevent self-deletion
  if (userIdToDelete === currentUserId) {
    return {
      allowed: false,
      reason: 'Action interdite : vous ne pouvez pas supprimer votre propre compte actuellement connecté.',
    };
  }

  const targetUser = allUsers.find((u) => u.id === userIdToDelete);
  if (!targetUser) {
    return { allowed: false, reason: 'Utilisateur introuvable.' };
  }

  const isSuperAdmin = (u: User): boolean => {
    const norm = normalizeRoleKey(u.role);
    if (norm === 'super_admin' || norm === 'superadmin') return true;
    const r = findRole(u.role_id || u.role, rolesList);
    return r ? normalizeRoleKey(r.key) === 'super_admin' : false;
  };

  // If target user is super admin, verify they are not the last one
  if (isSuperAdmin(targetUser)) {
    const superAdminCount = allUsers.filter((u) => isSuperAdmin(u) && u.active).length;
    if (superAdminCount <= 1) {
      return {
        allowed: false,
        reason: 'Action interdite : impossible de supprimer le dernier Super Administrateur actif du système.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Validates whether a user can be demoted from super_admin to another role.
 * Ensures the system always retains at least one active super admin.
 */
export function canDemoteSuperAdmin(
  userIdToUpdate: string,
  newRoleKey: string,
  allUsers: User[],
  rolesList: Role[] = DEFAULT_ROLES
): { allowed: boolean; reason?: string } {
  const targetUser = allUsers.find((u) => u.id === userIdToUpdate);
  if (!targetUser) {
    return { allowed: true };
  }

  const isTargetSuperAdmin =
    normalizeRoleKey(targetUser.role) === 'super_admin' ||
    findRole(targetUser.role_id || targetUser.role, rolesList)?.key === 'super_admin';

  const isNewRoleSuperAdmin = normalizeRoleKey(newRoleKey) === 'super_admin';

  if (isTargetSuperAdmin && !isNewRoleSuperAdmin) {
    const otherSuperAdmins = allUsers.filter((u) => {
      if (u.id === userIdToUpdate) return false;
      if (!u.active) return false;
      const norm = normalizeRoleKey(u.role);
      if (norm === 'super_admin') return true;
      const r = findRole(u.role_id || u.role, rolesList);
      return r ? normalizeRoleKey(r.key) === 'super_admin' : false;
    });

    if (otherSuperAdmins.length === 0) {
      return {
        allowed: false,
        reason: 'Action refusée : il doit obligatoirement rester au moins un Super Administrateur actif dans le système.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Validates specific business workflows like "Annuler le pack" or "Extras cancellation"
 */
export function canExecuteWorkflowAction(
  action: 'cancel_pack' | 'cancel_extras' | 'validate_invoice' | 'manage_payroll',
  roleOrKey: string | Role | undefined,
  rolesList: Role[] = DEFAULT_ROLES
): { allowed: boolean; reason?: string } {
  const permMap: Record<string, PermissionKey> = {
    cancel_pack: 'cancel_pack',
    cancel_extras: 'cancel_extras',
    validate_invoice: 'manage_invoices',
    manage_payroll: 'manage_payroll',
  };

  const requiredPerm = permMap[action];
  if (!requiredPerm) {
    return { allowed: true };
  }

  const allowed = hasPermission(roleOrKey, requiredPerm, rolesList);
  if (!allowed) {
    return {
      allowed: false,
      reason: `Action refusée : votre rôle ne dispose pas de la permission "${requiredPerm}" requise pour cette opération.`,
    };
  }

  return { allowed: true };
}
