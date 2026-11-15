/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { Employee, ContractType, EmployeeStatus } from '../types';
import { formatDH } from '../utils/calculations';
import {
  UserPlus,
  Search,
  AlertCircle,
  History,
  Phone,
  Mail,
  MapPin,
  X,
  Edit2,
  UserX,
  Download,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { employees, employeeHistory, addEmployee, updateEmployee, deactivateEmployee } = useApp();
  const { t } = useI18n();

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

  const translateEmployeeStatus = (status: EmployeeStatus) => {
    if (status === 'actif') return t('emp.status.actif');
    if (status === 'suspendu') return t('emp.status.suspendu');
    return t('emp.status.sorti');
  };

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
    link.setAttribute('download', `employes_devnapp_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D1B38] tracking-tight">{t('emp.title')}</h2>
          <div className="text-xs text-[#546A8E] mt-0.5">
            {t('emp.subtitle', { count: employees.length })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportEmployeesCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#273B63] bg-[#F1F5FB] hover:bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl shadow-xs whitespace-nowrap shrink-0 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#0284C7]" />
            <span>{t('common.exportCsv')}</span>
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#F4F8FD] bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] rounded-xl shadow-sm shadow-[#0284C7]/20 transition-all whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('emp.addBtn')}</span>
          </button>
        </div>
      </div>

      {/* Expiration alert box (RH-9) */}
      {employees.some(isExpiringSoon) && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-semibold">{t('emp.expiringAlert')} </span>
            {employees
              .filter(isExpiringSoon)
              .map((e) => `${e.prenom} ${e.nom} (${e.type_contrat} - ${e.date_fin_contrat})`)
              .join(', ')}
            . {t('emp.expiringSuffix')}
          </div>
        </div>
      )}

      {/* Main split: Table on Left / Employee 360° Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List: 7 cols */}
        <div className="lg:col-span-7 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] flex flex-col overflow-hidden">
          {/* Filters bar */}
          <div className="p-3.5 border-b border-[#DAE5F2] flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-[#627799] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('emp.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-9 pe-3 py-1.5 text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] placeholder:text-[#6B80A3] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
              />
            </div>

            <select
              value={filterDepartement}
              onChange={(e) => setFilterDepartement(e.target.value)}
              className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-1.5 px-2.5 text-[#273B63] flex-1 sm:flex-none focus:outline-hidden focus:border-[#0284C7]"
            >
              <option value="all">{t('emp.allDepts')}</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="text-xs bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl py-1.5 px-2.5 text-[#273B63] flex-1 sm:flex-none focus:outline-hidden focus:border-[#0284C7]"
            >
              <option value="all">{t('emp.allStatuses')}</option>
              <option value="actif">{t('emp.status.actif')}</option>
              <option value="suspendu">{t('emp.status.suspendu')}</option>
              <option value="sorti">{t('emp.status.sorti')}</option>
            </select>
          </div>

          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-[#DCE6F3] max-h-[380px] overflow-y-auto">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmployee?.id === emp.id;
              const expiring = isExpiringSoon(emp);
              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-2 ${
                    isSelected ? 'bg-[#DCE9F9]' : 'hover:bg-[#E7EFFA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#DCE6F4] text-[#0D1B38] border border-[#C5D6EC] flex items-center justify-center font-bold text-xs shrink-0">
                        {emp.prenom.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-[#0D1B38] truncate">
                          {emp.prenom} {emp.nom}
                        </div>
                        <div className="text-[11px] text-[#546A8E] truncate">
                          {emp.poste} · {emp.departement}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-medium shrink-0 ${
                        emp.statut === 'actif'
                          ? 'text-emerald-700'
                          : emp.statut === 'suspendu'
                          ? 'text-amber-700'
                          : 'text-[#627799]'
                      }`}
                    >
                      {translateEmployeeStatus(emp.statut)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#546A8E] pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{emp.matricule}</span>
                      <span>·</span>
                      <span className="font-medium text-[#273B63]">{emp.type_contrat}</span>
                      {expiring && (
                        <span className="text-[10px] text-amber-700 font-semibold">{t('emp.endingSoon')}</span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#0D1B38]">{formatDH(emp.salaire_brut_base)}</span>
                  </div>
                </div>
              );
            })}
            {filteredEmployees.length === 0 && (
              <div className="py-8 text-center text-[#627799] text-xs">{t('emp.noMatch')}</div>
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#E6EEF8] text-[#475E82] font-semibold border-b border-[#D1DFEE]">
                <tr>
                  <th className="py-2.5 px-4 text-start">{t('emp.col.employee')}</th>
                  <th className="py-2.5 px-3 text-start">{t('emp.col.roleDept')}</th>
                  <th className="py-2.5 px-3 text-start">{t('emp.col.contract')}</th>
                  <th className="py-2.5 px-3 text-end">{t('emp.col.grossSalary')}</th>
                  <th className="py-2.5 px-3 text-center">{t('emp.col.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F3]">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployee?.id === emp.id;
                  const expiring = isExpiringSoon(emp);

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#DCE9F9] font-medium' : 'hover:bg-[#E7EFFA]'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#DCE6F4] text-[#0D1B38] border border-[#C5D6EC] flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.prenom.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0D1B38]">
                              {emp.prenom} {emp.nom}
                            </div>
                            <div className="text-[11px] text-[#627799] font-mono">{emp.matricule}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[#1C2E4F]">{emp.poste}</div>
                        <div className="text-[11px] text-[#546A8E]">{emp.departement}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-[#273B63]">{emp.type_contrat}</span>
                        {expiring && (
                          <div className="text-[10px] text-amber-700 font-semibold">{t('emp.endingSoon')}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-end font-mono font-medium text-[#0D1B38]">
                        {formatDH(emp.salaire_brut_base)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[11px] font-medium ${
                            emp.statut === 'actif'
                              ? 'text-emerald-700'
                              : emp.statut === 'suspendu'
                              ? 'text-amber-700'
                              : 'text-[#627799]'
                          }`}
                        >
                          {translateEmployeeStatus(emp.statut)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#627799] text-xs">
                      {t('emp.noMatch')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Detail: Employee 360° Card (RH-2 & RH-3) */}
        <div className="lg:col-span-5 bg-[#F1F5FB] rounded-2xl border border-[#D1DFEE] shadow-[0_6px_22px_-8px_rgba(11,23,51,0.08)] p-4 sm:p-5 space-y-5">
          {selectedEmployee ? (
            <>
              {/* Header card */}
              <div className="flex items-start justify-between pb-4 border-b border-[#DAE5F2]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#DFF0FC] border border-[#A5D3F3] text-[#0369A1] flex items-center justify-center font-bold text-lg">
                    {selectedEmployee.prenom.charAt(0)}
                    {selectedEmployee.nom.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0D1B38]">
                      {selectedEmployee.prenom} {selectedEmployee.nom}
                    </h3>
                    <div className="text-xs text-[#546A8E]">{selectedEmployee.poste}</div>
                    <div className="text-[11px] text-[#627799] font-mono mt-0.5">
                      {selectedEmployee.matricule} · CIN: {selectedEmployee.cin}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(selectedEmployee)}
                    className="p-2 text-[#475E82] hover:text-[#0D1B38] hover:bg-[#E4ECF7] rounded-xl transition-colors"
                    title={t('emp.editTooltip')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {selectedEmployee.statut === 'actif' && (
                    <button
                      onClick={() => deactivateEmployee(selectedEmployee.id)}
                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-100/70 rounded-xl transition-colors"
                      title={t('emp.deactivateTooltip')}
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#3B4F73]">
                  <Mail className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#3B4F73]">
                  <Phone className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                  <span dir="ltr">{selectedEmployee.telephone}</span>
                </div>
                <div className="flex items-center gap-2 text-[#3B4F73]">
                  <MapPin className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                  <span>{selectedEmployee.adresse}</span>
                </div>
              </div>

              {/* Contract & Compensation (RH-2) */}
              <div className="bg-[#E6EEF8] border border-[#CFDDED] rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="font-semibold text-[#0D1B38] flex items-center justify-between">
                  <span>{t('emp.contractSection')}</span>
                  <span className="font-mono text-emerald-700">{selectedEmployee.type_contrat}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-[#546A8E]">{t('emp.hireDate')}</span>
                    <div className="font-medium text-[#1C2E4F]">{selectedEmployee.date_embauche}</div>
                  </div>
                  <div>
                    <span className="text-[#546A8E]">{t('emp.endDate')}</span>
                    <div className="font-medium text-[#1C2E4F]">
                      {selectedEmployee.date_fin_contrat || t('emp.indefinite')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#546A8E]">{t('emp.grossBase')}</span>
                    <div className="font-mono font-bold text-[#0D1B38]">
                      {formatDH(selectedEmployee.salaire_brut_base)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#546A8E]">{t('emp.netEst')}</span>
                    <div className="font-mono font-bold text-emerald-800">
                      {formatDH(selectedEmployee.salaire_net_base)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#546A8E]">{t('emp.cnssNum')}</span>
                    <div className="font-mono text-[#1C2E4F]">{selectedEmployee.numero_cnss || t('emp.notProvided')}</div>
                  </div>
                  <div>
                    <span className="text-[#546A8E]">{t('emp.hourlyCost')}</span>
                    <div className="font-mono text-[#1C2E4F]">{selectedEmployee.hourly_cost} DH/{t('common.hours')}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#CFDDED] text-[11px]">
                  <span className="text-[#546A8E]">{t('emp.bankRib')} </span>
                  <span className="font-mono text-[#1C2E4F]">{selectedEmployee.rib || t('emp.notProvided')}</span>
                </div>
              </div>

              {/* Automatic Change History (RH-3) */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-[#0D1B38] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>{t('emp.historyTitle')}</span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pe-1">
                  {employeeHistory
                    .filter((h) => h.employee_id === selectedEmployee.id)
                    .map((h) => (
                      <div key={h.id} className="p-2.5 bg-[#E6EEF8] rounded-xl border border-[#CFDDED] text-xs">
                        <div className="flex items-center justify-between text-[11px] text-[#546A8E]">
                          <span className="font-medium capitalize text-[#0369A1]">{h.type}</span>
                          <span>{h.date_effet}</span>
                        </div>
                        <div className="mt-1 text-[#1C2E4F]">
                          <span className="line-through text-[#6B80A3] me-2">{h.ancienne_valeur}</span>
                          <span className="font-semibold text-emerald-700">→ {h.nouvelle_valeur}</span>
                        </div>
                        <div className="text-[11px] text-[#546A8E] italic mt-0.5">{h.motif}</div>
                      </div>
                    ))}
                  {employeeHistory.filter((h) => h.employee_id === selectedEmployee.id).length === 0 && (
                    <div className="text-xs text-[#627799] py-2 text-center">{t('emp.noHistory')}</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-[#627799] text-xs">
              {t('emp.selectPrompt')}
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Employee */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] border border-[#CFDDED] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DAE5F2] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38]">{t('emp.modalNewTitle')}</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#627799] hover:text-[#0D1B38]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.lastName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.firstName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.email')}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.phone')}</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.cin')}</label>
                  <input
                    type="text"
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.cnss')}</label>
                  <input
                    type="text"
                    value={formData.numero_cnss}
                    onChange={(e) => setFormData({ ...formData, numero_cnss: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.role')}</label>
                  <input
                    type="text"
                    value={formData.poste}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.dept')}</label>
                  <select
                    value={formData.departement}
                    onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.contractType')}</label>
                  <select
                    value={formData.type_contrat}
                    onChange={(e) => setFormData({ ...formData, type_contrat: e.target.value as ContractType })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.baseGross')}</label>
                  <input
                    type="number"
                    value={formData.salaire_brut_base}
                    onChange={(e) => setFormData({ ...formData, salaire_brut_base: Number(e.target.value) })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {formData.type_contrat === 'CDD' && (
                <div>
                  <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.cddEnd')}</label>
                  <input
                    type="date"
                    value={formData.date_fin_contrat}
                    onChange={(e) => setFormData({ ...formData, date_fin_contrat: e.target.value })}
                    className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.rib')}</label>
                <input
                  type="text"
                  placeholder="011 780 0000 000000000000 00"
                  value={formData.rib}
                  onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                  className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div className="pt-3 border-t border-[#DAE5F2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-[#C9D9EC] bg-[#E6EEF8] hover:bg-[#DCE7F6] rounded-xl text-[#273B63] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-[#F4F8FD] rounded-xl font-semibold shadow-sm"
                >
                  {t('emp.saveNewBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Employee (Poste / Salaire / Contrat) */}
      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-[#0B1733]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-[#F1F5FB] border border-[#CFDDED] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DAE5F2] pb-3">
              <h3 className="text-base font-bold text-[#0D1B38]">
                {t('emp.modalEditTitle', { name: `${selectedEmployee.prenom} ${selectedEmployee.nom}` })}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#627799] hover:text-[#0D1B38]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.role')}</label>
                <input
                  type="text"
                  value={editData.poste || ''}
                  onChange={(e) => setEditData({ ...editData, poste: e.target.value })}
                  className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[#3B4F73] mb-1 font-medium">{t('emp.field.grossLabel')}</label>
                <input
                  type="number"
                  value={editData.salaire_brut_base || 0}
                  onChange={(e) => setEditData({ ...editData, salaire_brut_base: Number(e.target.value) })}
                  className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl font-mono text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-[#3B4F73] mb-1 font-medium">
                  {t('emp.field.reason')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('emp.field.reasonPlaceholder')}
                  value={editMotif}
                  onChange={(e) => setEditMotif(e.target.value)}
                  className="w-full p-2 bg-[#E6EEF8] border border-[#C9D9EC] rounded-xl text-[#0D1B38] focus:outline-hidden focus:bg-[#F5F8FD] focus:border-[#0284C7]"
                />
              </div>

              <div className="pt-3 border-t border-[#DAE5F2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-[#C9D9EC] bg-[#E6EEF8] hover:bg-[#DCE7F6] rounded-xl text-[#273B63] transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#0284C7] to-[#0891B2] hover:from-[#0369A1] hover:to-[#0E7490] text-[#F4F8FD] rounded-xl font-semibold shadow-sm"
                >
                  {t('emp.saveEditBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
