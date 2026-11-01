/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  FileSpreadsheet,
  Smartphone,
  RefreshCw,
  Shield,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  onOpenSheets: () => void;
  onToggleMobileSim: () => void;
  isMobileSimOpen: boolean;
  activeViewTitle: string;
}

const roleLabels: Record<UserRole, { label: string; badge: string; color: string }> = {
  admin: { label: 'Admin / Gérant', badge: 'Accès Total', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  comptable: { label: 'Comptable', badge: 'Finance & Factures', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  rh: { label: 'RH', badge: 'Paie & Équipe', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  commercial: { label: 'Commercial', badge: 'Clients & Devis', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  chef_equipe: { label: 'Chef d\'équipe', badge: 'Validation Rapports', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  employe: { label: 'Employé', badge: 'Rapport & Terrain', color: 'bg-slate-100 text-slate-800 border-slate-300' },
};

export const Header: React.FC<HeaderProps> = ({
  onOpenSheets,
  onToggleMobileSim,
  isMobileSimOpen,
  activeViewTitle,
}) => {
  const { currentUser, switchUserRole, sheetsSyncStatus, lastSheetsSync, syncWithGoogleSheets } = useApp();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Left: Active View Breadcrumb */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-xs shadow-cyan-500/50"></span>
          Système Interne
        </span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm sm:text-base font-semibold text-slate-900 whitespace-nowrap">{activeViewTitle}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Google Sheets Sync Pill */}
        <button
          onClick={syncWithGoogleSheets}
          title="Synchroniser avec les 5 classeurs Google Sheets"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 ${sheetsSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline text-slate-500">Google Sheets:</span>
          <span className="text-slate-800 font-semibold">{sheetsSyncStatus === 'syncing' ? 'Sync...' : 'Synchronisé'}</span>
        </button>

        {/* View Google Sheets Database */}
        <button
          onClick={onOpenSheets}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-900 bg-cyan-50 hover:bg-cyan-100/80 border border-cyan-200 rounded-lg transition-colors shadow-xs"
          title="Consulter l'architecture et les 5 classeurs Google Sheets"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
          <span className="hidden sm:inline">Classeurs Sheets</span>
        </button>

        {/* Mobile View Simulator Toggle */}
        <button
          onClick={onToggleMobileSim}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            isMobileSimOpen
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent shadow-xs shadow-cyan-500/25'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
          }`}
          title="Ouvrir le simulateur mobile (iOS / Android - Section 14)"
        >
          <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
          <span className="hidden sm:inline">App Mobile V2</span>
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Role Persona Switcher (CRITICAL for evaluating access matrix from Section 2) */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <Shield className="w-3.5 h-3.5 text-slate-400 ml-1 hidden lg:block" />
          <span className="text-xs text-slate-500 hidden lg:inline">Rôle :</span>
          <select
            value={currentUser.role}
            onChange={(e) => switchUserRole(e.target.value as UserRole)}
            className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-md py-1 px-2 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            aria-label="Sélectionner le rôle actif pour tester les permissions"
          >
            <option value="admin">Admin / Gérant</option>
            <option value="comptable">Comptable</option>
            <option value="rh">RH</option>
            <option value="commercial">Commercial</option>
            <option value="chef_equipe">Chef d'équipe</option>
            <option value="employe">Employé</option>
          </select>
        </div>
      </div>
    </header>
  );
};
