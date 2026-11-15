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
      <div className="pb-3 border-b border-[#CFDDED]">
        <h2 className="text-xl sm:text-[22px] font-bold text-[#0D1B38] tracking-[-0.02em]">{t('usersAdmin.title')}</h2>
        <div className="text-xs text-[#546A8E] mt-0.5">
          {t('usersAdmin.subtitle')}
        </div>
      </div>

      <div className="ios-segmented flex items-center gap-1 overflow-x-auto sm:flex-wrap">
        {canManageUsers && (
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 ${
              tab === 'users'
                ? 'ios-segmented-active'
                : 'text-[#3C5073] hover:text-[#0D1B38] hover:bg-[#F1F5FB]/60'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${tab === 'users' ? 'text-[#0284C7]' : 'text-[#546A8E]'}`} />
            <span>{t('settings.tab.users')}</span>
          </button>
        )}

        {canManageRoles && (
          <>
            <button
              type="button"
              onClick={() => setTab('roles')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 ${
                tab === 'roles'
                  ? 'ios-segmented-active'
                  : 'text-[#3C5073] hover:text-[#0D1B38] hover:bg-[#F1F5FB]/60'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${tab === 'roles' ? 'text-[#0284C7]' : 'text-[#546A8E]'}`} />
              <span>{t('settings.tab.roles')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-xs font-semibold transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 ${
                tab === 'matrix'
                  ? 'ios-segmented-active'
                  : 'text-[#3C5073] hover:text-[#0D1B38] hover:bg-[#F1F5FB]/60'
              }`}
            >
              <KeyRound className={`w-3.5 h-3.5 ${tab === 'matrix' ? 'text-[#0284C7]' : 'text-[#546A8E]'}`} />
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
