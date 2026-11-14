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
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      {/* Header and Project Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{t('chart.monthly.title')}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {t('chart.monthly.badge')}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('chart.monthly.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden max-w-[220px] truncate"
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
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setChartMode('mixed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMode === 'mixed'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('chart.monthly.modeMixed')}
            </button>
            <button
              onClick={() => setChartMode('profit_only')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMode === 'profit_only'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('chart.monthly.modeProfit')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip for Selected Project / Global Scope */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
            <span>{t('chart.monthly.collectedRev')}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900">
            {formatDH(totals.totalRev)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{t('chart.monthly.collectedRevSub')}</div>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
            <span>{t('chart.monthly.prodCosts')}</span>
            <Briefcase className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900">
            {formatDH(totals.totalCost)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {t('chart.monthly.laborShort')} {formatDH(totals.totalLabor)} ({totals.totalHours}{t('common.hours')})
          </div>
        </div>

        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
            <span>{t('chart.monthly.netProfit')}</span>
            <TrendingUp className={`w-3.5 h-3.5 ${totals.totalProfit >= 0 ? 'text-cyan-600' : 'text-rose-600'}`} />
          </div>
          <div
            className={`text-base sm:text-lg font-bold font-mono ${
              totals.totalProfit >= 0 ? 'text-cyan-700' : 'text-rose-700'
            }`}
          >
            {formatDH(totals.totalProfit)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{t('chart.monthly.netProfitSub')}</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-[#070b18] p-3.5 rounded-xl border border-cyan-500/30 text-white shadow-xs">
          <div className="flex items-center justify-between text-[11px] text-cyan-300 font-medium mb-1">
            <span>{t('chart.monthly.avgMargin')}</span>
            <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono">
              2026
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 flex items-center gap-1">
            <span>{totals.avgMargin}%</span>
            <ArrowUpRight className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="text-[10px] text-slate-300 mt-1">{t('chart.monthly.opProfitability')}</div>
        </div>
      </div>

      {/* Main Recharts Visual Display */}
      <div dir="ltr" className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={monthlyData}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="colorCouts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0.85} />
              </linearGradient>
              <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="monthLabel"
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            />

            <YAxis
              yAxisId="left"
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />

            {chartMode === 'mixed' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#0891b2', fontSize: 10, fontWeight: 600 }}
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
                      className="bg-[#070b18]/95 backdrop-blur-md text-white border border-cyan-500/30 rounded-xl p-3 shadow-2xl text-xs space-y-2 min-w-[210px]"
                    >
                      <div className="font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-cyan-300 font-semibold">{data.monthLabel} 2026</span>
                        <span className="text-[10px] text-slate-400 font-mono">{data.month}</span>
                      </div>

                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between items-center text-cyan-300">
                          <span className="text-slate-300 font-sans">{t('chart.monthly.tooltipRev')}</span>
                          <span className="font-bold">{formatDH(data.revenus)}</span>
                        </div>

                        <div className="flex justify-between items-center text-rose-300">
                          <span className="text-slate-300 font-sans">{t('chart.monthly.tooltipCost')}</span>
                          <span className="font-bold">{formatDH(data.couts)}</span>
                        </div>

                        <div className="text-[10px] text-slate-400 ps-2 space-y-0.5 border-s border-slate-700">
                          <div className="flex justify-between">
                            <span>{t('chart.monthly.tooltipLabor')}</span>
                            <span>{formatDH(data.coutsMainOeuvre)} ({data.heuresProd}{t('common.hours')})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t('chart.monthly.tooltipTravel')}</span>
                            <span>{formatDH(data.coutsDeplacement)}</span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-emerald-400 font-bold">
                          <span className="text-slate-300 font-sans">{t('chart.monthly.tooltipProfit')}</span>
                          <span>{formatDH(data.beneficeNet)}</span>
                        </div>

                        <div className="flex justify-between items-center text-sky-300 font-semibold pt-0.5">
                          <span className="text-slate-300 font-sans">{t('chart.monthly.tooltipMargin')}</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40 text-[10px]">
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
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 500 }}
            />

            {chartMode === 'mixed' ? (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="revenus"
                  name={t('chart.monthly.legendRev')}
                  fill="url(#colorRevenus)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  yAxisId="left"
                  dataKey="couts"
                  name={t('chart.monthly.legendCost')}
                  fill="url(#colorCouts)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tauxMarge"
                  name={t('chart.monthly.legendMargin')}
                  stroke="#00d2ff"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#00d2ff', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 5, fill: '#00d2ff', stroke: '#070b18', strokeWidth: 2 }}
                />
              </>
            ) : (
              <>
                <Bar
                  yAxisId="left"
                  dataKey="beneficeNet"
                  name={t('chart.monthly.legendProfit')}
                  fill="url(#colorBenefice)"
                  radius={[4, 4, 0, 0]}
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
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <span>
            {activeProject ? (
              <span>
                {t('chart.monthly.filteredFor')}{' '}
                <strong className="text-slate-800 font-semibold">{activeProject.nom_systeme}</strong>
              </span>
            ) : (
              <span>{t('chart.monthly.consolidatedFor', { count: projects.length })}</span>
            )}
          </span>
        </div>

        {onNavigateToProjects && (
          <button
            onClick={onNavigateToProjects}
            className="text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1"
          >
            <span>{t('chart.monthly.goToProjects')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
