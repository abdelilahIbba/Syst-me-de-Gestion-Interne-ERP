/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Payroll, PayrollStatus } from '../types';
import { formatDH } from '../utils/calculations';
import {
  Calendar,
  Printer,
  Sparkles,
  Lock,
  ShieldAlert,
} from 'lucide-react';

export const PayrollView: React.FC = () => {
  const {
    currentUser,
    payrolls,
    employees,
    settings,
    generateMonthlyPayroll,
    validatePayroll,
    markPayrollPaid,
    hasUserPermission,
    roles,
  } = useApp();
  const { t, tRole } = useI18n();

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [activePayrollModal, setActivePayrollModal] = useState<Payroll | null>(null);

  const role = currentUser.role;
  const activeRoleObj = roles.find((r) => r.key === role);
  const localizedRoleName = tRole(role, activeRoleObj?.name || role);

  // Dynamic RBAC access check
  if (!hasUserPermission('manage_payroll')) {
    return (
      <div className="p-12 text-center ios-card">
        <ShieldAlert className="w-12 h-12 text-[#9F1239] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#0D1B38] tracking-tight">{t('access.restrictedPayrollTitle')}</h3>
        <p className="text-xs text-[#546A8E] mt-1 max-w-sm mx-auto">
          {t('access.restrictedPayrollDesc', { role: localizedRoleName })}
        </p>
      </div>
    );
  }

  const isComptable = role === 'comptable'; // Comptable sees totals only, not individual wages (Section 2)

  const monthPayrolls = payrolls.filter((p) => p.mois === selectedMonth);

  const totalBrut = monthPayrolls.reduce((sum, p) => sum + p.salaire_brut, 0);
  const totalCnss = monthPayrolls.reduce((sum, p) => sum + p.cnss_salarie, 0);
  const totalAmo = monthPayrolls.reduce((sum, p) => sum + p.amo, 0);
  const totalIr = monthPayrolls.reduce((sum, p) => sum + p.ir, 0);
  const totalNet = monthPayrolls.reduce((sum, p) => sum + p.net_a_payer, 0);

  const allValidated = monthPayrolls.length > 0 && monthPayrolls.every((p) => p.statut !== 'brouillon');

  const translatePayrollStatus = (status: PayrollStatus) => {
    if (status === 'payée') return t('payroll.status.payée');
    if (status === 'validée') return t('payroll.status.validée');
    return t('payroll.status.brouillon');
  };

  const handleGenerate = () => {
    generateMonthlyPayroll(selectedMonth);
  };

  const handleValidateAll = () => {
    monthPayrolls.filter((p) => p.statut === 'brouillon').forEach((p) => validatePayroll(p.id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[22px] font-bold text-[#0D1B38] tracking-[-0.02em]">{t('payroll.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('payroll.subtitle')}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 ios-input px-3 py-1.5 min-h-[38px] shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-[#0D1B38] bg-transparent focus:outline-hidden"
            >
              <option value="2026-11">{t('payroll.month.2026-11')}</option>
              <option value="2026-10">{t('payroll.month.2026-10')}</option>
              <option value="2026-09">{t('payroll.month.2026-09')}</option>
            </select>
          </div>

          {/* 1-Click Generation Button (RH-4) */}
          {!isComptable && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-4 py-2 min-h-[38px] text-xs ios-btn-primary whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('payroll.generateBtn', { month: selectedMonth })}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <div className="ios-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#546A8E] font-medium">{t('payroll.kpi.gross')}</div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#0D1B38] mt-1">{formatDH(totalBrut)}</div>
        </div>

        <div className="ios-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#546A8E] font-medium">{t('payroll.kpi.cnss')}</div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#273B63] mt-1">{formatDH(totalCnss)}</div>
        </div>

        <div className="ios-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#546A8E] font-medium">{t('payroll.kpi.amo')}</div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#273B63] mt-1">{formatDH(totalAmo)}</div>
        </div>

        <div className="ios-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#546A8E] font-medium">{t('payroll.kpi.ir')}</div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#273B63] mt-1">{formatDH(totalIr)}</div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-[22px] border border-[#A7DFC3] bg-[#DCF4E8]/85 shadow-[inset_0_1px_0_rgba(240,253,246,0.85),0_6px_18px_-8px_rgba(14,98,69,0.12)]">
          <div className="text-[11px] text-[#0E6245] font-medium">{t('payroll.kpi.net')}</div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#0E6245] mt-1">{formatDH(totalNet)}</div>
        </div>
      </div>

      {/* Workflow Action Bar (RH-6 & R6) */}
      {!isComptable && monthPayrolls.length > 0 && !allValidated && (
        <div className="p-3.5 bg-[#DFF0FC]/90 backdrop-blur-xl border border-[#A5D3F3] rounded-[20px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[inset_0_1px_0_rgba(240,249,255,0.85)]">
          <div className="text-xs text-[#0C4A6E] font-medium">
            {t('payroll.workflowBanner')}
          </div>
          <button
            onClick={handleValidateAll}
            className="px-4 py-2 sm:py-1.5 min-h-[36px] text-xs ios-btn-primary shrink-0 whitespace-nowrap w-full sm:w-auto text-center"
          >
            {t('payroll.validateAll')}
          </button>
        </div>
      )}

      {/* Table of Payrolls */}
      <div className="ios-card overflow-hidden">
        {isComptable ? (
          /* Comptable restriction: Total only, not individual wages (Section 2) */
          <div className="p-6 text-center space-y-2">
            <Lock className="w-8 h-8 text-[#627799] mx-auto" />
            <div className="text-sm font-bold text-[#0D1B38]">{t('payroll.comptableHiddenTitle')}</div>
            <div className="text-xs text-[#546A8E] max-w-md mx-auto">
              {t('payroll.comptableHiddenDesc', { total: formatDH(totalNet) })}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-[#DCE6F3]">
              {monthPayrolls.map((payroll) => {
                const emp = employees.find((e) => e.id === payroll.employee_id);
                return (
                  <div key={payroll.id} className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-[#0D1B38] truncate">
                          {emp ? `${emp.prenom} ${emp.nom}` : payroll.employee_id}
                        </div>
                        <div className="text-[11px] text-[#627799] font-mono truncate">
                          {emp?.matricule} · {emp?.poste}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold shrink-0 ${
                          payroll.statut === 'payée'
                            ? 'text-emerald-700'
                            : payroll.statut === 'validée'
                            ? 'text-[#0284C7]'
                            : 'text-amber-700'
                        }`}
                      >
                        {translatePayrollStatus(payroll.statut)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#E6EEF8] border border-[#CFDDED] p-2.5 rounded-xl text-[11px]">
                      <div>
                        <span className="text-[#546A8E] block">{t('payroll.col.gross')}</span>
                        <span className="font-mono font-semibold text-[#0D1B38]">{formatDH(payroll.salaire_brut)}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-[#546A8E] block">{t('payroll.col.net')}</span>
                        <span className="font-mono font-bold text-emerald-700">{formatDH(payroll.net_a_payer)}</span>
                      </div>
                      <div>
                        <span className="text-[#546A8E] block">CNSS / AMO</span>
                        <span className="font-mono text-[#273B63]">
                          {formatDH(payroll.cnss_salarie + payroll.amo)}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-[#546A8E] block">IR</span>
                        <span className="font-mono text-[#273B63]">{formatDH(payroll.ir)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {payroll.statut === 'brouillon' && (
                        <button
                          onClick={() => validatePayroll(payroll.id)}
                          className="px-3 py-1.5 text-[11px] ios-btn-tinted rounded-[10px] whitespace-nowrap"
                        >
                          {t('payroll.validateSlip')}
                        </button>
                      )}
                      {payroll.statut === 'validée' && (
                        <button
                          onClick={() => markPayrollPaid(payroll.id)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-[#0E6245] bg-[#DCF4E8] hover:bg-[#CDEEDB] border border-[#A7DFC3] rounded-[10px] active:scale-[0.96] transition-all whitespace-nowrap"
                        >
                          {t('payroll.markPaid')}
                        </button>
                      )}
                      <button
                        onClick={() => setActivePayrollModal(payroll)}
                        className="px-3 py-1.5 text-[11px] ios-btn-secondary rounded-[10px] whitespace-nowrap"
                      >
                        {t('payroll.pdfBtn')}
                      </button>
                    </div>
                  </div>
                );
              })}
              {monthPayrolls.length === 0 && (
                <div className="py-10 text-center text-[#627799] text-xs">
                  {t('payroll.noSlips', { month: selectedMonth })}
                </div>
              )}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-start text-xs min-w-[950px]">
              <thead className="bg-[#E6EEF8] text-[#475E82] font-semibold border-b border-[#D1DFEE]">
                <tr>
                  <th className="py-3 px-4 text-start">{t('payroll.col.employee')}</th>
                  <th className="py-3 px-3 text-end">{t('payroll.col.gross')}</th>
                  <th className="py-3 px-3 text-end">{t('payroll.col.allowances')}</th>
                  <th className="py-3 px-3 text-end">CNSS (4.48%)</th>
                  <th className="py-3 px-3 text-end">AMO (2.26%)</th>
                  <th className="py-3 px-3 text-end">IR</th>
                  <th className="py-3 px-3 text-end font-bold text-[#0D1B38]">{t('payroll.col.net')}</th>
                  <th className="py-3 px-3 text-center">{t('common.status')}</th>
                  <th className="py-3 px-4 text-end">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F3]">
                {monthPayrolls.map((payroll) => {
                  const emp = employees.find((e) => e.id === payroll.employee_id);

                  return (
                    <tr key={payroll.id} className="hover:bg-[#E7EFFA] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0D1B38]">
                          {emp ? `${emp.prenom} ${emp.nom}` : payroll.employee_id}
                        </div>
                        <div className="text-[11px] text-[#627799] font-mono">
                          {emp?.matricule} · {emp?.poste}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-end font-mono font-medium text-[#1C2E4F] whitespace-nowrap">
                        {formatDH(payroll.salaire_brut)}
                      </td>

                      <td className="py-3 px-3 text-end font-mono text-[#475E82] whitespace-nowrap">
                        {formatDH(payroll.indemnites_deplacement + payroll.primes)}
                      </td>

                      <td className="py-3 px-3 text-end font-mono text-[#475E82] whitespace-nowrap">
                        {formatDH(payroll.cnss_salarie)}
                      </td>

                      <td className="py-3 px-3 text-end font-mono text-[#475E82] whitespace-nowrap">
                        {formatDH(payroll.amo)}
                      </td>

                      <td className="py-3 px-3 text-end font-mono text-[#475E82] whitespace-nowrap">
                        {formatDH(payroll.ir)}
                      </td>

                      <td className="py-3 px-3 text-end font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatDH(payroll.net_a_payer)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[11px] font-semibold ${
                            payroll.statut === 'payée'
                              ? 'text-emerald-700'
                              : payroll.statut === 'validée'
                              ? 'text-[#0284C7]'
                              : 'text-amber-700'
                          }`}
                        >
                          {translatePayrollStatus(payroll.statut)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-end whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {payroll.statut === 'brouillon' && (
                            <button
                              onClick={() => validatePayroll(payroll.id)}
                              className="px-2.5 py-1 text-[11px] ios-btn-tinted rounded-[10px] whitespace-nowrap"
                            >
                              {t('payroll.validateSlip')}
                            </button>
                          )}

                          {payroll.statut === 'validée' && (
                            <button
                              onClick={() => markPayrollPaid(payroll.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#0E6245] bg-[#DCF4E8] hover:bg-[#CDEEDB] border border-[#A7DFC3] rounded-[10px] active:scale-[0.96] transition-all whitespace-nowrap"
                            >
                              {t('payroll.markPaid')}
                            </button>
                          )}

                          <button
                            onClick={() => setActivePayrollModal(payroll)}
                            className="px-2.5 py-1 text-[11px] ios-btn-secondary rounded-[10px] whitespace-nowrap"
                          >
                            {t('payroll.pdfBtn')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {monthPayrolls.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-[#627799] text-xs">
                      {t('payroll.noSlips', { month: selectedMonth })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Printable Bulletin de Paie Modal (RH-7) */}
      {activePayrollModal && (
        <div className="fixed inset-0 ios-sheet-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="ios-sheet rounded-t-[28px] sm:rounded-[26px] max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto print-page">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#B8CAE2] mx-auto -mt-1 no-print" />
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DAE5F2] pb-3 no-print">
              <h3 className="text-sm font-bold text-[#0D1B38] tracking-tight">{t('payroll.modalTitle')}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 min-h-[34px] ios-btn-primary text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('payroll.printPdf')}</span>
                </button>
                <button
                  onClick={() => setActivePayrollModal(null)}
                  className="px-3.5 py-1.5 min-h-[34px] ios-btn-secondary text-xs"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-3 sm:p-4 border border-[#CFDDED] bg-[#F5F8FD] rounded-xl text-xs space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-[#CFDDED] pb-3">
                <div className="flex items-start gap-3">
                  <img
                    src="/assets/aistudio/devnappLogo_10b7b539.jpg"
                    alt="DEVNAPP SARL"
                    className="w-12 h-12 rounded-xl object-contain bg-[#0B1733] p-1 border border-[#1E3669] shadow-xs shrink-0"
                  />
                  <div>
                    <div className="font-bold text-base text-[#0D1B38]">{settings.company_name}</div>
                    <div className="text-[#0284C7] font-semibold text-[10px] uppercase">{t('app.tagline')}</div>
                    <div className="text-[11px] text-[#546A8E]">{settings.adresse}, {settings.ville}</div>
                    <div className="text-[11px] text-[#546A8E] font-mono">
                      ICE: {settings.ice} · IF: {settings.if_number} · RC: {settings.rc}
                    </div>
                  </div>
                </div>
                <div className="text-start sm:text-end">
                  <div className="font-bold text-sm text-[#0D1B38]">{t('payroll.docTitle')}</div>
                  <div className="text-[#475E82] font-mono">{t('payroll.period')} {activePayrollModal.mois}</div>
                </div>
              </div>

              {/* Employee & Contract Info */}
              {(() => {
                const emp = employees.find((e) => e.id === activePayrollModal.employee_id);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-[#E6EEF8] border border-[#CFDDED] p-3 rounded-xl text-[11px]">
                    <div>
                      <div><span className="text-[#546A8E]">{t('payroll.empLabel')}</span> <strong className="text-[#0D1B38]">{emp?.prenom} {emp?.nom}</strong></div>
                      <div><span className="text-[#546A8E]">{t('payroll.matriculeLabel')}</span> <span className="font-mono">{emp?.matricule}</span></div>
                      <div><span className="text-[#546A8E]">{t('payroll.cinLabel')}</span> <span className="font-mono">{emp?.cin}</span></div>
                      <div><span className="text-[#546A8E]">{t('payroll.cnssLabel')}</span> <span className="font-mono">{emp?.numero_cnss}</span></div>
                    </div>
                    <div>
                      <div><span className="text-[#546A8E]">{t('payroll.roleLabel')}</span> {emp?.poste}</div>
                      <div><span className="text-[#546A8E]">{t('payroll.deptLabel')}</span> {emp?.departement}</div>
                      <div><span className="text-[#546A8E]">{t('payroll.contractLabel')}</span> {emp?.type_contrat}</div>
                      <div><span className="text-[#546A8E]">{t('payroll.modeLabel')}</span> {emp?.mode_paiement}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Breakdown lines */}
              <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border border-[#CFDDED] min-w-[460px]">
                <thead className="bg-[#E4ECF7] font-semibold text-[#273B63]">
                  <tr>
                    <th className="p-2 text-start">{t('payroll.col.designation')}</th>
                    <th className="p-2 text-end">{t('payroll.col.base')}</th>
                    <th className="p-2 text-end">{t('payroll.col.rate')}</th>
                    <th className="p-2 text-end">{t('payroll.col.earnings')}</th>
                    <th className="p-2 text-end">{t('payroll.col.deductions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F3] font-mono text-[11px]">
                  <tr>
                    <td className="p-2 font-sans">{t('payroll.line.baseSalary')}</td>
                    <td className="p-2 text-end">{formatDH(activePayrollModal.salaire_brut)}</td>
                    <td className="p-2 text-end">-</td>
                    <td className="p-2 text-end">{formatDH(activePayrollModal.salaire_brut)}</td>
                    <td className="p-2 text-end">-</td>
                  </tr>
                  {activePayrollModal.indemnites_deplacement > 0 && (
                    <tr>
                      <td className="p-2 font-sans">{t('payroll.line.travel')}</td>
                      <td className="p-2 text-end">-</td>
                      <td className="p-2 text-end">-</td>
                      <td className="p-2 text-end">{formatDH(activePayrollModal.indemnites_deplacement)}</td>
                      <td className="p-2 text-end">-</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2 font-sans">{t('payroll.line.cnss')}</td>
                    <td className="p-2 text-end">6 000,00</td>
                    <td className="p-2 text-end">4.48%</td>
                    <td className="p-2 text-end">-</td>
                    <td className="p-2 text-end">{formatDH(activePayrollModal.cnss_salarie)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">{t('payroll.line.amo')}</td>
                    <td className="p-2 text-end">{formatDH(activePayrollModal.salaire_brut)}</td>
                    <td className="p-2 text-end">2.26%</td>
                    <td className="p-2 text-end">-</td>
                    <td className="p-2 text-end">{formatDH(activePayrollModal.amo)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">{t('payroll.line.ir')}</td>
                    <td className="p-2 text-end">-</td>
                    <td className="p-2 text-end">{t('payroll.scale')}</td>
                    <td className="p-2 text-end">-</td>
                    <td className="p-2 text-end">{formatDH(activePayrollModal.ir)}</td>
                  </tr>
                </tbody>
              </table>
              </div>

              {/* Total Net Box */}
              <div className="flex justify-between items-center bg-emerald-50/90 p-3 rounded-xl border border-emerald-200">
                <span className="font-bold text-[#0D1B38]">{t('payroll.netPayableFooter')}</span>
                <span className="font-mono text-base font-bold text-emerald-800">
                  {formatDH(activePayrollModal.net_a_payer)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
