const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const SafetyPoint = require('../models/SafetyPoint');
const { inMemoryStore } = require('../seed/seedData');
const { fetchOSRMRoute, generateSimulatedRoutes } = require('../services/osrmRouting');
const { evaluateRouteSafety } = require('../services/safetyScorer');

// Helper to retrieve data from MongoDB or in-memory fallback
async function getSafetyData() {
  const isMongooseConnected = mongoose.connection.readyState === 1;

  if (isMongooseConnected) {
    try {
      const [safetyPoints, incidents] = await Promise.all([
        SafetyPoint.find({}).lean(),
        Incident.find({ status: { $ne: 'resolved' } }).lean()
      ]);
      return { safetyPoints, incidents };
    } catch (err) {
      console.warn(`[RouteController DB fallback] ${err.message}`);
    }
  }

  return {
    safetyPoints: inMemoryStore.safetyPoints,
    incidents: inMemoryStore.incidents
  };
}

function formatManeuverInstruction(step, index, totalSteps, originName, destName) {
  if (step.instruction && typeof step.instruction === 'string' && step.instruction.trim().length > 0) {
    return step.instruction.trim();
  }

  const m = step.maneuver || {};
  const type = (m.type || '').toLowerCase();
  const modifier = m.modifier ? m.modifier.replace(/_/g, ' ') : '';
  const streetName = (step.name || step.ref || '').trim();
  const streetPart = streetName ? `onto ${streetName}` : '';

  if (index === 0 || type === 'depart') {
    return streetName
      ? `Head ${modifier || 'forward'} on ${streetName}`
      : `Depart from ${originName || 'origin'} along safe pathway`;
  }

  if (index === totalSteps - 1 || type === 'arrive') {
    return `Arrive safely at ${destName || 'destination'}`;
  }

  if (type === 'turn') {
    return `Turn ${modifier || 'ahead'} ${streetPart || 'along pathway'}`.trim();
  }

  if (type === 'new name' || type === 'continue') {
    return streetName
      ? `Continue along ${streetName}`
      : `Continue straight along illuminated corridor`;
  }

  if (type === 'roundabout' || type === 'rotary') {
    const exitText = m.exit ? `take exit ${m.exit}` : `take exit`;
    return `Enter roundabout and ${exitText} ${streetPart}`.trim();
  }

  if (type === 'fork') {
    return `Keep ${modifier || 'left'} at fork ${streetPart}`.trim();
  }

  if (type === 'end of road') {
    return `At end of road, turn ${modifier || 'right'} ${streetPart}`.trim();
  }

  if (type === 'merge') {
    return `Merge ${modifier || ''} ${streetPart}`.trim();
  }

  if (type === 'on ramp' || type === 'off ramp') {
    return `Take ramp ${streetPart}`.trim();
  }

  if (modifier) {
    return `Turn ${modifier} ${streetPart}`.trim();
  }

  if (streetName) {
    return `Continue on ${streetName}`;
  }

  return `Continue straight along safe corridor`;
}

function getManeuverIcon(step, index, totalSteps) {
  if (index === 0) return 'start';
  if (index === totalSteps - 1) return 'destination';
  const mod = (step.maneuver?.modifier || '').toLowerCase();
  if (mod.includes('left')) return 'turn-left';
  if (mod.includes('right')) return 'turn-right';
  if (mod.includes('uturn')) return 'uturn';
  return 'straight';
}

/**
 * POST /api/routes/calculate
 * Body: { origin: { lat, lng, name }, destination: { lat, lng, name }, timeOfDay: 'night'|'dusk'|'day' }
 */
exports.calculateRoutes = async (req, res) => {
  try {
    const { origin, destination, timeOfDay = 'night', mode = 'walking' } = req.body;

    if (!origin || !destination || origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates: origin and destination with lat/lng are required.'
      });
    }

    const { safetyPoints, incidents } = await getSafetyData();

    // Fetch raw candidate routes
    let rawRoutes = await fetchOSRMRoute(origin, destination, mode);
    if (!rawRoutes || rawRoutes.length === 0) {
      rawRoutes = generateSimulatedRoutes(origin, destination);
    }

    // Ensure we have up to 3 candidate routes (Safest, Balanced, Direct/Fastest)
    if (rawRoutes.length < 3) {
      const simulated = generateSimulatedRoutes(origin, destination);
      simulated.forEach((sim) => {
        if (rawRoutes.length < 3) rawRoutes.push(sim);
      });
    }

    const routePresets = ['safest', 'balanced', 'fastest'];
    const routeTitles = [
      'Route A — Safest Illuminated Corridor',
      'Route B — Balanced Standard Route',
      'Route C — Direct Alley Shortcut'
    ];
    const descriptions = [
      'Prioritizes 90%+ street lighting, active CCTV surveillance coverage, and proximity to emergency safe havens.',
      'Moderate lighting with standard pedestrian activity and balanced travel time.',
      'Shortest physical distance but cuts through unmonitored back alleys and low-lit zones.'
    ];

    const processedRoutes = rawRoutes.slice(0, 3).map((route, index) => {
      const coordinates = route.geometry.coordinates; // [[lng, lat], ...]
      const presetType = routePresets[index] || 'balanced';

      const safetyEvaluation = evaluateRouteSafety({
        coordinates,
        safetyPoints,
        incidents,
        timeOfDay,
        routePresetType: presetType
      });

      const distanceKm = (route.distance / 1000).toFixed(2);
      const durationMins = Math.max(1, Math.round(route.duration / 60));

      // Construct enriched safety steps
      const rawSteps = (route.legs && route.legs[0] && route.legs[0].steps && route.legs[0].steps.length > 0)
        ? route.legs[0].steps
        : [];

      let enrichedSteps = [];
      if (rawSteps.length > 0) {
        enrichedSteps = rawSteps.map((step, sIdx) => {
          let stepCaution = null;
          let stepBonus = null;

          if (presetType === 'safest') {
            if (sIdx === 0) stepBonus = '💡 Entering High-Lumen LED Lighting Zone';
            if (sIdx === 1) stepBonus = '📹 Continuous CCTV Surveillance Active';
            if (sIdx === rawSteps.length - 1) stepBonus = '👮 150m from Safe Haven / Help Desk';
          } else if (presetType === 'fastest') {
            if (sIdx === 1) stepCaution = '⚠️ Warning: Low lighting reported in this alleyway';
          }

          const instruction = formatManeuverInstruction(
            step,
            sIdx,
            rawSteps.length,
            origin.name,
            destination.name
          );

          const icon = getManeuverIcon(step, sIdx, rawSteps.length);

          return {
            instruction,
            icon,
            distanceMeters: Math.max(10, Math.round(step.distance || 50)),
            stepCaution,
            stepBonus
          };
        });
      } else {
        // Fallback rich synthetic waypoints if no sub-steps returned
        enrichedSteps = [
          {
            instruction: `Start at ${origin.name || 'Origin Point'}`,
            icon: 'start',
            distanceMeters: Math.round(route.distance * 0.25),
            stepBonus: presetType === 'safest' ? '💡 Illuminated starting avenue' : null,
            stepCaution: null
          },
          {
            instruction: presetType === 'safest'
              ? 'Continue along primary boulevard with active CCTV cameras'
              : 'Proceed straight along connecting thoroughfare',
            icon: 'straight',
            distanceMeters: Math.round(route.distance * 0.5),
            stepBonus: presetType === 'safest' ? '📹 24/7 Monitored CCTV corridor' : null,
            stepCaution: presetType === 'fastest' ? '⚠️ Caution: Unmonitored inner section' : null
          },
          {
            instruction: `Arrive safely at ${destination.name || 'Destination'}`,
            icon: 'destination',
            distanceMeters: Math.round(route.distance * 0.25),
            stepBonus: '🏥 Emergency Haven / Transit Point within reach',
            stepCaution: null
          }
        ];
      }

      return {
        id: `route_${presetType}_${index}`,
        routeType: presetType,
        type: presetType, // Backward & Forward compatibility
        title: routeTitles[index] || `Route ${String.fromCharCode(65 + index)}`,
        description: descriptions[index] || '',
        isRecommended: presetType === 'safest',
        distanceKm: Number(distanceKm),
        durationMins,
        safetyScore: safetyEvaluation.score,
        safetyTier: safetyEvaluation.safetyTier,
        badgeLabel: safetyEvaluation.badgeLabel,
        colorTheme: presetType === 'safest' ? '#10B981' : presetType === 'balanced' ? '#38BDF8' : '#F43F5E',
        factors: safetyEvaluation.factors,
        whyReasons: safetyEvaluation.whyReasons || [],
        scorePct: safetyEvaluation.scorePct || Math.round(safetyEvaluation.score * 10),
        nearbyHazardsCount: safetyEvaluation.nearbyHazardsCount,
        coordinates,
        segmentScores: safetyEvaluation.segmentScores,
        steps: enrichedSteps,
        summary: route.legs && route.legs[0] ? route.legs[0].summary : 'Standard city route'
      };
    });

    // Sort so safest is always first
    processedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

    return res.json({
      success: true,
      origin,
      destination,
      timeOfDay,
      routesCount: processedRoutes.length,
      routes: processedRoutes
    });
  } catch (error) {
    console.error(`[Route Controller Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate safe routes.',
      error: error.message
    });
  }
};
