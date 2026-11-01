/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {role === 'admin'
              ? 'Tableau de bord Général (Gérant)'
              : role === 'comptable'
              ? 'Tableau de bord Finance & Trésorerie'
              : role === 'rh'
              ? 'Tableau de bord Ressources Humaines'
              : role === 'commercial'
              ? 'Tableau de bord Commercial & Contrats'
              : 'Tableau de bord Activité & Rapports'}
          </h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Société DEVNAPP SARL · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setPeriod('mois')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'mois' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ce Mois
          </button>
          <button
            onClick={() => setPeriod('trimestre')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'trimestre' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ce Trimestre
          </button>
          <button
            onClick={() => setPeriod('annee')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'annee' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Année 2026
          </button>
        </div>
      </div>

      {/* Main KPI Grid (Role-tailored & full for Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenus encaissés */}
        {['admin', 'comptable', 'commercial'].includes(role) && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Revenus Encaissés (Réel)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {formatDH(totalRevenusEncaisses)}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span>CA Facturé :</span>
              <span className="font-mono font-medium text-slate-700">{formatDH(caFacture)}</span>
            </div>
          </div>
        )}

        {/* KPI 2: Charges totales */}
        {['admin', 'comptable'].includes(role) && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Charges Totales Validées</span>
              <Wallet className="w-4 h-4 text-rose-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {formatDH(chargesTotales)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Salaires inclus : <span className="font-mono font-medium text-slate-700">{formatDH(masseSalariale)}</span>
            </div>
          </div>
        )}

        {/* KPI 3: Bénéfice Net */}
        {role === 'admin' ? (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Bénéfice Net (Encaissé - Charges)</span>
              <DollarSign className={`w-4 h-4 shrink-0 ${beneficeNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
            </div>
            <div className={`text-lg sm:text-xl font-bold font-mono ${beneficeNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatDH(beneficeNet)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Marge réelle nette : {totalRevenusEncaisses > 0 ? Math.round((beneficeNet / totalRevenusEncaisses) * 100) : 0}%
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-medium">Masse Salariale Mensuelle</span>
              <Users className="w-4 h-4 text-purple-600 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900">
              {formatDH(masseSalariale)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {employees.length} collaborateurs actifs
            </div>
          </div>
        )}

        {/* KPI 4: Impayés & Retards */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Factures Impayées</span>
            <AlertTriangle className={`w-4 h-4 shrink-0 ${montantRetard > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-700">
            {formatDH(totalImpayes)}
          </div>
          <div className="text-xs text-rose-600 mt-2 font-medium">
            {facturesEnRetard.length} facture(s) en retard ({formatDH(montantRetard)})
          </div>
        </div>
      </div>

      {/* Middle Row: Operational Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Contrats à renouveler */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Contrats à Renouveler (J-60)</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{contratsARenouveler.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Surveillance active des échéances</div>
          </div>
          <button
            onClick={() => onNavigate('contracts')}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Voir contrats"
          >
            <FileCheck2 className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        {/* Activité du jour */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Activité & Rapports Journaliers</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {reportsToday.length} / {activeEmps.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {missingReportsCount > 0 ? `${missingReportsCount} rapport(s) restant(s)` : 'Tous les rapports soumis'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('daily_report')}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Voir rapports"
          >
            <Clock className="w-5 h-5 text-emerald-600" />
          </button>
        </div>

        {/* Frais en attente */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Frais Déplacement à Valider</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{formatDH(fraisEnAttente)}</div>
            <div className="text-xs text-slate-500 mt-0.5">Missions terrain & tickets</div>
          </div>
          <button
            onClick={() => onNavigate('site_visits')}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            title="Voir déplacements"
          >
            <Receipt className="w-5 h-5 text-amber-600" />
          </button>
        </div>
      </div>

      {/* Recharts: Évolution Mensuelle de la Rentabilité des Projets */}
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Répartition Revenus vs Charges</h3>
            <span className="text-xs text-slate-400">Période courante</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600">Revenus encaissés</span>
                <span className="font-mono text-emerald-700 font-semibold">{formatDH(totalRevenusEncaisses)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, totalRevenusEncaisses > 0 ? 100 : 0)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-600">Charges validées (salaires, loyers, cloud)</span>
                <span className="font-mono text-rose-700 font-semibold">{formatDH(chargesTotales)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
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
                <span className="text-slate-600">Masse salariale ({ratioMasseSalariale}% du revenu)</span>
                <span className="font-mono text-purple-700 font-semibold">{formatDH(masseSalariale)}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ratioMasseSalariale)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Trésorerie nette disponible :</span>
            <span className={`font-mono font-bold text-sm ${beneficeNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatDH(beneficeNet)}
            </span>
          </div>
        </div>

        {/* Top 5 Clients by Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Top Clients (CA Encaissé)</h3>
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir tous les clients →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topClients.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-slate-400 font-mono font-medium">#{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {item.client?.raison_sociale || 'Client inconnu'}
                    </div>
                    <div className="text-[11px] text-slate-500">{item.client?.ville || 'Maroc'}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-slate-800 shrink-0">{formatDH(item.amount)}</div>
              </div>
            ))}
            {topClients.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-500">Aucun encaissement enregistré.</div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alerts Banner (Contrats proches + Factures en retard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contrats à échéance */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Alertes Échéances Contrats (Section 5.3 CL-5)</span>
          </div>
          <div className="space-y-1.5">
            {contratsARenouveler.slice(0, 3).map((c) => {
              const client = clients.find((cl) => cl.id === c.client_id);
              const alert = checkContractExpiration(c.date_fin);
              return (
                <div key={c.id} className="text-xs flex items-center justify-between bg-white/80 p-2 rounded-lg border border-amber-100">
                  <div>
                    <span className="font-semibold text-slate-900">{c.numero_contrat}</span>
                    <span className="text-slate-500 ml-2">({client?.raison_sociale})</span>
                  </div>
                  <span className="font-medium text-amber-700 font-mono">{alert.message}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Factures en retard */}
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-rose-900 font-semibold text-xs mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Factures en Retard d'Échéance (Section 5.4 FA-8)</span>
          </div>
          <div className="space-y-1.5">
            {facturesEnRetard.length > 0 ? (
              facturesEnRetard.slice(0, 3).map((inv) => {
                const client = clients.find((cl) => cl.id === inv.client_id);
                return (
                  <div key={inv.id} className="text-xs flex items-center justify-between bg-white/80 p-2 rounded-lg border border-rose-100">
                    <div>
                      <span className="font-semibold text-slate-900">{inv.numero}</span>
                      <span className="text-slate-500 ml-2">({client?.raison_sociale})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-700 font-mono">{formatDH(inv.reste_a_payer)}</span>
                      <button
                        onClick={() => onNavigate('reminders')}
                        className="ml-2 text-[11px] text-blue-600 hover:underline"
                      >
                        Relancer
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-rose-700 py-1">Aucune facture en retard d'échéance.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
