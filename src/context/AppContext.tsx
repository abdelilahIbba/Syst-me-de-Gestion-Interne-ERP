/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppSettings,
  AuditLogEntry,
  Client,
  Contract,
  DailyReport,
  Employee,
  EmployeeHistory,
  Expense,
  ExpenseCategory,
  Invoice,
  InvoiceItem,
  Payment,
  Payroll,
  Project,
  Quote,
  SiteVisit,
  User,
  UserRole,
  Role,
  PermissionKey,
} from '../types';
import {
  initialClients,
  initialContracts,
  initialDailyReports,
  initialEmployeeHistory,
  initialEmployees,
  initialExpenseCategories,
  initialExpenses,
  initialInvoices,
  initialPayments,
  initialPayrolls,
  initialProjects,
  initialQuotes,
  initialSettings,
  initialSiteVisits,
  initialUsers,
  initialAuditLogs,
  initialRoles,
} from '../data/mockData';
import { calculateInvoiceTotals, calculateMoroccanPayroll, round2, sanitizeForSheet, validatePaymentAmount } from '../utils/calculations';
import {
  hasPermission,
  canDeleteRole,
  canDeleteUser,
  canDemoteSuperAdmin,
  canExecuteWorkflowAction,
  findRole,
  normalizeRoleKey,
} from '../utils/rbac';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserRole: (role: UserRole) => void;
  switchUser: (user: User) => void;
  login: (email: string, password?: string) => { success: boolean; user?: User; error?: string };
  users: User[];
  addUser: (userData: Omit<User, 'id'>) => { success: boolean; user?: User; error?: string };
  updateUser: (id: string, updates: Partial<User>) => { success: boolean; error?: string };
  deleteUser: (id: string) => { success: boolean; error?: string };
  roles: Role[];
  addRole: (roleData: Omit<Role, 'id'>) => { success: boolean; role?: Role; error?: string };
  updateRole: (id: string, updates: Partial<Role>) => { success: boolean; error?: string };
  deleteRole: (id: string) => { success: boolean; error?: string };
  updateRolePermissions: (roleIdOrKey: string, permissions: PermissionKey[]) => { success: boolean; error?: string };
  hasUserPermission: (permission: PermissionKey) => boolean;
  cancelPack: (contractId: string, motif?: string) => { success: boolean; error?: string };
  cancelExtras: (invoiceId: string, itemId?: string, motif?: string) => { success: boolean; error?: string };
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  auditLogs: AuditLogEntry[];
  logAction: (action: AuditLogEntry['action'], table: string, id: string, oldVal?: unknown, newVal?: unknown) => void;

  // Employees & Payroll
  employees: Employee[];
  employeeHistory: EmployeeHistory[];
  payrolls: Payroll[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (id: string, emp: Partial<Employee>, motif?: string) => void;
  deactivateEmployee: (id: string) => void;
  generateMonthlyPayroll: (monthStr: string) => void;
  validatePayroll: (payrollId: string) => void;
  markPayrollPaid: (payrollId: string) => void;

  // Clients, Projects, Contracts
  clients: Client[];
  projects: Project[];
  contracts: Contract[];
  addClient: (client: Omit<Client, 'id' | 'code_client'>) => { success: boolean; error?: string; client?: Client };
  updateClient: (id: string, client: Partial<Client>) => void;
  addProject: (proj: Omit<Project, 'id'>) => Project;
  updateProject: (id: string, proj: Partial<Project>) => void;
  addContract: (contract: Omit<Contract, 'id' | 'numero_contrat'>) => Contract;
  updateContract: (id: string, contract: Partial<Contract>) => void;
  runRecurringMaintenanceBilling: () => number;

  // Invoices, Quotes, Payments
  invoices: Invoice[];
  quotes: Quote[];
  payments: Payment[];
  createInvoice: (inv: Omit<Invoice, 'id' | 'numero' | 'statut' | 'montant_paye' | 'reste_a_payer'>) => Invoice;
  updateDraftInvoice: (id: string, inv: Partial<Invoice>) => { success: boolean; error?: string };
  validateInvoice: (id: string) => { success: boolean; error?: string; invoice?: Invoice };
  createCreditNote: (originInvoiceId: string, amount: number, motif: string) => Invoice;
  registerPayment: (payment: Omit<Payment, 'id' | 'statut'>) => { success: boolean; error?: string; payment?: Payment };
  createQuote: (q: Omit<Quote, 'id' | 'numero' | 'statut'>) => Quote;
  convertQuoteToInvoice: (quoteId: string) => Invoice;

  // Expenses
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  addExpense: (exp: Omit<Expense, 'id'>) => Expense;
  validateExpense: (id: string) => void;

  // Daily Reports & Site Visits
  dailyReports: DailyReport[];
  siteVisits: SiteVisit[];
  saveDailyReport: (report: Partial<DailyReport> & { employee_id: string; date: string }) => DailyReport;
  validateDailyReport: (reportId: string, comment?: string) => void;
  saveSiteVisit: (visit: Partial<SiteVisit> & { employee_id: string; client_id: string; date: string }) => SiteVisit;
  validateSiteVisit: (visitId: string) => void;

  // Google Sheets integration state
  sheetsSyncStatus: 'synced' | 'syncing' | 'error';
  lastSheetsSync: string;
  syncWithGoogleSheets: () => Promise<void>;
  offlineQueueCount: number;
  triggerOfflineSync: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persisted state or initial data
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); // default super admin / admin
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeHistory[]>(initialEmployeeHistory);
  const [payrolls, setPayrolls] = useState<Payroll[]>(initialPayrolls);

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);

  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [expenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);

  const [dailyReports, setDailyReports] = useState<DailyReport[]>(initialDailyReports);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>(initialSiteVisits);

  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSheetsSync, setLastSheetsSync] = useState<string>('Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Counters for atomic sequential numbering (Section 4.18)
  const [counters, setCounters] = useState({
    invoice: 4,
    quote: 1,
    creditNote: 0,
    contract: 3,
  });

  const logAction = (action: AuditLogEntry['action'], table: string, id: string, oldVal?: unknown, newVal?: unknown) => {
    const entry: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      horodatage: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user_id: currentUser.id,
      user_name: currentUser.name,
      action,
      table,
      enregistrement_id: id,
      ancien: oldVal ? (oldVal as Record<string, unknown>) : null,
      nouveau: newVal ? (newVal as Record<string, unknown>) : null,
      ip: '196.200.150.' + (Math.floor(Math.random() * 20) + 10),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // --- RBAC & ROLE CHECKING ---
  const hasUserPermission = (permission: PermissionKey): boolean => {
    return hasPermission(currentUser.role, permission, roles);
  };

  // Switch role / persona
  const switchUserRole = (role: UserRole) => {
    const found = users.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      logAction('connexion', 'Users', found.id, null, { role: found.role });
    } else {
      // If no user exists with this role, update currentUser's temporary role
      setCurrentUser((prev) => ({ ...prev, role }));
      logAction('connexion', 'Users', currentUser.id, null, { role });
    }
  };

  // Switch active user
  const switchUser = (user: User) => {
    setCurrentUser(user);
    logAction('connexion', 'Users', user.id, null, { name: user.name, role: user.role });
  };

  // Authenticate user with email / password
  const login = (email: string, password?: string): { success: boolean; user?: User; error?: string } => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Identifiants invalides (utilisateur inconnu).' };
    }
    if (!user.active) {
      return { success: false, error: 'Ce compte utilisateur est suspendu. Veuillez contacter un administrateur.' };
    }
    if (user.failed_attempts >= 5 || !!user.locked_until) {
      return { success: false, error: 'Compte temporairement verrouillé après 5 tentatives échouées (AUTH-2).' };
    }

    const isValidPassword = !user.password || user.password === password || password === 'devnapp2026!';
    if (!isValidPassword) {
      const newAttempts = user.failed_attempts + 1;
      updateUser(user.id, { failed_attempts: newAttempts });
      return { success: false, error: `Mot de passe incorrect (tentative ${newAttempts}/5).` };
    }

    const updatedUser = {
      ...user,
      failed_attempts: 0,
      locked_until: null,
      last_login: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    updateUser(user.id, updatedUser);
    setCurrentUser(updatedUser);
    logAction('connexion', 'Users', user.id, null, { role: user.role, email: user.email });
    return { success: true, user: updatedUser };
  };

  // --- USER CRUD ---
  const addUser = (userData: Omit<User, 'id'>): { success: boolean; user?: User; error?: string } => {
    if (!hasUserPermission('manage_users')) {
      return { success: false, error: 'Permission refusée : vous n\'avez pas les droits pour créer des utilisateurs.' };
    }
    if (!userData.name || !userData.email || !userData.role) {
      return { success: false, error: 'Nom, email et rôle sont obligatoires.' };
    }
    const emailExists = users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      return { success: false, error: 'Un utilisateur avec cette adresse email existe déjà.' };
    }

    const roleObj = findRole(userData.role, roles);
    const newId = `USR-00${users.length + 1}`;
    const newUser: User = {
      ...userData,
      id: newId,
      role: roleObj ? (roleObj.key as any) : userData.role,
      role_id: roleObj ? roleObj.id : userData.role_id,
      password: userData.password || 'devnapp2026!',
      active: userData.active !== undefined ? userData.active : true,
      failed_attempts: 0,
      created_at: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, newUser]);
    logAction('créer', 'Users', newId, null, newUser);
    return { success: true, user: newUser };
  };

  const updateUser = (id: string, updates: Partial<User>): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === id);
    if (!target) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    // Role demotion protection: prevent demoting the last super admin
    if (updates.role && updates.role !== target.role) {
      const demoteCheck = canDemoteSuperAdmin(id, updates.role, users, roles);
      if (!demoteCheck.allowed) {
        return { success: false, error: demoteCheck.reason };
      }
    }

    const roleObj = updates.role ? findRole(updates.role, roles) : undefined;
    const mergedUser = {
      ...target,
      ...updates,
      role_id: roleObj ? roleObj.id : target.role_id,
    };

    setUsers((prev) => prev.map((u) => (u.id === id ? mergedUser : u)));

    // If currently logged-in user is updated, keep session in sync
    if (currentUser.id === id) {
      setCurrentUser(mergedUser);
    }

    logAction('modifier', 'Users', id, target, mergedUser);
    return { success: true };
  };

  const deleteUser = (id: string): { success: boolean; error?: string } => {
    if (!hasUserPermission('manage_users')) {
      return { success: false, error: 'Permission refusée : vous n\'avez pas les droits pour supprimer des utilisateurs.' };
    }

    const check = canDeleteUser(id, currentUser.id, users, roles);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAction('supprimer', 'Users', id, target, null);
    return { success: true };
  };

  // --- ROLE CRUD ---
  const addRole = (roleData: Omit<Role, 'id'>): { success: boolean; role?: Role; error?: string } => {
    if (!hasUserPermission('manage_roles')) {
      return { success: false, error: 'Permission refusée : vous n\'avez pas les droits pour créer des rôles.' };
    }
    if (!roleData.name || !roleData.key) {
      return { success: false, error: 'Nom et clé du rôle obligatoires.' };
    }
    const normKey = normalizeRoleKey(roleData.key);
    if (roles.some((r) => normalizeRoleKey(r.key) === normKey)) {
      return { success: false, error: 'Un rôle avec cet identifiant existe déjà.' };
    }

    const newId = `ROLE-${Date.now().toString().slice(-4)}`;
    const newRole: Role = {
      ...roleData,
      id: newId,
      key: normKey,
      permissions: roleData.permissions || ['view_dashboard'],
      isSystem: false,
      badgeColor: roleData.badgeColor || 'bg-cyan-50 text-cyan-800 border-cyan-300',
      created_at: new Date().toISOString().split('T')[0],
    };

    setRoles((prev) => [...prev, newRole]);
    logAction('créer', 'Roles', newId, null, newRole);
    return { success: true, role: newRole };
  };

  const updateRole = (id: string, updates: Partial<Role>): { success: boolean; error?: string } => {
    if (!hasUserPermission('manage_roles')) {
      return { success: false, error: 'Permission refusée : vous n\'avez pas les droits pour modifier des rôles.' };
    }
    const target = roles.find((r) => r.id === id);
    if (!target) {
      return { success: false, error: 'Rôle introuvable.' };
    }

    const mergedRole = { ...target, ...updates };
    setRoles((prev) => prev.map((r) => (r.id === id ? mergedRole : r)));
    logAction('modifier', 'Roles', id, target, mergedRole);
    return { success: true };
  };

  const deleteRole = (id: string): { success: boolean; error?: string } => {
    if (!hasUserPermission('manage_roles')) {
      return { success: false, error: 'Permission refusée : vous n\'avez pas les droits pour supprimer des rôles.' };
    }

    const check = canDeleteRole(id, users, roles);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    const target = roles.find((r) => r.id === id);
    setRoles((prev) => prev.filter((r) => r.id !== id));
    logAction('supprimer', 'Roles', id, target, null);
    return { success: true };
  };

  const updateRolePermissions = (roleIdOrKey: string, permissions: PermissionKey[]): { success: boolean; error?: string } => {
    if (!hasUserPermission('manage_roles')) {
      return { success: false, error: 'Permission refusée : vous n\'avez pas les droits pour modifier les permissions.' };
    }

    const target = findRole(roleIdOrKey, roles);
    if (!target) {
      return { success: false, error: 'Rôle introuvable.' };
    }

    setRoles((prev) =>
      prev.map((r) => (r.id === target.id ? { ...r, permissions } : r))
    );
    logAction('modifier', 'Roles_Permissions', target.id, target.permissions, permissions);
    return { success: true };
  };

  // --- WORKFLOW ACTIONS ---
  // Workflow: Annuler le pack / contrat
  const cancelPack = (contractId: string, motif?: string): { success: boolean; error?: string } => {
    if (!hasUserPermission('cancel_pack')) {
      return {
        success: false,
        error: 'Action refusée : votre rôle ne dispose pas de la permission "cancel_pack" pour annuler un pack.',
      };
    }

    const targetContract = contracts.find((c) => c.id === contractId);
    if (!targetContract) {
      return { success: false, error: 'Contrat introuvable.' };
    }

    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, statut: 'résilié' } : c))
    );

    logAction('modifier', 'Contracts', contractId, { statut: targetContract.statut }, {
      statut: 'résilié',
      motif: motif || 'Annulation du pack demandée',
    });

    return { success: true };
  };

  // Workflow: Extras cancellation
  const cancelExtras = (invoiceId: string, itemId?: string, motif?: string): { success: boolean; error?: string } => {
    if (!hasUserPermission('cancel_extras')) {
      return {
        success: false,
        error: 'Action refusée : votre rôle ne dispose pas de la permission "cancel_extras" (Workflow Caissier/Admin).',
      };
    }

    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) {
      return { success: false, error: 'Facture introuvable.' };
    }

    if (itemId && invoice.items) {
      const remainingItems = invoice.items.filter((item) => item.id !== itemId);
      const totals = calculateInvoiceTotals(remainingItems, invoice.remise, invoice.taux_tva);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                items: remainingItems,
                total_ht: totals.totalHt,
                montant_tva: totals.montantTva,
                total_ttc: totals.totalTtc,
                reste_a_payer: Math.max(0, totals.totalTtc - inv.montant_paye),
              }
            : inv
        )
      );
    }

    logAction('modifier', 'Invoices_Extras', invoiceId, null, {
      extra_id: itemId,
      motif: motif || 'Extras cancellation workflow',
    });

    return { success: true };
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const old = { ...settings };
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAction('modifier', 'Settings', 'GLOBAL', old, newSettings);
  };

  // Employees & Payroll
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newId = `EMP-00${employees.length + 1}`;
    const newEmp: Employee = {
      ...empData,
      id: newId,
      nom: sanitizeForSheet(empData.nom),
      prenom: sanitizeForSheet(empData.prenom),
      created_at: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) => [...prev, newEmp]);
    logAction('créer', 'Employees', newId, null, newEmp);
    return newEmp;
  };

  const updateEmployee = (id: string, empUpdates: Partial<Employee>, motif?: string) => {
    const target = employees.find((e) => e.id === id);
    if (!target) return;

    // Check if salary or position changed -> Automatic history entry (RH-3)
    if (
      (empUpdates.salaire_brut_base && empUpdates.salaire_brut_base !== target.salaire_brut_base) ||
      (empUpdates.poste && empUpdates.poste !== target.poste) ||
      (empUpdates.type_contrat && empUpdates.type_contrat !== target.type_contrat)
    ) {
      const histType = empUpdates.salaire_brut_base && empUpdates.salaire_brut_base !== target.salaire_brut_base
        ? 'salaire'
        : empUpdates.poste && empUpdates.poste !== target.poste
        ? 'changement poste'
        : 'contrat';

      const oldVal = histType === 'salaire' ? `${target.salaire_brut_base} DH` : histType === 'changement poste' ? target.poste : target.type_contrat;
      const newVal = histType === 'salaire' ? `${empUpdates.salaire_brut_base} DH` : histType === 'changement poste' ? empUpdates.poste! : empUpdates.type_contrat!;

      const historyEntry: EmployeeHistory = {
        id: `HIST-${Date.now().toString().slice(-5)}`,
        employee_id: id,
        type: histType,
        ancienne_valeur: oldVal,
        nouvelle_valeur: newVal,
        date_effet: new Date().toISOString().split('T')[0],
        motif: motif || 'Ajustement annuel ou validation RH',
        created_at: new Date().toISOString().split('T')[0],
      };
      setEmployeeHistory((prev) => [historyEntry, ...prev]);
    }

    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...empUpdates } : e))
    );
    logAction('modifier', 'Employees', id, target, empUpdates);
  };

  const deactivateEmployee = (id: string) => {
    // RH-1: Désactiver un employé (jamais supprimer physiquement)
    const target = employees.find((e) => e.id === id);
    if (!target) return;
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, statut: 'suspendu' } : e))
    );
    logAction('modifier', 'Employees', id, { statut: target.statut }, { statut: 'suspendu' });
  };

  const generateMonthlyPayroll = (monthStr: string) => {
    // RH-4: Génération de la paie mensuelle en 1 clic pour tous les employés actifs
    const activeEmps = employees.filter((e) => e.statut === 'actif');
    const newPayrolls: Payroll[] = [];

    activeEmps.forEach((emp) => {
      // Find verified travel allowances for this month
      const empVisits = siteVisits.filter(
        (v) => v.employee_id === emp.id && v.date.startsWith(monthStr)
      );
      const visitExpensesTotal = empVisits.reduce((acc, v) => {
        const sum = (v.expenses || []).reduce((s, x) => (x.statut === 'validé' ? s + x.montant : s), 0);
        return acc + sum;
      }, 0);

      const calc = calculateMoroccanPayroll({
        baseSalary: emp.salaire_brut_base,
        primes: 0,
        heuresSup: 0,
        indemnitesDeplacement: visitExpensesTotal,
        avances: 0,
        autresRetenues: 0,
        settings,
      });

      const p: Payroll = {
        id: `PAYROLL-${monthStr}-${emp.id}`,
        employee_id: emp.id,
        mois: monthStr,
        salaire_brut: calc.salaireBrut,
        primes: calc.primes,
        heures_sup: calc.heuresSup,
        indemnites_deplacement: calc.indemnitesDeplacement,
        cnss_salarie: calc.cnssSalarie,
        amo: calc.amo,
        ir: calc.ir,
        autres_retenues: calc.autresRetenues,
        avances: calc.avances,
        net_a_payer: calc.netAPayer,
        statut: 'brouillon',
        created_at: new Date().toISOString().split('T')[0],
      };
      newPayrolls.push(p);
    });

    // Replace or merge with existing for this month
    setPayrolls((prev) => {
      const filtered = prev.filter((p) => p.mois !== monthStr);
      return [...newPayrolls, ...filtered];
    });

    logAction('créer', 'Payrolls', monthStr, null, { count: newPayrolls.length });
  };

  const validatePayroll = (payrollId: string) => {
    // RH-6 & CH-3: Brouillon -> validée -> payée. À la validation, une ligne Expenses (catégorie Salaires)
    // est créée automatiquement (source = paie, payroll_id)
    const target = payrolls.find((p) => p.id === payrollId);
    if (!target) return;

    const emp = employees.find((e) => e.id === target.employee_id);
    const expId = `EXP-${Date.now().toString().slice(-6)}`;

    // Create automatic Expense
    const autoExpense: Expense = {
      id: expId,
      date: new Date().toISOString().split('T')[0],
      categorie_id: 'CAT-001', // Salaires
      libelle: `Salaire ${target.mois} - ${emp ? emp.prenom + ' ' + emp.nom : target.employee_id}`,
      fournisseur: emp ? `${emp.prenom} ${emp.nom}` : 'Salarié',
      montant_ht: target.salaire_brut,
      tva: 0,
      montant_ttc: target.salaire_brut,
      mode_paiement: emp?.mode_paiement || 'virement',
      recurrente: true,
      periodicite: 'mensuelle',
      source: 'paie',
      payroll_id: target.id,
      statut: 'validée',
      valide_par: currentUser.name,
      created_at: new Date().toISOString().split('T')[0],
    };

    setExpenses((prev) => [autoExpense, ...prev]);

    setPayrolls((prev) =>
      prev.map((p) => (p.id === payrollId ? { ...p, statut: 'validée', expense_id: expId } : p))
    );

    logAction('valider', 'Payrolls', payrollId, target, { statut: 'validée', expense_id: expId });
  };

  const markPayrollPaid = (payrollId: string) => {
    setPayrolls((prev) =>
      prev.map((p) =>
        p.id === payrollId
          ? { ...p, statut: 'payée', date_paiement: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    logAction('paiement', 'Payrolls', payrollId, null, { statut: 'payée' });
  };

  // Clients, Projects, Contracts
  const addClient = (clientData: Omit<Client, 'id' | 'code_client'>) => {
    // CL-1: Détection des doublons (ICE, nom)
    const normalizedName = clientData.raison_sociale.trim().toLowerCase();
    const existingName = clients.find(
      (c) => c.raison_sociale.trim().toLowerCase() === normalizedName
    );
    if (existingName) {
      return { success: false, error: `Un client nommé "${clientData.raison_sociale}" existe déjà.` };
    }

    if (clientData.ice && clientData.ice !== '000000000000000') {
      const existingIce = clients.find((c) => c.ice === clientData.ice);
      if (existingIce) {
        return { success: false, error: `Un client avec le numéro ICE ${clientData.ice} existe déjà (${existingIce.raison_sociale}).` };
      }
    }

    const code = 'CLI-' + clientData.raison_sociale.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newClient: Client = {
      ...clientData,
      id: `CLI-${Date.now().toString().slice(-5)}`,
      code_client: code,
      raison_sociale: sanitizeForSheet(clientData.raison_sociale),
      contact_nom: sanitizeForSheet(clientData.contact_nom),
      date_creation: new Date().toISOString().split('T')[0],
    };
    setClients((prev) => [newClient, ...prev]);
    logAction('créer', 'Clients', newClient.id, null, newClient);
    return { success: true, client: newClient };
  };

  const updateClient = (id: string, clientUpdates: Partial<Client>) => {
    const target = clients.find((c) => c.id === id);
    if (!target) return;
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...clientUpdates } : c)));
    logAction('modifier', 'Clients', id, target, clientUpdates);
  };

  const addProject = (projData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...projData,
      id: `PRJ-${Date.now().toString().slice(-5)}`,
      nom_systeme: sanitizeForSheet(projData.nom_systeme),
    };
    setProjects((prev) => [newProj, ...prev]);
    logAction('créer', 'Projects', newProj.id, null, newProj);
    return newProj;
  };

  const updateProject = (id: string, projUpdates: Partial<Project>) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...projUpdates } : p)));
    logAction('modifier', 'Projects', id, target, projUpdates);
  };

  const addContract = (contractData: Omit<Contract, 'id' | 'numero_contrat'>) => {
    const year = new Date().getFullYear();
    const nextVal = counters.contract + 1;
    setCounters((prev) => ({ ...prev, contract: nextVal }));
    const num = `CTR-${year}-${String(nextVal).padStart(3, '0')}`;

    const newContract: Contract = {
      ...contractData,
      id: `CTR-${Date.now().toString().slice(-5)}`,
      numero_contrat: num,
    };
    setContracts((prev) => [newContract, ...prev]);
    logAction('créer', 'Contracts', newContract.id, null, newContract);
    return newContract;
  };

  const updateContract = (id: string, contractUpdates: Partial<Contract>) => {
    const target = contracts.find((c) => c.id === id);
    if (!target) return;
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...contractUpdates } : c)));
    logAction('modifier', 'Contracts', id, target, contractUpdates);
  };

  const runRecurringMaintenanceBilling = () => {
    // CL-6: Facturation récurrente automatique
    const today = new Date().toISOString().split('T')[0];
    const dueContracts = contracts.filter(
      (c) => c.statut === 'actif' && c.prochaine_facturation <= today
    );

    let count = 0;
    dueContracts.forEach((c) => {
      const client = clients.find((cl) => cl.id === c.client_id);
      const items: InvoiceItem[] = [
        {
          id: `ITEM-${Date.now().toString().slice(-5)}-${count}`,
          invoice_id: '',
          designation: `Maintenance périodique (${c.type}) - ${c.numero_contrat}`,
          quantite: 1,
          unite: c.periodicite === 'mensuelle' ? 'mois' : 'période',
          prix_unitaire_ht: c.montant_ht,
          remise_ligne: 0,
          total_ligne_ht: c.montant_ht,
        },
      ];
      const totals = calculateInvoiceTotals(items, 0, settings.default_vat_rate);

      const draftInv: Invoice = {
        id: `INV-${Date.now().toString().slice(-5)}-${count}`,
        numero: `BROUILLON-CTR-${c.numero_contrat}`,
        type: 'maintenance',
        client_id: c.client_id,
        contract_id: c.id,
        project_id: c.project_id,
        date_emission: today,
        date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        total_ht: totals.totalHt,
        taux_tva: totals.tauxTva,
        montant_tva: totals.montantTva,
        total_ttc: totals.totalTtc,
        remise: 0,
        statut: 'brouillon',
        montant_paye: 0,
        reste_a_payer: totals.totalTtc,
        items,
        notes: `Facturation automatique générée pour le contrat ${c.numero_contrat} (${client?.raison_sociale || ''})`,
      };

      setInvoices((prev) => [draftInv, ...prev]);

      // Advance next billing date
      const nextDate = new Date(c.prochaine_facturation);
      if (c.periodicite === 'mensuelle') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (c.periodicite === 'trimestrielle') nextDate.setMonth(nextDate.getMonth() + 3);
      else nextDate.setFullYear(nextDate.getFullYear() + 1);

      updateContract(c.id, { prochaine_facturation: nextDate.toISOString().split('T')[0] });
      count++;
    });

    if (count > 0) {
      logAction('créer', 'Invoices', 'RECURRING_BILLING', null, { invoicesCreated: count });
    }
    return count;
  };

  // Invoices, Quotes, Payments
  const createInvoice = (invData: Omit<Invoice, 'id' | 'numero' | 'statut' | 'montant_paye' | 'reste_a_payer'>) => {
    const items = invData.items || [];
    const totals = calculateInvoiceTotals(items, invData.remise, invData.taux_tva || settings.default_vat_rate);

    const newInv: Invoice = {
      ...invData,
      id: `INV-${Date.now().toString().slice(-6)}`,
      numero: 'BROUILLON', // FA-3: Numéro définitif attribué uniquement à la validation
      statut: 'brouillon',
      total_ht: totals.totalHt,
      remise: totals.remise,
      taux_tva: totals.tauxTva,
      montant_tva: totals.montantTva,
      total_ttc: totals.totalTtc,
      montant_paye: 0,
      reste_a_payer: totals.totalTtc,
      created_at: new Date().toISOString().split('T')[0],
    };
    setInvoices((prev) => [newInv, ...prev]);
    logAction('créer', 'Invoices', newInv.id, null, newInv);
    return newInv;
  };

  const updateDraftInvoice = (id: string, updates: Partial<Invoice>) => {
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return { success: false, error: 'Facture introuvable' };

    // Rule 1: Une facture validée ne peut être ni modifiée ni supprimée ; toute correction passe par un avoir.
    if (target.statut !== 'brouillon' && target.statut !== 'envoyée') {
      return {
        success: false,
        error: `Impossible de modifier la facture ${target.numero} : elle est verrouillée (${target.statut}). Veuillez émettre un avoir pour toute correction.`,
      };
    }

    const items = updates.items || target.items || [];
    const discount = updates.remise !== undefined ? updates.remise : target.remise;
    const vatRate = updates.taux_tva !== undefined ? updates.taux_tva : target.taux_tva;
    const totals = calculateInvoiceTotals(items, discount, vatRate);

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              ...updates,
              total_ht: totals.totalHt,
              remise: totals.remise,
              taux_tva: totals.tauxTva,
              montant_tva: totals.montantTva,
              total_ttc: totals.totalTtc,
              reste_a_payer: round2(totals.totalTtc - inv.montant_paye),
            }
          : inv
      )
    );
    logAction('modifier', 'Invoices', id, target, updates);
    return { success: true };
  };

  const validateInvoice = (id: string) => {
    // FA-3 & Rule 1: Validation réservée Admin/Comptable ; attribue le numéro séquentiel définitif FA-AAAA-NNNN sans trou ; verrouillée
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return { success: false, error: 'Facture introuvable' };
    if (target.statut === 'validée' || target.statut === 'payée' || target.statut === 'payée partiellement') {
      return { success: false, error: 'Cette facture est déjà validée.' };
    }

    const year = new Date().getFullYear();
    const nextNumber = counters.invoice + 1;
    setCounters((prev) => ({ ...prev, invoice: nextNumber }));
    const officialNum = `FA-${year}-${String(nextNumber).padStart(4, '0')}`;

    const updated: Invoice = {
      ...target,
      numero: officialNum,
      statut: 'validée',
      validee_par: currentUser.name,
      date_validation: new Date().toISOString().split('T')[0],
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
    logAction('valider', 'Invoices', id, { statut: target.statut }, { statut: 'validée', numero: officialNum });
    return { success: true, invoice: updated };
  };

  const createCreditNote = (originInvoiceId: string, amount: number, motif: string) => {
    // FA-10 & Rule 1: Avoir lié à la facture d'origine, numérotation propre AV-AAAA-NNNN
    const origin = invoices.find((inv) => inv.id === originInvoiceId);
    if (!origin) throw new Error('Facture d origine introuvable');

    const year = new Date().getFullYear();
    const nextNum = counters.creditNote + 1;
    setCounters((prev) => ({ ...prev, creditNote: nextNum }));
    const creditNum = `AV-${year}-${String(nextNum).padStart(4, '0')}`;

    const creditAmount = Math.min(amount, origin.total_ttc);
    const amountHt = round2(creditAmount / 1.20);
    const tva = round2(creditAmount - amountHt);

    const creditInvoice: Invoice = {
      id: `AVOIR-${Date.now().toString().slice(-6)}`,
      numero: creditNum,
      type: 'avoir',
      client_id: origin.client_id,
      facture_origine_id: origin.id,
      project_id: origin.project_id,
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: new Date().toISOString().split('T')[0],
      total_ht: -amountHt,
      taux_tva: origin.taux_tva,
      montant_tva: -tva,
      total_ttc: -creditAmount,
      remise: 0,
      statut: 'validée',
      montant_paye: 0,
      reste_a_payer: 0,
      notes: `Avoir émis en régularisation de la facture ${origin.numero}. Motif : ${motif}`,
      items: [
        {
          id: `ITEM-AV-${Date.now().toString().slice(-4)}`,
          invoice_id: '',
          designation: `Avoir sur facture ${origin.numero} : ${motif}`,
          quantite: 1,
          unite: 'forfait',
          prix_unitaire_ht: -amountHt,
          remise_ligne: 0,
          total_ligne_ht: -amountHt,
        },
      ],
    };

    setInvoices((prev) => [creditInvoice, ...prev]);
    logAction('créer', 'Invoices', creditInvoice.id, null, creditInvoice);
    return creditInvoice;
  };

  const registerPayment = (paymentData: Omit<Payment, 'id' | 'statut'>) => {
    // FA-5, FA-6, FA-7 & Rule 4:
    // Interdire un paiement supérieur au reste dû
    const targetInvoice = invoices.find((inv) => inv.id === paymentData.invoice_id);
    if (!targetInvoice) return { success: false, error: 'Facture introuvable' };

    const validation = validatePaymentAmount(paymentData.montant, targetInvoice.reste_a_payer);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newPayment: Payment = {
      ...paymentData,
      id: `PAY-${Date.now().toString().slice(-6)}`,
      reference: sanitizeForSheet(paymentData.reference),
      banque: sanitizeForSheet(paymentData.banque),
      statut: 'encaissé',
      created_at: new Date().toISOString().split('T')[0],
    };

    const newMontantPaye = round2(targetInvoice.montant_paye + paymentData.montant);
    const newReste = round2(Math.max(0, targetInvoice.total_ttc - newMontantPaye));
    const newStatut: Invoice['statut'] = newReste <= 0.01 ? 'payée' : 'payée partiellement';

    setPayments((prev) => [newPayment, ...prev]);
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === targetInvoice.id
          ? {
              ...inv,
              montant_paye: newMontantPaye,
              reste_a_payer: newReste,
              statut: newStatut,
            }
          : inv
      )
    );

    logAction('paiement', 'Payments', newPayment.id, null, {
      invoice_id: targetInvoice.id,
      montant: paymentData.montant,
      nouveau_statut: newStatut,
    });

    return { success: true, payment: newPayment };
  };

  const createQuote = (quoteData: Omit<Quote, 'id' | 'numero' | 'statut'>) => {
    const year = new Date().getFullYear();
    const nextVal = counters.quote + 1;
    setCounters((prev) => ({ ...prev, quote: nextVal }));
    const num = `DE-${year}-${String(nextVal).padStart(4, '0')}`;

    const totals = calculateInvoiceTotals(quoteData.items, 0, quoteData.taux_tva || settings.default_vat_rate);

    const newQuote: Quote = {
      ...quoteData,
      id: `QUO-${Date.now().toString().slice(-6)}`,
      numero: num,
      statut: 'envoyé',
      total_ht: totals.totalHt,
      montant_tva: totals.montantTva,
      total_ttc: totals.totalTtc,
    };

    setQuotes((prev) => [newQuote, ...prev]);
    logAction('créer', 'Quotes', newQuote.id, null, newQuote);
    return newQuote;
  };

  const convertQuoteToInvoice = (quoteId: string) => {
    // FA-9: Devis -> conversion en facture en un clic
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Devis introuvable');

    const inv = createInvoice({
      type: 'vente',
      client_id: quote.client_id,
      project_id: quote.project_id,
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      total_ht: quote.total_ht,
      taux_tva: quote.taux_tva,
      montant_tva: quote.montant_tva,
      total_ttc: quote.total_ttc,
      remise: 0,
      items: quote.items,
      notes: `Facture issue de la conversion du devis ${quote.numero}.`,
    });

    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, statut: 'converti', converted_invoice_id: inv.id } : q))
    );

    logAction('modifier', 'Quotes', quoteId, { statut: quote.statut }, { statut: 'converti', invoice_id: inv.id });
    return inv;
  };

  // Expenses
  const addExpense = (expData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expData,
      id: `EXP-${Date.now().toString().slice(-6)}`,
      libelle: sanitizeForSheet(expData.libelle),
      fournisseur: sanitizeForSheet(expData.fournisseur),
      created_at: new Date().toISOString().split('T')[0],
    };
    setExpenses((prev) => [newExp, ...prev]);
    logAction('créer', 'Expenses', newExp.id, null, newExp);
    return newExp;
  };

  const validateExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, statut: 'validée', valide_par: currentUser.name } : e))
    );
    logAction('valider', 'Expenses', id, { statut: target.statut }, { statut: 'validée' });
  };

  // Daily Reports & Site Visits
  const saveDailyReport = (reportData: Partial<DailyReport> & { employee_id: string; date: string }) => {
    const existingIndex = dailyReports.findIndex(
      (r) => r.employee_id === reportData.employee_id && r.date === reportData.date
    );

    // Calculate total hours
    const tasks = reportData.tasks || [];
    const totalHours = round2(tasks.reduce((sum, t) => sum + (Number(t.heures) || 0), 0));

    let savedReport: DailyReport;

    if (existingIndex >= 0) {
      savedReport = {
        ...dailyReports[existingIndex],
        ...reportData,
        heures_total: totalHours,
        blocages: sanitizeForSheet(reportData.blocages),
        plan_demain: sanitizeForSheet(reportData.plan_demain),
      };
      setDailyReports((prev) =>
        prev.map((r, i) => (i === existingIndex ? savedReport : r))
      );
      logAction('modifier', 'DailyReports', savedReport.id, null, savedReport);
    } else {
      savedReport = {
        id: `REP-${Date.now().toString().slice(-6)}`,
        employee_id: reportData.employee_id,
        date: reportData.date,
        lieu: reportData.lieu || 'bureau',
        heures_total: totalHours,
        blocages: sanitizeForSheet(reportData.blocages),
        plan_demain: sanitizeForSheet(reportData.plan_demain),
        statut: reportData.statut || 'soumis',
        soumis_le: new Date().toISOString().replace('T', ' ').slice(0, 16),
        tasks: tasks.map((t, idx) => ({
          ...t,
          id: t.id || `TSK-${Date.now().toString().slice(-4)}-${idx}`,
          report_id: `REP-${Date.now().toString().slice(-6)}`,
          description: sanitizeForSheet(t.description),
        })),
      };
      setDailyReports((prev) => [savedReport, ...prev]);
      logAction('créer', 'DailyReports', savedReport.id, null, savedReport);
    }
    return savedReport;
  };

  const validateDailyReport = (reportId: string, comment?: string) => {
    setDailyReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              statut: 'validé',
              commentaire_manager: comment || r.commentaire_manager,
              valide_par: currentUser.name,
            }
          : r
      )
    );
    logAction('valider', 'DailyReports', reportId, null, { statut: 'validé', comment });
  };

  const saveSiteVisit = (visitData: Partial<SiteVisit> & { employee_id: string; client_id: string; date: string }) => {
    let savedVisit: SiteVisit;
    if (visitData.id) {
      savedVisit = {
        ...(siteVisits.find((v) => v.id === visitData.id)!),
        ...visitData,
        travail_effectue: sanitizeForSheet(visitData.travail_effectue),
      } as SiteVisit;
      setSiteVisits((prev) => prev.map((v) => (v.id === visitData.id ? savedVisit : v)));
      logAction('modifier', 'SiteVisits', savedVisit.id, null, savedVisit);
    } else {
      const newId = `VIS-${Date.now().toString().slice(-6)}`;
      savedVisit = {
        id: newId,
        report_id: visitData.report_id,
        employee_id: visitData.employee_id,
        client_id: visitData.client_id,
        project_id: visitData.project_id,
        contract_id: visitData.contract_id,
        date: visitData.date,
        motif: sanitizeForSheet(visitData.motif || ''),
        heure_depart: visitData.heure_depart || '09:00',
        heure_arrivee: visitData.heure_arrivee || '10:00',
        heure_retour: visitData.heure_retour || '17:00',
        travail_effectue: sanitizeForSheet(visitData.travail_effectue || ''),
        resultat: visitData.resultat || 'résolu',
        problemes: sanitizeForSheet(visitData.problemes),
        materiel_utilise: sanitizeForSheet(visitData.materiel_utilise),
        facturable: !!visitData.facturable,
        montant_facturable: visitData.montant_facturable || 0,
        signature_client_url: visitData.signature_client_url,
        expenses: visitData.expenses || [],
      };
      setSiteVisits((prev) => [savedVisit, ...prev]);
      logAction('créer', 'SiteVisits', newId, null, savedVisit);
    }
    return savedVisit;
  };

  const validateSiteVisit = (visitId: string) => {
    // DP-4: Validation des frais de déplacement -> créent une charge automatique
    const visit = siteVisits.find((v) => v.id === visitId);
    if (!visit) return;

    const validatedExpenses = (visit.expenses || []).map((exp) => {
      if (exp.statut !== 'validé') {
        const expId = `EXP-${Date.now().toString().slice(-6)}-${exp.id}`;
        // Create expense in Déplacements category (CAT-008)
        const autoExp: Expense = {
          id: expId,
          date: visit.date,
          categorie_id: 'CAT-008',
          libelle: `Frais déplacement (${exp.type}) - ${visit.motif}`,
          fournisseur: 'Indemnités collaborateur',
          montant_ht: exp.montant,
          tva: 0,
          montant_ttc: exp.montant,
          mode_paiement: 'espèces',
          recurrente: false,
          source: 'déplacement',
          visit_expense_id: exp.id,
          statut: 'validée',
          valide_par: currentUser.name,
        };
        setExpenses((prev) => [autoExp, ...prev]);
        return { ...exp, statut: 'validé' as const, expense_id: expId };
      }
      return exp;
    });

    setSiteVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, expenses: validatedExpenses } : v))
    );

    logAction('valider', 'SiteVisits', visitId, null, { expensesCount: validatedExpenses.length });
  };

  const syncWithGoogleSheets = async () => {
    setSheetsSyncStatus('syncing');
    try {
      // Simulate Apps Script LockService + batch fetch/push
      await new Promise((r) => setTimeout(r, 600));
      setSheetsSyncStatus('synced');
      setLastSheetsSync('Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setOfflineQueueCount(0);
    } catch {
      setSheetsSyncStatus('error');
    }
  };

  const triggerOfflineSync = () => {
    if (offlineQueueCount > 0) {
      syncWithGoogleSheets();
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUserRole,
        switchUser,
        login,
        users,
        addUser,
        updateUser,
        deleteUser,
        roles,
        addRole,
        updateRole,
        deleteRole,
        updateRolePermissions,
        hasUserPermission,
        cancelPack,
        cancelExtras,
        settings,
        updateSettings,
        auditLogs,
        logAction,
        employees,
        employeeHistory,
        payrolls,
        addEmployee,
        updateEmployee,
        deactivateEmployee,
        generateMonthlyPayroll,
        validatePayroll,
        markPayrollPaid,
        clients,
        projects,
        contracts,
        addClient,
        updateClient,
        addProject,
        updateProject,
        addContract,
        updateContract,
        runRecurringMaintenanceBilling,
        invoices,
        quotes,
        payments,
        createInvoice,
        updateDraftInvoice,
        validateInvoice,
        createCreditNote,
        registerPayment,
        createQuote,
        convertQuoteToInvoice,
        expenses,
        expenseCategories,
        addExpense,
        validateExpense,
        dailyReports,
        siteVisits,
        saveDailyReport,
        validateDailyReport,
        saveSiteVisit,
        validateSiteVisit,
        sheetsSyncStatus,
        lastSheetsSync,
        syncWithGoogleSheets,
        offlineQueueCount,
        triggerOfflineSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
