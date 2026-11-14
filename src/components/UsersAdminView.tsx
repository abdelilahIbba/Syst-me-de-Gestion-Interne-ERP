/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import {
  UserManagementSection,
  RoleManagementSection,
  RolePermissionsMatrixSection,
} from './UserRoleManagement';
import { Users, Shield, KeyRound } from 'lucide-react';

export const UsersAdminView: React.FC = () => {
  const { hasUserPermission } = useApp();
  const { t } = useI18n();
  const canManageUsers = hasUserPermission('manage_users');
  const canManageRoles = hasUserPermission('manage_roles');

  const [tab, setTab] = useState<'users' | 'roles' | 'matrix'>(
    canManageUsers ? 'users' : 'roles'
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('usersAdmin.title')}</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          {t('usersAdmin.subtitle')}
        </div>
      </div>

      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto sm:flex-wrap">
        {canManageUsers && (
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              tab === 'users'
                ? 'bg-[#070b18] text-cyan-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('settings.tab.users')}</span>
          </button>
        )}

        {canManageRoles && (
          <>
            <button
              type="button"
              onClick={() => setTab('roles')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                tab === 'roles'
                  ? 'bg-[#070b18] text-cyan-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t('settings.tab.roles')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                tab === 'matrix'
                  ? 'bg-[#070b18] text-cyan-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t('settings.tab.matrix')}</span>
            </button>
          </>
        )}
      </div>

      {tab === 'users' && canManageUsers && <UserManagementSection />}
      {tab === 'roles' && canManageRoles && <RoleManagementSection />}
      {tab === 'matrix' && canManageRoles && <RolePermissionsMatrixSection />}
    </div>
  );
};
