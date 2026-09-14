import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  Phone,
  Plus,
  Trash2,
  MapPin,
  Award,
  Sparkles,
  X,
  CheckCircle2,
  Bookmark,
  Search,
  Loader2,
  Home,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Train
} from 'lucide-react';
import { SafeRouteAPI } from '../services/api';

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onRewardPoints,
  initialTab = 'contacts'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'contacts' | 'places' | 'stats'
  
  // Emergency Contacts State
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Family');

  // Saved Places State
  const [newPlaceLabel, setNewPlaceLabel] = useState('');
  const [newPlaceIcon, setNewPlaceIcon] = useState('home');
  const [newPlaceSearch, setNewPlaceSearch] = useState('');
  const [newPlaceCoords, setNewPlaceCoords] = useState(null);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  const searchTimeoutRef = useRef(null);

  if (!isOpen) return null;

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    try {
      const res = await SafeRouteAPI.addContact({
        name: newContactName,
        phone: newContactPhone,
        relation: newContactRelation,
        isPrimary: false
      });
      if (res.contacts) {
        onUpdateProfile({ ...userProfile, emergencyContacts: res.contacts });
      }
      setNewContactName('');
      setNewContactPhone('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (idx) => {
    try {
      const res = await SafeRouteAPI.deleteContact(idx);
      if (res.contacts) {
        onUpdateProfile({ ...userProfile, emergencyContacts: res.contacts });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Saved Places Handlers
  const handlePlaceSearchChange = (text) => {
    setNewPlaceSearch(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text || text.trim().length < 2) {
      setPlaceSuggestions([]);
      setIsSearchingPlace(false);
      return;
    }

    setIsSearchingPlace(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await SafeRouteAPI.searchLocations(text);
        setPlaceSuggestions(results || []);
      } catch (_) {
        setPlaceSuggestions([]);
      } finally {
        setIsSearchingPlace(false);
      }
    }, 280);
  };

  const handleSelectPlaceSuggestion = (item) => {
    setNewPlaceSearch(item.name);
    setNewPlaceCoords({
      address: item.subAddress || item.fullName || item.name,
      lat: item.lat,
      lng: item.lng
    });
    if (!newPlaceLabel) {
      setNewPlaceLabel(item.name.split(',')[0]);
    }
    setPlaceSuggestions([]);
  };

  const handleAddSavedPlace = async (e) => {
    e.preventDefault();
    if (!newPlaceLabel || !newPlaceSearch || !newPlaceCoords) return;

    setIsSavingPlace(true);
    try {
      const placePayload = {
        label: newPlaceLabel,
        address: newPlaceCoords.address || newPlaceSearch,
        lat: newPlaceCoords.lat,
        lng: newPlaceCoords.lng,
        icon: newPlaceIcon
      };

      const res = await SafeRouteAPI.addSavedPlace(placePayload);
      if (res.savedPlaces) {
        onUpdateProfile({ ...userProfile, savedPlaces: res.savedPlaces });
      }
      if (onRewardPoints) {
        onRewardPoints(10, 'Custom safe place added to profile');
      }

      setNewPlaceLabel('');
      setNewPlaceSearch('');
      setNewPlaceCoords(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPlace(false);
    }
  };

  const handleDeleteSavedPlace = async (idx) => {
    try {
      const res = await SafeRouteAPI.deleteSavedPlace(idx);
      if (res.savedPlaces) {
        onUpdateProfile({ ...userProfile, savedPlaces: res.savedPlaces });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const points = userProfile?.guardianPoints || 120;
  const badge = userProfile?.guardianBadge || 'Silver Guardian';
  const savedPlaces = userProfile?.savedPlaces || [];

  const iconMap = {
    home: { emoji: '🏠', label: 'Home' },
    work: { emoji: '💼', label: 'Work' },
    school: { emoji: '🎓', label: 'College' },
    gym: { emoji: '🏋️', label: 'Gym' },
    station: { emoji: '🚉', label: 'Transit' },
    star: { emoji: '⭐', label: 'Favorite' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass-panel p-5 lg:p-6 rounded-3xl border border-slate-700/80 max-w-md w-full space-y-4 shadow-2xl relative my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-safe-500/20 border border-safe-500/40 text-2xl flex items-center justify-center">
              {userProfile?.avatar || '🛡️'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {userProfile?.name || 'Community Guardian'}
              </h2>
              <div className="text-[11px] text-safe-400 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>{badge} • {points} Pts</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Tab Switcher */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'contacts' ? 'bg-safe-500 text-cyber-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SOS Contacts
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'places' ? 'bg-safe-500 text-cyber-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Saved Places
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'stats' ? 'bg-safe-500 text-cyber-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guardian Rank
          </button>
        </div>

        {/* SOS Emergency Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-3.5 text-xs">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              These trusted contacts receive your live GPS coordinate link when SOS is triggered or during late-night guardian walks.
            </p>

            {/* List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(userProfile?.emergencyContacts || []).map((contact, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {contact.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        {contact.name}
                        {contact.isPrimary && (
                          <span className="text-[9px] bg-safe-500/20 text-safe-300 px-1.5 py-0.2 rounded font-mono">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {contact.phone} • {contact.relation}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteContact(idx)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-all"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Contact Form */}
            <form onSubmit={handleAddContact} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 pt-2.5">
              <div className="font-bold text-slate-200 text-[11px]">Add Emergency Contact</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name (e.g. Sister)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="bg-slate-800 p-2 rounded-lg text-slate-100 placeholder-slate-500 outline-none text-xs"
                />
                <input
                  type="text"
                  placeholder="Phone (+91...)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="bg-slate-800 p-2 rounded-lg text-slate-100 placeholder-slate-500 outline-none text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-safe-500 hover:bg-safe-400 text-cyber-950 font-bold text-xs transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Contact</span>
              </button>
            </form>
          </div>
        )}

        {/* Saved Places Tab */}
        {activeTab === 'places' && (
          <div className="space-y-3.5 text-xs">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Personalize your frequent destinations (Home, Work, Campus, Gym) for instant 1-tap route calculation.
            </p>

            {/* Saved Places List */}
            {savedPlaces.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedPlaces.map((place, idx) => {
                  const iconInfo = iconMap[place.icon] || iconMap.star;
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shrink-0">
                          {iconInfo.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 text-xs truncate">
                            {place.label || place.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {place.address}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSavedPlace(idx)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-all shrink-0"
                        title="Delete Saved Place"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-1">
                <Bookmark className="w-5 h-5 text-safe-400 mx-auto opacity-70" />
                <div className="text-xs font-semibold text-slate-300">No saved places yet</div>
                <div className="text-[10px] text-slate-500">Add your frequent places below for fast navigation.</div>
              </div>
            )}

            {/* Add New Saved Place Form */}
            <form onSubmit={handleAddSavedPlace} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5 pt-2.5">
              <div className="font-bold text-slate-200 text-[11px] flex items-center justify-between">
                <span>Add New Place</span>
                <span className="text-[10px] text-safe-400 font-normal">+10 Guardian Pts</span>
              </div>

              {/* Icon Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {Object.entries(iconMap).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewPlaceIcon(key)}
                    className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all shrink-0 ${
                      newPlaceIcon === key
                        ? 'bg-safe-500 text-cyber-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Place Label */}
              <input
                type="text"
                placeholder="Place Label (e.g. Home, My Office, Gym)"
                value={newPlaceLabel}
                onChange={(e) => setNewPlaceLabel(e.target.value)}
                className="w-full bg-slate-800 p-2 rounded-lg text-slate-100 placeholder-slate-500 outline-none text-xs"
              />

              {/* Address Search with live autocomplete */}
              <div className="relative">
                <div className="flex items-center bg-slate-800 rounded-lg px-2 border border-slate-700 focus-within:border-safe-500">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
                  <input
                    type="text"
                    placeholder="Search address or landmark..."
                    value={newPlaceSearch}
                    onChange={(e) => handlePlaceSearchChange(e.target.value)}
                    className="w-full bg-transparent py-2 text-slate-100 placeholder-slate-500 outline-none text-xs"
                  />
                  {isSearchingPlace && <Loader2 className="w-3 h-3 text-safe-400 animate-spin shrink-0" />}
                </div>

                {placeSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-[#0B101E] border border-slate-700 rounded-xl shadow-2xl max-h-40 overflow-y-auto divide-y divide-slate-800 animate-in fade-in">
                    {placeSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPlaceSuggestion(item)}
                        className="w-full text-left p-2 hover:bg-safe-500/20 text-xs flex items-start gap-2 group transition-colors"
                      >
                        <span className="text-sm shrink-0">📍</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-100 group-hover:text-safe-300 text-xs truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {item.subAddress || item.fullName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {newPlaceCoords && (
                <div className="text-[10px] text-safe-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Location resolved: {newPlaceCoords.lat.toFixed(4)}, {newPlaceCoords.lng.toFixed(4)}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingPlace || !newPlaceLabel || !newPlaceCoords}
                className="w-full py-2 rounded-lg bg-safe-500 hover:bg-safe-400 disabled:opacity-50 text-cyber-950 font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                {isSavingPlace ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Place to Profile</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Guardian Rank Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-3.5 text-xs">
            <div className="glass-panel-glow p-4 rounded-2xl border border-safe-500/40 text-center space-y-1">
              <div className="text-2xl">🎖️</div>
              <div className="text-sm font-black text-white">{badge}</div>
              <div className="text-xs text-safe-400 font-bold">{points} Guardian Points</div>
              <div className="text-[10px] text-slate-400 pt-1">
                {250 - points > 0 ? `${250 - points} pts to Guardian Commander Rank` : 'Top Rank Achieved!'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-lg font-bold text-safe-400">{userProfile?.reportsSubmitted || 3}</div>
                <div className="text-[10px] text-slate-400">Reports Submitted</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-lg font-bold text-beacon-400">{userProfile?.reportsVerified || 8}</div>
                <div className="text-[10px] text-slate-400">Reports Verified</div>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="font-bold text-slate-200">How to earn points:</div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-safe-400" />
                <span>Report new hazard: <strong>+10 points</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-safe-400" />
                <span>Upvote / verify hazard: <strong>+5 points</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-safe-400" />
                <span>Complete Guardian Walk: <strong>+20 points</strong></span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
