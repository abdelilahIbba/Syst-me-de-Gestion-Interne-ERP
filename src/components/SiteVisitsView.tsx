/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { SiteVisit, VisitResult } from '../types';
import { formatDH } from '../utils/calculations';
import {
  CheckCircle2,
  Printer,
} from 'lucide-react';

export const SiteVisitsView: React.FC = () => {
  const { siteVisits, clients, employees, settings, validateSiteVisit, hasUserPermission } = useApp();
  const { t } = useI18n();

  const [selectedVisitForBon, setSelectedVisitForBon] = useState<SiteVisit | null>(null);

  const canValidate = hasUserPermission('manage_expenses') || hasUserPermission('manage_invoices');

  const translateResult = (res: VisitResult) => {
    if (res === 'résolu') return t('daily.result.résolu');
    if (res === 'partiel') return t('daily.result.partiel');
    return t('daily.result.à revoir');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('visits.title')}</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          {t('visits.subtitle')}
        </div>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {siteVisits.map((visit) => {
          const client = clients.find((c) => c.id === visit.client_id);
          const emp = employees.find((e) => e.id === visit.employee_id);

          const totalFrais = (visit.expenses || []).reduce((sum, e) => sum + e.montant, 0);
          const allExpensesValidated = (visit.expenses || []).every((e) => e.statut === 'validé');

          return (
            <div key={visit.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm shrink-0">
                      {visit.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{visit.motif}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {t('visits.clientAndStaff', {
                      client: client?.raison_sociale || '-',
                      city: client?.ville || '-',
                      staff: emp ? `${emp.prenom} ${emp.nom}` : '-',
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-md ${
                      visit.resultat === 'résolu'
                        ? 'bg-emerald-50 text-emerald-700'
                        : visit.resultat === 'partiel'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {t('visits.resultBadge', { result: translateResult(visit.resultat) })}
                  </span>
                  <button
                    onClick={() => setSelectedVisitForBon(visit)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors whitespace-nowrap"
                  >
                    {t('visits.slipBtn')}
                  </button>
                </div>
              </div>

              {/* Timing and Work done */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">{t('visits.schedule')}</span>
                  <span className="font-mono font-semibold text-slate-800" dir="ltr">
                    {visit.heure_depart} → {visit.heure_arrivee} → {visit.heure_retour}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">{t('visits.billing')}</span>
                  <span className="font-medium text-slate-800">
                    {visit.facturable
                      ? t('visits.billableAmount', { amount: formatDH(visit.montant_facturable) })
                      : t('visits.includedContract')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">{t('visits.signature')}</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('visits.captured')}</span>
                  </span>
                </div>
              </div>

              {/* Work performed */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-900">{t('visits.workDone')}</span>
                <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                  {visit.travail_effectue}
                </p>
              </div>

              {/* Expenses Breakdown & Validation (DP-3 & DP-4) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-slate-900">
                    {t('visits.expensesTitle', { amount: formatDH(totalFrais) })}
                  </span>

                  {!allExpensesValidated && canValidate && (
                    <button
                      onClick={() => validateSiteVisit(visit.id)}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
                    >
                      {t('visits.validateExpenses')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(visit.expenses || []).map((exp) => (
                    <div key={exp.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold capitalize text-slate-800">{exp.type}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{t('visits.receiptProvided')}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold text-slate-900">{formatDH(exp.montant)}</div>
                        <span
                          className={`text-[10px] font-medium ${
                            exp.statut === 'validé' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {exp.statut === 'validé'
                            ? t('visits.expenseStatus.validé')
                            : t('visits.expenseStatus.en attente')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Intervention Slip PDF with Signature (DP-6) */}
      {selectedVisitForBon && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto print-page">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 no-print">
              <h3 className="text-sm font-bold text-slate-900">{t('visits.slipModalTitle')}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs rounded-lg font-medium shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('common.print')}</span>
                </button>
                <button
                  onClick={() => setSelectedVisitForBon(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs rounded-lg"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-3.5 sm:p-5 border border-slate-200 rounded-lg text-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-start gap-3">
                  <img
                    src="/assets/aistudio/devnappLogo_10b7b539.jpg"
                    alt="DEVNAPP SARL"
                    className="w-12 h-12 rounded-lg object-contain bg-slate-950 p-1 border border-slate-800 shadow-xs shrink-0"
                  />
                  <div>
                    <div className="font-bold text-base text-slate-900">{settings.company_name}</div>
                    <div className="text-cyan-700 font-semibold text-[10px] uppercase">{t('app.tagline')}</div>
                    <div className="text-[11px] text-slate-500">{settings.adresse}, {settings.ville}</div>
                    <div className="text-[11px] text-slate-500 font-mono">ICE : {settings.ice}</div>
                  </div>
                </div>
                <div className="text-start sm:text-end">
                  <div className="font-bold text-sm text-slate-900">{t('visits.slipBannerTitle')}</div>
                  <div className="font-mono text-slate-500">{t('visits.refLabel')} {selectedVisitForBon.id}</div>
                  <div className="text-slate-600">{t('common.date')} : {selectedVisitForBon.date}</div>
                </div>
              </div>

              {(() => {
                const client = clients.find((c) => c.id === selectedVisitForBon.client_id);
                const emp = employees.find((e) => e.id === selectedVisitForBon.employee_id);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md text-[11px]">
                    <div>
                      <div><span className="text-slate-500">{t('common.client')} :</span> <strong>{client?.raison_sociale}</strong></div>
                      <div><span className="text-slate-500">{t('clients.address')}</span> {client?.adresse}, {client?.ville}</div>
                      <div><span className="text-slate-500">{t('clients.field.contact')} :</span> {client?.contact_nom} ({client?.telephone})</div>
                    </div>
                    <div>
                      <div><span className="text-slate-500">{t('visits.staffLabel')}</span> <strong>{emp?.prenom} {emp?.nom}</strong></div>
                      <div><span className="text-slate-500">{t('payroll.roleLabel')}</span> {emp?.poste}</div>
                      <div><span className="text-slate-500">{t('visits.slotLabel')}</span> <span dir="ltr">{selectedVisitForBon.heure_arrivee} - {selectedVisitForBon.heure_retour}</span></div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <span className="font-bold text-slate-900">{t('visits.technicalWork')}</span>
                <p className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed text-[11px]">
                  {selectedVisitForBon.travail_effectue}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="p-3 bg-slate-50 rounded-lg text-[11px]">
                  <span className="font-bold text-slate-800 block mb-1">{t('visits.techVisa')}</span>
                  <div className="text-slate-500">{t('visits.techSignedNote')}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-[11px]">
                  <span className="font-bold text-slate-800 block mb-1">{t('visits.clientApproval')}</span>
                  {selectedVisitForBon.signature_client_url ? (
                    <div className="mt-2 bg-white p-2 rounded border border-slate-200 flex items-center justify-center">
                      <img
                        src={selectedVisitForBon.signature_client_url}
                        alt={t('visits.signature')}
                        className="h-14 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-slate-400 italic py-3 text-center">{t('visits.noSignature')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
