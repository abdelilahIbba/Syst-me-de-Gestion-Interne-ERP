/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceType, PaymentMethod } from '../types';
import { calculateInvoiceTotals, formatDH } from '../utils/calculations';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Printer,
  AlertTriangle,
  X,
  Trash2,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    clients,
    settings,
    currentUser,
    createInvoice,
    updateDraftInvoice,
    validateInvoice,
    createCreditNote,
    registerPayment,
    cancelExtras,
    hasUserPermission,
  } = useApp();
  const { t } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [creditMotif, setCreditMotif] = useState('');
  const [creditAmount, setCreditAmount] = useState<number>(0);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    montant: 0,
    mode: 'virement' as PaymentMethod,
    reference: '',
    banque: 'Attijariwafa Bank',
    date_paiement: new Date().toISOString().split('T')[0],
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Invoice Editor Form state
  const [editorData, setEditorData] = useState<{
    id?: string;
    client_id: string;
    project_id?: string;
    contract_id?: string;
    type: InvoiceType;
    date_emission: string;
    date_echeance: string;
    remise: number;
    taux_tva: number;
    items: InvoiceItem[];
    notes: string;
  }>({
    client_id: clients[0]?.id || '',
    type: 'vente',
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    remise: 0,
    taux_tva: settings.default_vat_rate,
    items: [
      {
        id: '1',
        invoice_id: '',
        designation: 'Prestation de développement logiciel',
        quantite: 1,
        unite: 'forfait',
        prix_unitaire_ht: 25000,
        remise_ligne: 0,
        total_ligne_ht: 25000,
      },
    ],
    notes: settings.invoice_legal_notes,
  });

  const [extrasTargetInvoice, setExtrasTargetInvoice] = useState<Invoice | null>(null);
  const [selectedExtraItemId, setSelectedExtraItemId] = useState<string>('');
  const [extrasMotif, setExtrasMotif] = useState('');
  const [extrasNotice, setExtrasNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canValidate = hasUserPermission('manage_invoices');
  const canCancelExtras = hasUserPermission('cancel_extras');

  const translateInvoiceStatus = (status: InvoiceStatus) => {
    switch (status) {
      case 'brouillon':
        return t('invoices.status.brouillon');
      case 'envoyée':
        return t('invoices.status.envoyée');
      case 'validée':
        return t('invoices.status.validée');
      case 'payée partiellement':
        return t('invoices.status.payée partiellement');
      case 'payée':
        return t('invoices.status.payée');
      case 'annulée':
        return t('invoices.status.annulée');
    }
  };

  const translateInvoiceType = (type: InvoiceType) => {
    switch (type) {
      case 'vente':
        return t('invoices.type.vente');
      case 'maintenance':
        return t('invoices.type.maintenance');
      case 'service':
        return t('invoices.type.service');
      case 'avoir':
        return t('invoices.type.avoir');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const client = clients.find((c) => c.id === inv.client_id);
    const matchesSearch =
      inv.numero.toLowerCase().includes(term) ||
      (client && client.raison_sociale.toLowerCase().includes(term));
    const matchesStatut = filterStatut === 'all' || inv.statut === filterStatut;
    const matchesType = filterType === 'all' || inv.type === filterType;
    return matchesSearch && matchesStatut && matchesType;
  });

  const handleOpenNewInvoice = () => {
    setEditorData({
      client_id: clients[0]?.id || '',
      type: 'vente',
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      remise: 0,
      taux_tva: settings.default_vat_rate,
      items: [
        {
          id: '1',
          invoice_id: '',
          designation: 'Prestation de développement logiciel',
          quantite: 1,
          unite: 'forfait',
          prix_unitaire_ht: 25000,
          remise_ligne: 0,
          total_ligne_ht: 25000,
        },
      ],
      notes: settings.invoice_legal_notes,
    });
    setIsEditorOpen(true);
  };

  const handleAddItem = () => {
    setEditorData({
      ...editorData,
      items: [
        ...editorData.items,
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
    if (editorData.items.length <= 1) return;
    setEditorData({
      ...editorData,
      items: editorData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...editorData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    const qty = Number(newItems[index].quantite) || 0;
    const pu = Number(newItems[index].prix_unitaire_ht) || 0;
    const rem = Number(newItems[index].remise_ligne) || 0;
    newItems[index].total_ligne_ht = Math.max(0, qty * pu - rem);
    setEditorData({ ...editorData, items: newItems });
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorData.client_id || editorData.items.length === 0) return;

    const totals = calculateInvoiceTotals(editorData.items, editorData.remise, editorData.taux_tva);
    const payload = {
      ...editorData,
      total_ht: totals.totalHt,
      montant_tva: totals.montantTva,
      total_ttc: totals.totalTtc,
    };

    if (editorData.id) {
      updateDraftInvoice(editorData.id, payload);
    } else {
      createInvoice(payload);
    }
    setIsEditorOpen(false);
  };

  const handleValidate = (inv: Invoice) => {
    const result = validateInvoice(inv.id);
    if (!result.success) {
      setExtrasNotice({ type: 'error', text: result.error || t('invoices.extrasError') });
      setTimeout(() => setExtrasNotice(null), 4500);
    } else if (result.invoice) {
      setSelectedInvoice(result.invoice);
    }
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentForm({
      montant: inv.reste_a_payer,
      mode: 'virement',
      reference: 'VIR-' + Math.floor(Math.random() * 900000 + 100000),
      banque: 'BMCE Bank of Africa',
      date_paiement: new Date().toISOString().split('T')[0],
    });
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const result = registerPayment({
      invoice_id: selectedInvoice.id,
      client_id: selectedInvoice.client_id,
      montant: Number(paymentForm.montant),
      mode: paymentForm.mode,
      reference: paymentForm.reference,
      banque: paymentForm.banque,
      date_paiement: paymentForm.date_paiement,
      enregistre_par: currentUser.id,
    });

    if (!result.success) {
      setPaymentError(result.error || 'Error');
      return;
    }

    setIsPaymentModalOpen(false);
    const updated = invoices.find((i) => i.id === selectedInvoice.id);
    if (updated) setSelectedInvoice(updated);
  };

  const handleOpenCreditNote = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setCreditAmount(inv.total_ttc);
    setCreditMotif(t('invoices.creditReasonPlaceholder'));
    setIsCreditNoteModalOpen(true);
  };

  const handleSubmitCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    createCreditNote(selectedInvoice.id, creditAmount, creditMotif);
    setIsCreditNoteModalOpen(false);
  };

  const totals = calculateInvoiceTotals(editorData.items, editorData.remise, editorData.taux_tva);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('invoices.title')}</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            {t('invoices.subtitle')}
          </div>
        </div>

        <button
          onClick={handleOpenNewInvoice}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('invoices.newBtn')}</span>
        </button>
      </div>

      {extrasNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            extrasNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {extrasNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{extrasNotice.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('invoices.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700 flex-1 sm:flex-none"
        >
          <option value="all">{t('invoices.allStatuses')}</option>
          <option value="brouillon">{t('invoices.status.brouillon')}</option>
          <option value="validée">{t('invoices.status.validée')}</option>
          <option value="payée partiellement">{t('invoices.status.payée partiellement')}</option>
          <option value="payée">{t('invoices.status.payée')}</option>
          <option value="annulée">{t('invoices.status.annulée')}</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700 flex-1 sm:flex-none"
        >
          <option value="all">{t('invoices.allTypes')}</option>
          <option value="vente">{t('invoices.type.vente')}</option>
          <option value="maintenance">{t('invoices.type.maintenance')}</option>
          <option value="service">{t('invoices.type.service')}</option>
          <option value="avoir">{t('invoices.type.avoir')}</option>
        </select>
      </div>

      {/* Table of Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Card List (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredInvoices.map((inv) => {
            const client = clients.find((c) => c.id === inv.client_id);
            const isLocked = inv.statut !== 'brouillon' && inv.statut !== 'envoyée';
            const isOverdue =
              ['validée', 'payée partiellement'].includes(inv.statut) &&
              inv.date_echeance < new Date().toISOString().split('T')[0] &&
              inv.reste_a_payer > 0;

            return (
              <div key={inv.id} className="p-4 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      {isLocked && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                      <span>{inv.numero}</span>
                      <span className="text-[10px] uppercase font-sans font-semibold text-slate-400">
                        · {translateInvoiceType(inv.type)}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 truncate mt-0.5">
                      {client?.raison_sociale || t('common.client')}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm shrink-0 ${
                      inv.statut === 'payée'
                        ? 'bg-emerald-50 text-emerald-700'
                        : inv.statut === 'payée partiellement'
                        ? 'bg-sky-50 text-sky-700'
                        : inv.statut === 'validée'
                        ? 'bg-blue-50 text-blue-700'
                        : inv.statut === 'annulée'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {translateInvoiceStatus(inv.statut)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                  <div>
                    <span className="text-slate-500 block">{t('invoices.col.totalTtc')}</span>
                    <span className="font-mono font-bold text-slate-900">{formatDH(inv.total_ttc)}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-slate-500 block">{t('invoices.col.remaining')}</span>
                    <span className="font-mono font-semibold text-amber-700">{formatDH(inv.reste_a_payer)}</span>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-200/70">
                    <span className="text-slate-600">{inv.date_emission}</span>
                    <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}>
                      {t('invoices.duePrefix')} {inv.date_echeance} {isOverdue && t('invoices.overdueTag')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {inv.statut === 'brouillon' && canValidate && (
                    <button
                      onClick={() => handleValidate(inv)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-md shadow-xs whitespace-nowrap"
                    >
                      {t('invoices.validateBtn')}
                    </button>
                  )}

                  {isLocked && inv.reste_a_payer > 0 && inv.type !== 'avoir' && (
                    <button
                      onClick={() => handleOpenPayment(inv)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md whitespace-nowrap"
                    >
                      {t('invoices.recordPayBtn')}
                    </button>
                  )}

                  {isLocked && inv.type !== 'avoir' && (
                    <button
                      onClick={() => handleOpenCreditNote(inv)}
                      className="px-2.5 py-1.5 text-[11px] text-slate-600 bg-slate-100 rounded-md whitespace-nowrap"
                    >
                      {t('invoices.creditBtn')}
                    </button>
                  )}

                  {canCancelExtras && inv.items && inv.items.length > 0 && inv.statut !== 'annulée' && (
                    <button
                      type="button"
                      onClick={() => {
                        setExtrasTargetInvoice(inv);
                        setSelectedExtraItemId(inv.items?.[0]?.id || '');
                        setExtrasMotif(t('invoices.cancelExtrasTitle'));
                      }}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md whitespace-nowrap"
                    >
                      {t('invoices.cancelExtrasBtn')}
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
                  >
                    {t('invoices.pdfBtn')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-start text-xs min-w-[950px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-start">{t('invoices.col.number')}</th>
                <th className="py-3 px-3 text-start">{t('invoices.col.client')}</th>
                <th className="py-3 px-3 text-start">{t('invoices.col.dates')}</th>
                <th className="py-3 px-3 text-end">{t('invoices.col.totalTtc')}</th>
                <th className="py-3 px-3 text-end">{t('invoices.col.remaining')}</th>
                <th className="py-3 px-3 text-center">{t('common.status')}</th>
                <th className="py-3 px-4 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.client_id);
                const isLocked = inv.statut !== 'brouillon' && inv.statut !== 'envoyée';
                const isOverdue =
                  ['validée', 'payée partiellement'].includes(inv.statut) &&
                  inv.date_echeance < new Date().toISOString().split('T')[0] &&
                  inv.reste_a_payer > 0;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        {isLocked && (
                          <span title={t('common.locked')} className="inline-flex">
                            <Lock className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                        <span>{inv.numero}</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {translateInvoiceType(inv.type)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{client?.raison_sociale || t('common.client')}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ICE: {client?.ice || 'N/A'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-700">{inv.date_emission}</div>
                      <div className={`text-[11px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        {t('invoices.duePrefix')} {inv.date_echeance} {isOverdue && t('invoices.overdueTag')}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatDH(inv.total_ttc)}
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-semibold text-amber-700 whitespace-nowrap">
                      {formatDH(inv.reste_a_payer)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                          inv.statut === 'payée'
                            ? 'bg-emerald-50 text-emerald-700'
                            : inv.statut === 'payée partiellement'
                            ? 'bg-sky-50 text-sky-700'
                            : inv.statut === 'validée'
                            ? 'bg-blue-50 text-blue-700'
                            : inv.statut === 'annulée'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {translateInvoiceStatus(inv.statut)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-end whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {inv.statut === 'brouillon' && canValidate && (
                          <button
                            onClick={() => handleValidate(inv)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-md transition-colors shadow-xs whitespace-nowrap"
                            title={t('invoices.validateTitle')}
                          >
                            {t('invoices.validateBtn')}
                          </button>
                        )}

                        {isLocked && inv.reste_a_payer > 0 && inv.type !== 'avoir' && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap"
                          >
                            {t('invoices.recordPayBtn')}
                          </button>
                        )}

                        {isLocked && inv.type !== 'avoir' && (
                          <button
                            onClick={() => handleOpenCreditNote(inv)}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 rounded-md transition-colors whitespace-nowrap"
                            title={t('invoices.creditTitle')}
                          >
                            {t('invoices.creditBtn')}
                          </button>
                        )}

                        {canCancelExtras && inv.items && inv.items.length > 0 && inv.statut !== 'annulée' && (
                          <button
                            type="button"
                            onClick={() => {
                              setExtrasTargetInvoice(inv);
                              setSelectedExtraItemId(inv.items?.[0]?.id || '');
                              setExtrasMotif(t('invoices.cancelExtrasTitle'));
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors whitespace-nowrap"
                            title={t('invoices.cancelExtrasTitle')}
                          >
                            {t('invoices.cancelExtrasBtn')}
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                        >
                          {t('invoices.pdfBtn')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable PDF Modal (FA-4 Moroccan legal mentions) */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto print-page">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedInvoice.type === 'avoir' ? t('invoices.docCredit') : t('invoices.docInvoice')} : {selectedInvoice.numero}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs rounded-lg font-medium shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('invoices.printDownload')}</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-50"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            {/* Invoice Print Document */}
            <div className="p-3.5 sm:p-6 border border-slate-200 rounded-lg text-xs space-y-5 sm:space-y-6">
              {/* Header: Company & Client */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <img
                    src="/assets/aistudio/devnappLogo_10b7b539.jpg"
                    alt="DEVNAPP SARL"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-contain bg-slate-950 p-1.5 shadow-sm border border-slate-800 shrink-0"
                  />
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{settings.company_name}</h1>
                    <div className="text-cyan-700 font-semibold text-[10px] tracking-wider uppercase">{t('app.tagline')}</div>
                    <div className="text-slate-600 text-[11px] mt-1 space-y-0.5">
                      <div>{settings.adresse}</div>
                      <div>{settings.ville}</div>
                      <div dir="ltr">{settings.telephone} · {settings.email}</div>
                      <div className="font-mono text-slate-700 pt-1">
                        ICE : {settings.ice} · IF : {settings.if_number}
                      </div>
                      <div className="font-mono text-slate-700">
                        RC : {settings.rc} · Patente : {settings.patente}
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const client = clients.find((c) => c.id === selectedInvoice.client_id);
                  return (
                    <div className="text-start sm:text-end bg-slate-50 p-3 rounded-lg border border-slate-100 w-full sm:w-auto sm:min-w-[220px]">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('invoices.billedTo')}</div>
                      <div className="font-bold text-sm text-slate-900 mt-0.5">{client?.raison_sociale}</div>
                      <div className="text-[11px] text-slate-600 mt-1">{client?.adresse}</div>
                      <div className="text-[11px] text-slate-600">{client?.ville}</div>
                      <div className="text-[11px] font-mono text-slate-700 mt-1">
                        ICE : {client?.ice || 'N/A'}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Invoice details strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-[11px]">
                <div>
                  <span className="text-slate-500">{t('invoices.docNumber')}</span>
                  <div className="font-mono font-bold text-slate-900">{selectedInvoice.numero}</div>
                </div>
                <div>
                  <span className="text-slate-500">{t('invoices.issueDate')}</span>
                  <div className="font-medium text-slate-900">{selectedInvoice.date_emission}</div>
                </div>
                <div>
                  <span className="text-slate-500">{t('invoices.dueDate')}</span>
                  <div className="font-medium text-slate-900">{selectedInvoice.date_echeance}</div>
                </div>
                <div>
                  <span className="text-slate-500">{t('invoices.validationStatus')}</span>
                  <div className="font-semibold text-blue-700">{translateInvoiceStatus(selectedInvoice.statut)}</div>
                </div>
              </div>

              {/* Line items table */}
              <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border border-slate-200 min-w-[500px]">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5 text-start">{t('payroll.col.designation')}</th>
                    <th className="p-2.5 text-center">{t('invoices.col.qty')}</th>
                    <th className="p-2.5 text-end">{t('invoices.col.unitPrice')}</th>
                    <th className="p-2.5 text-end">{t('invoices.col.discount')}</th>
                    <th className="p-2.5 text-end">{t('invoices.col.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-medium text-slate-800">{item.designation}</td>
                      <td className="p-2.5 text-center">{item.quantite} {item.unite}</td>
                      <td className="p-2.5 text-end">{formatDH(item.prix_unitaire_ht)}</td>
                      <td className="p-2.5 text-end">{item.remise_ligne > 0 ? formatDH(item.remise_ligne) : '-'}</td>
                      <td className="p-2.5 text-end font-semibold text-slate-900">{formatDH(item.total_ligne_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Totals computation */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>{t('invoices.totalHt')}</span>
                    <span className="font-mono font-medium">{formatDH(selectedInvoice.total_ht)}</span>
                  </div>
                  {selectedInvoice.remise > 0 && (
                    <div className="flex justify-between py-1 text-rose-600">
                      <span>{t('invoices.discountLabel')}</span>
                      <span className="font-mono font-medium">-{formatDH(selectedInvoice.remise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>{t('invoices.vatLabel', { rate: selectedInvoice.taux_tva })}</span>
                    <span className="font-mono font-medium">{formatDH(selectedInvoice.montant_tva)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-b border-slate-200 text-sm font-bold text-slate-900">
                    <span>{t('invoices.totalTtc')}</span>
                    <span className="font-mono text-base">{formatDH(selectedInvoice.total_ttc)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 text-[11px]">
                    <span>{t('invoices.paidAmount')}</span>
                    <span className="font-mono text-emerald-700">{formatDH(selectedInvoice.montant_paye)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-amber-700 text-xs">
                    <span>{t('invoices.col.remaining')} :</span>
                    <span className="font-mono">{formatDH(selectedInvoice.reste_a_payer)}</span>
                  </div>
                </div>
              </div>

              {/* Legal Payment & Bank details (FA-4) */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div><strong className="text-slate-800">{t('invoices.bankTitle')}</strong></div>
                <div>{t('invoices.bankLine', { name: settings.company_name })}</div>
                <div className="font-mono font-bold text-slate-800">RIB : {settings.rib}</div>
                <div className="italic text-slate-500 pt-1">{settings.invoice_legal_notes}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Payment (FA-5 & FA-7) */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {t('invoices.payModalTitle', { num: selectedInvoice.numero })}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>{t('invoices.payTotalTtc')}</span>
                  <span className="font-mono font-bold text-slate-900">{formatDH(selectedInvoice.total_ttc)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>{t('invoices.payRemaining')}</span>
                  <span className="font-mono">{formatDH(selectedInvoice.reste_a_payer)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('invoices.payAmountLabel')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.montant}
                  onChange={(e) => setPaymentForm({ ...paymentForm, montant: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono text-sm font-bold"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  {t('invoices.payRuleNote')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.payMethodLabel')}</label>
                  <select
                    value={paymentForm.mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value as PaymentMethod })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="virement">{t('invoices.method.virement')}</option>
                    <option value="chèque">{t('invoices.method.chèque')}</option>
                    <option value="espèces">{t('invoices.method.espèces')}</option>
                    <option value="carte">{t('invoices.method.carte')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.payDateLabel')}</label>
                  <input
                    type="date"
                    value={paymentForm.date_paiement}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date_paiement: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.payRefLabel')}</label>
                  <input
                    type="text"
                    required
                    placeholder="VIR-BMCE-12345"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.payBankLabel')}</label>
                  <input
                    type="text"
                    value={paymentForm.banque}
                    onChange={(e) => setPaymentForm({ ...paymentForm, banque: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                >
                  {t('invoices.paySubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Credit Note (FA-10 & R3) */}
      {isCreditNoteModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {t('invoices.creditModalTitle', { num: selectedInvoice.numero })}
              </h3>
              <button onClick={() => setIsCreditNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreditNote} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                {t('invoices.creditRuleNote')}
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  {t('invoices.creditAmountLabel', { max: formatDH(selectedInvoice.total_ttc) })}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedInvoice.total_ttc}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('invoices.creditReasonLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('invoices.creditReasonPlaceholder')}
                  value={creditMotif}
                  onChange={(e) => setCreditMotif(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  {t('invoices.creditSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invoice Editor (FA-1) */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{t('invoices.editorTitle')}</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('projects.field.client')}</label>
                  <select
                    value={editorData.client_id}
                    onChange={(e) => setEditorData({ ...editorData, client_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.raison_sociale} ({c.ville})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.editorType')}</label>
                  <select
                    value={editorData.type}
                    onChange={(e) => setEditorData({ ...editorData, type: e.target.value as InvoiceType })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="vente">{t('invoices.type.vente')}</option>
                    <option value="maintenance">{t('invoices.type.maintenance')}</option>
                    <option value="service">{t('invoices.type.service')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.editorVat')}</label>
                  <input
                    type="number"
                    value={editorData.taux_tva}
                    onChange={(e) => setEditorData({ ...editorData, taux_tva: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.issueDate')}</label>
                  <input
                    type="date"
                    value={editorData.date_emission}
                    onChange={(e) => setEditorData({ ...editorData, date_emission: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('invoices.dueDate')}</label>
                  <input
                    type="date"
                    value={editorData.date_echeance}
                    onChange={(e) => setEditorData({ ...editorData, date_echeance: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Items Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{t('invoices.editorItems')}</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {t('invoices.editorAddLine')}
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
                  {editorData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-lg items-center">
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder={t('invoices.editorItemPlaceholder')}
                          value={item.designation}
                          onChange={(e) => handleItemChange(idx, 'designation', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          placeholder={t('invoices.col.qty')}
                          value={item.quantite}
                          onChange={(e) => handleItemChange(idx, 'quantite', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <input
                          type="number"
                          placeholder={t('invoices.col.unitPrice')}
                          value={item.prix_unitaire_ht}
                          onChange={(e) => handleItemChange(idx, 'prix_unitaire_ht', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-800">
                          {formatDH(item.total_ligne_ht)}
                        </span>
                        {editorData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation Strip */}
              <div className="bg-slate-100 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono">
                <div>{t('invoices.totalHt')} <strong>{formatDH(totals.totalHt)}</strong></div>
                <div>{t('invoices.vatLabel', { rate: totals.tauxTva })} <strong>{formatDH(totals.montantTva)}</strong></div>
                <div className="text-sm font-bold text-slate-900">{t('invoices.totalTtc')} {formatDH(totals.totalTtc)}</div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  {t('invoices.editorSaveDraft')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Extras cancellation */}
      {extrasTargetInvoice && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('invoices.extrasModalTitle', { num: extrasTargetInvoice.numero })}</span>
              </div>
              <button
                type="button"
                onClick={() => setExtrasTargetInvoice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('invoices.extrasLineLabel')}</label>
                <select
                  value={selectedExtraItemId}
                  onChange={(e) => setSelectedExtraItemId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  {(extrasTargetInvoice.items || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.designation} ({formatDH(item.total_ligne_ht)} HT)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('invoices.extrasReasonLabel')}</label>
                <textarea
                  rows={2}
                  value={extrasMotif}
                  onChange={(e) => setExtrasMotif(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setExtrasTargetInvoice(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = cancelExtras(extrasTargetInvoice.id, selectedExtraItemId, extrasMotif);
                  if (res.success) {
                    setExtrasNotice({
                      type: 'success',
                      text: t('invoices.extrasSuccess', { num: extrasTargetInvoice.numero }),
                    });
                  } else {
                    setExtrasNotice({
                      type: 'error',
                      text: res.error || t('invoices.extrasError'),
                    });
                  }
                  setExtrasTargetInvoice(null);
                  setTimeout(() => setExtrasNotice(null), 4500);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
              >
                {t('invoices.extrasConfirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
