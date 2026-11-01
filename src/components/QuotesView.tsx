/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Quote, InvoiceItem } from '../types';
import { calculateInvoiceTotals, formatDH } from '../utils/calculations';
import {
  FileText,
  Plus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  X,
  FileCheck,
} from 'lucide-react';

export const QuotesView: React.FC<{ onNavigateToInvoices: () => void }> = ({ onNavigateToInvoices }) => {
  const { quotes, clients, projects, settings, createQuote, convertQuoteToInvoice } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);

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
    createQuote(formData);
    setIsNewModalOpen(false);
  };

  const handleConvert = (quote: Quote) => {
    // FA-9: Conversion en facture en un clic
    const newInv = convertQuoteToInvoice(quote.id);
    setConvertedNotice(`Le devis ${quote.numero} a été converti avec succès en facture brouillon !`);
    setTimeout(() => setConvertedNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Devis Commerciaux</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module FA-9 · Création de propositions commerciales et conversion directe en factures
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Devis</span>
        </button>
      </div>

      {convertedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{convertedNotice}</span>
          </div>
          <button
            onClick={onNavigateToInvoices}
            className="font-bold underline text-emerald-800 hover:text-emerald-900"
          >
            Aller aux factures →
          </button>
        </div>
      )}

      {/* Quotes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Numéro</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Date & Validité</th>
                <th className="py-3 px-3 text-right">Total HT</th>
                <th className="py-3 px-3 text-right">Total TTC</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map((q) => {
                const client = clients.find((c) => c.id === q.client_id);

                return (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{q.numero}</td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{client?.raison_sociale}</div>
                      <div className="text-[11px] text-slate-400">{client?.ville}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-slate-700">{q.date_emission}</div>
                      <div className="text-[11px] text-slate-400">Valable jusqu'au {q.date_validite}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                      {formatDH(q.total_ht)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatDH(q.total_ttc)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm capitalize ${
                          q.statut === 'converti'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.statut === 'accepté'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {q.statut}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {q.statut !== 'converti' ? (
                        <button
                          onClick={() => handleConvert(q)}
                          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-md shadow-xs transition-colors ml-auto"
                          title="Convertir en facture (FA-9)"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Convertir en Facture (FA-9)</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Converti en facture</span>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Créer un Devis (FA-9)</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Client *</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.raison_sociale} ({c.statut})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Taux TVA (%)</label>
                  <input
                    type="number"
                    value={formData.taux_tva}
                    onChange={(e) => setFormData({ ...formData, taux_tva: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Items Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Prestations proposées</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    + Ajouter une ligne
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-lg items-center">
                      <div className="col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Désignation"
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
                      <div className="col-span-1 flex justify-end">
                        {formData.items.length > 1 && (
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

              <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                <div>Total HT : <strong>{formatDH(totals.totalHt)}</strong></div>
                <div>TVA ({totals.tauxTva}%) : <strong>{formatDH(totals.montantTva)}</strong></div>
                <div className="text-sm font-bold text-slate-900">Total TTC : {formatDH(totals.totalTtc)}</div>
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
                  Créer et enregistrer le devis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
