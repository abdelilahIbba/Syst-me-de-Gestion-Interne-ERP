/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDH } from '../utils/calculations';
import {
  BellRing,
  MessageSquare,
  Mail,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Send,
  Building2,
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const { invoices, clients, settings } = useApp();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [reminderType, setReminderType] = useState<'whatsapp' | 'email'>('whatsapp');
  const [reminderHistory, setReminderHistory] = useState<
    Array<{ id: string; date: string; invoice: string; client: string; type: string }>
  >([]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter overdue unpaid invoices (FA-8)
  const overdueInvoices = invoices
    .filter(
      (inv) =>
        ['validée', 'payée partiellement'].includes(inv.statut) &&
        inv.reste_a_payer > 0 &&
        new Date(inv.date_echeance) < today
    )
    .map((inv) => {
      const echeance = new Date(inv.date_echeance);
      const diffDays = Math.ceil((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24));
      const client = clients.find((c) => c.id === inv.client_id);
      return {
        ...inv,
        daysOverdue: diffDays,
        client,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);

  const selectedInv = overdueInvoices.find((i) => i.id === selectedInvoiceId) || overdueInvoices[0];

  const generateMessage = (inv: typeof overdueInvoices[0], type: 'whatsapp' | 'email') => {
    if (!inv || !inv.client) return '';
    const contact = inv.client.contact_nom || inv.client.raison_sociale;

    if (type === 'whatsapp') {
      return `Bonjour ${contact},\n\nSauf erreur de notre part, la facture n° *${inv.numero}* d'un montant de *${formatDH(
        inv.reste_a_payer
      )}* arrivée à échéance le ${inv.date_echeance} (${inv.daysOverdue} jours de retard) est toujours en attente de règlement auprès de notre service comptable.\n\nMerci de bien vouloir nous transmettre l'ordre de virement bancaire par retour de message.\n\n*${settings.company_name}*\nRIB : ${settings.rib}`;
    }

    return `Objet : RAPPEL - Facture échue ${inv.numero} - ${settings.company_name}\n\nMadame, Monsieur ${contact},\n\nNous vous prions de trouver ci-joint le rappel concernant la facture ${inv.numero} émise le ${inv.date_emission} pour un reste dû de ${formatDH(
      inv.reste_a_payer
    )} TTC, échue depuis le ${inv.date_echeance}.\n\nNous vous remercions de procéder à sa régularisation par virement bancaire sur notre compte BMCE :\nRIB : ${settings.rib}\n\nRestant à votre entière disposition pour tout renseignement complémentaire.\n\nCordialement,\nService Comptabilité - ${settings.company_name}`;
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleLogReminder = () => {
    if (!selectedInv) return;
    setReminderHistory([
      {
        id: `REM-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        invoice: selectedInv.numero,
        client: selectedInv.client?.raison_sociale || '',
        type: reminderType,
      },
      ...reminderHistory,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Relances Factures Impayées</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          Module FA-8 · Suivi des créances échues et modèles de communication pré-remplis (Email & WhatsApp)
        </div>
      </div>

      {overdueInvoices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Clock className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">Aucune facture en retard d'échéance !</h3>
          <p className="text-xs text-slate-500 mt-1">Toutes les factures clients sont soit payées, soit encore dans leur délai contractuel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Overdue List (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Factures en Retard ({overdueInvoices.length})
              </span>
              <span className="text-[11px] font-mono text-rose-700 font-bold">
                {formatDH(overdueInvoices.reduce((s, i) => s + i.reste_a_payer, 0))}
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
              {overdueInvoices.map((inv) => {
                const isSelected = selectedInv?.id === inv.id;

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/80 border-l-2 border-l-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900 font-mono">{inv.numero}</div>
                        <div className="text-xs text-slate-700 font-medium mt-0.5">
                          {inv.client?.raison_sociale}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-700 text-xs">
                          {formatDH(inv.reste_a_payer)}
                        </div>
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-sm">
                          +{inv.daysOverdue} j. retard
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Reminder Composer & Template (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            {selectedInv ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Modèle de Relance : {selectedInv.numero}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Client : <strong>{selectedInv.client?.raison_sociale}</strong> (Tél: {selectedInv.client?.telephone})
                    </div>
                  </div>

                  {/* Channel Switcher */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                    <button
                      onClick={() => setReminderType('whatsapp')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                        reminderType === 'whatsapp' ? 'bg-white text-emerald-800 font-semibold shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setReminderType('email')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                        reminderType === 'email' ? 'bg-white text-blue-800 font-semibold shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email</span>
                    </button>
                  </div>
                </div>

                {/* Pre-filled Message Area */}
                <div>
                  <textarea
                    rows={8}
                    readOnly
                    value={generateMessage(selectedInv, reminderType)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed text-slate-800 focus:outline-hidden"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Cliquez pour copier et envoyer via votre messagerie ou WhatsApp Web.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyMessage(generateMessage(selectedInv, reminderType), selectedInv.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {copiedId === selectedInv.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copié dans le presse-papier !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier le texte</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleLogReminder}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enregistrer la relance</span>
                    </button>
                  </div>
                </div>

                {/* History Strip */}
                {reminderHistory.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-semibold text-slate-700">Historique des Relances de la Session :</span>
                    <div className="space-y-1">
                      {reminderHistory.map((h) => (
                        <div key={h.id} className="text-[11px] flex justify-between bg-slate-50 p-2 rounded text-slate-600">
                          <span>{h.date} - Relance {h.type.toUpperCase()} pour {h.client} ({h.invoice})</span>
                          <span className="text-emerald-700 font-semibold">Envoyée</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
