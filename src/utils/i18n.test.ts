/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  ROLE_NAME_TRANSLATIONS,
  MODULE_NAME_TRANSLATIONS,
  PERMISSION_TRANSLATIONS,
  getDirection,
  getLocale,
  isSupportedLanguage,
  persistLanguage,
  resolveStoredLanguage,
  translate,
} from '../i18n/translations';
import { ALL_PERMISSION_KEYS, PERMISSION_MODULES } from './rbac';

test('default language is English and supported languages follow exact order: English, العربية, Français', () => {
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.deepEqual(
    SUPPORTED_LANGUAGES.map((l) => l.code),
    ['en', 'ar', 'fr']
  );
  assert.deepEqual(
    SUPPORTED_LANGUAGES.map((l) => l.label),
    ['English', 'العربية', 'Français']
  );
  assert.equal(isSupportedLanguage('en'), true);
  assert.equal(isSupportedLanguage('ar'), true);
  assert.equal(isSupportedLanguage('fr'), true);
  assert.equal(isSupportedLanguage('es'), false);
});

test('RTL direction is applied for Arabic and LTR for English and French', () => {
  assert.equal(getDirection('en'), 'ltr');
  assert.equal(getDirection('ar'), 'rtl');
  assert.equal(getDirection('fr'), 'ltr');

  assert.equal(getLocale('en'), 'en-US');
  assert.equal(getLocale('ar'), 'ar-MA');
  assert.equal(getLocale('fr'), 'fr-FR');
});

test('language selection persists to storage and restores across simulated page refreshes', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  // Fresh visit without saved language defaults to English
  assert.equal(resolveStoredLanguage(mockStorage), 'en');

  // Switch to Arabic and verify persistence across refresh
  persistLanguage('ar', mockStorage);
  assert.equal(store.get(LANGUAGE_STORAGE_KEY), 'ar');
  assert.equal(resolveStoredLanguage(mockStorage), 'ar');

  // Switch to French and verify persistence across refresh
  persistLanguage('fr', mockStorage);
  assert.equal(resolveStoredLanguage(mockStorage), 'fr');

  // Corrupted/unsupported value safely falls back to English
  store.set(LANGUAGE_STORAGE_KEY, 'de');
  assert.equal(resolveStoredLanguage(mockStorage), 'en');
});

test('100% translation key parity and non-empty values across en, ar, and fr', () => {
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const arKeys = Object.keys(TRANSLATIONS.ar).sort();
  const frKeys = Object.keys(TRANSLATIONS.fr).sort();

  assert.deepEqual(arKeys, enKeys, 'Arabic translation keys must exactly match English keys');
  assert.deepEqual(frKeys, enKeys, 'French translation keys must exactly match English keys');

  for (const lang of ['en', 'ar', 'fr'] as const) {
    for (const key of enKeys) {
      const value = TRANSLATIONS[lang][key as keyof typeof TRANSLATIONS.en];
      assert.equal(typeof value, 'string', `Missing string for ${lang}.${key}`);
      assert.ok(value.trim().length > 0, `Empty translation value for ${lang}.${key}`);
    }
  }
});

test('role, module, and permission dictionaries have complete coverage across en, ar, and fr', () => {
  const roleKeys = Object.keys(ROLE_NAME_TRANSLATIONS.en).sort();
  assert.deepEqual(Object.keys(ROLE_NAME_TRANSLATIONS.ar).sort(), roleKeys);
  assert.deepEqual(Object.keys(ROLE_NAME_TRANSLATIONS.fr).sort(), roleKeys);

  for (const lang of ['en', 'ar', 'fr'] as const) {
    for (const modName of PERMISSION_MODULES) {
      assert.ok(
        MODULE_NAME_TRANSLATIONS[lang][modName]?.trim().length > 0,
        `Missing module translation for ${lang}.${modName}`
      );
    }

    for (const permKey of ALL_PERMISSION_KEYS) {
      const entry = PERMISSION_TRANSLATIONS[lang][permKey];
      assert.ok(entry, `Missing permission translation for ${lang}.${permKey}`);
      assert.ok(entry.label.trim().length > 0);
      assert.ok(entry.description.trim().length > 0);
    }
  }
});

test('translate interpolates named placeholders accurately in all languages', () => {
  assert.equal(
    translate('en', 'audit.idTimestamp', { id: 'LOG-1', ts: '2026-01-01 10:00' }),
    'ID: LOG-1 · Timestamp: 2026-01-01 10:00'
  );
  assert.equal(
    translate('ar', 'audit.idTimestamp', { id: 'LOG-1', ts: '2026-01-01 10:00' }),
    'المعرف: LOG-1 · التوقيت: 2026-01-01 10:00'
  );
  assert.equal(
    translate('fr', 'audit.idTimestamp', { id: 'LOG-1', ts: '2026-01-01 10:00' }),
    'ID : LOG-1 · Horodatage : 2026-01-01 10:00'
  );
});
