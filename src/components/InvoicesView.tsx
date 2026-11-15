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
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('invoices.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('invoices.subtitle')}
          </div>
        </div>

        <button
          onClick={handleOpenNewInvoice}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-xl shadow-[0_6px_16px_-4px_rgba(2,132,199,0.4)] transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('invoices.newBtn')}</span>
        </button>
      </div>

      {extrasNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 font-medium ${
            extrasNotice.type === 'success'
              ? 'bg-[#DCF4E8] border-[#A7DFC3] text-[#0E6245]'
              : 'bg-[#FCE8EC] border-[#F3BCC8] text-[#9F1239]'
          }`}
        >
          {extrasNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#0E6245] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#9F1239] shrink-0" />
          )}
          <span>{extrasNotice.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_4px_16px_-8px_rgba(11,23,51,0.08)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#647BA0] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('invoices.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-2 text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] placeholder:text-[#647BA0] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
          />
        </div>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] flex-1 sm:flex-none focus:outline-hidden focus:border-[#0284C7]"
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
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] flex-1 sm:flex-none focus:outline-hidden focus:border-[#0284C7]"
        >
          <option value="all">{t('invoices.allTypes')}</option>
          <option value="vente">{t('invoices.type.vente')}</option>
          <option value="maintenance">{t('invoices.type.maintenance')}</option>
          <option value="service">{t('invoices.type.service')}</option>
          <option value="avoir">{t('invoices.type.avoir')}</option>
        </select>
      </div>

      {/* Table of Invoices */}
      <div className="bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] overflow-hidden">
        {/* Mobile Card List (< md) */}
        <div className="md:hidden divide-y divide-[#DCE6F3]">
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
                    <div className="font-bold text-[#0D1B38] font-mono flex items-center gap-1.5">
                      {isLocked && <Lock className="w-3 h-3 text-[#647BA0] shrink-0" />}
                      <span>{inv.numero}</span>
                      <span className="text-[10px] uppercase font-sans font-semibold text-[#546A8E]">
                        · {translateInvoiceType(inv.type)}
                      </span>
                    </div>
                    <div className="font-semibold text-[#1C2E4F] truncate mt-0.5">
                      {client?.raison_sociale || t('common.client')}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0 border ${
                      inv.statut === 'payée'
                        ? 'bg-[#DCF4E8] text-[#0E6245] border-[#A7DFC3]'
                        : inv.statut === 'payée partiellement'
                        ? 'bg-[#DFF0FC] text-[#035388] border-[#A5D3F3]'
                        : inv.statut === 'validée'
                        ? 'bg-[#E2EAF5] text-[#1E355E] border-[#B8CAE2]'
                        : inv.statut === 'annulée'
                        ? 'bg-[#FCE8EC] text-[#9F1239] border-[#F3BCC8]'
                        : 'bg-[#FEF3D6] text-[#8F5600] border-[#F2D388]'
                    }`}
                  >
                    {translateInvoiceStatus(inv.statut)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#E6EEF8] border border-[#D5E2F1] p-2.5 rounded-xl text-[11px]">
                  <div>
                    <span className="text-[#546A8E] block">{t('invoices.col.totalTtc')}</span>
                    <span className="font-mono font-bold text-[#0D1B38]">{formatDH(inv.total_ttc)}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-[#546A8E] block">{t('invoices.col.remaining')}</span>
                    <span className="font-mono font-semibold text-[#8F5600]">{formatDH(inv.reste_a_payer)}</span>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-[#CFDDED]">
                    <span className="text-[#273B63]">{inv.date_emission}</span>
                    <span className={isOverdue ? 'text-[#9F1239] font-semibold' : 'text-[#546A8E]'}>
                      {t('invoices.duePrefix')} {inv.date_echeance} {isOverdue && t('invoices.overdueTag')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {inv.statut === 'brouillon' && canValidate && (
                    <button
                      onClick={() => handleValidate(inv)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] rounded-lg shadow-xs whitespace-nowrap"
                    >
                      {t('invoices.validateBtn')}
                    </button>
                  )}

                  {isLocked && inv.reste_a_payer > 0 && inv.type !== 'avoir' && (
                    <button
                      onClick={() => handleOpenPayment(inv)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-[#0E6245] bg-[#DCF4E8] hover:bg-[#CDEEDB] border border-[#A7DFC3] rounded-lg whitespace-nowrap"
                    >
                      {t('invoices.recordPayBtn')}
                    </button>
                  )}

                  {isLocked && inv.type !== 'avoir' && (
                    <button
                      onClick={() => handleOpenCreditNote(inv)}
                      className="px-2.5 py-1.5 text-[11px] text-[#273B63] bg-[#E6EEF8] border border-[#C9D9EC] rounded-lg whitespace-nowrap"
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
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-[#8F5600] bg-[#FEF3D6] border border-[#F2D388] rounded-lg whitespace-nowrap"
                    >
                      {t('invoices.cancelExtrasBtn')}
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-[#1C2E4F] bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-lg whitespace-nowrap"
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
            <thead className="bg-[#E6EEF8] text-[#455B80] font-semibold border-b border-[#CFDDED]">
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
            <tbody className="divide-y divide-[#DCE6F3]">
              {filteredInvoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.client_id);
                const isLocked = inv.statut !== 'brouillon' && inv.statut !== 'envoyée';
                const isOverdue =
                  ['validée', 'payée partiellement'].includes(inv.statut) &&
                  inv.date_echeance < new Date().toISOString().split('T')[0] &&
                  inv.reste_a_payer > 0;

                return (
                  <tr key={inv.id} className="hover:bg-[#E7EFFA] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0D1B38] font-mono flex items-center gap-1.5">
                        {isLocked && (
                          <span title={t('common.locked')} className="inline-flex">
                            <Lock className="w-3 h-3 text-[#647BA0]" />
                          </span>
                        )}
                        <span>{inv.numero}</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[#546A8E]">
                        {translateInvoiceType(inv.type)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1C2E4F]">{client?.raison_sociale || t('common.client')}</div>
                      <div className="text-[11px] text-[#546A8E] font-mono">ICE: {client?.ice || 'N/A'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-[#273B63]">{inv.date_emission}</div>
                      <div className={`text-[11px] ${isOverdue ? 'text-[#9F1239] font-semibold' : 'text-[#546A8E]'}`}>
                        {t('invoices.duePrefix')} {inv.date_echeance} {isOverdue && t('invoices.overdueTag')}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-bold text-[#0D1B38] whitespace-nowrap">
                      {formatDH(inv.total_ttc)}
                    </td>

                    <td className="py-3 px-3 text-end font-mono font-semibold text-[#8F5600] whitespace-nowrap">
                      {formatDH(inv.reste_a_payer)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                          inv.statut === 'payée'
                            ? 'bg-[#DCF4E8] text-[#0E6245] border-[#A7DFC3]'
                            : inv.statut === 'payée partiellement'
                            ? 'bg-[#DFF0FC] text-[#035388] border-[#A5D3F3]'
                            : inv.statut === 'validée'
                            ? 'bg-[#E2EAF5] text-[#1E355E] border-[#B8CAE2]'
                            : inv.statut === 'annulée'
                            ? 'bg-[#FCE8EC] text-[#9F1239] border-[#F3BCC8]'
                            : 'bg-[#FEF3D6] text-[#8F5600] border-[#F2D388]'
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
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-lg transition-colors shadow-xs whitespace-nowrap"
                            title={t('invoices.validateTitle')}
                          >
                            {t('invoices.validateBtn')}
                          </button>
                        )}

                        {isLocked && inv.reste_a_payer > 0 && inv.type !== 'avoir' && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0E6245] bg-[#DCF4E8] hover:bg-[#CDEEDB] border border-[#A7DFC3] rounded-lg transition-colors whitespace-nowrap"
                          >
                            {t('invoices.recordPayBtn')}
                          </button>
                        )}

                        {isLocked && inv.type !== 'avoir' && (
                          <button
                            onClick={() => handleOpenCreditNote(inv)}
                            className="px-2 py-1 text-[11px] text-[#273B63] hover:text-[#0D1B38] bg-[#E6EEF8] border border-[#C9D9EC] rounded-lg transition-colors whitespace-nowrap"
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
                            className="px-2 py-1 text-[11px] font-semibold text-[#8F5600] bg-[#FEF3D6] hover:bg-[#FDE8B4] border border-[#F2D388] rounded-lg transition-colors whitespace-nowrap"
                            title={t('invoices.cancelExtrasTitle')}
                          >
                            {t('invoices.cancelExtrasBtn')}
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#1C2E4F] bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-lg transition-colors whitespace-nowrap"
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto print-page">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE6F3] pb-3 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#0284C7] shrink-0" />
                <h3 className="text-sm font-bold text-[#0D1B38]">
                  {selectedInvoice.type === 'avoir' ? t('invoices.docCredit') : t('invoices.docInvoice')} : {selectedInvoice.numero}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white text-xs rounded-xl font-medium shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('invoices.printDownload')}</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] text-[#1C2E4F] text-xs rounded-xl font-medium"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>

            {/* Invoice Print Document */}
            <div className="p-3.5 sm:p-6 bg-[#F5F8FD] border border-[#CFDDED] rounded-xl text-xs space-y-5 sm:space-y-6">
              {/* Header: Company & Client */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#CFDDED] pb-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <img
                    src="/assets/aistudio/devnappLogo_10b7b539.jpg"
                    alt="DEVNAPP SARL"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-contain bg-[#0B1733] p-1.5 shadow-sm border border-[#1E3566] shrink-0"
                  />
                  <div>
                    <h1 className="text-base sm:text-lg font-bold text-[#0D1B38] tracking-tight">{settings.company_name}</h1>
                    <div className="text-[#0284C7] font-semibold text-[10px] tracking-wider uppercase">{t('app.tagline')}</div>
                    <div className="text-[#3C5073] text-[11px] mt-1 space-y-0.5">
                      <div>{settings.adresse}</div>
                      <div>{settings.ville}</div>
                      <div dir="ltr">{settings.telephone} · {settings.email}</div>
                      <div className="font-mono text-[#273B63] pt-1">
                        ICE : {settings.ice} · IF : {settings.if_number}
                      </div>
                      <div className="font-mono text-[#273B63]">
                        RC : {settings.rc} · Patente : {settings.patente}
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const client = clients.find((c) => c.id === selectedInvoice.client_id);
                  return (
                    <div className="text-start sm:text-end bg-[#E6EEF8] p-3 rounded-xl border border-[#D5E2F1] w-full sm:w-auto sm:min-w-[220px]">
                      <div className="text-[10px] font-semibold text-[#546A8E] uppercase tracking-wider">{t('invoices.billedTo')}</div>
                      <div className="font-bold text-sm text-[#0D1B38] mt-0.5">{client?.raison_sociale}</div>
                      <div className="text-[11px] text-[#3C5073] mt-1">{client?.adresse}</div>
                      <div className="text-[11px] text-[#3C5073]">{client?.ville}</div>
                      <div className="text-[11px] font-mono text-[#273B63] mt-1">
                        ICE : {client?.ice || 'N/A'}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Invoice details strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#E6EEF8] border border-[#D5E2F1] p-3 rounded-xl text-[11px]">
                <div>
                  <span className="text-[#546A8E]">{t('invoices.docNumber')}</span>
                  <div className="font-mono font-bold text-[#0D1B38]">{selectedInvoice.numero}</div>
                </div>
                <div>
                  <span className="text-[#546A8E]">{t('invoices.issueDate')}</span>
                  <div className="font-medium text-[#0D1B38]">{selectedInvoice.date_emission}</div>
                </div>
                <div>
                  <span className="text-[#546A8E]">{t('invoices.dueDate')}</span>
                  <div className="font-medium text-[#0D1B38]">{selectedInvoice.date_echeance}</div>
                </div>
                <div>
                  <span className="text-[#546A8E]">{t('invoices.validationStatus')}</span>
                  <div className="font-semibold text-[#0284C7]">{translateInvoiceStatus(selectedInvoice.statut)}</div>
                </div>
              </div>

              {/* Line items table */}
              <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border border-[#CFDDED] min-w-[500px]">
                <thead className="bg-[#E6EEF8] font-semibold text-[#273B63]">
                  <tr>
                    <th className="p-2.5 text-start">{t('payroll.col.designation')}</th>
                    <th className="p-2.5 text-center">{t('invoices.col.qty')}</th>
                    <th className="p-2.5 text-end">{t('invoices.col.unitPrice')}</th>
                    <th className="p-2.5 text-end">{t('invoices.col.discount')}</th>
                    <th className="p-2.5 text-end">{t('invoices.col.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F3] font-mono text-[11px]">
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-medium text-[#1C2E4F]">{item.designation}</td>
                      <td className="p-2.5 text-center text-[#273B63]">{item.quantite} {item.unite}</td>
                      <td className="p-2.5 text-end text-[#273B63]">{formatDH(item.prix_unitaire_ht)}</td>
                      <td className="p-2.5 text-end text-[#546A8E]">{item.remise_ligne > 0 ? formatDH(item.remise_ligne) : '-'}</td>
                      <td className="p-2.5 text-end font-semibold text-[#0D1B38]">{formatDH(item.total_ligne_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Totals computation */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 text-[#3C5073]">
                    <span>{t('invoices.totalHt')}</span>
                    <span className="font-mono font-medium">{formatDH(selectedInvoice.total_ht)}</span>
                  </div>
                  {selectedInvoice.remise > 0 && (
                    <div className="flex justify-between py-1 text-[#9F1239]">
                      <span>{t('invoices.discountLabel')}</span>
                      <span className="font-mono font-medium">-{formatDH(selectedInvoice.remise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 text-[#3C5073]">
                    <span>{t('invoices.vatLabel', { rate: selectedInvoice.taux_tva })}</span>
                    <span className="font-mono font-medium">{formatDH(selectedInvoice.montant_tva)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-b border-[#CFDDED] text-sm font-bold text-[#0D1B38]">
                    <span>{t('invoices.totalTtc')}</span>
                    <span className="font-mono text-base">{formatDH(selectedInvoice.total_ttc)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#3C5073] text-[11px]">
                    <span>{t('invoices.paidAmount')}</span>
                    <span className="font-mono text-[#0E6245] font-semibold">{formatDH(selectedInvoice.montant_paye)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-[#8F5600] text-xs">
                    <span>{t('invoices.col.remaining')} :</span>
                    <span className="font-mono">{formatDH(selectedInvoice.reste_a_payer)}</span>
                  </div>
                </div>
              </div>

              {/* Legal Payment & Bank details (FA-4) */}
              <div className="pt-4 border-t border-[#CFDDED] text-[11px] text-[#3C5073] space-y-1">
                <div><strong className="text-[#0D1B38]">{t('invoices.bankTitle')}</strong></div>
                <div>{t('invoices.bankLine', { name: settings.company_name })}</div>
                <div className="font-mono font-bold text-[#0D1B38]">RIB : {settings.rib}</div>
                <div className="italic text-[#546A8E] pt-1">{settings.invoice_legal_notes}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Payment (FA-5 & FA-7) */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <h3 className="text-sm font-bold text-[#0D1B38]">
                {t('invoices.payModalTitle', { num: selectedInvoice.numero })}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 bg-[#FCE8EC] border border-[#F3BCC8] text-[#9F1239] text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#E6EEF8] border border-[#D5E2F1] rounded-xl text-[#3C5073] space-y-1">
                <div className="flex justify-between">
                  <span>{t('invoices.payTotalTtc')}</span>
                  <span className="font-mono font-bold text-[#0D1B38]">{formatDH(selectedInvoice.total_ttc)}</span>
                </div>
                <div className="flex justify-between text-[#8F5600] font-semibold">
                  <span>{t('invoices.payRemaining')}</span>
                  <span className="font-mono">{formatDH(selectedInvoice.reste_a_payer)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.payAmountLabel')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.montant}
                  onChange={(e) => setPaymentForm({ ...paymentForm, montant: Number(e.target.value) })}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-sm font-bold text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
                <div className="text-[11px] text-[#546A8E] mt-1">
                  {t('invoices.payRuleNote')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.payMethodLabel')}</label>
                  <select
                    value={paymentForm.mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value as PaymentMethod })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    <option value="virement">{t('invoices.method.virement')}</option>
                    <option value="chèque">{t('invoices.method.chèque')}</option>
                    <option value="espèces">{t('invoices.method.espèces')}</option>
                    <option value="carte">{t('invoices.method.carte')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.payDateLabel')}</label>
                  <input
                    type="date"
                    value={paymentForm.date_paiement}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date_paiement: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.payRefLabel')}</label>
                  <input
                    type="text"
                    required
                    placeholder="VIR-BMCE-12345"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.payBankLabel')}</label>
                  <input
                    type="text"
                    value={paymentForm.banque}
                    onChange={(e) => setPaymentForm({ ...paymentForm, banque: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-xl text-[#1C2E4F] font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0E7A55] hover:bg-[#0B6345] text-white rounded-xl font-semibold shadow-xs"
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <h3 className="text-sm font-bold text-[#0D1B38]">
                {t('invoices.creditModalTitle', { num: selectedInvoice.numero })}
              </h3>
              <button onClick={() => setIsCreditNoteModalOpen(false)} className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreditNote} className="space-y-3.5 text-xs">
              <div className="p-3 bg-[#FEF3D6] border border-[#F2D388] rounded-xl text-[#8F5600] font-medium">
                {t('invoices.creditRuleNote')}
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">
                  {t('invoices.creditAmountLabel', { max: formatDH(selectedInvoice.total_ttc) })}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedInvoice.total_ttc}
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.creditReasonLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('invoices.creditReasonPlaceholder')}
                  value={creditMotif}
                  onChange={(e) => setCreditMotif(e.target.value)}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-4 py-2 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-xl text-[#1C2E4F] font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white rounded-xl font-semibold shadow-xs"
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl border border-[#C9D9EC] shadow-2xl max-w-3xl w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38]">{t('invoices.editorTitle')}</h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('projects.field.client')}</label>
                  <select
                    value={editorData.client_id}
                    onChange={(e) => setEditorData({ ...editorData, client_id: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.raison_sociale} ({c.ville})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.editorType')}</label>
                  <select
                    value={editorData.type}
                    onChange={(e) => setEditorData({ ...editorData, type: e.target.value as InvoiceType })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    <option value="vente">{t('invoices.type.vente')}</option>
                    <option value="maintenance">{t('invoices.type.maintenance')}</option>
                    <option value="service">{t('invoices.type.service')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.editorVat')}</label>
                  <input
                    type="number"
                    value={editorData.taux_tva}
                    onChange={(e) => setEditorData({ ...editorData, taux_tva: Number(e.target.value) })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.issueDate')}</label>
                  <input
                    type="date"
                    value={editorData.date_emission}
                    onChange={(e) => setEditorData({ ...editorData, date_emission: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-[#273B63] mb-1 font-semibold">{t('invoices.dueDate')}</label>
                  <input
                    type="date"
                    value={editorData.date_echeance}
                    onChange={(e) => setEditorData({ ...editorData, date_echeance: e.target.value })}
                    className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* Items Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0D1B38]">{t('invoices.editorItems')}</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-[#0284C7] hover:text-[#0369A1] font-semibold"
                  >
                    {t('invoices.editorAddLine')}
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pe-1">
                  {editorData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 bg-[#E6EEF8] border border-[#D5E2F1] rounded-xl items-center">
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder={t('invoices.editorItemPlaceholder')}
                          value={item.designation}
                          onChange={(e) => handleItemChange(idx, 'designation', e.target.value)}
                          className="w-full p-2 bg-[#F5F8FD] border border-[#C9D9EC] rounded-lg text-xs text-[#0D1B38]"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          placeholder={t('invoices.col.qty')}
                          value={item.quantite}
                          onChange={(e) => handleItemChange(idx, 'quantite', Number(e.target.value))}
                          className="w-full p-2 bg-[#F5F8FD] border border-[#C9D9EC] rounded-lg text-xs font-mono text-[#0D1B38]"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <input
                          type="number"
                          placeholder={t('invoices.col.unitPrice')}
                          value={item.prix_unitaire_ht}
                          onChange={(e) => handleItemChange(idx, 'prix_unitaire_ht', Number(e.target.value))}
                          className="w-full p-2 bg-[#F5F8FD] border border-[#C9D9EC] rounded-lg text-xs font-mono text-[#0D1B38]"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#0D1B38]">
                          {formatDH(item.total_ligne_ht)}
                        </span>
                        {editorData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-[#C81E4A] hover:text-[#9F1239]"
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
              <div className="bg-[#E6EEF8] border border-[#CFDDED] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-mono text-[#1C2E4F]">
                <div>{t('invoices.totalHt')} <strong>{formatDH(totals.totalHt)}</strong></div>
                <div>{t('invoices.vatLabel', { rate: totals.tauxTva })} <strong>{formatDH(totals.montantTva)}</strong></div>
                <div className="text-sm font-bold text-[#0D1B38]">{t('invoices.totalTtc')} {formatDH(totals.totalTtc)}</div>
              </div>

              <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-xl text-[#1C2E4F] font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-white rounded-xl font-semibold shadow-xs"
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
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] rounded-2xl shadow-2xl border border-[#C9D9EC] max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F3] pb-3">
              <div className="flex items-center gap-2 text-[#8F5600] font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('invoices.extrasModalTitle', { num: extrasTargetInvoice.numero })}</span>
              </div>
              <button
                type="button"
                onClick={() => setExtrasTargetInvoice(null)}
                className="p-1.5 rounded-lg text-[#546A8E] hover:text-[#0D1B38] hover:bg-[#E2EAF5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#3C5073] space-y-3">
              <div>
                <label className="block text-[#273B63] font-semibold mb-1">{t('invoices.extrasLineLabel')}</label>
                <select
                  value={selectedExtraItemId}
                  onChange={(e) => setSelectedExtraItemId(e.target.value)}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                >
                  {(extrasTargetInvoice.items || []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.designation} ({formatDH(item.total_ligne_ht)} HT)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#273B63] font-semibold mb-1">{t('invoices.extrasReasonLabel')}</label>
                <textarea
                  rows={2}
                  value={extrasMotif}
                  onChange={(e) => setExtrasMotif(e.target.value)}
                  className="w-full p-2.5 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE6F3] flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setExtrasTargetInvoice(null)}
                className="px-4 py-2 bg-[#E6EEF8] hover:bg-[#DAE5F4] border border-[#C9D9EC] rounded-xl text-[#1C2E4F] font-medium"
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
                className="px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded-xl font-semibold"
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
