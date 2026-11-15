/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { formatDH, round2, checkContractExpiration } from '../utils/calculations';
import {
  TrendingUp,
  Receipt,
  Wallet,
  AlertTriangle,
  FileCheck2,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  FileText,
  Building,
  DollarSign,
} from 'lucide-react';
import { ProjectProfitabilityChart } from './ProjectProfitabilityChart';

export const DashboardView: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const {
    currentUser,
    projects,
    invoices,
    payments,
    expenses,
    employees,
    contracts,
    dailyReports,
    siteVisits,
    clients,
    payrolls,
  } = useApp();
  const { t, locale, isRTL } = useI18n();

  const [period, setPeriod] = useState<'mois' | 'trimestre' | 'annee'>('mois');
  const role = currentUser.role;

  // 1. Calculations
  // Total encaissé (revenu réel = paiements encaissés selon Règle 3 & Section 5.8)
  const totalRevenusEncaisses = payments
    .filter((p) => p.statut === 'encaissé')
    .reduce((sum, p) => sum + p.montant, 0);

  // CA facturé (somme des factures validées/payées)
  const caFacture = invoices
    .filter((i) => ['validée', 'payée', 'payée partiellement'].includes(i.statut) && i.type !== 'avoir')
    .reduce((sum, i) => sum + i.total_ttc, 0);

  // Charges totales validées (salaires inclus, Section 5.8)
  const chargesTotales = expenses
    .filter((e) => e.statut === 'validée')
    .reduce((sum, e) => sum + e.montant_ttc, 0);

  // Bénéfice net (Section 5.8 & R11: Revenus encaissés - charges totales)
  const beneficeNet = round2(totalRevenusEncaisses - chargesTotales);

  // Impayés (reste à payer des factures validées)
  const totalImpayes = invoices
    .filter((i) => ['validée', 'payée partiellement'].includes(i.statut))
    .reduce((sum, i) => sum + i.reste_a_payer, 0);

  // Factures en retard
  const todayStr = new Date().toISOString().split('T')[0];
  const facturesEnRetard = invoices.filter(
    (i) =>
      ['validée', 'payée partiellement'].includes(i.statut) &&
      i.date_echeance < todayStr &&
      i.reste_a_payer > 0
  );
  const montantRetard = facturesEnRetard.reduce((sum, i) => sum + i.reste_a_payer, 0);

  // Contrats à renouveler (< 60 jours)
  const contratsARenouveler = contracts.filter((c) => {
    const check = checkContractExpiration(c.date_fin);
    return ['urgent', 'warning', 'notice', 'expired'].includes(check.alertLevel);
  });

  // Masse salariale
  const masseSalariale = employees
    .filter((e) => e.statut === 'actif')
    .reduce((sum, e) => sum + e.salaire_brut_base, 0);
  const ratioMasseSalariale = totalRevenusEncaisses > 0 ? Math.round((masseSalariale / totalRevenusEncaisses) * 100) : 0;

  // Frais en attente
  const fraisEnAttente = siteVisits.reduce((acc, v) => {
    const p = (v.expenses || []).filter((e) => e.statut === 'en attente').reduce((s, e) => s + e.montant, 0);
    return acc + p;
  }, 0);

  // Activité du jour
  const activeEmps = employees.filter((e) => e.statut === 'actif');
  const reportsToday = dailyReports.filter((r) => r.date === todayStr || r.date === '2026-10-31');
  const missingReportsCount = Math.max(0, activeEmps.length - reportsToday.length);

  // Top 5 Clients par chiffre d'affaires encaissé
  const clientsRevenueMap = new Map<string, number>();
  payments.forEach((p) => {
    if (p.statut === 'encaissé') {
      const cur = clientsRevenueMap.get(p.client_id) || 0;
      clientsRevenueMap.set(p.client_id, cur + p.montant);
    }
  });

  const topClients = Array.from(clientsRevenueMap.entries())
    .map(([clientId, amount]) => ({
      client: clients.find((c) => c.id === clientId),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner with Filter and Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#CFDDED]">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">
            {role === 'admin' || role === 'super_admin'
              ? t('dash.title.admin')
              : role === 'comptable'
              ? t('dash.title.comptable')
              : role === 'rh'
              ? t('dash.title.rh')
              : role === 'commercial'
              ? t('dash.title.commercial')
              : t('dash.title.default')}
          </h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('app.companyName')} · {new Date().toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Period Selector */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-[#DCE6F4] border border-[#C9D9EC] rounded-xl text-xs font-medium w-full sm:w-auto">
          <button
            onClick={() => setPeriod('mois')}
            className={`px-3 py-1.5 rounded-lg transition-all text-center ${
              period === 'mois' ? 'bg-[#F4F8FD] text-[#0D1B38] font-semibold shadow-xs' : 'text-[#4B6187] hover:text-[#0D1B38]'
            }`}
          >
            {t('dash.period.month')}
          </button>
          <button
            onClick={() => setPeriod('trimestre')}
            className={`px-3 py-1.5 rounded-lg transition-all text-center ${
              period === 'trimestre' ? 'bg-[#F4F8FD] text-[#0D1B38] font-semibold shadow-xs' : 'text-[#4B6187] hover:text-[#0D1B38]'
            }`}
          >
            {t('dash.period.quarter')}
          </button>
          <button
            onClick={() => setPeriod('annee')}
            className={`px-3 py-1.5 rounded-lg transition-all text-center ${
              period === 'annee' ? 'bg-[#F4F8FD] text-[#0D1B38] font-semibold shadow-xs' : 'text-[#4B6187] hover:text-[#0D1B38]'
            }`}
          >
            {t('dash.period.year')}
          </button>
        </div>
      </div>

      {/* Main KPI Grid (Role-tailored & full for Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenus encaissés */}
        {['super_admin', 'admin', 'comptable', 'commercial', 'cashier'].includes(role) && (
          <div className="bg-[#F1F5FB] p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] hover:border-[#A7CBE8] transition-colors">
            <div className="flex items-center justify-between text-xs text-[#546A8E] mb-2.5">
              <span className="font-medium">{t('dash.kpi.collectedRevenue')}</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100/80 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#0D1B38]">
              {formatDH(totalRevenusEncaisses)}
            </div>
            <div className="text-xs text-[#5F7394] mt-2 flex items-center gap-1.5">
              <span>{t('dash.kpi.billedTurnover')}</span>
              <span className="font-mono font-semibold text-[#2B4068]">{formatDH(caFacture)}</span>
            </div>
          </div>
        )}

        {/* KPI 2: Charges totales */}
        {['super_admin', 'admin', 'comptable'].includes(role) && (
          <div className="bg-[#F1F5FB] p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] hover:border-[#A7CBE8] transition-colors">
            <div className="flex items-center justify-between text-xs text-[#546A8E] mb-2.5">
              <span className="font-medium">{t('dash.kpi.validatedExpenses')}</span>
              <span className="w-8 h-8 rounded-xl bg-rose-100/80 border border-rose-200/80 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-rose-700" />
              </span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#0D1B38]">
              {formatDH(chargesTotales)}
            </div>
            <div className="text-xs text-[#5F7394] mt-2">
              {t('dash.kpi.salariesIncluded')} <span className="font-mono font-semibold text-[#2B4068]">{formatDH(masseSalariale)}</span>
            </div>
          </div>
        )}

        {/* KPI 3: Bénéfice Net */}
        {['super_admin', 'admin'].includes(role) ? (
          <div className="bg-[#F1F5FB] p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] hover:border-[#A7CBE8] transition-colors">
            <div className="flex items-center justify-between text-xs text-[#546A8E] mb-2.5">
              <span className="font-medium">{t('dash.kpi.netProfit')}</span>
              <span className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${beneficeNet >= 0 ? 'bg-sky-100/80 border-sky-200/80' : 'bg-rose-100/80 border-rose-200/80'}`}>
                <DollarSign className={`w-4 h-4 ${beneficeNet >= 0 ? 'text-[#0284C7]' : 'text-rose-700'}`} />
              </span>
            </div>
            <div className={`text-lg sm:text-xl font-bold font-mono ${beneficeNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatDH(beneficeNet)}
            </div>
            <div className="text-xs text-[#5F7394] mt-2">
              {t('dash.kpi.netMargin')} {totalRevenusEncaisses > 0 ? Math.round((beneficeNet / totalRevenusEncaisses) * 100) : 0}%
            </div>
          </div>
        ) : (
          <div className="bg-[#F1F5FB] p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] hover:border-[#A7CBE8] transition-colors">
            <div className="flex items-center justify-between text-xs text-[#546A8E] mb-2.5">
              <span className="font-medium">{t('dash.kpi.monthlyPayroll')}</span>
              <span className="w-8 h-8 rounded-xl bg-sky-100/80 border border-sky-200/80 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#0284C7]" />
              </span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-[#0D1B38]">
              {formatDH(masseSalariale)}
            </div>
            <div className="text-xs text-[#5F7394] mt-2">
              {t('dash.kpi.activeEmployees', { count: employees.length })}
            </div>
          </div>
        )}

        {/* KPI 4: Impayés & Retards */}
        <div className="bg-[#F1F5FB] p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] hover:border-[#A7CBE8] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#546A8E] mb-2.5">
            <span className="font-medium">{t('dash.kpi.unpaidInvoices')}</span>
            <span className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${montantRetard > 0 ? 'bg-amber-100/80 border-amber-200/80' : 'bg-[#E6EEF8] border-[#CFDDED]'}`}>
              <AlertTriangle className={`w-4 h-4 ${montantRetard > 0 ? 'text-amber-700' : 'text-[#5F7394]'}`} />
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-800">
            {formatDH(totalImpayes)}
          </div>
          <div className="text-xs text-rose-700 mt-2 font-medium">
            {t('dash.kpi.overdueCount', { count: facturesEnRetard.length, amount: formatDH(montantRetard) })}
          </div>
        </div>
      </div>

      {/* Middle Row: Operational Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Contrats à renouveler */}
        <div className="bg-[#F1F5FB] p-4 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_20px_-8px_rgba(11,23,51,0.07)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#546A8E] font-medium">{t('dash.kpi.contractsExpiring')}</div>
            <div className="text-xl font-bold text-[#0D1B38] mt-1 font-mono">{contratsARenouveler.length}</div>
            <div className="text-xs text-[#5F7394] mt-0.5">{t('dash.kpi.contractsSub')}</div>
          </div>
          <button
            onClick={() => onNavigate('contracts')}
            className="p-2.5 bg-[#E6EEF8] hover:bg-[#DCE7F6] border border-[#C9D9EC] rounded-xl text-[#273B63] transition-colors"
          >
            <FileCheck2 className="w-5 h-5 text-[#0284C7]" />
          </button>
        </div>

        {/* Activité du jour */}
        <div className="bg-[#F1F5FB] p-4 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_20px_-8px_rgba(11,23,51,0.07)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#546A8E] font-medium">{t('dash.kpi.dailyActivity')}</div>
            <div className="text-xl font-bold text-[#0D1B38] mt-1 font-mono">
              {reportsToday.length} / {activeEmps.length}
            </div>
            <div className="text-xs text-[#5F7394] mt-0.5">
              {missingReportsCount > 0 ? t('dash.kpi.reportsRemaining', { count: missingReportsCount }) : t('dash.kpi.allReportsSubmitted')}
            </div>
          </div>
          <button
            onClick={() => onNavigate('daily_report')}
            className="p-2.5 bg-[#E6EEF8] hover:bg-[#DCE7F6] border border-[#C9D9EC] rounded-xl text-[#273B63] transition-colors"
          >
            <Clock className="w-5 h-5 text-emerald-700" />
          </button>
        </div>

        {/* Frais en attente */}
        <div className="bg-[#F1F5FB] p-4 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_20px_-8px_rgba(11,23,51,0.07)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#546A8E] font-medium">{t('dash.kpi.pendingTravel')}</div>
            <div className="text-xl font-bold text-[#0D1B38] mt-1 font-mono">{formatDH(fraisEnAttente)}</div>
            <div className="text-xs text-[#5F7394] mt-0.5">{t('dash.kpi.pendingTravelSub')}</div>
          </div>
          <button
            onClick={() => onNavigate('site_visits')}
            className="p-2.5 bg-[#E6EEF8] hover:bg-[#DCE7F6] border border-[#C9D9EC] rounded-xl text-[#273B63] transition-colors"
          >
            <Receipt className="w-5 h-5 text-amber-700" />
          </button>
        </div>
      </div>

      {/* Recharts: Monthly Project Profitability Trend */}
      <ProjectProfitabilityChart
        projects={projects}
        invoices={invoices}
        payments={payments}
        dailyReports={dailyReports}
        siteVisits={siteVisits}
        employees={employees}
        onNavigateToProjects={() => onNavigate('projects')}
      />

      {/* Two-Column Detail View: Financial Comparison & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Breakdown Chart / Progress */}
        <div className="bg-[#F1F5FB] p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0D1B38]">{t('dash.breakdownTitle')}</h3>
            <span className="text-xs text-[#5F7394]">{t('dash.currentPeriod')}</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-[#3B4F73]">{t('dash.collectedLine')}</span>
                <span className="font-mono text-emerald-700 font-semibold">{formatDH(totalRevenusEncaisses)}</span>
              </div>
              <div className="h-3 w-full bg-[#E1EAF6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, totalRevenusEncaisses > 0 ? 100 : 0)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-[#3B4F73]">{t('dash.validatedChargesLine')}</span>
                <span className="font-mono text-rose-700 font-semibold">{formatDH(chargesTotales)}</span>
              </div>
              <div className="h-3 w-full bg-[#E1EAF6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, totalRevenusEncaisses > 0 ? (chargesTotales / totalRevenusEncaisses) * 100 : 50)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-[#3B4F73]">{t('dash.payrollRatioLine', { pct: ratioMasseSalariale })}</span>
                <span className="font-mono text-[#0284C7] font-semibold">{formatDH(masseSalariale)}</span>
              </div>
              <div className="h-3 w-full bg-[#E1EAF6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] rounded-full transition-all"
                  style={{ width: `${Math.min(100, ratioMasseSalariale)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DAE5F2] flex items-center justify-between text-xs">
            <span className="text-[#546A8E]">{t('dash.netCashAvailable')}</span>
            <span className={`font-mono font-bold text-sm ${beneficeNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatDH(beneficeNet)}
            </span>
          </div>
        </div>

        {/* Top 5 Clients by Revenue */}
        <div className="bg-[#F1F5FB] p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0D1B38]">{t('dash.topClientsTitle')}</h3>
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs text-[#0284C7] hover:text-[#0369A1] font-semibold"
            >
              {t('dash.viewAllClients')} {isRTL ? '←' : '→'}
            </button>
          </div>

          <div className="divide-y divide-[#DCE6F3]">
            {topClients.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#E4ECF7] text-[#3B4F73] flex items-center justify-center font-mono font-semibold text-[11px]">#{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0D1B38] truncate">
                      {item.client?.raison_sociale || t('common.unknownClient')}
                    </div>
                    <div className="text-[11px] text-[#5F7394]">{item.client?.ville || 'Maroc'}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-[#0D1B38] shrink-0">{formatDH(item.amount)}</div>
              </div>
            ))}
            {topClients.length === 0 && (
              <div className="py-4 text-center text-xs text-[#5F7394]">{t('dash.noPayments')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contrats à échéance */}
        <div className="bg-amber-50/85 border border-amber-200/90 rounded-2xl p-4 shadow-[0_4px_16px_-6px_rgba(180,83,9,0.08)]">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{t('dash.contractAlertsTitle')}</span>
          </div>
          <div className="space-y-1.5">
            {contratsARenouveler.slice(0, 3).map((c) => {
              const client = clients.find((cl) => cl.id === c.client_id);
              const alert = checkContractExpiration(c.date_fin);
              return (
                <div key={c.id} className="text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#F4F8FD]/90 p-2.5 rounded-xl border border-amber-200/70">
                  <div className="min-w-0">
                    <span className="font-semibold text-[#0D1B38]">{c.numero_contrat}</span>
                    <span className="text-[#546A8E] ms-2 break-words">({client?.raison_sociale})</span>
                  </div>
                  <span className="font-medium text-amber-800 font-mono shrink-0">{alert.message}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Factures en retard */}
        <div className="bg-rose-50/85 border border-rose-200/90 rounded-2xl p-4 shadow-[0_4px_16px_-6px_rgba(190,18,60,0.08)]">
          <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs mb-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{t('dash.overdueAlertsTitle')}</span>
          </div>
          <div className="space-y-1.5">
            {facturesEnRetard.length > 0 ? (
              facturesEnRetard.slice(0, 3).map((inv) => {
                const client = clients.find((cl) => cl.id === inv.client_id);
                return (
                  <div key={inv.id} className="text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-[#F4F8FD]/90 p-2.5 rounded-xl border border-rose-200/70">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#0D1B38]">{inv.numero}</span>
                      <span className="text-[#546A8E] ms-2 break-words">({client?.raison_sociale})</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span className="font-bold text-rose-700 font-mono">{formatDH(inv.reste_a_payer)}</span>
                      <button
                        onClick={() => onNavigate('reminders')}
                        className="text-[11px] text-[#0284C7] hover:underline font-semibold"
                      >
                        {t('dash.remind')}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-rose-700 py-1">{t('dash.noOverdueInvoices')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
