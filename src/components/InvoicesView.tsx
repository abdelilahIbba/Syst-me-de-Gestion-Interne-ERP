/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice, InvoiceItem, InvoiceType, PaymentMethod } from '../types';
import { calculateInvoiceTotals, formatDH } from '../utils/calculations';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Printer,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  FileText,
  X,
  Trash2,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const {
    invoices,
    clients,
    projects,
    contracts,
    settings,
    currentUser,
    createInvoice,
    updateDraftInvoice,
    validateInvoice,
    createCreditNote,
    registerPayment,
  } = useApp();

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

  const canValidate = ['admin', 'comptable'].includes(currentUser.role);

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
    // update line total
    const qty = Number(newItems[index].quantite) || 0;
    const pu = Number(newItems[index].prix_unitaire_ht) || 0;
    const rem = Number(newItems[index].remise_ligne) || 0;
    newItems[index].total_ligne_ht = Math.max(0, qty * pu - rem);
    setEditorData({ ...editorData, items: newItems });
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorData.client_id || editorData.items.length === 0) return;

    if (editorData.id) {
      updateDraftInvoice(editorData.id, editorData);
    } else {
      createInvoice(editorData);
    }
    setIsEditorOpen(false);
  };

  const handleValidate = (inv: Invoice) => {
    const result = validateInvoice(inv.id);
    if (!result.success) {
      alert(result.error);
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
      setPaymentError(result.error || 'Erreur lors du paiement');
      return;
    }

    setIsPaymentModalOpen(false);
    // Refresh selected invoice view
    const updated = invoices.find((i) => i.id === selectedInvoice.id);
    if (updated) setSelectedInvoice(updated);
  };

  const handleOpenCreditNote = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setCreditAmount(inv.total_ttc);
    setCreditMotif('Avoir commercial / annulation de prestation');
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Facturation & Avoirs</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module FA-1 à FA-12 · Conforme mentions légales marocaines, verrouillage post-validation et numérotation séquentielle
          </div>
        </div>

        <button
          onClick={handleOpenNewInvoice}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Facture</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° facture ou client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
        >
          <option value="all">Tous Statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="validée">Validée (Verrouillée)</option>
          <option value="payée partiellement">Payée Partiellement</option>
          <option value="payée">Payée</option>
          <option value="annulée">Annulée</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
        >
          <option value="all">Tous Types</option>
          <option value="vente">Vente</option>
          <option value="maintenance">Maintenance</option>
          <option value="service">Service / Régie</option>
          <option value="avoir">Avoir (AV)</option>
        </select>
      </div>

      {/* Table of Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Numéro</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Émission & Échéance</th>
                <th className="py-3 px-3 text-right">Montant TTC</th>
                <th className="py-3 px-3 text-right">Reste à Payer</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
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
                        {isLocked && <Lock className="w-3 h-3 text-slate-400" title="Facture verrouillée" />}
                        <span>{inv.numero}</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">{inv.type}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{client?.raison_sociale || 'Client'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ICE: {client?.ice || 'N/A'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-700">{inv.date_emission}</div>
                      <div className={`text-[11px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        Éch : {inv.date_echeance} {isOverdue && '(En retard)'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatDH(inv.total_ttc)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-amber-700 whitespace-nowrap">
                      {formatDH(inv.reste_a_payer)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm capitalize ${
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
                        {inv.statut}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Validation button (FA-3: Admin/Comptable only) */}
                      {inv.statut === 'brouillon' && canValidate && (
                        <button
                          onClick={() => handleValidate(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-md transition-colors shadow-xs"
                          title="Attribue le numéro officiel séquentiel et verrouille la facture"
                        >
                          Valider (FA-3)
                        </button>
                      )}

                      {/* Register Payment button (FA-5) */}
                      {isLocked && inv.reste_a_payer > 0 && inv.type !== 'avoir' && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          Enregistrer Paiement
                        </button>
                      )}

                      {/* Credit Note button (FA-10 & R3: Correction post-validation uniquement par avoir) */}
                      {isLocked && inv.type !== 'avoir' && (
                        <button
                          onClick={() => handleOpenCreditNote(inv)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 rounded-md transition-colors"
                          title="Créer un avoir (FA-10)"
                        >
                          Avoir
                        </button>
                      )}

                      {/* PDF View */}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Aperçu PDF
                      </button>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto print-page">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedInvoice.type === 'avoir' ? 'AVOIR' : 'FACTURE'} : {selectedInvoice.numero}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs rounded-lg font-medium shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / Télécharger PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Invoice Print Document */}
            <div className="p-6 border border-slate-200 rounded-lg text-xs space-y-6">
              {/* Header: Company & Client */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div className="flex items-start gap-4">
                  <img
                    src="/assets/aistudio/devnappLogo_10b7b539.jpg"
                    alt="DEVNAPP SARL"
                    className="w-16 h-16 rounded-xl object-contain bg-slate-950 p-1.5 shadow-sm border border-slate-800"
                  />
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">{settings.company_name}</h1>
                    <div className="text-cyan-700 font-semibold text-[10px] tracking-wider uppercase">DNA Digital Solutions</div>
                    <div className="text-slate-600 text-[11px] mt-1 space-y-0.5">
                      <div>{settings.adresse}</div>
                      <div>{settings.ville} · Maroc</div>
                      <div>Tél : {settings.telephone} · Email : {settings.email}</div>
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
                    <div className="text-right bg-slate-50 p-3 rounded-lg border border-slate-100 min-w-[220px]">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Facturé à :</div>
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
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg text-[11px]">
                <div>
                  <span className="text-slate-500">Numéro de pièce :</span>
                  <div className="font-mono font-bold text-slate-900">{selectedInvoice.numero}</div>
                </div>
                <div>
                  <span className="text-slate-500">Date d'émission :</span>
                  <div className="font-medium text-slate-900">{selectedInvoice.date_emission}</div>
                </div>
                <div>
                  <span className="text-slate-500">Date d'échéance :</span>
                  <div className="font-medium text-slate-900">{selectedInvoice.date_echeance}</div>
                </div>
                <div>
                  <span className="text-slate-500">Statut de validation :</span>
                  <div className="font-semibold text-blue-700 capitalize">{selectedInvoice.statut}</div>
                </div>
              </div>

              {/* Line items table */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="p-2.5">Désignation</th>
                    <th className="p-2.5 text-center">Quantité</th>
                    <th className="p-2.5 text-right">Prix Unitaire HT</th>
                    <th className="p-2.5 text-right">Remise</th>
                    <th className="p-2.5 text-right">Total Ligne HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(selectedInvoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-medium text-slate-800">{item.designation}</td>
                      <td className="p-2.5 text-center">{item.quantite} {item.unite}</td>
                      <td className="p-2.5 text-right">{formatDH(item.prix_unitaire_ht)}</td>
                      <td className="p-2.5 text-right">{item.remise_ligne > 0 ? formatDH(item.remise_ligne) : '-'}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-900">{formatDH(item.total_ligne_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals computation */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Total HT :</span>
                    <span className="font-mono font-medium">{formatDH(selectedInvoice.total_ht)}</span>
                  </div>
                  {selectedInvoice.remise > 0 && (
                    <div className="flex justify-between py-1 text-rose-600">
                      <span>Remise :</span>
                      <span className="font-mono font-medium">-{formatDH(selectedInvoice.remise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>TVA ({selectedInvoice.taux_tva}%) :</span>
                    <span className="font-mono font-medium">{formatDH(selectedInvoice.montant_tva)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-b border-slate-200 text-sm font-bold text-slate-900">
                    <span>Total TTC :</span>
                    <span className="font-mono text-base">{formatDH(selectedInvoice.total_ttc)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 text-[11px]">
                    <span>Montant Encaissé :</span>
                    <span className="font-mono text-emerald-700">{formatDH(selectedInvoice.montant_paye)}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold text-amber-700 text-xs">
                    <span>Reste à Payer :</span>
                    <span className="font-mono">{formatDH(selectedInvoice.reste_a_payer)}</span>
                  </div>
                </div>
              </div>

              {/* Legal Payment & Bank details (FA-4) */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div><strong className="text-slate-800">Coordonnées bancaires pour virement :</strong></div>
                <div>Banque : BMCE Bank of Africa · Titulaire : {settings.company_name}</div>
                <div className="font-mono font-bold text-slate-800">RIB : {settings.rib}</div>
                <div className="italic text-slate-500 pt-1">{settings.invoice_legal_notes}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Record Payment (FA-5 & FA-7) */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Enregistrer un Paiement ({selectedInvoice.numero})
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
                  <span>Total TTC de la facture :</span>
                  <span className="font-mono font-bold text-slate-900">{formatDH(selectedInvoice.total_ttc)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>Reste à payer actuel :</span>
                  <span className="font-mono">{formatDH(selectedInvoice.reste_a_payer)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Montant encaissé (DH) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.montant}
                  onChange={(e) => setPaymentForm({ ...paymentForm, montant: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono text-sm font-bold"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Règle FA-7 : le système bloque strictement tout paiement supérieur au reste dû.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Mode de paiement</label>
                  <select
                    value={paymentForm.mode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value as PaymentMethod })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="virement">Virement bancaire</option>
                    <option value="chèque">Chèque</option>
                    <option value="espèces">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Date d'encaissement</label>
                  <input
                    type="date"
                    value={paymentForm.date_paiement}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date_paiement: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Référence / N° Chèque</label>
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
                  <label className="block text-slate-600 mb-1 font-medium">Banque</label>
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
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                >
                  Valider l'encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Credit Note (FA-10 & R3) */}
      {isCreditNoteModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Émettre un Avoir sur la facture {selectedInvoice.numero} (FA-10)
              </h3>
              <button onClick={() => setIsCreditNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreditNote} className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                Règle R3 : Une facture validée est non modifiable. Toute correction fiscale doit faire l'objet d'un avoir
                numéroté sous la série <span className="font-mono font-bold">AV-2026-XXXX</span>.
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Montant de l'avoir TTC (Max {formatDH(selectedInvoice.total_ttc)})</label>
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
                <label className="block text-slate-600 mb-1 font-medium">Motif légal de l'avoir *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rectification prestation, remise accordée..."
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
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Générer l'avoir officiel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invoice Editor (FA-1) */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Éditeur de Facture (FA-1)</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Client *</label>
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
                  <label className="block text-slate-600 mb-1 font-medium">Type de facture</label>
                  <select
                    value={editorData.type}
                    onChange={(e) => setEditorData({ ...editorData, type: e.target.value as InvoiceType })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="vente">Vente Logiciel</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="service">Service / Régie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Taux TVA (%)</label>
                  <input
                    type="number"
                    value={editorData.taux_tva}
                    onChange={(e) => setEditorData({ ...editorData, taux_tva: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Date d'émission</label>
                  <input
                    type="date"
                    value={editorData.date_emission}
                    onChange={(e) => setEditorData({ ...editorData, date_emission: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Date d'échéance</label>
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
                  <span className="font-semibold text-slate-900">Lignes d'articles</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    + Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editorData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-lg items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Désignation de la prestation"
                          value={item.designation}
                          onChange={(e) => handleItemChange(idx, 'designation', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qté"
                          value={item.quantite}
                          onChange={(e) => handleItemChange(idx, 'quantite', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Prix unitaire HT"
                          value={item.prix_unitaire_ht}
                          onChange={(e) => handleItemChange(idx, 'prix_unitaire_ht', Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
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
              <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                <div>Total HT : <strong>{formatDH(totals.totalHt)}</strong></div>
                <div>TVA ({totals.tauxTva}%) : <strong>{formatDH(totals.montantTva)}</strong></div>
                <div className="text-sm font-bold text-slate-900">Total TTC : {formatDH(totals.totalTtc)}</div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Enregistrer en Brouillon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
