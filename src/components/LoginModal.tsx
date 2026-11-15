/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
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
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, roles, currentUser, login, switchUser } = useApp();
  const { t, tRole, isRTL } = useI18n();

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
      setSuccessMsg(
        t('login.authSuccess', {
          name: result.user.name,
          role: tRole(result.user.role, result.user.role),
        })
      );
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } else {
      setErrorMsg(result.error || t('login.authFailed'));
    }
  };

  const handleSelectUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      if (!target.active) {
        setErrorMsg(t('login.suspendedError'));
        return;
      }
      switchUser(target);
      setSuccessMsg(
        t('login.switchedSuccess', {
          name: target.name,
          role: tRole(target.role, target.role),
        })
      );
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 800);
    }
  };

  return (
    <div className="ios-sheet-backdrop fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="ios-sheet rounded-t-[28px] sm:rounded-[26px] max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with DEVNAPP Branding */}
        <div className="bg-[#0B1733] p-4 sm:p-5 text-[#F4F8FD] flex items-center justify-between gap-2 border-b border-[#1E3566] shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/devnappLogo_10b7b539.jpg"
              alt="DEVNAPP SARL"
              className="w-10 h-10 rounded-[13px] object-cover border border-[#38BDF8]/40 shadow-sm shadow-[#0EA5E9]/25"
            />
            <div>
              <div className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-[#7DD3FC] via-[#BAE6FD] to-[#38BDF8] bg-clip-text text-transparent">
                  {t('login.title')}
                </span>
                <span className="text-[10px] bg-[#10224A] text-[#7DD3FC] border border-[#1E3566] px-1.5 py-0.5 rounded-md font-mono font-bold">
                  AUTH
                </span>
              </div>
              <div className="text-xs text-[#9DB3D8] mt-0.5">{t('login.subtitle')}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#132550] hover:bg-[#1B336B] flex items-center justify-center text-[#9DB3D8] hover:text-[#F4F8FD] transition-all active:scale-[0.93]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (iOS Segmented Control) */}
        <div className="px-4 sm:px-5 pt-4 shrink-0">
          <div className="ios-segmented flex items-center gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('accounts');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-2.5 sm:px-4 rounded-[10px] text-center transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                mode === 'accounts'
                  ? 'ios-segmented-active'
                  : 'text-[#4B6187] hover:text-[#0D1B38]'
              }`}
            >
              <UserCheck className={`w-4 h-4 shrink-0 ${mode === 'accounts' ? 'text-[#0284C7]' : ''}`} />
              <span>{t('login.tabAccounts', { count: users.length })}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('credentials');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 px-2.5 sm:px-4 rounded-[10px] text-center transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                mode === 'credentials'
                  ? 'ios-segmented-active'
                  : 'text-[#4B6187] hover:text-[#0D1B38]'
              }`}
            >
              <KeyRound className={`w-4 h-4 shrink-0 ${mode === 'credentials' ? 'text-[#0284C7]' : ''}`} />
              <span>{t('login.tabCredentials')}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-[#FCE8EC] border border-[#F3BCC8] text-[#9F1239] rounded-[14px] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#9F1239] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-[#DCF4E8] border border-[#A7DFC3] text-[#0E6245] rounded-[14px] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0E6245] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: Quick Accounts List */}
          {mode === 'accounts' && (
            <div className="space-y-3">
              <div className="text-xs text-[#546A8E] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span>{t('login.selectAccountPrompt')}</span>
                <span className="text-[11px] font-mono text-[#0284C7] font-semibold">
                  {t('login.currentSession', { name: currentUser.name })}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pe-1">
                {users.map((u) => {
                  const roleObj = findRole(u.role_id || u.role, roles);
                  const isCurrent = u.id === currentUser.id;
                  const isLocked = u.failed_attempts >= 5 || !!u.locked_until;

                  return (
                    <div
                      key={u.id}
                      onClick={() => !isLocked && handleSelectUser(u.id)}
                      className={`p-3.5 rounded-[18px] border transition-all duration-150 active:scale-[0.99] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? 'border-[#0284C7] bg-[#DFF0FC] ring-2 ring-[#0284C7]/20 shadow-xs'
                          : isLocked
                          ? 'border-[#CFDDED] bg-[#E6EEF8] opacity-60 cursor-not-allowed'
                          : 'border-[#CFDDED] bg-[#F5F8FD] hover:border-[#7AC1EE] hover:bg-[#EBF3FB]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-[13px] flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrent
                              ? 'bg-gradient-to-b from-[#0EA5E9] to-[#0284C7] text-[#F4F8FD] shadow-xs'
                              : 'bg-[#DCE6F4] text-[#1C2E4F] border border-[#C9D9EC]'
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
                            <span className="font-semibold text-xs text-[#0D1B38] truncate">{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-[#035388] bg-[#BFE3FA] border border-[#90CDF4] px-1.5 py-0.2 rounded-sm">
                                {t('login.connected')}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#546A8E] font-mono truncate">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase ${
                            roleObj?.badgeColor || 'bg-[#E2EAF5] text-[#1E355E] border-[#B8CAE2]'
                          }`}
                        >
                          {tRole(roleObj?.key || u.role, roleObj?.name || u.role)}
                        </span>
                        {!isCurrent && !isLocked && (
                          <ArrowRight className={`w-3.5 h-3.5 text-[#546A8E] ${isRTL ? 'rotate-180' : ''}`} />
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
                <label className="block text-[#273B63] font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#546A8E]" />
                  <span>{t('login.emailLabel')}</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className="ios-input w-full p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-[#273B63] font-medium mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#546A8E]" />
                  <span>{t('login.passwordLabel')}</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="ios-input w-full p-2.5 font-mono"
                />
                <div className="text-[11px] text-[#546A8E] mt-1">
                  {t('login.defaultPasswordHint')}{' '}
                  <code className="font-mono text-[#0284C7] font-bold">devnapp2026!</code>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="ios-btn-primary w-full py-2.5 px-4 min-h-[42px] flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{t('login.submit')}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#E6EEF8] px-4 sm:px-5 py-3 border-t border-[#CFDDED] text-[11px] text-[#546A8E] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
            <span>{t('login.footerRbac')}</span>
          </span>
          <button
            onClick={onClose}
            className="ios-btn-secondary px-3.5 py-1.5 text-[11px] font-semibold"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
