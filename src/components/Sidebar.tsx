/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Building2,
  FolderGit2,
  FileCheck2,
  Receipt,
  FileText,
  CreditCard,
  BellRing,
  WalletCards,
  CalendarCheck2,
  ClipboardList,
  MapPin,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  Code2,
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
  const { currentUser } = useApp();
  const role = currentUser.role;

  // Rights matrix evaluation (Section 2)
  const canSeeDashboard = true;
  const canSeeEmployees = ['admin', 'rh'].includes(role);
  const canSeePayroll = ['admin', 'rh', 'comptable'].includes(role);
  const canSeeClients = ['admin', 'commercial', 'comptable', 'chef_equipe'].includes(role);
  const canSeeProjects = ['admin', 'commercial', 'comptable', 'chef_equipe'].includes(role);
  const canSeeContracts = ['admin', 'commercial', 'comptable', 'chef_equipe'].includes(role);
  const canSeeInvoices = ['admin', 'comptable', 'commercial'].includes(role);
  const canSeeQuotes = ['admin', 'comptable', 'commercial'].includes(role);
  const canSeeReminders = ['admin', 'comptable'].includes(role);
  const canSeeExpenses = ['admin', 'comptable'].includes(role);
  const canSeeDailyReport = true; // everyone can fill their report
  const canSeeTeamReports = ['admin', 'chef_equipe', 'rh'].includes(role);
  const canSeeSiteVisits = ['admin', 'comptable', 'chef_equipe', 'employe', 'rh'].includes(role);
  const canSeeReportsExports = ['admin', 'comptable', 'rh'].includes(role);
  const canSeeUsersAdmin = ['admin'].includes(role);
  const canSeeSettings = ['admin'].includes(role);
  const canSeeAuditLog = ['admin'].includes(role);

  const navSections = [
    {
      title: 'Général',
      items: [
        { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, visible: canSeeDashboard },
      ],
    },
    {
      title: 'Ressources Humaines',
      items: [
        { key: 'employees', label: 'Employés', icon: Users, visible: canSeeEmployees },
        { key: 'payroll', label: 'Paie du mois', icon: Banknote, visible: canSeePayroll },
      ],
    },
    {
      title: 'Relation Client & Contrats',
      items: [
        { key: 'clients', label: 'Clients & Fiche 360°', icon: Building2, visible: canSeeClients },
        { key: 'projects', label: 'Systèmes vendus', icon: FolderGit2, visible: canSeeProjects },
        { key: 'contracts', label: 'Contrats maintenance', icon: FileCheck2, visible: canSeeContracts },
      ],
    },
    {
      title: 'Facturation & Trésorerie',
      items: [
        { key: 'invoices', label: 'Factures & Avoirs', icon: Receipt, visible: canSeeInvoices },
        { key: 'quotes', label: 'Devis', icon: FileText, visible: canSeeQuotes },
        { key: 'reminders', label: 'Relances impayés', icon: BellRing, visible: canSeeReminders },
        { key: 'expenses', label: 'Charges & Dépenses', icon: WalletCards, visible: canSeeExpenses },
      ],
    },
    {
      title: 'Activité & Terrain',
      items: [
        { key: 'daily_report', label: 'Mon rapport du jour', icon: CalendarCheck2, visible: canSeeDailyReport },
        { key: 'team_reports', label: 'Rapports de l\'équipe', icon: ClipboardList, visible: canSeeTeamReports },
        { key: 'site_visits', label: 'Déplacements & Frais', icon: MapPin, visible: canSeeSiteVisits },
        { key: 'reports_exports', label: 'Exports & Synthèses', icon: BarChart3, visible: canSeeReportsExports },
      ],
    },
    {
      title: 'Administration',
      items: [
        { key: 'users_admin', label: 'Utilisateurs & Rôles', icon: ShieldCheck, visible: canSeeUsersAdmin },
        { key: 'settings', label: 'Paramètres Société', icon: Settings, visible: canSeeSettings },
        { key: 'audit_log', label: 'Journal d\'audit', icon: History, visible: canSeeAuditLog },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#070b18] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800/80">
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
          <div className="text-[10px] text-cyan-400 font-mono tracking-tight uppercase">DNA Digital Solutions</div>
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
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-xs shadow-cyan-500/25 border-l-2 border-l-cyan-300'
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
            <div className="text-[10px] text-cyan-400/90 capitalize truncate font-mono">Rôle: {currentUser.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
