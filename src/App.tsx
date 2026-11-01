/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EmployeesView } from './components/EmployeesView';
import { PayrollView } from './components/PayrollView';
import { ClientsView } from './components/ClientsView';
import { ProjectsView } from './components/ProjectsView';
import { ContractsView } from './components/ContractsView';
import { InvoicesView } from './components/InvoicesView';
import { QuotesView } from './components/QuotesView';
import { RemindersView } from './components/RemindersView';
import { ExpensesView } from './components/ExpensesView';
import { DailyReportView } from './components/DailyReportView';
import { TeamReportsView } from './components/TeamReportsView';
import { SiteVisitsView } from './components/SiteVisitsView';
import { ReportsExportsView } from './components/ReportsExportsView';
import { UsersAdminView } from './components/UsersAdminView';
import { SettingsView } from './components/SettingsView';
import { AuditLogView } from './components/AuditLogView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { MobileDeviceSimulator } from './components/MobileDeviceSimulator';

const viewTitles: Record<NavItemKey, string> = {
  dashboard: 'Tableau de bord',
  employees: 'Gestion des Employés',
  payroll: 'Paie Mensuelle (Barème Marocain)',
  clients: 'Clients & Fiche 360°',
  projects: 'Systèmes Vendus & Rentabilité',
  contracts: 'Contrats de Maintenance & Alertes',
  invoices: 'Facturation & Avoirs',
  quotes: 'Devis Commerciaux',
  reminders: 'Relances Factures Impayées',
  expenses: 'Charges & Dépenses (Page Unique)',
  daily_report: 'Mon Rapport Journalier',
  team_reports: 'Rapports de l\'Équipe & Validation',
  site_visits: 'Déplacements Terrain & Bons d\'Intervention',
  reports_exports: 'Synthèses d\'Heures & Exports CSV',
  users_admin: 'Administration des Utilisateurs & Rôles',
  settings: 'Paramètres Société & Fiscaux',
  audit_log: 'Journal d\'Audit & Sécurité',
};

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isMobileSimOpen, setIsMobileSimOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeViewTitle={viewTitles[currentTab] || 'Système de Gestion'}
          onOpenSheets={() => setIsSheetsModalOpen(true)}
          onToggleMobileSim={() => setIsMobileSimOpen(!isMobileSimOpen)}
          isMobileSimOpen={isMobileSimOpen}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && <DashboardView onNavigate={(t) => setCurrentTab(t)} />}
            {currentTab === 'employees' && <EmployeesView />}
            {currentTab === 'payroll' && <PayrollView />}
            {currentTab === 'clients' && <ClientsView />}
            {currentTab === 'projects' && <ProjectsView />}
            {currentTab === 'contracts' && <ContractsView />}
            {currentTab === 'invoices' && <InvoicesView />}
            {currentTab === 'quotes' && <QuotesView onNavigateToInvoices={() => setCurrentTab('invoices')} />}
            {currentTab === 'reminders' && <RemindersView />}
            {currentTab === 'expenses' && <ExpensesView />}
            {currentTab === 'daily_report' && <DailyReportView />}
            {currentTab === 'team_reports' && <TeamReportsView />}
            {currentTab === 'site_visits' && <SiteVisitsView />}
            {currentTab === 'reports_exports' && <ReportsExportsView />}
            {currentTab === 'users_admin' && <UsersAdminView />}
            {currentTab === 'settings' && <SettingsView />}
            {currentTab === 'audit_log' && <AuditLogView />}
          </div>
        </main>
      </div>

      {/* Google Sheets Architecture & Anti-Injection Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />

      {/* Mobile App Simulator (Section 14) */}
      <MobileDeviceSimulator
        isOpen={isMobileSimOpen}
        onClose={() => setIsMobileSimOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
