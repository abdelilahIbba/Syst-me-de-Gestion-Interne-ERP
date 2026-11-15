/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Quote, InvoiceItem } from '../types';
import { calculateInvoiceTotals, formatDH } from '../utils/calculations';
import {
  Plus,
  CheckCircle2,
  Trash2,
  X,
  FileCheck,
} from 'lucide-react';

export const QuotesView: React.FC<{ onNavigateToInvoices: () => void }> = ({ onNavigateToInvoices }) => {
  const { quotes, clients, projects, settings, createQuote, convertQuoteToInvoice } = useApp();
  const { t } = useI18n();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [convertedQuoteNum, setConvertedQuoteNum] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_id: clients[0]?.id || '',
    project_id: projects[0]?.id || '',
    date_emission: new Date().toISOString().split('T')[0],
    date_validite: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    taux_tva: settings.default_vat_rate,
    items: [
      {
        id: '1',
        invoice_id: '',
        designation: 'Prestation d intégration et paramétrage progiciel',
        quantite: 1,
        unite: 'forfait',
        prix_unitaire_ht: 35000,
        remise_ligne: 0,
        total_ligne_ht: 35000,
      },
    ],
    notes: 'Devis valable 30 jours calendaires. Acompte de 40% à la commande.',
  });

  const totals = calculateInvoiceTotals(formData.items, 0, formData.taux_tva);

  const translateQuoteStatus = (status: Quote['statut']) => {
    switch (status) {
      case 'converti':
        return t('quotes.status.converti');
      case 'accepté':
        return t('quotes.status.accepté');
      case 'envoyé':
        return t('quotes.status.envoyé');
      default:
        return t('quotes.status.brouillon');
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: String(Date.now()),
          invoice_id: '',
          designation: '',
          quantite: 1,
          unite: 'unité',
          prix_unitaire_ht: 0,
          remise_ligne: 0,
          total_ligne_ht: 0,
        },
      ],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const qty = Number(newItems[index].quantite) || 0;
    const pu = Number(newItems[index].prix_unitaire_ht) || 0;
    const rem = Number(newItems[index].remise_ligne) || 0;
    newItems[index].total_ligne_ht = Math.max(0, qty * pu - rem);
    setFormData({ ...formData, items: newItems });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id || formData.items.length === 0) return;
    createQuote({
      ...formData,
      total_ht: totals.totalHt,
      montant_tva: totals.montantTva,
      total_ttc: totals.totalTtc,
    });
    setIsNewModalOpen(false);
  };

  const handleConvert = (quote: Quote) => {
    convertQuoteToInvoice(quote.id);
    setConvertedQuoteNum(quote.numero);
    setTimeout(() => setConvertedQuoteNum(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[22px] font-bold text-[#0D1B38] tracking-[-0.02em]">{t('quotes.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('quotes.subtitle')}
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="ios-btn-primary flex items-center justify-center gap-1.5 px-4 py-2 text-xs min-h-[38px] whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('quotes.newBtn')}</span>
        </button>
      </div>

      {convertedQuoteNum && (
        <div className="p-3.5 bg-[#DCF4E8]/90 backdrop-blur-md border border-[#A7DFC3] text-[#0E6245] rounded-[18px] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#0E6245] shrink-0" />
            <span>{t('quotes.convertedBanner', { num: convertedQuoteNum })}</span>
          </div>
          <button
            onClick={onNavigateToInvoices}
            className="font-bold underline text-[#0E6245] hover:text-[#094732] whitespace-nowrap self-start sm:self-auto active:scale-[0.97]"
          >
            {t('quotes.goToInvoices')}
          </button>
        </div>
      )}

      {/* Quotes Table */}
      <div className="ios-card overflow-hidden">
        {/* Mobile Card List (< md) */}
        <div className="md:hidden divide-y divide-[#DCE6F3]">
          {quotes.map((q) => {
            const client = clients.find((c) => c.id === q.client_id);
            return (
              <div key={q.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-[#0D1B38]">{q.numero}</div>
                    <div className="font-semibold text-[#1C2E4F] truncate">{client?.raison_sociale}</div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0 border ${
                      q.statut === 'converti'
                        ? 'bg-[#DCF4E8] text-[#0E6245] border-[#A7DFC3]'
                        : q.statut === 'accepté'
                        ? 'bg-[#DFF0FC] text-[#035388] border-[#A5D3F3]'
                        : 'bg-[#FEF3D6] text-[#8F5600] border-[#F2D388]'
                    }`}
                  >
                    {translateQuoteStatus(q.statut)}
                  </span>
                </div>

                <div className="ios-well grid grid-cols-2 gap-2 p-2.5 text-[11px]">
                  <div>
                    <span className="text-[#546A8E] block">{t('quotes.col.totalHt')}</span>
                    <span className="font-mono font-medium text-[#1C2E4F]">{formatDH(q.total_ht)}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-[#546A8E] block">{t('quotes.col.totalTtc')}</span>
                    <span className="font-mono font-bold text-[#0D1B38]">{formatDH(q.total_ttc)}</span>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-[#CFDDED]">
                    <span className="text-[#273B63]">{q.date_emission}</span>
                    <span className="text-[#546A8E]">{t('quotes.validUntil', { date: q.date_validite })}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  {q.statut !== 'converti' ? (
                    <button
                      onClick={() => handleConvert(q)}
                      className="ios-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] min-h-[34px] whitespace-nowrap"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{t('quotes.convertBtn')}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#647BA0] italic">{t('quotes.convertedTag')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#E6EEF8] text-[#455B80] font-semibold border-b border-[#CFDDED]">
              <tr>
                <th className="py-3 px-4 text-start">{t('invoices.col.number')}</th>
                <th className="py-3 px-3 text-start">{t('invoices.col.client')}</th>
                <th className="py-3 px-3 text-start">{t('quotes.col.dateValidity')}</th>
                <th className="py-3 px-3 text-end">{t('quotes.col.totalHt')}</th>
                <th className="py-3 px-3 text-end">{t('quotes.col.totalTtc')}</th>
                <th className="py-3 px-3 text-center">{t('common.status')}</th>
                <th className="py-3 px-4 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6F3]">
              {quotes.map((q) => {
                const client = clients.find((c) => c.id === q.client_id);

                return (
                  <tr key={q.id} className="hover:bg-[#E7EFFA] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#0D1B38]">{q.numero}</td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1C2E4F]">{client?.raison_sociale}</div>
                      <div className="text-[11px] text-[#546A8E]">{client?.ville}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[#273B63]">{q.date_emission}</div>
                      <div className="text-[11px] text-[#546A8E]">{t('quotes.validUntil', { date: q.date_validite })}</div>
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-medium text-[#1C2E4F]">
                      {formatDH(q.total_ht)}
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-bold text-[#0D1B38]">
                      {formatDH(q.total_ttc)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                          q.statut === 'converti'
                            ? 'bg-[#DCF4E8] text-[#0E6245] border-[#A7DFC3]'
                            : q.statut === 'accepté'
                            ? 'bg-[#DFF0FC] text-[#035388] border-[#A5D3F3]'
                            : 'bg-[#FEF3D6] text-[#8F5600] border-[#F2D388]'
                        }`}
                      >
                        {translateQuoteStatus(q.statut)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-end">
                      {q.statut !== 'converti' ? (
                        <button
                          onClick={() => handleConvert(q)}
                          className="ios-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] min-h-[34px] ms-auto whitespace-nowrap"
                          title={t('quotes.convertBtn')}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{t('quotes.convertBtn')}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#647BA0] italic">{t('quotes.convertedTag')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Quote */}
      {isNewModalOpen && (
        <div className="ios-sheet-backdrop fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="ios-sheet rounded-t-[28px] sm:rounded-[26px] max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#B8CAE2] mx-auto -mt-1" />
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38] tracking-[-0.015em]">{t('quotes.modalTitle')}</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#E5EDF8] hover:bg-[#DAE5F4] flex items-center justify-center text-[#546A8E] hover:text-[#0D1B38] transition-all active:scale-[0.93]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.client')}</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="ios-input w-full p-2.5"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.raison_sociale} ({c.statut})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.editorVat')}</label>
                  <input
                    type="number"
                    value={formData.taux_tva}
                    onChange={(e) => setFormData({ ...formData, taux_tva: Number(e.target.value) })}
                    className="ios-input w-full p-2.5 font-mono"
                  />
                </div>
              </div>

              {/* Items Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0D1B38]">{t('quotes.proposedItems')}</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="ios-btn-tinted px-2.5 py-1 text-[11px]"
                  >
                    {t('invoices.editorAddLine')}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pe-1">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="ios-well grid grid-cols-12 gap-2 p-2.5 items-center">
                      <div className="col-span-12 sm:col-span-6">
                        <input
                          type="text"
                          required
                          placeholder={t('payroll.col.designation')}
                          value={item.designation}
                          onChange={(e) => handleItemChange(idx, 'designation', e.target.value)}
                          className="ios-input w-full p-2 !bg-[#F5F8FD] text-xs"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          placeholder={t('invoices.col.qty')}
                          value={item.quantite}
                          onChange={(e) => handleItemChange(idx, 'quantite', Number(e.target.value))}
                          className="ios-input w-full p-2 !bg-[#F5F8FD] text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <input
                          type="number"
                          placeholder={t('invoices.col.unitPrice')}
                          value={item.prix_unitaire_ht}
                          onChange={(e) => handleItemChange(idx, 'prix_unitaire_ht', Number(e.target.value))}
                          className="ios-input w-full p-2 !bg-[#F5F8FD] text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 rounded-full text-[#C81E4A] hover:bg-[#FCE8EC] active:scale-[0.92] transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ios-well p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono text-[#1C2E4F]">
                <div>{t('invoices.totalHt')} <strong>{formatDH(totals.totalHt)}</strong></div>
                <div>{t('invoices.vatLabel', { rate: totals.tauxTva })} <strong>{formatDH(totals.montantTva)}</strong></div>
                <div className="text-sm font-bold text-[#0D1B38]">{t('invoices.totalTtc')} {formatDH(totals.totalTtc)}</div>
              </div>

              <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="ios-btn-secondary px-4 py-2 min-h-[38px]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="ios-btn-primary px-4 py-2 min-h-[38px]"
                >
                  {t('quotes.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
