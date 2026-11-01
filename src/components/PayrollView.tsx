/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Payroll } from '../types';
import { formatDH } from '../utils/calculations';
import {
  Banknote,
  CheckCircle2,
  Calendar,
  FileText,
  Printer,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldAlert,
  Download,
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
  } = useApp();

  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [activePayrollModal, setActivePayrollModal] = useState<Payroll | null>(null);

  const role = currentUser.role;

  // Access check (Section 2 & R1)
  if (!['admin', 'rh', 'comptable'].includes(role)) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Accès Refusé (R1)</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Votre rôle actuel ({role}) ne dispose pas des privilèges nécessaires pour consulter les données de paie.
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
  const allPaid = monthPayrolls.length > 0 && monthPayrolls.every((p) => p.statut === 'payée');

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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestion de la Paie Mensuelle</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module RH-4 à RH-7 · Barème Marocain (CNSS plafonnée 6 000 DH, AMO 2.26%, IR progressif)
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            >
              <option value="2026-11">Novembre 2026</option>
              <option value="2026-10">Octobre 2026</option>
              <option value="2026-09">Septembre 2026</option>
            </select>
          </div>

          {/* 1-Click Generation Button (RH-4) */}
          {!isComptable && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Générer en 1 clic ({selectedMonth})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Masse Brute</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">{formatDH(totalBrut)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Cotisations CNSS (4.48%)</div>
          <div className="text-lg font-bold font-mono text-slate-700 mt-1">{formatDH(totalCnss)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Cotisations AMO (2.26%)</div>
          <div className="text-lg font-bold font-mono text-slate-700 mt-1">{formatDH(totalAmo)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Retenue IR (Impôt)</div>
          <div className="text-lg font-bold font-mono text-slate-700 mt-1">{formatDH(totalIr)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="text-[11px] text-emerald-800 font-medium">Net Global à Payer</div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1">{formatDH(totalNet)}</div>
        </div>
      </div>

      {/* Workflow Action Bar (RH-6 & R6) */}
      {!isComptable && monthPayrolls.length > 0 && !allValidated && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="text-xs text-blue-900">
            <span className="font-semibold">Workflow de paie (RH-6 & R6) : </span>
            Les fiches ci-dessous sont au statut <span className="font-bold">Brouillon</span>. La validation créera
            automatiquement une écriture de charge dans la catégorie <span className="font-semibold">Salaires</span>.
          </div>
          <button
            onClick={handleValidateAll}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs shrink-0"
          >
            Valider toute la paie du mois
          </button>
        </div>
      )}

      {/* Table of Payrolls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isComptable ? (
          /* Comptable restriction: Total seulement, pas salaires individuels (Section 2) */
          <div className="p-6 text-center space-y-2">
            <Lock className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-900">Détail individuel masqué pour le profil Comptable</div>
            <div className="text-xs text-slate-500 max-w-md mx-auto">
              Conformément à la matrice des droits de la société (Section 2), le service comptable a accès au total de
              la masse salariale ({formatDH(totalNet)} Net) mais pas aux salaires individuels des collaborateurs.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[950px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Salarié</th>
                  <th className="py-3 px-3 text-right">Salaire Brut</th>
                  <th className="py-3 px-3 text-right">Indemnités / Primes</th>
                  <th className="py-3 px-3 text-right">CNSS (4.48%)</th>
                  <th className="py-3 px-3 text-right">AMO (2.26%)</th>
                  <th className="py-3 px-3 text-right">IR</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-900">Net à Payer</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthPayrolls.map((payroll) => {
                  const emp = employees.find((e) => e.id === payroll.employee_id);

                  return (
                    <tr key={payroll.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {emp ? `${emp.prenom} ${emp.nom}` : payroll.employee_id}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {emp?.matricule} · {emp?.poste}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                        {formatDH(payroll.salaire_brut)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatDH(payroll.indemnites_deplacement + payroll.primes)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatDH(payroll.cnss_salarie)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatDH(payroll.amo)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatDH(payroll.ir)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatDH(payroll.net_a_payer)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[11px] font-semibold ${
                            payroll.statut === 'payée'
                              ? 'text-emerald-700'
                              : payroll.statut === 'validée'
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {payroll.statut}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {payroll.statut === 'brouillon' && (
                          <button
                            onClick={() => validatePayroll(payroll.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            Valider (RH-6)
                          </button>
                        )}

                        {payroll.statut === 'validée' && (
                          <button
                            onClick={() => markPayrollPaid(payroll.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          >
                            Payer
                          </button>
                        )}

                        <button
                          onClick={() => setActivePayrollModal(payroll)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Bulletin PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {monthPayrolls.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                      Aucun bulletin généré pour {selectedMonth}. Cliquez sur "Générer en 1 clic".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Bulletin de Paie Modal (RH-7) */}
      {activePayrollModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto print-page">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <h3 className="text-sm font-bold text-slate-900">Bulletin de Paie Officiel (RH-7)</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs rounded-lg font-medium shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / PDF</span>
                </button>
                <button
                  onClick={() => setActivePayrollModal(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs rounded-lg"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-4 border border-slate-200 rounded-lg text-xs space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div className="flex items-start gap-3">
                  <img
                    src="/assets/aistudio/devnappLogo_10b7b539.jpg"
                    alt="DEVNAPP SARL"
                    className="w-12 h-12 rounded-lg object-contain bg-slate-950 p-1 border border-slate-800 shadow-xs"
                  />
                  <div>
                    <div className="font-bold text-base text-slate-900">{settings.company_name}</div>
                    <div className="text-cyan-700 font-semibold text-[10px] uppercase">DNA Digital Solutions</div>
                    <div className="text-[11px] text-slate-500">{settings.adresse}, {settings.ville}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      ICE: {settings.ice} · IF: {settings.if_number} · RC: {settings.rc}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-900">BULLETIN DE PAIE</div>
                  <div className="text-slate-600 font-mono">Période : {activePayrollModal.mois}</div>
                </div>
              </div>

              {/* Employee & Contract Info */}
              {(() => {
                const emp = employees.find((e) => e.id === activePayrollModal.employee_id);
                return (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-md text-[11px]">
                    <div>
                      <div><span className="text-slate-500">Salarié :</span> <strong className="text-slate-900">{emp?.prenom} {emp?.nom}</strong></div>
                      <div><span className="text-slate-500">Matricule :</span> <span className="font-mono">{emp?.matricule}</span></div>
                      <div><span className="text-slate-500">CIN :</span> <span className="font-mono">{emp?.cin}</span></div>
                      <div><span className="text-slate-500">N° CNSS :</span> <span className="font-mono">{emp?.numero_cnss}</span></div>
                    </div>
                    <div>
                      <div><span className="text-slate-500">Poste :</span> {emp?.poste}</div>
                      <div><span className="text-slate-500">Département :</span> {emp?.departement}</div>
                      <div><span className="text-slate-500">Contrat :</span> {emp?.type_contrat}</div>
                      <div><span className="text-slate-500">Mode :</span> {emp?.mode_paiement}</div>
                    </div>
                  </div>
                );
              })()}

              {/* Breakdown lines */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2">Désignation</th>
                    <th className="p-2 text-right">Base</th>
                    <th className="p-2 text-right">Taux</th>
                    <th className="p-2 text-right">Gains (DH)</th>
                    <th className="p-2 text-right">Retenues (DH)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="p-2 font-sans">Salaire de base</td>
                    <td className="p-2 text-right">{formatDH(activePayrollModal.salaire_brut)}</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatDH(activePayrollModal.salaire_brut)}</td>
                    <td className="p-2 text-right">-</td>
                  </tr>
                  {activePayrollModal.indemnites_deplacement > 0 && (
                    <tr>
                      <td className="p-2 font-sans">Indemnités de déplacement validées</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">{formatDH(activePayrollModal.indemnites_deplacement)}</td>
                      <td className="p-2 text-right">-</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2 font-sans">Cotisation CNSS Salariale (Plafond 6 000 DH)</td>
                    <td className="p-2 text-right">6 000,00</td>
                    <td className="p-2 text-right">4.48%</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatDH(activePayrollModal.cnss_salarie)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">Assurance Maladie Obligatoire (AMO)</td>
                    <td className="p-2 text-right">{formatDH(activePayrollModal.salaire_brut)}</td>
                    <td className="p-2 text-right">2.26%</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatDH(activePayrollModal.amo)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans">Impôt sur le Revenu (IR Net)</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">Barème</td>
                    <td className="p-2 text-right">-</td>
                    <td className="p-2 text-right">{formatDH(activePayrollModal.ir)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Net Box */}
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <span className="font-bold text-slate-900">NET À PAYER AU SALARIÉ :</span>
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
