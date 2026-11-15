/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Client, ClientType, ClientStatus } from '../types';
import { formatDH, round2 } from '../utils/calculations';
import {
  Search,
  Plus,
  Phone,
  Mail,
  AlertTriangle,
  X,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const {
    clients,
    projects,
    contracts,
    invoices,
    payments,
    siteVisits,
    addClient,
  } = useApp();
  const { t } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [activeTab, setActiveTab] = useState<'infos' | 'projets' | 'contrats' | 'factures' | 'paiements' | 'interventions'>('infos');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    raison_sociale: '',
    type: 'société' as ClientType,
    ice: '',
    if: '',
    rc: '',
    contact_nom: '',
    contact_fonction: '',
    telephone: '+212 5',
    email: '',
    adresse: '',
    ville: 'Casablanca',
    statut: 'actif' as ClientStatus,
    commercial_id: 'EMP-004',
    notes: '',
  });

  const translateClientStatus = (status: ClientStatus) => {
    if (status === 'actif') return t('clients.status.actif');
    if (status === 'prospect') return t('clients.status.prospect');
    return t('clients.status.inactif');
  };

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.raison_sociale.toLowerCase().includes(term) ||
      c.code_client.toLowerCase().includes(term) ||
      c.ice.includes(term) ||
      c.telephone.includes(term);
    const matchesStatut = filterStatut === 'all' || c.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  // Calculate Client 360 header metrics (CL-2 & R10)
  const clientInvoices = selectedClient
    ? invoices.filter((i) => i.client_id === selectedClient.id && i.statut !== 'annulée')
    : [];

  const totalFacture = clientInvoices.reduce((sum, i) => sum + i.total_ttc, 0);

  const clientPayments = selectedClient
    ? payments.filter((p) => p.client_id === selectedClient.id && p.statut === 'encaissé')
    : [];

  const totalEncaisse = clientPayments.reduce((sum, p) => sum + p.montant, 0);
  const resteDu = round2(Math.max(0, totalFacture - totalEncaisse));

  const clientProjects = selectedClient
    ? projects.filter((p) => p.client_id === selectedClient.id)
    : [];

  const clientContracts = selectedClient
    ? contracts.filter((c) => c.client_id === selectedClient.id)
    : [];

  const clientVisits = selectedClient
    ? siteVisits.filter((v) => v.client_id === selectedClient.id)
    : [];

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setNewError(null);

    const result = addClient({
      ...formData,
      date_creation: new Date().toISOString().split('T')[0],
    });
    if (!result.success) {
      setNewError(result.error || 'Error');
      return;
    }

    if (result.client) {
      setSelectedClient(result.client);
    }
    setIsNewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[22px] font-bold text-[#0D1B38] tracking-[-0.02em]">{t('clients.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('clients.subtitle')}
          </div>
        </div>

        <button
          onClick={() => {
            setNewError(null);
            setIsNewModalOpen(true);
          }}
          className="ios-btn-primary flex items-center justify-center gap-1.5 px-4 py-2 text-xs min-h-[38px] whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('clients.newBtn')}</span>
        </button>
      </div>

      {/* Main split: Client List (Left) / 360° View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Client List (4 cols) */}
        <div className="lg:col-span-4 ios-card flex flex-col max-h-[340px] lg:max-h-none lg:h-[750px] overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-[#DAE5F2] space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#627799] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('clients.searchShort')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ios-input w-full ps-9 pe-3 py-2 text-xs placeholder:text-[#6B80A3]"
              />
            </div>

            <div className="ios-segmented flex items-center gap-1 overflow-x-auto">
              {(['all', 'actif', 'prospect', 'inactif'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatut(st)}
                  className={`flex-1 px-2.5 py-1.5 text-[11px] transition-all whitespace-nowrap active:scale-[0.97] ${
                    filterStatut === st
                      ? 'ios-segmented-active'
                      : 'text-[#4B6187] hover:text-[#0D1B38]'
                  }`}
                >
                  {st === 'all' ? t('common.all') : translateClientStatus(st)}
                </button>
              ))}
            </div>
          </div>

          {/* Client List */}
          <div className="divide-y divide-[#DCE6F3] overflow-y-auto flex-1">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#DCE9F9]' : 'hover:bg-[#E7EFFA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-xs text-[#0D1B38] truncate">
                      {client.raison_sociale}
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                        client.statut === 'actif'
                          ? 'text-emerald-700 bg-emerald-100/80'
                          : client.statut === 'prospect'
                          ? 'text-[#0369A1] bg-[#DFF0FC]'
                          : 'text-[#546A8E] bg-[#E2EAF5]'
                      }`}
                    >
                      {translateClientStatus(client.statut)}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#546A8E] mt-1 flex items-center justify-between">
                    <span>{client.ville}</span>
                    <span className="font-mono text-[#627799]">ICE: {client.ice || 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 360° Detail View (8 cols) */}
        <div className="lg:col-span-8 ios-card flex flex-col h-auto lg:h-[750px] lg:overflow-hidden">
          {selectedClient ? (
            <div className="flex flex-col h-full lg:overflow-hidden">
              {/* Header 360°: Total Facturé / Total Encaissé / Reste Dû (CL-2 & R10) */}
              <div className="p-4 sm:p-5 border-b border-[#D1DFEE] bg-[#E6EEF8]/65">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-[#0D1B38] tracking-[-0.015em]">{selectedClient.raison_sociale}</h3>
                      <span className="text-[11px] font-mono text-[#627799]">({selectedClient.code_client})</span>
                    </div>
                    <div className="text-xs text-[#546A8E] mt-0.5">
                      {selectedClient.contact_nom} ({selectedClient.contact_fonction}) · {selectedClient.ville}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${selectedClient.telephone}`}
                      className="ios-btn-secondary p-2.5 text-[#273B63] hover:text-[#0284C7]"
                      title={t('clients.call')}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="ios-btn-secondary p-2.5 text-[#273B63] hover:text-[#0284C7]"
                      title={t('clients.sendEmail')}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Financial Summary Strip (R10) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4 pt-3 border-t border-[#CFDDED]">
                  <div className="ios-well !bg-[#F4F8FD]/90 p-3">
                    <div className="text-[11px] text-[#546A8E] font-medium">{t('clients.totalBilled')}</div>
                    <div className="text-sm font-bold font-mono text-[#0D1B38] mt-0.5">
                      {formatDH(totalFacture)}
                    </div>
                  </div>
                  <div className="ios-well !bg-[#F4F8FD]/90 p-3">
                    <div className="text-[11px] text-[#546A8E] font-medium">{t('clients.totalCollected')}</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                      {formatDH(totalEncaisse)}
                    </div>
                  </div>
                  <div className="p-3 rounded-[16px] border border-[#F2D388] bg-[#FEF3D6]/85">
                    <div className="text-[11px] text-[#8F5600] font-medium">{t('clients.balanceDue')}</div>
                    <div className="text-sm font-bold font-mono text-[#8F5600] mt-0.5">
                      {formatDH(resteDu)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 360° Tabs */}
              <div className="px-3 sm:px-5 py-2.5 border-b border-[#D1DFEE] bg-[#EDF2FA]/70 shrink-0">
                <div className="ios-segmented flex items-center gap-1 overflow-x-auto text-xs font-medium">
                  {[
                    { key: 'infos', label: t('clients.tab.infos') },
                    { key: 'projets', label: t('clients.tab.projects', { count: clientProjects.length }) },
                    { key: 'contrats', label: t('clients.tab.contracts', { count: clientContracts.length }) },
                    { key: 'factures', label: t('clients.tab.invoices', { count: clientInvoices.length }) },
                    { key: 'paiements', label: t('clients.tab.payments', { count: clientPayments.length }) },
                    { key: 'interventions', label: t('clients.tab.visits', { count: clientVisits.length }) },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-1.5 px-3 transition-all whitespace-nowrap active:scale-[0.97] ${
                        activeTab === tab.key
                          ? 'ios-segmented-active'
                          : 'text-[#546A8E] hover:text-[#0D1B38]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs">
                {activeTab === 'infos' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="ios-well p-3.5 space-y-2">
                        <div className="font-semibold text-[#0D1B38]">{t('clients.taxIds')}</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[#546A8E]">ICE :</span>
                            <div className="font-mono font-medium text-[#1C2E4F]">{selectedClient.ice || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[#546A8E]">IF :</span>
                            <div className="font-mono font-medium text-[#1C2E4F]">{selectedClient.if || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[#546A8E]">RC :</span>
                            <div className="font-mono font-medium text-[#1C2E4F]">{selectedClient.rc || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[#546A8E]">{t('clients.structureType')}</span>
                            <div className="capitalize text-[#1C2E4F]">{selectedClient.type}</div>
                          </div>
                        </div>
                      </div>

                      <div className="ios-well p-3.5 space-y-2">
                        <div className="font-semibold text-[#0D1B38]">{t('clients.fullDetails')}</div>
                        <div className="text-[11px] space-y-1 text-[#273B63]">
                          <div><span className="text-[#546A8E]">{t('clients.address')}</span> {selectedClient.adresse}</div>
                          <div><span className="text-[#546A8E]">{t('clients.city')}</span> {selectedClient.ville}</div>
                          <div><span className="text-[#546A8E]">{t('clients.phone')}</span> <span className="font-mono" dir="ltr">{selectedClient.telephone}</span></div>
                          <div><span className="text-[#546A8E]">{t('clients.email')}</span> {selectedClient.email}</div>
                        </div>
                      </div>
                    </div>

                    {selectedClient.notes && (
                      <div className="ios-well p-3.5">
                        <span className="font-semibold text-[#0D1B38] block mb-1">{t('clients.internalNotes')}</span>
                        <p className="text-[#3B4F73] leading-relaxed text-[11px]">{selectedClient.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'projets' && (
                  <div className="space-y-3">
                    {clientProjects.map((p) => (
                      <div key={p.id} className="ios-well p-3.5 hover:border-[#A7CBE8] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="font-bold text-[#0D1B38] text-xs">{p.nom_systeme}</h4>
                          <span className="font-mono text-emerald-700 font-bold shrink-0">{formatDH(p.prix_vente_ht)} HT</span>
                        </div>
                        <p className="text-[#3B4F73] mt-1 text-[11px]">{p.description}</p>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#627799] mt-2 pt-2 border-t border-[#D6E3F2]">
                          <span>{t('projects.techPrefix')} {p.technologies}</span>
                          <span className="capitalize font-medium text-[#273B63]">{t('common.status')}: {p.statut}</span>
                        </div>
                      </div>
                    ))}
                    {clientProjects.length === 0 && (
                      <div className="py-12 text-center text-[#627799]">{t('clients.noProjects')}</div>
                    )}
                  </div>
                )}

                {activeTab === 'contrats' && (
                  <div className="space-y-3">
                    {clientContracts.map((c) => (
                      <div key={c.id} className="ios-well p-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-[#0D1B38]">{c.numero_contrat} ({c.type})</span>
                          <span className="font-mono font-bold text-[#1C2E4F] shrink-0">{formatDH(c.montant_ht)} HT / {c.periodicite}</span>
                        </div>
                        <div className="text-[11px] text-[#3B4F73] mt-1">
                          {t('clients.periodIncluded', { start: c.date_debut, end: c.date_fin, hours: c.heures_incluses })}
                        </div>
                        <div className="text-[11px] text-[#546A8E] mt-0.5">{c.sla_description}</div>
                      </div>
                    ))}
                    {clientContracts.length === 0 && (
                      <div className="py-12 text-center text-[#627799]">{t('clients.noContracts')}</div>
                    )}
                  </div>
                )}

                {activeTab === 'factures' && (
                  <div className="divide-y divide-[#DCE6F3]">
                    {clientInvoices.map((inv) => (
                      <div key={inv.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#0D1B38]">{inv.numero}</div>
                          <div className="text-[11px] text-[#627799]">
                            {t('clients.issuedOn', { date: inv.date_emission, due: inv.date_echeance })}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="font-mono font-bold text-[#0D1B38]">{formatDH(inv.total_ttc)}</div>
                          <span className="text-[10px] font-medium text-[#475E82] capitalize">{inv.statut}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'paiements' && (
                  <div className="divide-y divide-[#DCE6F3]">
                    {clientPayments.map((p) => (
                      <div key={p.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-[#0D1B38]">{p.mode} · {p.reference}</div>
                          <div className="text-[11px] text-[#627799]">{p.date_paiement} ({p.banque})</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-700">{formatDH(p.montant)}</div>
                      </div>
                    ))}
                    {clientPayments.length === 0 && (
                      <div className="py-12 text-center text-[#627799]">{t('clients.noPayments')}</div>
                    )}
                  </div>
                )}

                {activeTab === 'interventions' && (
                  <div className="space-y-3">
                    {clientVisits.map((v) => (
                      <div key={v.id} className="ios-well p-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-[#0D1B38]">{v.motif}</span>
                          <span className="text-[11px] font-mono text-[#546A8E] shrink-0">{v.date} ({v.heure_depart} - {v.heure_retour})</span>
                        </div>
                        <p className="text-[#3B4F73] text-[11px] mt-1">{v.travail_effectue}</p>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#627799] mt-2 pt-2 border-t border-[#D6E3F2]">
                          <span>{t('clients.result')} <strong className="text-[#1C2E4F]">{v.resultat}</strong></span>
                          <span>{t('clients.billable')} {v.facturable ? `${formatDH(v.montant_facturable)}` : t('clients.no')}</span>
                        </div>
                      </div>
                    ))}
                    {clientVisits.length === 0 && (
                      <div className="py-12 text-center text-[#627799]">{t('clients.noVisits')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-[#627799] text-xs">
              {t('clients.selectPrompt')}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Client (CL-1 with duplicate ICE & name check) */}
      {isNewModalOpen && (
        <div className="ios-sheet-backdrop fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="ios-sheet rounded-t-[28px] sm:rounded-[26px] max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="sm:hidden w-10 h-1 rounded-full bg-[#B8CAE2] mx-auto -mt-1" />
            <div className="flex items-center justify-between border-b border-[#DAE5F2] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38] tracking-[-0.015em]">{t('clients.modalTitle')}</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#E5EDF8] hover:bg-[#DAE5F4] flex items-center justify-center text-[#546A8E] hover:text-[#0D1B38] transition-all active:scale-[0.93]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newError && (
              <div className="p-3 bg-[#FCE8EC] border border-[#F3BCC8] text-[#9F1239] text-xs rounded-[14px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{newError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('clients.field.company')}</label>
                  <input
                    type="text"
                    required
                    value={formData.raison_sociale}
                    onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                    className="ios-input w-full p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('clients.field.ice')}</label>
                  <input
                    type="text"
                    placeholder="001928374000032"
                    value={formData.ice}
                    onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                    className="ios-input w-full p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('clients.field.if')}</label>
                  <input
                    type="text"
                    value={formData.if}
                    onChange={(e) => setFormData({ ...formData, if: e.target.value })}
                    className="ios-input w-full p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('clients.field.contact')}</label>
                  <input
                    type="text"
                    value={formData.contact_nom}
                    onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
                    className="ios-input w-full p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('clients.field.role')}</label>
                  <input
                    type="text"
                    value={formData.contact_fonction}
                    onChange={(e) => setFormData({ ...formData, contact_fonction: e.target.value })}
                    className="ios-input w-full p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.phone')}</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="ios-input w-full p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="ios-input w-full p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('clients.field.city')}</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    className="ios-input w-full p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('common.status')}</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as ClientStatus })}
                    className="ios-input w-full p-2.5"
                  >
                    <option value="actif">{t('clients.status.actif')}</option>
                    <option value="prospect">{t('clients.status.prospect')}</option>
                    <option value="inactif">{t('clients.status.inactif')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#3B4F73] mb-1 font-medium">{t('clients.field.address')}</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="ios-input w-full p-2.5"
                />
              </div>

              <div className="pt-3 border-t border-[#DAE5F2] flex justify-end gap-2">
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
                  {t('clients.saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
