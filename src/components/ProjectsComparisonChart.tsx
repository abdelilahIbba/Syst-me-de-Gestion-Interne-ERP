/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Project, Client, Invoice, Payment, DailyReport, SiteVisit, Employee } from '../types';
import { useI18n } from '../context/I18nContext';
import {
  calculateProjectsComparisonData,
  formatDH,
  ProjectComparisonItem,
} from '../utils/calculations';
import { BarChart3, TrendingUp, DollarSign, Briefcase, FolderGit2 } from 'lucide-react';

interface ProjectsComparisonChartProps {
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
  dailyReports: DailyReport[];
  siteVisits: SiteVisit[];
  employees: Employee[];
}

export const ProjectsComparisonChart: React.FC<ProjectsComparisonChartProps> = ({
  projects,
  clients,
  invoices,
  payments,
  dailyReports,
  siteVisits,
  employees,
}) => {
  const { t, dir } = useI18n();
  const [revenueBasis, setRevenueBasis] = useState<'encaisses' | 'contractuel'>('encaisses');

  const chartData: ProjectComparisonItem[] = useMemo(() => {
    return calculateProjectsComparisonData({
      projects,
      clients,
      invoices,
      payments,
      dailyReports,
      siteVisits,
      employees,
    });
  }, [projects, clients, invoices, payments, dailyReports, siteVisits, employees]);

  const totals = useMemo(() => {
    const rev = chartData.reduce(
      (sum, d) => sum + (revenueBasis === 'encaisses' ? d.revenusEncaisses : d.prixVenteHT),
      0
    );
    const charges = chartData.reduce((sum, d) => sum + d.chargesDirectes, 0);
    const labor = chartData.reduce((sum, d) => sum + d.coutMainOeuvre, 0);
    const travel = chartData.reduce((sum, d) => sum + d.fraisDeplacement, 0);
    const profit = rev - charges;
    const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;

    return { rev, charges, labor, travel, profit, margin };
  }, [chartData, revenueBasis]);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-5">
      {/* Header & Basis Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#070b18] text-cyan-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {t('chart.proj.title')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('chart.proj.subtitle')}
            </p>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setRevenueBasis('encaisses')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              revenueBasis === 'encaisses'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('chart.proj.basisCollected')}
          </button>
          <button
            type="button"
            onClick={() => setRevenueBasis('contractuel')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              revenueBasis === 'contractuel'
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('chart.proj.basisPriceHt')}
          </button>
        </div>
      </div>

      {/* Aggregate Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-1">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{revenueBasis === 'encaisses' ? t('chart.proj.totalCollected') : t('chart.proj.totalPriceHt')}</span>
            <DollarSign className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatDH(totals.rev)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{t('chart.proj.totalCharges')}</span>
            <Briefcase className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-base font-bold font-mono tabular-nums text-rose-700 mt-1">
            {formatDH(totals.charges)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-mono tabular-nums">
            {t('chart.proj.breakdown', { labor: formatDH(totals.labor), travel: formatDH(totals.travel) })}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{t('chart.proj.netMargin')}</span>
            <TrendingUp className={`w-3.5 h-3.5 ${totals.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div
            className={`text-base font-bold font-mono tabular-nums mt-1 ${
              totals.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatDH(totals.profit)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#070b18] text-white border border-slate-800">
          <div className="text-[11px] text-cyan-300 font-medium">{t('chart.proj.globalRate')}</div>
          <div className="text-lg font-bold font-mono tabular-nums text-cyan-400 mt-1">
            {totals.margin}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
            {t('chart.proj.shownCount', { count: chartData.length })}
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart or Empty State */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6">
          <FolderGit2 className="w-8 h-8 text-slate-400 mb-2" />
          <div className="text-xs font-semibold text-slate-700">{t('chart.proj.emptyTitle')}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {t('chart.proj.emptyDesc')}
          </div>
        </div>
      ) : (
        <div dir="ltr" className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              barGap={6}
            >
              <defs>
                <linearGradient id="projRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id="projChargeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.9} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="shortName"
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
              />

              <YAxis
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />

              <Tooltip
                cursor={{ fill: 'rgba(6, 182, 212, 0.06)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as ProjectComparisonItem;
                    const activeRev =
                      revenueBasis === 'encaisses' ? item.revenusEncaisses : item.prixVenteHT;
                    const activeProfit = activeRev - item.chargesDirectes;
                    const activeMargin = activeRev > 0 ? Math.round((activeProfit / activeRev) * 100) : 0;

                    return (
                      <div
                        dir={dir}
                        className="bg-[#070b18]/95 backdrop-blur-md text-white border border-cyan-500/30 rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[240px]"
                      >
                        <div className="border-b border-slate-800 pb-2">
                          <div className="font-bold text-cyan-300 leading-snug">{item.nom}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.clientName}</div>
                        </div>

                        <div className="space-y-1 font-mono tabular-nums text-[11px]">
                          <div className="flex justify-between items-center text-cyan-300">
                            <span className="font-sans text-slate-300">{t('chart.proj.tooltipCollected')}</span>
                            <span className="font-bold">{formatDH(item.revenusEncaisses)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sky-300">
                            <span className="font-sans text-slate-300">{t('chart.proj.tooltipPriceHt')}</span>
                            <span className="font-semibold">{formatDH(item.prixVenteHT)}</span>
                          </div>

                          <div className="flex justify-between items-center text-rose-300 pt-1">
                            <span className="font-sans text-slate-300">{t('chart.proj.tooltipCharges')}</span>
                            <span className="font-bold">{formatDH(item.chargesDirectes)}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 ps-2 space-y-0.5 border-s border-slate-700">
                            <div className="flex justify-between">
                              <span>{t('chart.proj.tooltipLabor', { hours: item.totalHours })}</span>
                              <span>{formatDH(item.coutMainOeuvre)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('chart.proj.tooltipTravel')}</span>
                              <span>{formatDH(item.fraisDeplacement)}</span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center font-bold">
                            <span className="font-sans text-slate-300">{t('chart.proj.tooltipNetMargin')}</span>
                            <span className={activeProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {formatDH(activeProfit)} ({activeMargin}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 500 }}
              />

              <Bar
                dataKey={revenueBasis === 'encaisses' ? 'revenusEncaisses' : 'prixVenteHT'}
                name={revenueBasis === 'encaisses' ? t('chart.proj.legendCollected') : t('chart.proj.legendPriceHt')}
                fill="url(#projRevGrad)"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
              <Bar
                dataKey="chargesDirectes"
                name={t('chart.proj.legendCharges')}
                fill="url(#projChargeGrad)"
                radius={[4, 4, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
