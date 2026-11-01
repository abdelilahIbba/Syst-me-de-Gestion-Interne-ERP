/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DailyReport } from '../types';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';

export const TeamReportsView: React.FC = () => {
  const { dailyReports, employees, clients, projects, validateDailyReport, currentUser } = useApp();

  const [selectedDate, setSelectedDate] = useState('2026-10-31');
  const [managerComments, setManagerComments] = useState<Record<string, string>>({});

  const activeEmployees = employees.filter((e) => e.statut === 'actif');

  const dayReports = dailyReports.filter((r) => r.date === selectedDate);
  const submittedEmpIds = new Set(dayReports.map((r) => r.employee_id));

  const submittedReports = dayReports;
  const missingEmployees = activeEmployees.filter((e) => !submittedEmpIds.has(e.id));

  const handleValidate = (repId: string) => {
    validateDailyReport(repId, managerComments[repId]);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Rapports de l'Équipe</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module RJ-5 & RJ-6 · Contrôle de soumission, validation managériale et commentaires
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Rapports Soumis</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{submittedReports.length}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Rapports Manquants (RJ-6)</div>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{missingEmployees.length}</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Taux de Complétude</div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
              {activeEmployees.length > 0
                ? Math.round((submittedReports.length / activeEmployees.length) * 100)
                : 0}
              %
            </div>
          </div>
          <Clock className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {/* Missing employees alert banner (RJ-6) */}
      {missingEmployees.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
          <div className="font-semibold text-rose-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Collaborateurs n'ayant pas encore soumis leur rapport pour le {selectedDate} :</span>
          </div>
          <div className="text-rose-800 pl-5">
            {missingEmployees.map((e) => `${e.prenom} ${e.nom} (${e.poste})`).join(' · ')}
          </div>
        </div>
      )}

      {/* Submitted Reports List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Rapports Soumis du Jour ({submittedReports.length})</h3>

        {submittedReports.map((rep) => {
          const emp = employees.find((e) => e.id === rep.employee_id);

          return (
            <div key={rep.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {emp?.prenom.charAt(0)}
                    {emp?.nom.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {emp?.prenom} {emp?.nom}
                    </h4>
                    <div className="text-xs text-slate-500">
                      {emp?.poste} · Lieu : <span className="capitalize font-medium text-slate-700">{rep.lieu}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    Total : <strong>{rep.heures_total} heures</strong>
                  </div>
                  <span
                    className={`font-semibold capitalize px-2.5 py-1 rounded-md ${
                      rep.statut === 'validé' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {rep.statut}
                  </span>
                </div>
              </div>

              {/* Tasks details */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Activités Réalisées :
                </span>
                <div className="divide-y divide-slate-100 bg-slate-50 rounded-lg p-3">
                  {(rep.tasks || []).map((t, idx) => {
                    const client = clients.find((c) => c.id === t.client_id);
                    const project = projects.find((p) => p.id === t.project_id);

                    return (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="font-medium text-slate-900">{t.description}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Client: <strong>{client?.raison_sociale || 'Interne'}</strong>
                            {project && ` · Projet: ${project.nom_systeme}`}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-800">{t.heures}h</span>
                          <span className="block text-[10px] text-slate-400 capitalize">{t.statut_tache}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Blocages & Tomorrow */}
              {(rep.blocages || rep.plan_demain) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {rep.blocages && (
                    <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                      <span className="font-semibold text-amber-900 block mb-0.5">Blocages signalés :</span>
                      <p className="text-amber-800 text-[11px]">{rep.blocages}</p>
                    </div>
                  )}
                  {rep.plan_demain && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-900 block mb-0.5">Plan pour demain :</span>
                      <p className="text-slate-600 text-[11px]">{rep.plan_demain}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manager validation & comment strip (RJ-5) */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex-1 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Commentaire du manager..."
                    defaultValue={rep.commentaire_manager || ''}
                    onChange={(e) => setManagerComments({ ...managerComments, [rep.id]: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>

                {rep.statut !== 'validé' ? (
                  <button
                    onClick={() => handleValidate(rep.id)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors shrink-0"
                  >
                    Valider le rapport (RJ-5)
                  </button>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validé par {rep.valide_par || 'Direction'}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {submittedReports.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            Aucun rapport soumis pour la date du {selectedDate}.
          </div>
        )}
      </div>
    </div>
  );
};
