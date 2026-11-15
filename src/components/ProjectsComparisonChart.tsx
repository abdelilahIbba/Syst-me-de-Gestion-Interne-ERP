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
    <div className="ios-card p-3.5 sm:p-5 space-y-4 sm:space-y-5">
      {/* Header & Basis Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[#DAE5F2]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[12px] bg-[#0B1733] text-[#38BDF8] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(11,23,51,0.22)]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#0D1B38] tracking-[-0.02em]">
              {t('chart.proj.title')}
            </h3>
            <p className="text-xs text-[#546A8E] mt-0.5">
              {t('chart.proj.subtitle')}
            </p>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-2 sm:flex items-center ios-segmented text-xs font-medium shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setRevenueBasis('encaisses')}
            className={`px-2.5 sm:px-3 py-1.5 transition-all duration-150 active:scale-[0.96] text-center whitespace-nowrap truncate ${
              revenueBasis === 'encaisses'
                ? 'ios-segmented-active'
                : 'text-[#4B6187] hover:text-[#0D1B38] rounded-[10px]'
            }`}
          >
            {t('chart.proj.basisCollected')}
          </button>
          <button
            type="button"
            onClick={() => setRevenueBasis('contractuel')}
            className={`px-2.5 sm:px-3 py-1.5 transition-all duration-150 active:scale-[0.96] text-center whitespace-nowrap truncate ${
              revenueBasis === 'contractuel'
                ? 'ios-segmented-active'
                : 'text-[#4B6187] hover:text-[#0D1B38] rounded-[10px]'
            }`}
          >
            {t('chart.proj.basisPriceHt')}
          </button>
        </div>
      </div>

      {/* Aggregate Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pb-1">
        <div className="p-3.5 ios-well min-w-0">
          <div className="flex items-center justify-between text-[11px] text-[#546A8E] font-medium gap-1">
            <span className="truncate">{revenueBasis === 'encaisses' ? t('chart.proj.totalCollected') : t('chart.proj.totalPriceHt')}</span>
            <DollarSign className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
          </div>
          <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-[#0D1B38] mt-1 truncate">
            {formatDH(totals.rev)}
          </div>
        </div>

        <div className="p-3.5 ios-well">
          <div className="flex items-center justify-between text-[11px] text-[#546A8E] font-medium">
            <span>{t('chart.proj.totalCharges')}</span>
            <Briefcase className="w-3.5 h-3.5 text-[#9F1239]" />
          </div>
          <div className="text-base font-bold font-mono tabular-nums text-[#9F1239] mt-1">
            {formatDH(totals.charges)}
          </div>
          <div className="text-[10px] text-[#5F7394] mt-0.5 font-mono tabular-nums">
            {t('chart.proj.breakdown', { labor: formatDH(totals.labor), travel: formatDH(totals.travel) })}
          </div>
        </div>

        <div className="p-3.5 ios-well">
          <div className="flex items-center justify-between text-[11px] text-[#546A8E] font-medium">
            <span>{t('chart.proj.netMargin')}</span>
            <TrendingUp className={`w-3.5 h-3.5 ${totals.profit >= 0 ? 'text-[#0E6245]' : 'text-[#9F1239]'}`} />
          </div>
          <div
            className={`text-base font-bold font-mono tabular-nums mt-1 ${
              totals.profit >= 0 ? 'text-[#0E6245]' : 'text-[#9F1239]'
            }`}
          >
            {formatDH(totals.profit)}
          </div>
        </div>

        <div className="p-3.5 rounded-[16px] bg-gradient-to-b from-[#132550] to-[#0B1733] text-[#F4F8FD] border border-[#1E3B75] shadow-[0_6px_18px_-6px_rgba(11,23,51,0.35),inset_0_1px_0_rgba(125,211,252,0.16)]">
          <div className="text-[11px] text-[#7DD3FC] font-medium">{t('chart.proj.globalRate')}</div>
          <div className="text-lg font-bold font-mono tabular-nums text-[#38BDF8] mt-1">
            {totals.margin}%
          </div>
          <div className="text-[10px] text-[#B8CBE6] mt-0.5 tabular-nums">
            {t('chart.proj.shownCount', { count: chartData.length })}
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart or Empty State */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center border border-dashed border-[#B7CAE2] rounded-[18px] bg-[#E5EDF8]/65 p-6">
          <FolderGit2 className="w-8 h-8 text-[#627799] mb-2" />
          <div className="text-xs font-semibold text-[#273B63]">{t('chart.proj.emptyTitle')}</div>
          <div className="text-[11px] text-[#5F7394] mt-1">
            {t('chart.proj.emptyDesc')}
          </div>
        </div>
      ) : (
        <div dir="ltr" className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 6, left: -12, bottom: 5 }}
              barGap={4}
            >
              <defs>
                <linearGradient id="projRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.95} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id="projChargeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#E11D48" stopOpacity={0.9} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D5E2F1" />

              <XAxis
                dataKey="shortName"
                axisLine={{ stroke: '#C9D9EC' }}
                tickLine={false}
                interval={0}
                tick={{ fill: '#3B4F73', fontSize: 10, fontWeight: 500 }}
              />

              <YAxis
                width={40}
                axisLine={{ stroke: '#C9D9EC' }}
                tickLine={false}
                tick={{ fill: '#546A8E', fontSize: 10 }}
                tickFormatter={(val) => `${Math.round(val / 1000)}k`}
              />

              <Tooltip
                cursor={{ fill: 'rgba(2, 132, 199, 0.08)' }}
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
                        className="bg-[#0B1733]/95 backdrop-blur-md text-[#F4F8FD] border border-[#38BDF8]/35 rounded-2xl p-3 sm:p-3.5 shadow-xl text-xs space-y-2 min-w-[200px] sm:min-w-[240px] max-w-[calc(100vw-32px)]"
                      >
                        <div className="border-b border-[#1E3669] pb-2">
                          <div className="font-bold text-[#7DD3FC] leading-snug">{item.nom}</div>
                          <div className="text-[11px] text-[#90A8CE] mt-0.5">{item.clientName}</div>
                        </div>

                        <div className="space-y-1 font-mono tabular-nums text-[11px]">
                          <div className="flex justify-between items-center text-[#7DD3FC]">
                            <span className="font-sans text-[#C6D5EC]">{t('chart.proj.tooltipCollected')}</span>
                            <span className="font-bold">{formatDH(item.revenusEncaisses)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#BAE6FD]">
                            <span className="font-sans text-[#C6D5EC]">{t('chart.proj.tooltipPriceHt')}</span>
                            <span className="font-semibold">{formatDH(item.prixVenteHT)}</span>
                          </div>

                          <div className="flex justify-between items-center text-rose-300 pt-1">
                            <span className="font-sans text-[#C6D5EC]">{t('chart.proj.tooltipCharges')}</span>
                            <span className="font-bold">{formatDH(item.chargesDirectes)}</span>
                          </div>
                          <div className="text-[10px] text-[#90A8CE] ps-2 space-y-0.5 border-s border-[#26427A]">
                            <div className="flex justify-between">
                              <span>{t('chart.proj.tooltipLabor', { hours: item.totalHours })}</span>
                              <span>{formatDH(item.coutMainOeuvre)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t('chart.proj.tooltipTravel')}</span>
                              <span>{formatDH(item.fraisDeplacement)}</span>
                            </div>
                          </div>

                          <div className="pt-1.5 border-t border-[#1E3669] flex justify-between items-center font-bold">
                            <span className="font-sans text-[#C6D5EC]">{t('chart.proj.tooltipNetMargin')}</span>
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
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 500, color: '#2B4068' }}
              />

              <Bar
                dataKey={revenueBasis === 'encaisses' ? 'revenusEncaisses' : 'prixVenteHT'}
                name={revenueBasis === 'encaisses' ? t('chart.proj.legendCollected') : t('chart.proj.legendPriceHt')}
                fill="url(#projRevGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />
              <Bar
                dataKey="chargesDirectes"
                name={t('chart.proj.legendCharges')}
                fill="url(#projChargeGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
