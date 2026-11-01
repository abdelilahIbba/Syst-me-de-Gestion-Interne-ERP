/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDH } from '../utils/calculations';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Battery,
  Camera,
  Play,
  MapPin,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  RotateCcw,
  Fingerprint,
  X,
  FileCheck2,
  Bell,
} from 'lucide-react';

export const MobileDeviceSimulator: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    clients,
    projects,
    dailyReports,
    siteVisits,
    saveDailyReport,
    saveSiteVisit,
    offlineQueueCount,
    triggerOfflineSync,
  } = useApp();

  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'accueil' | 'rapport' | 'deplacement' | 'frais'>('accueil');

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

  const [notification, setNotification] = useState<string | null>(
    'Rappel : Rapport journalier à soumettre avant 18h30'
  );

  if (!isOpen) return null;

  const handleDepart = () => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setDepartTime(time);
    if (!isOnline) {
      setOfflineQueue([...offlineQueue, `Départ horodaté à ${time} (Hors-ligne)`]);
    }
  };

  const handleArrivee = () => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setArriveeTime(time);
    if (!isOnline) {
      setOfflineQueue([...offlineQueue, `Arrivée client horodatée à ${time} (Hors-ligne)`]);
    }
  };

  const handleRetour = () => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setRetourTime(time);
    if (!isOnline) {
      setOfflineQueue([...offlineQueue, `Retour mission horodaté à ${time} (Hors-ligne)`]);
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
        motif: `Intervention terrain mobile chez ${client?.raison_sociale || 'Client'}`,
        heure_depart: departTime || '09:00',
        heure_arrivee: arriveeTime || '10:00',
        heure_retour: retourTime || '17:00',
        travail_effectue: visitNotes || 'Intervention mobile enregistrée et validée avec ticket',
        resultat: 'résolu',
        facturable: true,
        montant_facturable: 1200,
        expenses: simulatedPhoto
          ? [
              {
                id: `MEXP-${Date.now()}`,
                visit_id: '',
                type: fraisType as any,
                montant: Number(fraisAmount) || 150,
                statut: 'en attente',
              },
            ]
          : [],
      });
      alert('Intervention et frais synchronisés avec Google Sheets !');
    } else {
      setOfflineQueue([
        ...offlineQueue,
        `Intervention chez ${client?.raison_sociale} (${fraisAmount} DH)`,
      ]);
      alert('Enregistré dans la file locale hors ligne (MOB-15). Sera envoyé à la reconnexion.');
    }
  };

  const handleSyncOfflineQueue = () => {
    setOfflineQueue([]);
    setIsOnline(true);
    alert('Synchronisation de la file hors ligne réussie avec l\'API Google Apps Script !');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="relative bg-slate-900 text-white rounded-[44px] p-4 shadow-2xl border-4 border-slate-700 max-w-[360px] w-full h-[720px] flex flex-col overflow-hidden">
        {/* Device Notch & Status bar */}
        <div className="flex items-center justify-between px-6 pt-1 pb-2 shrink-0 text-[11px] font-semibold">
          <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>

          {/* Dynamic Island / Notch */}
          <div className="w-20 h-4 bg-black rounded-full" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOnline(!isOnline)}
              title={isOnline ? 'Simuler coupure réseau (Mode hors-ligne)' : 'Rétablir la connexion'}
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
            Mode Hors-Ligne Actif ({offlineQueue.length} en attente)
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
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">DEVNAPP Mobile</div>
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
        {notification && (
          <div className="mx-3 mt-2 p-2.5 bg-blue-600/90 rounded-xl text-[11px] flex items-start gap-2 shadow-lg">
            <Bell className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
            <div className="flex-1 text-white font-medium">{notification}</div>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
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
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Rapport Journalier du Jour</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    À Soumettre
                  </span>
                </div>
                <div className="text-sm font-bold">Limite de dépôt : 18h30</div>
                <button
                  onClick={() => setActiveTab('deplacement')}
                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-white rounded-xl text-center shadow-xs"
                >
                  Lancer une intervention terrain →
                </button>
              </div>

              {/* Quick Field Clocking (MOB-4) */}
              <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700/80 space-y-3">
                <span className="text-[11px] font-bold text-slate-300 block">Horodatage Rapide Déplacement (MOB-4)</span>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    onClick={handleDepart}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      departTime ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                  >
                    <div>Départ</div>
                    <div className="text-[10px] font-mono mt-1">{departTime || 'Pointer'}</div>
                  </button>

                  <button
                    onClick={handleArrivee}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      arriveeTime ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                  >
                    <div>Arrivé</div>
                    <div className="text-[10px] font-mono mt-1">{arriveeTime || 'Pointer'}</div>
                  </button>

                  <button
                    onClick={handleRetour}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                      retourTime ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                  >
                    <div>Retour</div>
                    <div className="text-[10px] font-mono mt-1">{retourTime || 'Pointer'}</div>
                  </button>
                </div>
              </div>

              {/* Offline sync queue box (Section 14.6) */}
              {offlineQueue.length > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                    <span>File d'attente locale ({offlineQueue.length})</span>
                    <button
                      onClick={handleSyncOfflineQueue}
                      className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded font-bold"
                    >
                      Synchroniser
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
                <label className="block text-[11px] text-slate-400 mb-1">Client de destination</label>
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
                <label className="block text-[11px] text-slate-400 mb-1">Travaux effectués sur place *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Compte-rendu intervention..."
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              {/* Photo receipt capture (MOB-5) */}
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold">Justificatif de Frais (MOB-5)</span>
                  <button
                    onClick={handleSimulateCapturePhoto}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Prendre photo</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={fraisAmount}
                    onChange={(e) => setFraisAmount(e.target.value)}
                    placeholder="Montant (DH)"
                    className="p-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white font-mono"
                  />
                  <select
                    value={fraisType}
                    onChange={(e) => setFraisType(e.target.value)}
                    className="p-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-white capitalize"
                  >
                    <option value="essence">Essence</option>
                    <option value="transport">Transport</option>
                    <option value="repas">Repas</option>
                  </select>
                </div>

                {simulatedPhoto && (
                  <div className="mt-2 rounded border border-slate-600 overflow-hidden bg-white p-1">
                    <img src={simulatedPhoto} alt="Ticket compressé" className="w-full h-16 object-contain" />
                    <div className="text-[9px] text-slate-700 text-center font-mono pt-0.5">Photo compressée (48 Ko)</div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSaveMobileVisit}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold text-white rounded-xl text-center shadow-lg transition-colors"
              >
                Valider l'Intervention
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
            <span className="text-[10px] font-medium">Accueil</span>
          </button>

          <button
            onClick={() => setActiveTab('deplacement')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'deplacement' ? 'text-cyan-400' : 'text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-medium">Mission</span>
          </button>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex flex-col items-center gap-0.5 ${
              !isOnline ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-[10px] font-medium">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
