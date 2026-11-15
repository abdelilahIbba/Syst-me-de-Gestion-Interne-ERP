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
    <div className="ios-sheet-backdrop fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="relative bg-[#0B1733] text-[#F4F8FD] rounded-[44px] sm:rounded-[48px] p-3 sm:p-4 shadow-2xl border-4 border-[#1E3566] max-w-[360px] w-full h-[min(720px,calc(100vh-1rem))] sm:h-[720px] flex flex-col overflow-hidden">
        {/* Device Notch & Status bar */}
        <div className="flex items-center justify-between px-6 pt-1 pb-2 shrink-0 text-[11px] font-semibold" dir="ltr">
          <span>{new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</span>

          {/* Dynamic Island */}
          <div className="w-24 h-5 bg-[#050C1D] rounded-full border border-[#1E3566]/70 flex items-center justify-end px-2">
            <div className="w-2 h-2 rounded-full bg-[#10224A] border border-[#38BDF8]/30" />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOnline(!isOnline)}
              title={isOnline ? t('mobile.simOfflineTitle') : t('mobile.restoreOnlineTitle')}
              className="hover:opacity-80 active:scale-[0.9] transition-transform"
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            </button>
            <Battery className="w-4 h-4 text-[#9DB3D8]" />
          </div>
        </div>

        {/* Offline Notice banner (Section 14.6) */}
        {!isOnline && (
          <div className="bg-amber-400 text-[#0B1733] px-3 py-1 text-[11px] font-bold text-center shrink-0 rounded-[10px] mx-2">
            {t('mobile.offlineNotice', { count: offlineQueue.length })}
          </div>
        )}

        {/* Mobile App Header */}
        <div className="px-4 py-2.5 bg-[#0B1733] border-b border-[#1E3566] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/devnappLogo_10b7b539.jpg"
              alt="DEVNAPP"
              className="w-7 h-7 rounded-lg object-contain bg-[#09132B] p-0.5 border border-[#38BDF8]/40 shadow-xs"
            />
            <div>
              <div className="text-[10px] text-[#38BDF8] font-bold uppercase tracking-wider">{t('mobile.appLabel')}</div>
              <div className="text-xs font-bold text-[#F4F8FD] truncate">{currentUser.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#12234B] border border-[#1E3566] flex items-center justify-center text-[#9DB3D8] hover:text-[#F4F8FD] transition-all active:scale-[0.92]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Simulator Banner (MOB-12) */}
        {showDefaultNotif && (
          <div className="mx-3 mt-2 p-2.5 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] rounded-[18px] text-[11px] flex items-start gap-2 shadow-lg">
            <Bell className="w-3.5 h-3.5 text-[#F4F8FD] shrink-0 mt-0.5" />
            <div className="flex-1 text-[#F4F8FD] font-medium">{t('mobile.defaultNotif')}</div>
            <button onClick={() => setShowDefaultNotif(false)} className="text-[#E0F2FE] hover:text-[#F4F8FD] active:scale-[0.9]">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Inline Action Toast */}
        {toastMessage && (
          <div className="mx-3 mt-2 p-2.5 bg-[#0E6245] border border-emerald-400/30 rounded-[18px] text-[11px] flex items-start gap-2 shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0 mt-0.5" />
            <div className="flex-1 text-[#F4F8FD] font-medium">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-100 hover:text-[#F4F8FD] active:scale-[0.9]">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Screen Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-100">
          {activeTab === 'accueil' && (
            <div className="space-y-4">
              {/* Daily status card (MOB-2) */}
              <div className="p-3.5 bg-[#12234B] rounded-[20px] border border-[#1E3566] space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#9DB3D8] font-medium">{t('mobile.dailyStatusTitle')}</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                    {t('mobile.toSubmitBadge')}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#F4F8FD]">{t('mobile.deadlineLabel')}</div>
                <button
                  onClick={() => setActiveTab('deplacement')}
                  className="ios-btn-primary w-full py-2.5 text-center text-xs"
                >
                  {t('mobile.startFieldBtn')}
                </button>
              </div>

              {/* Quick Field Clocking (MOB-4) */}
              <div className="p-3.5 bg-[#12234B] rounded-[20px] border border-[#1E3566] space-y-3 shadow-sm">
                <span className="text-[11px] font-bold text-[#DCE6F3] block">{t('mobile.quickClockTitle')}</span>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    onClick={handleDepart}
                    className={`p-2.5 rounded-[14px] border text-[11px] font-bold transition-all active:scale-[0.95] ${
                      departTime ? 'bg-emerald-600 border-emerald-500 text-[#F4F8FD]' : 'bg-[#193064] border-[#284587] text-[#E6EEF8]'
                    }`}
                  >
                    <div>{t('mobile.depart')}</div>
                    <div className="text-[10px] font-mono mt-1" dir="ltr">{departTime || t('mobile.tapClock')}</div>
                  </button>

                  <button
                    onClick={handleArrivee}
                    className={`p-2.5 rounded-[14px] border text-[11px] font-bold transition-all active:scale-[0.95] ${
                      arriveeTime ? 'bg-[#0284C7] border-[#38BDF8] text-[#F4F8FD]' : 'bg-[#193064] border-[#284587] text-[#E6EEF8]'
                    }`}
                  >
                    <div>{t('mobile.arrived')}</div>
                    <div className="text-[10px] font-mono mt-1" dir="ltr">{arriveeTime || t('mobile.tapClock')}</div>
                  </button>

                  <button
                    onClick={handleRetour}
                    className={`p-2.5 rounded-[14px] border text-[11px] font-bold transition-all active:scale-[0.95] ${
                      retourTime ? 'bg-indigo-600 border-indigo-400 text-[#F4F8FD]' : 'bg-[#193064] border-[#284587] text-[#E6EEF8]'
                    }`}
                  >
                    <div>{t('mobile.return')}</div>
                    <div className="text-[10px] font-mono mt-1" dir="ltr">{retourTime || t('mobile.tapClock')}</div>
                  </button>
                </div>
              </div>

              {/* Offline sync queue box (Section 14.6) */}
              {offlineQueue.length > 0 && (
                <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                    <span>{t('mobile.offlineQueueTitle', { count: offlineQueue.length })}</span>
                    <button
                      onClick={handleSyncOfflineQueue}
                      className="text-xs bg-amber-400 text-[#0B1733] px-2 py-0.5 rounded font-bold whitespace-nowrap shrink-0"
                    >
                      {t('mobile.syncBtn')}
                    </button>
                  </div>
                  <div className="space-y-1 text-[10px] text-amber-200/85">
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
                <label className="block text-[11px] text-[#9DB3D8] mb-1">{t('mobile.destClient')}</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full p-2.5 bg-[#12234B] border border-[#1E3566] rounded-[13px] text-xs text-[#F4F8FD] focus:outline-hidden focus:border-[#38BDF8]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.raison_sociale} ({c.ville})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#9DB3D8] mb-1">{t('mobile.workDoneLabel')}</label>
                <textarea
                  rows={2}
                  required
                  placeholder={t('mobile.workDonePlaceholder')}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#12234B] border border-[#1E3566] rounded-[13px] text-xs text-[#F4F8FD] focus:outline-hidden focus:border-[#38BDF8]"
                />
              </div>

              {/* Photo receipt capture (MOB-5) */}
              <div className="p-3.5 bg-[#12234B] rounded-[18px] border border-[#1E3566] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">{t('mobile.receiptTitle')}</span>
                  <button
                    onClick={handleSimulateCapturePhoto}
                    className="flex items-center gap-1 text-[11px] text-[#38BDF8] hover:text-[#7DD3FC] font-semibold whitespace-nowrap shrink-0 active:scale-[0.95] transition-transform"
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
                    className="p-2 bg-[#193064] border border-[#284587] rounded-[10px] text-xs text-[#F4F8FD] font-mono focus:outline-hidden focus:border-[#38BDF8]"
                  />
                  <select
                    value={fraisType}
                    onChange={(e) => setFraisType(e.target.value)}
                    className="p-2 bg-[#193064] border border-[#284587] rounded-[10px] text-xs text-[#F4F8FD] focus:outline-hidden focus:border-[#38BDF8]"
                  >
                    <option value="essence">{t('mobile.fuel')}</option>
                    <option value="transport">{t('mobile.transport')}</option>
                    <option value="repas">{t('mobile.meals')}</option>
                  </select>
                </div>

                {simulatedPhoto && (
                  <div className="mt-2 rounded-[12px] border border-[#1E3566] overflow-hidden bg-[#E6EEF8] p-1">
                    <img src={simulatedPhoto} alt={t('mobile.photoCompressed')} className="w-full h-16 object-contain" />
                    <div className="text-[9px] text-[#273B63] text-center font-mono pt-0.5">{t('mobile.photoCompressed')}</div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveMobileVisit}
                className="ios-btn-primary w-full py-2.5 text-center text-xs"
              >
                {t('mobile.saveVisitBtn')}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Bottom Tab Bar (iOS Frosted Tab Bar) */}
        <div className="h-14 bg-[#09132B]/90 backdrop-blur-xl border-t border-[#1E3566] flex items-center justify-around px-2 shrink-0">
          <button
            onClick={() => setActiveTab('accueil')}
            className={`flex flex-col items-center gap-0.5 transition-all active:scale-[0.93] ${
              activeTab === 'accueil' ? 'text-[#38BDF8]' : 'text-[#9DB3D8]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t('mobile.tabHome')}</span>
          </button>

          <button
            onClick={() => setActiveTab('deplacement')}
            className={`flex flex-col items-center gap-0.5 transition-all active:scale-[0.93] ${
              activeTab === 'deplacement' ? 'text-[#38BDF8]' : 'text-[#9DB3D8]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-medium">{t('mobile.tabMission')}</span>
          </button>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex flex-col items-center gap-0.5 transition-all active:scale-[0.93] ${
              !isOnline ? 'text-amber-400' : 'text-[#9DB3D8]'
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
