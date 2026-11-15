/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Expense, ExpenseSource, PaymentMethod } from '../types';
import { formatDH, round2 } from '../utils/calculations';
import {
  Plus,
  Search,
  Layers,
  X,
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { expenses, expenseCategories, currentUser, addExpense, validateExpense, hasUserPermission } = useApp();
  const { t } = useI18n();
  const canValidateExpense = hasUserPermission('manage_expenses');

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
    statut: (['super_admin', 'admin'].includes(currentUser.role) ? 'validée' : 'en attente') as 'validée' | 'en attente',
  });

  const translateSource = (source: ExpenseSource) => {
    if (source === 'paie') return t('expenses.source.paie');
    if (source === 'déplacement') return t('expenses.source.déplacement');
    return t('expenses.source.manuelle');
  };

  const translateExpenseStatus = (status: Expense['statut']) => {
    if (status === 'validée') return t('expenses.status.validée');
    return t('expenses.status.en attente');
  };

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
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('expenses.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('expenses.subtitle')}
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-xl shadow-[0_6px_16px_-4px_rgba(2,132,199,0.4)] transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('expenses.newBtn')}</span>
        </button>
      </div>

      {/* Category Breakdown Progress Bar (CH-5) */}
      <div className="bg-[#F1F5FB] p-4 sm:p-5 rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0284C7] shrink-0" />
            <h3 className="text-sm font-semibold text-[#0D1B38]">{t('expenses.breakdownTitle')}</h3>
          </div>
          <div className="text-xs font-mono font-bold text-[#0D1B38]">
            {t('expenses.displayedTotal')} {formatDH(totalTtcFiltered)}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
          {categoryTotals.slice(0, 4).map((c) => (
            <div key={c.category.id} className="bg-[#E6EEF8] p-3 rounded-xl border border-[#D5E2F1] text-xs">
              <div className="text-[#546A8E] truncate text-[11px] font-medium">{c.category.nom}</div>
              <div className="font-mono font-bold text-[#0D1B38] mt-0.5">{formatDH(c.total)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_4px_16px_-8px_rgba(11,23,51,0.08)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#647BA0] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('expenses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-2 text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] placeholder:text-[#647BA0] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
          />
        </div>

        {/* Source Filter (CH-3, CH-4) */}
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] flex-1 sm:flex-none focus:outline-hidden focus:border-[#0284C7]"
        >
          <option value="all">{t('expenses.allSources')}</option>
          <option value="manuelle">{t('expenses.source.manuelle')}</option>
          <option value="paie">{t('expenses.source.paie')}</option>
          <option value="déplacement">{t('expenses.source.déplacement')}</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] flex-1 sm:flex-none focus:outline-hidden focus:border-[#0284C7]"
        >
          <option value="all">{t('expenses.allCategories')}</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] overflow-hidden">
        {/* Mobile Card List (< md) */}
        <div className="md:hidden divide-y divide-[#DCE6F3]">
          {filteredExpenses.map((exp) => {
            const cat = expenseCategories.find((c) => c.id === exp.categorie_id);
            return (
              <div key={exp.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0D1B38]">{exp.libelle}</div>
                    <div className="text-[11px] text-[#546A8E]">
                      {t('expenses.vendorPrefix')} {exp.fournisseur} · <span className="font-mono">{exp.date}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold shrink-0 ${
                      exp.statut === 'validée' ? 'text-[#0E6245]' : 'text-[#8F5600]'
                    }`}
                  >
                    {translateExpenseStatus(exp.statut)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#E6EEF8] border border-[#D5E2F1] p-2.5 rounded-xl text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-[#1C2E4F]">{cat?.nom || '-'}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                        exp.source === 'paie'
                          ? 'bg-[#ECE7FC] text-[#5B35B5] font-semibold'
                          : exp.source === 'déplacement'
                          ? 'bg-[#FEF3D6] text-[#8F5600] font-semibold'
                          : 'bg-[#DCE6F3] text-[#3C5073]'
                      }`}
                    >
                      {translateSource(exp.source)}
                    </span>
                    {exp.recurrente && (
                      <span className="text-[10px] text-[#035388] bg-[#DFF0FC] px-1.5 py-0.5 rounded-md">
                        {t('expenses.recurring')}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-[#0D1B38] text-xs">{formatDH(exp.montant_ttc)}</span>
                </div>

                {exp.statut === 'en attente' && canValidateExpense && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => validateExpense(exp.id)}
                      className="px-3 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-lg transition-colors whitespace-nowrap"
                    >
                      {t('expenses.validateBtn')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#E6EEF8] text-[#455B80] font-semibold border-b border-[#CFDDED]">
              <tr>
                <th className="py-3 px-4 text-start">{t('common.date')}</th>
                <th className="py-3 px-3 text-start">{t('expenses.col.labelVendor')}</th>
                <th className="py-3 px-3 text-start">{t('expenses.col.category')}</th>
                <th className="py-3 px-3 text-start">{t('expenses.col.source')}</th>
                <th className="py-3 px-3 text-end">{t('expenses.col.amountTtc')}</th>
                <th className="py-3 px-3 text-center">{t('expenses.col.status')}</th>
                <th className="py-3 px-4 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6F3]">
              {filteredExpenses.map((exp) => {
                const cat = expenseCategories.find((c) => c.id === exp.categorie_id);

                return (
                  <tr key={exp.id} className="hover:bg-[#E7EFFA] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#3C5073]">{exp.date}</td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#0D1B38]">{exp.libelle}</div>
                      <div className="text-[11px] text-[#546A8E]">{t('expenses.vendorPrefix')} {exp.fournisseur}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-[#1C2E4F]">{cat?.nom || '-'}</span>
                      {exp.recurrente && (
                        <span className="text-[10px] text-[#035388] ms-1.5 bg-[#DFF0FC] px-1.5 py-0.5 rounded-md">
                          {t('expenses.recurring')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${
                          exp.source === 'paie'
                            ? 'bg-[#ECE7FC] text-[#5B35B5] font-semibold'
                            : exp.source === 'déplacement'
                            ? 'bg-[#FEF3D6] text-[#8F5600] font-semibold'
                            : 'bg-[#E2EAF5] text-[#3C5073]'
                        }`}
                      >
                        {translateSource(exp.source)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-bold text-[#0D1B38]">
                      {formatDH(exp.montant_ttc)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          exp.statut === 'validée' ? 'text-[#0E6245]' : 'text-[#8F5600]'
                        }`}
                      >
                        {translateExpenseStatus(exp.statut)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-end">
                      {exp.statut === 'en attente' && canValidateExpense && (
                        <button
                          onClick={() => validateExpense(exp.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-lg transition-colors whitespace-nowrap"
                        >
                          {t('expenses.validateBtn')}
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38]">{t('expenses.modalTitle')}</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('expenses.field.label')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('expenses.field.labelPlaceholder')}
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('expenses.field.category')}</label>
                  <select
                    value={formData.categorie_id}
                    onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('expenses.field.vendor')}</label>
                  <input
                    type="text"
                    required
                    value={formData.fournisseur}
                    onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('expenses.field.amountHt')}</label>
                  <input
                    type="number"
                    value={formData.montant_ht}
                    onChange={(e) => {
                      const ht = Number(e.target.value);
                      const tva = round2(ht * 0.20);
                      setFormData({ ...formData, montant_ht: ht, tva, montant_ttc: round2(ht + tva) });
                    }}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('expenses.field.vat')}</label>
                  <input
                    type="number"
                    value={formData.tva}
                    onChange={(e) => {
                      const tva = Number(e.target.value);
                      setFormData({ ...formData, tva, montant_ttc: round2(formData.montant_ht + tva) });
                    }}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#E6EEF8] border border-[#D5E2F1] rounded-xl flex justify-between font-mono font-bold text-[#0D1B38]">
                <span>{t('expenses.field.totalTtc')}</span>
                <span>{formatDH(formData.montant_ttc)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('common.date')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('expenses.field.payMethod')}</label>
                  <select
                    value={formData.mode_paiement}
                    onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value as PaymentMethod })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    <option value="virement">{t('invoices.method.virement')}</option>
                    <option value="carte">{t('invoices.method.carte')}</option>
                    <option value="chèque">{t('invoices.method.chèque')}</option>
                    <option value="espèces">{t('invoices.method.espèces')}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recurrentCheck"
                  checked={formData.recurrente}
                  onChange={(e) => setFormData({ ...formData, recurrente: e.target.checked })}
                  className="rounded border-[#9FB6D6] text-[#0284C7]"
                />
                <label htmlFor="recurrentCheck" className="text-[#1C2E4F] font-medium">
                  {t('expenses.field.recurring')}
                </label>
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
                  {t('expenses.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
