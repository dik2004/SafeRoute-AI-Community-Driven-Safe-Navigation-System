import { searchHierarchy } from '../data/locationHierarchy';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[SafeRoute API Notice] ${endpoint} -> ${error.message}`);
    throw error;
  }
}

export const SafeRouteAPI = {
  // Health
  checkHealth: async () => {
    return await request('/health');
  },

  // Routes
  calculateRoutes: async ({ origin, destination, timeOfDay = 'night', mode = 'walking' }) => {
    return await request('/routes/calculate', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, timeOfDay, mode })
    });
  },

  // Incidents
  getIncidents: async () => {
    return await request('/incidents');
  },

  createIncident: async (incidentData) => {
    return await request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData)
    });
  },

  upvoteIncident: async (id) => {
    return await request(`/incidents/${id}/upvote`, {
      method: 'PATCH'
    });
  },

  resolveIncident: async (id) => {
    return await request(`/incidents/${id}/resolve`, {
      method: 'PATCH'
    });
  },

  // Safety Points
  getSafetyPoints: async (type = '') => {
    return await request(`/safety-points${type ? `?type=${type}` : ''}`);
  },

  createSafetyPoint: async (pointData) => {
    return await request('/safety-points', {
      method: 'POST',
      body: JSON.stringify(pointData)
    });
  },

  // Analytics
  getAreaScore: async (lat = 28.6289, lng = 77.2065, localityName = 'Central Urban Corridor') => {
    return await request(`/analytics/area-score?lat=${lat}&lng=${lng}&localityName=${encodeURIComponent(localityName)}`);
  },

  getOverviewStats: async () => {
    return await request('/analytics/overview');
  },

  // User Profile
  getUserProfile: async () => {
    return await request('/user/profile');
  },

  updateUserProfile: async (data) => {
    return await request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  addContact: async (contact) => {
    return await request('/user/contacts', {
      method: 'POST',
      body: JSON.stringify(contact)
    });
  },

  deleteContact: async (index) => {
    return await request(`/user/contacts/${index}`, {
      method: 'DELETE'
    });
  },

  addSavedPlace: async (place) => {
    return await request('/user/places', {
      method: 'POST',
      body: JSON.stringify(place)
    });
  },

  deleteSavedPlace: async (index) => {
    return await request(`/user/places/${index}`, {
      method: 'DELETE'
    });
  },

  awardPoints: async (points, reason) => {
    return await request('/user/points', {
      method: 'POST',
      body: JSON.stringify({ points, reason })
    });
  },

  // Emergency SOS
  triggerSOS: async (sosPayload) => {
    return await request('/sos/trigger', {
      method: 'POST',
      body: JSON.stringify(sosPayload)
    });
  },

  cancelSOS: async (alertId) => {
    return await request('/sos/cancel', {
      method: 'POST',
      body: JSON.stringify({ alertId })
    });
  },

  // High-Speed Worldwide Google Maps-Style Geocoding (Hierarchy + Photon + Nominatim)
  searchGlobalPlaces: async (query) => {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    const results = [];
    const seenCoords = new Set();

    // 1. Instant match from curated hierarchy dataset (0ms latency)
    try {
      const hierarchyMatches = searchHierarchy(q);
      for (const item of hierarchyMatches) {
        const key = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
        if (!seenCoords.has(key)) {
          seenCoords.add(key);
          results.push({
            name: item.street || item.place || item.city,
            subAddress: `${item.place ? item.place + ', ' : ''}${item.city}, ${item.country} ${item.flag || ''}`,
            fullName: item.fullName,
            lat: Number(item.lat),
            lng: Number(item.lng),
            category: 'landmark',
            type: 'curated_safe_corridor',
            country: item.country,
            city: item.city,
            safetyTier: item.safetyTier,
            landmark: item.landmark
          });
        }
      }
    } catch (_) {}

    // 2. Global live search via Komoot Photon (Fast Google Maps-like typeahead)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`;
      const pRes = await fetch(photonUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData && pData.features && pData.features.length > 0) {
          for (const f of pData.features) {
            const props = f.properties || {};
            const [lng, lat] = f.geometry.coordinates;
            const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
            if (!seenCoords.has(key)) {
              seenCoords.add(key);
              const primaryName = props.name || props.street || props.city || q;
              const addrParts = [props.street, props.city, props.state, props.country].filter(Boolean);
              const subAddress = addrParts.length > 0 ? addrParts.join(', ') : (props.country || 'Global Location');

              let category = 'place';
              const osm = (props.osm_value || props.type || '').toLowerCase();
              if (osm.includes('station') || osm.includes('subway') || osm.includes('bus') || osm.includes('railway') || osm.includes('transit')) {
                category = 'transit';
              } else if (osm.includes('hospital') || osm.includes('clinic') || osm.includes('pharmacy') || osm.includes('doctor')) {
                category = 'hospital';
              } else if (osm.includes('monument') || osm.includes('attraction') || osm.includes('tourism') || osm.includes('museum')) {
                category = 'landmark';
              } else if (osm.includes('highway') || osm.includes('street') || osm.includes('residential') || osm.includes('road')) {
                category = 'street';
              } else if (osm.includes('building') || osm.includes('commercial') || osm.includes('office') || osm.includes('shop')) {
                category = 'building';
              }

              results.push({
                name: primaryName,
                subAddress,
                fullName: `${primaryName}, ${subAddress}`,
                lat: Number(lat),
                lng: Number(lng),
                category,
                type: props.type || 'place',
                country: props.country || '',
                city: props.city || props.state || '',
                postcode: props.postcode || ''
              });
            }
          }
        }
      }
    } catch (photonErr) {
      console.warn('Photon geocode notice:', photonErr.message);
    }

    // 3. Fallback to OpenStreetMap Nominatim if fewer than 4 results
    if (results.length < 4) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
        const res = await fetch(nomUrl, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const data = await res.json();
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
            if (!seenCoords.has(key)) {
              seenCoords.add(key);
              const parts = item.display_name.split(',').map(p => p.trim());
              const primaryName = parts[0] || q;
              const subAddress = parts.slice(1, 4).join(', ') || parts.slice(1).join(', ');

              results.push({
                name: primaryName,
                subAddress,
                fullName: item.display_name,
                lat,
                lng,
                category: item.type === 'station' ? 'transit' : item.type === 'hospital' ? 'hospital' : 'place',
                type: item.type || 'place',
                country: item.address?.country || '',
                city: item.address?.city || item.address?.town || item.address?.state || ''
              });
            }
          }
        }
      } catch (nomErr) {
        console.warn('Nominatim geocode notice:', nomErr.message);
      }
    }

    return results.slice(0, 10);
  },

  // Robust Live Position Acquisition (Browser GPS + Fast Network IP Fallback)
  getCurrentLivePosition: async (options = { timeout: 6000 }) => {
    // 1. Try Browser Geolocation API first
    if (typeof window !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: options.timeout || 6000, maximumAge: 0 }
          );
        });
        if (pos?.coords?.latitude != null && pos?.coords?.longitude != null) {
          return {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 10),
            source: 'gps'
          };
        }
      } catch (err) {
        console.warn('[Live GPS Notice] Browser GPS unavailable or timed out, trying IP fallback:', err.message);
      }
    }

    // 2. High-Speed Free IP Geolocation Fallback
    try {
      const res = await fetch('https://ipwho.is/');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.latitude != null && data.longitude != null) {
          return {
            lat: data.latitude,
            lng: data.longitude,
            accuracy: 800,
            city: data.city || data.region,
            source: 'network_ip'
          };
        }
      }
    } catch (_) {}

    try {
      const res2 = await fetch('https://freeipapi.com/api/json');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.latitude != null && data2.longitude != null) {
          return {
            lat: data2.latitude,
            lng: data2.longitude,
            accuracy: 800,
            city: data2.cityName || data2.regionName,
            source: 'network_ip'
          };
        }
      }
    } catch (_) {}

    // Fallback default coordinates if all fail (Connaught Place / Center)
    return {
      lat: 28.6289,
      lng: 77.2065,
      accuracy: 1500,
      city: 'Delhi',
      source: 'fallback'
    };
  },

  reverseGeocode: async (lat, lng) => {
    try {
      const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`;
      const pRes = await fetch(photonUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData?.features?.[0]?.properties) {
          const props = pData.features[0].properties;
          const locality = props.district || props.suburb || props.neighbourhood || props.name || props.street || '';
          const city = props.city || props.town || props.state || props.country || '';
          if (locality && city) {
            // Privacy filter: remove house numbers and raw digits
            const cleanLocality = locality.replace(/^(flat|plot|house|no\.?|apt\.?)\s*\d+[\w-]*\s*,?/i, '').replace(/^\d+[\w-]*\s*,?/, '').trim();
            return `Near ${cleanLocality || locality}, ${city}`;
          }
          if (locality) return `Near ${locality}`;
          if (city) return `Near ${city}`;
        }
      }
    } catch (_) {}

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const landmark = addr.attraction || addr.tourism || addr.neighbourhood || addr.suburb || addr.road || '';
        const city = addr.city || addr.town || addr.county || addr.state || '';
        if (landmark && city) {
          return `Near ${landmark}, ${city}`;
        }
        if (landmark) return `Near ${landmark}`;
        if (city) return `Near ${city}`;
      }
    } catch (_) {}

    return 'Current Location';
  },

  // Dynamic nearby category place finder for any coordinate globally
  findNearbyCategoryPlaces: async (lat, lng, category = 'transit') => {
    const query = category === 'transit'
      ? 'metro station train subway transit'
      : category === 'hospital'
      ? 'hospital emergency medical clinic'
      : 'police station safe haven';

    try {
      if (lat != null && lng != null) {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${lat}&lon=${lng}&limit=4&lang=en`;
        const pRes = await fetch(photonUrl);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData && pData.features && pData.features.length > 0) {
            return pData.features.map(f => {
              const props = f.properties || {};
              const [fLng, fLat] = f.geometry.coordinates;
              const primaryName = props.name || props.street || (category === 'transit' ? 'Transit Station' : category === 'hospital' ? 'Emergency Hospital' : 'Safe Haven');
              const subAddress = [props.street, props.city, props.state, props.country].filter(Boolean).join(', ') || 'Nearby Location';
              return {
                name: primaryName,
                subAddress,
                fullName: `${primaryName}, ${subAddress}`,
                lat: Number(fLat),
                lng: Number(fLng),
                category
              };
            });
          }
        }
      }
    } catch (err) {
      console.warn('Nearby place search notice:', err.message);
    }

    // Fallback search
    return await SafeRouteAPI.searchGlobalPlaces(category === 'transit' ? 'Metro Station' : category === 'hospital' ? 'Emergency Hospital' : 'Safe Haven');
  }
};

// ==========================================
// Web Audio Synthesizer (Zero external audio files needed)
// ==========================================
let activeAudioCtx = null;
let activeSirenOsc1 = null;
let activeSirenGain = null;
let sirenInterval = null;

export const SoundEngine = {
  init: () => {
    if (!activeAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) activeAudioCtx = new AudioCtx();
    }
    if (activeAudioCtx && activeAudioCtx.state === 'suspended') {
      activeAudioCtx.resume();
    }
    return activeAudioCtx;
  },

  playSafeChime: () => {
    try {
      const ctx = SoundEngine.init();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Harmonic chime chord (C5, E5, G5, C6)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.65);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  },

  playBeaconPing: () => {
    try {
      const ctx = SoundEngine.init();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      console.warn('Audio beacon error', e);
    }
  },

  playSiren: () => {
    try {
      const ctx = SoundEngine.init();
      if (!ctx) return;

      SoundEngine.stopSiren(); // ensure no duplicates

      const now = ctx.currentTime;
      activeSirenGain = ctx.createGain();
      activeSirenGain.gain.setValueAtTime(0.25, now);
      activeSirenGain.connect(ctx.destination);

      activeSirenOsc1 = ctx.createOscillator();
      activeSirenOsc1.type = 'sawtooth';
      activeSirenOsc1.frequency.setValueAtTime(650, now);
      activeSirenOsc1.connect(activeSirenGain);
      activeSirenOsc1.start();

      let toggle = false;
      sirenInterval = setInterval(() => {
        if (!activeAudioCtx || !activeSirenOsc1) return;
        const curTime = activeAudioCtx.currentTime;
        const targetFreq = toggle ? 650 : 980;
        activeSirenOsc1.frequency.linearRampToValueAtTime(targetFreq, curTime + 0.25);
        toggle = !toggle;
      }, 300);
    } catch (e) {
      console.warn('Siren start error', e);
    }
  },

  stopSiren: () => {
    if (sirenInterval) {
      clearInterval(sirenInterval);
      sirenInterval = null;
    }
    if (activeSirenOsc1) {
      try { activeSirenOsc1.stop(); } catch (_) {}
      activeSirenOsc1.disconnect();
      activeSirenOsc1 = null;
    }
    if (activeSirenGain) {
      activeSirenGain.disconnect();
      activeSirenGain = null;
    }
  },
};
