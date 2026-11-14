/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Contract, MaintenancePeriodicity, ContractStatus } from '../types';
import { formatDH, checkContractExpiration } from '../utils/calculations';
import {
  Plus,
  AlertTriangle,
  Play,
  CheckCircle2,
  X,
} from 'lucide-react';

export const ContractsView: React.FC = () => {
  const { contracts, clients, projects, addContract, runRecurringMaintenanceBilling, cancelPack, hasUserPermission } = useApp();
  const { t } = useI18n();

  const canCancelPack = hasUserPermission('cancel_pack');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [billingResult, setBillingResult] = useState<number | null>(null);
  const [cancelPackTarget, setCancelPackTarget] = useState<Contract | null>(null);
  const [cancelMotif, setCancelMotif] = useState('');
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    client_id: clients[0]?.id || '',
    project_id: projects[0]?.id || '',
    type: 'complète' as const,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    periodicite: 'mensuelle' as MaintenancePeriodicity,
    montant_ht: 3500,
    renouvellement_auto: true,
    preavis_jours: 30,
    prochaine_facturation: new Date().toISOString().split('T')[0],
    sla_description: 'Support téléphonique 6j/7, intervention garantie sous 4h',
    heures_incluses: 10,
    statut: 'actif' as const,
  });

  const translatePeriodicity = (p: MaintenancePeriodicity) => {
    if (p === 'mensuelle') return t('contracts.period.mensuelle');
    if (p === 'trimestrielle') return t('contracts.period.trimestrielle');
    return t('contracts.period.annuelle');
  };

  const translateContractStatus = (s: ContractStatus) => {
    if (s === 'résilié') return t('contracts.status.résilié');
    return t('contracts.status.actif');
  };

  const handleRunBilling = () => {
    const count = runRecurringMaintenanceBilling();
    setBillingResult(count);
    setTimeout(() => setBillingResult(null), 5000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || !formData.project_id) return;
    addContract(formData);
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('contracts.title')}</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            {t('contracts.subtitle')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Recurring Billing Button (CL-6) */}
          <button
            onClick={handleRunBilling}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
            title={t('contracts.runBillingTooltip')}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('contracts.runBilling')}</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('contracts.newBtn')}</span>
          </button>
        </div>
      </div>

      {billingResult !== null && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t('contracts.billingDone', { count: billingResult })}</span>
          </div>
        </div>
      )}

      {cancelMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            cancelMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {cancelMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{cancelMessage.text}</span>
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-start">{t('contracts.col.contract')}</th>
                <th className="py-3 px-3 text-start">{t('contracts.col.clientSystem')}</th>
                <th className="py-3 px-3 text-start">{t('contracts.col.period')}</th>
                <th className="py-3 px-3 text-end">{t('contracts.col.amountHt')}</th>
                <th className="py-3 px-3 text-start">{t('contracts.col.nextBilling')}</th>
                <th className="py-3 px-3 text-start">{t('contracts.col.alert')}</th>
                <th className="py-3 px-3 text-center">{t('common.status')}</th>
                {canCancelPack && <th className="py-3 px-4 text-end">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => {
                const client = clients.find((cl) => cl.id === c.client_id);
                const project = projects.find((p) => p.id === c.project_id);
                const alert = checkContractExpiration(c.date_fin);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.numero_contrat}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{c.type}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{client?.raison_sociale}</div>
                      <div className="text-[11px] text-slate-500">{project?.nom_systeme}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-800 font-medium">
                        {c.date_debut} → {c.date_fin}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {translatePeriodicity(c.periodicite)} ({c.heures_incluses}{t('common.hours')})
                      </div>
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-bold text-slate-900">
                      {formatDH(c.montant_ht)}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-700">
                      {c.prochaine_facturation}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                          alert.alertLevel === 'urgent'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : alert.alertLevel === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : alert.alertLevel === 'expired'
                            ? 'bg-slate-100 text-slate-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {alert.message}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          c.statut === 'résilié' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {translateContractStatus(c.statut)}
                      </span>
                    </td>

                    {canCancelPack && (
                      <td className="py-3 px-4 text-end whitespace-nowrap">
                        {c.statut === 'actif' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelPackTarget(c);
                              setCancelMotif(t('contracts.cancelPackDesc', { num: c.numero_contrat }));
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors whitespace-nowrap"
                          >
                            {t('contracts.cancelPackBtn')}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Contract */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{t('contracts.modalNewTitle')}</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('projects.field.client')}</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.raison_sociale}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.system')}</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom_systeme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.start')}</label>
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.end')}</label>
                  <input
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.periodicity')}</label>
                  <select
                    value={formData.periodicite}
                    onChange={(e) => setFormData({ ...formData, periodicite: e.target.value as MaintenancePeriodicity })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="mensuelle">{t('contracts.period.mensuelle')}</option>
                    <option value="trimestrielle">{t('contracts.period.trimestrielle')}</option>
                    <option value="annuelle">{t('contracts.period.annuelle')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.amountHt')}</label>
                  <input
                    type="number"
                    value={formData.montant_ht}
                    onChange={(e) => setFormData({ ...formData, montant_ht: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.hoursIncluded')}</label>
                  <input
                    type="number"
                    value={formData.heures_incluses}
                    onChange={(e) => setFormData({ ...formData, heures_incluses: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.noticeDays')}</label>
                  <input
                    type="number"
                    value={formData.preavis_jours}
                    onChange={(e) => setFormData({ ...formData, preavis_jours: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('contracts.field.sla')}</label>
                <textarea
                  rows={2}
                  value={formData.sla_description}
                  onChange={(e) => setFormData({ ...formData, sla_description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  {t('contracts.createBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cancel Pack / Annuler le pack */}
      {cancelPackTarget && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('contracts.cancelModalTitle', { num: cancelPackTarget.numero_contrat })}</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelPackTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p>
                {t('contracts.cancelModalBody', { num: cancelPackTarget.numero_contrat })}
              </p>
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('contracts.cancelMotifLabel')} *</label>
                <textarea
                  rows={2}
                  required
                  value={cancelMotif}
                  onChange={(e) => setCancelMotif(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCancelPackTarget(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = cancelPack(cancelPackTarget.id, cancelMotif);
                  if (res.success) {
                    setCancelMessage({
                      type: 'success',
                      text: t('contracts.cancelSuccess', { num: cancelPackTarget.numero_contrat }),
                    });
                  } else {
                    setCancelMessage({
                      type: 'error',
                      text: res.error || t('contracts.cancelError'),
                    });
                  }
                  setCancelPackTarget(null);
                  setTimeout(() => setCancelMessage(null), 4500);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                {t('contracts.confirmCancelPack')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
