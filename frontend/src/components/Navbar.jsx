import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Sun,
  Sunset,
  Moon,
  AlertTriangle,
  MapPin,
  HeartHandshake,
  BarChart3,
  PhoneCall,
  User,
  Radio,
  Sparkles,
  ChevronDown,
  Layers,
  Crosshair,
  Loader2,
  Check,
  Palette,
  Globe
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  timeOfDay,
  setTimeOfDay,
  mapTheme = 'dark',
  setMapTheme,
  userProfile,
  areaScore,
  onOpenSOS,
  onOpenReportIncident,
  onOpenProfile,
  isGuardianWalking,
  onLocateLiveGPS,
  isLocatingGPS
}) {
  // Dropdown states
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isSafetyHubOpen, setIsSafetyHubOpen] = useState(false);

  const timeDropdownRef = useRef(null);
  const themeDropdownRef = useRef(null);
  const safetyHubDropdownRef = useRef(null);

  const times = [
    { id: 'day', label: 'Day', desc: 'Full daylight visibility', icon: Sun, color: 'text-amber-400' },
    { id: 'dusk', label: 'Dusk', desc: 'Twilight & early shadow', icon: Sunset, color: 'text-orange-400' },
    { id: 'night', label: 'Night', desc: 'Active streetlighting & CCTV', icon: Moon, color: 'text-indigo-400' },
    { id: 'late_night', label: 'Midnight', desc: 'High security corridors', icon: Moon, color: 'text-purple-400' },
  ];

  const themes = [
    { id: 'dark', label: 'Cyber Dark', desc: 'Google Maps OLED Dark', icon: Moon, color: 'text-emerald-400' },
    { id: 'grey', label: 'Slate Grey', desc: 'Muted Gray Canvas', icon: Layers, color: 'text-slate-300' },
    { id: 'light', label: 'Clean Light', desc: 'Google Maps Daylight', icon: Sun, color: 'text-amber-400' },
    { id: 'satellite', label: 'Satellite', desc: 'Google High-Res Aerial', icon: Globe, color: 'text-sky-400' },
  ];

  const safetyHubItems = [
    { id: 'incidents', label: 'Community Incidents', desc: 'Live verified hazard reports & alerts', icon: AlertTriangle, color: 'text-amber-400' },
    { id: 'safe_havens', label: 'Safe Havens Directory', desc: '24/7 verified shelters & police', icon: HeartHandshake, color: 'text-emerald-400' },
    { id: 'analytics', label: 'City Safety Radar', desc: 'Safety score analytics & metrics', icon: BarChart3, color: 'text-sky-400' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target)) {
        setIsTimeDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setIsThemeDropdownOpen(false);
      }
      if (safetyHubDropdownRef.current && !safetyHubDropdownRef.current.contains(e.target)) {
        setIsSafetyHubOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeTimeObj = times.find(t => t.id === timeOfDay) || times[2];
  const activeThemeObj = themes.find(t => t.id === mapTheme) || themes[0];
  const activeHubItem = safetyHubItems.find(item => item.id === activeTab);
  const isHubActive = !!activeHubItem;
  const ActiveTimeIcon = activeTimeObj.icon;
  const ActiveThemeIcon = activeThemeObj.icon;

  return (
    <header className="sticky top-0 z-40 w-full bg-cyber-950/90 backdrop-blur-xl border-b border-slate-800/80 transition-all duration-200">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
        
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* Brand Logo & Status */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0" 
            onClick={() => {
              setActiveTab('routes');
              setIsSafetyHubOpen(false);
            }}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-safe-500 to-teal-400 shadow-neon-safe transition-transform group-hover:scale-105">
              <Shield className="w-5 h-5 text-cyber-950 stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-safe-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
                  Safe<span className="text-safe-400">Route</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-safe-500/10 text-safe-400 border border-safe-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-safe-400 animate-pulse"></span>
                  AI Live Guard
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xl:block -mt-0.5">
                Spatial safety navigation & illuminated corridors
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs: Primary Safe Navigation + Consolidated Safety Hub Dropdown */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {/* 1. Primary Direct Tab: Safe Navigation */}
            <button
              onClick={() => {
                setActiveTab('routes');
                setIsSafetyHubOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                activeTab === 'routes'
                  ? 'text-white bg-slate-800/90 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${activeTab === 'routes' ? 'text-safe-400' : 'text-slate-400'}`} />
              <span>Safe Navigation</span>
              {isGuardianWalking && (
                <span className="w-2 h-2 rounded-full bg-safe-400 animate-ping ml-0.5" />
              )}
              {activeTab === 'routes' && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-safe-400 rounded-full"></span>
              )}
            </button>

            {/* 2. Consolidated Safety Hub Dropdown */}
            <div className="relative" ref={safetyHubDropdownRef}>
              <button
                onClick={() => {
                  setIsSafetyHubOpen(prev => !prev);
                  setIsTimeDropdownOpen(false);
                  setIsThemeDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                  isHubActive
                    ? 'text-white bg-slate-800/90 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                title="Community Hazard Feed, Safe Havens & Safety Radar"
              >
                {isHubActive && activeHubItem ? (
                  <activeHubItem.icon className={`w-3.5 h-3.5 ${activeHubItem.color}`} />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{isHubActive && activeHubItem ? activeHubItem.label : 'Community & Safety Hub'}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isSafetyHubOpen ? 'rotate-180' : ''}`} />
                {isHubActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-safe-400 rounded-full"></span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isSafetyHubOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-[#0B101E] border border-slate-700 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span>Community & Safety Insights</span>
                    <span className="text-safe-400 font-mono text-[9px]">INFO HUB</span>
                  </div>
                  {safetyHubItems.map(item => {
                    const Icon = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsSafetyHubOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-safe-500/20 text-safe-300 font-bold border border-safe-500/40 shadow-sm'
                            : 'text-slate-200 hover:bg-slate-800/90 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-safe-500/30' : 'bg-slate-900 border border-slate-800'}`}>
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight text-slate-100">{item.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-safe-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Controls Cluster */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* 1. Live GPS Location Button */}
            {onLocateLiveGPS && (
              <button
                onClick={onLocateLiveGPS}
                disabled={isLocatingGPS}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold transition-all shadow-sm active:scale-95 focus:outline-none"
                title="Locate my live position on GPS"
              >
                {isLocatingGPS ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="hidden md:inline">{isLocatingGPS ? 'Locating...' : 'Live GPS'}</span>
              </button>
            )}

            {/* 2. Single Streamlined Time-of-Day Dropdown */}
            <div className="relative" ref={timeDropdownRef}>
              <button
                onClick={() => {
                  setIsTimeDropdownOpen(prev => !prev);
                  setIsThemeDropdownOpen(false);
                }}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-safe-500/40"
                title="Select Time of Day for safety lighting factor"
              >
                <ActiveTimeIcon className={`w-3.5 h-3.5 ${activeTimeObj.color}`} />
                <span className="hidden sm:inline font-bold">{activeTimeObj.label}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isTimeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#0B101E] border border-slate-700 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span>Safety Lighting Mode</span>
                    <span className="text-safe-400 font-mono text-[9px]">ACTIVE</span>
                  </div>
                  {times.map(t => {
                    const Icon = t.icon;
                    const isSelected = timeOfDay === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTimeOfDay(t.id);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-safe-500/20 text-safe-300 font-bold border border-safe-500/40 shadow-sm'
                            : 'text-slate-200 hover:bg-slate-800/90 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-safe-500/30' : 'bg-slate-900 border border-slate-800'}`}>
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${t.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight text-slate-100">{t.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{t.desc}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-safe-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Map Theme Dropdown (Dark, Slate Grey, Clean Light) */}
            {setMapTheme && (
              <div className="relative hidden sm:block" ref={themeDropdownRef}>
                <button
                  onClick={() => {
                    setIsThemeDropdownOpen(prev => !prev);
                    setIsTimeDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700/80 hover:border-slate-600 text-xs font-semibold transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-safe-500/40"
                  title="Switch Map Theme (Dark, Grey, Light)"
                >
                  <Palette className="w-3.5 h-3.5 text-safe-400" />
                  <span className="hidden md:inline font-bold">{activeThemeObj.label}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isThemeDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#0B101E] border border-slate-700 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] p-2 z-50 animate-in fade-in slide-in-from-top-2 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span>Map Canvas Style</span>
                      <span className="text-safe-400 font-mono text-[9px]">THEME</span>
                    </div>
                    {themes.map(th => {
                      const Icon = th.icon;
                      const isSelected = (mapTheme || 'dark') === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => {
                            setMapTheme(th.id);
                            setIsThemeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-safe-500/20 text-safe-300 font-bold border border-safe-500/40 shadow-sm'
                              : 'text-slate-200 hover:bg-slate-800/90 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-safe-500/30' : 'bg-slate-900 border border-slate-800'}`}>
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${th.color}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold leading-tight text-slate-100">{th.label}</div>
                              <div className="text-[10px] text-slate-400 truncate">{th.desc}</div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-safe-400 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Report Hazard Button */}
            <button
              onClick={onOpenReportIncident}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-all"
              title="Report safety hazard on map"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline">Report Hazard</span>
            </button>

            {/* User Points Badge */}
            <button
              onClick={onOpenProfile}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-all hover:bg-slate-800/80"
              title="Guardian Profile & Safe Points"
            >
              <span className="text-sm">{userProfile?.avatar || '🛡️'}</span>
              <span className="font-bold text-safe-400 text-xs hidden sm:inline">
                {userProfile?.guardianPoints || 120} <span className="text-slate-400 font-normal text-[10px]">pts</span>
              </span>
            </button>

            {/* Prominent SOS Emergency Button */}
            <button
              onClick={onOpenSOS}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black shadow-neon-hazard active:scale-95 transition-all animate-pulse"
              title="Emergency SOS Panic Hub"
            >
              <PhoneCall className="w-3.5 h-3.5 fill-current" />
              <span>SOS</span>
            </button>

          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex items-center justify-between gap-1.5 py-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => {
              setActiveTab('routes');
              setIsSafetyHubOpen(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'routes'
                ? 'bg-safe-500/15 text-safe-400 border border-safe-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Safe Navigation</span>
          </button>

          <button
            onClick={() => setIsSafetyHubOpen(prev => !prev)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isHubActive
                ? 'bg-safe-500/15 text-safe-400 border border-safe-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
            }`}
          >
            {isHubActive && activeHubItem ? (
              <activeHubItem.icon className={`w-3.5 h-3.5 ${activeHubItem.color}`} />
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
            <span>{isHubActive && activeHubItem ? activeHubItem.label : 'Safety Hub'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isSafetyHubOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
}
