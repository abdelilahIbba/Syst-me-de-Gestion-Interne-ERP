/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_ROLES,
  hasPermission,
  canDeleteRole,
  canDeleteUser,
  canDemoteSuperAdmin,
  canExecuteWorkflowAction,
  findRole,
  normalizeRoleKey,
} from './src/utils/rbac.ts';
import { initialUsers, initialRoles } from './src/data/mockData.ts';
import { Role, User, PermissionKey } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory backend database mirrors
let dbUsers: User[] = [...initialUsers];
let dbRoles: Role[] = [...initialRoles];

export function getDbUsers() {
  return dbUsers;
}
export function getDbRoles() {
  return dbRoles;
}

/**
 * Express middleware to enforce Role-Based Access Control (RBAC) server-side.
 * Rejects requests with HTTP 403 Forbidden if the calling role lacks required permission.
 */
export const enforcePermission = (requiredPermission: PermissionKey) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const roleHeader = (req.headers['x-user-role'] as string) || '';
    const userIdHeader = (req.headers['x-user-id'] as string) || '';

    // Find the user if userId provided
    let effectiveRole = roleHeader;
    if (userIdHeader) {
      const u = dbUsers.find((user) => user.id === userIdHeader);
      if (u) {
        effectiveRole = u.role;
      }
    }

    if (!effectiveRole) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise : rôle ou identifiant utilisateur manquant (AUTH-1).',
      });
    }

    const allowed = hasPermission(effectiveRole, requiredPermission, dbRoles);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: `Accès refusé : le rôle "${effectiveRole}" ne dispose pas du droit d'accès "${requiredPermission}".`,
        requiredPermission,
        role: effectiveRole,
      });
    }

    next();
  };
};

export async function createExpressApp() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTHENTICATION & LOGIN ---
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email obligatoire.' });
    }

    const user = dbUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides.' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, error: 'Compte utilisateur suspendu. Contactez un administrateur.' });
    }

    if (user.failed_attempts >= 5) {
      return res.status(403).json({ success: false, error: 'Compte verrouillé après 5 tentatives échouées (AUTH-2).' });
    }

    // Validate password (supports mock password devnapp2026! or custom)
    const validPassword = !user.password || user.password === password || password === 'devnapp2026!';
    if (!validPassword) {
      user.failed_attempts += 1;
      return res.status(401).json({ success: false, error: 'Mot de passe incorrect.' });
    }

    user.failed_attempts = 0;
    user.last_login = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const userRole = findRole(user.role_id || user.role, dbRoles);

    return res.json({
      success: true,
      user,
      role: userRole,
      permissions: userRole ? userRole.permissions : [],
    });
  });

  // --- USERS CRUD ---
  // List users
  app.get('/api/users', (_req, res) => {
    res.json({ success: true, data: dbUsers });
  });

  // Create user
  app.post('/api/users', enforcePermission('manage_users'), (req, res) => {
    const { name, email, role, employee_id, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: 'Nom, email et rôle sont obligatoires.' });
    }

    const existing = dbUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: 'Un utilisateur avec cette adresse email existe déjà.' });
    }

    const roleObj = findRole(role, dbRoles);
    const newUser: User = {
      id: `USR-00${dbUsers.length + 1}`,
      name,
      email,
      role: roleObj ? (roleObj.key as any) : role,
      role_id: roleObj ? roleObj.id : undefined,
      employee_id: employee_id || 'EMP-001',
      password: password || 'devnapp2026!',
      active: true,
      failed_attempts: 0,
      created_at: new Date().toISOString().split('T')[0],
    };

    dbUsers.push(newUser);
    res.status(201).json({ success: true, data: newUser });
  });

  // Update user
  app.put('/api/users/:id', enforcePermission('manage_users'), (req, res) => {
    const userId = req.params.id;
    const userIndex = dbUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    }

    const updates = req.body;
    if (updates.role) {
      const demoteCheck = canDemoteSuperAdmin(userId, updates.role, dbUsers, dbRoles);
      if (!demoteCheck.allowed) {
        return res.status(400).json({ success: false, error: demoteCheck.reason });
      }
    }

    const roleObj = updates.role ? findRole(updates.role, dbRoles) : undefined;
    dbUsers[userIndex] = {
      ...dbUsers[userIndex],
      ...updates,
      role_id: roleObj ? roleObj.id : dbUsers[userIndex].role_id,
    };

    res.json({ success: true, data: dbUsers[userIndex] });
  });

  // Delete user
  app.delete('/api/users/:id', enforcePermission('manage_users'), (req, res) => {
    const userId = req.params.id;
    const currentUserId = (req.headers['x-user-id'] as string) || '';

    const check = canDeleteUser(userId, currentUserId, dbUsers, dbRoles);
    if (!check.allowed) {
      return res.status(400).json({ success: false, error: check.reason });
    }

    dbUsers = dbUsers.filter((u) => u.id !== userId);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès.' });
  });

  // --- ROLES CRUD ---
  // List roles
  app.get('/api/roles', (_req, res) => {
    res.json({ success: true, data: dbRoles });
  });

  // Create role
  app.post('/api/roles', enforcePermission('manage_roles'), (req, res) => {
    const { name, key, description, permissions } = req.body;
    if (!name || !key) {
      return res.status(400).json({ success: false, error: 'Nom et identifiant de rôle (clé) sont obligatoires.' });
    }

    const normKey = normalizeRoleKey(key);
    if (dbRoles.some((r) => normalizeRoleKey(r.key) === normKey)) {
      return res.status(400).json({ success: false, error: 'Un rôle avec cet identifiant existe déjà.' });
    }

    const newRole: Role = {
      id: `ROLE-${Date.now().toString().slice(-4)}`,
      name,
      key: normKey,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : ['view_dashboard'],
      isSystem: false,
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      created_at: new Date().toISOString().split('T')[0],
    };

    dbRoles.push(newRole);
    res.status(201).json({ success: true, data: newRole });
  });

  // Update role
  app.put('/api/roles/:id', enforcePermission('manage_roles'), (req, res) => {
    const roleId = req.params.id;
    const roleIndex = dbRoles.findIndex((r) => r.id === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({ success: false, error: 'Rôle introuvable.' });
    }

    const { name, description, permissions } = req.body;
    dbRoles[roleIndex] = {
      ...dbRoles[roleIndex],
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(Array.isArray(permissions) && { permissions }),
    };

    res.json({ success: true, data: dbRoles[roleIndex] });
  });

  // Delete role
  app.delete('/api/roles/:id', enforcePermission('manage_roles'), (req, res) => {
    const roleId = req.params.id;
    const check = canDeleteRole(roleId, dbUsers, dbRoles);
    if (!check.allowed) {
      return res.status(400).json({ success: false, error: check.reason });
    }

    dbRoles = dbRoles.filter((r) => r.id !== roleId);
    res.json({ success: true, message: 'Rôle supprimé avec succès.' });
  });

  // Update permissions for role ("Droits d'accès par rôle")
  app.put('/api/roles/:id/permissions', enforcePermission('manage_roles'), (req, res) => {
    const roleId = req.params.id;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, error: 'Format des permissions invalide (tableau attendu).' });
    }

    const roleIndex = dbRoles.findIndex((r) => r.id === roleId || r.key === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({ success: false, error: 'Rôle introuvable.' });
    }

    dbRoles[roleIndex].permissions = permissions;
    res.json({ success: true, data: dbRoles[roleIndex] });
  });

  // --- WORKFLOW ACTIONS ---
  // Workflow 1: Annuler le pack / contrat (requires cancel_pack permission)
  app.post('/api/actions/cancel-pack', enforcePermission('cancel_pack'), (req, res) => {
    const { contractId, motif } = req.body;
    if (!contractId) {
      return res.status(400).json({ success: false, error: 'Identifiant du contrat manquant.' });
    }

    res.json({
      success: true,
      message: `Contrat de maintenance ${contractId} annulé/résilié avec succès (Workflow Annuler le pack validé).`,
      motif: motif || 'Annulation autorisée par rôle habilité',
    });
  });

  // Workflow 2: Extras cancellation (requires cancel_extras permission)
  app.post('/api/actions/cancel-extras', enforcePermission('cancel_extras'), (req, res) => {
    const { invoiceId, extraId, motif } = req.body;
    if (!invoiceId) {
      return res.status(400).json({ success: false, error: 'Identifiant de facture manquant.' });
    }

    res.json({
      success: true,
      message: `Extra ${extraId || 'sélectionné'} de la facture ${invoiceId} annulé avec succès (Workflow Extras cancellation validé).`,
      motif: motif || 'Suppression d\'extra autorisée par caissier ou administrateur',
    });
  });

  return app;
}

async function startServer() {
  const app = await createExpressApp();
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DEVNAPP ERP Server] listening on http://localhost:${PORT}`);
  });
}

// Only start when executed directly
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
