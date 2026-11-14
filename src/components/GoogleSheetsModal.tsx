/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  ShieldCheck,
  X,
  Table,
} from 'lucide-react';

export const GoogleSheetsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    employees,
    payrolls,
    clients,
    projects,
    contracts,
    invoices,
    payments,
    expenses,
    dailyReports,
    siteVisits,
    users,
    auditLogs,
    sheetsSyncStatus,
    lastSheetsSync,
    syncWithGoogleSheets,
  } = useApp();
  const { t } = useI18n();

  const [activeWorkbook, setActiveWorkbook] = useState<
    'GS_RH_PAIE' | 'GS_CLIENTS_FACTURATION' | 'GS_CHARGES' | 'GS_ACTIVITE' | 'GS_SYSTEME'
  >('GS_CLIENTS_FACTURATION');

  if (!isOpen) return null;

  const workbooks = [
    {
      id: 'GS_RH_PAIE',
      name: 'GS_RH_PAIE',
      title: t('sheets.wb.rh.title'),
      sharing: t('sheets.wb.rh.sharing'),
      sheets: [
        { name: 'Employees', count: employees.length, cols: 'id, matricule, nom, prenom, cin, poste, salaire_brut, statut...' },
        { name: 'Payrolls', count: payrolls.length, cols: 'id, employee_id, mois, salaire_brut, cnss, amo, ir, net_a_payer...' },
      ],
    },
    {
      id: 'GS_CLIENTS_FACTURATION',
      name: 'GS_CLIENTS_FACTURATION',
      title: t('sheets.wb.crm.title'),
      sharing: t('sheets.wb.serviceAccount'),
      sheets: [
        { name: 'Clients', count: clients.length, cols: 'id, code_client, raison_sociale, ice, if, contact_nom, telephone...' },
        { name: 'Projects', count: projects.length, cols: 'id, client_id, nom_systeme, type, prix_vente_ht, statut...' },
        { name: 'Contracts', count: contracts.length, cols: 'id, numero_contrat, client_id, date_debut, montant_ht...' },
        { name: 'Invoices', count: invoices.length, cols: 'id, numero, client_id, date_emission, total_ttc, reste_a_payer...' },
        { name: 'Payments', count: payments.length, cols: 'id, invoice_id, client_id, date_paiement, montant, mode...' },
      ],
    },
    {
      id: 'GS_CHARGES',
      name: 'GS_CHARGES',
      title: t('sheets.wb.expenses.title'),
      sharing: t('sheets.wb.serviceAccount'),
      sheets: [
        { name: 'Expenses', count: expenses.length, cols: 'id, date, categorie_id, libelle, montant_ttc, source, statut...' },
        { name: 'ExpenseCategories', count: 12, cols: 'id, nom, type (fixe/variable)' },
      ],
    },
    {
      id: 'GS_ACTIVITE',
      name: 'GS_ACTIVITE',
      title: t('sheets.wb.activity.title'),
      sharing: t('sheets.wb.serviceAccount'),
      sheets: [
        { name: 'DailyReports', count: dailyReports.length, cols: 'id, employee_id, date, lieu, heures_total, blocages...' },
        { name: 'SiteVisits', count: siteVisits.length, cols: 'id, report_id, employee_id, client_id, motif, travail_effectue...' },
      ],
    },
    {
      id: 'GS_SYSTEME',
      name: 'GS_SYSTEME',
      title: t('sheets.wb.system.title'),
      sharing: t('sheets.wb.serviceAccount'),
      sheets: [
        { name: 'Users', count: users.length, cols: 'id, employee_id, email, password_hash, role, active...' },
        { name: 'Settings', count: 1, cols: 'company_name, ice, default_vat, cnss_rate, cutoff_hour...' },
        { name: 'AuditLog', count: auditLogs.length, cols: 'id, horodatage, user_id, action, table, enregistrement_id, ip...' },
      ],
    },
  ];

  const currentWb = workbooks.find((w) => w.id === activeWorkbook)!;

  const exportCurrentWorkbook = () => {
    let csvData = '';
    if (activeWorkbook === 'GS_CLIENTS_FACTURATION') {
      csvData = 'Facture;Client;Date;Total TTC;Reste a Payer;Statut\n' +
        invoices.map((i) => `${i.numero};"${clients.find(c => c.id === i.client_id)?.raison_sociale || ''}";${i.date_emission};${i.total_ttc};${i.reste_a_payer};${i.statut}`).join('\n');
    } else if (activeWorkbook === 'GS_RH_PAIE') {
      csvData = 'Matricule;Nom;Prenom;Poste;Brut;Net;Statut\n' +
        employees.map((e) => `${e.matricule};${e.nom};${e.prenom};${e.poste};${e.salaire_brut_base};${e.salaire_net_base};${e.statut}`).join('\n');
    } else if (activeWorkbook === 'GS_CHARGES') {
      csvData = 'Date;Libelle;Fournisseur;Montant TTC;Source;Statut\n' +
        expenses.map((e) => `${e.date};"${e.libelle}";"${e.fournisseur}";${e.montant_ttc};${e.source};${e.statut}`).join('\n');
    } else {
      csvData = 'Log_ID;Horodatage;Utilisateur;Action;Table;Enregistrement;IP\n' +
        auditLogs.map((l) => `${l.id};${l.horodatage};"${l.user_name}";${l.action};${l.table};${l.enregistrement_id};${l.ip}`).join('\n');
    }

    const encoded = encodeURI('data:text/csv;charset=utf-8,' + csvData);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `${activeWorkbook}_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('sheets.modalHeading')}
              </h2>
              <div className="text-xs text-slate-500">
                {t('sheets.modalSub', { sync: lastSheetsSync })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={syncWithGoogleSheets}
              disabled={sheetsSyncStatus === 'syncing'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${sheetsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{sheetsSyncStatus === 'syncing' ? t('sheets.syncing') : t('sheets.syncNow')}</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Anti-Injection Note (Section 7.1 & R12) */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1.5 text-blue-900">
          <div className="font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{t('sheets.securityTitle')}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-800">
            {t('sheets.securityBody')}
          </p>
        </div>

        {/* Workbook tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto text-xs pb-1" dir="ltr">
          {workbooks.map((wb) => (
            <button
              key={wb.id}
              onClick={() => setActiveWorkbook(wb.id as typeof activeWorkbook)}
              className={`px-3 py-2 rounded-t-lg font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeWorkbook === wb.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {wb.name}
            </button>
          ))}
        </div>

        {/* Workbook Details */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900">{currentWb.title}</h3>
              <div className="text-xs text-slate-500">
                {t('sheets.sharingLabel')} <strong className="text-slate-700">{currentWb.sharing}</strong>
              </div>
            </div>

            <button
              onClick={exportCurrentWorkbook}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('sheets.exportWbBtn', { name: currentWb.name })}</span>
            </button>
          </div>

          {/* Sheets List in this workbook */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700">{t('sheets.sheetsListLabel')}</span>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {currentWb.sheets.map((s, idx) => (
                <div key={idx} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t('sheets.sheetName', { name: s.name })}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {t('sheets.columnsPrefix')} <span dir="ltr">{s.cols}</span>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
                    {t('sheets.rowsActive', { count: s.count })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            {t('sheets.closeViewer')}
          </button>
        </div>
      </div>
    </div>
  );
};
