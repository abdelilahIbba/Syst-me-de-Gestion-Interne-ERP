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
        <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('visits.title')}</h2>
        <div className="text-xs text-[#546A8E] mt-0.5">
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
            <div key={visit.id} className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE6F3]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#035388] bg-[#DFF0FC] border border-[#A5D3F3] px-2 py-0.5 rounded-lg shrink-0">
                      {visit.id}
                    </span>
                    <h3 className="text-sm font-bold text-[#0D1B38]">{visit.motif}</h3>
                  </div>
                  <div className="text-xs text-[#546A8E] mt-0.5">
                    {t('visits.clientAndStaff', {
                      client: client?.raison_sociale || '-',
                      city: client?.ville || '-',
                      staff: emp ? `${emp.prenom} ${emp.nom}` : '-',
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-lg border ${
                      visit.resultat === 'résolu'
                        ? 'bg-[#DCF4E8] text-[#0E6245] border-[#A7DFC3]'
                        : visit.resultat === 'partiel'
                        ? 'bg-[#FEF3D6] text-[#8F5600] border-[#F2D388]'
                        : 'bg-[#FCE8EC] text-[#9F1239] border-[#F3BCC8]'
                    }`}
                  >
                    {t('visits.resultBadge', { result: translateResult(visit.resultat) })}
                  </span>
                  <button
                    onClick={() => setSelectedVisitForBon(visit)}
                    className="px-3 py-1 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] text-[#1C2E4F] rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    {t('visits.slipBtn')}
                  </button>
                </div>
              </div>

              {/* Timing and Work done */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#E6EEF8] p-3.5 rounded-xl border border-[#D5E2F1]">
                <div>
                  <span className="text-[#546A8E] block text-[10px]">{t('visits.schedule')}</span>
                  <span className="font-mono font-semibold text-[#0D1B38]" dir="ltr">
                    {visit.heure_depart} → {visit.heure_arrivee} → {visit.heure_retour}
                  </span>
                </div>

                <div>
                  <span className="text-[#546A8E] block text-[10px]">{t('visits.billing')}</span>
                  <span className="font-medium text-[#1C2E4F]">
                    {visit.facturable
                      ? t('visits.billableAmount', { amount: formatDH(visit.montant_facturable) })
                      : t('visits.includedContract')}
                  </span>
                </div>

                <div>
                  <span className="text-[#546A8E] block text-[10px]">{t('visits.signature')}</span>
                  <span className="font-semibold text-[#0E6245] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('visits.captured')}</span>
                  </span>
                </div>
              </div>

              {/* Work performed */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-[#0D1B38]">{t('visits.workDone')}</span>
                <p className="text-[#273B63] leading-relaxed bg-[#F5F8FD] p-3 rounded-xl border border-[#DCE6F3]">
                  {visit.travail_effectue}
                </p>
              </div>

              {/* Expenses Breakdown & Validation (DP-3 & DP-4) */}
              <div className="space-y-2 pt-2 border-t border-[#DCE6F3]">
                <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-[#0D1B38]">
                    {t('visits.expensesTitle', { amount: formatDH(totalFrais) })}
                  </span>

                  {!allExpensesValidated && canValidate && (
                    <button
                      onClick={() => validateSiteVisit(visit.id)}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white font-semibold rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
                    >
                      {t('visits.validateExpenses')}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(visit.expenses || []).map((exp) => (
                    <div key={exp.id} className="p-3 bg-[#E6EEF8] rounded-xl border border-[#D5E2F1] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold capitalize text-[#1C2E4F]">{exp.type}</span>
                        <div className="text-[10px] text-[#546A8E] font-mono">{t('visits.receiptProvided')}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold text-[#0D1B38]">{formatDH(exp.montant)}</div>
                        <span
                          className={`text-[10px] font-medium ${
                            exp.statut === 'validé' ? 'text-[#0E6245]' : 'text-[#8F5600]'
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto print-page">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE6F3] pb-3 no-print">
              <h3 className="text-sm font-bold text-[#0D1B38]">{t('visits.slipModalTitle')}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white text-xs rounded-xl font-medium shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('common.print')}</span>
                </button>
                <button
                  onClick={() => setSelectedVisitForBon(null)}
                  className="px-3 py-1.5 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] text-[#1C2E4F] text-xs rounded-xl font-medium"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-3.5 sm:p-5 bg-[#F5F8FD] border border-[#CFDDED] rounded-xl text-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-[#CFDDED] pb-3">
                <div className="flex items-start gap-3">
                  <img
                    src="/assets/aistudio/devnappLogo_10b7b539.jpg"
                    alt="DEVNAPP SARL"
                    className="w-12 h-12 rounded-xl object-contain bg-[#0B1733] p-1 border border-[#1E3566] shadow-xs shrink-0"
                  />
                  <div>
                    <div className="font-bold text-base text-[#0D1B38]">{settings.company_name}</div>
                    <div className="text-[#0284C7] font-semibold text-[10px] uppercase">{t('app.tagline')}</div>
                    <div className="text-[11px] text-[#546A8E]">{settings.adresse}, {settings.ville}</div>
                    <div className="text-[11px] text-[#546A8E] font-mono">ICE : {settings.ice}</div>
                  </div>
                </div>
                <div className="text-start sm:text-end">
                  <div className="font-bold text-sm text-[#0D1B38]">{t('visits.slipBannerTitle')}</div>
                  <div className="font-mono text-[#546A8E]">{t('visits.refLabel')} {selectedVisitForBon.id}</div>
                  <div className="text-[#3C5073]">{t('common.date')} : {selectedVisitForBon.date}</div>
                </div>
              </div>

              {(() => {
                const client = clients.find((c) => c.id === selectedVisitForBon.client_id);
                const emp = employees.find((e) => e.id === selectedVisitForBon.employee_id);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#E6EEF8] border border-[#D5E2F1] p-3 rounded-xl text-[11px]">
                    <div>
                      <div><span className="text-[#546A8E]">{t('common.client')} :</span> <strong className="text-[#0D1B38]">{client?.raison_sociale}</strong></div>
                      <div><span className="text-[#546A8E]">{t('clients.address')}</span> <span className="text-[#273B63]">{client?.adresse}, {client?.ville}</span></div>
                      <div><span className="text-[#546A8E]">{t('clients.field.contact')} :</span> <span className="text-[#273B63]">{client?.contact_nom} ({client?.telephone})</span></div>
                    </div>
                    <div>
                      <div><span className="text-[#546A8E]">{t('visits.staffLabel')}</span> <strong className="text-[#0D1B38]">{emp?.prenom} {emp?.nom}</strong></div>
                      <div><span className="text-[#546A8E]">{t('payroll.roleLabel')}</span> <span className="text-[#273B63]">{emp?.poste}</span></div>
                      <div><span className="text-[#546A8E]">{t('visits.slotLabel')}</span> <span dir="ltr" className="text-[#273B63]">{selectedVisitForBon.heure_arrivee} - {selectedVisitForBon.heure_retour}</span></div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <span className="font-bold text-[#0D1B38]">{t('visits.technicalWork')}</span>
                <p className="p-3 bg-[#E6EEF8] rounded-xl border border-[#D5E2F1] text-[#1C2E4F] leading-relaxed text-[11px]">
                  {selectedVisitForBon.travail_effectue}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#CFDDED]">
                <div className="p-3 bg-[#E6EEF8] border border-[#D5E2F1] rounded-xl text-[11px]">
                  <span className="font-bold text-[#0D1B38] block mb-1">{t('visits.techVisa')}</span>
                  <div className="text-[#546A8E]">{t('visits.techSignedNote')}</div>
                </div>

                <div className="p-3 bg-[#E6EEF8] border border-[#D5E2F1] rounded-xl text-[11px]">
                  <span className="font-bold text-[#0D1B38] block mb-1">{t('visits.clientApproval')}</span>
                  {selectedVisitForBon.signature_client_url ? (
                    <div className="mt-2 bg-[#F5F8FD] p-2 rounded-lg border border-[#C9D9EC] flex items-center justify-center">
                      <img
                        src={selectedVisitForBon.signature_client_url}
                        alt={t('visits.signature')}
                        className="h-14 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-[#647BA0] italic py-3 text-center">{t('visits.noSignature')}</div>
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
