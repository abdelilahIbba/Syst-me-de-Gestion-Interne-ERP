/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseSource, PaymentMethod } from '../types';
import { formatDH, round2 } from '../utils/calculations';
import {
  WalletCards,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  Building,
  Calendar,
  Layers,
  X,
  FileCheck2,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, expenseCategories, currentUser, addExpense, validateExpense } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    categorie_id: expenseCategories[1]?.id || '',
    libelle: '',
    fournisseur: '',
    montant_ht: 2500,
    tva: 500,
    montant_ttc: 3000,
    mode_paiement: 'virement' as PaymentMethod,
    recurrente: false,
    source: 'manuelle' as ExpenseSource,
    statut: (currentUser.role === 'admin' ? 'validée' : 'en attente') as const,
  });

  const filteredExpenses = expenses.filter((e) => {
    const term = searchTerm.toLowerCase();
    const cat = expenseCategories.find((c) => c.id === e.categorie_id);
    const matchesSearch =
      e.libelle.toLowerCase().includes(term) ||
      e.fournisseur.toLowerCase().includes(term) ||
      (cat && cat.nom.toLowerCase().includes(term));
    const matchesSource = filterSource === 'all' || e.source === filterSource;
    const matchesCategory = filterCategory === 'all' || e.categorie_id === filterCategory;
    return matchesSearch && matchesSource && matchesCategory;
  });

  const totalTtcFiltered = filteredExpenses.reduce((sum, e) => sum + e.montant_ttc, 0);

  // Group by Category for distribution breakdown (CH-5)
  const categoryTotals = expenseCategories.map((cat) => {
    const total = expenses
      .filter((e) => e.categorie_id === cat.id && e.statut === 'validée')
      .reduce((s, e) => s + e.montant_ttc, 0);
    return {
      category: cat,
      total,
      percentage: totalTtcFiltered > 0 ? Math.round((total / totalTtcFiltered) * 100) : 0,
    };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.libelle || !formData.categorie_id) return;

    addExpense({
      ...formData,
      montant_ttc: round2(formData.montant_ht + formData.tva),
    });
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Charges & Dépenses (Page Unique)</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module CH-1 à CH-6 · Regroupement unifié des charges manuelles, paie automatisée et déplacements validés
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir une Charge (CH-1)</span>
        </button>
      </div>

      {/* Category Breakdown Progress Bar (CH-5) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <h3 className="text-sm font-semibold text-slate-900">Répartition Analytique des Charges</h3>
          </div>
          <div className="text-xs font-mono font-bold text-slate-900">
            Total affiché : {formatDH(totalTtcFiltered)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {categoryTotals.slice(0, 4).map((c) => (
            <div key={c.category.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <div className="text-slate-500 truncate text-[11px] font-medium">{c.category.nom}</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{formatDH(c.total)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher libellé, fournisseur, catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        {/* Source Filter (CH-3, CH-4) */}
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
        >
          <option value="all">Toutes Sources</option>
          <option value="manuelle">Manuelle</option>
          <option value="paie">Issu de la Paie (Auto CH-3)</option>
          <option value="déplacement">Issu Déplacements (Auto CH-4)</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
        >
          <option value="all">Toutes Catégories</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Libellé & Fournisseur</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Source (CH-3 / CH-4)</th>
                <th className="py-3 px-3 text-right">Montant TTC</th>
                <th className="py-3 px-3 text-center">Statut (CH-6)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const cat = expenseCategories.find((c) => c.id === exp.categorie_id);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">{exp.date}</td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{exp.libelle}</div>
                      <div className="text-[11px] text-slate-400">Fournisseur : {exp.fournisseur}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700">{cat?.nom || 'Général'}</span>
                      {exp.recurrente && (
                        <span className="text-[10px] text-blue-700 ml-1.5 bg-blue-50 px-1 py-0.5 rounded-sm">
                          Récurrente
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm capitalize ${
                          exp.source === 'paie'
                            ? 'bg-purple-50 text-purple-700 font-semibold'
                            : exp.source === 'déplacement'
                            ? 'bg-amber-50 text-amber-700 font-semibold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {exp.source}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatDH(exp.montant_ttc)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          exp.statut === 'validée' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {exp.statut}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {exp.statut === 'en attente' && ['admin', 'comptable'].includes(currentUser.role) && (
                        <button
                          onClick={() => validateExpense(exp.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                        >
                          Valider (CH-6)
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Expense */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Saisir une Dépense / Charge (CH-1)</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Libellé de la dépense *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Facture Maroc Telecom, Hébergement AWS..."
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Catégorie de charge</label>
                  <select
                    value={formData.categorie_id}
                    onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Fournisseur</label>
                  <input
                    type="text"
                    required
                    value={formData.fournisseur}
                    onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Montant HT (DH)</label>
                  <input
                    type="number"
                    value={formData.montant_ht}
                    onChange={(e) => {
                      const ht = Number(e.target.value);
                      const tva = round2(ht * 0.20);
                      setFormData({ ...formData, montant_ht: ht, tva, montant_ttc: round2(ht + tva) });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">TVA (DH)</label>
                  <input
                    type="number"
                    value={formData.tva}
                    onChange={(e) => {
                      const tva = Number(e.target.value);
                      setFormData({ ...formData, tva, montant_ttc: round2(formData.montant_ht + tva) });
                    }}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg flex justify-between font-mono font-bold text-slate-900">
                <span>Total TTC :</span>
                <span>{formatDH(formData.montant_ttc)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Mode de règlement</label>
                  <select
                    value={formData.mode_paiement}
                    onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value as PaymentMethod })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="chèque">Chèque</option>
                    <option value="espèces">Espèces</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recurrentCheck"
                  checked={formData.recurrente}
                  onChange={(e) => setFormData({ ...formData, recurrente: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="recurrentCheck" className="text-slate-700 font-medium">
                  Charge récurrente mensuelle (loyer, abonnements)
                </label>
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
                  Enregistrer la charge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
