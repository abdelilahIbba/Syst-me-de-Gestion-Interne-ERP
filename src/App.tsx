/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { LoginModal } from './components/LoginModal';
import { I18nProvider, useI18n } from './context/I18nContext';
import { TranslationKey } from './i18n/translations';
import { canAccessNav, hasPermission } from './utils/rbac';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const viewTitleKeys: Record<NavItemKey, TranslationKey> = {
  dashboard: 'view.dashboard',
  employees: 'view.employees',
  payroll: 'view.payroll',
  clients: 'view.clients',
  projects: 'view.projects',
  contracts: 'view.contracts',
  invoices: 'view.invoices',
  quotes: 'view.quotes',
  reminders: 'view.reminders',
  expenses: 'view.expenses',
  daily_report: 'view.daily_report',
  team_reports: 'view.team_reports',
  site_visits: 'view.site_visits',
  reports_exports: 'view.reports_exports',
  users_admin: 'view.users_admin',
  settings: 'view.settings',
  audit_log: 'view.audit_log',
};

const ALL_NAV_TABS: NavItemKey[] = [
  'dashboard',
  'daily_report',
  'employees',
  'payroll',
  'clients',
  'projects',
  'contracts',
  'invoices',
  'quotes',
  'reminders',
  'expenses',
  'team_reports',
  'site_visits',
  'reports_exports',
  'users_admin',
  'settings',
  'audit_log',
];

function MainLayout() {
  const { currentUser, roles } = useApp();
  const { t, tRole, dir } = useI18n();
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isMobileSimOpen, setIsMobileSimOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accessDeniedPayload, setAccessDeniedPayload] = useState<{
    type: 'redirect' | 'denied';
    tab: NavItemKey;
  } | null>(null);

  const isTabPermitted = (tab: NavItemKey): boolean => {
    if (tab === 'settings' || tab === 'users_admin') {
      return (
        hasPermission(currentUser.role, 'manage_settings', roles) ||
        hasPermission(currentUser.role, 'manage_users', roles) ||
        hasPermission(currentUser.role, 'manage_roles', roles)
      );
    }
    return canAccessNav(tab, currentUser.role, roles);
  };

  // Automatic RBAC route protection: if role/permissions change and currentTab is disallowed, redirect safely
  useEffect(() => {
    if (!isTabPermitted(currentTab)) {
      const fallback = ALL_NAV_TABS.find((tabKey) => isTabPermitted(tabKey)) || 'daily_report';
      setAccessDeniedPayload({ type: 'redirect', tab: currentTab });
      setCurrentTab(fallback);
      const timer = setTimeout(() => setAccessDeniedPayload(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentUser.role, roles, currentTab]);

  const handleSelectTab = (tab: NavItemKey) => {
    if (!isTabPermitted(tab)) {
      setAccessDeniedPayload({ type: 'denied', tab });
      setTimeout(() => setAccessDeniedPayload(null), 4500);
      return;
    }
    setAccessDeniedPayload(null);
    setCurrentTab(tab);
  };

  const tabAllowed = isTabPermitted(currentTab);
  const activeRoleLabel = tRole(currentUser.role, currentUser.role);
  const accessDeniedNotice = accessDeniedPayload
    ? t(accessDeniedPayload.type === 'redirect' ? 'access.restrictedRedirect' : 'access.deniedTab', {
        role: activeRoleLabel,
        view: t(viewTitleKeys[accessDeniedPayload.tab]),
      })
    : null;

  return (
    <div dir={dir} className="flex min-h-screen lg:h-screen devnapp-canvas text-[#0D1B38] overflow-x-hidden lg:overflow-hidden font-sans">
      {/* Sidebar Navigation (filters items automatically via RBAC) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenSheets={() => setIsSheetsModalOpen(true)}
        onToggleMobileSim={() => setIsMobileSimOpen(!isMobileSimOpen)}
        isMobileSimOpen={isMobileSimOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden lg:overflow-hidden">
        {/* Top Header */}
        <Header
          activeViewTitle={t(viewTitleKeys[currentTab]) || t('app.systemName')}
          onOpenSheets={() => setIsSheetsModalOpen(true)}
          onToggleMobileSim={() => setIsMobileSimOpen(!isMobileSimOpen)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isMobileSimOpen={isMobileSimOpen}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-5">
            {accessDeniedNotice && (
              <div className="p-3.5 bg-[#FEF3D6]/90 backdrop-blur-xl border border-[#F2D388] text-[#8F5600] rounded-[18px] text-xs flex items-center gap-2.5 shadow-[inset_0_1px_0_rgba(254,249,231,0.85),0_6px_18px_-8px_rgba(143,86,0,0.18)]">
                <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
                <span className="font-medium">{accessDeniedNotice}</span>
              </div>
            )}

            {!tabAllowed ? (
              <div className="ios-card border-rose-200/90 p-8 text-center max-w-lg mx-auto my-12 space-y-3">
                <div className="w-12 h-12 rounded-[16px] bg-[#FCE8EC] text-[#9F1239] flex items-center justify-center mx-auto border border-[#F3BCC8] shadow-xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0D1B38] tracking-tight">{t('access.unauthorizedTitle')}</h3>
                <p className="text-xs text-[#475D82]">
                  {t('access.unauthorizedDesc', { role: activeRoleLabel })}
                </p>
              </div>
            ) : (
              <>
                {currentTab === 'dashboard' && <DashboardView onNavigate={handleSelectTab} />}
                {currentTab === 'employees' && <EmployeesView />}
                {currentTab === 'payroll' && <PayrollView />}
                {currentTab === 'clients' && <ClientsView />}
                {currentTab === 'projects' && <ProjectsView />}
                {currentTab === 'contracts' && <ContractsView />}
                {currentTab === 'invoices' && <InvoicesView />}
                {currentTab === 'quotes' && <QuotesView onNavigateToInvoices={() => handleSelectTab('invoices')} />}
                {currentTab === 'reminders' && <RemindersView />}
                {currentTab === 'expenses' && <ExpensesView />}
                {currentTab === 'daily_report' && <DailyReportView />}
                {currentTab === 'team_reports' && <TeamReportsView />}
                {currentTab === 'site_visits' && <SiteVisitsView />}
                {currentTab === 'reports_exports' && <ReportsExportsView />}
                {currentTab === 'users_admin' && <UsersAdminView />}
                {currentTab === 'settings' && <SettingsView />}
                {currentTab === 'audit_log' && <AuditLogView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Login / Session Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

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
    <I18nProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </I18nProvider>
  );
}
