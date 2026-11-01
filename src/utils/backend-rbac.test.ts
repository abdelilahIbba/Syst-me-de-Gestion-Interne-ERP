/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createExpressApp } from '../../server.ts';

let server: http.Server;
let baseUrl: string;

test.before(async () => {
  const app = await createExpressApp();
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Backend RBAC: Rejects unauthenticated requests with 401', async () => {
  const res = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email: 'test@devnapp.ma', role: 'employe' }),
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('Backend RBAC: Rejects user creation for unauthorized role (employe) with 403', async () => {
  const res = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'employe',
    },
    body: JSON.stringify({ name: 'Nouveau', email: 'nouveau@devnapp.ma', role: 'employe' }),
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /Accès refusé/);
});

test('Backend RBAC: Allows user creation for admin role with 201', async () => {
  const res = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admin',
    },
    body: JSON.stringify({ name: 'Nouveau Salarié', email: 'nouveau.salarie@devnapp.ma', role: 'employe' }),
  });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.name, 'Nouveau Salarié');
});

test('Backend RBAC: Cashier workflow allows cancel-extras and cancel-pack', async () => {
  // Cashier executes cancel-extras
  const resExtras = await fetch(`${baseUrl}/api/actions/cancel-extras`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'cashier',
    },
    body: JSON.stringify({ invoiceId: 'FA-2026-0001', extraId: 'EXTRA-01', motif: 'Ajustement de caisse' }),
  });
  assert.equal(resExtras.status, 200);
  const dataExtras = await resExtras.json();
  assert.equal(dataExtras.success, true);

  // Cashier executes cancel-pack
  const resPack = await fetch(`${baseUrl}/api/actions/cancel-pack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'cashier',
    },
    body: JSON.stringify({ contractId: 'CTR-2026-001', motif: 'Résiliation demandée par client' }),
  });
  assert.equal(resPack.status, 200);
  const dataPack = await resPack.json();
  assert.equal(dataPack.success, true);
});

test('Backend RBAC: Employee is blocked from cancel-pack and cancel-extras with 403', async () => {
  const resExtras = await fetch(`${baseUrl}/api/actions/cancel-extras`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'employe',
    },
    body: JSON.stringify({ invoiceId: 'FA-2026-0001' }),
  });
  assert.equal(resExtras.status, 403);

  const resPack = await fetch(`${baseUrl}/api/actions/cancel-pack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'employe',
    },
    body: JSON.stringify({ contractId: 'CTR-2026-001' }),
  });
  assert.equal(resPack.status, 403);
});

test('Backend RBAC: Prevents deleting a role that is currently in use', async () => {
  // Role 'ROLE-003' (cashier) is assigned to USR-008
  const res = await fetch(`${baseUrl}/api/roles/ROLE-003`, {
    method: 'DELETE',
    headers: {
      'x-user-role': 'super_admin',
    },
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.error, /actuellement assigné/);
});

test('Backend RBAC: Login authenticates user and returns permissions for role', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'caisse@devnapp.ma',
      password: 'devnapp2026!',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.user.role, 'cashier');
  assert.ok(data.permissions.includes('cancel_extras'));
  assert.ok(data.permissions.includes('cancel_pack'));
});
