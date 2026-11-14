/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Language } from '../i18n/translations';
import { UserRole } from '../types';
import { findRole } from '../utils/rbac';
import {
  FileSpreadsheet,
  Smartphone,
  RefreshCw,
  Shield,
  LogIn,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  onOpenSheets: () => void;
  onToggleMobileSim: () => void;
  onOpenLogin: () => void;
  isMobileSimOpen: boolean;
  activeViewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSheets,
  onToggleMobileSim,
  onOpenLogin,
  isMobileSimOpen,
  activeViewTitle,
}) => {
  const { currentUser, roles, switchUserRole, sheetsSyncStatus, syncWithGoogleSheets } = useApp();
  const { language, setLanguage, supportedLanguages, t, tRole } = useI18n();
  const activeRole = findRole(currentUser.role_id || currentUser.role, roles);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Start: Active View Breadcrumb */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
          {t('app.systemName')}
        </span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm sm:text-base font-semibold text-slate-900 whitespace-nowrap truncate">
          {activeViewTitle}
        </h1>
      </div>

      {/* End Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Google Sheets Sync */}
        <button
          type="button"
          onClick={syncWithGoogleSheets}
          title={t('header.syncTitle')}
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${sheetsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span className="text-slate-500">Google Sheets:</span>
          <span className="text-slate-800 font-semibold">
            {sheetsSyncStatus === 'syncing' ? t('header.sheetsSyncing') : t('header.sheetsSynced')}
          </span>
        </button>

        {/* View Google Sheets Database */}
        <button
          type="button"
          onClick={onOpenSheets}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-900 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
          title={t('header.sheetsWorkbooksTitle')}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
          <span>{t('header.sheetsWorkbooks')}</span>
        </button>

        {/* Mobile View Simulator Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSim}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 ${
            isMobileSimOpen
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent shadow-xs shadow-cyan-500/25'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
          title={t('header.mobileAppTitle')}
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
          <span>{t('header.mobileApp')}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-0.5 hidden md:block" />

        {/* Language Switcher: English (default), العربية, Français */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0">
          <Globe className="w-3.5 h-3.5 text-cyan-600 ms-1 shrink-0" />
          <select
            data-testid="language-switcher"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md py-1 px-2 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            aria-label={t('header.languageSelectAria')}
          >
            {supportedLanguages.map((langOpt) => (
              <option key={langOpt.code} value={langOpt.code}>
                {langOpt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Role Switcher (reads from dynamic roles state) */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0">
          <Shield className="w-3.5 h-3.5 text-cyan-600 ms-1 hidden lg:block" />
          <span className="text-xs text-slate-500 hidden xl:inline">{t('header.roleLabel')}</span>
          <select
            value={activeRole?.key || currentUser.role}
            onChange={(e) => switchUserRole(e.target.value as UserRole)}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md py-1 px-2 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 cursor-pointer max-w-[155px] truncate"
            aria-label={t('header.roleSelectAria')}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.key}>
                {tRole(r.key, r.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Account Login / Switch Modal Trigger */}
        <button
          type="button"
          onClick={onOpenLogin}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#070b18] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title={t('header.loginTitle')}
        >
          <LogIn className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline max-w-[110px] truncate">{currentUser.name.split(' ')[0]}</span>
          <span className="md:hidden">{t('header.login')}</span>
        </button>
      </div>
    </header>
  );
};
