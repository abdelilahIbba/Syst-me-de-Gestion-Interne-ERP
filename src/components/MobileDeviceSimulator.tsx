/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/I18nContext';
import {
  Wifi,
  WifiOff,
  Battery,
  Camera,
  MapPin,
  Clock,
  X,
  Bell,
  CheckCircle2,
} from 'lucide-react';

export const MobileDeviceSimulator: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    clients,
    saveSiteVisit,
  } = useApp();
  const { t, locale } = useI18n();

  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'accueil' | 'deplacement'>('accueil');

  // Fast clocking timestamps (MOB-4)
  const [departTime, setDepartTime] = useState<string | null>(null);
  const [arriveeTime, setArriveeTime] = useState<string | null>(null);
  const [retourTime, setRetourTime] = useState<string | null>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');

  // Photo simulation (MOB-5)
  const [simulatedPhoto, setSimulatedPhoto] = useState<string | null>(null);
  const [fraisAmount, setFraisAmount] = useState('150');
  const [fraisType, setFraisType] = useState('essence');

  const [showDefaultNotif, setShowDefaultNotif] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDepart = () => {
    const time = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    setDepartTime(time);
    if (!isOnline) {
      setOfflineQueue([...offlineQueue, t('mobile.offlineDepartLog', { time })]);
    }
  };

  const handleArrivee = () => {
    const time = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    setArriveeTime(time);
    if (!isOnline) {
      setOfflineQueue([...offlineQueue, t('mobile.offlineArriveLog', { time })]);
    }
  };

  const handleRetour = () => {
    const time = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    setRetourTime(time);
    if (!isOnline) {
      setOfflineQueue([...offlineQueue, t('mobile.offlineReturnLog', { time })]);
    }
  };

  const handleSimulateCapturePhoto = () => {
    // Simulate compressed photo of receipt (Section 14.7: Envoi base64 compressé < 1Mo)
    setSimulatedPhoto('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" style="background:%23f1f5f9"><text x="20" y="40" font-family="sans-serif" font-size="14" fill="%230f172a">TICKET TOTAL ENERGIES</text><text x="20" y="70" font-family="monospace" font-size="12" fill="%23475569">Gasol 10ppm - 150.00 DH</text><text x="20" y="100" font-family="monospace" font-size="11" fill="%2364748b">Autoroute Casablanca - Marrakech</text><rect x="20" y="120" width="100" height="40" fill="%23cbd5e1"/></svg>');
  };

  const handleSaveMobileVisit = () => {
    const client = clients.find((c) => c.id === selectedClientId);

    if (isOnline) {
      saveSiteVisit({
        employee_id: currentUser.employee_id,
        client_id: selectedClientId,
        date: new Date().toISOString().split('T')[0],
        motif: `Mobile field intervention · ${client?.raison_sociale || 'Client'}`,
        heure_depart: departTime || '09:00',
        heure_arrivee: arriveeTime || '10:00',
        heure_retour: retourTime || '17:00',
        travail_effectue: visitNotes || 'Mobile intervention logged & receipt attached',
        resultat: 'résolu',
        facturable: true,
        montant_facturable: 1200,
        expenses: simulatedPhoto
          ? [
              {
                id: `MEXP-${Date.now()}`,
                visit_id: '',
                type: fraisType as 'essence' | 'transport' | 'repas',
                montant: Number(fraisAmount) || 150,
                statut: 'en attente',
              },
            ]
          : [],
      });
      triggerToast(t('mobile.savedOnlineToast'));
    } else {
      setOfflineQueue([
        ...offlineQueue,
        t('mobile.offlineVisitLog', {
          client: client?.raison_sociale || 'Client',
          amount: fraisAmount,
        }),
      ]);
      triggerToast(t('mobile.savedOfflineToast'));
    }
  };

  const handleSyncOfflineQueue = () => {
    setOfflineQueue([]);
    setIsOnline(true);
    triggerToast(t('mobile.syncedQueueToast'));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="relative bg-slate-900 text-white rounded-[36px] sm:rounded-[44px] p-3 sm:p-4 shadow-2xl border-4 border-slate-700 max-w-[360px] w-full h-[min(720px,calc(100vh-1rem))] sm:h-[720px] flex flex-col overflow-hidden">
        {/* Device Notch & Status bar */}
        <div className="flex items-center justify-between px-6 pt-1 pb-2 shrink-0 text-[11px] font-semibold" dir="ltr">
          <span>{new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>

          {/* Dynamic Island / Notch */}
          <div className="w-20 h-4 bg-black rounded-full" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOnline(!isOnline)}
              title={isOnline ? t('mobile.simOfflineTitle') : t('mobile.restoreOnlineTitle')}
              className="hover:opacity-80"
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            </button>
            <Battery className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Offline Notice banner (Section 14.6) */}
        {!isOnline && (
          <div className="bg-amber-500/90 text-black px-3 py-1 text-[11px] font-bold text-center shrink-0">
            {t('mobile.offlineNotice', { count: offlineQueue.length })}
          </div>
        )}

        {/* Mobile App Header */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/devnappLogo_10b7b539.jpg"
              alt="DEVNAPP"
              className="w-7 h-7 rounded-lg object-contain bg-slate-950 p-0.5 border border-cyan-500/40 shadow-xs"
            />
            <div>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">{t('mobile.appLabel')}</div>
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Simulator Banner (MOB-12) */}
        {showDefaultNotif && (
          <div className="mx-3 mt-2 p-2.5 bg-blue-600/90 rounded-xl text-[11px] flex items-start gap-2 shadow-lg">
            <Bell className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
            <div className="flex-1 text-white font-medium">{t('mobile.defaultNotif')}</div>
            <button onClick={() => setShowDefaultNotif(false)} className="text-white/80 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Inline Action Toast */}
        {toastMessage && (
          <div className="mx-3 mt-2 p-2.5 bg-emerald-600 rounded-xl text-[11px] flex items-start gap-2 shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
            <div className="flex-1 text-white font-medium">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Screen Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-100">
          {activeTab === 'accueil' && (
            <div className="space-y-4">
              {/* Daily status card (MOB-2) */}
              <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">{t('mobile.dailyStatusTitle')}</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    {t('mobile.toSubmitBadge')}
                  </span>
                </div>
                <div className="text-sm font-bold">{t('mobile.deadlineLabel')}</div>
                <button
                  onClick={() => setActiveTab('deplacement')}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-white rounded-xl text-center shadow-xs"
                >
                  {t('mobile.startFieldBtn')}
                </button>
              </div>

              {/* Quick Field Clocking (MOB-4) */}
              <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 block">{t('mobile.quickClockTitle')}</span>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    onClick={handleDepart}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      departTime ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                  >
                    <div>{t('mobile.depart')}</div>
                    <div className="text-[10px] font-mono mt-1" dir="ltr">{departTime || t('mobile.tapClock')}</div>
                  </button>

                  <button
                    onClick={handleArrivee}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      arriveeTime ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                  >
                    <div>{t('mobile.arrived')}</div>
                    <div className="text-[10px] font-mono mt-1" dir="ltr">{arriveeTime || t('mobile.tapClock')}</div>
                  </button>

                  <button
                    onClick={handleRetour}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      retourTime ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                  >
                    <div>{t('mobile.return')}</div>
                    <div className="text-[10px] font-mono mt-1" dir="ltr">{retourTime || t('mobile.tapClock')}</div>
                  </button>
                </div>
              </div>

              {/* Offline sync queue box (Section 14.6) */}
              {offlineQueue.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                    <span>{t('mobile.offlineQueueTitle', { count: offlineQueue.length })}</span>
                    <button
                      onClick={handleSyncOfflineQueue}
                      className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded font-bold whitespace-nowrap shrink-0"
                    >
                      {t('mobile.syncBtn')}
                    </button>
                  </div>
                  <div className="space-y-1 text-[10px] text-amber-200/80">
                    {offlineQueue.map((item, i) => (
                      <div key={i}>• {item}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deplacement' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t('mobile.destClient')}</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.raison_sociale} ({c.ville})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">{t('mobile.workDoneLabel')}</label>
                <textarea
                  rows={2}
                  required
                  placeholder={t('mobile.workDonePlaceholder')}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              {/* Photo receipt capture (MOB-5) */}
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">{t('mobile.receiptTitle')}</span>
                  <button
                    onClick={handleSimulateCapturePhoto}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold whitespace-nowrap shrink-0"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t('mobile.takePhoto')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={fraisAmount}
                    onChange={(e) => setFraisAmount(e.target.value)}
                    placeholder={t('mobile.amountPlaceholder')}
                    className="p-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white font-mono"
                  />
                  <select
                    value={fraisType}
                    onChange={(e) => setFraisType(e.target.value)}
                    className="p-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white"
                  >
                    <option value="essence">{t('mobile.fuel')}</option>
                    <option value="transport">{t('mobile.transport')}</option>
                    <option value="repas">{t('mobile.meals')}</option>
                  </select>
                </div>

                {simulatedPhoto && (
                  <div className="mt-2 rounded border border-slate-600 overflow-hidden bg-white p-1">
                    <img src={simulatedPhoto} alt={t('mobile.photoCompressed')} className="w-full h-16 object-contain" />
                    <div className="text-[9px] text-slate-700 text-center font-mono pt-0.5">{t('mobile.photoCompressed')}</div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveMobileVisit}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-white rounded-xl text-center shadow-lg transition-colors"
              >
                {t('mobile.saveVisitBtn')}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Bottom Tab Bar */}
        <div className="h-14 bg-slate-950/90 border-t border-slate-800 flex items-center justify-around px-2 shrink-0">
          <button
            onClick={() => setActiveTab('accueil')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'accueil' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t('mobile.tabHome')}</span>
          </button>

          <button
            onClick={() => setActiveTab('deplacement')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'deplacement' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t('mobile.tabMission')}</span>
          </button>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex flex-col items-center gap-0.5 ${
              !isOnline ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-[10px] font-medium">{isOnline ? t('mobile.online') : t('mobile.offline')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
