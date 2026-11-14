/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { PermissionKey, Role, User } from '../types';
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_MODULES,
  ALL_PERMISSION_KEYS,
  findRole,
  normalizeRoleKey,
} from '../utils/rbac';
import {
  UserPlus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Search,
  Shield,
  ShieldCheck,
  Plus,
  X,
  Users as UsersIcon,
  Check,
  Info,
} from 'lucide-react';

// ==========================================
// 1. USER MANAGEMENT SECTION (FULL CRUD)
// ==========================================
export const UserManagementSection: React.FC = () => {
  const {
    users,
    roles,
    employees,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    hasUserPermission,
    logAction,
  } = useApp();
  const { t, tRole } = useI18n();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'devnapp2026!',
    role: roles[0]?.key || 'employe',
    employee_id: employees[0]?.id || '',
    active: true,
  });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const canManageUsers = hasUserPermission('manage_users');

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const roleObj = findRole(u.role_id || u.role, roles);
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.id.toLowerCase().includes(term) ||
      (roleObj?.name || u.role).toLowerCase().includes(term);
    const matchesRole =
      roleFilter === 'all' ||
      normalizeRoleKey(u.role) === normalizeRoleKey(roleFilter) ||
      u.role_id === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: 'devnapp2026!',
      role: roles.find((r) => r.key === 'employe')?.key || roles[0]?.key || 'employe',
      employee_id: employees[0]?.id || '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    const matchedRole = findRole(u.role_id || u.role, roles);
    setFormData({
      name: u.name,
      email: u.email,
      password: u.password || 'devnapp2026!',
      role: matchedRole?.key || u.role,
      employee_id: u.employee_id || '',
      active: u.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const res = updateUser(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        employee_id: formData.employee_id,
        active: formData.active,
        ...(formData.password ? { password: formData.password } : {}),
      });
      if (!res.success) {
        showFeedback('error', res.error || t('users.errorUpdate'));
        return;
      }
      showFeedback('success', t('users.msg.updated', { name: formData.name }));
      setIsModalOpen(false);
    } else {
      const res = addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password || 'devnapp2026!',
        role: formData.role,
        employee_id: formData.employee_id,
        active: formData.active,
        failed_attempts: 0,
      });
      if (!res.success) {
        showFeedback('error', res.error || t('users.errorCreate'));
        return;
      }
      showFeedback('success', t('users.msg.created', { name: formData.name }));
      setIsModalOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteUser) return;
    const res = deleteUser(confirmDeleteUser.id);
    if (!res.success) {
      showFeedback('error', res.error || t('users.errorDelete'));
      setConfirmDeleteUser(null);
      return;
    }
    showFeedback('success', t('users.msg.deleted', { name: confirmDeleteUser.name }));
    setConfirmDeleteUser(null);
  };

  const handleToggleStatus = (u: User) => {
    if (u.id === currentUser.id) {
      showFeedback('error', t('users.msg.selfSuspend'));
      return;
    }
    const res = updateUser(u.id, { active: !u.active });
    if (!res.success) {
      showFeedback('error', res.error || t('users.errorStatus'));
      return;
    }
    showFeedback(
      'success',
      t('users.msg.statusChanged', {
        status: !u.active ? t('users.statusActivated') : t('users.statusSuspended'),
      })
    );
  };

  const handleUnlock = (u: User) => {
    updateUser(u.id, { failed_attempts: 0, locked_until: null });
    showFeedback('success', t('users.msg.unlocked', { name: u.name }));
  };

  const handleResetPassword = (u: User) => {
    updateUser(u.id, { must_change_password: true, password: 'devnapp2026!' });
    logAction('modifier', 'Users', u.id, null, { must_change_password: true });
    showFeedback('success', t('users.msg.pwdReset', { name: u.name }));
  };

  return (
    <div className="space-y-5">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('users.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('users.subtitle')}
          </p>
        </div>

        {canManageUsers && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('users.newBtn')}</span>
          </button>
        )}
      </div>

      {/* Feedback Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-cyan-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700 font-medium"
        >
          <option value="all">{t('users.allRoles', { count: roles.length })}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.key}>
              {tRole(r.key, r.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Users List (Mobile Cards) + Desktop Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-100">
          {filteredUsers.map((u) => {
            const emp = employees.find((e) => e.id === u.employee_id);
            const roleObj = findRole(u.role_id || u.role, roles);
            const roleLabel = tRole(roleObj?.key || u.role, roleObj?.name || u.role);
            const isLocked = u.failed_attempts >= 5 || !!u.locked_until;
            const isSelf = u.id === currentUser.id;

            return (
              <div key={u.id} className="p-3.5 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{u.name}</span>
                      {isSelf && (
                        <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded-sm">
                          {t('users.activeSession')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {emp ? `${emp.prenom} ${emp.nom} · ${emp.poste}` : t('users.systemAccount')}
                    </div>
                  </div>

                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm shrink-0">
                      <Lock className="w-3 h-3" />
                      <span>{t('common.locked')}</span>
                    </span>
                  ) : u.active ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm shrink-0">
                      {t('common.active')}
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm shrink-0">
                      {t('common.suspended')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-md border text-[11px] ${
                      roleObj?.badgeColor || 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    <Shield className="w-3 h-3 shrink-0" />
                    <span>{roleLabel}</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 truncate">{u.email}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                  <span>ID: {u.id}</span>
                  <span>{u.last_login || t('users.neverLogged')}</span>
                </div>

                {canManageUsers && (
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                    {isLocked && (
                      <button
                        type="button"
                        onClick={() => handleUnlock(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>{t('users.unlock')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(u)}
                      className="p-2 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-md transition-colors"
                      title={t('users.action.editTitle')}
                      aria-label={`${t('common.edit')} ${u.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetPassword(u)}
                      className="p-2 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                      title={t('users.action.resetPwdTitle')}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                          u.active
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {u.active ? t('users.suspend') : t('users.reactivate')}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUser(u)}
                      className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                      title={t('users.action.deleteTitle')}
                      aria-label={`${t('common.delete')} ${u.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">{t('users.noMatch')}</div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-start">{t('users.col.user')}</th>
                <th className="py-3 px-3 text-start">{t('users.col.emailId')}</th>
                <th className="py-3 px-3 text-start">{t('users.col.role')}</th>
                <th className="py-3 px-3 text-start">{t('users.col.lastLogin')}</th>
                <th className="py-3 px-3 text-center">{t('users.col.status')}</th>
                <th className="py-3 px-4 text-end">{t('users.col.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const emp = employees.find((e) => e.id === u.employee_id);
                const roleObj = findRole(u.role_id || u.role, roles);
                const roleLabel = tRole(roleObj?.key || u.role, roleObj?.name || u.role);
                const isLocked = u.failed_attempts >= 5 || !!u.locked_until;
                const isSelf = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{u.name}</span>
                        {isSelf && (
                          <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.2 rounded-sm">
                            {t('users.activeSession')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {emp ? `${emp.prenom} ${emp.nom} · ${emp.poste}` : t('users.systemAccount')}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-700">{u.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {u.id}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-md border text-[11px] ${
                          roleObj?.badgeColor || 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        <Shield className="w-3 h-3 shrink-0" />
                        <span>{roleLabel}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 tabular-nums">
                      {u.last_login || t('users.neverLogged')}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm">
                          <Lock className="w-3 h-3" />
                          <span>{t('common.locked')}</span>
                        </span>
                      ) : u.active ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                          {t('common.active')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">
                          {t('common.suspended')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-end whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {isLocked && canManageUsers && (
                          <button
                            type="button"
                            onClick={() => handleUnlock(u)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                            title={t('users.action.unlockTitle')}
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>{t('users.unlock')}</span>
                          </button>
                        )}

                        {canManageUsers && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-md transition-colors"
                              title={t('users.action.editTitle')}
                              aria-label={`${t('common.edit')} ${u.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResetPassword(u)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                              title={t('users.action.resetPwdTitle')}
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u)}
                                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                                  u.active
                                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                {u.active ? t('users.suspend') : t('users.reactivate')}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUser(u)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                              title={t('users.action.deleteTitle')}
                              aria-label={`${t('common.delete')} ${u.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t('users.noMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {editingUser ? t('users.modal.editTitle', { name: editingUser.name }) : t('users.modal.createTitle')}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('users.field.fullName')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('users.field.fullNamePlaceholder')}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('users.field.email')}</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('users.field.emailPlaceholder')}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  {editingUser ? t('users.field.passwordEdit') : t('users.field.passwordNew')}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('users.field.assignedRole')}</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-cyan-500 outline-hidden"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.key}>
                      {tRole(r.key, r.name)} ({t('users.field.rightsCount', { count: r.permissions.length })})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('users.field.linkedEmployee')}</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">{t('users.field.noEmployee')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.prenom} {emp.nom} ({emp.poste})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-slate-700 font-medium">{t('users.field.activeAccount')}</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingUser ? t('users.btn.saveEdit') : t('users.btn.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold">{t('users.deleteTitle')}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('users.deletePrompt')}{' '}
              <strong className="text-slate-900">{confirmDeleteUser.name}</strong> ({confirmDeleteUser.email}) ?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. ROLE MANAGEMENT SECTION (FULL CRUD)
// ==========================================
export const RoleManagementSection: React.FC = () => {
  const { roles, users, addRole, updateRole, deleteRole, hasUserPermission } = useApp();
  const { t, tRole } = useI18n();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [confirmDeleteRole, setConfirmDeleteRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
  });

  const canManageRoles = hasUserPermission('manage_roles');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const countUsersForRole = (role: Role) =>
    users.filter(
      (u) =>
        u.role_id === role.id ||
        normalizeRoleKey(u.role) === normalizeRoleKey(role.key) ||
        u.role === role.key
    ).length;

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      key: '',
      description: '',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      key: role.key,
      description: role.description,
      badgeColor: role.badgeColor || 'bg-cyan-50 text-cyan-800 border-cyan-300',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRole) {
      const res = updateRole(editingRole.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        badgeColor: formData.badgeColor,
      });
      if (!res.success) {
        showFeedback('error', res.error || t('roles.errorUpdate'));
        return;
      }
      showFeedback('success', t('roles.msg.updated', { name: formData.name }));
      setIsModalOpen(false);
    } else {
      const keyToUse = formData.key.trim() || normalizeRoleKey(formData.name);
      const res = addRole({
        name: formData.name.trim(),
        key: keyToUse,
        description: formData.description.trim(),
        badgeColor: formData.badgeColor,
        permissions: ['view_dashboard'],
      });
      if (!res.success) {
        showFeedback('error', res.error || t('roles.errorCreate'));
        return;
      }
      showFeedback('success', t('roles.msg.created', { name: formData.name }));
      setIsModalOpen(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteRole) return;
    const res = deleteRole(confirmDeleteRole.id);
    if (!res.success) {
      showFeedback('error', res.error || t('roles.errorDelete'));
      setConfirmDeleteRole(null);
      return;
    }
    showFeedback('success', t('roles.msg.deleted', { name: tRole(confirmDeleteRole.key, confirmDeleteRole.name) }));
    setConfirmDeleteRole(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('roles.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('roles.subtitle')}
          </p>
        </div>

        {canManageRoles && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('roles.newBtn')}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => {
          const userCount = countUsersForRole(r);
          const isSuperAdmin = normalizeRoleKey(r.key) === 'super_admin';
          const roleDisplay = tRole(r.key, r.name);

          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                        r.badgeColor || 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{roleDisplay}</span>
                    </span>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {t('roles.keyPrefix')} {r.key}
                    </div>
                  </div>

                  {canManageRoles && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-md transition-colors"
                        title={t('roles.action.editTitle')}
                        aria-label={`${t('common.edit')} ${roleDisplay}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {!isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRole(r)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          title={t('roles.action.deleteTitle')}
                          aria-label={`${t('common.delete')} ${roleDisplay}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{r.description || t('roles.customDesc')}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <UsersIcon className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{t('roles.assignedUsers', { count: userCount })}</span>
                </span>
                <span className="font-mono text-slate-600 tabular-nums">
                  {isSuperAdmin ? t('roles.allRights') : t('roles.permCount', { count: r.permissions.length })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {editingRole ? t('roles.modal.editTitle', { name: tRole(editingRole.key, editingRole.name) }) : t('roles.modal.createTitle')}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('roles.field.name')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name: nameVal,
                      ...(editingRole ? {} : { key: normalizeRoleKey(nameVal) }),
                    }));
                  }}
                  placeholder={t('roles.field.namePlaceholder')}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-hidden"
                />
              </div>

              {!editingRole && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">{t('roles.field.key')}</label>
                  <input
                    type="text"
                    required
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: normalizeRoleKey(e.target.value) })}
                    placeholder={t('roles.field.keyPlaceholder')}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('roles.field.description')}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('roles.field.descPlaceholder')}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">{t('roles.field.badgeColor')}</label>
                <select
                  value={formData.badgeColor}
                  onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="bg-cyan-50 text-cyan-800 border-cyan-300">{t('roles.color.cyan')}</option>
                  <option value="bg-emerald-50 text-emerald-800 border-emerald-300">{t('roles.color.emerald')}</option>
                  <option value="bg-sky-50 text-sky-800 border-sky-300">{t('roles.color.sky')}</option>
                  <option value="bg-amber-50 text-amber-800 border-amber-300">{t('roles.color.amber')}</option>
                  <option value="bg-purple-50 text-purple-800 border-purple-300">{t('roles.color.purple')}</option>
                  <option value="bg-rose-50 text-rose-800 border-rose-300">{t('roles.color.rose')}</option>
                  <option value="bg-slate-100 text-slate-800 border-slate-300">{t('roles.color.slate')}</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingRole ? t('roles.btn.update') : t('roles.btn.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal */}
      {confirmDeleteRole && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-4 sm:p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold">{t('roles.deleteTitle')}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('roles.deletePrompt')}{' '}
              <strong className="text-slate-900">{tRole(confirmDeleteRole.key, confirmDeleteRole.name)}</strong> ?{' '}
              {t('roles.deleteWarning')}
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setConfirmDeleteRole(null)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. PERMISSIONS MATRIX SECTION ("Droits d’accès par rôle")
// ==========================================
export const RolePermissionsMatrixSection: React.FC = () => {
  const { roles, updateRolePermissions, hasUserPermission } = useApp();
  const { t, tRole, tModule, tPerm } = useI18n();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const canManageRoles = hasUserPermission('manage_roles');

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const togglePermission = (role: Role, permKey: PermissionKey) => {
    if (!canManageRoles) return;
    if (normalizeRoleKey(role.key) === 'super_admin') return;

    const exists = role.permissions.includes(permKey);
    const updatedPerms = exists
      ? role.permissions.filter((p) => p !== permKey)
      : [...role.permissions, permKey];

    const res = updateRolePermissions(role.id, updatedPerms);
    if (!res.success) {
      showFeedback('error', res.error || t('matrix.errorUpdate'));
      return;
    }
    showFeedback(
      'success',
      t('matrix.msg.toggled', {
        perm: tPerm(permKey).label,
        state: exists ? t('matrix.msg.revoked') : t('matrix.msg.granted'),
        role: tRole(role.key, role.name),
      })
    );
  };

  const toggleAllForRole = (role: Role) => {
    if (!canManageRoles) return;
    if (normalizeRoleKey(role.key) === 'super_admin') return;

    const hasAll = role.permissions.length === ALL_PERMISSION_KEYS.length;
    const updatedPerms = hasAll ? (['view_dashboard'] as PermissionKey[]) : [...ALL_PERMISSION_KEYS];
    const res = updateRolePermissions(role.id, updatedPerms);
    if (res.success) {
      showFeedback('success', t('matrix.msg.bulkUpdated', { role: tRole(role.key, role.name) }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('matrix.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('matrix.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-cyan-800 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <span>{t('matrix.liveBadge')}</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Matrix Table: Roles x Permissions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-[#070b18] text-slate-200">
              <tr>
                <th className="py-3 px-2.5 sm:py-3.5 sm:px-4 text-start font-semibold min-w-[150px] sm:min-w-[260px] max-w-[165px] sm:max-w-none sticky start-0 bg-[#070b18] z-10 border-e border-slate-800">
                  {t('matrix.col.modulePerm')}
                </th>
                {roles.map((r) => {
                  const isSuperAdmin = normalizeRoleKey(r.key) === 'super_admin';
                  const roleDisplay = tRole(r.key, r.name);
                  return (
                    <th key={r.id} className="py-2.5 px-2 sm:py-3 sm:px-3 text-center min-w-[96px] sm:min-w-[115px] border-s border-slate-800/80">
                      <div className="font-bold text-white truncate max-w-[100px] sm:max-w-[130px] mx-auto" title={roleDisplay}>
                        {roleDisplay}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono font-normal mt-0.5">{r.key}</div>
                      {!isSuperAdmin && canManageRoles && (
                        <button
                          type="button"
                          onClick={() => toggleAllForRole(r)}
                          className="mt-1.5 text-[10px] text-slate-300 hover:text-cyan-300 underline"
                        >
                          {r.permissions.length === ALL_PERMISSION_KEYS.length ? t('matrix.reset') : t('matrix.enableAll')}
                        </button>
                      )}
                      {isSuperAdmin && (
                        <div className="mt-1 text-[10px] text-rose-300 font-mono">{t('matrix.fullAccessLocked')}</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {PERMISSION_MODULES.map((mod) => {
                const modPerms = PERMISSION_DEFINITIONS.filter((p) => p.module === mod);
                return (
                  <React.Fragment key={mod}>
                    {/* Module Category Divider Row */}
                    <tr className="bg-slate-50/90 border-y border-slate-200">
                      <td
                        colSpan={roles.length + 1}
                        className="py-2 px-2.5 sm:px-4 text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                      >
                        {tModule(mod)}
                      </td>
                    </tr>

                    {modPerms.map((perm) => {
                      const localizedPerm = tPerm(perm.key);
                      return (
                        <tr key={perm.key} className="hover:bg-cyan-50/30 transition-colors">
                          <td className="py-2.5 px-2.5 sm:px-4 sticky start-0 bg-white z-10 border-e border-slate-100 max-w-[165px] sm:max-w-none">
                            <div className="font-semibold text-slate-900 leading-snug">{localizedPerm.label}</div>
                            <div className="text-[11px] text-slate-500 leading-snug">{localizedPerm.description}</div>
                          </td>

                          {roles.map((r) => {
                            const isSuperAdmin = normalizeRoleKey(r.key) === 'super_admin';
                            const checked = isSuperAdmin || r.permissions.includes(perm.key);
                            const roleDisplay = tRole(r.key, r.name);

                            return (
                              <td key={`${r.id}-${perm.key}`} className="py-2.5 px-2 sm:px-3 text-center border-s border-slate-100">
                                <button
                                  type="button"
                                  disabled={!canManageRoles || isSuperAdmin}
                                  onClick={() => togglePermission(r, perm.key)}
                                  aria-label={t('matrix.permAria', { perm: localizedPerm.label, role: roleDisplay })}
                                  aria-pressed={checked}
                                  className={`w-7 h-7 sm:w-6 sm:h-6 rounded-md inline-flex items-center justify-center border transition-all ${
                                    isSuperAdmin
                                      ? 'bg-slate-900 border-slate-800 text-cyan-400 cursor-not-allowed opacity-80'
                                      : checked
                                      ? 'bg-gradient-to-br from-cyan-600 to-blue-600 border-cyan-600 text-white shadow-2xs hover:opacity-90'
                                      : 'bg-white border-slate-300 text-transparent hover:border-cyan-500'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
