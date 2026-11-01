/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Project, ProjectType, ProjectStatus } from '../types';
import { formatDH, round2 } from '../utils/calculations';
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Systèmes Vendus & Rentabilité</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module CL-3 & CL-7 · Suivi des livrables et calcul automatique de rentabilité réelle (Heures + Frais)
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet / Système</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher système, client, techno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
        >
          <option value="all">Tous Types</option>
          <option value="site web">Site Web</option>
          <option value="application">Application</option>
          <option value="POS">POS / Caisse</option>
          <option value="gestion">ERP / Gestion</option>
        </select>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
        >
          <option value="all">Tous Statuts</option>
          <option value="en cours">En cours</option>
          <option value="livré">Livré</option>
          <option value="suspendu">Suspendu</option>
          <option value="annulé">Annulé</option>
        </select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((p) => {
          const client = clients.find((c) => c.id === p.client_id);
          const chef = employees.find((e) => e.id === p.chef_projet_id);
          const prof = calculateProfitability(p);

          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-blue-600 tracking-wider">
                    {p.type}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{p.nom_systeme}</h3>
                  <div className="text-xs text-slate-500 font-medium">{client?.raison_sociale || 'Client'}</div>
                </div>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm capitalize ${
                    p.statut === 'livré'
                      ? 'bg-emerald-50 text-emerald-700'
                      : p.statut === 'en cours'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.statut}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.description}</p>

              {/* Technologies strip */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-md font-mono">
                Tech : {p.technologies}
              </div>

              {/* Profitability Box (CL-7) */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Rentabilité Réelle (CL-7)</span>
                  </span>
                  <span className={`font-mono font-bold ${prof.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatDH(prof.netProfit)} ({prof.margin}%)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Revenus Encaissés</span>
                    <span className="font-mono font-medium text-slate-800">{formatDH(prof.encaissé)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Coût MO ({prof.totalHours}h)</span>
                    <span className="font-mono font-medium text-slate-800">{formatDH(prof.laborCost)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Frais Déplacement</span>
                    <span className="font-mono font-medium text-slate-800">{formatDH(prof.travelExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom links and details */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>Chef de projet : <strong className="text-slate-700">{chef?.prenom} {chef?.nom}</strong></span>
                {p.url_production && (
                  <a
                    href={p.url_production}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <span>Lien prod</span>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Ajouter un système vendu / projet</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Client *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.raison_sociale} ({c.code_client})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Nom du Système / Logiciel *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ERP Logistique V3, Caisse POS Tactile..."
                  value={formData.nom_systeme}
                  onChange={(e) => setFormData({ ...formData, nom_systeme: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="site web">Site Web</option>
                    <option value="application">Application Mobile/Web</option>
                    <option value="POS">Système POS / Caisses</option>
                    <option value="gestion">Logiciel de Gestion / ERP</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Prix de vente HT (DH)</label>
                  <input
                    type="number"
                    value={formData.prix_vente_ht}
                    onChange={(e) => setFormData({ ...formData, prix_vente_ht: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Technologies employées</label>
                <input
                  type="text"
                  placeholder="Ex: React, Node.js, PostgreSQL, Docker..."
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Enregistrer le système
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
