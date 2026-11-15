/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { formatDH } from '../utils/calculations';
import {
  MessageSquare,
  Mail,
  Copy,
  Check,
  Clock,
  Send,
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const { invoices, clients, settings } = useApp();
  const { t } = useI18n();

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
      return t('reminders.whatsappBody', {
        contact,
        num: inv.numero,
        amount: formatDH(inv.reste_a_payer),
        due: inv.date_echeance,
        days: inv.daysOverdue,
        company: settings.company_name,
        rib: settings.rib,
      });
    }

    return t('reminders.emailBody', {
      num: inv.numero,
      company: settings.company_name,
      contact,
      issued: inv.date_emission,
      amount: formatDH(inv.reste_a_payer),
      due: inv.date_echeance,
      rib: settings.rib,
    });
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
        <h2 className="text-xl sm:text-[22px] font-bold text-[#0D1B38] tracking-[-0.02em]">{t('reminders.title')}</h2>
        <div className="text-xs text-[#546A8E] mt-0.5">
          {t('reminders.subtitle')}
        </div>
      </div>

      {overdueInvoices.length === 0 ? (
        <div className="ios-card p-12 text-center">
          <Clock className="w-10 h-10 text-[#0E6245] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0D1B38]">{t('reminders.noneTitle')}</h3>
          <p className="text-xs text-[#546A8E] mt-1">{t('reminders.noneDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Overdue List (5 cols) */}
          <div className="lg:col-span-5 ios-card flex flex-col overflow-hidden">
            <div className="p-3.5 border-b border-[#DCE6F3] flex items-center justify-between bg-[#E6EEF8]/65">
              <span className="text-xs font-semibold text-[#0D1B38]">
                {t('reminders.overdueList', { count: overdueInvoices.length })}
              </span>
              <span className="text-[11px] font-mono text-[#9F1239] font-bold" dir="ltr">
                {formatDH(overdueInvoices.reduce((s, i) => s + i.reste_a_payer, 0))}
              </span>
            </div>

            <div className="divide-y divide-[#DCE6F3] overflow-y-auto max-h-[340px] lg:max-h-[600px]">
              {overdueInvoices.map((inv) => {
                const isSelected = selectedInv?.id === inv.id;

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#DCE9F9]' : 'hover:bg-[#E7EFFA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-[#0D1B38] font-mono" dir="ltr">{inv.numero}</div>
                        <div className="text-xs text-[#273B63] font-medium mt-0.5">
                          {inv.client?.raison_sociale}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold text-[#9F1239] text-xs" dir="ltr">
                          {formatDH(inv.reste_a_payer)}
                        </div>
                        <span className="text-[10px] font-semibold text-[#9F1239] bg-[#FCE8EC] border border-[#F3BCC8] px-1.5 py-0.5 rounded-md">
                          {t('reminders.daysLate', { days: inv.daysOverdue })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Reminder Composer & Template (7 cols) */}
          <div className="lg:col-span-7 ios-card p-4 sm:p-5 space-y-4">
            {selectedInv ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#DCE6F3]">
                  <div>
                    <h3 className="text-sm font-bold text-[#0D1B38] tracking-[-0.01em]">
                      {t('reminders.templateTitle', { num: selectedInv.numero })}
                    </h3>
                    <div className="text-xs text-[#546A8E]">
                      {t('reminders.clientPhone', {
                        name: selectedInv.client?.raison_sociale || '',
                        phone: selectedInv.client?.telephone || '',
                      })}
                    </div>
                  </div>

                  {/* Channel Switcher */}
                  <div className="ios-segmented flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setReminderType('whatsapp')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 transition-all active:scale-[0.97] whitespace-nowrap shrink-0 ${
                        reminderType === 'whatsapp' ? 'ios-segmented-active !text-[#0E6245]' : 'text-[#455B80] hover:text-[#0D1B38]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#0E6245]" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setReminderType('email')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 transition-all active:scale-[0.97] whitespace-nowrap shrink-0 ${
                        reminderType === 'email' ? 'ios-segmented-active !text-[#035388]' : 'text-[#455B80] hover:text-[#0D1B38]'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5 text-[#0284C7]" />
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
                    className="ios-input w-full p-3.5 text-xs font-mono leading-relaxed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-[#546A8E]">
                    {t('reminders.copyHint')}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleCopyMessage(generateMessage(selectedInv, reminderType), selectedInv.id)}
                      className="ios-btn-secondary flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs min-h-[38px] whitespace-nowrap shrink-0 flex-1 sm:flex-none"
                    >
                      {copiedId === selectedInv.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#0E6245]" />
                          <span>{t('reminders.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('reminders.copyBtn')}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleLogReminder}
                      className="ios-btn-primary flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs min-h-[38px] whitespace-nowrap shrink-0 flex-1 sm:flex-none"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('reminders.logBtn')}</span>
                    </button>
                  </div>
                </div>

                {/* History Strip */}
                {reminderHistory.length > 0 && (
                  <div className="pt-4 border-t border-[#DCE6F3] space-y-2">
                    <span className="text-xs font-semibold text-[#273B63]">{t('reminders.historyTitle')}</span>
                    <div className="space-y-1.5">
                      {reminderHistory.map((h) => (
                        <div key={h.id} className="ios-well text-[11px] flex flex-wrap items-center justify-between gap-2 p-2.5 text-[#3C5073]">
                          <span>
                            {t('reminders.historyEntry', {
                              date: h.date,
                              type: h.type.toUpperCase(),
                              client: h.client,
                              invoice: h.invoice,
                            })}
                          </span>
                          <span className="text-[#0E6245] font-semibold">{t('reminders.sent')}</span>
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
