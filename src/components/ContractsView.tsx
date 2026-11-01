/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Contract, MaintenancePeriodicity } from '../types';
import { formatDH, checkContractExpiration } from '../utils/calculations';
import {
  FileCheck2,
  Plus,
  AlertTriangle,
  Play,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  X,
  RefreshCw,
} from 'lucide-react';

export const ContractsView: React.FC = () => {
  const { contracts, clients, projects, addContract, runRecurringMaintenanceBilling } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [billingResult, setBillingResult] = useState<number | null>(null);

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contrats de Maintenance</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module CL-4, CL-5 & CL-6 · Gestion des récurrences, alertes d'échéances et facturation automatique
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Recurring Billing Button (CL-6) */}
          <button
            onClick={handleRunBilling}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition-colors"
            title="Déclencheur automatique de facturation des contrats échus"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Exécuter Facturation Récurrente (CL-6)</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Contrat</span>
          </button>
        </div>
      </div>

      {billingResult !== null && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Traitement terminé avec succès : <strong className="font-semibold">{billingResult}</strong> facture(s)
              brouillon de maintenance générée(s) dans le classeur. Les dates ont été avancées.
            </span>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Contrat</th>
                <th className="py-3 px-3">Client & Système</th>
                <th className="py-3 px-3">Période & Périodicité</th>
                <th className="py-3 px-3 text-right">Montant HT</th>
                <th className="py-3 px-3">Prochaine Facturation</th>
                <th className="py-3 px-3">Alerte Échéance (CL-5 & R9)</th>
                <th className="py-3 px-3 text-center">Statut</th>
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
                      <div className="text-[11px] text-slate-400 capitalize">{c.periodicite} ({c.heures_incluses}h)</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
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
                      <span className="text-[11px] font-semibold text-emerald-700 capitalize">
                        {c.statut}
                      </span>
                    </td>
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
              <h3 className="text-base font-bold text-slate-900">Nouveau Contrat de Maintenance (CL-4)</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Client *</label>
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
                <label className="block text-slate-600 mb-1 font-medium">Système Associé *</label>
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
                  <label className="block text-slate-600 mb-1 font-medium">Date de début</label>
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Date de fin</label>
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
                  <label className="block text-slate-600 mb-1 font-medium">Périodicité</label>
                  <select
                    value={formData.periodicite}
                    onChange={(e) => setFormData({ ...formData, periodicite: e.target.value as MaintenancePeriodicity })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="mensuelle">Mensuelle</option>
                    <option value="trimestrielle">Trimestrielle</option>
                    <option value="annuelle">Annuelle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Montant HT par période (DH)</label>
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
                  <label className="block text-slate-600 mb-1 font-medium">Heures d'intervention incluses</label>
                  <input
                    type="number"
                    value={formData.heures_incluses}
                    onChange={(e) => setFormData({ ...formData, heures_incluses: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Préavis de résiliation (jours)</label>
                  <input
                    type="number"
                    value={formData.preavis_jours}
                    onChange={(e) => setFormData({ ...formData, preavis_jours: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Description du SLA</label>
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
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Créer le contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
