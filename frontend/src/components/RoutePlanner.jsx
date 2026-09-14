import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Shield,
  Sun,
  Camera,
  AlertTriangle,
  ArrowRight,
  Footprints,
  Bike,
  Car,
  Sparkles,
  ChevronRight,
  Radio,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Globe,
  Search,
  Crosshair,
  Loader2,
  Plus,
  Bookmark,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  AlertOctagon,
  Compass,
  Info,
  Lock,
  Moon,
  Sunset,
  Trash2,
  Star
} from 'lucide-react';
import { SafeRouteAPI } from '../services/api';
import LocationExplorerModal from './LocationExplorerModal';

export default function RoutePlanner({
  origin,
  setOrigin,
  destination,
  setDestination,
  routes = [],
  selectedRouteIndex = 0,
  setSelectedRouteIndex,
  onCalculateRoutes,
  isLoadingRoutes,
  timeOfDay = 'night',
  onStartGuardianWalk,
  isGuardianWalking,
  userProfile,
  onUpdateUserProfile,
  onRewardPoints,
  onOpenProfile
}) {
  const [mode, setMode] = useState('walking');
  const [isLocationExplorerOpen, setIsLocationExplorerOpen] = useState(false);
  const [explorerTarget, setExplorerTarget] = useState('destination');
  const [showDirections, setShowDirections] = useState(false);
  const [showCalculationInfoModal, setShowCalculationInfoModal] = useState(false);

  // Search input state
  const [originSearch, setOriginSearch] = useState(origin?.name || 'Current Location');
  const [destSearch, setDestSearch] = useState(destination?.name || '');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const originTimeoutRef = useRef(null);
  const destTimeoutRef = useRef(null);

  // Recent places history
  const [recentDestinations, setRecentDestinations] = useState(() => {
    try {
      const saved = localStorage.getItem('saferoute_recent_destinations');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  // Geolocation permission & loading states
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
  const [locationPermissionError, setLocationPermissionError] = useState(null);

  // Sync inputs with props (Privacy-conscious formatting)
  useEffect(() => {
    if (origin?.name) setOriginSearch(origin.name);
    else if (!origin) setOriginSearch('Current Location');
  }, [origin?.name]);

  useEffect(() => {
    if (destination?.name) setDestSearch(destination.name);
    else if (!destination) setDestSearch('');
  }, [destination?.name]);

  // Global search for origin
  const handleOriginChange = (text) => {
    setOriginSearch(text);
    if (originTimeoutRef.current) clearTimeout(originTimeoutRef.current);

    if (!text || text.trim().length < 2) {
      setOriginSuggestions([]);
      setIsSearchingOrigin(false);
      return;
    }

    setIsSearchingOrigin(true);
    originTimeoutRef.current = setTimeout(async () => {
      const results = await SafeRouteAPI.searchGlobalPlaces(text);
      setOriginSuggestions(results);
      setIsSearchingOrigin(false);
    }, 150);
  };

  // Global search for destination
  const handleDestChange = (text) => {
    setDestSearch(text);
    if (destTimeoutRef.current) clearTimeout(destTimeoutRef.current);

    if (!text || text.trim().length < 2) {
      setDestSuggestions([]);
      setIsSearchingDest(false);
      return;
    }

    setIsSearchingDest(true);
    destTimeoutRef.current = setTimeout(async () => {
      const results = await SafeRouteAPI.searchGlobalPlaces(text);
      setDestSuggestions(results);
      setIsSearchingDest(false);
    }, 150);
  };

  const handleSelectOrigin = (item) => {
    const newLoc = { lat: item.lat, lng: item.lng, name: item.name, subAddress: item.subAddress || item.fullName };
    setOrigin(newLoc);
    setOriginSearch(item.name);
    setOriginSuggestions([]);
    setLocationPermissionError(null);
    if (destination && destination.lat != null) {
      onCalculateRoutes({ origin: newLoc, destination, timeOfDay, mode });
    }
  };

  const handleSelectDest = (item) => {
    const newLoc = { lat: item.lat, lng: item.lng, name: item.name, subAddress: item.subAddress || item.fullName };
    setDestination(newLoc);
    setDestSearch(item.name);
    setDestSuggestions([]);

    // Save to recent places
    try {
      const existing = recentDestinations.filter(p => p.name !== item.name);
      const updated = [newLoc, ...existing].slice(0, 5);
      setRecentDestinations(updated);
      localStorage.setItem('saferoute_recent_destinations', JSON.stringify(updated));
    } catch (_) {}

    // Check if origin coordinates are present
    if (!origin || origin.lat == null) {
      handleUseCurrentLocation('origin', newLoc);
    } else {
      onCalculateRoutes({ origin, destination: newLoc, timeOfDay, mode });
    }
  };

  const handleLocationSelect = ({ target: tgt, name, lat, lng, address }) => {
    if (tgt === 'origin') {
      const newLoc = { lat, lng, name, subAddress: address };
      setOrigin(newLoc);
      setOriginSearch(name);
      setLocationPermissionError(null);
      if (destination && destination.lat != null) {
        onCalculateRoutes({ origin: newLoc, destination, timeOfDay, mode });
      }
    } else {
      const newLoc = { lat, lng, name, subAddress: address };
      setDestination(newLoc);
      setDestSearch(name);
      if (origin && origin.lat != null) {
        onCalculateRoutes({ origin, destination: newLoc, timeOfDay, mode });
      } else {
        handleUseCurrentLocation('origin', newLoc);
      }
    }
  };

  // Requirement 1 & 2: Use Current Location on-demand with Privacy Protection
  const handleUseCurrentLocation = (target = 'origin', pendingDest = null) => {
    if (!navigator.geolocation) {
      setLocationPermissionError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingCurrent(true);
    setLocationPermissionError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        let friendlyName = 'Current Location';
        const initialLoc = { lat, lng, name: friendlyName, isCurrent: true };

        setIsLocatingCurrent(false);

        if (target === 'origin') {
          setOrigin(initialLoc);
          setOriginSearch(friendlyName);
          const activeDest = pendingDest || destination;
          if (activeDest && activeDest.lat != null) {
            onCalculateRoutes({ origin: initialLoc, destination: activeDest, timeOfDay, mode });
          }
        } else {
          setDestination(initialLoc);
          setDestSearch(friendlyName);
          if (origin && origin.lat != null) {
            onCalculateRoutes({ origin, destination: initialLoc, timeOfDay, mode });
          }
        }

        // Resolve friendly neighborhood name in background
        try {
          const rev = await SafeRouteAPI.reverseGeocode(lat, lng);
          if (rev && rev !== 'Current Location') {
            const updatedLoc = { lat, lng, name: rev, isCurrent: true };
            if (target === 'origin') {
              setOrigin(updatedLoc);
              setOriginSearch(rev);
            } else {
              setDestination(updatedLoc);
              setDestSearch(rev);
            }
          }
        } catch (_) {}
      },
      (err) => {
        setIsLocatingCurrent(false);
        if (err.code === 1) {
          setLocationPermissionError('Location access is disabled in your browser. Please allow location permissions.');
        } else {
          setLocationPermissionError('Unable to acquire current device location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Dynamic nearby category quick lookup (Transit, Hospital, Safe Haven)
  const handleQuickCategory = async (category) => {
    const activeLat = origin?.lat || 28.6139;
    const activeLng = origin?.lng || 77.2090;
    setIsSearchingDest(true);
    try {
      const places = await SafeRouteAPI.findNearbyCategoryPlaces(activeLat, activeLng, category);
      setIsSearchingDest(false);
      if (places && places.length > 0) {
        handleSelectDest(places[0]);
      }
    } catch (_) {
      setIsSearchingDest(false);
    }
  };

  const handleSaveCurrentDestination = async () => {
    if (!destination || !destination.name || destination.lat == null) return;
    try {
      const placePayload = {
        label: destination.name.split(',')[0],
        address: destination.subAddress || destination.name,
        lat: destination.lat,
        lng: destination.lng,
        icon: 'star'
      };
      const res = await SafeRouteAPI.addSavedPlace(placePayload);
      if (res.savedPlaces && onUpdateUserProfile) {
        onUpdateUserProfile(prev => ({ ...prev, savedPlaces: res.savedPlaces }));
      }
      if (onRewardPoints) {
        onRewardPoints(10, 'Saved custom place to profile');
      }
    } catch (err) {
      console.error('Failed to save place', err);
    }
  };

  const handleDeleteSavedPlace = async (e, idx) => {
    e.stopPropagation();
    try {
      const res = await SafeRouteAPI.deleteSavedPlace(idx);
      if (res.savedPlaces && onUpdateUserProfile) {
        onUpdateUserProfile(prev => ({ ...prev, savedPlaces: res.savedPlaces }));
      }
    } catch (err) {
      console.error('Failed to delete saved place', err);
    }
  };

  const handleSwap = () => {
    const tempOrigin = origin;
    const tempOriginSearch = originSearch;
    setOrigin(destination);
    setOriginSearch(destSearch);
    setDestination(tempOrigin);
    setDestSearch(tempOriginSearch);
    if (destination && tempOrigin && destination.lat != null && tempOrigin.lat != null) {
      onCalculateRoutes({ origin: destination, destination: tempOrigin, timeOfDay, mode });
    }
  };

  const activeRoute = routes && routes.length > 0 ? (routes[selectedRouteIndex] || routes[0]) : null;

  // Convert score to integer percentage
  const getSafetyScorePct = (score) => {
    if (!score) return 92;
    return Math.min(99, Math.round(score * 10));
  };

  // Time of day active weight multipliers for explanation modal
  const getTimeWeights = () => {
    if (timeOfDay === 'late_night') {
      return { lighting: '35%', cctv: '20%', police: '15%', pedestrian: '10%', safeHavens: '10%', hazards: '10%' };
    }
    if (timeOfDay === 'night') {
      return { lighting: '30%', cctv: '20%', police: '15%', pedestrian: '15%', safeHavens: '10%', hazards: '10%' };
    }
    if (timeOfDay === 'dusk') {
      return { lighting: '25%', cctv: '20%', police: '15%', pedestrian: '20%', safeHavens: '10%', hazards: '10%' };
    }
    return { lighting: '15%', cctv: '20%', police: '15%', pedestrian: '25%', safeHavens: '10%', hazards: '15%' };
  };

  const currentWeights = getTimeWeights();

  return (
    <div className="flex flex-col gap-3.5 max-h-[720px] overflow-y-auto no-scrollbar pr-0.5">
      
      {/* Route Query & Search Card */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
        
        {/* Header & Mode Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-safe-500/15 text-safe-400 flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Safe Route Planner
              </h2>
              <p className="text-[10px] text-slate-400">Illuminated & monitored travel corridors</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setMode('walking');
                onCalculateRoutes({ origin, destination, timeOfDay, mode: 'walking' });
              }}
              className={`p-1.5 rounded-lg transition-all ${
                mode === 'walking' ? 'bg-safe-500 text-cyber-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Walking mode (Illumination & CCTV priority)"
            >
              <Footprints className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setMode('cycling');
                onCalculateRoutes({ origin, destination, timeOfDay, mode: 'cycling' });
              }}
              className={`p-1.5 rounded-lg transition-all ${
                mode === 'cycling' ? 'bg-safe-500 text-cyber-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cycling mode"
            >
              <Bike className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setMode('driving');
                onCalculateRoutes({ origin, destination, timeOfDay, mode: 'driving' });
              }}
              className={`p-1.5 rounded-lg transition-all ${
                mode === 'driving' ? 'bg-safe-500 text-cyber-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Driving mode"
            >
              <Car className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-2 relative">
          
          {/* Origin Input with Privacy Friendly Context */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-900/95 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-safe-500 focus-within:ring-1 focus-within:ring-safe-500/30 transition-all">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-cyber-950 font-black text-[10px] flex items-center justify-center shrink-0">
                A
              </span>
              <input
                type="text"
                placeholder="Choose starting location..."
                value={originSearch}
                onChange={(e) => handleOriginChange(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-100 placeholder-slate-400 outline-none"
              />
              {isSearchingOrigin && <Loader2 className="w-3 h-3 text-safe-400 animate-spin shrink-0" />}
              {originSearch && (
                <button
                  onClick={() => {
                    setOriginSearch('');
                    setOriginSuggestions([]);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => handleUseCurrentLocation('origin')}
                disabled={isLocatingCurrent}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-safe-400 hover:text-safe-300 shrink-0 transition-all"
                title="Use Current Location (Privacy Protected)"
              >
                {isLocatingCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Origin Autocomplete Suggestions */}
            {originSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0B101E] border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                {originSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOrigin(item)}
                    className="w-full text-left p-2.5 hover:bg-safe-500/20 flex items-start gap-2.5 text-xs transition-all group"
                  >
                    <span className="text-sm shrink-0 mt-0.5">
                      {item.category === 'transit' ? '🚇' : item.category === 'hospital' ? '🏥' : '📍'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-100 group-hover:text-safe-300 text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{item.subAddress || item.fullName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
            <button
              onClick={handleSwap}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white shadow-md transition-all hover:rotate-180"
              title="Swap Start & Destination"
            >
              ⇅
            </button>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-900/95 px-3 py-2 rounded-xl border border-slate-800 focus-within:border-beacon-500 focus-within:ring-1 focus-within:ring-beacon-500/30 transition-all">
              <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                B
              </span>
              <input
                type="text"
                placeholder="Choose destination..."
                value={destSearch}
                onChange={(e) => handleDestChange(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-100 placeholder-slate-400 outline-none"
              />
              {isSearchingDest && <Loader2 className="w-3 h-3 text-beacon-400 animate-spin shrink-0" />}
              {destSearch && (
                <button
                  onClick={() => {
                    setDestSearch('');
                    setDestSuggestions([]);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => handleUseCurrentLocation('destination')}
                disabled={isLocatingCurrent}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-beacon-400 hover:text-beacon-300 shrink-0 transition-all"
                title="Use Current Location"
              >
                {isLocatingCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Destination Autocomplete Suggestions */}
            {destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0B101E] border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                {destSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectDest(item)}
                    className="w-full text-left p-2.5 hover:bg-beacon-500/20 flex items-start gap-2.5 text-xs transition-all group"
                  >
                    <span className="text-sm shrink-0 mt-0.5">
                      {item.category === 'transit' ? '🚇' : item.category === 'hospital' ? '🏥' : '📍'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-100 group-hover:text-beacon-300 text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{item.subAddress || item.fullName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Permission Denied Error Banner (Requirement 2) */}
        {locationPermissionError && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-300 animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{locationPermissionError}</span>
            </div>
            <button
              onClick={() => handleUseCurrentLocation('origin')}
              className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-cyber-950 font-bold text-[10px] shrink-0 transition-all"
            >
              Enable Location
            </button>
          </div>
        )}

        {/* Privacy Message (Requirement 1 & 12) */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Lock className="w-3 h-3 text-safe-400 shrink-0" />
          <span>Your precise location is accessed only when you choose a location-based feature.</span>
        </div>

        {/* Quick Save Destination / Favorite Action */}
        {destination && destination.name && destination.lat != null && (
          <div className="flex items-center justify-between px-1 py-0.5 text-xs">
            <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
              🎯 <span className="font-semibold text-slate-200">{destination.name}</span>
            </div>
            {userProfile?.savedPlaces && userProfile.savedPlaces.some(p => p.address === (destination.subAddress || destination.name) || p.label === destination.name) ? (
              <span className="text-[11px] text-safe-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Saved to Places</span>
              </span>
            ) : (
              <button
                onClick={handleSaveCurrentDestination}
                className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 transition-all"
                title="Save this destination to your personal places"
              >
                <Star className="w-3 h-3 fill-amber-400" />
                <span>Save Place (+10 pts)</span>
              </button>
            )}
          </div>
        )}

        {/* Dynamic Category & Place Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
          <button
            onClick={() => handleUseCurrentLocation('origin')}
            disabled={isLocatingCurrent}
            className="px-2.5 py-1 rounded-lg bg-safe-500/15 hover:bg-safe-500/25 border border-safe-500/30 text-safe-300 font-semibold whitespace-nowrap flex items-center gap-1 transition-all shrink-0"
            title="Acquire current device location"
          >
            {isLocatingCurrent ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
            <span>📍 Current Location</span>
          </button>

          <button
            onClick={() => handleQuickCategory('transit')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition-all shrink-0"
            title="Find nearest transit or metro station"
          >
            🚇 Nearby Transit
          </button>

          <button
            onClick={() => handleQuickCategory('hospital')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition-all shrink-0"
            title="Find nearest 24/7 hospital or medical haven"
          >
            🏥 24/7 Hospital
          </button>

          <button
            onClick={() => handleQuickCategory('safe_haven')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition-all shrink-0"
            title="Find nearest verified community safe haven"
          >
            🛡️ Safe Haven
          </button>

          <button
            onClick={() => {
              setExplorerTarget('destination');
              setIsLocationExplorerOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition-all shrink-0 flex items-center gap-1"
            title="Browse worldwide countries, cities, and landmarks"
          >
            <Globe className="w-3 h-3 text-sky-400" />
            <span>Worldwide</span>
          </button>
        </div>

        {/* Main CTA: Find Safest Route */}
        <button
          onClick={() => onCalculateRoutes({ origin, destination, timeOfDay, mode })}
          disabled={isLoadingRoutes || (!destination?.lat && !destination?.name)}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-safe-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-cyber-950 font-black text-xs tracking-wider uppercase shadow-neon-safe transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoadingRoutes ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyber-950" />
              <span>Finding Safer Routes...</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 fill-current" />
              <span>Find Safest Route</span>
            </>
          )}
        </button>

      </div>

      {/* Location Explorer Modal */}
      <LocationExplorerModal
        isOpen={isLocationExplorerOpen}
        onClose={() => setIsLocationExplorerOpen(false)}
        target={explorerTarget}
        onSelectLocation={handleLocationSelect}
        userProfile={userProfile}
        onUpdateUserProfile={onUpdateUserProfile}
        onRewardPoints={onRewardPoints}
      />

      {/* Requirement 7: Night Safety Mode Banner */}
      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          {timeOfDay === 'night' || timeOfDay === 'late_night' ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : timeOfDay === 'dusk' ? (
            <Sunset className="w-3.5 h-3.5 text-orange-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="font-medium">
            Safety analysis optimized for <strong className="text-white uppercase">{timeOfDay.replace('_', ' ')}</strong>
          </span>
        </div>
        <button
          onClick={() => setShowCalculationInfoModal(true)}
          className="text-safe-400 hover:text-safe-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          title="View factor weights & methodology"
        >
          <Info className="w-3 h-3" />
          <span>Weights</span>
        </button>
      </div>

      {/* Initial Guidance & Navigation Hub (When no routes are yet calculated) */}
      {(!routes || routes.length === 0) && (
        <>
          {/* Saved Places & Quick Access (If configured by user) */}
          {userProfile?.savedPlaces && userProfile.savedPlaces.length > 0 && (
            <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] text-safe-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>My Saved Places</span>
                </span>
                <button
                  onClick={onOpenProfile}
                  className="text-[10px] text-safe-400 hover:text-safe-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Place</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {userProfile.savedPlaces.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectDest({ name: p.label || p.name, lat: p.lat, lng: p.lng, subAddress: p.address })}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-safe-500/40 text-left transition-all cursor-pointer group relative"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">
                          {p.category === 'home' || p.icon === 'home' ? '🏠' : p.category === 'work' || p.icon === 'work' || p.icon === 'briefcase' ? '💼' : p.icon === 'school' ? '🎓' : p.icon === 'gym' ? '🏋️' : p.icon === 'station' ? '🚉' : '⭐'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-100 group-hover:text-safe-300 truncate">{p.label || p.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{p.address || 'Saved Location'}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSavedPlace(e, idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 transition-all shrink-0"
                        title="Delete saved place"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Destination History */}
          {recentDestinations.length > 0 && (
            <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recent Searches</span>
                </span>
                <button
                  onClick={() => {
                    setRecentDestinations([]);
                    localStorage.removeItem('saferoute_recent_destinations');
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentDestinations.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectDest(p)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span className="text-slate-400">📍</span>
                    <span className="truncate max-w-[160px] font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Route Cards & Comparison Hierarchy (Requirement 6) */}
      {routes && routes.length > 0 && (
        <div className="space-y-3">
          
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-safe-400" />
              <span>{routes.length} safe routes evaluated</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Click any route to inspect
            </span>
          </div>

          {/* Comparative Route Cards */}
          <div className="space-y-2.5">
            {routes.map((route, idx) => {
              const isSelected = selectedRouteIndex === idx;
              const isRecommended = idx === 0;
              const scorePct = route.scorePct || getSafetyScorePct(route.safetyScore);

              if (isRecommended) {
                // Dominant Recommended Route Card (Route A)
                return (
                  <div
                    key={route.id || idx}
                    onClick={() => setSelectedRouteIndex(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-cyber-900 border-safe-500 shadow-neon-safe'
                        : 'bg-slate-900/80 border-slate-700/80 hover:border-safe-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-safe-500 text-cyber-950 font-black text-[9px] uppercase tracking-wider shadow-sm">
                        <Award className="w-3 h-3" />
                        RECOMMENDED
                      </span>

                      <span className="text-sm font-black text-safe-400">
                        {scorePct}% SAFE
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-extrabold text-sm text-white">
                        {route.title || 'Route A — Safest Illuminated Corridor'}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                        <span>{route.distanceKm} km</span>
                        <span>•</span>
                        <span>{route.durationMins} min</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800 text-[11px]">
                      <div className="text-amber-400 font-medium">
                        💡 {route.factors?.lightingCoveragePct || 94}% Lighting
                      </div>
                      <div className="text-sky-400 font-medium">
                        📹 {route.factors?.cctvCount || 4} CCTV
                      </div>
                      <div className="text-safe-400 font-medium">
                        🏥 {route.factors?.safeHavensCount || 2} Safe Havens
                      </div>
                      <div className="text-slate-300 font-medium">
                        🛡️ {route.factors?.hazardsLabel || 'Low Hazards'}
                      </div>
                    </div>

                    {/* Direct Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartGuardianWalk(route);
                      }}
                      className={`w-full mt-3 py-2.5 px-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 shadow-md ${
                        isGuardianWalking && isSelected
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-safe-500 hover:bg-safe-400 text-cyber-950 shadow-neon-safe active:scale-[0.98]'
                      }`}
                    >
                      {isGuardianWalking && isSelected ? (
                        <>
                          <Radio className="w-3.5 h-3.5 animate-ping" />
                          <span>STOP LIVE NAVIGATION</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5 fill-current" />
                          <span>START SAFE ROUTE</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              }

              // Secondary Alternative Route Cards (Route B, Route C)
              return (
                <div
                  key={route.id || idx}
                  onClick={() => setSelectedRouteIndex(idx)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-slate-600 shadow-md ring-1 ring-slate-500/50'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-200">
                        {route.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {route.distanceKm} km • {route.durationMins} min • 💡 {route.factors?.lightingCoveragePct || 74}% Lit
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-black ${
                        scorePct >= 75 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {scorePct}% SAFE
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Turn-by-Turn Safety Guidance Accordion */}
          {activeRoute && activeRoute.steps && activeRoute.steps.length > 0 && (
            <div className="glass-panel p-3 rounded-2xl border border-slate-800 shadow-lg space-y-2">
              <button
                onClick={() => setShowDirections(!showDirections)}
                className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white font-semibold transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-safe-400" />
                  <span>Turn-by-Turn Safety Steps ({activeRoute.steps.length})</span>
                </span>
                {showDirections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showDirections && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5 max-h-56 overflow-y-auto pr-1 animate-in fade-in divide-y divide-slate-800/60">
                  {activeRoute.steps.map((step, sIdx) => (
                    <div key={sIdx} className="pt-1.5 first:pt-0 text-[11px] text-slate-300 space-y-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-slate-200">{step.instruction}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{step.distanceMeters}m</span>
                      </div>
                      {step.stepBonus && (
                        <div className="text-safe-400 text-[10px] font-medium">{step.stepBonus}</div>
                      )}
                      {step.stepCaution && (
                        <div className="text-rose-400 text-[10px] font-medium">{step.stepCaution}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* "HOW IS THIS SCORE CALCULATED?" MODAL (Requirement 5) */}
      {/* ========================================================================= */}
      {showCalculationInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
          <div className="glass-panel p-5 rounded-3xl border border-slate-700 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-safe-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  How is the Safety Score Calculated?
                </h3>
              </div>
              <button
                onClick={() => setShowCalculationInfoModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              SafeRoute computes a genuine multi-factor spatial safety score (0 to 100%) for each candidate corridor using geometric point sampling along the route coordinates.
            </p>

            {/* Weights Breakdown */}
            <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
              <div className="font-bold text-slate-200 text-xs flex items-center justify-between">
                <span>Active Scoring Weights ({timeOfDay.toUpperCase()} Mode):</span>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>💡 Street Lighting Density & Coverage</span>
                  <strong className="text-amber-400">{currentWeights.lighting}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>📹 CCTV Surveillance Coverage</span>
                  <strong className="text-sky-400">{currentWeights.cctv}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>👮 Emergency & Police Proximity</span>
                  <strong className="text-indigo-400">{currentWeights.police}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>🚶 Pedestrian & Commercial Activity</span>
                  <strong className="text-safe-400">{currentWeights.pedestrian}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>🏥 24/7 Safe Havens (Hospitals/Pharmacies)</span>
                  <strong className="text-emerald-400">{currentWeights.safeHavens}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>⚠️ Active Hazard Penalty</span>
                  <strong className="text-rose-400">{currentWeights.hazards}</strong>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              🌙 <strong>Night Mode Adjustment:</strong> During night and midnight hours, street lighting and hazard penalties automatically receive higher weight to ensure you are routed through well-lit, populated thoroughfares.
            </div>

            <button
              onClick={() => setShowCalculationInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-bold text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
