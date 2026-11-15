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
    <header className="h-14 sm:h-16 bg-[#EBF1FA]/90 backdrop-blur-md border-b border-[#CFDDED] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-[0_2px_14px_-4px_rgba(11,23,51,0.06)]">
      {/* Start: Mobile Menu Toggle + Active View Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Menu"
          className="lg:hidden w-10 h-10 -ms-1.5 rounded-xl text-[#273B63] hover:bg-[#DDE7F5] flex items-center justify-center shrink-0 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-[#627799] whitespace-nowrap">
          {t('app.systemName')}
        </span>
        <span className="hidden sm:inline text-[#A6B9D4]">/</span>
        <h1 className="text-xs sm:text-base font-bold text-[#0D1B38] whitespace-nowrap truncate">
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
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#273B63] bg-[#F5F8FD] hover:bg-[#E4ECF7] border border-[#C9D9EC] rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#0284C7] ${sheetsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span className="text-[#5F7394]">Google Sheets:</span>
          <span className="text-[#0D1B38] font-semibold">
            {sheetsSyncStatus === 'syncing' ? t('header.sheetsSyncing') : t('header.sheetsSynced')}
          </span>
        </button>

        {/* View Google Sheets Database */}
        <button
          type="button"
          onClick={onOpenSheets}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0C4A6E] bg-[#DFF0FC] hover:bg-[#CDE6F9] border border-[#A5D3F3] rounded-xl transition-colors shadow-2xs whitespace-nowrap shrink-0"
          title={t('header.sheetsWorkbooksTitle')}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>{t('header.sheetsWorkbooks')}</span>
        </button>

        {/* Mobile View Simulator Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSim}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shrink-0 ${
            isMobileSimOpen
              ? 'bg-gradient-to-r from-[#0284C7] to-[#0891B2] text-[#F4F8FD] border-transparent shadow-sm shadow-[#0284C7]/25'
              : 'bg-[#F5F8FD] text-[#273B63] hover:bg-[#E4ECF7] border-[#C9D9EC]'
          }`}
          title={t('header.mobileAppTitle')}
        >
          <Smartphone className={`w-3.5 h-3.5 ${isMobileSimOpen ? 'text-[#E0F2FE]' : 'text-[#0284C7]'}`} />
          <span>{t('header.mobileApp')}</span>
        </button>

        <div className="h-5 w-px bg-[#C9D9EC] mx-0.5 hidden md:block" />

        {/* Language Switcher: English (default), العربية, Français */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-[#E4ECF7] border border-[#C9D9EC] rounded-xl p-0.5 sm:p-1 shrink-0">
          <Globe className="w-3.5 h-3.5 text-[#0284C7] ms-1 hidden sm:block shrink-0" />
          <select
            data-testid="language-switcher"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-[11px] sm:text-xs font-semibold text-[#0D1B38] bg-[#F5F8FD] border border-[#C9D9EC] rounded-lg py-1 px-1.5 sm:px-2 focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]/25 cursor-pointer max-w-[74px] sm:max-w-none"
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
        <div className="flex items-center gap-1 sm:gap-1.5 bg-[#E4ECF7] border border-[#C9D9EC] rounded-xl p-0.5 sm:p-1 shrink-0">
          <Shield className="w-3.5 h-3.5 text-[#0284C7] ms-1 hidden lg:block" />
          <span className="text-xs text-[#5F7394] hidden xl:inline">{t('header.roleLabel')}</span>
          <select
            value={activeRole?.key || currentUser.role}
            onChange={(e) => switchUserRole(e.target.value as UserRole)}
            className="text-[11px] sm:text-xs font-semibold text-[#0D1B38] bg-[#F5F8FD] border border-[#C9D9EC] rounded-lg py-1 px-1.5 sm:px-2 focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]/25 cursor-pointer max-w-[88px] sm:max-w-[155px] truncate"
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
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-[#F4F8FD] bg-[#0B1733] hover:bg-[#132652] border border-[#1E3669] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
          title={t('header.loginTitle')}
        >
          <LogIn className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
          <span className="hidden md:inline max-w-[110px] truncate">{currentUser.name.split(' ')[0]}</span>
          <span className="hidden xs:inline sm:inline md:hidden">{t('header.login')}</span>
        </button>
      </div>
    </header>
  );
};
