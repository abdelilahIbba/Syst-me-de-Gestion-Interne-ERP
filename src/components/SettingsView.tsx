/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppSettings } from '../types';
import {
  Settings,
  Building,
  Percent,
  Clock,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Paramètres du Système & Société</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          Module E22 & Section 4.17 · Configuration légale marocaine, taux de cotisations, règles de relance et Apps Script
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Paramètres généraux enregistrés et appliqués avec succès !</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Identité Société & Mentions Légales */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Building className="w-4 h-4 text-cyan-600" />
              <span>Identité Légale & Coordonnées (Conventions Marocaines FA-4)</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <img
                src={form.logo_url}
                alt="DEVNAPP SARL"
                className="w-5 h-5 object-contain rounded"
              />
              <span className="text-[11px] font-semibold text-cyan-300">Logo DEVNAPP Actif</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Raison Sociale</label>
              <input
                type="text"
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Identifiant Commun de l'Entreprise (ICE) *</label>
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
              <label className="block text-slate-600 mb-1 font-medium">Identifiant Fiscal (IF)</label>
              <input
                type="text"
                value={form.if_number}
                onChange={(e) => setForm({ ...form, if_number: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Registre de Commerce (RC)</label>
              <input
                type="text"
                value={form.rc}
                onChange={(e) => setForm({ ...form, rc: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">N° de Patente</label>
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
              <label className="block text-slate-600 mb-1 font-medium">Relevé d'Identité Bancaire (RIB officiel 24 chiffres)</label>
              <input
                type="text"
                value={form.rib}
                onChange={(e) => setForm({ ...form, rib: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Adresse du Siège Social</label>
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Mentions légales obligatoires sur factures</label>
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
            <span>Taux de TVA & Paramètres Paie Marocaine (RH-5 & FA-1)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Taux TVA par défaut (%)</label>
              <input
                type="number"
                value={form.default_vat_rate}
                onChange={(e) => setForm({ ...form, default_vat_rate: Number(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Taux CNSS Salariale (%)</label>
              <input
                type="number"
                step="0.01"
                value={form.cnss_rate_employee}
                onChange={(e) => setForm({ ...form, cnss_rate_employee: Number(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Plafond CNSS (DH/mois)</label>
              <input
                type="number"
                value={form.cnss_ceiling}
                onChange={(e) => setForm({ ...form, cnss_ceiling: Number(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Taux AMO Salariale (%)</label>
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
            <span>Règles d'Exploitation & Délais (RJ-4 & Section 4.17)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Heure limite rapport journalier</label>
              <input
                type="time"
                value={form.daily_report_cutoff_hour}
                onChange={(e) => setForm({ ...form, daily_report_cutoff_hour: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Délai avant 1ère relance facture (jours)</label>
              <input
                type="number"
                value={form.reminder_delay_days}
                onChange={(e) => setForm({ ...form, reminder_delay_days: Number(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-medium">Durée de validité session (heures)</label>
              <input
                type="number"
                value={form.session_timeout_hours}
                onChange={(e) => setForm({ ...form, session_timeout_hours: Number(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">URL Webhook API Google Apps Script (Web App)</label>
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
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
};
