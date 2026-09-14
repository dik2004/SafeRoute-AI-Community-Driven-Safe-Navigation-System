import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Navigation,
  Search,
  Plus,
  Bookmark,
  Compass,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Crosshair,
  Sparkles,
  Shield,
  Sun,
  Camera,
  Trash2,
  X,
  Loader2,
  Building,
  Map,
  Layers
} from 'lucide-react';
import {
  LOCATION_HIERARCHY,
  getAllCountries,
  getStatesByCountry,
  getCitiesByState,
  getPlacesByCity,
  getStreetsByPlace,
  searchHierarchy
} from '../data/locationHierarchy';
import { SafeRouteAPI, SoundEngine } from '../services/api';

export default function LocationExplorerModal({
  isOpen,
  onClose,
  target = 'destination', // 'origin' | 'destination'
  onSelectLocation, // ({ lat, lng, name, address, category }) => void
  userProfile,
  onUpdateUserProfile,
  onRewardPoints
}) {
  // Active Main Tab: 'hierarchy' | 'manual' | 'saved' | 'search'
  const [activeTab, setActiveTab] = useState('hierarchy');
  const [currentTarget, setCurrentTarget] = useState(target);

  // Hierarchy Navigation State
  const [selectedCountry, setSelectedCountry] = useState(LOCATION_HIERARCHY[0]); // India default
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Filter input inside hierarchy
  const [filterText, setFilterText] = useState('');

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    country: 'India',
    lat: '',
    lng: '',
    category: 'home',
    notes: '',
    saveToProfile: true
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [formError, setFormError] = useState('');

  // Global Live Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  // Saved Custom Places
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    setCurrentTarget(target);
  }, [target]);

  useEffect(() => {
    if (userProfile?.savedPlaces) {
      setSavedPlaces(userProfile.savedPlaces);
    } else {
      // Local storage fallback
      try {
        const local = localStorage.getItem('saferoute_saved_places');
        if (local) setSavedPlaces(JSON.parse(local));
      } catch (_) {}
    }
  }, [userProfile]);

  // Level computation in Hierarchy
  const currentStep = useMemo(() => {
    if (selectedPlace) return 'streets';
    if (selectedCity) return 'places';
    if (selectedState) return 'cities';
    if (selectedCountry) return 'states';
    return 'countries';
  }, [selectedCountry, selectedState, selectedCity, selectedPlace]);

  // Filtered lists for current step
  const filteredCountries = useMemo(() => {
    const list = getAllCountries();
    if (!filterText) return list;
    return list.filter(c => c.countryName.toLowerCase().includes(filterText.toLowerCase()));
  }, [filterText]);

  const filteredStates = useMemo(() => {
    if (!selectedCountry) return [];
    const states = getStatesByCountry(selectedCountry.countryCode);
    if (!filterText) return states;
    return states.filter(s => s.stateName.toLowerCase().includes(filterText.toLowerCase()));
  }, [selectedCountry, filterText]);

  const filteredCities = useMemo(() => {
    if (!selectedCountry || !selectedState) return [];
    const cities = getCitiesByState(selectedCountry.countryCode, selectedState.stateCode);
    if (!filterText) return cities;
    return cities.filter(c => c.cityName.toLowerCase().includes(filterText.toLowerCase()));
  }, [selectedCountry, selectedState, filterText]);

  const filteredPlaces = useMemo(() => {
    if (!selectedCountry || !selectedState || !selectedCity) return [];
    const places = getPlacesByCity(selectedCountry.countryCode, selectedState.stateCode, selectedCity.cityName);
    if (!filterText) return places;
    return places.filter(p => p.placeName.toLowerCase().includes(filterText.toLowerCase()));
  }, [selectedCountry, selectedState, selectedCity, filterText]);

  const filteredStreets = useMemo(() => {
    if (!selectedCountry || !selectedState || !selectedCity || !selectedPlace) return [];
    const streets = getStreetsByPlace(selectedCountry.countryCode, selectedState.stateCode, selectedCity.cityName, selectedPlace.placeName);
    if (!filterText) return streets;
    return streets.filter(s => s.streetName.toLowerCase().includes(filterText.toLowerCase()) || s.description.toLowerCase().includes(filterText.toLowerCase()));
  }, [selectedCountry, selectedState, selectedCity, selectedPlace, filterText]);

  if (!isOpen) return null;

  // Breadcrumb back navigation
  const handleBackStep = () => {
    setFilterText('');
    if (selectedPlace) setSelectedPlace(null);
    else if (selectedCity) setSelectedCity(null);
    else if (selectedState) setSelectedState(null);
    else if (selectedCountry) setSelectedCountry(null);
  };

  const handleResetHierarchy = () => {
    setFilterText('');
    setSelectedCountry(LOCATION_HIERARCHY[0]);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedPlace(null);
  };

  // Selection Handler
  const handleFinalSelect = (loc) => {
    SoundEngine.playSafeChime();
    if (onSelectLocation) {
      onSelectLocation({
        target: currentTarget,
        name: loc.name || loc.streetName || loc.placeName || loc.cityName,
        lat: loc.lat,
        lng: loc.lng,
        address: loc.address || loc.fullName || `${loc.streetName || ''}, ${loc.placeName || ''}, ${loc.cityName || ''}`.replace(/^, /, ''),
        category: loc.category || 'custom'
      });
    }
    onClose();
  };

  // Global search input change
  const handleGlobalSearchChange = async (text) => {
    setGlobalSearchQuery(text);
    if (!text || text.trim().length < 2) {
      setGlobalSearchResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    setIsSearchingGlobal(true);
    // Combine local hierarchy search + online nominatim search
    const localMatches = searchHierarchy(text);
    let onlineMatches = [];
    try {
      onlineMatches = await SafeRouteAPI.searchGlobalPlaces(text);
    } catch (_) {}

    const combined = [
      ...localMatches.map(m => ({ ...m, source: 'hierarchy' })),
      ...onlineMatches.map(m => ({ ...m, source: 'geocoder' }))
    ];

    setGlobalSearchResults(combined);
    setIsSearchingGlobal(false);
  };

  // Detect current GPS in manual form
  const handleManualDetectGPS = () => {
    if (navigator.geolocation) {
      setIsLocatingGPS(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const address = await SafeRouteAPI.reverseGeocode(lat, lng) || '';
          setManualForm(prev => ({
            ...prev,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            street: address || prev.street,
            name: prev.name || 'My Live GPS Location'
          }));
          setIsLocatingGPS(false);
        },
        () => {
          setManualForm(prev => ({
            ...prev,
            lat: '28.628900',
            lng: '77.206500',
            name: prev.name || 'Default City Center GPS'
          }));
          setIsLocatingGPS(false);
        },
        { timeout: 8000 }
      );
    }
  };

  // Auto geocode manual address
  const handleManualGeocode = async () => {
    const query = `${manualForm.name} ${manualForm.street} ${manualForm.city} ${manualForm.country}`.trim();
    if (query.length < 3) {
      setFormError('Please enter at least a place name and city or street.');
      return;
    }

    setIsGeocoding(true);
    setFormError('');
    try {
      const results = await SafeRouteAPI.searchGlobalPlaces(query);
      if (results && results.length > 0) {
        const best = results[0];
        setManualForm(prev => ({
          ...prev,
          lat: best.lat.toFixed(6),
          lng: best.lng.toFixed(6),
          street: prev.street || best.name
        }));
        SoundEngine.playSafeChime();
      } else {
        setFormError('Could not find exact GPS automatically. You can enter Latitude & Longitude manually.');
      }
    } catch (e) {
      setFormError('Geocoding service unavailable. Please provide coordinates manually.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Submit manual place
  const handleSubmitManualPlace = async (e) => {
    e.preventDefault();
    if (!manualForm.name.trim()) {
      setFormError('Place Name is required.');
      return;
    }
    if (!manualForm.lat || !manualForm.lng || isNaN(parseFloat(manualForm.lat)) || isNaN(parseFloat(manualForm.lng))) {
      setFormError('Valid Latitude and Longitude are required. Use "Detect GPS" or "Auto-Geocode" above.');
      return;
    }

    const newPlace = {
      label: manualForm.name.trim(),
      address: `${manualForm.street || manualForm.name}, ${manualForm.city || ''} ${manualForm.country || ''}`.trim(),
      lat: parseFloat(manualForm.lat),
      lng: parseFloat(manualForm.lng),
      icon: manualForm.category === 'home' ? 'home' : manualForm.category === 'work' ? 'briefcase' : manualForm.category === 'haven' ? 'shield' : 'map-pin',
      details: manualForm.notes || ''
    };

    // Save to profile / local storage
    try {
      const res = await SafeRouteAPI.addSavedPlace(newPlace);
      if (res && res.savedPlaces) {
        setSavedPlaces(res.savedPlaces);
        if (onUpdateUserProfile) {
          onUpdateUserProfile(prev => ({ ...prev, savedPlaces: res.savedPlaces }));
        }
      } else {
        const updated = [...savedPlaces, newPlace];
        setSavedPlaces(updated);
        localStorage.setItem('saferoute_saved_places', JSON.stringify(updated));
      }
      if (onRewardPoints) {
        onRewardPoints(10, 'Custom safe place saved to profile');
      }
    } catch (err) {
      const updated = [...savedPlaces, newPlace];
      setSavedPlaces(updated);
      localStorage.setItem('saferoute_saved_places', JSON.stringify(updated));
    }

    // Select this place immediately
    handleFinalSelect({
      name: newPlace.label,
      lat: newPlace.lat,
      lng: newPlace.lng,
      address: newPlace.address,
      category: manualForm.category
    });
  };

  // Delete saved place
  const handleDeleteSavedPlace = async (index, e) => {
    e.stopPropagation();
    try {
      const res = await SafeRouteAPI.deleteSavedPlace(index);
      if (res && res.savedPlaces) {
        setSavedPlaces(res.savedPlaces);
      } else {
        const updated = savedPlaces.filter((_, idx) => idx !== index);
        setSavedPlaces(updated);
        localStorage.setItem('saferoute_saved_places', JSON.stringify(updated));
      }
    } catch (_) {
      const updated = savedPlaces.filter((_, idx) => idx !== index);
      setSavedPlaces(updated);
      localStorage.setItem('saferoute_saved_places', JSON.stringify(updated));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass-panel w-full max-w-4xl rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-cyber-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-safe-500/20 text-safe-400 border border-safe-500/40 flex items-center justify-center shadow-neon-safe">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Global Cities & Places Explorer
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-safe-500/20 text-safe-300 font-bold text-[10px] border border-safe-500/40 uppercase">
                  Country ➔ State ➔ City ➔ Street
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Explore structured worldwide cities, curated safety corridors, or add custom places manually.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Target Selector Indicator (Origin A vs Destination B) */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setCurrentTarget('origin')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  currentTarget === 'origin'
                    ? 'bg-safe-500 text-cyber-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-cyber-950 text-safe-400 text-[10px] font-black flex items-center justify-center">A</span>
                <span>Set Origin</span>
              </button>
              <button
                onClick={() => setCurrentTarget('destination')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  currentTarget === 'destination'
                    ? 'bg-beacon-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white text-beacon-600 text-[10px] font-black flex items-center justify-center">B</span>
                <span>Set Destination</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-900/95 border-b border-slate-800 text-xs overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'hierarchy'
                ? 'bg-gradient-to-r from-emerald-600 to-safe-500 text-cyber-950 shadow-neon-safe'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Country ➔ City Hierarchy Explorer</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'manual'
                ? 'bg-gradient-to-r from-emerald-600 to-safe-500 text-cyber-950 shadow-neon-safe'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Place Manually</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'saved'
                ? 'bg-gradient-to-r from-emerald-600 to-safe-500 text-cyber-950 shadow-neon-safe'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>My Saved Places ({savedPlaces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-emerald-600 to-safe-500 text-cyber-950 shadow-neon-safe'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Worldwide Live Search</span>
          </button>
        </div>

        {/* TAB 1: Hierarchical Drilldown Explorer */}
        {activeTab === 'hierarchy' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            {/* Interactive Stepper Breadcrumbs Bar */}
            <div className="flex items-center flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
              
              <button
                onClick={handleResetHierarchy}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  !selectedCountry ? 'bg-safe-500 text-cyber-950' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>🌍 All Countries</span>
              </button>

              {selectedCountry && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <button
                    onClick={() => {
                      setSelectedState(null);
                      setSelectedCity(null);
                      setSelectedPlace(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      !selectedState ? 'bg-safe-500 text-cyber-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{selectedCountry.flag} {selectedCountry.countryName}</span>
                  </button>
                </>
              )}

              {selectedState && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <button
                    onClick={() => {
                      setSelectedCity(null);
                      setSelectedPlace(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      !selectedCity ? 'bg-safe-500 text-cyber-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🏛️ {selectedState.stateName}</span>
                  </button>
                </>
              )}

              {selectedCity && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                      !selectedPlace ? 'bg-safe-500 text-cyber-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>🏙️ {selectedCity.cityName}</span>
                  </button>
                </>
              )}

              {selectedPlace && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-beacon-500 text-white flex items-center gap-1.5">
                    <span>📍 {selectedPlace.placeName}</span>
                  </span>
                </>
              )}
            </div>

            {/* Sub-header with Search Filter & Back Button */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {currentStep !== 'countries' && (
                  <button
                    onClick={handleBackStep}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold border border-slate-700 transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}
                <div className="text-xs font-bold text-slate-200">
                  {currentStep === 'countries' && 'Step 1: Select Country'}
                  {currentStep === 'states' && `Step 2: Select State / Region in ${selectedCountry.countryName}`}
                  {currentStep === 'cities' && `Step 3: Select City in ${selectedState.stateName}`}
                  {currentStep === 'places' && `Step 4: Select Neighborhood / Hub in ${selectedCity.cityName}`}
                  {currentStep === 'streets' && `Step 5: Select Corridor / Street in ${selectedPlace.placeName}`}
                </div>
              </div>

              {/* Filter Box */}
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Filter ${currentStep}...`}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-safe-500 transition-all"
                />
              </div>
            </div>

            {/* STEP 1: Countries Grid */}
            {currentStep === 'countries' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCountries.map((c) => (
                  <button
                    key={c.countryCode}
                    onClick={() => {
                      const fullCountry = LOCATION_HIERARCHY.find(x => x.countryCode === c.countryCode);
                      setSelectedCountry(fullCountry);
                      setFilterText('');
                    }}
                    className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-safe-500/60 text-left space-y-2 transition-all group hover:scale-[1.02]"
                  >
                    <div className="text-3xl">{c.flag}</div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 group-hover:text-safe-300">
                        {c.countryName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                        <span>{c.statesCount} States / Regions</span>
                        <span className="text-[10px] text-rose-400 font-mono">🚨 {c.emergencyNumber}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 2: States Grid */}
            {currentStep === 'states' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredStates.map((s) => (
                  <button
                    key={s.stateCode}
                    onClick={() => {
                      setSelectedState(s);
                      setFilterText('');
                    }}
                    className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-safe-500/60 text-left space-y-2 transition-all group hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-safe-500/10 text-safe-400 font-bold text-xs">
                        {s.stateCode}
                      </div>
                      <span className="text-xs text-slate-400">{s.cities.length} Cities</span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 group-hover:text-safe-300">
                        {s.stateName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Includes {s.cities.map(c => c.cityName).join(', ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 3: Cities Grid */}
            {currentStep === 'cities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCities.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCity(city);
                      setFilterText('');
                    }}
                    className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-safe-500/60 text-left space-y-2 transition-all group hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-beacon-500/10 text-beacon-400">
                        <Building className="w-4 h-4" />
                      </div>
                      <span className="text-xs text-slate-400">{city.places.length} Hotspots / Hubs</span>
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100 group-hover:text-beacon-300">
                        {city.cityName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {city.places.map(p => p.placeName).join(' • ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 4: Places / Hubs Grid */}
            {currentStep === 'places' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlaces.map((place, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPlace(place);
                      setFilterText('');
                    }}
                    className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-safe-500/60 text-left space-y-2.5 transition-all group hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{place.icon || '📍'}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-100 group-hover:text-safe-300">
                            {place.placeName}
                          </div>
                          <div className="text-[10px] text-safe-400 font-medium">{place.type}</div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                        {place.streets.length} Corridors
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      {place.streets.slice(0, 2).map((st, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1 truncate text-slate-300">
                          <span className="text-safe-400">•</span>
                          <span>{st.streetName}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 5: Streets / Specific Corridors Selection */}
            {currentStep === 'streets' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-safe-500/10 border border-safe-500/30 text-xs text-safe-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Shield className="w-4 h-4 text-safe-400" />
                    Showing verified safety-monitored corridors for {selectedPlace.placeName}
                  </span>
                  <span className="text-[10px] text-slate-400">Click any card to select for navigation</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {filteredStreets.map((street, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleFinalSelect({
                        ...street,
                        placeName: selectedPlace.placeName,
                        cityName: selectedCity.cityName
                      })}
                      className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-safe-500 cursor-pointer space-y-2 transition-all hover:scale-[1.01] group shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-sm text-slate-100 group-hover:text-safe-300 flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-safe-400" />
                            <span>{street.streetName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">{street.description}</div>
                        </div>

                        <button className="shrink-0 px-3 py-1.5 rounded-xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-bold text-xs uppercase tracking-wider shadow-neon-safe transition-all flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Select for {currentTarget === 'origin' ? 'Origin A' : 'Destination B'}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1">
                          <Sun className="w-3 h-3" />
                          {street.lighting || 'High-Lumen LED'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-beacon-500/20 text-beacon-300 font-medium flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          24/7 CCTV Monitored
                        </span>
                        {street.landmark && (
                          <span className="text-slate-400 font-mono">
                            📍 {street.landmark}
                          </span>
                        )}
                        <span className="ml-auto text-slate-500 font-mono">
                          {street.lat.toFixed(4)}, {street.lng.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: Manual Place Creator Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSubmitManualPlace} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            <div className="p-3.5 rounded-2xl bg-safe-500/10 border border-safe-500/30 text-xs text-safe-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-safe-200">
                <Sparkles className="w-4 h-4 text-safe-400" />
                Add Any Custom Location Anywhere in the World
              </div>
              <p className="text-[11px] text-slate-400">
                Enter your exact place name, hostel, office building, or private residence. We will compute spatial lighting & CCTV coverage instantly.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Place Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Place / Building / Hub Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Apartment Gate 2, University Tech Block, Safe Cafe"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Location Category</label>
                <select
                  value={manualForm.category}
                  onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-safe-500"
                >
                  <option value="home">🏠 Home Residence</option>
                  <option value="work">💼 Work / Office / Campus</option>
                  <option value="haven">🛡️ 24/7 Safe Haven / Refuge</option>
                  <option value="transit">🚇 Metro / Bus Transit Hub</option>
                  <option value="cafe">☕ Cafe / Commercial Shop</option>
                  <option value="custom">⭐ Custom Favorite</option>
                </select>
              </div>

              {/* Street / Address Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Street / Road / Avenue</label>
                <input
                  type="text"
                  placeholder="e.g. 14th Main Avenue, Outer Ring Road, Sector 62"
                  value={manualForm.street}
                  onChange={(e) => setManualForm({ ...manualForm, street: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500"
                />
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">City</label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi, Mumbai, Bengaluru, New York, London"
                  value={manualForm.city}
                  onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500"
                />
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">State / Region / Province</label>
                <input
                  type="text"
                  placeholder="e.g. Delhi NCR, Maharashtra, California, Greater London"
                  value={manualForm.state}
                  onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500"
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Country</label>
                <input
                  type="text"
                  placeholder="e.g. India, United States, United Kingdom, France"
                  value={manualForm.country}
                  onChange={(e) => setManualForm({ ...manualForm, country: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500"
                />
              </div>

            </div>

            {/* Exact GPS Pinpoint Section */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-safe-400" />
                  Exact GPS Coordinates (Required for Route Calculation)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualDetectGPS}
                    disabled={isLocatingGPS}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-safe-300 text-xs font-medium border border-slate-700 flex items-center gap-1"
                  >
                    {isLocatingGPS ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crosshair className="w-3 h-3" />}
                    <span>Use Current GPS</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleManualGeocode}
                    disabled={isGeocoding}
                    className="px-2.5 py-1 rounded-lg bg-beacon-600/30 hover:bg-beacon-600/50 text-beacon-300 text-xs font-medium border border-beacon-500/40 flex items-center gap-1"
                  >
                    {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    <span>Auto-Geocode from Address</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 28.628900"
                    value={manualForm.lat}
                    onChange={(e) => setManualForm({ ...manualForm, lat: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white outline-none focus:border-safe-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 77.206500"
                    value={manualForm.lng}
                    onChange={(e) => setManualForm({ ...manualForm, lng: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-white outline-none focus:border-safe-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Safety & Access Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Safety & Access Notes (Optional)</label>
              <textarea
                placeholder="e.g. 24/7 Security guard at Gate 1, illuminated lane with CCTV, active emergency button near reception."
                rows={2}
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-safe-500 to-teal-500 hover:brightness-110 active:scale-[0.99] text-cyber-950 font-black text-xs uppercase tracking-wider shadow-neon-safe transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Place & Use as {currentTarget === 'origin' ? 'Origin A' : 'Destination B'}</span>
            </button>

          </form>
        )}

        {/* TAB 3: Saved Custom Places */}
        {activeTab === 'saved' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200">My Custom Saved Destinations & Havens</span>
              <button
                onClick={() => setActiveTab('manual')}
                className="text-safe-400 hover:text-safe-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Place</span>
              </button>
            </div>

            {savedPlaces.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-xl">
                  📍
                </div>
                <div className="text-sm font-bold text-slate-300">No saved custom places yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your home, hostel, gym, or favorite safe havens to quickly route to them with one tap anytime.
                </p>
                <button
                  onClick={() => setActiveTab('manual')}
                  className="px-4 py-2 rounded-xl bg-safe-500 text-cyber-950 font-bold text-xs shadow-neon-safe"
                >
                  Create First Custom Place
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedPlaces.map((place, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleFinalSelect({
                      name: place.label,
                      lat: place.lat,
                      lng: place.lng,
                      address: place.address,
                      category: place.icon
                    })}
                    className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-safe-500 cursor-pointer space-y-2 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {place.icon === 'home' ? '🏠' : place.icon === 'briefcase' ? '💼' : place.icon === 'shield' ? '🛡️' : '📍'}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-slate-100 group-hover:text-safe-300">
                            {place.label}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{place.address}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSavedPlace(idx, e)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-500 hover:text-rose-400 transition-all"
                        title="Delete Place"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                      <span className="text-slate-500 font-mono">{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                      <span className="text-safe-400 font-bold group-hover:underline flex items-center gap-1">
                        <span>Select as {currentTarget === 'origin' ? 'Origin' : 'Dest'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Worldwide Live Search */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            
            <div className="relative">
              <Search className="w-4 h-4 text-safe-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any country, state, city, landmark, or address (e.g. Tokyo Shibuya, London Soho, Mumbai Bandra)..."
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-safe-500 shadow-inner"
              />
              {isSearchingGlobal && (
                <Loader2 className="w-4 h-4 text-safe-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {globalSearchResults.length === 0 ? (
              <div className="py-10 text-center space-y-2 text-slate-500 text-xs">
                <div>Type at least 2 characters to search across millions of places worldwide.</div>
                <div className="text-[11px] text-slate-600">
                  Powered by OpenStreetMap Global Geocoding & Curated SafeRoute Hierarchy
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400">
                  {globalSearchResults.length} Worldwide Places Found:
                </div>
                <div className="divide-y divide-slate-800 bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                  {globalSearchResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleFinalSelect({
                        name: res.name || res.street || res.place || res.fullName,
                        lat: res.lat,
                        lng: res.lng,
                        address: res.fullName || res.name
                      })}
                      className="p-3.5 hover:bg-safe-500/15 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-safe-500/20 text-safe-400 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-100 group-hover:text-safe-300">
                            {res.flag ? `${res.flag} ` : ''}{res.name || res.street || res.place}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {res.fullName || `${res.city || ''}, ${res.country || ''}`}
                          </div>
                        </div>
                      </div>

                      <button className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-safe-500 group-hover:text-cyber-950 text-slate-300 font-bold text-[11px] transition-all shrink-0">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
