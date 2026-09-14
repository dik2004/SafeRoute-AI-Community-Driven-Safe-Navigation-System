import React, { useState } from 'react';
import {
  HeartHandshake,
  Shield,
  Camera,
  Sun,
  X,
  MapPin,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundEngine } from '../services/api';

export default function AddSafetyPointModal({
  isOpen,
  onClose,
  onSubmitSafetyPoint,
  selectedMapCoords,
  onRewardPoints
}) {
  const [type, setType] = useState('street_light');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultLng = selectedMapCoords ? selectedMapCoords.lng : 77.2065;
  const defaultLat = selectedMapCoords ? selectedMapCoords.lat : 28.6289;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      await onSubmitSafetyPoint({
        name,
        type,
        coordinates: [defaultLng, defaultLat],
        address: address || 'Community Mapped Safe Haven',
        coverageRadiusMeters: type === 'street_light' ? 55 : type === 'cctv_camera' ? 80 : 350,
        details: {
          phone: phone || '',
          operationalHours: '24/7',
          isWorking: true
        }
      });

      SoundEngine.playSafeChime();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      onRewardPoints(15, 'Contributed new safety infrastructure to city database');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass-panel p-5 lg:p-6 rounded-3xl border border-slate-700/80 max-w-md w-full space-y-4 shadow-2xl relative my-6">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-safe-500/20 text-safe-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Contribute Safety Infrastructure
              </h2>
              <p className="text-[11px] text-slate-400">
                Register a safe haven, working streetlight, or CCTV camera
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div>
            <label className="block text-slate-300 font-bold mb-1">Infrastructure Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'street_light', label: '💡 Street Light', icon: Sun },
                { id: 'cctv_camera', label: '📹 CCTV Camera', icon: Camera },
                { id: 'safe_haven', label: '💊 24/7 Pharmacy', icon: HeartHandshake },
                { id: 'busy_commercial_hub', label: '🚇 Transit Hub', icon: Shield },
              ].map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`p-2.5 rounded-xl border text-left text-[11px] font-semibold transition-all ${
                    type === t.id
                      ? 'bg-slate-800 border-safe-500 text-safe-300 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Name / Landmark</label>
            <input
              type="text"
              required
              placeholder="e.g. MedPlus 24x7 Pharmacy or High-Lumen LED Pole"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 focus:border-safe-500 text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Address / Street</label>
            <input
              type="text"
              placeholder="e.g. Near Metro Station Exit 1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 focus:border-safe-500 text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Contact Phone (Optional)</label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 focus:border-safe-500 text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-safe-500/10 border border-safe-500/30 text-safe-300 text-[11px]">
            <Sparkles className="w-4 h-4 text-safe-400 shrink-0" />
            <span>Earn <strong>+15 Guardian Points</strong> for verified safety points.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-black text-xs uppercase tracking-wider shadow-neon-safe transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Point...' : 'Submit Safety Infrastructure'}
          </button>

        </form>

      </div>
    </div>
  );
}
