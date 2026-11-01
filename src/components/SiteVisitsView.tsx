/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SiteVisit } from '../types';
import { formatDH } from '../utils/calculations';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileCheck2,
  Printer,
  X,
  CreditCard,
  Car,
} from 'lucide-react';

export const SiteVisitsView: React.FC = () => {
  const { siteVisits, clients, projects, employees, settings, validateSiteVisit, currentUser } = useApp();

  const [selectedVisitForBon, setSelectedVisitForBon] = useState<SiteVisit | null>(null);

  const canValidate = ['admin', 'comptable'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Déplacements & Frais de Mission</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          Module DP-1 à DP-7 · Validation des frais terrain, génération automatique des charges et bons d'intervention signés
        </div>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {siteVisits.map((visit) => {
          const client = clients.find((c) => c.id === visit.client_id);
          const project = projects.find((p) => p.id === visit.project_id);
          const emp = employees.find((e) => e.id === visit.employee_id);

          const totalFrais = (visit.expenses || []).reduce((sum, e) => sum + e.montant, 0);
          const allExpensesValidated = (visit.expenses || []).every((e) => e.statut === 'validé');

          return (
            <div key={visit.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm">
                      {visit.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{visit.motif}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Client : <strong>{client?.raison_sociale}</strong> ({client?.ville}) · Collaborateur : {emp?.prenom} {emp?.nom}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-md capitalize ${
                      visit.resultat === 'résolu'
                        ? 'bg-emerald-50 text-emerald-700'
                        : visit.resultat === 'partiel'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    Résultat : {visit.resultat}
                  </span>
                  <button
                    onClick={() => setSelectedVisitForBon(visit)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                  >
                    Bon d'intervention
                  </button>
                </div>
              </div>

              {/* Timing and Work done */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Horaires d'intervention</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {visit.heure_depart} → {visit.heure_arrivee} (Sur site) → {visit.heure_retour}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Facturation Client (DP-5)</span>
                  <span className="font-medium text-slate-800">
                    {visit.facturable ? `Facturable (${formatDH(visit.montant_facturable)})` : 'Inclus contrat maintenance'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Signature Client (DP-6)</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Capturée & certifiée</span>
                  </span>
                </div>
              </div>

              {/* Work performed */}
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-900">Travaux effectués sur place (DP-2) :</span>
                <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                  {visit.travail_effectue}
                </p>
              </div>

              {/* Expenses Breakdown & Validation (DP-3 & DP-4) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    Frais de Déplacement Engagés ({formatDH(totalFrais)})
                  </span>

                  {!allExpensesValidated && canValidate && (
                    <button
                      onClick={() => validateSiteVisit(visit.id)}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-xs transition-colors"
                      title="Valide les frais et crée automatiquement les écritures de charge (DP-4)"
                    >
                      Valider les frais & créer charges (DP-4)
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(visit.expenses || []).map((exp) => (
                    <div key={exp.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold capitalize text-slate-800">{exp.type}</span>
                        <div className="text-[10px] text-slate-400 font-mono">Justificatif fourni</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">{formatDH(exp.montant)}</div>
                        <span
                          className={`text-[10px] font-medium capitalize ${
                            exp.statut === 'validé' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {exp.statut}
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

      {/* Modal: Bon d'intervention PDF avec Signature Tactile (DP-6) */}
      {selectedVisitForBon && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto print-page">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <h3 className="text-sm font-bold text-slate-900">Bon d'Intervention Officiel (DP-6)</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs rounded-lg font-medium shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setSelectedVisitForBon(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs rounded-lg"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-5 border border-slate-200 rounded-lg text-xs space-y-4">
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
                    <div className="text-[11px] text-slate-500 font-mono">ICE : {settings.ice}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-900">BON D'INTERVENTION SITE</div>
                  <div className="font-mono text-slate-500">Réf : {selectedVisitForBon.id}</div>
                  <div className="text-slate-600">Date : {selectedVisitForBon.date}</div>
                </div>
              </div>

              {(() => {
                const client = clients.find((c) => c.id === selectedVisitForBon.client_id);
                const emp = employees.find((e) => e.id === selectedVisitForBon.employee_id);

                return (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md text-[11px]">
                    <div>
                      <div><span className="text-slate-500">Client :</span> <strong>{client?.raison_sociale}</strong></div>
                      <div><span className="text-slate-500">Adresse :</span> {client?.adresse}, {client?.ville}</div>
                      <div><span className="text-slate-500">Contact :</span> {client?.contact_nom} ({client?.telephone})</div>
                    </div>
                    <div>
                      <div><span className="text-slate-500">Intervenant :</span> <strong>{emp?.prenom} {emp?.nom}</strong></div>
                      <div><span className="text-slate-500">Poste :</span> {emp?.poste}</div>
                      <div><span className="text-slate-500">Créneau :</span> {selectedVisitForBon.heure_arrivee} à {selectedVisitForBon.heure_retour}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <span className="font-bold text-slate-900">Travaux et interventions techniques réalisés :</span>
                <p className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed text-[11px]">
                  {selectedVisitForBon.travail_effectue}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="p-3 bg-slate-50 rounded-lg text-[11px]">
                  <span className="font-bold text-slate-800 block mb-1">Visa de l'Intervenant :</span>
                  <div className="text-slate-500">Signé numériquement par l'équipe technique Atlas Tech</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-[11px]">
                  <span className="font-bold text-slate-800 block mb-1">Bon pour accord & Réception Client (DP-6) :</span>
                  {selectedVisitForBon.signature_client_url ? (
                    <div className="mt-2 bg-white p-2 rounded border border-slate-200 flex items-center justify-center">
                      <img
                        src={selectedVisitForBon.signature_client_url}
                        alt="Signature tactile client"
                        className="h-14 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-slate-400 italic py-3 text-center">Signature non renseignée</div>
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
