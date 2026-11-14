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
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenSheets: () => void;
  onToggleMobileSim: () => void;
  onOpenLogin: () => void;
  onOpenMobileMenu: () => void;
  isMobileSimOpen: boolean;
  activeViewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSheets,
  onToggleMobileSim,
  onOpenLogin,
  onOpenMobileMenu,
  isMobileSimOpen,
  activeViewTitle,
}) => {
  const { currentUser, roles, switchUserRole, sheetsSyncStatus, syncWithGoogleSheets } = useApp();
  const { language, setLanguage, supportedLanguages, t, tRole } = useI18n();
  const activeRole = findRole(currentUser.role_id || currentUser.role, roles);

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-xs">
      {/* Start: Mobile Menu Toggle + Active View Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Menu"
          className="lg:hidden w-10 h-10 -ms-1.5 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
          {t('app.systemName')}
        </span>
        <span className="hidden sm:inline text-slate-300">/</span>
        <h1 className="text-xs sm:text-base font-semibold text-slate-900 whitespace-nowrap truncate">
          {activeViewTitle}
        </h1>
      </div>

      {/* End Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5 sm:p-1 shrink-0">
          <Globe className="w-3.5 h-3.5 text-cyan-600 ms-1 hidden sm:block shrink-0" />
          <select
            data-testid="language-switcher"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-[11px] sm:text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md py-1 px-1.5 sm:px-2 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 cursor-pointer max-w-[74px] sm:max-w-none"
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
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5 sm:p-1 shrink-0">
          <Shield className="w-3.5 h-3.5 text-cyan-600 ms-1 hidden lg:block" />
          <span className="text-xs text-slate-500 hidden xl:inline">{t('header.roleLabel')}</span>
          <select
            value={activeRole?.key || currentUser.role}
            onChange={(e) => switchUserRole(e.target.value as UserRole)}
            className="text-[11px] sm:text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md py-1 px-1.5 sm:px-2 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 cursor-pointer max-w-[88px] sm:max-w-[155px] truncate"
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
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-[#070b18] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title={t('header.loginTitle')}
        >
          <LogIn className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden md:inline max-w-[110px] truncate">{currentUser.name.split(' ')[0]}</span>
          <span className="hidden xs:inline sm:inline md:hidden">{t('header.login')}</span>
        </button>
      </div>
    </header>
  );
};
