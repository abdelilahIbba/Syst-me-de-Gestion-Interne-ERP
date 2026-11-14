/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { AppSettings } from '../types';
import {
  UserManagementSection,
  RoleManagementSection,
  RolePermissionsMatrixSection,
} from './UserRoleManagement';
import {
  Settings,
  Building,
  Percent,
  Clock,
  Shield,
  Users,
  KeyRound,
  CheckCircle2,
  Save,
} from 'lucide-react';

type SettingsSubTab = 'general' | 'user_management' | 'roles' | 'permissions_matrix';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, hasUserPermission } = useApp();
  const { t } = useI18n();

  const canManageSettings = hasUserPermission('manage_settings');
  const canManageUsers = hasUserPermission('manage_users');
  const canManageRoles = hasUserPermission('manage_roles');

  const getInitialTab = (): SettingsSubTab => {
    if (canManageSettings) return 'general';
    if (canManageUsers) return 'user_management';
    if (canManageRoles) return 'roles';
    return 'general';
  };

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(getInitialTab);
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  // Automatically switch to a permitted sub-tab if permissions change
  useEffect(() => {
    if (activeSubTab === 'general' && !canManageSettings) {
      setActiveSubTab(getInitialTab());
    } else if (activeSubTab === 'user_management' && !canManageUsers) {
      setActiveSubTab(getInitialTab());
    } else if ((activeSubTab === 'roles' || activeSubTab === 'permissions_matrix') && !canManageRoles) {
      setActiveSubTab(getInitialTab());
    }
  }, [canManageSettings, canManageUsers, canManageRoles, activeSubTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  const subTabs: Array<{ id: SettingsSubTab; label: string; icon: React.ComponentType<{ className?: string }>; visible: boolean }> = [
    { id: 'general', label: t('settings.tab.general'), icon: Settings, visible: canManageSettings },
    { id: 'user_management', label: t('settings.tab.users'), icon: Users, visible: canManageUsers },
    { id: 'roles', label: t('settings.tab.roles'), icon: Shield, visible: canManageRoles },
    { id: 'permissions_matrix', label: t('settings.tab.matrix'), icon: KeyRound, visible: canManageRoles },
  ];

  const visibleTabs = subTabs.filter((tab) => tab.visible);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('settings.title')}</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            {t('settings.subtitle')}
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#070b18] text-cyan-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Company & Moroccan Fiscal Settings */}
      {activeSubTab === 'general' && canManageSettings && (
        <div className="space-y-6 max-w-4xl">
          {saved && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('settings.savedMsg')}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Identité Société & Mentions Légales */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Building className="w-4 h-4 text-cyan-600" />
                  <span>{t('settings.legalIdentity')}</span>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  <img
                    src={form.logo_url}
                    alt="DEVNAPP SARL"
                    className="w-5 h-5 object-contain rounded"
                  />
                  <span className="text-[11px] font-semibold text-cyan-300">{t('settings.logoActive')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.companyName')}</label>
                  <input
                    type="text"
                    required
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.ice')}</label>
                  <input
                    type="text"
                    required
                    value={form.ice}
                    onChange={(e) => setForm({ ...form, ice: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.ifNumber')}</label>
                  <input
                    type="text"
                    value={form.if_number}
                    onChange={(e) => setForm({ ...form, if_number: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.rc')}</label>
                  <input
                    type="text"
                    value={form.rc}
                    onChange={(e) => setForm({ ...form, rc: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.patente')}</label>
                  <input
                    type="text"
                    value={form.patente}
                    onChange={(e) => setForm({ ...form, patente: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.rib')}</label>
                  <input
                    type="text"
                    value={form.rib}
                    onChange={(e) => setForm({ ...form, rib: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.hqAddress')}</label>
                  <input
                    type="text"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('settings.legalNotes')}</label>
                <textarea
                  rows={2}
                  value={form.invoice_legal_notes}
                  onChange={(e) => setForm({ ...form, invoice_legal_notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Taux Fiscaux & Barème RH */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-sm">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>{t('settings.taxPayrollTitle')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.defaultVat')}</label>
                  <input
                    type="number"
                    value={form.default_vat_rate}
                    onChange={(e) => setForm({ ...form, default_vat_rate: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.cnssRate')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cnss_rate_employee}
                    onChange={(e) => setForm({ ...form, cnss_rate_employee: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.cnssCeiling')}</label>
                  <input
                    type="number"
                    value={form.cnss_ceiling}
                    onChange={(e) => setForm({ ...form, cnss_ceiling: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.amoRate')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amo_rate_employee}
                    onChange={(e) => setForm({ ...form, amo_rate_employee: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Règles Métier & Heure Limite */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-sm">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>{t('settings.opsTitle')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.cutoffHour')}</label>
                  <input
                    type="time"
                    value={form.daily_report_cutoff_hour}
                    onChange={(e) => setForm({ ...form, daily_report_cutoff_hour: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.reminderDelay')}</label>
                  <input
                    type="number"
                    value={form.reminder_delay_days}
                    onChange={(e) => setForm({ ...form, reminder_delay_days: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('settings.sessionTimeout')}</label>
                  <input
                    type="number"
                    value={form.session_timeout_hours}
                    onChange={(e) => setForm({ ...form, session_timeout_hours: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('settings.webhookUrl')}</label>
                <input
                  type="url"
                  value={form.sheets_webhook_url || ''}
                  onChange={(e) => setForm({ ...form, sheets_webhook_url: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono text-xs"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{t('settings.saveBtn')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: User management */}
      {activeSubTab === 'user_management' && canManageUsers && <UserManagementSection />}

      {/* Tab 3: Gestion des Rôles */}
      {activeSubTab === 'roles' && canManageRoles && <RoleManagementSection />}

      {/* Tab 4: Droits d’accès par rôle */}
      {activeSubTab === 'permissions_matrix' && canManageRoles && <RolePermissionsMatrixSection />}
    </div>
  );
};
