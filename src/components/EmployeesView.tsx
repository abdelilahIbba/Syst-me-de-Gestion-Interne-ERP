/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee, ContractType, EmployeeStatus } from '../types';
import { formatDH } from '../utils/calculations';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  FileText,
  AlertCircle,
  Briefcase,
  History,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  CheckCircle2,
  X,
  Edit2,
  UserX,
  Download,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { employees, employeeHistory, addEmployee, updateEmployee, deactivateEmployee, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartement, setFilterDepartement] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(employees[0] || null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New employee form state
  const [formData, setFormData] = useState({
    matricule: `MAT-00${employees.length + 1}`,
    nom: '',
    prenom: '',
    cin: '',
    date_naissance: '1995-01-01',
    telephone: '+212 6',
    email: '',
    adresse: 'Casablanca',
    poste: 'Développeur Full-Stack',
    departement: 'Technique',
    type_contrat: 'CDI' as ContractType,
    date_embauche: new Date().toISOString().split('T')[0],
    date_fin_contrat: '',
    salaire_brut_base: 12000,
    salaire_net_base: 9800,
    numero_cnss: '',
    mode_paiement: 'virement' as const,
    rib: '',
    statut: 'actif' as EmployeeStatus,
    hourly_cost: 150,
  });

  // Edit employee state with reason (motif)
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [editMotif, setEditMotif] = useState('');

  const departments = ['Technique', 'Finance', 'Commercial', 'Ressources Humaines', 'Direction', 'Support & Déploiement'];

  // Check CDD / Stage expiration < 30 days (RH-9)
  const isExpiringSoon = (emp: Employee) => {
    if (!emp.date_fin_contrat) return false;
    const diff = new Date(emp.date_fin_contrat).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.poste.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartement === 'all' || emp.departement === filterDepartement;
    const matchesStatut = filterStatut === 'all' || emp.statut === filterStatut;
    return matchesSearch && matchesDept && matchesStatut;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.email) return;

    const created = addEmployee({
      ...formData,
      matricule: `MAT-00${employees.length + 1}`,
    });
    setIsNewModalOpen(false);
    setSelectedEmployee(created);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditData({
      poste: emp.poste,
      departement: emp.departement,
      type_contrat: emp.type_contrat,
      salaire_brut_base: emp.salaire_brut_base,
      salaire_net_base: emp.salaire_net_base,
      telephone: emp.telephone,
      email: emp.email,
      rib: emp.rib,
      hourly_cost: emp.hourly_cost,
    });
    setEditMotif('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    updateEmployee(selectedEmployee.id, editData, editMotif);
    setSelectedEmployee({ ...selectedEmployee, ...editData });
    setIsEditModalOpen(false);
  };

  const exportEmployeesCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Poste', 'Département', 'Contrat', 'Salaire Brut', 'Statut', 'Email'];
    const rows = employees.map((e) => [
      e.matricule,
      e.nom,
      e.prenom,
      e.poste,
      e.departement,
      e.type_contrat,
      e.salaire_brut_base,
      e.statut,
      e.email,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employes_atlastech_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Gestion des Employés & RH</h2>
          <div className="text-xs text-slate-500 mt-0.5">
            Module RH-1 à RH-9 · Effectif total : {employees.length} collaborateurs
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportEmployeesCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ajouter un Employé</span>
          </button>
        </div>
      </div>

      {/* Expiration alert box (RH-9) */}
      {employees.some(isExpiringSoon) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-semibold">Alerte Échéance Contrat RH-9 : </span>
            {employees
              .filter(isExpiringSoon)
              .map((e) => `${e.prenom} ${e.nom} (${e.type_contrat} - fin au ${e.date_fin_contrat})`)
              .join(', ')}
            . Renouvellement ou sortie à formaliser sous 30 jours.
          </div>
        </div>
      )}

      {/* Main split: Table on Left / Employee 360° Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List: 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          {/* Filters bar */}
          <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher nom, matricule, poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterDepartement}
              onChange={(e) => setFilterDepartement(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
            >
              <option value="all">Tous Départements</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700"
            >
              <option value="all">Tous Statuts</option>
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="sorti">Sorti</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Employé</th>
                  <th className="py-2.5 px-3">Poste & Dép.</th>
                  <th className="py-2.5 px-3">Contrat</th>
                  <th className="py-2.5 px-3 text-right">Salaire Brut</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployee?.id === emp.id;
                  const expiring = isExpiringSoon(emp);

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70 font-medium' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.prenom.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {emp.prenom} {emp.nom}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{emp.matricule}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-800">{emp.poste}</div>
                        <div className="text-[11px] text-slate-500">{emp.departement}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">{emp.type_contrat}</span>
                        {expiring && (
                          <div className="text-[10px] text-amber-700 font-semibold">Fin &lt; 30j</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-900">
                        {formatDH(emp.salaire_brut_base)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[11px] font-medium ${
                            emp.statut === 'actif'
                              ? 'text-emerald-700'
                              : emp.statut === 'suspendu'
                              ? 'text-amber-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {emp.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Aucun collaborateur ne correspond aux critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Detail: Fiche Employé 360° (RH-2 & RH-3) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          {selectedEmployee ? (
            <>
              {/* Header card */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    {selectedEmployee.prenom.charAt(0)}
                    {selectedEmployee.nom.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedEmployee.prenom} {selectedEmployee.nom}
                    </h3>
                    <div className="text-xs text-slate-500">{selectedEmployee.poste}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {selectedEmployee.matricule} · CIN: {selectedEmployee.cin}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(selectedEmployee)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Modifier l'employé"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {selectedEmployee.statut === 'actif' && (
                    <button
                      onClick={() => deactivateEmployee(selectedEmployee.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                      title="Désactiver l'employé (RH-1: jamais supprimer)"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedEmployee.telephone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedEmployee.adresse}</span>
                </div>
              </div>

              {/* Contract & Compensation (RH-2) */}
              <div className="bg-slate-50 rounded-lg p-3.5 space-y-2.5 text-xs">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span>Conditions Contractuelles & Paie</span>
                  <span className="font-mono text-emerald-700">{selectedEmployee.type_contrat}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-500">Date d'embauche :</span>
                    <div className="font-medium text-slate-800">{selectedEmployee.date_embauche}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Fin de contrat :</span>
                    <div className="font-medium text-slate-800">
                      {selectedEmployee.date_fin_contrat || 'Indéterminée (CDI)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Salaire Brut Base :</span>
                    <div className="font-mono font-bold text-slate-900">
                      {formatDH(selectedEmployee.salaire_brut_base)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Salaire Net Est. :</span>
                    <div className="font-mono font-bold text-emerald-800">
                      {formatDH(selectedEmployee.salaire_net_base)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">N° CNSS :</span>
                    <div className="font-mono text-slate-800">{selectedEmployee.numero_cnss || 'Non renseigné'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Coût horaire projet :</span>
                    <div className="font-mono text-slate-800">{selectedEmployee.hourly_cost} DH/h</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500">RIB bancaire : </span>
                  <span className="font-mono text-slate-800">{selectedEmployee.rib || 'Non renseigné'}</span>
                </div>
              </div>

              {/* Automatic Change History (RH-3) */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>Historique des Évolutions (RH-3)</span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {employeeHistory
                    .filter((h) => h.employee_id === selectedEmployee.id)
                    .map((h) => (
                      <div key={h.id} className="p-2.5 bg-slate-50 rounded-md border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-medium capitalize text-blue-700">{h.type}</span>
                          <span>{h.date_effet}</span>
                        </div>
                        <div className="mt-1 text-slate-800">
                          <span className="line-through text-slate-400 mr-2">{h.ancienne_valeur}</span>
                          <span className="font-semibold text-emerald-700">→ {h.nouvelle_valeur}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 italic mt-0.5">{h.motif}</div>
                      </div>
                    ))}
                  {employeeHistory.filter((h) => h.employee_id === selectedEmployee.id).length === 0 && (
                    <div className="text-xs text-slate-400 py-2 text-center">Aucun changement enregistré.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Sélectionnez un employé pour afficher sa fiche complète.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Employee */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Ajouter un nouveau collaborateur</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Email professionnel *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Téléphone</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">CIN</label>
                  <input
                    type="text"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">N° CNSS</label>
                  <input
                    type="text"
                    value={formData.numero_cnss}
                    onChange={(e) => setFormData({ ...formData, numero_cnss: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Poste</label>
                  <input
                    type="text"
                    value={formData.poste}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Département</label>
                  <select
                    value={formData.departement}
                    onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Type de contrat</label>
                  <select
                    value={formData.type_contrat}
                    onChange={(e) => setFormData({ ...formData, type_contrat: e.target.value as ContractType })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Salaire Brut de Base (DH)</label>
                  <input
                    type="number"
                    value={formData.salaire_brut_base}
                    onChange={(e) => setFormData({ ...formData, salaire_brut_base: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {formData.type_contrat === 'CDD' && (
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Date de fin CDD</label>
                  <input
                    type="date"
                    value={formData.date_fin_contrat}
                    onChange={(e) => setFormData({ ...formData, date_fin_contrat: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1 font-medium">RIB Bancaire (24 chiffres)</label>
                <input
                  type="text"
                  placeholder="011 780 0000 000000000000 00"
                  value={formData.rib}
                  onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Enregistrer l'employé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Employee (Poste / Salaire / Contrat) */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Modifier : {selectedEmployee.prenom} {selectedEmployee.nom}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Poste</label>
                <input
                  type="text"
                  value={editData.poste || ''}
                  onChange={(e) => setEditData({ ...editData, poste: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Salaire Brut (DH)</label>
                <input
                  type="number"
                  value={editData.salaire_brut_base || 0}
                  onChange={(e) => setEditData({ ...editData, salaire_brut_base: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Motif de la modification (RH-3 traçabilité automatique) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Augmentation annuelle, promotion de poste..."
                  value={editMotif}
                  onChange={(e) => setEditMotif(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Sauvegarder l'évolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
