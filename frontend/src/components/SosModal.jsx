import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PhoneCall,
  Volume2,
  VolumeX,
  X,
  Radio,
  CheckCircle2,
  Share2,
  AlertTriangle,
  Shield,
  MapPin,
  Check,
  Plus,
  Trash2,
  Edit2,
  Copy,
  MessageSquare,
  Loader2,
  ExternalLink,
  Lock,
  RefreshCw,
  Users,
  ArrowLeft,
  PhoneForwarded,
  PhoneOff
} from 'lucide-react';
import { SafeRouteAPI, SoundEngine } from '../services/api';

const DEFAULT_CONTACTS = [
  { name: 'Mom', phone: '+91 98765 43210', relation: 'Family', isPrimary: true },
  { name: 'Dad', phone: '+91 98123 45678', relation: 'Family', isPrimary: false },
  { name: 'Friend', phone: '+91 98111 22334', relation: 'Friend', isPrimary: false }
];

// Mask phone number for privacy on the main SOS screen (e.g. •••• 9176)
const maskPhoneNumber = (phone) => {
  if (!phone) return '•••• ••••';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return `•••• ${digits}`;
  return `•••• ${digits.slice(-4)}`;
};

export default function SosModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile
}) {
  // SOS Trigger & Siren State
  const [isTriggered, setIsTriggered] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [sosResult, setSosResult] = useState(null);

  // Active SOS Exit Confirmation State
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Post-activation extra contacts toggle
  const [showOtherContacts, setShowOtherContacts] = useState(false);

  // Contacts State (Max 3 contacts, persisted in localStorage)
  const [contacts, setContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('saferoute_emergency_contacts');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    if (userProfile?.emergencyContacts && userProfile.emergencyContacts.length > 0) {
      return userProfile.emergencyContacts.slice(0, 3);
    }
    return DEFAULT_CONTACTS;
  });

  const [selectedContactIdx, setSelectedContactIdx] = useState(0);

  // Recipient selection for Location Sharing
  const [selectedRecipients, setSelectedRecipients] = useState([0]);

  // Manage Contacts Modal State
  const [isManagingContacts, setIsManagingContacts] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('Family');
  const [contactError, setContactError] = useState('');

  // Location State (Real Geolocation data, strictly requested on explicit user action)
  const [locationData, setLocationData] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    timestamp: null,
    status: 'idle', // 'idle' | 'acquiring' | 'acquired' | 'error'
    error: null,
    isDenied: false
  });

  // Share Selection Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Hold-to-activate interaction state (1.5 seconds hold)
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef(null);
  const isHoldingRef = useRef(false);

  // Sync contacts with userProfile when updated externally
  useEffect(() => {
    if (userProfile?.emergencyContacts && userProfile.emergencyContacts.length > 0) {
      setContacts(userProfile.emergencyContacts.slice(0, 3));
    }
  }, [userProfile?.emergencyContacts]);

  // Ensure selected index is valid
  useEffect(() => {
    if (contacts.length > 0 && (selectedContactIdx >= contacts.length || selectedContactIdx < 0)) {
      setSelectedContactIdx(0);
    }
  }, [contacts.length, selectedContactIdx]);

  // Push state to browser history when SOS modal opens so browser Back button works
  useEffect(() => {
    if (!isOpen) return;

    // Push #sos hash into history if not already present
    if (window.location.hash !== '#sos') {
      try {
        window.history.pushState({ sosModal: true }, '', '#sos');
      } catch (_) {}
    }

    const handlePopState = () => {
      if (isTriggered) {
        // SOS active - prevent accidental silent exit, re-push hash and show confirmation
        try {
          window.history.pushState({ sosModal: true }, '', '#sos');
        } catch (_) {}
        setShowExitConfirm(true);
      } else {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, isTriggered, onClose]);

  // Request close / back handler with safety confirmation if SOS is active
  const handleRequestClose = useCallback(() => {
    if (isTriggered) {
      setShowExitConfirm(true);
    } else {
      if (window.location.hash === '#sos') {
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (_) {}
      }
      onClose();
    }
  }, [isTriggered, onClose]);

  // Confirm leave emergency mode
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    if (window.location.hash === '#sos') {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (_) {}
    }
    onClose();
  };

  // Keyboard Escape Handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleRequestClose]);

  // Reset temporary state when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      isHoldingRef.current = false;
      setIsHolding(false);
      setHoldProgress(0);
      setIsTriggered(false);
      setIsSirenPlaying(false);
      setShowExitConfirm(false);
      setShowOtherContacts(false);
      setShowShareModal(false);
      SoundEngine.stopSiren();
      // Reset location state to idle (no automatic caching or continuous tracking)
      setLocationData({
        lat: null,
        lng: null,
        accuracy: null,
        timestamp: null,
        status: 'idle',
        error: null,
        isDenied: false
      });
    }
  }, [isOpen]);

  // Explicit Location Acquisition Handler (Called ONLY upon explicit user action)
  const acquireRealLocation = useCallback((onSuccessCallback = null) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationData({
        lat: null,
        lng: null,
        accuracy: null,
        timestamp: null,
        status: 'error',
        error: 'Geolocation is not supported by your browser.',
        isDenied: false
      });
      return;
    }

    setLocationData(prev => ({
      ...prev,
      status: 'acquiring',
      error: null,
      isDenied: false
    }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accurate = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: Date.now(),
          status: 'acquired',
          error: null,
          isDenied: false
        };
        setLocationData(accurate);
        if (typeof onSuccessCallback === 'function') {
          onSuccessCallback(accurate);
        }
      },
      (err) => {
        const isPermissionDenied = err.code === 1 || err.code === err.PERMISSION_DENIED;
        const errorMessage = isPermissionDenied
          ? 'Your location could not be accessed. You can still call an emergency contact without sharing your location.'
          : (err.message || 'Unable to determine your current location.');

        setLocationData({
          lat: null,
          lng: null,
          accuracy: null,
          timestamp: null,
          status: 'error',
          error: errorMessage,
          isDenied: isPermissionDenied
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const selectedContact = contacts[selectedContactIdx] || null;

  // Execute SOS Trigger Flow
  const executeSOS = useCallback(async () => {
    const contactToCall = contacts[selectedContactIdx] || contacts[0];
    if (!contactToCall) return;

    // STEP 1: Show SOS ACTIVATED & Sound Siren
    setIsTriggered(true);
    setIsSirenPlaying(true);
    SoundEngine.playSiren();

    // STEP 2: Request precise current location on-demand
    acquireRealLocation(async (pos) => {
      try {
        const res = await SafeRouteAPI.triggerSOS({
          coordinates: { lat: pos.lat, lng: pos.lng },
          batteryLevel: '95%',
          address: 'Live Emergency GPS Location',
          alertType: 'EMERGENCY_PANIC_BUTTON',
          contactName: contactToCall.name
        });
        setSosResult(res?.alert || null);
      } catch (err) {
        // Non-blocking background dispatch
      }
    });

    // STEP 4: Call selected trusted contact via tel:
    const cleanPhone = contactToCall.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone) {
      setTimeout(() => {
        window.location.href = `tel:${cleanPhone}`;
      }, 400);
    }
  }, [contacts, selectedContactIdx, acquireRealLocation]);

  // Hold-to-activate interaction handlers (1.5 seconds)
  const handleHoldStart = () => {
    if (isTriggered || !selectedContact) return;
    isHoldingRef.current = true;
    setIsHolding(true);
    setHoldProgress(0);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds hold threshold

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        isHoldingRef.current = false;
        setIsHolding(false);
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        executeSOS();
      }
    }, 25);
  };

  const handleHoldEnd = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (isHoldingRef.current && holdProgress < 100) {
      setHoldProgress(0);
      isHoldingRef.current = false;
      setIsHolding(false);
    }
  };

  // Dedicated SOS Cancellation Mechanism
  const handleCancelSOS = async () => {
    SoundEngine.stopSiren();
    setIsSirenPlaying(false);
    setIsTriggered(false);
    setHoldProgress(0);
    try {
      if (sosResult?.alertId) {
        await SafeRouteAPI.cancelSOS(sosResult.alertId);
      }
    } catch (_) {}
    if (window.location.hash === '#sos') {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (_) {}
    }
    onClose();
  };

  const toggleSiren = () => {
    if (isSirenPlaying) {
      SoundEngine.stopSiren();
      setIsSirenPlaying(false);
    } else {
      SoundEngine.playSiren();
      setIsSirenPlaying(true);
    }
  };

  // Manage Contacts Logic
  const handleSaveContactsList = (updated) => {
    const limited = updated.slice(0, 3);
    setContacts(limited);
    try {
      localStorage.setItem('saferoute_emergency_contacts', JSON.stringify(limited));
    } catch (_) {}

    if (onUpdateProfile && userProfile) {
      onUpdateProfile({ ...userProfile, emergencyContacts: limited });
    }
  };

  const handleAddOrUpdateContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      setContactError('Please enter both name and phone number.');
      return;
    }

    const cleanPhone = newContactPhone.replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      setContactError('Please enter a valid phone number (7 to 15 digits).');
      return;
    }

    setContactError('');

    if (editingContact !== null) {
      const updated = contacts.map((c, i) =>
        i === editingContact.index
          ? { ...c, name: newContactName.trim(), phone: newContactPhone.trim(), relation: newContactRelation }
          : c
      );
      handleSaveContactsList(updated);
      setEditingContact(null);
    } else {
      if (contacts.length >= 3) {
        setContactError('Maximum of 3 trusted emergency contacts allowed.');
        return;
      }
      const updated = [
        ...contacts,
        {
          name: newContactName.trim(),
          phone: newContactPhone.trim(),
          relation: newContactRelation || 'Contact',
          isPrimary: contacts.length === 0
        }
      ];
      handleSaveContactsList(updated);
    }

    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('Family');
  };

  const handleDeleteContact = (indexToDelete) => {
    const updated = contacts.filter((_, i) => i !== indexToDelete);
    handleSaveContactsList(updated);
    if (selectedContactIdx >= updated.length) {
      setSelectedContactIdx(Math.max(0, updated.length - 1));
    }
  };

  // Location Share Action
  const generateMapsUrl = (lat, lng) => {
    if (lat == null || lng == null) return '';
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const mapsUrl = locationData.lat && locationData.lng
    ? generateMapsUrl(locationData.lat, locationData.lng)
    : '';

  const shareText = `🚨 SafeRoute Emergency Location\nI may need help. Here is my current location:\n${mapsUrl}`;

  // Toggle recipient checkbox for share modal
  const toggleRecipient = (idx) => {
    setSelectedRecipients(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleShareLocationClick = () => {
    // If location has not been acquired yet, request it explicitly now!
    if (locationData.status !== 'acquired' || !locationData.lat || !locationData.lng) {
      acquireRealLocation((pos) => {
        proceedShareWithLocation(pos.lat, pos.lng);
      });
      return;
    }
    proceedShareWithLocation(locationData.lat, locationData.lng);
  };

  const proceedShareWithLocation = async (lat, lng) => {
    const activeUrl = generateMapsUrl(lat, lng);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SafeRoute Emergency Location',
          text: 'I may need help. Here is my current location:',
          url: activeUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    if (!mapsUrl) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mapsUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  if (!isOpen) return null;

  // Remaining hold time computation
  const remainingSeconds = Math.max(0, (1.5 * (1 - holdProgress / 100))).toFixed(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in overflow-y-auto"
    >
      <div className={`w-full max-w-lg rounded-3xl border ${
        isTriggered ? 'border-rose-500/80 bg-slate-900 shadow-2xl shadow-rose-950/50' : 'border-slate-800 bg-slate-900 shadow-2xl'
      } p-5 sm:p-6 space-y-4 relative my-auto text-slate-100 transition-colors`}>
        
        {/* ========================================================================= */}
        {/* HEADER BAR: Top-Left ← Back, Center Emergency Mode, Top-Right ✕ Close */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
          {/* Top-Left: ← Back Button */}
          <button
            onClick={handleRequestClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-500 active:scale-95 border border-slate-700/60"
            title="Return to SafeRoute navigation"
            aria-label="Back to previous screen"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Center Title */}
          <div className="text-center min-w-0 flex-1">
            <span className="text-xs sm:text-sm font-black text-slate-200 tracking-wider uppercase truncate">
              Emergency Mode
            </span>
          </div>

          {/* Top-Right: ✕ Close Button */}
          <button
            onClick={handleRequestClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-500 active:scale-95 border border-slate-700/60"
            title="Close Emergency Mode"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 1. INITIAL STATE: SIMPLE, ACTION-FOCUSED EMERGENCY LAUNCHPAD */}
        {/* ========================================================================= */}
        {!isTriggered ? (
          <div className="space-y-4">
            
            {/* Header Callout */}
            <div className="text-center space-y-1 py-1">
              <h1
                id="sos-modal-title"
                className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center justify-center gap-2 uppercase"
              >
                <Shield className="w-5 h-5 text-rose-500" />
                <span>🚨 EMERGENCY MODE</span>
              </h1>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Get help quickly. Your precise location is only accessed when you activate SOS or choose to share it.
              </p>
            </div>

            {/* 1. PRIMARY SOS ACTION: Large Prominent Red HOLD Button */}
            <div className="space-y-1.5">
              <div
                role="button"
                tabIndex={0}
                aria-label="Hold for 1.5 seconds to activate SOS"
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                onTouchCancel={handleHoldEnd}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    if (!isHolding) handleHoldStart();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    handleHoldEnd();
                  }
                }}
                className={`relative overflow-hidden w-full h-16 sm:h-20 rounded-2xl bg-gradient-to-r from-red-700 via-rose-600 to-red-600 text-white font-black text-base sm:text-lg uppercase tracking-wider shadow-lg shadow-rose-950/60 flex items-center justify-center cursor-pointer select-none transition-transform active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-rose-500/40 border border-rose-500/30 ${
                  !selectedContact ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {/* Visual Hold Progress Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-white/30 transition-all duration-75 ease-linear pointer-events-none"
                  style={{ width: `${holdProgress}%` }}
                />

                <div className="relative z-10 flex items-center justify-between w-full px-5 sm:px-6 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <PhoneCall className={`w-6 h-6 fill-current ${isHolding ? 'animate-bounce text-white' : 'text-white'}`} />
                    <span className="font-black text-sm sm:text-base">
                      {isHolding ? 'ACTIVATING SOS...' : '🚨 HOLD TO ACTIVATE SOS'}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold bg-black/40 px-2.5 py-1 rounded-full border border-white/20">
                    {isHolding ? `${remainingSeconds}s` : '1.5s'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-tight">
                Calls your selected emergency contact and prepares your current location for sharing.
              </p>
            </div>

            {/* 2. TRUSTED CONTACT SECTION (Max 3 contacts) */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 tracking-wider text-[11px] uppercase flex items-center gap-1.5">
                  <span>👥 TRUSTED CONTACT</span>
                  <span className="text-[10px] text-slate-400 font-normal">({contacts.length}/3)</span>
                </span>
                <button
                  onClick={() => {
                    setEditingContact(null);
                    setNewContactName('');
                    setNewContactPhone('');
                    setNewContactRelation('Family');
                    setContactError('');
                    setIsManagingContacts(true);
                  }}
                  className="text-safe-400 hover:text-safe-300 font-bold text-[11px] flex items-center gap-1 transition-colors focus:outline-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage Contacts</span>
                </button>
              </div>

              {/* Selected Contact Indicator */}
              {selectedContact && (
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pb-1">
                  <span className="text-slate-400">Selected contact:</span>
                  <span className="font-bold text-white">{selectedContact.name}</span>
                  <span className="text-safe-400 font-bold bg-safe-500/10 px-1.5 py-0.2 rounded text-[10px] border border-safe-500/20">
                    ✓ PRIMARY
                  </span>
                </div>
              )}

              {/* Contacts Selection List */}
              <div className="space-y-1.5">
                {contacts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                    No emergency contacts added yet.{' '}
                    <button
                      onClick={() => setIsManagingContacts(true)}
                      className="text-safe-400 font-bold underline ml-1"
                    >
                      Add Contact
                    </button>
                  </div>
                ) : (
                  contacts.map((contact, idx) => {
                    const isSelected = idx === selectedContactIdx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedContactIdx(idx)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-safe-500/80 ring-1 ring-safe-500/30 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Radio / Selection Circle */}
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                              isSelected
                                ? 'border-safe-400 bg-safe-500 text-cyber-950 font-black'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                              <span>{contact.name}</span>
                              {contact.relation && (
                                <span className="text-[10px] text-slate-400 font-normal">({contact.relation})</span>
                              )}
                              {isSelected && (
                                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  SELECTED
                                </span>
                              )}
                            </div>
                            {/* Masked Phone Number */}
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {maskPhoneNumber(contact.phone)}
                            </div>
                          </div>
                        </div>

                        {/* Direct Call Button */}
                        <a
                          href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          aria-label={`Direct call ${contact.name}`}
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>CALL</span>
                        </a>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. LOCATION SECTION (Before SOS - Clean Privacy Guard) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-safe-400" />
                  <span>LOCATION</span>
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-safe-400" />
                  <span>Location private</span>
                </span>
              </div>

              {/* State A: Idle */}
              {locationData.status === 'idle' && (
                <div className="space-y-1 text-xs">
                  <div className="text-slate-300 font-medium text-xs">
                    Location not accessed
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    🔒 Your precise location remains private until you activate SOS or choose to share it.
                  </p>
                </div>
              )}

              {/* State B: Acquiring */}
              {locationData.status === 'acquiring' && (
                <div className="flex items-center gap-2 text-xs text-amber-400 py-1">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="text-xs font-medium">Getting your current location...</span>
                </div>
              )}

              {/* State C: Acquired */}
              {locationData.status === 'acquired' && (
                <div className="space-y-0.5 text-xs">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Location acquired ✓</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Accuracy: approximately {locationData.accuracy || 15} meters
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Updated just now
                  </div>
                </div>
              )}

              {/* State D: Error / Denied */}
              {locationData.status === 'error' && (
                <div className="space-y-2 text-xs">
                  <div className="text-rose-400 font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>LOCATION UNAVAILABLE</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">
                    {locationData.error || 'Your location could not be accessed. You can still call an emergency contact without sharing your location.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => acquireRealLocation()}
                      className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-safe-400" />
                      <span>Try Again</span>
                    </button>
                    {selectedContact && (
                      <a
                        href={`tel:${selectedContact.phone.replace(/[^0-9+]/g, '')}`}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call {selectedContact.name}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Explicit Share My Location Button */}
              <button
                onClick={handleShareLocationClick}
                disabled={locationData.status === 'acquiring'}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none"
              >
                <Share2 className="w-4 h-4 text-safe-400" />
                <span>
                  {locationData.status === 'acquired' ? '📍 SHARE MY LOCATION' : '📍 SHARE MY LOCATION'}
                </span>
              </button>
            </div>

            {/* 4. DIRECT EMERGENCY SERVICES (Large Touch Targets) */}
            <div className="space-y-1.5 pt-1">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                DIRECT EMERGENCY CALLS
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="tel:112"
                  className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-center space-y-0.5 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none"
                >
                  <div className="text-base">👮</div>
                  <div className="font-black text-white text-xs sm:text-sm">112</div>
                  <div className="text-[10px] text-slate-400">Emergency</div>
                </a>

                <a
                  href="tel:1091"
                  className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-center space-y-0.5 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none"
                >
                  <div className="text-base">🛡️</div>
                  <div className="font-black text-white text-xs sm:text-sm">1091</div>
                  <div className="text-[10px] text-slate-400">Women Help</div>
                </a>

                <a
                  href="tel:102"
                  className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-center space-y-0.5 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none"
                >
                  <div className="text-base">🚑</div>
                  <div className="font-black text-white text-xs sm:text-sm">102</div>
                  <div className="text-[10px] text-slate-400">Ambulance</div>
                </a>
              </div>
            </div>

            {/* Return to SafeRoute Navigation Button */}
            <button
              onClick={handleRequestClose}
              className="w-full py-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors focus:outline-none flex items-center justify-center gap-1.5 border border-slate-800/80"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Navigation</span>
            </button>

          </div>
        ) : (
          /* ========================================================================= */
          /* 2. POST-ACTIVATION: STREAMLINED ACTION-RICH EMERGENCY SCREEN */
          /* ========================================================================= */
          <div className="space-y-4 text-xs">
            
            {/* SOS Activated Header */}
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/60 space-y-2 text-center">
              <div className="text-sm sm:text-base font-black text-rose-300 uppercase tracking-wide flex items-center justify-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-ping shrink-0" />
                <span>🚨 SOS ACTIVATED</span>
              </div>
              <div className="font-bold text-white text-sm flex items-center justify-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>Calling {selectedContact?.name || 'Emergency Contact'}...</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {maskPhoneNumber(selectedContact?.phone)}
              </div>
            </div>

            {/* Location Status Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-safe-400" />
                <span>Location Status:</span>
              </div>

              {locationData.status === 'acquired' ? (
                <div className="space-y-0.5">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Location acquired ✓</span>
                  </div>
                  <div className="text-slate-300 text-xs">
                    Accuracy: approximately {locationData.accuracy || 15} meters
                  </div>
                </div>
              ) : locationData.status === 'acquiring' ? (
                <div className="flex items-center gap-2 text-amber-400 py-1">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="text-xs font-medium">Getting your current location...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-rose-400 font-semibold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Location unavailable</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {locationData.error || 'Your location could not be accessed. You can still call an emergency contact.'}
                  </p>
                  <button
                    onClick={() => acquireRealLocation()}
                    className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                  >
                    <RefreshCw className="w-3 h-3 text-safe-400" />
                    <span>Try Again</span>
                  </button>
                </div>
              )}
            </div>

            {/* TWO LARGE PRIMARY EMERGENCY ACTIONS */}
            <div className="space-y-2.5 pt-1">
              {/* Primary Action 1: SHARE MY LOCATION */}
              <button
                onClick={handleShareLocationClick}
                className="w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] focus:outline-none"
              >
                <Share2 className="w-5 h-5 text-white" />
                <span>📍 SHARE MY LOCATION</span>
              </button>

              {/* Primary Action 2: CALL 112 */}
              <a
                href="tel:112"
                className="w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] focus:outline-none text-center"
              >
                <PhoneCall className="w-5 h-5 text-white" />
                <span>📞 CALL 112</span>
              </a>
            </div>

            {/* Secondary Option: CALL ANOTHER CONTACT */}
            <div className="pt-1">
              <button
                onClick={() => setShowOtherContacts(prev => !prev)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>{showOtherContacts ? 'HIDE CONTACTS' : 'CALL ANOTHER CONTACT'}</span>
              </button>
            </div>

            {/* Other Contacts Quick Dial List */}
            {showOtherContacts && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Call Another Trusted Contact:
                </div>
                <div className="space-y-1.5">
                  {contacts.map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{maskPhoneNumber(c.phone)}</div>
                      </div>
                      <a
                        href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                        className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>CALL</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Emergency Hotlines */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:1091"
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center hover:bg-slate-800 transition-colors"
              >
                <div className="font-bold text-white text-xs">🛡️ 1091</div>
                <div className="text-[10px] text-slate-400">Women Help</div>
              </a>
              <a
                href="tel:102"
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center hover:bg-slate-800 transition-colors"
              >
                <div className="font-bold text-white text-xs">🚑 102</div>
                <div className="text-[10px] text-slate-400">Ambulance</div>
              </a>
            </div>

            {/* Audio Siren Toggle */}
            <button
              onClick={toggleSiren}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isSirenPlaying
                  ? 'bg-amber-500 text-cyber-950 shadow-neon-caution font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isSirenPlaying ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Siren Sounding (Tap to Mute)</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Siren Muted (Tap to Sound Siren)</span>
                </>
              )}
            </button>

            {/* Dedicated SOS Cancellation Action */}
            <button
              onClick={handleCancelSOS}
              className="w-full py-3.5 rounded-2xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-black text-xs uppercase tracking-wider shadow-neon-safe transition-all flex items-center justify-center gap-2 focus:outline-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I AM SAFE / DEACTIVATE SOS</span>
            </button>

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* ACTIVE SOS EXIT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
          <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-rose-500/60 max-w-sm w-full space-y-4 shadow-2xl text-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white">
                🚨 SOS is currently active.
              </h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to leave Emergency Mode?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
              >
                STAY IN EMERGENCY MODE
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANAGE CONTACTS MODAL (View / Edit / Add Contacts) */}
      {/* ========================================================================= */}
      {isManagingContacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 max-w-sm w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>👥 Manage Trusted Contacts</span>
                <span className="text-xs text-slate-400 font-normal">({contacts.length}/3)</span>
              </h3>
              <button
                onClick={() => setIsManagingContacts(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Contacts List (Full number shown for editing only) */}
            <div className="space-y-2">
              {contacts.map((c, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{c.name}</span>
                      {c.relation && (
                        <span className="text-[10px] text-slate-400 font-normal">({c.relation})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{c.phone}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingContact({ index: i, ...c });
                        setNewContactName(c.name);
                        setNewContactPhone(c.phone);
                        setNewContactRelation(c.relation || 'Family');
                        setContactError('');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(i)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-400 transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add or Edit Form */}
            {(contacts.length < 3 || editingContact !== null) && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300">
                  {editingContact !== null ? `Edit Contact #${editingContact.index + 1}` : 'Add New Contact (Max 3)'}
                </div>
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Mom)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. +91 98765 43210)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-safe-500 font-mono"
                />
                <select
                  value={newContactRelation}
                  onChange={(e) => setNewContactRelation(e.target.value)}
                  className="w-full bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white outline-none focus:border-safe-500"
                >
                  <option value="Family">Family</option>
                  <option value="Friend">Friend</option>
                  <option value="Partner">Partner</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </select>

                {contactError && (
                  <p className="text-[11px] text-rose-400 font-medium">{contactError}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAddOrUpdateContact}
                    className="flex-1 py-2 px-3 rounded-xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-bold text-xs transition-all"
                  >
                    {editingContact !== null ? 'Save Changes' : 'Add Contact'}
                  </button>
                  {editingContact !== null && (
                    <button
                      onClick={() => {
                        setEditingContact(null);
                        setNewContactName('');
                        setNewContactPhone('');
                        setNewContactRelation('Family');
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsManagingContacts(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LOCATION SHARING FALLBACK / MODAL */}
      {/* ========================================================================= */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 max-w-sm w-full space-y-3.5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-safe-400" />
                <span>Share Location With Contacts</span>
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Location link ready to share. Select recipient contacts:
            </p>

            {/* Recipient Checkboxes */}
            <div className="space-y-1.5">
              {contacts.map((c, i) => {
                const isChecked = selectedRecipients.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleRecipient(i)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer text-xs ${
                      isChecked
                        ? 'bg-slate-950 border-safe-500/60'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded accent-emerald-500 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-white">{c.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">{maskPhoneNumber(c.phone)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Share Action Buttons */}
            <div className="space-y-2 text-xs pt-1">
              {/* Open SMS Link */}
              {selectedRecipients.length > 0 && mapsUrl && (
                <a
                  href={`sms:${selectedRecipients.map(i => contacts[i]?.phone.replace(/[^0-9+]/g, '')).join(',')}?body=${encodeURIComponent(shareText)}`}
                  className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Open SMS with {selectedRecipients.length} Contact{selectedRecipients.length > 1 ? 's' : ''}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Copy Google Maps Link */}
              <button
                onClick={handleCopyLink}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-between transition-all font-semibold"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span>{copySuccess ? '✓ Link Copied to Clipboard!' : 'Copy Location Link'}</span>
                </div>
              </button>
            </div>

            {mapsUrl && (
              <div className="p-2 rounded-xl bg-slate-950 text-[10px] text-slate-400 font-mono break-all border border-slate-900">
                {mapsUrl}
              </div>
            )}

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
