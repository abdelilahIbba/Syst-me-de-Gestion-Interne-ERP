/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { DailyReport, TaskStatus, WorkLocation } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Calendar,
} from 'lucide-react';

export const TeamReportsView: React.FC = () => {
  const { dailyReports, employees, clients, projects, validateDailyReport } = useApp();
  const { t } = useI18n();

  const [selectedDate, setSelectedDate] = useState('2026-10-31');
  const [managerComments, setManagerComments] = useState<Record<string, string>>({});

  const activeEmployees = employees.filter((e) => e.statut === 'actif');

  const dayReports = dailyReports.filter((r) => r.date === selectedDate);
  const submittedEmpIds = new Set(dayReports.map((r) => r.employee_id));

  const submittedReports = dayReports;
  const missingEmployees = activeEmployees.filter((e) => !submittedEmpIds.has(e.id));

  const translateWorkLocation = (loc: WorkLocation) => {
    if (loc === 'télétravail') return t('daily.loc.remote');
    if (loc === 'chez client') return t('daily.loc.client');
    return t('daily.loc.office');
  };

  const translateReportStatus = (st: DailyReport['statut']) => {
    if (st === 'validé') return t('team.status.validé');
    if (st === 'soumis') return t('team.status.soumis');
    return t('team.status.brouillon');
  };

  const translateTaskStatus = (st: TaskStatus) => {
    if (st === 'terminée') return t('daily.taskStatus.terminée');
    if (st === 'en cours') return t('daily.taskStatus.en cours');
    return t('daily.taskStatus.bloquée');
  };

  const handleValidate = (repId: string) => {
    validateDailyReport(repId, managerComments[repId]);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('team.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('team.subtitle')}
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F1F5FB] border border-[#D1DFEE] rounded-xl px-3 py-1.5 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-mono font-semibold text-[#0D1B38] focus:outline-hidden"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F1F5FB] p-4 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#546A8E] font-medium">{t('team.kpi.submitted')}</div>
            <div className="text-2xl font-bold font-mono text-[#0E6245] mt-1">{submittedReports.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCF4E8] text-[#0E6245] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#F1F5FB] p-4 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#546A8E] font-medium">{t('team.kpi.missing')}</div>
            <div className="text-2xl font-bold font-mono text-[#9F1239] mt-1">{missingEmployees.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FCE8EC] text-[#9F1239] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#F1F5FB] p-4 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[#546A8E] font-medium">{t('team.kpi.completion')}</div>
            <div className="text-2xl font-bold font-mono text-[#0284C7] mt-1">
              {activeEmployees.length > 0
                ? Math.round((submittedReports.length / activeEmployees.length) * 100)
                : 0}
              %
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DFF0FC] text-[#0284C7] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Missing employees alert banner (RJ-6) */}
      {missingEmployees.length > 0 && (
        <div className="p-4 bg-[#FCE8EC] border border-[#F3BCC8] rounded-2xl text-xs space-y-1">
          <div className="font-semibold text-[#9F1239] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#9F1239] shrink-0" />
            <span>{t('team.missingAlert', { date: selectedDate })}</span>
          </div>
          <div className="text-[#9F1239]/90 ps-5">
            {missingEmployees.map((e) => `${e.prenom} ${e.nom} (${e.poste})`).join(' · ')}
          </div>
        </div>
      )}

      {/* Submitted Reports List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#0D1B38]">{t('team.submittedHeading', { count: submittedReports.length })}</h3>

        {submittedReports.map((rep) => {
          const emp = employees.find((e) => e.id === rep.employee_id);

          return (
            <div key={rep.id} className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCE6F3]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0B1733] text-[#7DD3FC] flex items-center justify-center font-bold text-xs shrink-0">
                    {emp?.prenom.charAt(0)}
                    {emp?.nom.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#0D1B38] text-sm truncate">
                      {emp?.prenom} {emp?.nom}
                    </h4>
                    <div className="text-xs text-[#546A8E]">
                      {emp?.poste} · {t('team.locationLabel')} <span className="font-medium text-[#1C2E4F]">{translateWorkLocation(rep.lieu)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                  <div className="font-mono bg-[#E6EEF8] px-2.5 py-1 rounded-lg border border-[#C9D9EC] text-[#0D1B38] font-semibold">
                    {t('team.totalHoursBadge', { hours: rep.heures_total })}
                  </div>
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-lg border ${
                      rep.statut === 'validé' ? 'bg-[#DCF4E8] text-[#0E6245] border-[#A7DFC3]' : 'bg-[#FEF3D6] text-[#8F5600] border-[#F2D388]'
                    }`}
                  >
                    {translateReportStatus(rep.statut)}
                  </span>
                </div>
              </div>

              {/* Tasks details */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#546A8E] uppercase tracking-wider">
                  {t('team.activities')}
                </span>
                <div className="divide-y divide-[#DCE6F3] bg-[#E6EEF8] border border-[#D5E2F1] rounded-xl p-3">
                  {(rep.tasks || []).map((taskItem, idx) => {
                    const client = clients.find((c) => c.id === taskItem.client_id);
                    const project = projects.find((p) => p.id === taskItem.project_id);

                    return (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="font-medium text-[#0D1B38]">{taskItem.description}</div>
                          <div className="text-[11px] text-[#546A8E] mt-0.5">
                            {t('common.client')}: <strong className="text-[#1C2E4F]">{client?.raison_sociale || t('team.internal')}</strong>
                            {project && ` · ${t('common.project')}: ${project.nom_systeme}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:block text-start sm:text-end shrink-0">
                          <span className="font-mono font-bold text-[#0D1B38]">{taskItem.heures}{t('common.hours')}</span>
                          <span className="sm:block text-[10px] text-[#546A8E]">{translateTaskStatus(taskItem.statut_tache)}</span>
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
                    <div className="p-3 bg-[#FEF3D6]/85 rounded-xl border border-[#F2D388]">
                      <span className="font-semibold text-[#8F5600] block mb-0.5">{t('team.blockers')}</span>
                      <p className="text-[#784700] text-[11px]">{rep.blocages}</p>
                    </div>
                  )}
                  {rep.plan_demain && (
                    <div className="p-3 bg-[#E6EEF8] rounded-xl border border-[#D5E2F1]">
                      <span className="font-semibold text-[#0D1B38] block mb-0.5">{t('team.planTomorrow')}</span>
                      <p className="text-[#3C5073] text-[11px]">{rep.plan_demain}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manager validation & comment strip (RJ-5) */}
              <div className="pt-3 border-t border-[#DCE6F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex-1 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#647BA0] shrink-0" />
                  <input
                    type="text"
                    placeholder={t('team.commentPlaceholder')}
                    defaultValue={rep.commentaire_manager || ''}
                    onChange={(e) => setManagerComments({ ...managerComments, [rep.id]: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-xs text-[#0D1B38] placeholder:text-[#647BA0] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>

                {rep.statut !== 'validé' ? (
                  <button
                    onClick={() => handleValidate(rep.id)}
                    className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white font-semibold rounded-xl shadow-xs transition-all shrink-0 whitespace-nowrap"
                  >
                    {t('team.validateBtn')}
                  </button>
                ) : (
                  <span className="text-[#0E6245] font-semibold flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('team.validatedBy', { name: rep.valide_par || 'Admin' })}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {submittedReports.length === 0 && (
          <div className="p-12 text-center bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] text-[#546A8E] text-xs">
            {t('team.noReports', { date: selectedDate })}
          </div>
        )}
      </div>
    </div>
  );
};
