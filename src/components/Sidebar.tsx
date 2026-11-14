/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { canAccessNav, hasPermission } from '../utils/rbac';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Building2,
  FolderGit2,
  FileCheck2,
  Receipt,
  FileText,
  BellRing,
  WalletCards,
  CalendarCheck2,
  ClipboardList,
  MapPin,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
} from 'lucide-react';

export type NavItemKey =
  | 'dashboard'
  | 'employees'
  | 'payroll'
  | 'clients'
  | 'projects'
  | 'contracts'
  | 'invoices'
  | 'quotes'
  | 'reminders'
  | 'expenses'
  | 'daily_report'
  | 'team_reports'
  | 'site_visits'
  | 'reports_exports'
  | 'users_admin'
  | 'settings'
  | 'audit_log';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { currentUser, roles } = useApp();
  const { t, tRole } = useI18n();

  // Automatic RBAC evaluation against dynamic role permissions matrix
  const canSee = (key: NavItemKey) => {
    if (key === 'settings' || key === 'users_admin') {
      return (
        hasPermission(currentUser.role, 'manage_settings', roles) ||
        hasPermission(currentUser.role, 'manage_users', roles) ||
        hasPermission(currentUser.role, 'manage_roles', roles)
      );
    }
    return canAccessNav(key, currentUser.role, roles);
  };

  const navSections = [
    {
      title: t('nav.section.general'),
      items: [
        { key: 'dashboard' as NavItemKey, label: t('nav.dashboard'), icon: LayoutDashboard, visible: canSee('dashboard') },
      ],
    },
    {
      title: t('nav.section.hr'),
      items: [
        { key: 'employees' as NavItemKey, label: t('nav.employees'), icon: Users, visible: canSee('employees') },
        { key: 'payroll' as NavItemKey, label: t('nav.payroll'), icon: Banknote, visible: canSee('payroll') },
      ],
    },
    {
      title: t('nav.section.crm'),
      items: [
        { key: 'clients' as NavItemKey, label: t('nav.clients'), icon: Building2, visible: canSee('clients') },
        { key: 'projects' as NavItemKey, label: t('nav.projects'), icon: FolderGit2, visible: canSee('projects') },
        { key: 'contracts' as NavItemKey, label: t('nav.contracts'), icon: FileCheck2, visible: canSee('contracts') },
      ],
    },
    {
      title: t('nav.section.billing'),
      items: [
        { key: 'invoices' as NavItemKey, label: t('nav.invoices'), icon: Receipt, visible: canSee('invoices') },
        { key: 'quotes' as NavItemKey, label: t('nav.quotes'), icon: FileText, visible: canSee('quotes') },
        { key: 'reminders' as NavItemKey, label: t('nav.reminders'), icon: BellRing, visible: canSee('reminders') },
        { key: 'expenses' as NavItemKey, label: t('nav.expenses'), icon: WalletCards, visible: canSee('expenses') },
      ],
    },
    {
      title: t('nav.section.activity'),
      items: [
        { key: 'daily_report' as NavItemKey, label: t('nav.daily_report'), icon: CalendarCheck2, visible: canSee('daily_report') },
        { key: 'team_reports' as NavItemKey, label: t('nav.team_reports'), icon: ClipboardList, visible: canSee('team_reports') },
        { key: 'site_visits' as NavItemKey, label: t('nav.site_visits'), icon: MapPin, visible: canSee('site_visits') },
        { key: 'reports_exports' as NavItemKey, label: t('nav.reports_exports'), icon: BarChart3, visible: canSee('reports_exports') },
      ],
    },
    {
      title: t('nav.section.admin'),
      items: [
        { key: 'users_admin' as NavItemKey, label: t('nav.users_admin'), icon: ShieldCheck, visible: canSee('users_admin') },
        { key: 'settings' as NavItemKey, label: t('nav.settings'), icon: Settings, visible: canSee('settings') },
        { key: 'audit_log' as NavItemKey, label: t('nav.audit_log'), icon: History, visible: canSee('audit_log') },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#070b18] text-slate-300 flex flex-col shrink-0 min-h-screen border-e border-slate-800/80">
      {/* Brand Header with DEVNAPP Logo */}
      <div className="h-18 px-4 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/80">
        <img
          src="/assets/aistudio/devnappLogo_10b7b539.jpg"
          alt="DEVNAPP SARL"
          className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 shadow-sm shadow-cyan-500/20 shrink-0"
        />
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-white tracking-wider truncate flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">DEVNAPP</span>
            <span className="text-[10px] text-slate-400 font-bold font-mono">SARL</span>
          </div>
          <div className="text-[10px] text-cyan-400 font-mono tracking-tight uppercase">{t('app.tagline')}</div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((i) => i.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-0.5 mt-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelectTab(item.key as NavItemKey)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all text-start ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-xs shadow-cyan-500/25 border-s-2 border-s-cyan-300'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-cyan-400/90 truncate font-mono">
              {t('sidebar.roleFooter')}: {tRole(currentUser.role, currentUser.role)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
