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
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('contracts.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('contracts.subtitle')}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recurring Billing Button (CL-6) */}
          <button
            onClick={handleRunBilling}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0E6245] bg-[#DCF4E8] hover:bg-[#CDEEDB] border border-[#A7DFC3] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0"
            title={t('contracts.runBillingTooltip')}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('contracts.runBilling')}</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-xl shadow-[0_6px_16px_-4px_rgba(2,132,199,0.4)] transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('contracts.newBtn')}</span>
          </button>
        </div>
      </div>

      {billingResult !== null && (
        <div className="p-3.5 bg-[#DCF4E8] border border-[#A7DFC3] text-[#0E6245] rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#0E6245]" />
            <span>{t('contracts.billingDone', { count: billingResult })}</span>
          </div>
        </div>
      )}

      {cancelMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 font-medium ${
            cancelMessage.type === 'success'
              ? 'bg-[#DCF4E8] border-[#A7DFC3] text-[#0E6245]'
              : 'bg-[#FCE8EC] border-[#F3BCC8] text-[#9F1239]'
          }`}
        >
          {cancelMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#0E6245] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#9F1239] shrink-0" />
          )}
          <span>{cancelMessage.text}</span>
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] overflow-hidden">
        {/* Mobile Card List (< md) */}
        <div className="md:hidden divide-y divide-[#DCE6F3]">
          {contracts.map((c) => {
            const client = clients.find((cl) => cl.id === c.client_id);
            const project = projects.find((p) => p.id === c.project_id);
            const alert = checkContractExpiration(c.date_fin);

            return (
              <div key={c.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[#0D1B38]">{c.numero_contrat}</div>
                    <div className="text-[11px] text-[#546A8E] truncate">
                      {client?.raison_sociale} · {project?.nom_systeme}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold shrink-0 ${
                      c.statut === 'résilié' ? 'text-[#9F1239]' : 'text-[#0E6245]'
                    }`}
                  >
                    {translateContractStatus(c.statut)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#E6EEF8] p-2.5 rounded-xl border border-[#D5E2F1] text-[11px]">
                  <div>
                    <span className="text-[#546A8E] block">{t('contracts.col.amountHt')}</span>
                    <span className="font-mono font-bold text-[#0D1B38]">{formatDH(c.montant_ht)}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-[#546A8E] block">{t('contracts.col.nextBilling')}</span>
                    <span className="font-mono text-[#273B63]">{c.prochaine_facturation}</span>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-[#CFDDED]">
                    <span className="text-[#273B63]">{c.date_debut} → {c.date_fin}</span>
                    <span className="text-[#546A8E]">
                      {translatePeriodicity(c.periodicite)} ({c.heures_incluses}{t('common.hours')})
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${
                      alert.alertLevel === 'urgent'
                        ? 'bg-[#FCE8EC] text-[#9F1239] border border-[#F3BCC8]'
                        : alert.alertLevel === 'warning'
                        ? 'bg-[#FEF3D6] text-[#8F5600] border border-[#F2D388]'
                        : alert.alertLevel === 'expired'
                        ? 'bg-[#E2EAF5] text-[#455B80]'
                        : 'text-[#546A8E]'
                    }`}
                  >
                    {alert.message}
                  </span>

                  {canCancelPack && c.statut === 'actif' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelPackTarget(c);
                        setCancelMotif(t('contracts.cancelPackDesc', { num: c.numero_contrat }));
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-[#9F1239] bg-[#FCE8EC] hover:bg-[#F9D6DE] border border-[#F3BCC8] rounded-lg transition-colors whitespace-nowrap"
                    >
                      {t('contracts.cancelPackBtn')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#E6EEF8] text-[#455B80] font-semibold border-b border-[#CFDDED]">
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
            <tbody className="divide-y divide-[#DCE6F3]">
              {contracts.map((c) => {
                const client = clients.find((cl) => cl.id === c.client_id);
                const project = projects.find((p) => p.id === c.project_id);
                const alert = checkContractExpiration(c.date_fin);

                return (
                  <tr key={c.id} className="hover:bg-[#E7EFFA] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0D1B38]">{c.numero_contrat}</div>
                      <div className="text-[11px] text-[#546A8E] capitalize">{c.type}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1C2E4F]">{client?.raison_sociale}</div>
                      <div className="text-[11px] text-[#546A8E]">{project?.nom_systeme}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[#1C2E4F] font-medium">
                        {c.date_debut} → {c.date_fin}
                      </div>
                      <div className="text-[11px] text-[#546A8E]">
                        {translatePeriodicity(c.periodicite)} ({c.heures_incluses}{t('common.hours')})
                      </div>
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-bold text-[#0D1B38]">
                      {formatDH(c.montant_ht)}
                    </td>

                    <td className="py-3 px-3 font-mono text-[#273B63]">
                      {c.prochaine_facturation}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${
                          alert.alertLevel === 'urgent'
                            ? 'bg-[#FCE8EC] text-[#9F1239] border border-[#F3BCC8]'
                            : alert.alertLevel === 'warning'
                            ? 'bg-[#FEF3D6] text-[#8F5600] border border-[#F2D388]'
                            : alert.alertLevel === 'expired'
                            ? 'bg-[#E2EAF5] text-[#455B80]'
                            : 'text-[#546A8E]'
                        }`}
                      >
                        {alert.message}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          c.statut === 'résilié' ? 'text-[#9F1239]' : 'text-[#0E6245]'
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
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#9F1239] bg-[#FCE8EC] hover:bg-[#F9D6DE] border border-[#F3BCC8] rounded-lg transition-colors whitespace-nowrap"
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38]">{t('contracts.modalNewTitle')}</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.client')}</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.raison_sociale}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.system')}</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom_systeme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.start')}</label>
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.end')}</label>
                  <input
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.periodicity')}</label>
                  <select
                    value={formData.periodicite}
                    onChange={(e) => setFormData({ ...formData, periodicite: e.target.value as MaintenancePeriodicity })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    <option value="mensuelle">{t('contracts.period.mensuelle')}</option>
                    <option value="trimestrielle">{t('contracts.period.trimestrielle')}</option>
                    <option value="annuelle">{t('contracts.period.annuelle')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.amountHt')}</label>
                  <input
                    type="number"
                    value={formData.montant_ht}
                    onChange={(e) => setFormData({ ...formData, montant_ht: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.hoursIncluded')}</label>
                  <input
                    type="number"
                    value={formData.heures_incluses}
                    onChange={(e) => setFormData({ ...formData, heures_incluses: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.noticeDays')}</label>
                  <input
                    type="number"
                    value={formData.preavis_jours}
                    onChange={(e) => setFormData({ ...formData, preavis_jours: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('contracts.field.sla')}</label>
                <textarea
                  rows={2}
                  value={formData.sla_description}
                  onChange={(e) => setFormData({ ...formData, sla_description: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-xl text-[#1C2E4F] font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white rounded-xl font-semibold shadow-xs"
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl shadow-2xl border border-[#C9D9EC] max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <div className="flex items-center gap-2 text-[#9F1239] font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('contracts.cancelModalTitle', { num: cancelPackTarget.numero_contrat })}</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelPackTarget(null)}
                className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#3C5073] space-y-3">
              <p>
                {t('contracts.cancelModalBody', { num: cancelPackTarget.numero_contrat })}
              </p>
              <div>
                <label className="block text-[#273B63] font-semibold mb-1">{t('contracts.cancelMotifLabel')} *</label>
                <textarea
                  rows={2}
                  required
                  value={cancelMotif}
                  onChange={(e) => setCancelMotif(e.target.value)}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCancelPackTarget(null)}
                className="px-4 py-2 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-xl text-[#1C2E4F] font-medium"
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
                className="px-4 py-2 bg-[#C81E4A] hover:bg-[#9F1239] text-white rounded-xl font-semibold"
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
