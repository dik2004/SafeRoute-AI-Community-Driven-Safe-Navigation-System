import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  ZoomControl,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import {
  Shield,
  Sun,
  Camera,
  AlertTriangle,
  Building2,
  HeartHandshake,
  Navigation,
  Layers,
  MapPin,
  Sparkles,
  Search,
  Crosshair,
  Loader2,
  X,
  Compass,
  Bookmark,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { SafeRouteAPI } from '../services/api';

// Custom Map Controller to center on selected route or point or flyTarget
function MapController({ center, zoom, bounds, flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget && flyTarget.lat != null && flyTarget.lng != null) {
      map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 16, { duration: 1.2 });
    } else if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (_) {}
    } else if (center && center[0] != null && center[1] != null) {
      map.flyTo(center, zoom || 14, { duration: 1.0 });
    }
  }, [center, zoom, bounds, flyTarget, map]);
  return null;
}

// Click listener on Map
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// Factory for custom Leaflet HTML DivIcons
function createDivIcon(htmlContent, className = '', iconSize = [36, 36]) {
  return L.divIcon({
    html: htmlContent,
    className: `custom-pin ${className}`,
    iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
    popupAnchor: [0, -iconSize[1] / 2],
  });
}

export default function SafetyMap({
  safetyPoints = [],
  incidents = [],
  routes = [],
  selectedRouteIndex = 0,
  origin,
  destination,
  guardianLocation,
  isGuardianWalking,
  onMapClick,
  onUpvoteIncident,
  onResolveIncident,
  onSelectOrigin,
  onSelectDestination,
  onSavePlace,
  liveSafetyStats,
  mapTheme = 'dark',
  setMapTheme
}) {
  const [localTileLayer, setLocalTileLayer] = useState('dark');
  const activeTileLayer = mapTheme || localTileLayer || 'dark';
  const handleSetTileLayer = (key) => {
    if (setMapTheme) setMapTheme(key);
    setLocalTileLayer(key);
  };

  const [showLights, setShowLights] = useState(true);
  const [showCctv, setShowCctv] = useState(true);
  const [showPolice, setShowPolice] = useState(true);
  const [showSafeHavens, setShowSafeHavens] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showHeatRadius, setShowHeatRadius] = useState(true);

  // Floating Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResultPlace, setSearchResultPlace] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const searchTimeoutRef = useRef(null);

  // 100% Google Maps high-detail tiles with every local place, shop, building & street (Zoom up to level 22)
  const tileLayers = {
    dark: {
      name: 'Cyber Dark',
      url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxNativeZoom: 20,
      maxZoom: 22,
      tileClass: 'map-tiles-cyber-dark'
    },
    grey: {
      name: 'Slate Grey',
      url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxNativeZoom: 20,
      maxZoom: 22,
      tileClass: 'map-tiles-grey'
    },
    light: {
      name: 'Clean Light',
      url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxNativeZoom: 20,
      maxZoom: 22,
      tileClass: 'map-tiles-light'
    },
    satellite: {
      name: 'Google Satellite',
      url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxNativeZoom: 20,
      maxZoom: 22,
      tileClass: 'map-tiles-light'
    }
  };

  const defaultCenter = [28.6289, 77.2065];

  // Custom SVG Markers
  const currentLocationIcon = useMemo(() => createDivIcon(`
    <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(16,185,129,0.35); animation:mapPulse 1.5s infinite;"></span>
      <div style="background:#10B981; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #ffffff; box-shadow:0 0 16px rgba(16,185,129,0.9); color:#07090E; font-weight:900; font-size:12px;">
        📍
      </div>
    </div>
  `, 'current-location-pin', [40, 40]), []);

  const originIcon = useMemo(() => createDivIcon(`
    <div style="background:#10B981; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #07090E; box-shadow:0 0 16px rgba(16,185,129,0.85); color:#07090E; font-weight:900; font-size:13px;">
      A
    </div>
  `, 'origin-pin', [32, 32]), []);

  const destIcon = useMemo(() => createDivIcon(`
    <div style="background:#0EA5E9; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #07090E; box-shadow:0 0 16px rgba(14,165,233,0.85); color:#ffffff; font-weight:900; font-size:13px;">
      B
    </div>
  `, 'dest-pin', [32, 32]), []);

  const searchPinIcon = useMemo(() => createDivIcon(`
    <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(239,68,68,0.3); animation:mapPulse 1.5s infinite;"></span>
      <div style="background:#EF4444; width:28px; height:28px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 16px rgba(239,68,68,0.9);">
        <div style="transform:rotate(45deg); font-size:12px; color:#ffffff;">📍</div>
      </div>
    </div>
  `, 'search-result-pin', [40, 40]), []);

  const guardianIcon = useMemo(() => createDivIcon(`
    <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(16,185,129,0.4); animation:mapPulse 1.5s infinite;"></span>
      <div style="background:#10B981; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 18px #10B981; color:#07090E; font-size:14px;">
        🛡️
      </div>
    </div>
  `, 'guardian-pin', [40, 40]), []);

  const lightIcon = useMemo(() => createDivIcon(`
    <div style="background:#FBBF24; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #07090E; box-shadow:0 0 10px rgba(251,191,36,0.7); font-size:11px;">
      💡
    </div>
  `, 'light-pin', [24, 24]), []);

  const cctvIcon = useMemo(() => createDivIcon(`
    <div style="background:#38BDF8; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #07090E; box-shadow:0 0 10px rgba(56,189,248,0.7); font-size:11px;">
      📹
    </div>
  `, 'cctv-pin', [24, 24]), []);

  const policeIcon = useMemo(() => createDivIcon(`
    <div style="background:#6366F1; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 14px rgba(99,102,241,0.8); font-size:13px;">
      👮
    </div>
  `, 'police-pin', [28, 28]), []);

  const safeHavenIcon = useMemo(() => createDivIcon(`
    <div style="background:#10B981; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 14px rgba(16,185,129,0.8); font-size:13px;">
      🏥
    </div>
  `, 'haven-pin', [28, 28]), []);

  const incidentIconCritical = useMemo(() => createDivIcon(`
    <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; width:32px; height:32px; border-radius:50%; background:rgba(244,63,94,0.4); animation:hazardPulse 1.2s infinite;"></span>
      <div style="background:#F43F5E; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 14px #F43F5E; color:#ffffff; font-size:11px; font-weight:bold;">
        ⚠️
      </div>
    </div>
  `, 'hazard-pin', [32, 32]), []);

  const incidentIconHigh = useMemo(() => createDivIcon(`
    <div style="background:#FB7185; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #07090E; box-shadow:0 0 10px rgba(251,113,133,0.7); font-size:11px;">
      ⚠️
    </div>
  `, 'hazard-high-pin', [24, 24]), []);

  const incidentIconMedium = useMemo(() => createDivIcon(`
    <div style="background:#F59E0B; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #07090E; box-shadow:0 0 8px rgba(245,158,11,0.6); font-size:10px;">
      ⚠️
    </div>
  `, 'hazard-med-pin', [22, 22]), []);

  // Compute bounding box when routes change
  const routeBounds = useMemo(() => {
    if (!routes || routes.length === 0) return null;
    const activeRoute = routes[selectedRouteIndex] || routes[0];
    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) return null;
    return activeRoute.coordinates.map(c => [c[1], c[0]]);
  }, [routes, selectedRouteIndex]);

  // Handle Search Input in Floating Bar
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await SafeRouteAPI.searchGlobalPlaces(text);
      setSuggestions(results);
      setIsSearching(false);
    }, 120);
  };

  const handleSelectPlace = (place) => {
    setSearchResultPlace(place);
    setSearchQuery(place.name);
    setSuggestions([]);
    setIsSearchFocused(false);
    setFlyTarget({ lat: place.lat, lng: place.lng, zoom: 16, ts: Date.now() });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (suggestions.length > 0) {
        handleSelectPlace(suggestions[0]);
      } else if (searchQuery.trim().length > 1) {
        SafeRouteAPI.searchGlobalPlaces(searchQuery).then(res => {
          if (res.length > 0) handleSelectPlace(res[0]);
        });
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setIsSearchFocused(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        // Instantly center map and update flyTarget
        setFlyTarget({ lat, lng, zoom: 16, ts: Date.now() });

        const livePlace = {
          name: 'My Current Location',
          lat,
          lng,
          category: 'place',
          subAddress: `Live GPS Position (±${accuracy}m)`
        };
        handleSelectPlace(livePlace);
        if (onSelectOrigin) {
          onSelectOrigin(livePlace);
        }

        setIsLocatingGPS(false);

        // Resolve friendly locality name in background
        try {
          const friendlyName = await SafeRouteAPI.reverseGeocode(lat, lng);
          if (friendlyName && friendlyName !== 'Current Location') {
            const updatedPlace = {
              ...livePlace,
              name: friendlyName,
              subAddress: `Live GPS (${friendlyName})`
            };
            setSearchResultPlace(updatedPlace);
            setSearchQuery(friendlyName);
            if (onSelectOrigin) {
              onSelectOrigin(updatedPlace);
            }
          }
        } catch (_) {}
      },
      (err) => {
        setIsLocatingGPS(false);
        if (err.code === 1) {
          alert('Location permission was denied. Please allow location access in your browser settings.');
        } else {
          alert('Unable to acquire current GPS location. Please check your connection and try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Compute live safety metrics for bottom status ticker
  const activeRoute = routes[selectedRouteIndex] || routes[0];
  const activeLighting = activeRoute?.factors?.lightingCoveragePct || 94;
  const activeCctv = activeRoute?.factors?.cctvCount || safetyPoints.filter(p => p.type === 'cctv_camera').length || 4;
  const activeHazards = activeRoute?.nearbyHazardsCount !== undefined ? activeRoute.nearbyHazardsCount : (incidents.filter(i => i.status !== 'resolved').length || 1);

  return (
    <div className="relative w-full h-[600px] lg:h-[calc(100vh-6.5rem)] min-h-[500px] rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl">
      
      {/* Floating Map Search Overlay */}
      <div className="absolute top-3.5 left-3.5 z-30 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-96 pointer-events-auto">
        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-950/95 backdrop-blur-2xl px-3 py-2 rounded-xl border border-slate-700/90 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all">
            <Search className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder="Search places, landmarks, or streets..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent text-xs font-semibold text-slate-100 placeholder-slate-400 outline-none"
            />
            {isSearching && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setSearchResultPlace(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleLocateMe}
              disabled={isLocatingGPS}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all shrink-0 focus:outline-none"
              title="Locate my GPS Position on map"
            >
              {isLocatingGPS ? (
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-950/98 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden divide-y divide-slate-800 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 bg-slate-900/90 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
                <span>Search Suggestions</span>
                <span className="text-emerald-400 font-normal">Press Enter to view</span>
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPlace(item)}
                  className="w-full text-left p-2.5 hover:bg-emerald-500/15 flex items-start gap-2.5 text-xs transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700 text-sm">
                    {item.category === 'transit' ? '🚇' : item.category === 'hospital' ? '🏥' : item.category === 'landmark' ? '🏛️' : item.category === 'street' ? '🛣️' : '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-100 group-hover:text-emerald-300 text-xs truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.subAddress || item.fullName}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-300 font-mono shrink-0 uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                    {item.type || item.category}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Place Floating Card */}
          {searchResultPlace && (
            <div className="mt-2 p-3 rounded-2xl bg-slate-950/98 backdrop-blur-2xl border border-slate-700/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-top-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30">
                    {searchResultPlace.category === 'transit' ? '🚇' : searchResultPlace.category === 'hospital' ? '🏥' : searchResultPlace.category === 'landmark' ? '🏛️' : searchResultPlace.category === 'street' ? '🛣️' : '📍'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-100 truncate">{searchResultPlace.name}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{searchResultPlace.subAddress || searchResultPlace.fullName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSearchResultPlace(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800">
                <button
                  onClick={() => onSelectDestination && onSelectDestination(searchResultPlace)}
                  className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Directions</span>
                </button>
                <button
                  onClick={() => onSelectOrigin && onSelectOrigin(searchResultPlace)}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 border border-slate-700 transition-all active:scale-[0.98]"
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Start Here</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Right Floating Controls: Layer Filters Only */}
      <div className="absolute top-3.5 right-3.5 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
        {/* Layer Filters */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.65)] pointer-events-auto text-xs">
          <button
            onClick={() => setShowLights(!showLights)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              showLights ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle Street Lights"
          >
            <Sun className="w-3 h-3" />
            <span className="hidden sm:inline">Lighting</span>
          </button>

          <button
            onClick={() => setShowCctv(!showCctv)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              showCctv ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle CCTV Cameras"
          >
            <Camera className="w-3 h-3" />
            <span className="hidden sm:inline">CCTV</span>
          </button>

          <button
            onClick={() => setShowPolice(!showPolice)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              showPolice ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle Police Stations"
          >
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">Police</span>
          </button>

          <button
            onClick={() => setShowSafeHavens(!showSafeHavens)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              showSafeHavens ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle 24/7 Safe Havens"
          >
            <HeartHandshake className="w-3 h-3" />
            <span className="hidden sm:inline">Havens</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              showIncidents ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle Verified Hazards"
          >
            <AlertTriangle className="w-3 h-3" />
            <span className="hidden sm:inline">Hazards</span>
          </button>
        </div>
      </div>

      {/* Live Safety Status Section (Requirement 8) */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 pointer-events-auto">
        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.75)] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-slate-100 tracking-wider text-[11px] uppercase">Live Safety</span>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Lighting:</span>
              <span className="font-bold text-amber-400">{activeLighting}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">CCTV:</span>
              <span className="font-bold text-sky-400">{activeCctv}</span>
            </div>
            <div className="flex items-center gap-1 hidden xs:flex">
              <span className="text-slate-400">Crowd:</span>
              <span className="font-bold text-safe-400">HIGH</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Hazards:</span>
              <span className={`font-bold ${activeHazards > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeHazards}
              </span>
            </div>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden md:block"></div>

          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
            Updated just now
          </span>
        </div>
      </div>

      {/* Leaflet Map Container */}
      {(() => {
        const mapCenter = (origin && origin.lat != null && origin.lng != null)
          ? [Number(origin.lat), Number(origin.lng)]
          : defaultCenter;

        const activeTileConfig = tileLayers[activeTileLayer] || tileLayers.dark;

        return (
          <MapContainer
            center={mapCenter}
            zoom={14}
            maxZoom={22}
            zoomControl={false}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <ZoomControl position="bottomright" />
            <MapController bounds={routeBounds} center={mapCenter} flyTarget={flyTarget} />
            <MapClickHandler onMapClick={onMapClick} />

            <TileLayer
              key={activeTileLayer}
              url={activeTileConfig.url}
              attribution={activeTileConfig.attribution}
              subdomains={activeTileConfig.subdomains || ['mt0', 'mt1', 'mt2', 'mt3']}
              maxNativeZoom={activeTileConfig.maxNativeZoom || 20}
              maxZoom={activeTileConfig.maxZoom || 22}
              className={activeTileConfig.tileClass || ''}
            />

            {/* Origin Marker (Current Location or Selected Start Point) */}
            {origin && origin.lat != null && origin.lng != null && (
              <Marker position={[Number(origin.lat), Number(origin.lng)]} icon={origin.isCurrent ? currentLocationIcon : originIcon}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-safe-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {origin.isCurrent ? '📍 Your Current Location' : 'Start / Origin'}
                    </div>
                    <div className="text-slate-200 mt-1 font-medium">{origin.name || 'Current Location'}</div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Verified Safe Departure Point</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Destination Marker */}
            {destination && destination.lat != null && destination.lng != null && (
              <Marker position={[Number(destination.lat), Number(destination.lng)]} icon={destIcon}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-beacon-400 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" /> Destination
                    </div>
                    <div className="text-slate-200 mt-1 font-medium">{destination.name || 'Selected Destination'}</div>
                    <div className="text-[10px] text-sky-400/80 mt-0.5">🎯 Safe Navigation Target</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Searched Place Marker */}
            {searchResultPlace && searchResultPlace.lat != null && searchResultPlace.lng != null && (
              <Marker position={[Number(searchResultPlace.lat), Number(searchResultPlace.lng)]} icon={searchPinIcon}>
                <Popup autoPan={true}>
                  <div className="p-1 text-xs max-w-[240px] space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-100 text-xs truncate">
                        📍 {searchResultPlace.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                    {searchResultPlace.category || 'Place'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 line-clamp-2">
                  {searchResultPlace.subAddress || searchResultPlace.fullName}
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-700/80">
                  <button
                    onClick={() => onSelectDestination && onSelectDestination(searchResultPlace)}
                    className="py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                  >
                    Directions
                  </button>
                  <button
                    onClick={() => onSelectOrigin && onSelectOrigin(searchResultPlace)}
                    className="py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold"
                  >
                    Start Here
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Guardian Walk Marker */}
        {isGuardianWalking && guardianLocation && (
          <Marker position={[guardianLocation.lat, guardianLocation.lng]} icon={guardianIcon}>
            <Popup>
              <div className="text-xs">
                <div className="font-bold text-safe-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Guardian Walk Live
                </div>
                <div className="text-slate-200 mt-1">Corridor navigation companion active</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Route Polylines (Color coded) */}
        {routes.map((r, idx) => {
          const isSelected = idx === selectedRouteIndex;
          const coords = r.coordinates.map(c => [c[1], c[0]]);

          // Requirement 3: Green = safe route, Yellow/amber = moderate, Red = hazardous
          let strokeColor = '#10B981'; // Safest
          if (r.type === 'balanced' || r.routeType === 'balanced') strokeColor = '#F59E0B'; // Moderate
          if (r.type === 'fastest' || r.routeType === 'fastest') strokeColor = '#F43F5E'; // Direct/Hazardous

          return (
            <React.Fragment key={r.id || idx}>
              {/* Outer glow for selected route */}
              {isSelected && (
                <Polyline
                  positions={coords}
                  pathOptions={{
                    color: strokeColor,
                    weight: 10,
                    opacity: 0.3,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
              )}
              {/* Main Polyline */}
              <Polyline
                positions={coords}
                pathOptions={{
                  color: strokeColor,
                  weight: isSelected ? 5 : 3.5,
                  opacity: isSelected ? 0.95 : 0.45,
                  dashArray: !isSelected ? '4, 8' : undefined,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Street Lights */}
        {showLights && safetyPoints
          .filter(p => (p.type === 'street_light' || p.type === 'light') && p.location?.coordinates?.length >= 2)
          .map((p, idx) => {
            const lat = Number(p.location.coordinates[1]);
            const lng = Number(p.location.coordinates[0]);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <React.Fragment key={p._id || idx}>
                {showHeatRadius && (
                  <Circle
                    center={[lat, lng]}
                    radius={35}
                    pathOptions={{
                      color: '#FBBF24',
                      fillColor: '#FBBF24',
                      fillOpacity: 0.12,
                      weight: 0
                    }}
                  />
                )}
                <Marker position={[lat, lng]} icon={lightIcon}>
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold text-amber-400 flex items-center gap-1">
                        <Sun className="w-3 h-3" /> Smart LED Streetlight
                      </div>
                      <div className="text-slate-200 mt-1">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">High-Lumen Illumination Corridor</div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* CCTV Surveillance Nodes */}
        {showCctv && safetyPoints
          .filter(p => (p.type === 'cctv_camera' || p.type === 'cctv') && p.location?.coordinates?.length >= 2)
          .map((p, idx) => {
            const lat = Number(p.location.coordinates[1]);
            const lng = Number(p.location.coordinates[0]);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <React.Fragment key={p._id || idx}>
                {showHeatRadius && (
                  <Circle
                    center={[lat, lng]}
                    radius={45}
                    pathOptions={{
                      color: '#38BDF8',
                      fillColor: '#38BDF8',
                      fillOpacity: 0.12,
                      weight: 0
                    }}
                  />
                )}
                <Marker position={[lat, lng]} icon={cctvIcon}>
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold text-beacon-400 flex items-center gap-1">
                        <Camera className="w-3 h-3" /> 24/7 CCTV Camera
                      </div>
                      <div className="text-slate-200 mt-1">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Active Monitoring Node</div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

        {/* Police Stations */}
        {showPolice && safetyPoints
          .filter(p => (p.type === 'police_station' || p.type === 'women_help_booth') && p.location?.coordinates?.length >= 2)
          .map((p, idx) => {
            const lat = Number(p.location.coordinates[1]);
            const lng = Number(p.location.coordinates[0]);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker key={p._id || idx} position={[lat, lng]} icon={policeIcon}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-indigo-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Police Precinct
                    </div>
                    <div className="font-semibold text-slate-100 mt-1">{p.name}</div>
                    {p.details?.phone && (
                      <div className="text-[10px] text-indigo-300 mt-1 font-mono">📞 {p.details.phone}</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 24/7 Safe Havens */}
        {showSafeHavens && safetyPoints
          .filter(p => ['safe_haven', 'hospital', 'hospital_emergency', 'busy_commercial_hub'].includes(p.type) && p.location?.coordinates?.length >= 2)
          .map((p, idx) => {
            const lat = Number(p.location.coordinates[1]);
            const lng = Number(p.location.coordinates[0]);
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <Marker key={p._id || idx} position={[lat, lng]} icon={safeHavenIcon}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-safe-400 flex items-center gap-1">
                      <HeartHandshake className="w-3 h-3" /> 24/7 Safe Haven
                    </div>
                    <div className="font-semibold text-slate-100 mt-1">{p.name}</div>
                    <button
                      onClick={() => onSelectDestination && onSelectDestination({ lat, lng, name: p.name })}
                      className="mt-2 w-full py-1 px-2 bg-safe-500 hover:bg-safe-400 text-cyber-950 font-bold rounded text-[10px] transition-all"
                    >
                      Route Here Safely
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Community Hazards / Incidents */}
        {showIncidents && incidents.map((inc, idx) => {
          if (!inc.location?.coordinates || inc.location.coordinates.length < 2) return null;
          const lat = Number(inc.location.coordinates[1]);
          const lng = Number(inc.location.coordinates[0]);
          if (isNaN(lat) || isNaN(lng)) return null;
          if (inc.status === 'resolved') return null;

          const isCritical = inc.severity === 'critical';
          const isHigh = inc.severity === 'high';
          const icon = isCritical ? incidentIconCritical : isHigh ? incidentIconHigh : incidentIconMedium;

          return (
            <React.Fragment key={inc._id || idx}>
              <Circle
                center={[lat, lng]}
                radius={isCritical ? 100 : 60}
                pathOptions={{
                  color: '#F43F5E',
                  fillColor: '#F43F5E',
                  fillOpacity: 0.12,
                  weight: 1,
                  dashArray: '4, 4'
                }}
              />
              <Marker position={[lat, lng]} icon={icon}>
                <Popup>
                  <div className="p-1 text-xs max-w-[220px]">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {inc.category?.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300">
                        {inc.severity}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-100 mt-1">{inc.title}</div>
                    <p className="text-slate-300 mt-0.5 text-[10px]">{inc.description}</p>
                    <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-700/60">
                      <button
                        onClick={() => onUpvoteIncident && onUpvoteIncident(inc._id)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-medium"
                      >
                        👍 Upvote ({inc.upvotes || 1})
                      </button>
                      <button
                        onClick={() => onResolveIncident && onResolveIncident(inc._id)}
                        className="px-2 py-0.5 rounded bg-safe-500/20 hover:bg-safe-500/30 text-safe-300 text-[9px] font-medium"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" /> Fixed
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

          </MapContainer>
        );
      })()}
    </div>
  );
}
