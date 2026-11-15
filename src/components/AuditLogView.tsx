/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { AuditLogEntry } from '../types';
import { Search } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const { t } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const tables = Array.from(new Set(auditLogs.map((l) => l.table)));

  const translateAuditAction = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'créer':
        return t('audit.action.créer');
      case 'modifier':
        return t('audit.action.modifier');
      case 'valider':
        return t('audit.action.valider');
      case 'paiement':
        return t('audit.action.paiement');
      case 'connexion':
        return t('audit.action.connexion');
      default:
        return action;
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.user_name.toLowerCase().includes(term) ||
      log.table.toLowerCase().includes(term) ||
      log.enregistrement_id.toLowerCase().includes(term) ||
      log.id.toLowerCase().includes(term);
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesTable = filterTable === 'all' || log.table === filterTable;
    return matchesSearch && matchesAction && matchesTable;
  });

  const selectedLog = auditLogs.find((l) => l.id === selectedEntryId) || filteredLogs[0];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div>
        <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('audit.title')}</h2>
        <div className="text-xs text-[#546A8E] mt-0.5">
          {t('audit.subtitle')}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3.5 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_4px_16px_-8px_rgba(11,23,51,0.08)]">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#647BA0] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('audit.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-2 text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] placeholder:text-[#647BA0] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] focus:outline-hidden focus:border-[#0284C7]"
        >
          <option value="all">{t('audit.allActions')}</option>
          <option value="créer">{t('audit.action.créer')}</option>
          <option value="modifier">{t('audit.action.modifier')}</option>
          <option value="valider">{t('audit.action.valider')}</option>
          <option value="paiement">{t('audit.action.paiement')}</option>
          <option value="connexion">{t('audit.action.connexion')}</option>
        </select>

        <select
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-2 px-3 text-[#1C2E4F] focus:outline-hidden focus:border-[#0284C7]"
        >
          <option value="all">{t('audit.allTables')}</option>
          {tables.map((tbl) => (
            <option key={tbl} value={tbl}>
              {tbl}
            </option>
          ))}
        </select>
      </div>

      {/* Split View: Table on Left / JSON Diff on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Table of logs (7 cols) */}
        <div className="lg:col-span-7 min-w-0 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] lg:max-h-[650px] overflow-y-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#E6EEF8] text-[#455B80] font-semibold border-b border-[#CFDDED] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.datetime')}</th>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.user')}</th>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.action')}</th>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.tableTarget')}</th>
                  <th className="py-2.5 px-3 text-end">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F3]">
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEntryId(log.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#DCE9F9] font-medium' : 'hover:bg-[#E7EFFA]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#3C5073] whitespace-nowrap" dir="ltr">
                        {log.horodatage}
                      </td>

                      <td className="py-2.5 px-3 font-medium text-[#0D1B38] truncate max-w-[120px]">
                        {log.user_name}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                            log.action === 'valider'
                              ? 'bg-[#DCF4E8] text-[#0E6245]'
                              : log.action === 'créer'
                              ? 'bg-[#DFF0FC] text-[#035388]'
                              : log.action === 'paiement'
                              ? 'bg-[#E0F5FA] text-[#0E7490]'
                              : 'bg-[#E2EAF5] text-[#3C5073]'
                          }`}
                        >
                          {translateAuditAction(log.action)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#1C2E4F]">{log.table}</span>
                        <div className="text-[10px] text-[#546A8E] font-mono">{log.enregistrement_id}</div>
                      </td>

                      <td className="py-2.5 px-3 text-end font-mono text-[11px] text-[#546A8E] whitespace-nowrap" dir="ltr">
                        {log.ip}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* JSON Diff Inspector (5 cols) */}
        <div className="lg:col-span-5 min-w-0 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] p-4 sm:p-5 space-y-4">
          {selectedLog ? (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DCE6F3]">
                <div>
                  <h3 className="text-sm font-bold text-[#0D1B38]">{t('audit.detailTitle')}</h3>
                  <div className="text-[11px] text-[#546A8E] font-mono">
                    {t('audit.idTimestamp', { id: selectedLog.id, ts: selectedLog.horodatage })}
                  </div>
                </div>
                <span className="font-mono text-xs text-[#1C2E4F] bg-[#E6EEF8] border border-[#C9D9EC] px-2.5 py-0.5 rounded-lg">
                  {selectedLog.table}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-[#546A8E] font-medium">{t('audit.author')} </span>
                  <strong className="text-[#0D1B38]">{selectedLog.user_name}</strong> ({selectedLog.user_id})
                </div>
                <div>
                  <span className="text-[#546A8E] font-medium">{t('audit.targetRecord')} </span>
                  <strong className="font-mono text-[#0D1B38]">{selectedLog.enregistrement_id}</strong>
                </div>
                <div>
                  <span className="text-[#546A8E] font-medium">{t('audit.ip')} </span>
                  <span className="font-mono text-[#273B63]" dir="ltr">{selectedLog.ip}</span>
                </div>
              </div>

              {/* Old vs New JSON diff view */}
              <div className="space-y-3 pt-2">
                {selectedLog.ancien && (
                  <div>
                    <span className="text-[11px] font-semibold text-[#546A8E] block mb-1">
                      {t('audit.beforeState')}
                    </span>
                    <pre dir="ltr" className="p-3 bg-[#0B1733] text-[#E6EEF8] border border-[#1E3566] rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 text-left">
                      {JSON.stringify(selectedLog.ancien, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.nouveau && (
                  <div>
                    <span className="text-[11px] font-semibold text-[#0E6245] block mb-1">
                      {t('audit.afterState')}
                    </span>
                    <pre dir="ltr" className="p-3 bg-[#0B1733] text-[#6EE7B7] border border-[#1E3566] rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 text-left">
                      {JSON.stringify(selectedLog.nouveau, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-[#546A8E] text-xs">
              {t('audit.selectPrompt')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
