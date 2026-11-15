/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { round2 } from '../utils/calculations';
import {
  Download,
  Calendar,
  Building2,
  Users,
  FolderGit2,
} from 'lucide-react';

export const ReportsExportsView: React.FC = () => {
  const { dailyReports, employees, clients, projects } = useApp();
  const { t } = useI18n();

  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  // Filter tasks in this month
  const monthReports = dailyReports.filter((r) => r.date.startsWith(selectedMonth));

  // 1. By Employee
  const employeeHoursMap = new Map<string, { totalHours: number; countReports: number }>();
  monthReports.forEach((rep) => {
    const cur = employeeHoursMap.get(rep.employee_id) || { totalHours: 0, countReports: 0 };
    employeeHoursMap.set(rep.employee_id, {
      totalHours: round2(cur.totalHours + rep.heures_total),
      countReports: cur.countReports + 1,
    });
  });

  // 2. By Client
  const clientHoursMap = new Map<string, number>();
  monthReports.forEach((rep) => {
    (rep.tasks || []).forEach((taskItem) => {
      if (taskItem.client_id) {
        const cur = clientHoursMap.get(taskItem.client_id) || 0;
        clientHoursMap.set(taskItem.client_id, round2(cur + taskItem.heures));
      }
    });
  });

  // 3. By Project
  const projectHoursMap = new Map<string, number>();
  monthReports.forEach((rep) => {
    (rep.tasks || []).forEach((taskItem) => {
      if (taskItem.project_id) {
        const cur = projectHoursMap.get(taskItem.project_id) || 0;
        projectHoursMap.set(taskItem.project_id, round2(cur + taskItem.heures));
      }
    });
  });

  const exportMonthCSV = () => {
    const headers = ['Date', 'Employé', 'Lieu', 'Client', 'Projet', 'Description', 'Heures', 'Statut Tâche'];
    const rows: string[][] = [];

    monthReports.forEach((rep) => {
      const emp = employees.find((e) => e.id === rep.employee_id);
      (rep.tasks || []).forEach((taskItem) => {
        const cl = clients.find((c) => c.id === taskItem.client_id);
        const pr = projects.find((p) => p.id === taskItem.project_id);
        rows.push([
          rep.date,
          emp ? `${emp.prenom} ${emp.nom}` : rep.employee_id,
          rep.lieu,
          cl ? cl.raison_sociale : 'Interne',
          pr ? pr.nom_systeme : 'Divers',
          `"${taskItem.description.replace(/"/g, '""')}"`,
          String(taskItem.heures),
          taskItem.statut_tache,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recapitulatif_activite_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('exports.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('exports.subtitle')}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F1F5FB] border border-[#D1DFEE] rounded-xl px-3 py-2 shadow-xs flex-1 sm:flex-none min-w-0">
            <Calendar className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs font-semibold text-[#0D1B38] bg-transparent focus:outline-hidden"
            >
              <option value="2026-11">{t('payroll.month.2026-11')}</option>
              <option value="2026-10">{t('payroll.month.2026-10')}</option>
              <option value="2026-09">{t('payroll.month.2026-09')}</option>
            </select>
          </div>

          <button
            onClick={exportMonthCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-xl shadow-[0_6px_16px_-4px_rgba(2,132,199,0.4)] transition-all whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{t('exports.exportMonthBtn', { month: selectedMonth })}</span>
          </button>
        </div>
      </div>

      {/* 3 Analytics Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Table 1: By Employee */}
        <div className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#DCE6F3] font-bold text-[#0D1B38] text-xs">
            <Users className="w-4 h-4 text-[#0284C7] shrink-0" />
            <span>{t('exports.byEmployee')}</span>
          </div>

          <div className="divide-y divide-[#DCE6F3] max-h-80 overflow-y-auto">
            {employees.map((emp) => {
              const data = employeeHoursMap.get(emp.id) || { totalHours: 0, countReports: 0 };
              return (
                <div key={emp.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#0D1B38] truncate">{emp.prenom} {emp.nom}</div>
                    <div className="text-[11px] text-[#546A8E]">{t('exports.reportsCount', { count: data.countReports })}</div>
                  </div>
                  <span className="font-mono font-bold text-[#0284C7] shrink-0">{data.totalHours} {t('common.hours')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table 2: By Client */}
        <div className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#DCE6F3] font-bold text-[#0D1B38] text-xs">
            <Building2 className="w-4 h-4 text-[#0E6245] shrink-0" />
            <span>{t('exports.byClient')}</span>
          </div>

          <div className="divide-y divide-[#DCE6F3] max-h-80 overflow-y-auto">
            {clients.map((cli) => {
              const hours = clientHoursMap.get(cli.id) || 0;
              return (
                <div key={cli.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#0D1B38] truncate">{cli.raison_sociale}</div>
                    <div className="text-[11px] text-[#546A8E] truncate">{cli.ville}</div>
                  </div>
                  <span className="font-mono font-bold text-[#0E6245] shrink-0">{hours} {t('common.hours')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table 3: By Project */}
        <div className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[#DCE6F3] font-bold text-[#0D1B38] text-xs">
            <FolderGit2 className="w-4 h-4 text-[#5B35B5] shrink-0" />
            <span>{t('exports.byProject')}</span>
          </div>

          <div className="divide-y divide-[#DCE6F3] max-h-80 overflow-y-auto">
            {projects.map((proj) => {
              const hours = projectHoursMap.get(proj.id) || 0;
              return (
                <div key={proj.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#0D1B38] truncate">{proj.nom_systeme}</div>
                    <div className="text-[11px] text-[#546A8E] capitalize truncate">{proj.type}</div>
                  </div>
                  <span className="font-mono font-bold text-[#5B35B5] shrink-0">{hours} {t('common.hours')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
