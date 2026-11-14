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
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('audit.title')}</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          {t('audit.subtitle')}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('audit.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
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
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
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
        <div className="lg:col-span-7 min-w-0 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] lg:max-h-[650px] overflow-y-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.datetime')}</th>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.user')}</th>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.action')}</th>
                  <th className="py-2.5 px-3 text-start">{t('audit.col.tableTarget')}</th>
                  <th className="py-2.5 px-3 text-end">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedEntryId(log.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap" dir="ltr">
                        {log.horodatage}
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-900 truncate max-w-[120px]">
                        {log.user_name}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm whitespace-nowrap ${
                            log.action === 'valider'
                              ? 'bg-emerald-50 text-emerald-800'
                              : log.action === 'créer'
                              ? 'bg-blue-50 text-blue-800'
                              : log.action === 'paiement'
                              ? 'bg-sky-50 text-sky-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {translateAuditAction(log.action)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{log.table}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{log.enregistrement_id}</div>
                      </td>

                      <td className="py-2.5 px-3 text-end font-mono text-[11px] text-slate-500 whitespace-nowrap" dir="ltr">
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
        <div className="lg:col-span-5 min-w-0 bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          {selectedLog ? (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t('audit.detailTitle')}</h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {t('audit.idTimestamp', { id: selectedLog.id, ts: selectedLog.horodatage })}
                  </div>
                </div>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedLog.table}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="text-slate-500 font-medium">{t('audit.author')} </span>
                  <strong className="text-slate-900">{selectedLog.user_name}</strong> ({selectedLog.user_id})
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{t('audit.targetRecord')} </span>
                  <strong className="font-mono text-slate-900">{selectedLog.enregistrement_id}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">{t('audit.ip')} </span>
                  <span className="font-mono text-slate-700" dir="ltr">{selectedLog.ip}</span>
                </div>
              </div>

              {/* Old vs New JSON diff view */}
              <div className="space-y-3 pt-2">
                {selectedLog.ancien && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      {t('audit.beforeState')}
                    </span>
                    <pre dir="ltr" className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-40 text-left">
                      {JSON.stringify(selectedLog.ancien, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.nouveau && (
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 block mb-1">
                      {t('audit.afterState')}
                    </span>
                    <pre dir="ltr" className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 text-left">
                      {JSON.stringify(selectedLog.nouveau, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              {t('audit.selectPrompt')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
