/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ROLES,
  hasPermission,
  canAccessNav,
  canDeleteRole,
  canDeleteUser,
  canDemoteSuperAdmin,
  canExecuteWorkflowAction,
  findRole,
  normalizeRoleKey,
} from './rbac';
import { Role, User } from '../types';

const testUsers: User[] = [
  {
    id: 'USR-SUPER',
    employee_id: 'EMP-001',
    email: 'super@devnapp.ma',
    name: 'Super Admin User',
    role: 'super_admin',
    active: true,
    failed_attempts: 0,
  },
  {
    id: 'USR-ADMIN',
    employee_id: 'EMP-002',
    email: 'admin@devnapp.ma',
    name: 'Admin Gérant',
    role: 'admin',
    active: true,
    failed_attempts: 0,
  },
  {
    id: 'USR-CASHIER',
    employee_id: 'EMP-003',
    email: 'cashier@devnapp.ma',
    name: 'Caissier Trésorerie',
    role: 'cashier',
    active: true,
    failed_attempts: 0,
  },
  {
    id: 'USR-COMPTABLE',
    employee_id: 'EMP-004',
    email: 'compta@devnapp.ma',
    name: 'Comptable User',
    role: 'comptable',
    active: true,
    failed_attempts: 0,
  },
  {
    id: 'USR-EMPLOYE',
    employee_id: 'EMP-005',
    email: 'dev@devnapp.ma',
    name: 'Dev Employe',
    role: 'employe',
    active: true,
    failed_attempts: 0,
  },
];

test('hasPermission grants super_admin all permissions unconditionally', () => {
  assert.equal(hasPermission('super_admin', 'view_dashboard'), true);
  assert.equal(hasPermission('super_admin', 'manage_users'), true);
  assert.equal(hasPermission('super_admin', 'cancel_extras'), true);
  assert.equal(hasPermission('super_admin', 'cancel_pack'), true);
  assert.equal(hasPermission('super_admin', 'manage_settings'), true);
});

test('hasPermission grants cashier permission for cancel_extras and cancel_pack workflows', () => {
  assert.equal(hasPermission('cashier', 'cancel_extras'), true);
  assert.equal(hasPermission('cashier', 'cancel_pack'), true);
  assert.equal(hasPermission('cashier', 'manage_invoices'), true);
  // cashier should not have access to manage users or manage payroll
  assert.equal(hasPermission('cashier', 'manage_users'), false);
  assert.equal(hasPermission('cashier', 'manage_payroll'), false);
});

test('hasPermission rejects unauthorized actions for regular employee', () => {
  assert.equal(hasPermission('employe', 'fill_daily_report'), true);
  assert.equal(hasPermission('employe', 'manage_invoices'), false);
  assert.equal(hasPermission('employe', 'cancel_extras'), false);
  assert.equal(hasPermission('employe', 'cancel_pack'), false);
  assert.equal(hasPermission('employe', 'manage_users'), false);
});

test('canAccessNav checks navigation items against roles', () => {
  assert.equal(canAccessNav('dashboard', 'employe'), true);
  assert.equal(canAccessNav('daily_report', 'employe'), true);
  assert.equal(canAccessNav('payroll', 'employe'), false);
  assert.equal(canAccessNav('settings', 'employe'), false);

  assert.equal(canAccessNav('payroll', 'rh'), true);
  assert.equal(canAccessNav('payroll', 'comptable'), true);
  assert.equal(canAccessNav('settings', 'admin'), true);
  assert.equal(canAccessNav('settings', 'super_admin'), true);
});

test('canDeleteRole blocks deletion when a role is currently assigned to users', () => {
  // Cashier role is assigned to USR-CASHIER
  const result = canDeleteRole('cashier', testUsers, DEFAULT_ROLES);
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /actuellement assigné à 1 utilisateur/);

  // Super admin role deletion is blocked
  const superResult = canDeleteRole('super_admin', testUsers, DEFAULT_ROLES);
  assert.equal(superResult.allowed, false);
  assert.match(superResult.reason || '', /critique "Super Admin"/);
});

test('canDeleteRole allows deletion of an unassigned custom role', () => {
  const customRole: Role = {
    id: 'ROLE-CUSTOM-99',
    key: 'stagiaire_support',
    name: 'Stagiaire Support',
    description: 'Support technique niveau 1',
    permissions: ['fill_daily_report'],
  };
  const rolesWithCustom = [...DEFAULT_ROLES, customRole];

  const result = canDeleteRole(customRole.id, testUsers, rolesWithCustom);
  assert.equal(result.allowed, true);
});

test('canDeleteUser prevents a user from deleting their own account', () => {
  const result = canDeleteUser('USR-ADMIN', 'USR-ADMIN', testUsers);
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /propre compte/);
});

test('canDeleteUser prevents removing the last super admin in the system', () => {
  // testUsers contains only 1 super admin: USR-SUPER
  const result = canDeleteUser('USR-SUPER', 'USR-ADMIN', testUsers);
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /dernier Super Administrateur/);

  // If a second super admin is added, deletion of one of them is allowed
  const usersWithTwoSupers: User[] = [
    ...testUsers,
    {
      id: 'USR-SUPER-2',
      employee_id: 'EMP-006',
      email: 'super2@devnapp.ma',
      name: 'Super Admin 2',
      role: 'super_admin',
      active: true,
      failed_attempts: 0,
    },
  ];
  const allowedResult = canDeleteUser('USR-SUPER-2', 'USR-ADMIN', usersWithTwoSupers);
  assert.equal(allowedResult.allowed, true);
});

test('canDemoteSuperAdmin prevents demoting the last super admin', () => {
  const demoteFail = canDemoteSuperAdmin('USR-SUPER', 'admin', testUsers);
  assert.equal(demoteFail.allowed, false);
  assert.match(demoteFail.reason || '', /au moins un Super Administrateur/);

  // Regular user role modification is always allowed
  const demoteOk = canDemoteSuperAdmin('USR-CASHIER', 'comptable', testUsers);
  assert.equal(demoteOk.allowed, true);
});

test('canExecuteWorkflowAction enforces Extras cancellation and Annuler le pack', () => {
  // Super Admin can cancel pack and cancel extras
  assert.equal(canExecuteWorkflowAction('cancel_pack', 'super_admin').allowed, true);
  assert.equal(canExecuteWorkflowAction('cancel_extras', 'super_admin').allowed, true);

  // Cashier can cancel pack and cancel extras
  assert.equal(canExecuteWorkflowAction('cancel_pack', 'cashier').allowed, true);
  assert.equal(canExecuteWorkflowAction('cancel_extras', 'cashier').allowed, true);

  // Employee cannot cancel pack or cancel extras
  assert.equal(canExecuteWorkflowAction('cancel_pack', 'employe').allowed, false);
  assert.equal(canExecuteWorkflowAction('cancel_extras', 'employe').allowed, false);
});
