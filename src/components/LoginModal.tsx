/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { findRole } from '../utils/rbac';
import {
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, roles, currentUser, login, switchUser } = useApp();

  const [mode, setMode] = useState<'credentials' | 'accounts'>('accounts');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('devnapp2026!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const result = login(email, password);
    if (result.success && result.user) {
      setSuccessMsg(`Authentifié avec succès : ${result.user.name} (${result.user.role})`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } else {
      setErrorMsg(result.error || 'Échec de la connexion.');
    }
  };

  const handleSelectUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      if (!target.active) {
        setErrorMsg('Ce compte est suspendu.');
        return;
      }
      switchUser(target);
      setSuccessMsg(`Session basculée sur : ${target.name} (${target.role})`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with DEVNAPP Branding */}
        <div className="bg-[#070b18] p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/devnappLogo_10b7b539.jpg"
              alt="DEVNAPP SARL"
              className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 shadow-sm shadow-cyan-500/30"
            />
            <div>
              <div className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  Connexion & Authentification
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-1.5 py-0.5 rounded font-mono font-bold">
                  AUTH
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">DEVNAPP SARL · Système de Gestion Interne ERP</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('accounts');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              mode === 'accounts'
                ? 'border-cyan-600 text-cyan-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Sélection Rapide des Utilisateurs ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('credentials');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              mode === 'credentials'
                ? 'border-cyan-600 text-cyan-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Connexion Email / MDP</span>
          </button>
        </div>

        {/* Notifications */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: Quick Accounts List */}
          {mode === 'accounts' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Cliquez sur un compte pour ouvrir sa session :</span>
                <span className="text-[11px] font-mono text-cyan-700 font-semibold">
                  Session actuelle : {currentUser.name}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {users.map((u) => {
                  const roleObj = findRole(u.role_id || u.role, roles);
                  const isCurrent = u.id === currentUser.id;
                  const isLocked = u.failed_attempts >= 5 || !!u.locked_until;

                  return (
                    <div
                      key={u.id}
                      onClick={() => !isLocked && handleSelectUser(u.id)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'border-cyan-500 bg-cyan-50/60 ring-2 ring-cyan-400/20 shadow-xs'
                          : isLocked
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrent
                              ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 truncate">{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 px-1.5 py-0.2 rounded-sm">
                                Connecté
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase ${
                            roleObj?.badgeColor || 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {roleObj?.name || u.role}
                        </span>
                        {!isCurrent && !isLocked && (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Standard Credentials Form */}
          {mode === 'credentials' && (
            <form onSubmit={handleCredentialsLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Adresse Email Professionnelle</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: abdelilah@devnapp.ma, caisse@devnapp.ma"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mot de passe</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-hidden font-mono"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Mot de passe par défaut pour tous les comptes : <code className="font-mono text-cyan-600 font-bold">devnapp2026!</code>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>S'authentifier</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-600" />
            <span>Contrôle d'accès basé sur les rôles (RBAC actif)</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
