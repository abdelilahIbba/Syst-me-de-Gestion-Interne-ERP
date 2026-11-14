/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PermissionKey } from '../types';
import {
  Language,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getDirection,
  getLocale,
  resolveStoredLanguage,
  persistLanguage,
  translate,
  TranslationKey,
  ROLE_NAME_TRANSLATIONS,
  MODULE_NAME_TRANSLATIONS,
  PERMISSION_TRANSLATIONS,
} from '../i18n/translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  locale: string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  tRole: (roleKey: string, fallbackName: string) => string;
  tModule: (moduleName: string) => string;
  tPerm: (permKey: PermissionKey) => { label: string; description: string };
  tMonth: (monthCode: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function applyDocumentLanguageAttributes(lang: Language) {
  if (typeof document === 'undefined') return;
  const dir = getDirection(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.title = translate(lang, 'app.title');
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const initial = resolveStoredLanguage();
    applyDocumentLanguageAttributes(initial);
    return initial;
  });

  useEffect(() => {
    applyDocumentLanguageAttributes(language);
    persistLanguage(language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    persistLanguage(lang);
    applyDocumentLanguageAttributes(lang);
    setLanguageState(lang);
  }, []);

  const dir = getDirection(language);
  const isRTL = dir === 'rtl';
  const locale = getLocale(language);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => translate(language, key, params),
    [language]
  );

  const tRole = useCallback(
    (roleKey: string, fallbackName: string) => {
      const normalized = roleKey.trim().toLowerCase().replace(/\s+/g, '_');
      return ROLE_NAME_TRANSLATIONS[language]?.[normalized] || fallbackName;
    },
    [language]
  );

  const tModule = useCallback(
    (moduleName: string) => {
      return MODULE_NAME_TRANSLATIONS[language]?.[moduleName] || moduleName;
    },
    [language]
  );

  const tPerm = useCallback(
    (permKey: PermissionKey) => {
      return PERMISSION_TRANSLATIONS[language]?.[permKey] || PERMISSION_TRANSLATIONS[DEFAULT_LANGUAGE][permKey];
    },
    [language]
  );

  const tMonth = useCallback(
    (monthCode: string) => {
      const padded = monthCode.padStart(2, '0');
      const key = `month.${padded}` as TranslationKey;
      return translate(language, key);
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        dir,
        isRTL,
        locale,
        supportedLanguages: SUPPORTED_LANGUAGES,
        t,
        tRole,
        tModule,
        tPerm,
        tMonth,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
