/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Client, ClientType, ClientStatus } from '../types';
import { formatDH, round2 } from '../utils/calculations';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  FolderGit2,
  FileCheck2,
  Receipt,
  CreditCard,
  MapPinCheck,
  AlertTriangle,
  X,
  Edit2,
  CheckCircle2,
  ExternalLink,
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
    updateClient,
  } = useApp();

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

    const result = addClient(formData);
    if (!result.success) {
      setNewError(result.error || 'Erreur lors de l ajout');
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Clients & Fiche 360°</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module CL-1 à CL-8 · Centralisation des systèmes, contrats, factures et interventions
          </div>
        </div>

        <button
          onClick={() => {
            setNewError(null);
            setIsNewModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Main split: Client List (Left) / 360° View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Client List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[750px]">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher nom, ICE, tél..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1">
              {['all', 'actif', 'prospect', 'inactif'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatut(st)}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-colors capitalize ${
                    filterStatut === st
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'all' ? 'Tous' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Client List */}
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/80 border-l-2 border-l-blue-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-xs text-slate-900 truncate">
                      {client.raison_sociale}
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm capitalize ${
                        client.statut === 'actif'
                          ? 'text-emerald-700 bg-emerald-50'
                          : client.statut === 'prospect'
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-slate-500 bg-slate-100'
                      }`}
                    >
                      {client.statut}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{client.ville}</span>
                    <span className="font-mono text-slate-400">ICE: {client.ice || 'N/A'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 360° Detail View (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
          {selectedClient ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header 360°: Total Facturé / Total Encaissé / Reste Dû (CL-2 & R10) */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{selectedClient.raison_sociale}</h3>
                      <span className="text-[11px] font-mono text-slate-400">({selectedClient.code_client})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {selectedClient.contact_nom} ({selectedClient.contact_fonction}) · {selectedClient.ville}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedClient.telephone}`}
                      className="p-2 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 rounded-lg transition-colors"
                      title="Appeler"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="p-2 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 rounded-lg transition-colors"
                      title="Envoyer un email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Financial Summary Strip (R10) */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200/80">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Total Facturé (TTC)</div>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                      {formatDH(totalFacture)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 font-medium">Total Encaissé</div>
                    <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                      {formatDH(totalEncaisse)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                    <div className="text-[11px] text-amber-800 font-medium">Reste Dû</div>
                    <div className="text-sm font-bold font-mono text-amber-700 mt-0.5">
                      {formatDH(resteDu)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 360° Tabs */}
              <div className="flex items-center gap-1 px-5 border-b border-slate-200 bg-white overflow-x-auto text-xs font-medium">
                {[
                  { key: 'infos', label: 'Informations' },
                  { key: 'projets', label: `Systèmes Vendus (${clientProjects.length})` },
                  { key: 'contrats', label: `Contrats (${clientContracts.length})` },
                  { key: 'factures', label: `Factures (${clientInvoices.length})` },
                  { key: 'paiements', label: `Paiements (${clientPayments.length})` },
                  { key: 'interventions', label: `Interventions (${clientVisits.length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-3 px-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-5 overflow-y-auto flex-1 text-xs">
                {activeTab === 'infos' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3.5 rounded-lg space-y-2 border border-slate-100">
                        <div className="font-semibold text-slate-900">Identifiants Fiscaux Marocains</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500">ICE :</span>
                            <div className="font-mono font-medium text-slate-800">{selectedClient.ice || '-'}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Identifiant Fiscal (IF) :</span>
                            <div className="font-mono font-medium text-slate-800">{selectedClient.if || '-'}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Registre de Commerce :</span>
                            <div className="font-mono font-medium text-slate-800">{selectedClient.rc || '-'}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Type de structure :</span>
                            <div className="capitalize text-slate-800">{selectedClient.type}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3.5 rounded-lg space-y-2 border border-slate-100">
                        <div className="font-semibold text-slate-900">Coordonnées Complètes</div>
                        <div className="text-[11px] space-y-1 text-slate-700">
                          <div><span className="text-slate-500">Adresse :</span> {selectedClient.adresse}</div>
                          <div><span className="text-slate-500">Ville :</span> {selectedClient.ville}</div>
                          <div><span className="text-slate-500">Téléphone :</span> <span className="font-mono">{selectedClient.telephone}</span></div>
                          <div><span className="text-slate-500">Email :</span> {selectedClient.email}</div>
                        </div>
                      </div>
                    </div>

                    {selectedClient.notes && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-900 block mb-1">Notes internes sur le compte :</span>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{selectedClient.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'projets' && (
                  <div className="space-y-3">
                    {clientProjects.map((p) => (
                      <div key={p.id} className="p-3.5 border border-slate-200 rounded-lg hover:border-slate-300">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-xs">{p.nom_systeme}</h4>
                          <span className="font-mono text-emerald-700 font-bold">{formatDH(p.prix_vente_ht)} HT</span>
                        </div>
                        <p className="text-slate-600 mt-1 text-[11px]">{p.description}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                          <span>Tech: {p.technologies}</span>
                          <span className="capitalize font-medium text-slate-700">Statut: {p.statut}</span>
                        </div>
                      </div>
                    ))}
                    {clientProjects.length === 0 && (
                      <div className="py-12 text-center text-slate-400">Aucun projet rattaché à ce client.</div>
                    )}
                  </div>
                )}

                {activeTab === 'contrats' && (
                  <div className="space-y-3">
                    {clientContracts.map((c) => (
                      <div key={c.id} className="p-3.5 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{c.numero_contrat} ({c.type})</span>
                          <span className="font-mono font-bold text-slate-800">{formatDH(c.montant_ht)} HT / {c.periodicite}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          Période : {c.date_debut} au {c.date_fin} · Heures incluses : {c.heures_incluses}h/mois
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{c.sla_description}</div>
                      </div>
                    ))}
                    {clientContracts.length === 0 && (
                      <div className="py-12 text-center text-slate-400">Aucun contrat de maintenance en cours.</div>
                    )}
                  </div>
                )}

                {activeTab === 'factures' && (
                  <div className="divide-y divide-slate-100">
                    {clientInvoices.map((inv) => (
                      <div key={inv.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{inv.numero}</div>
                          <div className="text-[11px] text-slate-400">Émise le {inv.date_emission} · Échéance {inv.date_echeance}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">{formatDH(inv.total_ttc)}</div>
                          <span className="text-[10px] font-medium text-slate-600 capitalize">{inv.statut}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'paiements' && (
                  <div className="divide-y divide-slate-100">
                    {clientPayments.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{p.mode} · Réf: {p.reference}</div>
                          <div className="text-[11px] text-slate-400">{p.date_paiement} ({p.banque})</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-700">{formatDH(p.montant)}</div>
                      </div>
                    ))}
                    {clientPayments.length === 0 && (
                      <div className="py-12 text-center text-slate-400">Aucun paiement encaissé.</div>
                    )}
                  </div>
                )}

                {activeTab === 'interventions' && (
                  <div className="space-y-3">
                    {clientVisits.map((v) => (
                      <div key={v.id} className="p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{v.motif}</span>
                          <span className="text-[11px] font-mono text-slate-500">{v.date} ({v.heure_depart} - {v.heure_retour})</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{v.travail_effectue}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                          <span>Résultat : <strong className="text-slate-700">{v.resultat}</strong></span>
                          <span>Facturable : {v.facturable ? `${formatDH(v.montant_facturable)}` : 'Non'}</span>
                        </div>
                      </div>
                    ))}
                    {clientVisits.length === 0 && (
                      <div className="py-12 text-center text-slate-400">Aucune intervention enregistrée.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              Sélectionnez un client pour ouvrir sa fiche 360°.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Client (CL-1 with duplicate ICE & name check) */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Créer un nouveau client (CL-1)</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {newError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{newError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-600 mb-1 font-medium">Raison Sociale / Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.raison_sociale}
                    onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Numéro ICE (15 chiffres)</label>
                  <input
                    type="text"
                    placeholder="001928374000032"
                    value={formData.ice}
                    onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Identifiant Fiscal (IF)</label>
                  <input
                    type="text"
                    value={formData.if}
                    onChange={(e) => setFormData({ ...formData, if: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Contact Principal</label>
                  <input
                    type="text"
                    value={formData.contact_nom}
                    onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Fonction</label>
                  <input
                    type="text"
                    value={formData.contact_fonction}
                    onChange={(e) => setFormData({ ...formData, contact_fonction: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Téléphone</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Ville</label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as ClientStatus })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="actif">Actif</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Adresse</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
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
                  Créer le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
