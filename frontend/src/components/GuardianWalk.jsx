import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundEngine } from '../services/api';

export default function GuardianWalk({
  activeRoute,
  isWalking,
  onStopWalk,
  onOpenSOS,
  onRewardPoints,
  guardianLocation
}) {
  const [progressPct, setProgressPct] = useState(0);
  const [checkInSecondsLeft, setCheckInSecondsLeft] = useState(45);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isBeaconActive, setIsBeaconActive] = useState(false);

  // Simulate walking progress along coordinates
  useEffect(() => {
    if (!isWalking) {
      setProgressPct(0);
      return;
    }

    const interval = setInterval(() => {
      setProgressPct(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          handleFinishWalk();
          return 100;
        }
        return prev + 3.5;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isWalking]);

  // Check-in countdown timer
  useEffect(() => {
    if (!isWalking) return;

    const timer = setInterval(() => {
      setCheckInSecondsLeft(prev => {
        if (prev <= 1) {
          setShowCheckInModal(true);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isWalking]);

  const handleConfirmSafe = () => {
    setShowCheckInModal(false);
    setCheckInSecondsLeft(45);
    SoundEngine.playSafeChime();
    onRewardPoints(5, 'Safety check-in verified');
  };

  const handleTriggerBeacon = () => {
    setIsBeaconActive(true);
    SoundEngine.playBeaconPing();
    setTimeout(() => {
      SoundEngine.playBeaconPing();
    }, 400);
    setTimeout(() => setIsBeaconActive(false), 1500);
  };

  const handleFinishWalk = () => {
    SoundEngine.playSafeChime();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) {}
    onRewardPoints(20, 'Safely completed corridor walk');
    onStopWalk();
  };

  if (!isWalking) return null;

  return (
    <>
      {/* Floating Guardian Walk Active HUD Banner */}
      <div className="glass-panel-glow p-4 rounded-2xl border border-safe-500/50 shadow-neon-safe space-y-3 animate-in slide-in-from-top-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-safe-500 text-cyber-950 font-bold">
              <Radio className="w-4 h-4 animate-ping" />
            </div>
            <div>
              <div className="text-xs font-bold text-safe-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Guardian Walk Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-safe-400 animate-pulse"></span>
              </div>
              <div className="text-xs font-semibold text-slate-100">
                {activeRoute?.title || 'Illuminated Safety Corridor'}
              </div>
            </div>
          </div>

          <button
            onClick={handleFinishWalk}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-safe-600 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700"
          >
            Arrived Safely ✓
          </button>
        </div>

        {/* Live Route Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-300 mb-1">
            <span>Route Journey Progress</span>
            <strong className="text-safe-400">{Math.round(progressPct)}% Complete</strong>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-safe-400 to-teal-300 rounded-full transition-all duration-300 shadow-neon-safe"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Live Corridor Status Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Lighting Aura</div>
            <div className="font-bold text-amber-400 text-xs">💡 94% LED</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">CCTV Coverage</div>
            <div className="font-bold text-sky-400 text-xs">📹 Monitored Zone</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Next Check-In</div>
            <div className="font-mono font-bold text-safe-400 text-xs">{checkInSecondsLeft}s</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">Police Proximity</div>
            <div className="font-bold text-indigo-400 text-xs">👮 180m</div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleTriggerBeacon}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isBeaconActive
                ? 'bg-beacon-500 text-white border-beacon-400 shadow-neon-beacon animate-bounce'
                : 'bg-slate-900/90 hover:bg-slate-800 text-beacon-400 border-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Sound Whistle Beacon</span>
          </button>

          <button
            onClick={onOpenSOS}
            className="flex-1 py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold border border-rose-500/50 shadow-neon-hazard flex items-center justify-center gap-1.5 transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency SOS</span>
          </button>
        </div>

      </div>

      {/* Periodic Safety Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel p-6 rounded-3xl border border-safe-500/60 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-safe-500/20 border border-safe-500/40 text-safe-400 mx-auto flex items-center justify-center text-2xl animate-pulse">
              🛡️
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Periodic Safety Check-In</h3>
              <p className="text-xs text-slate-300 mt-1">
                You are currently navigating along the corridor. Please confirm you are safe.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleConfirmSafe}
                className="w-full py-2.5 rounded-xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-black text-xs shadow-neon-safe transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Am Safe (Confirm)</span>
              </button>

              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  onOpenSOS();
                }}
                className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>I Need Help / Trigger SOS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
