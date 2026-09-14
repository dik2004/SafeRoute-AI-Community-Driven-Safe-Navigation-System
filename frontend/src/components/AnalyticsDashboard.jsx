import React from 'react';
import {
  BarChart3,
  Shield,
  Sun,
  Camera,
  HeartHandshake,
  AlertTriangle,
  TrendingUp,
  Award,
  Sparkles,
  Radio,
  CheckCircle2
} from 'lucide-react';

export default function AnalyticsDashboard({
  areaScore,
  overviewStats,
  timeOfDay
}) {
  const score = areaScore?.overallScore || 8.4;
  const metrics = areaScore?.metrics || {
    lightingRating: 8.8,
    cctvSurveillance: 8.5,
    emergencyResponse: 9.0,
    crowdAndVibrancy: 7.8,
    activeHazardsPenalty: 0.8
  };
  const counts = areaScore?.counts || {
    totalStreetLights: 6,
    totalCctvCameras: 5,
    policeHelpPosts: 3,
    safeHavens24x7: 3,
    unresolvedIncidents: 4
  };

  const scorePct = Math.round(score * 10);

  return (
    <div className="space-y-4">
      
      {/* Overview Top Card */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3.5 shadow-xl">
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Urban Safety Index & Radar
              </h2>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Locality: <strong className="text-slate-200">{areaScore?.locality || 'Central Urban Corridor'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            <Radio className="w-3 h-3 text-safe-400 animate-pulse" />
            <span>Time: <strong className="text-slate-100">{timeOfDay.toUpperCase()}</strong></span>
          </div>
        </div>

        {/* Big Score Gauge + Key Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          
          {/* Main Index Score Card */}
          <div className="glass-panel-glow p-4 rounded-2xl border border-safe-500/40 flex flex-col items-center justify-center text-center space-y-1.5">
            <div className="relative flex items-center justify-center w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-safe-500"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - scorePct / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white tracking-tight">
                  {score}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  / 10 Index
                </span>
              </div>
            </div>

            <div className="font-bold text-safe-400 text-xs">
              {areaScore?.ratingLabel || 'High Safety Rating'}
            </div>
          </div>

          {/* Core Factor Bars */}
          <div className="md:col-span-2 glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2 justify-center flex flex-col">
            <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              Factor Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span className="flex items-center gap-1">💡 Street Lighting Density</span>
                  <strong className="text-amber-400">{metrics.lightingRating}/10</strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${metrics.lightingRating * 10}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span className="flex items-center gap-1">📹 CCTV Surveillance</span>
                  <strong className="text-sky-400">{metrics.cctvSurveillance}/10</strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${metrics.cctvSurveillance * 10}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span className="flex items-center gap-1">👮 Emergency Response</span>
                  <strong className="text-indigo-400">{metrics.emergencyResponse}/10</strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${metrics.emergencyResponse * 10}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span className="flex items-center gap-1">⚠️ Active Hazards Penalty</span>
                  <strong className="text-rose-400">-{metrics.activeHazardsPenalty} pts</strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${metrics.activeHazardsPenalty * 25}%` }} />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* City Infrastructure Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="glass-panel p-3 rounded-2xl border border-slate-800 text-center space-y-0.5">
          <div className="text-lg">💡</div>
          <div className="text-lg font-bold text-amber-400">{counts.totalStreetLights}</div>
          <div className="text-[10px] text-slate-400">Smart LED Poles</div>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-slate-800 text-center space-y-0.5">
          <div className="text-lg">📹</div>
          <div className="text-lg font-bold text-sky-400">{counts.totalCctvCameras}</div>
          <div className="text-[10px] text-slate-400">360° AI Cameras</div>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-slate-800 text-center space-y-0.5">
          <div className="text-lg">👮</div>
          <div className="text-lg font-bold text-indigo-400">{counts.policeHelpPosts}</div>
          <div className="text-[10px] text-slate-400">Police Posts</div>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-slate-800 text-center space-y-0.5">
          <div className="text-lg">🏥</div>
          <div className="text-lg font-bold text-safe-400">{counts.safeHavens24x7}</div>
          <div className="text-[10px] text-slate-400">24/7 Havens</div>
        </div>
      </div>

      {/* Dynamic Safety AI Recommendations */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2.5 shadow-xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-safe-400" />
          <span>Safety Intelligence Insights</span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-300">
          {(areaScore?.safetyRecommendations || [
            'Prefer illuminated arterial avenues between 9:00 PM and 5:00 AM.',
            'Emergency SOS response booths active at Metro Gate 2 and Avenue 4.',
            'Use the "Guardian Walk" companion for illuminated corridor monitoring.'
          ]).map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-safe-400 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
