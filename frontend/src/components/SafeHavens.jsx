import React, { useState } from 'react';
import {
  HeartHandshake,
  Shield,
  PhoneCall,
  Navigation,
  Clock,
  Plus,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function SafeHavens({
  safetyPoints = [],
  onSelectSafeHaven,
  onOpenAddSafetyPoint
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  const safeHavensList = safetyPoints.filter(p => {
    if (activeCategory === 'police') return p.type === 'police_station' || p.type === 'women_help_booth';
    if (activeCategory === 'health') return p.type === 'safe_haven' || p.type === 'hospital_emergency' || p.type === 'hospital';
    if (activeCategory === 'transit') return p.type === 'busy_commercial_hub';
    return p.type !== 'street_light' && p.type !== 'cctv_camera' && p.type !== 'light' && p.type !== 'cctv';
  });

  const getHavenIcon = (type) => {
    switch (type) {
      case 'police_station': return '👮';
      case 'women_help_booth': return '🛡️';
      case 'safe_haven': return '💊';
      case 'hospital_emergency':
      case 'hospital': return '🏥';
      case 'busy_commercial_hub': return '🚇';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Safe Haven Directory Header */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-safe-500/20 text-safe-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              24/7 Verified Safe Havens
            </h2>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Staff-attended, illuminated emergency refuges within reach
          </p>
        </div>

        <button
          onClick={onOpenAddSafetyPoint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-safe-400" />
          <span>Nominate Haven</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {[
          { id: 'all', label: 'All Havens' },
          { id: 'police', label: '👮 Police & Desks' },
          { id: 'health', label: '🏥 24/7 Medical' },
          { id: 'transit', label: '🚇 Transit Hubs' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
              activeCategory === cat.id
                ? 'bg-safe-500/20 text-safe-300 border border-safe-500/40 font-bold'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Haven Cards Grid */}
      <div className="space-y-2.5">
        {safeHavensList.map((haven, idx) => {
          const lat = haven.location.coordinates[1];
          const lng = haven.location.coordinates[0];
          const phone = haven.details?.phone || (haven.type?.includes('police') ? '112' : '102');

          return (
            <div
              key={haven._id || idx}
              className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 hover:border-safe-500/40 transition-all flex flex-col justify-between gap-2.5 shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{getHavenIcon(haven.type)}</span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-100">
                        {haven.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-safe-400" />
                        {haven.address}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 mt-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1 text-safe-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>{haven.details?.operationalHours || '24/7 Open'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-beacon-400 font-medium">
                    <Shield className="w-3 h-3" />
                    <span>Verified Sanctuary</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onSelectSafeHaven({ lat, lng, name: haven.name })}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-black text-xs shadow-neon-safe transition-all flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Route Here Safely</span>
                </button>

                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-safe-400" />
                    <span>Call</span>
                  </a>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
