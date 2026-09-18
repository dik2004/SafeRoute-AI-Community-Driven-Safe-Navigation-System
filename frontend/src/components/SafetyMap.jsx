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

// Custom Map Controller to center on selected route, step, or point without overriding user manual zoom
function MapController({ center, zoom = 14, bounds, flyTarget, activeStepTarget, overviewTrigger }) {
  const map = useMap();
  const prevBoundsRef = useRef(null);
  const prevFlyRef = useRef(null);
  const prevCenterRef = useRef(null);
  const prevStepRef = useRef(null);
  const prevOverviewRef = useRef(null);

  // 1. Fit bounds when Overview button is clicked
  useEffect(() => {
    if (overviewTrigger && bounds && bounds.length > 0) {
      if (prevOverviewRef.current !== overviewTrigger) {
        prevOverviewRef.current = overviewTrigger;
        try {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } catch (_) {}
      }
    }
  }, [overviewTrigger, bounds, map]);

  // 2. Fly to active step target (Aage / Piche street inspection)
  useEffect(() => {
    if (activeStepTarget && activeStepTarget.lat != null && activeStepTarget.lng != null) {
      const stepKey = `${Number(activeStepTarget.lat).toFixed(5)},${Number(activeStepTarget.lng).toFixed(5)},${activeStepTarget.ts || ''},${activeStepTarget.zoom || ''}`;
      if (prevStepRef.current !== stepKey) {
        prevStepRef.current = stepKey;
        map.flyTo([activeStepTarget.lat, activeStepTarget.lng], activeStepTarget.zoom || 18.5, {
          duration: 1.0,
          easeLinearity: 0.25
        });
      }
    }
  }, [activeStepTarget, map]);

  // 3. Fly to specific target (when user clicks GPS, searches a place, etc.)
  useEffect(() => {
    if (flyTarget && flyTarget.lat != null && flyTarget.lng != null) {
      const flyKey = `${Number(flyTarget.lat).toFixed(4)},${Number(flyTarget.lng).toFixed(4)},${flyTarget.ts || ''},${flyTarget.zoom || ''}`;
      if (prevFlyRef.current !== flyKey) {
        prevFlyRef.current = flyKey;
        map.flyTo([flyTarget.lat, flyTarget.lng], flyTarget.zoom || 16, { duration: 1.2 });
      }
    }
  }, [flyTarget, map]);

  // 4. Fit bounds ONLY when route bounds actually change (new route calculated)
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const boundsKey = JSON.stringify(bounds);
      if (prevBoundsRef.current !== boundsKey) {
        prevBoundsRef.current = boundsKey;
        try {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        } catch (_) {}
      }
    }
  }, [bounds, map]);

  // 5. Initial center ONLY when origin coordinates actually change and no active route
  useEffect(() => {
    if (center && center[0] != null && center[1] != null && (!bounds || bounds.length === 0)) {
      const centerKey = `${Number(center[0]).toFixed(4)},${Number(center[1]).toFixed(4)}`;
      if (prevCenterRef.current !== centerKey) {
        prevCenterRef.current = centerKey;
        map.flyTo(center, zoom || 15, { duration: 1.0 });
      }
    }
  }, [center, zoom, bounds, map]);

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
  selectedStepIndex = 0,
  onSelectStep,
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
  setMapTheme,
  flyTarget: externalFlyTarget
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

  const activeFlyTarget = externalFlyTarget || flyTarget;

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

  // Active Route & Steps
  const activeRoute = routes[selectedRouteIndex] || routes[0];
  const rawSteps = activeRoute?.steps || [];
  const routeCoords = activeRoute?.coordinates || [];

  // Ensure enriched steps with coordinates for every single street segment
  const enrichedSteps = useMemo(() => {
    if (!activeRoute) return [];
    if (rawSteps && rawSteps.length > 0) {
      return rawSteps.map((step, sIdx) => {
        let lat = step.lat;
        let lng = step.lng;
        if (lat == null || lng == null) {
          if (routeCoords.length > 0) {
            const fraction = rawSteps.length > 1 ? sIdx / (rawSteps.length - 1) : 0;
            const coordIdx = Math.min(routeCoords.length - 1, Math.floor(fraction * (routeCoords.length - 1)));
            lng = Number(routeCoords[coordIdx][0]);
            lat = Number(routeCoords[coordIdx][1]);
          }
        }
        return {
          ...step,
          lat: Number(lat),
          lng: Number(lng),
          index: sIdx
        };
      });
    }
    // Synthesize intermediate street checkpoints if no sub-steps returned
    if (routeCoords.length > 0) {
      const pointsCount = Math.min(6, Math.max(3, Math.floor(routeCoords.length / 5)));
      const synthetic = [];
      for (let i = 0; i < pointsCount; i++) {
        const fraction = i / (pointsCount - 1);
        const coordIdx = Math.min(routeCoords.length - 1, Math.floor(fraction * (routeCoords.length - 1)));
        const pt = routeCoords[coordIdx];
        synthetic.push({
          instruction: i === 0
            ? `Depart from ${origin?.name || 'Start Point'}`
            : i === pointsCount - 1
            ? `Arrive safely at ${destination?.name || 'Destination'}`
            : `Follow safe illuminated corridor (Segment ${i + 1})`,
          distanceMeters: Math.round(((activeRoute.distanceKm || 2) * 1000) / pointsCount),
          lat: Number(pt[1]),
          lng: Number(pt[0]),
          index: i,
          stepBonus: i % 2 === 0 ? '💡 High-lumen LED lighting zone' : '📹 CCTV monitored area'
        });
      }
      return synthetic;
    }
    return [];
  }, [activeRoute, rawSteps, routeCoords, origin?.name, destination?.name]);

  // Step Navigation State
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [zoomMode, setZoomMode] = useState(18.5); // 18.5 (Street View) or 15.5 (Corridor)
  const [stepTarget, setStepTarget] = useState(null);
  const [overviewTrigger, setOverviewTrigger] = useState(null);

  const activeStepIndexValue = selectedStepIndex !== undefined ? selectedStepIndex : currentStepIdx;

  const handleSelectStep = (idx, customZoom = null) => {
    if (idx < 0 || idx >= enrichedSteps.length) return;
    const targetStep = enrichedSteps[idx];
    if (!targetStep) return;

    if (onSelectStep) onSelectStep(idx);
    setCurrentStepIdx(idx);

    const zoomToUse = customZoom || zoomMode || 18.5;
    setStepTarget({
      lat: targetStep.lat,
      lng: targetStep.lng,
      zoom: zoomToUse,
      ts: Date.now()
    });
  };

  const handleNextStep = () => {
    if (activeStepIndexValue < enrichedSteps.length - 1) {
      handleSelectStep(activeStepIndexValue + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndexValue > 0) {
      handleSelectStep(activeStepIndexValue - 1);
    }
  };

  const handleOverviewClick = () => {
    setOverviewTrigger(Date.now());
  };

  const toggleZoomMode = () => {
    const nextZoom = zoomMode >= 18 ? 15.5 : 18.5;
    setZoomMode(nextZoom);
    if (enrichedSteps.length > 0) {
      handleSelectStep(activeStepIndexValue, nextZoom);
    }
  };

  // Keyboard Arrow Navigation (Left = Piche, Right = Aage, O = Overview)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (enrichedSteps.length === 0) return;

      if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        handleOverviewClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStepIndexValue, enrichedSteps.length]);

  // Step Waypoint DivIcons
  const activeStepIcon = useMemo(() => createDivIcon(`
    <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; width:44px; height:44px; border-radius:50%; background:rgba(16,185,129,0.45); animation:mapPulse 1.2s infinite;"></span>
      <div style="background:#10B981; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #ffffff; box-shadow:0 0 20px rgba(16,185,129,1); color:#07090E; font-weight:900; font-size:14px;">
        📍
      </div>
    </div>
  `, 'active-step-beacon', [44, 44]), []);

  const createStepWaypointIcon = (stepNum, isCurrent) => {
    return createDivIcon(`
      <div style="background:${isCurrent ? '#10B981' : '#0F172A'}; color:${isCurrent ? '#07090E' : '#94A3B8'}; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid ${isCurrent ? '#ffffff' : '#334155'}; font-weight:800; font-size:10px; box-shadow:0 4px 12px rgba(0,0,0,0.6);">
        ${stepNum}
      </div>
    `, 'step-waypoint-pin', [24, 24]);
  };

  // Compute bounding box when routes change
  const routeBounds = useMemo(() => {
    if (!routes || routes.length === 0) return null;
    const currentActiveRoute = routes[selectedRouteIndex] || routes[0];
    if (!currentActiveRoute || !currentActiveRoute.coordinates || currentActiveRoute.coordinates.length === 0) return null;
    return currentActiveRoute.coordinates.map(c => [c[1], c[0]]);
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

  const handleLocateMe = async () => {
    setIsLocatingGPS(true);

    try {
      const pos = await SafeRouteAPI.getCurrentLivePosition({ timeout: 6000 });
      const lat = pos.lat;
      const lng = pos.lng;
      const accuracy = pos.accuracy;

      // Instantly center map and update flyTarget
      setFlyTarget({ lat, lng, zoom: 16, ts: Date.now() });

      const livePlace = {
        name: pos.city ? `Current Location (${pos.city})` : 'My Current Location',
        lat,
        lng,
        category: 'place',
        subAddress: `Live Position (±${accuracy}m)`
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
    } catch (err) {
      setIsLocatingGPS(false);
      alert('Unable to acquire live location. Please allow browser location access.');
    }
  };

  // Compute live safety metrics for bottom status ticker
  const activeLighting = activeRoute?.factors?.lightingCoveragePct || 94;
  const activeCctv = activeRoute?.factors?.cctvCount || safetyPoints.filter(p => p.type === 'cctv_camera').length || 4;
  const activeHazards = activeRoute?.nearbyHazardsCount !== undefined ? activeRoute.nearbyHazardsCount : (incidents.filter(i => i.status !== 'resolved').length || 1);

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[calc(100vh-6.5rem)] min-h-[420px] rounded-2xl overflow-hidden glass-panel border border-slate-800 shadow-2xl max-w-full">
      
      {/* Floating Map Search Overlay (Mobile-Optimized) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3.5 sm:left-3.5 sm:right-auto z-30 max-w-sm sm:max-w-md w-auto sm:w-96 pointer-events-auto">
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

      {/* Top Floating Controls: Layer Filters (Overflow-Protected) */}
      <div className="absolute top-14 sm:top-3.5 right-2.5 sm:right-3.5 z-20 flex flex-col items-end gap-1.5 pointer-events-none max-w-[calc(100vw-1.5rem)]">
        {/* Layer Filters Bar */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.65)] pointer-events-auto text-xs overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setShowLights(!showLights)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all shrink-0 ${
              showLights ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle Street Lights"
          >
            <Sun className="w-3 h-3" />
            <span className="hidden sm:inline">Lighting</span>
          </button>

          <button
            onClick={() => setShowCctv(!showCctv)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all shrink-0 ${
              showCctv ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle CCTV Cameras"
          >
            <Camera className="w-3 h-3" />
            <span className="hidden sm:inline">CCTV</span>
          </button>

          <button
            onClick={() => setShowPolice(!showPolice)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all shrink-0 ${
              showPolice ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle Police Stations"
          >
            <Shield className="w-3 h-3" />
            <span className="hidden sm:inline">Police</span>
          </button>

          <button
            onClick={() => setShowSafeHavens(!showSafeHavens)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all shrink-0 ${
              showSafeHavens ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle 24/7 Safe Havens"
          >
            <HeartHandshake className="w-3 h-3" />
            <span className="hidden sm:inline">Havens</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all shrink-0 ${
              showIncidents ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title="Toggle Verified Hazards"
          >
            <AlertTriangle className="w-3 h-3" />
            <span className="hidden sm:inline">Hazards</span>
          </button>
        </div>
      </div>

      {/* Floating Street Inspector & Navigation HUD (Aage / Piche & Full Route Overview) */}
      {enrichedSteps.length > 0 && (
        <div className="absolute bottom-14 sm:bottom-auto sm:top-14 sm:left-1/2 sm:-translate-x-1/2 left-2.5 right-2.5 sm:right-auto z-30 max-w-lg w-auto sm:w-[480px] pointer-events-auto">
          <div className="bg-slate-950/98 backdrop-blur-2xl px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-slate-700/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-2">
            
            {/* Top Header: Step Counter, Overview Button, Zoom Mode */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="font-extrabold text-white uppercase tracking-wider text-[10px] sm:text-[11px] truncate">
                  Street {activeStepIndexValue + 1} of {enrichedSteps.length}
                </span>
                <span className="text-[10px] text-slate-400 hidden xs:inline font-mono">
                  ({Math.round(((activeStepIndexValue + 1) / enrichedSteps.length) * 100)}%)
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={toggleZoomMode}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold transition-all"
                  title="Toggle between Street close-up (18.5x) and Corridor view (15.5x)"
                >
                  {zoomMode >= 18 ? '🔍 Street (19x)' : '🗺️ Corridor (15x)'}
                </button>
                <button
                  onClick={handleOverviewClick}
                  className="px-2 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white border border-emerald-500/40 text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95"
                  title="Reset view to fit entire route on screen"
                >
                  <Compass className="w-3 h-3" />
                  <span>🎯 Overview</span>
                </button>
              </div>
            </div>

            {/* Main Street Instruction Card & Aage / Piche Stepper */}
            <div className="flex items-center gap-2">
              {/* ◀ Piche / Prev Street */}
              <button
                onClick={handlePrevStep}
                disabled={activeStepIndexValue === 0}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 active:scale-95 ${
                  activeStepIndexValue === 0
                    ? 'bg-slate-900/60 text-slate-600 border border-slate-800/80 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white border border-slate-600 shadow-sm'
                }`}
                title="Glide back to previous street (Shortcut: ← or P)"
              >
                <span className="text-sm">◀</span>
                <span className="hidden sm:inline">Piche</span>
              </button>

              {/* Center Street Instruction */}
              <div className="flex-1 min-w-0 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
                <div className="font-bold text-slate-100 text-[11px] sm:text-xs truncate">
                  {enrichedSteps[activeStepIndexValue]?.instruction || 'Follow safe route corridor'}
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="font-mono text-emerald-400 font-bold">
                    {enrichedSteps[activeStepIndexValue]?.distanceMeters || 50}m
                  </span>
                  {enrichedSteps[activeStepIndexValue]?.stepBonus && (
                    <span className="text-amber-400 truncate hidden xs:inline">
                      {enrichedSteps[activeStepIndexValue].stepBonus}
                    </span>
                  )}
                </div>
              </div>

              {/* Aage / Next Street ▶ */}
              <button
                onClick={handleNextStep}
                disabled={activeStepIndexValue >= enrichedSteps.length - 1}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 active:scale-95 ${
                  activeStepIndexValue >= enrichedSteps.length - 1
                    ? 'bg-slate-900/60 text-slate-600 border border-slate-800/80 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-neon-safe'
                }`}
                title="Glide forward to next street (Shortcut: → or N)"
              >
                <span className="hidden sm:inline">Aage</span>
                <span className="text-sm">▶</span>
              </button>
            </div>

            {/* Mini Clickable Step Dots Bar */}
            <div className="flex items-center justify-center gap-1 pt-0.5 overflow-x-auto no-scrollbar py-0.5">
              {enrichedSteps.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeStepIndexValue
                      ? 'w-5 bg-emerald-400 shadow-[0_0_8px_#10B981]'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  title={`Step ${idx + 1}: ${s.instruction}`}
                />
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Live Safety Status Section (Responsive Bottom Ticker) */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto sm:bottom-3 sm:left-3 z-20 pointer-events-auto max-w-full">
        <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_10px_30px_rgba(0,0,0,0.75)] text-xs overflow-x-auto no-scrollbar max-w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-slate-100 tracking-wider text-[10px] sm:text-[11px] uppercase">Live Safety</span>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden sm:block shrink-0"></div>

          <div className="flex items-center gap-2.5 sm:gap-4 text-[10px] sm:text-[11px] shrink-0">
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

          <div className="h-3 w-px bg-slate-700 hidden md:block shrink-0"></div>

          <span className="text-[10px] text-slate-400 font-mono hidden md:inline shrink-0">
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
            minZoom={3}
            zoomControl={false}
            scrollWheelZoom={true}
            dragging={true}
            touchZoom={true}
            doubleClickZoom={true}
            boxZoom={true}
            keyboard={true}
            inertia={true}
            inertiaDeceleration={3000}
            easeLinearity={0.2}
            worldCopyJump={true}
            preferCanvas={true}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            <ZoomControl position="bottomright" />
            <MapController
              bounds={routeBounds}
              center={mapCenter}
              flyTarget={activeFlyTarget}
              activeStepTarget={stepTarget}
              overviewTrigger={overviewTrigger}
            />
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

            {/* Render Numbered Step Waypoint Pins Along Active Route */}
            {enrichedSteps.map((st, sIdx) => {
              if (st.lat == null || st.lng == null) return null;
              const isSelectedStep = sIdx === activeStepIndexValue;

              return (
                <Marker
                  key={`step-pin-${sIdx}`}
                  position={[st.lat, st.lng]}
                  icon={isSelectedStep ? activeStepIcon : createStepWaypointIcon(sIdx + 1, false)}
                  eventHandlers={{
                    click: () => handleSelectStep(sIdx)
                  }}
                >
                  <Popup autoPan={true}>
                    <div className="p-1 text-xs max-w-[220px] space-y-1">
                      <div className="font-extrabold text-emerald-400 flex items-center gap-1 text-[11px] uppercase">
                        <span>📍 Street Step {sIdx + 1} of {enrichedSteps.length}</span>
                      </div>
                      <div className="font-bold text-white text-xs">{st.instruction}</div>
                      <div className="text-[10px] text-slate-300 font-mono">Distance: {st.distanceMeters || 50}m</div>
                      {st.stepBonus && (
                        <div className="text-[10px] text-amber-300">{st.stepBonus}</div>
                      )}
                      <button
                        onClick={() => handleSelectStep(sIdx, 19)}
                        className="w-full mt-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                      >
                        Inspect Street Close-up (19x)
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

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
                    lineJoin: 'round',
                    interactive: false
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
                  lineJoin: 'round',
                  interactive: false
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
                      weight: 0,
                      interactive: false
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
                      weight: 0,
                      interactive: false
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
                  dashArray: '4, 4',
                  interactive: false
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
