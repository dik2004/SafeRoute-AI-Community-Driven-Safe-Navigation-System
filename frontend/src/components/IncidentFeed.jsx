import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  ThumbsUp,
  Search,
  Plus,
  ShieldCheck,
  Radio
} from 'lucide-react';

export default function IncidentFeed({
  incidents = [],
  onUpvoteIncident,
  onResolveIncident,
  onOpenReportModal,
  onLocateOnMap
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const filteredIncidents = incidents.filter(inc => {
    if (!showResolved && inc.status === 'resolved') return false;
    if (showResolved && inc.status !== 'resolved') return false;
    if (filterCategory !== 'all' && inc.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = inc.title?.toLowerCase().includes(q);
      const matchDesc = inc.description?.toLowerCase().includes(q);
      const matchAddr = inc.address?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAddr) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/25 text-red-300 border-red-500/50';
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'poor_lighting': return '💡';
      case 'harassment': return '🚫';
      case 'deserted_area': return '🌑';
      case 'physical_hazard': return '🚧';
      case 'suspicious_activity': return '👁️';
      case 'stray_animals': return '🐕';
      default: return '⚠️';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Report Button */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-hazard-500/20 text-hazard-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Community Hazard Radar
            </h2>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Crowdsourced alerts verified by community safety guardians
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-hazard-500 to-rose-600 text-white text-xs font-bold shadow-neon-hazard hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report Hazard (+10 pts)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hazards by location or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 outline-none text-xs"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'poor_lighting', label: '💡 Lighting' },
              { id: 'harassment', label: '🚫 Harassment' },
              { id: 'deserted_area', label: '🌑 Deserted' },
              { id: 'physical_hazard', label: '🚧 Hazard' },
              { id: 'stray_animals', label: '🐕 Animals' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] transition-all ${
                  filterCategory === cat.id
                    ? 'bg-hazard-500/20 text-hazard-300 border border-hazard-500/40 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
              showResolved
                ? 'bg-safe-500/20 text-safe-300 border border-safe-500/40'
                : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {showResolved ? '✓ Resolved' : 'Active'}
          </button>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-2.5">
        {filteredIncidents.length === 0 ? (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-1.5 text-slate-400">
            <div className="text-2xl">🛡️</div>
            <div className="text-xs font-bold text-slate-200">No Hazards Reported</div>
            <p className="text-[11px]">This area is clear under selected criteria.</p>
          </div>
        ) : (
          filteredIncidents.map((inc, idx) => {
            const isResolved = inc.status === 'resolved';

            return (
              <div
                key={inc._id || idx}
                className={`p-3.5 rounded-2xl border transition-all glass-panel ${
                  inc.severity === 'critical'
                    ? 'border-rose-500/50 shadow-neon-hazard'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl mt-0.5">{getCategoryIcon(inc.category)}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-xs font-bold text-slate-100">
                          {inc.title}
                        </h3>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${getSeverityBadge(inc.severity)}`}>
                          {inc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {inc.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-safe-400" />
                          {inc.address || 'Central Corridor'}
                        </span>
                        <span>•</span>
                        <span>By: <strong className="text-slate-300">{inc.reporterName || 'Guardian'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onLocateOnMap({ lat: inc.location.coordinates[1], lng: inc.location.coordinates[0] })}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0"
                    title="Center on Map"
                  >
                    <MapPin className="w-3.5 h-3.5 text-safe-400" />
                  </button>
                </div>

                {/* Bottom Verification & Upvote Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpvoteIncident(inc._id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold transition-all"
                    >
                      <ThumbsUp className="w-3 h-3 text-safe-400" />
                      <span>Confirm ({inc.upvotes || 1})</span>
                    </button>

                    {inc.verified && (
                      <span className="flex items-center gap-1 text-[10px] text-safe-400 font-bold bg-safe-500/10 px-2 py-0.5 rounded-lg border border-safe-500/20">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  <div>
                    {!isResolved ? (
                      <button
                        onClick={() => onResolveIncident(inc._id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-safe-500/15 hover:bg-safe-500/25 text-safe-300 hover:text-white text-[11px] font-semibold transition-all border border-safe-500/30"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Fixed</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-safe-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
