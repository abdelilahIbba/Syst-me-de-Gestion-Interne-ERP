/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Project, ProjectType, ProjectStatus } from '../types';
import { formatDH, round2 } from '../utils/calculations';
import { ProjectsComparisonChart } from './ProjectsComparisonChart';
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  DollarSign,
  Clock,
  TrendingUp,
  X,
  FileCode2,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { projects, clients, employees, dailyReports, siteVisits, payments, invoices, addProject } = useApp();
  const { t } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    client_id: clients[0]?.id || '',
    nom_systeme: '',
    type: 'application' as ProjectType,
    description: '',
    technologies: 'React, Node.js, PostgreSQL',
    date_signature: new Date().toISOString().split('T')[0],
    date_livraison: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    prix_vente_ht: 60000,
    statut: 'en cours' as ProjectStatus,
    chef_projet_id: 'EMP-005',
    url_production: '',
    lien_documentation: '',
  });

  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const client = clients.find((c) => c.id === p.client_id);
    const matchesSearch =
      p.nom_systeme.toLowerCase().includes(term) ||
      (client && client.raison_sociale.toLowerCase().includes(term)) ||
      p.technologies.toLowerCase().includes(term);
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesStatut = filterStatut === 'all' || p.statut === filterStatut;
    return matchesSearch && matchesType && matchesStatut;
  });

  // Calculate CL-7: Rentabilité par projet
  // Revenus encaissés - Coût estimé (heures des rapports x coût horaire employé) - Frais déplacement
  const calculateProfitability = (proj: Project) => {
    // 1. Invoices & Payments for this project
    const projInvoices = invoices.filter((inv) => inv.project_id === proj.id && inv.statut !== 'annulée');
    const encaissé = payments
      .filter((pay) => projInvoices.some((inv) => inv.id === pay.invoice_id) && pay.statut === 'encaissé')
      .reduce((sum, p) => sum + p.montant, 0);

    // 2. Hours spent on this project from daily reports
    let totalHours = 0;
    let laborCost = 0;

    dailyReports.forEach((rep) => {
      const emp = employees.find((e) => e.id === rep.employee_id);
      const hourlyRate = emp?.hourly_cost || 150;

      (rep.tasks || []).forEach((tsk) => {
        if (tsk.project_id === proj.id) {
          totalHours += tsk.heures;
          laborCost += tsk.heures * hourlyRate;
        }
      });
    });

    // 3. Travel expenses for this project
    const projVisits = siteVisits.filter((v) => v.project_id === proj.id);
    const travelExpenses = projVisits.reduce((acc, v) => {
      const sum = (v.expenses || []).reduce((s, x) => s + x.montant, 0);
      return acc + sum;
    }, 0);

    const netProfit = round2(encaissé - laborCost - travelExpenses);
    const margin = encaissé > 0 ? Math.round((netProfit / encaissé) * 100) : 0;

    return {
      encaissé,
      totalHours: round2(totalHours),
      laborCost: round2(laborCost),
      travelExpenses: round2(travelExpenses),
      netProfit,
      margin,
    };
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom_systeme || !formData.client_id) return;
    addProject(formData);
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('projects.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('projects.subtitle')}
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-xl shadow-[0_6px_16px_-4px_rgba(2,132,199,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t('projects.newBtn')}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_4px_16px_-8px_rgba(11,23,51,0.08)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#647BA0] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('projects.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-2 text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] placeholder:text-[#647BA0] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] focus:outline-hidden focus:border-[#0284C7]"
        >
          <option value="all">{t('projects.allTypes')}</option>
          <option value="site web">{t('projects.type.website')}</option>
          <option value="application">{t('projects.type.app')}</option>
          <option value="POS">{t('projects.type.pos')}</option>
          <option value="gestion">{t('projects.type.erp')}</option>
        </select>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] focus:outline-hidden focus:border-[#0284C7]"
        >
          <option value="all">{t('projects.allStatuses')}</option>
          <option value="en cours">En cours</option>
          <option value="livré">Livré</option>
          <option value="suspendu">Suspendu</option>
          <option value="annulé">Annulé</option>
        </select>
      </div>

      {/* Recharts Profitability Comparison: Revenus vs Charges Directes */}
      <ProjectsComparisonChart
        projects={filteredProjects}
        clients={clients}
        invoices={invoices}
        payments={payments}
        dailyReports={dailyReports}
        siteVisits={siteVisits}
        employees={employees}
      />

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((p) => {
          const client = clients.find((c) => c.id === p.client_id);
          const chef = employees.find((e) => e.id === p.chef_projet_id);
          const prof = calculateProfitability(p);

          return (
            <div key={p.id} className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] p-4 sm:p-5 shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#0284C7] tracking-wider">
                    {p.type}
                  </span>
                  <h3 className="text-sm font-bold text-[#0D1B38] mt-0.5">{p.nom_systeme}</h3>
                  <div className="text-xs text-[#546A8E] font-medium">{client?.raison_sociale || 'Client'}</div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg capitalize border ${
                    p.statut === 'livré'
                      ? 'bg-[#DCF4E8] text-[#0E6245] border-[#A7DFC3]'
                      : p.statut === 'en cours'
                      ? 'bg-[#DFF0FC] text-[#035388] border-[#A5D3F3]'
                      : 'bg-[#E2EAF5] text-[#455B80] border-[#C5D5E8]'
                  }`}
                >
                  {p.statut}
                </span>
              </div>

              <p className="text-xs text-[#3C5073] line-clamp-2 leading-relaxed">{p.description}</p>

              {/* Technologies strip */}
              <div className="text-[11px] text-[#3C5073] bg-[#E6EEF8] border border-[#D5E2F1] p-2.5 rounded-xl font-mono">
                {t('projects.techPrefix')} {p.technologies}
              </div>

              {/* Profitability Box (CL-7) */}
              <div className="bg-[#E6EEF8] rounded-xl p-3.5 border border-[#C9D9EC] space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#0D1B38]">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>{t('projects.realProfitability')}</span>
                  </span>
                  <span className={`font-mono font-bold ${prof.netProfit >= 0 ? 'text-[#0E6245]' : 'text-[#9F1239]'}`}>
                    {formatDH(prof.netProfit)} ({prof.margin}%)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-2.5 border-t border-[#CFDDED] text-[#3C5073]">
                  <div className="flex sm:block items-center justify-between">
                    <span className="text-[#546A8E] sm:block text-[10px]">{t('projects.collectedRevenue')}</span>
                    <span className="font-mono font-semibold text-[#0D1B38]">{formatDH(prof.encaissé)}</span>
                  </div>
                  <div className="flex sm:block items-center justify-between">
                    <span className="text-[#546A8E] sm:block text-[10px]">{t('projects.laborCost', { hours: prof.totalHours })}</span>
                    <span className="font-mono font-semibold text-[#0D1B38]">{formatDH(prof.laborCost)}</span>
                  </div>
                  <div className="flex sm:block items-center justify-between">
                    <span className="text-[#546A8E] sm:block text-[10px]">{t('projects.travelExpenses')}</span>
                    <span className="font-mono font-semibold text-[#0D1B38]">{formatDH(prof.travelExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom links and details */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#546A8E] pt-2 border-t border-[#DCE6F3]">
                <span>{t('projects.projectManager')} <strong className="text-[#1C2E4F]">{chef?.prenom} {chef?.nom}</strong></span>
                {p.url_production && (
                  <a
                    href={p.url_production}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#0284C7] hover:underline font-medium"
                  >
                    <span>{t('projects.prodLink')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Project */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38]">{t('projects.modalTitle')}</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.client')}</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.raison_sociale} ({c.code_client})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.name')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('projects.field.namePlaceholder')}
                  value={formData.nom_systeme}
                  onChange={(e) => setFormData({ ...formData, nom_systeme: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    <option value="site web">{t('projects.type.website')}</option>
                    <option value="application">{t('projects.type.app')}</option>
                    <option value="POS">{t('projects.type.pos')}</option>
                    <option value="gestion">{t('projects.type.erp')}</option>
                    <option value="autre">{t('projects.type.other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.priceHt')}</label>
                  <input
                    type="number"
                    value={formData.prix_vente_ht}
                    onChange={(e) => setFormData({ ...formData, prix_vente_ht: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.tech')}</label>
                <input
                  type="text"
                  placeholder={t('projects.field.techPlaceholder')}
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.description')}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-xl text-[#1C2E4F] font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white rounded-xl font-semibold shadow-xs"
                >
                  {t('projects.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
