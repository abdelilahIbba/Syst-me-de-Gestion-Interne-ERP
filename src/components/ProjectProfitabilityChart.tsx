/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Project, Invoice, Payment, DailyReport, SiteVisit, Employee } from '../types';
import { useI18n } from '../context/I18nContext';
import {
  calculateMonthlyProjectProfitability,
  formatDH,
  MonthlyProjectProfitability,
} from '../utils/calculations';
import {
  TrendingUp,
  FolderGit2,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';

interface ProjectProfitabilityChartProps {
  projects: Project[];
  invoices: Invoice[];
  payments: Payment[];
  dailyReports: DailyReport[];
  siteVisits: SiteVisit[];
  employees: Employee[];
  onNavigateToProjects?: () => void;
}

export const ProjectProfitabilityChart: React.FC<ProjectProfitabilityChartProps> = ({
  projects,
  invoices,
  payments,
  dailyReports,
  siteVisits,
  employees,
  onNavigateToProjects,
}) => {
  const { t, tMonth, dir } = useI18n();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [chartMode, setChartMode] = useState<'mixed' | 'profit_only'>('mixed');

  // Compute monthly data with localized month labels
  const monthlyData: MonthlyProjectProfitability[] = useMemo(() => {
    const raw = calculateMonthlyProjectProfitability({
      projectId: selectedProjectId,
      projects,
      invoices,
      payments,
      dailyReports,
      siteVisits,
      employees,
      targetYear: '2026',
    });
    return raw.map((d) => ({
      ...d,
      monthLabel: tMonth(d.month.split('-')[1] || '01'),
    }));
  }, [selectedProjectId, projects, invoices, payments, dailyReports, siteVisits, employees, tMonth]);

  // Aggregate totals for the selected project filter
  const totals = useMemo(() => {
    const totalRev = monthlyData.reduce((acc, d) => acc + d.revenus, 0);
    const totalCost = monthlyData.reduce((acc, d) => acc + d.couts, 0);
    const totalLabor = monthlyData.reduce((acc, d) => acc + d.coutsMainOeuvre, 0);
    const totalTravel = monthlyData.reduce((acc, d) => acc + d.coutsDeplacement, 0);
    const totalProfit = totalRev - totalCost;
    const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;
    const totalHours = monthlyData.reduce((acc, d) => acc + d.heuresProd, 0);

    return {
      totalRev,
      totalCost,
      totalLabor,
      totalTravel,
      totalProfit,
      avgMargin,
      totalHours,
    };
  }, [monthlyData]);

  const activeProject = selectedProjectId !== 'all'
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  return (
    <div className="ios-card p-3.5 sm:p-5 space-y-4 sm:space-y-5">
      {/* Header and Project Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[#DAE5F2]">
        <div>
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#DFF0FC] border border-[#A5D3F3] flex items-center justify-center text-[#0284C7] shrink-0 mt-0.5 sm:mt-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#0D1B38] tracking-[-0.02em] flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>{t('chart.monthly.title')}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#DFF0FC] text-[#0369A1] border border-[#A5D3F3] whitespace-nowrap">
                  {t('chart.monthly.badge')}
                </span>
              </h3>
              <p className="text-xs text-[#546A8E] mt-0.5">
                {t('chart.monthly.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
          {/* Project Selector Dropdown */}
          <div className="flex items-center gap-1.5 ios-input px-3 py-1.5 min-h-[38px] shadow-2xs w-full sm:w-auto">
            <FolderGit2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-semibold text-[#0D1B38] bg-transparent focus:outline-hidden flex-1 sm:max-w-[220px] truncate"
            >
              <option value="all">{t('chart.monthly.allProjects')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom_systeme}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 sm:flex items-center ios-segmented text-xs font-medium w-full sm:w-auto">
            <button
              onClick={() => setChartMode('mixed')}
              className={`px-3 py-1.5 sm:py-1 transition-all duration-150 active:scale-[0.96] text-center ${
                chartMode === 'mixed'
                  ? 'ios-segmented-active'
                  : 'text-[#4B6187] hover:text-[#0D1B38] rounded-[10px]'
              }`}
            >
              {t('chart.monthly.modeMixed')}
            </button>
            <button
              onClick={() => setChartMode('profit_only')}
              className={`px-3 py-1.5 sm:py-1 transition-all duration-150 active:scale-[0.96] text-center ${
                chartMode === 'profit_only'
                  ? 'ios-segmented-active'
                  : 'text-[#4B6187] hover:text-[#0D1B38] rounded-[10px]'
              }`}
            >
              {t('chart.monthly.modeProfit')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip for Selected Project / Global Scope */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ios-well p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#546A8E] font-medium mb-1">
            <span>{t('chart.monthly.collectedRev')}</span>
            <DollarSign className="w-3.5 h-3.5 text-[#0E6245]" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#0D1B38]">
            {formatDH(totals.totalRev)}
          </div>
          <div className="text-[10px] text-[#5F7394] mt-1">{t('chart.monthly.collectedRevSub')}</div>
        </div>

        <div className="ios-well p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#546A8E] font-medium mb-1">
            <span>{t('chart.monthly.prodCosts')}</span>
            <Briefcase className="w-3.5 h-3.5 text-[#9F1239]" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#0D1B38]">
            {formatDH(totals.totalCost)}
          </div>
          <div className="text-[10px] text-[#5F7394] mt-1">
            {t('chart.monthly.laborShort')} {formatDH(totals.totalLabor)} ({totals.totalHours}{t('common.hours')})
          </div>
        </div>

        <div className="ios-well p-3.5">
          <div className="flex items-center justify-between text-[11px] text-[#546A8E] font-medium mb-1">
            <span>{t('chart.monthly.netProfit')}</span>
            <TrendingUp className={`w-3.5 h-3.5 ${totals.totalProfit >= 0 ? 'text-[#0284C7]' : 'text-[#9F1239]'}`} />
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-mono ${
              totals.totalProfit >= 0 ? 'text-[#0369A1]' : 'text-[#9F1239]'
            }`}
          >
            {formatDH(totals.totalProfit)}
          </div>
          <div className="text-[10px] text-[#5F7394] mt-1">{t('chart.monthly.netProfitSub')}</div>
        </div>

        <div className="bg-gradient-to-b from-[#132550] to-[#0B1733] p-3.5 rounded-[16px] border border-[#1E3B75] text-[#F4F8FD] shadow-[0_6px_18px_-6px_rgba(11,23,51,0.35),inset_0_1px_0_rgba(125,211,252,0.16)]">
          <div className="flex items-center justify-between text-[11px] text-[#7DD3FC] font-medium mb-1">
            <span>{t('chart.monthly.avgMargin')}</span>
            <span className="text-[10px] bg-[#0284C7]/30 px-1.5 py-0.5 rounded-full text-[#BAE6FD] font-mono">
              2026
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#38BDF8] flex items-center gap-1">
            <span>{totals.avgMargin}%</span>
            <ArrowUpRight className="w-4 h-4 text-[#7DD3FC]" />
          </div>
          <div className="text-[10px] text-[#B8CBE6] mt-1">{t('chart.monthly.opProfitability')}</div>
        </div>
      </div>

      {/* Main Recharts Visual Display */}
      <div dir="ltr" className="h-64 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={monthlyData}
            margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.95} />
                <stop offset="95%" stopColor="#0284C7" stopOpacity={0.92} />
              </linearGradient>
              <linearGradient id="colorCouts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#E11D48" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D5E2F1" />

            <XAxis
              dataKey="monthLabel"
              axisLine={{ stroke: '#C9D9EC' }}
              tickLine={false}
              tick={{ fill: '#475E82', fontSize: 10, fontWeight: 500 }}
            />

            <YAxis
              yAxisId="left"
              width={40}
              axisLine={{ stroke: '#C9D9EC' }}
              tickLine={false}
              tick={{ fill: '#546A8E', fontSize: 10 }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />

            {chartMode === 'mixed' && (
              <YAxis
                yAxisId="right"
                width={34}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#0284C7', fontSize: 10, fontWeight: 600 }}
                tickFormatter={(val) => `${val}%`}
                domain={[0, 100]}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as MonthlyProjectProfitability;
                  return (
                    <div
                      dir={dir}
                      className="bg-[#0B1733]/95 backdrop-blur-md text-[#F4F8FD] border border-[#38BDF8]/35 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 min-w-[185px] sm:min-w-[210px] max-w-[calc(100vw-32px)]"
                    >
                      <div className="font-bold text-[#F4F8FD] flex items-center justify-between border-b border-[#1E3669] pb-1.5">
                        <span className="text-[#7DD3FC] font-semibold">{data.monthLabel} 2026</span>
                        <span className="text-[10px] text-[#90A8CE] font-mono">{data.month}</span>
                      </div>

                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between items-center text-[#7DD3FC]">
                          <span className="text-[#C6D5EC] font-sans">{t('chart.monthly.tooltipRev')}</span>
                          <span className="font-bold">{formatDH(data.revenus)}</span>
                        </div>

                        <div className="flex justify-between items-center text-rose-300">
                          <span className="text-[#C6D5EC] font-sans">{t('chart.monthly.tooltipCost')}</span>
                          <span className="font-bold">{formatDH(data.couts)}</span>
                        </div>

                        <div className="text-[10px] text-[#90A8CE] ps-2 space-y-0.5 border-s border-[#26427A]">
                          <div className="flex justify-between">
                            <span>{t('chart.monthly.tooltipLabor')}</span>
                            <span>{formatDH(data.coutsMainOeuvre)} ({data.heuresProd}{t('common.hours')})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('chart.monthly.tooltipTravel')}</span>
                            <span>{formatDH(data.coutsDeplacement)}</span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-[#1E3669] flex justify-between items-center text-emerald-400 font-bold">
                          <span className="text-[#C6D5EC] font-sans">{t('chart.monthly.tooltipProfit')}</span>
                          <span>{formatDH(data.beneficeNet)}</span>
                        </div>

                        <div className="flex justify-between items-center text-[#BAE6FD] font-semibold pt-0.5">
                          <span className="text-[#C6D5EC] font-sans">{t('chart.monthly.tooltipMargin')}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#0C3559]/80 border border-[#38BDF8]/40 text-[10px]">
                            {data.tauxMarge}%
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

            {chartMode === 'mixed' ? (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="revenus"
                  name={t('chart.monthly.legendRev')}
                  fill="url(#colorRevenus)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  yAxisId="left"
                  dataKey="couts"
                  name={t('chart.monthly.legendCost')}
                  fill="url(#colorCouts)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tauxMarge"
                  name={t('chart.monthly.legendMargin')}
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#22D3EE', strokeWidth: 1.5, stroke: '#0B1733' }}
                  activeDot={{ r: 5, fill: '#22D3EE', stroke: '#0B1733', strokeWidth: 2 }}
                />
              </>
            ) : (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="beneficeNet"
                  name={t('chart.monthly.legendProfit')}
                  fill="url(#colorBenefice)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="couts"
                  name={t('chart.monthly.legendCommitted')}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Insight Strip */}
      <div className="pt-3 border-t border-[#DAE5F2] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#546A8E] gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
          <span>
            {activeProject ? (
              <span>
                {t('chart.monthly.filteredFor')}{' '}
                <strong className="text-[#0D1B38] font-semibold">{activeProject.nom_systeme}</strong>
              </span>
            ) : (
              <span>{t('chart.monthly.consolidatedFor', { count: projects.length })}</span>
            )}
          </span>
        </div>

        {onNavigateToProjects && (
          <button
            onClick={onNavigateToProjects}
            className="px-3 py-1 ios-btn-tinted rounded-full text-xs flex items-center gap-1 active:scale-[0.96]"
          >
            <span>{t('chart.monthly.goToProjects')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
