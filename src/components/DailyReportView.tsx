/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import { WorkLocation, ReportTask, TaskStatus, VisitResult, VisitExpenseType } from '../types';
import { validateDailyReportHours, round2 } from '../utils/calculations';
import {
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  FileSignature,
  Car,
} from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const {
    currentUser,
    roles,
    dailyReports,
    clients,
    projects,
    contracts,
    saveDailyReport,
    saveSiteVisit,
    siteVisits,
  } = useApp();
  const { t, tRole } = useI18n();

  const todayStr = new Date().toISOString().split('T')[0];

  // Find existing report for today
  const existingReport = dailyReports.find(
    (r) => r.employee_id === currentUser.employee_id && r.date === todayStr
  );

  const existingVisit = siteVisits.find(
    (v) => v.employee_id === currentUser.employee_id && v.date === todayStr
  );

  const [date, setDate] = useState(todayStr);
  const [lieu, setLieu] = useState<WorkLocation>(existingReport?.lieu || 'bureau');
  const [blocages, setBlocages] = useState(existingReport?.blocages || '');
  const [planDemain, setPlanDemain] = useState(existingReport?.plan_demain || '');

  const [tasks, setTasks] = useState<Array<Omit<ReportTask, 'id' | 'report_id'>>>(
    existingReport?.tasks?.map((tItem) => ({
      client_id: tItem.client_id,
      project_id: tItem.project_id,
      description: tItem.description,
      heures: tItem.heures,
      statut_tache: tItem.statut_tache,
    })) || [
      {
        client_id: clients[0]?.id || '',
        project_id: projects[0]?.id || '',
        description: 'Développement de nouvelles fonctionnalités et tests unitaires',
        heures: 4,
        statut_tache: 'terminée',
      },
      {
        client_id: clients[1]?.id || '',
        project_id: projects[1]?.id || '',
        description: 'Revue de code et support technique client',
        heures: 4,
        statut_tache: 'en cours',
      },
    ]
  );

  // Section Déplacement chez le client (DP-1 à DP-7)
  const [hasSiteVisit, setHasSiteVisit] = useState(lieu === 'chez client' || !!existingVisit);
  const [visitData, setVisitData] = useState({
    client_id: existingVisit?.client_id || clients[0]?.id || '',
    project_id: existingVisit?.project_id || projects[0]?.id || '',
    contract_id: existingVisit?.contract_id || contracts[0]?.id || '',
    motif: existingVisit?.motif || 'Installation et mise à niveau sur site',
    heure_depart: existingVisit?.heure_depart || '09:00',
    heure_arrivee: existingVisit?.heure_arrivee || '10:00',
    heure_retour: existingVisit?.heure_retour || '17:30',
    travail_effectue: existingVisit?.travail_effectue || '',
    resultat: (existingVisit?.resultat || 'résolu') as VisitResult,
    problemes: existingVisit?.problemes || '',
    materiel_utilise: existingVisit?.materiel_utilise || '',
    facturable: existingVisit?.facturable !== undefined ? existingVisit.facturable : true,
    montant_facturable: existingVisit?.montant_facturable || 1200,
    expenses: existingVisit?.expenses || [
      { id: '1', visit_id: '', type: 'essence' as VisitExpenseType, montant: 250, statut: 'en attente' as const },
      { id: '2', visit_id: '', type: 'repas' as VisitExpenseType, montant: 80, statut: 'en attente' as const },
    ],
  });

  const [signatureSaved, setSignatureSaved] = useState<string | null>(existingVisit?.signature_client_url || null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeRoleObj = roles.find((r) => r.key === currentUser.role);
  const roleLabel = tRole(currentUser.role, activeRoleObj?.name || currentUser.role);

  // Calculate total hours and validation warning (RJ-3)
  const totalHours = round2(tasks.reduce((sum, taskItem) => sum + (Number(taskItem.heures) || 0), 0));
  const hoursValidation = validateDailyReportHours(totalHours);

  // Canvas drawing handlers for Client Signature (DP-6)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureSaved(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureSaved(null);
    }
  };

  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
        client_id: clients[0]?.id || '',
        project_id: projects[0]?.id || '',
        description: '',
        heures: 1,
        statut_tache: 'terminée',
      },
    ]);
  };

  const handleRemoveTask = (idx: number) => {
    if (tasks.length <= 1) return;
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleTaskChange = (idx: number, field: string, val: any) => {
    const newTasks = [...tasks];
    newTasks[idx] = { ...newTasks[idx], [field]: val };
    setTasks(newTasks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // DP-2: Work performed is required if site visit
    if (hasSiteVisit && !visitData.travail_effectue.trim()) {
      setValidationError(t('daily.workRequiredAlert'));
      return;
    }

    const savedRep = saveDailyReport({
      employee_id: currentUser.employee_id,
      date,
      lieu: hasSiteVisit ? 'chez client' : lieu,
      blocages,
      plan_demain: planDemain,
      statut: 'soumis',
      tasks: tasks.map((taskItem, i) => ({
        ...taskItem,
        id: `TSK-${Date.now().toString().slice(-4)}-${i}`,
        report_id: '',
      })),
    });

    if (hasSiteVisit) {
      saveSiteVisit({
        report_id: savedRep.id,
        employee_id: currentUser.employee_id,
        client_id: visitData.client_id,
        project_id: visitData.project_id,
        contract_id: visitData.contract_id,
        date,
        motif: visitData.motif,
        heure_depart: visitData.heure_depart,
        heure_arrivee: visitData.heure_arrivee,
        heure_retour: visitData.heure_retour,
        travail_effectue: visitData.travail_effectue,
        resultat: visitData.resultat,
        problemes: visitData.problemes,
        materiel_utilise: visitData.materiel_utilise,
        facturable: visitData.facturable,
        montant_facturable: visitData.montant_facturable,
        signature_client_url: signatureSaved || undefined,
        expenses: visitData.expenses,
      });
    }

    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t('daily.title')}</h2>
        <div className="text-xs text-slate-500 mt-0.5">
          {t('daily.subtitle')}
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{t('daily.submittedMsg')}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Top parameters card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-medium">{t('daily.dateLabel')}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">{t('daily.locationLabel')}</label>
              <select
                value={lieu}
                onChange={(e) => {
                  const val = e.target.value as WorkLocation;
                  setLieu(val);
                  if (val === 'chez client') setHasSiteVisit(true);
                }}
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="bureau">{t('daily.loc.office')}</option>
                <option value="télétravail">{t('daily.loc.remote')}</option>
                <option value="chez client">{t('daily.loc.client')}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-medium">{t('daily.employeeLabel')}</label>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900">
                {currentUser.name} ({roleLabel})
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section (RJ-1) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('daily.tasksTitle')}</h3>
              <p className="text-[11px] text-slate-500">{t('daily.tasksSub')}</p>
            </div>
            <button
              type="button"
              onClick={handleAddTask}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t('daily.addTask')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 mb-0.5">{t('common.client')}</label>
                    <select
                      value={task.client_id}
                      onChange={(e) => handleTaskChange(idx, 'client_id', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.raison_sociale}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] text-slate-400 mb-0.5">{t('common.project')}</label>
                    <select
                      value={task.project_id}
                      onChange={(e) => handleTaskChange(idx, 'project_id', e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom_systeme}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">{t('daily.durationHours')}</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="16"
                      value={task.heures}
                      onChange={(e) => handleTaskChange(idx, 'heures', Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2 flex items-end justify-between gap-2">
                    <div className="w-full">
                      <label className="block text-[10px] text-slate-400 mb-0.5">{t('daily.taskStatus')}</label>
                      <select
                        value={task.statut_tache}
                        onChange={(e) => handleTaskChange(idx, 'statut_tache', e.target.value as TaskStatus)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                      >
                        <option value="terminée">{t('daily.taskStatus.terminée')}</option>
                        <option value="en cours">{t('daily.taskStatus.en cours')}</option>
                        <option value="bloquée">{t('daily.taskStatus.bloquée')}</option>
                      </select>
                    </div>

                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    placeholder={t('daily.taskDescPlaceholder')}
                    value={task.description}
                    onChange={(e) => handleTaskChange(idx, 'description', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Automatic hours total & >12h warning (RJ-3) */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-slate-500">{t('daily.totalDayHours')} </span>
              <strong className="font-mono text-sm text-slate-900">{totalHours} {t('daily.hoursWord')}</strong>
            </div>

            {hoursValidation.isWarning && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{hoursValidation.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Blocages & Plan du lendemain (RJ-1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
            <label className="block text-slate-900 font-semibold">{t('daily.blockersLabel')}</label>
            <textarea
              rows={3}
              placeholder={t('daily.blockersPlaceholder')}
              value={blocages}
              onChange={(e) => setBlocages(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
            <label className="block text-slate-900 font-semibold">{t('daily.tomorrowLabel')}</label>
            <textarea
              rows={3}
              placeholder={t('daily.tomorrowPlaceholder')}
              value={planDemain}
              onChange={(e) => setPlanDemain(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section Déplacement chez le client (DP-1 à DP-7) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">{t('daily.visitSectionTitle')}</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSiteVisit}
                onChange={(e) => setHasSiteVisit(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span className="font-semibold text-slate-700">{t('daily.visitCheckbox')}</span>
            </label>
          </div>

          {hasSiteVisit && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('daily.departTime')}</label>
                  <input
                    type="time"
                    value={visitData.heure_depart}
                    onChange={(e) => setVisitData({ ...visitData, heure_depart: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('daily.arrivalTime')}</label>
                  <input
                    type="time"
                    value={visitData.heure_arrivee}
                    onChange={(e) => setVisitData({ ...visitData, heure_arrivee: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('daily.returnTime')}</label>
                  <input
                    type="time"
                    value={visitData.heure_retour}
                    onChange={(e) => setVisitData({ ...visitData, heure_retour: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('daily.visitReason')}</label>
                <input
                  type="text"
                  required={hasSiteVisit}
                  value={visitData.motif}
                  onChange={(e) => setVisitData({ ...visitData, motif: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              {/* DP-2: Travail effectué OBLIGATOIRE et Résultat */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-900 mb-1 font-semibold">
                    {t('daily.workPerformedLabel')}
                  </label>
                  <textarea
                    rows={2}
                    required={hasSiteVisit}
                    placeholder={t('daily.workPerformedPlaceholder')}
                    value={visitData.travail_effectue}
                    onChange={(e) => setVisitData({ ...visitData, travail_effectue: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 mb-1 font-semibold">{t('daily.resultLabel')}</label>
                  <select
                    value={visitData.resultat}
                    onChange={(e) => setVisitData({ ...visitData, resultat: e.target.value as VisitResult })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="résolu">{t('daily.result.résolu')}</option>
                    <option value="partiel">{t('daily.result.partiel')}</option>
                    <option value="à revoir">{t('daily.result.à revoir')}</option>
                  </select>
                </div>
              </div>

              {/* DP-5: Option facturable */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visitData.facturable}
                    onChange={(e) => setVisitData({ ...visitData, facturable: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-medium text-slate-800">
                    {t('daily.billableCheckbox')}
                  </span>
                </label>
                {visitData.facturable && (
                  <div className="flex items-center gap-1.5 font-mono shrink-0">
                    <span className="text-slate-500">{t('daily.amountHtLabel')}</span>
                    <input
                      type="number"
                      value={visitData.montant_facturable}
                      onChange={(e) => setVisitData({ ...visitData, montant_facturable: Number(e.target.value) })}
                      className="w-24 p-1 border border-slate-200 bg-white rounded text-xs font-bold"
                    />
                    <span>DH</span>
                  </div>
                )}
              </div>

              {/* DP-6: Signature tactile du client sur l'écran */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <FileSignature className="w-4 h-4 text-blue-600" />
                    <span>{t('daily.signatureTitle')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    {t('daily.clearSignature')}
                  </button>
                </div>

                <div className="bg-white border border-slate-300 rounded-lg overflow-hidden touch-none">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-24 cursor-crosshair block"
                  />
                </div>
                <div className="text-[11px] text-slate-400">
                  {t('daily.signatureHint')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-sm transition-colors"
          >
            {t('daily.submitBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
