import React, { useState } from 'react';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Tag,
  Shield,
  X,
  Radio,
  Flame,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundEngine } from '../services/api';

const CATEGORIES = [
  { id: 'poor_lighting', label: 'Poor / Broken Streetlights', icon: '💡', color: 'border-amber-500/40 text-amber-300' },
  { id: 'harassment', label: 'Harassment / Loitering', icon: '🚫', color: 'border-rose-500/40 text-rose-300' },
  { id: 'deserted_area', label: 'Deserted / Isolated Zone', icon: '🌑', color: 'border-purple-500/40 text-purple-300' },
  { id: 'physical_hazard', label: 'Open Trench / Road Hazard', icon: '🚧', color: 'border-orange-500/40 text-orange-300' },
  { id: 'suspicious_activity', label: 'Suspicious Activity', icon: '👁️', color: 'border-red-500/40 text-red-300' },
  { id: 'stray_animals', label: 'Aggressive Stray Dogs', icon: '🐕', color: 'border-yellow-500/40 text-yellow-300' },
];

export default function IncidentModal({
  isOpen,
  onClose,
  onSubmitIncident,
  selectedMapCoords,
  onRewardPoints
}) {
  const [category, setCategory] = useState('poor_lighting');
  const [severity, setSeverity] = useState('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('night');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default coordinate if not picked from map
  const defaultLng = selectedMapCoords ? selectedMapCoords.lng : 77.2065;
  const defaultLat = selectedMapCoords ? selectedMapCoords.lat : 28.6289;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    try {
      await onSubmitIncident({
        title,
        description,
        category,
        severity,
        coordinates: [defaultLng, defaultLat],
        address: address || 'Community Geotagged Point',
        timeOfDay,
        reporterName: 'Community Guardian',
        tags: [category, severity, 'community-verified']
      });

      SoundEngine.playSafeChime();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
      onRewardPoints(10, 'Hazard report submitted to community safety network');

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass-panel p-5 lg:p-6 rounded-3xl border border-slate-700/80 max-w-lg w-full space-y-4 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-hazard-500/20 text-hazard-400 border border-hazard-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Report Safety Hazard
              </h2>
              <p className="text-[11px] text-slate-400">
                Alert fellow citizens and boost the live safety rating
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Category Picker */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Select Hazard Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    category === cat.id
                      ? 'bg-slate-800 border-safe-500 shadow-sm text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-[11px] truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Picker */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'Low', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
                { id: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                { id: 'high', label: 'High', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                { id: 'critical', label: 'Critical', color: 'bg-red-600/30 text-red-300 border-red-500/60 font-black' },
              ].map(s => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={`py-2 rounded-xl border text-center font-bold uppercase text-[10px] tracking-wider transition-all ${
                    severity === s.id
                      ? `${s.color} border-2 shadow-md`
                      : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Hazard Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Broken Streetlights & Dark Alleyway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 focus:border-safe-500 text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Description / Advice to Walkers
            </label>
            <textarea
              rows={2}
              placeholder="Provide context (e.g. Unlit for 200m after 8:30 PM, avoid shortcut)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 focus:border-safe-500 text-slate-100 placeholder-slate-500 outline-none resize-none"
            />
          </div>

          {/* Geolocation Coordinate Indicator */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-safe-400" />
              <span>Location: <strong>{defaultLat.toFixed(4)}, {defaultLng.toFixed(4)}</strong></span>
            </div>
            <span className="text-[10px] text-safe-400 font-mono">Geotagged</span>
          </div>

          {/* Time of Day */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-bold">When is this most hazardous?</span>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 outline-none text-xs"
            >
              <option value="night">Night Time</option>
              <option value="late_night">Late Night / Midnight</option>
              <option value="evening">Evening / Dusk</option>
              <option value="any">All Times</option>
            </select>
          </div>

          {/* Community Reward Badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-safe-500/10 border border-safe-500/30 text-safe-300 text-[11px]">
            <Sparkles className="w-4 h-4 text-safe-400 shrink-0" />
            <span>You will receive <strong>+10 Community Guardian Points</strong> for this verified report.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-hazard-500 to-rose-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider shadow-neon-hazard transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Broadcasting Alert...</span>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Submit Report to Community</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
