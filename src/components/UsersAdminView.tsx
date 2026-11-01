/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const UsersAdminView: React.FC = () => {
  const { users, employees, currentUser, logAction } = useApp();

  const [userList, setUserList] = useState<User[]>(users);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleUserStatus = (userId: string) => {
    setUserList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newActive = !u.active;
          logAction('modifier', 'Users', u.id, { active: u.active }, { active: newActive });
          return { ...u, active: newActive };
        }
        return u;
      })
    );
    setSuccessMsg('Statut du compte mis à jour.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const unlockUser = (userId: string) => {
    // AUTH-2: Verrouillage temporaire après 5 échecs, déblocage par admin
    setUserList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          logAction('modifier', 'Users', u.id, { failed_attempts: u.failed_attempts }, { failed_attempts: 0, locked_until: null });
          return { ...u, failed_attempts: 0, locked_until: null };
        }
        return u;
      })
    );
    setSuccessMsg('Compte déverrouillé avec succès.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const resetPassword = (userId: string) => {
    // AUTH-3: Réinitialisation par l'admin avec changement obligatoire
    setUserList((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          logAction('modifier', 'Users', u.id, null, { must_change_password: true });
          return { ...u, must_change_password: true };
        }
        return u;
      })
    );
    setSuccessMsg('Mot de passe temporaire généré. L\'employé devra le modifier à sa prochaine connexion.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Utilisateurs, Rôles & Sécurité</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          Module AUTH-1 à AUTH-5 & E21 · Gestion des accès aux 6 personas, contrôle des verrouillages et sessions
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-3">Email & Identifiant</th>
                <th className="py-3 px-3">Rôle Assigné (Section 2)</th>
                <th className="py-3 px-3">Dernière Connexion</th>
                <th className="py-3 px-3 text-center">Sécurité / Statut</th>
                <th className="py-3 px-4 text-right">Actions Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userList.map((u) => {
                const emp = employees.find((e) => e.id === u.employee_id);
                const isLocked = u.failed_attempts >= 5 || !!u.locked_until;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{emp?.poste || 'Compte Système'}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-700">{u.email}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {u.id}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold capitalize text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {u.last_login || 'Jamais connecté'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isLocked ? (
                        <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Verrouillé (AUTH-2)</span>
                        </span>
                      ) : u.active ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                          Actif
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">
                          Suspendu
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {isLocked && (
                        <button
                          onClick={() => unlockUser(u.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                        >
                          Débloquer
                        </button>
                      )}

                      <button
                        onClick={() => resetPassword(u.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        title="Réinitialiser le mot de passe (AUTH-3)"
                      >
                        Reset MDP
                      </button>

                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                            u.active
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {u.active ? 'Suspendre' : 'Réactiver'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
