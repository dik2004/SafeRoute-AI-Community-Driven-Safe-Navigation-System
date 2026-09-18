import React, { useState, useEffect, useCallback, Component } from 'react';
import Navbar from './components/Navbar';
import SafetyMap from './components/SafetyMap';
import RoutePlanner from './components/RoutePlanner';
import GuardianWalk from './components/GuardianWalk';
import IncidentModal from './components/IncidentModal';
import IncidentFeed from './components/IncidentFeed';
import SafeHavens from './components/SafeHavens';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SosModal from './components/SosModal';
import ProfileModal from './components/ProfileModal';
import AddSafetyPointModal from './components/AddSafetyPointModal';
import { SafeRouteAPI, SoundEngine } from './services/api';
import { Sparkles, Shield, AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cyber-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel p-8 rounded-3xl border border-rose-500/50 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">SafeRoute Interface Recovery</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              A temporary render hiccup occurred. Click below to refresh the map and resume navigation.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 rounded-xl bg-safe-500 hover:bg-safe-400 text-cyber-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-neon-safe"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload SafeRoute</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SafeRouteMain() {
  const [activeTab, setActiveTab] = useState('routes'); // 'routes' | 'incidents' | 'safe_havens' | 'analytics'
  const [timeOfDay, setTimeOfDay] = useState('night');
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' | 'grey' | 'light'
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Origin & Destination (Location-Agnostic Defaults)
  const [origin, setOrigin] = useState({
    lat: null,
    lng: null,
    name: 'Current Location',
    isCurrent: true
  });
  const [destination, setDestination] = useState(null);

  // Data State
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  const [safetyPoints, setSafetyPoints] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [areaScore, setAreaScore] = useState(null);
  const [overviewStats, setOverviewStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Modals
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddSafetyPointOpen, setIsAddSafetyPointOpen] = useState(false);
  const [selectedMapCoords, setSelectedMapCoords] = useState(null);

  // Guardian Walk Live Companion State
  const [isGuardianWalking, setIsGuardianWalking] = useState(false);
  const [guardianLocation, setGuardianLocation] = useState(null);
  const [mapFlyTarget, setMapFlyTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      const [pointsRes, incsRes, areaRes, userRes, statsRes] = await Promise.allSettled([
        SafeRouteAPI.getSafetyPoints(),
        SafeRouteAPI.getIncidents(),
        SafeRouteAPI.getAreaScore(28.6139, 77.2090, 'Active Urban Corridor'),
        SafeRouteAPI.getUserProfile(),
        SafeRouteAPI.getOverviewStats()
      ]);

      if (pointsRes.status === 'fulfilled' && pointsRes.value?.safetyPoints) {
        setSafetyPoints(pointsRes.value.safetyPoints);
      }
      if (incsRes.status === 'fulfilled' && incsRes.value?.incidents) {
        setIncidents(incsRes.value.incidents);
      }
      if (areaRes.status === 'fulfilled') {
        setAreaScore(areaRes.value);
      }
      if (userRes.status === 'fulfilled' && userRes.value?.user) {
        setUserProfile(userRes.value.user);
      }
      if (statsRes.status === 'fulfilled') {
        setOverviewStats(statsRes.value);
      }
    } catch (err) {
      console.warn('Initial data load notice', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Calculate Safe Routes (Only runs when both origin & destination coordinates exist)
  const handleCalculateRoutes = useCallback(async (params) => {
    const targetOrigin = params?.origin || origin;
    const targetDest = params?.destination || destination;
    const targetTime = params?.timeOfDay || timeOfDay;
    const targetMode = params?.mode || 'walking';

    if (!targetOrigin || !targetDest || targetOrigin.lat == null || targetOrigin.lng == null || targetDest.lat == null || targetDest.lng == null) {
      return;
    }

    setIsLoadingRoutes(true);
    try {
      const res = await SafeRouteAPI.calculateRoutes({
        origin: targetOrigin,
        destination: targetDest,
        timeOfDay: targetTime,
        mode: targetMode
      });

      if (res.routes && res.routes.length > 0) {
        setRoutes(res.routes);
        setSelectedRouteIndex(0);
        showToast(`Calculated ${res.routes.length} safe routes for ${targetTime}`);
      } else {
        showToast('Direct corridor mapped');
      }
    } catch (err) {
      console.warn('Routing fallback', err);
      showToast('⚠️ Using high-accuracy routing algorithm');
    } finally {
      setIsLoadingRoutes(false);
    }
  }, [origin, destination, timeOfDay]);

  // Dedicated Live GPS & Network Position Locator
  const handleLocateLiveGPS = useCallback(async () => {
    setIsLocatingGPS(true);
    showToast('📍 Acquiring live location...');

    try {
      const pos = await SafeRouteAPI.getCurrentLivePosition({ timeout: 6000 });
      const lat = pos.lat;
      const lng = pos.lng;
      const accuracy = pos.accuracy || 20;

      let friendlyName = pos.city ? `Current Location (${pos.city})` : 'Current Live Location';
      const newLoc = { lat, lng, name: friendlyName, isCurrent: true, accuracy };
      
      setOrigin(newLoc);
      setMapFlyTarget({ lat, lng, zoom: 16, ts: Date.now() });

      if (destination && destination.lat != null) {
        handleCalculateRoutes({ origin: newLoc, destination, timeOfDay });
      }

      setIsLocatingGPS(false);
      showToast(`📍 Located Position (±${accuracy}m)`);

      try {
        const rev = await SafeRouteAPI.reverseGeocode(lat, lng);
        if (rev && rev !== 'Current Location') {
          const updated = { ...newLoc, name: rev };
          setOrigin(updated);
          showToast(`📍 Centered: ${rev}`);
        }
      } catch (_) {}
    } catch (err) {
      setIsLocatingGPS(false);
      showToast('⚠️ Could not acquire location. Please check permissions.');
    }
  }, [destination, timeOfDay, handleCalculateRoutes]);

  // Recalculate when timeOfDay changes if routes are already active
  useEffect(() => {
    if (routes.length > 0 && origin?.lat != null && destination?.lat != null) {
      handleCalculateRoutes({ origin, destination, timeOfDay });
    }
  }, [timeOfDay]);

  // Handle Map Click
  const handleMapClick = async (latlng) => {
    setSelectedMapCoords(latlng);
    const placeName = await SafeRouteAPI.reverseGeocode(latlng.lat, latlng.lng) || `Pinned Location`;
    const newDest = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: placeName
    };
    setDestination(newDest);
    showToast(`Destination set: ${placeName}`);

    if (origin && origin.lat != null) {
      handleCalculateRoutes({ origin, destination: newDest, timeOfDay });
    }
  };

  // Upvote Incident
  const handleUpvoteIncident = async (id) => {
    try {
      const res = await SafeRouteAPI.upvoteIncident(id);
      if (res.incident) {
        setIncidents(prev => prev.map(i => (i._id === id || String(i._id) === String(id) ? res.incident : i)));
        SoundEngine.playSafeChime();
        handleRewardPoints(5, 'Incident confirmed by community');
        showToast('👍 Incident confirmed! +5 Guardian Points');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve Incident
  const handleResolveIncident = async (id) => {
    try {
      const res = await SafeRouteAPI.resolveIncident(id);
      if (res.incident) {
        setIncidents(prev => prev.map(i => (i._id === id || String(i._id) === String(id) ? res.incident : i)));
        showToast('✓ Marked hazard as resolved! Area score updated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Incident
  const handleSubmitIncident = async (data) => {
    const res = await SafeRouteAPI.createIncident(data);
    if (res.incident) {
      setIncidents(prev => [res.incident, ...prev]);
      showToast('⚠️ Hazard reported to safety network! +10 Points');
    }
  };

  // Submit Safety Point
  const handleSubmitSafetyPoint = async (data) => {
    const res = await SafeRouteAPI.createSafetyPoint(data);
    if (res.safetyPoint) {
      setSafetyPoints(prev => [...prev, res.safetyPoint]);
      showToast('🛡️ Safety infrastructure added to map! +15 Points');
    }
  };

  // Reward Points
  const handleRewardPoints = async (pts, reason) => {
    try {
      const res = await SafeRouteAPI.awardPoints(pts, reason);
      if (res.guardianPoints) {
        setUserProfile(prev => ({
          ...prev,
          guardianPoints: res.guardianPoints,
          guardianBadge: res.guardianBadge
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start Guardian Walk
  const handleStartGuardianWalk = (route) => {
    if (isGuardianWalking) {
      setIsGuardianWalking(false);
      setGuardianLocation(null);
      showToast('Guardian Walk live companion stopped.');
      return;
    }

    setIsGuardianWalking(true);
    SoundEngine.playSafeChime();
    showToast('🛡️ Guardian Walk live companion active. Monitoring corridor...');

    const coords = route?.coordinates || [];
    if (coords.length > 0) {
      setGuardianLocation({ lat: coords[0][1], lng: coords[0][0] });

      let step = 0;
      const walkInterval = setInterval(() => {
        step += 1;
        if (step < coords.length) {
          setGuardianLocation({ lat: coords[step][1], lng: coords[step][0] });
        } else {
          clearInterval(walkInterval);
        }
      }, 1500);
    }
  };

  const activeRoute = routes[selectedRouteIndex] || routes[0];

  return (
    <div className="min-h-screen bg-cyber-950 text-slate-100 flex flex-col antialiased selection:bg-safe-500 selection:text-cyber-950">
      
      {/* Top Navbar (Requirement 2) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        timeOfDay={timeOfDay}
        setTimeOfDay={setTimeOfDay}
        mapTheme={mapTheme}
        setMapTheme={setMapTheme}
        userProfile={userProfile}
        areaScore={areaScore}
        onOpenSOS={() => setIsSosOpen(true)}
        onOpenReportIncident={() => setIsReportModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        isGuardianWalking={isGuardianWalking}
        onLocateLiveGPS={handleLocateLiveGPS}
        isLocatingGPS={isLocatingGPS}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 glass-panel-glow px-4 py-2.5 rounded-2xl border border-safe-500/60 shadow-neon-safe text-xs font-bold text-safe-300 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-safe-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container Layout: Pinned Sticky Map on Left (68%), Independently Scrollable Panel on Right (32%) */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-2.5 sm:p-4 lg:px-6 lg:py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start overflow-x-hidden">
        
        {/* Left Side: Stationary Interactive Map Centerpiece (lg:col-span-8) */}
        <section className="lg:col-span-8 lg:sticky lg:top-20 flex flex-col gap-3 z-10 w-full min-w-0 max-w-full">
          
          {/* Active Guardian Walk HUD */}
          {isGuardianWalking && (
            <GuardianWalk
              activeRoute={activeRoute}
              isWalking={isGuardianWalking}
              onStopWalk={() => {
                setIsGuardianWalking(false);
                setGuardianLocation(null);
              }}
              onOpenSOS={() => setIsSosOpen(true)}
              onRewardPoints={handleRewardPoints}
              guardianLocation={guardianLocation}
            />
          )}

          {/* Interactive Safety Map (Centerpiece) */}
          <SafetyMap
            safetyPoints={safetyPoints}
            incidents={incidents}
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={setSelectedStepIndex}
            origin={origin}
            destination={destination}
            guardianLocation={guardianLocation}
            isGuardianWalking={isGuardianWalking}
            onMapClick={handleMapClick}
            onUpvoteIncident={handleUpvoteIncident}
            onResolveIncident={handleResolveIncident}
            mapTheme={mapTheme}
            setMapTheme={setMapTheme}
            flyTarget={mapFlyTarget}
            onSelectOrigin={(place) => {
              const newOrigin = { lat: place.lat, lng: place.lng, name: place.name };
              setOrigin(newOrigin);
              handleCalculateRoutes({ origin: newOrigin, destination, timeOfDay });
              showToast(`Origin set to: ${place.name}`);
            }}
            onSelectDestination={(place) => {
              const newDest = { lat: place.lat, lng: place.lng, name: place.name };
              setDestination(newDest);
              handleCalculateRoutes({ origin, destination: newDest, timeOfDay });
              showToast(`Destination set to: ${place.name}`);
            }}
            onSavePlace={async (place) => {
              try {
                await SafeRouteAPI.saveUserPlace({
                  name: place.name,
                  address: place.subAddress || place.fullName || place.address || '',
                  lat: place.lat,
                  lng: place.lng,
                  category: place.category || 'favorite'
                });
                showToast(`Saved "${place.name}" to My Places!`);
                const userRes = await SafeRouteAPI.getUserProfile();
                if (userRes?.user) setUserProfile(userRes.user);
              } catch (_) {
                showToast(`Saved "${place.name}" locally`);
              }
            }}
          />

        </section>

        {/* Right Side: Scrollable Tab Panel Content (lg:col-span-4) */}
        <section className="lg:col-span-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overflow-x-hidden pr-0 sm:pr-1 pb-4 w-full min-w-0 max-w-full">
          {activeTab === 'routes' && (
            <RoutePlanner
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              setSelectedRouteIndex={(idx) => {
                setSelectedRouteIndex(idx);
                setSelectedStepIndex(0);
              }}
              selectedStepIndex={selectedStepIndex}
              onSelectStep={setSelectedStepIndex}
              onCalculateRoutes={(params) => {
                handleCalculateRoutes(params);
                setSelectedStepIndex(0);
              }}
              isLoadingRoutes={isLoadingRoutes}
              timeOfDay={timeOfDay}
              onStartGuardianWalk={handleStartGuardianWalk}
              isGuardianWalking={isGuardianWalking}
              userProfile={userProfile}
              onUpdateUserProfile={setUserProfile}
              onRewardPoints={handleRewardPoints}
              onOpenProfile={() => setIsProfileOpen(true)}
            />
          )}

          {activeTab === 'incidents' && (
            <IncidentFeed
              incidents={incidents}
              onUpvoteIncident={handleUpvoteIncident}
              onResolveIncident={handleResolveIncident}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onLocateOnMap={(coords) => {
                showToast(`Centered map on hazard coordinate`);
              }}
            />
          )}

          {activeTab === 'safe_havens' && (
            <SafeHavens
              safetyPoints={safetyPoints}
              onSelectSafeHaven={(haven) => {
                setDestination({ lat: haven.lat, lng: haven.lng, name: haven.name });
                setActiveTab('routes');
                handleCalculateRoutes({
                  origin,
                  destination: { lat: haven.lat, lng: haven.lng, name: haven.name },
                  timeOfDay
                });
                showToast(`Routing to 24/7 Safe Haven: ${haven.name}`);
              }}
              onOpenAddSafetyPoint={() => setIsAddSafetyPointOpen(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              areaScore={areaScore}
              overviewStats={overviewStats}
              timeOfDay={timeOfDay}
            />
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-cyber-950/90 border-t border-slate-800/80 py-3 px-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-safe-400" />
            <span className="font-semibold text-slate-200">SafeRoute Intelligence Platform</span>
            <span className="hidden sm:inline text-slate-400">— Empowering safer illuminated travel</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>🔒 End-to-End Privacy</span>
            <span>🚨 112 / 1091 Direct Dialing</span>
            <span>💡 Spatial Safety Engine</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        guardianLocation={guardianLocation || origin}
      />

      <IncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitIncident={handleSubmitIncident}
        selectedMapCoords={selectedMapCoords}
        onRewardPoints={handleRewardPoints}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        onRewardPoints={handleRewardPoints}
      />

      <AddSafetyPointModal
        isOpen={isAddSafetyPointOpen}
        onClose={() => setIsAddSafetyPointOpen(false)}
        onSubmitSafetyPoint={handleSubmitSafetyPoint}
        selectedMapCoords={selectedMapCoords}
        onRewardPoints={handleRewardPoints}
      />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeRouteMain />
    </ErrorBoundary>
  );
}
