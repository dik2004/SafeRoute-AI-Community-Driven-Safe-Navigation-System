const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const SafetyPoint = require('../models/SafetyPoint');
const User = require('../models/User');

// Sample Base Locations for Demo: Urban Central & Campus Corridor
// Default Lat/Lng: New Delhi / Connaught Place & University Area (28.6289, 77.2065) + Worldwide Extensible
const BASE_LAT = 28.6289;
const BASE_LNG = 77.2065;

const sampleSafetyPoints = [
  // Police Stations & Women Help Desks
  {
    name: 'Central Police Station (Post #12)',
    type: 'police_station',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0025, BASE_LAT + 0.0015] },
    address: 'Avenue 4, North Block',
    coverageRadiusMeters: 1400,
    details: { phone: '100 / 112', operationalHours: '24/7', crowdLevel: 'high' },
    safetyScoreContribution: 2.5
  },
  {
    name: 'Metro Women Safety Help Desk',
    type: 'women_help_booth',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0035, BASE_LAT + 0.0042] },
    address: 'Metro Station Gate 2 Pedestrian Hub',
    coverageRadiusMeters: 900,
    details: { phone: '1091', operationalHours: '24/7', crowdLevel: 'high' },
    safetyScoreContribution: 2.0
  },
  {
    name: 'District Police Beat Post',
    type: 'police_station',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0065, BASE_LAT - 0.0032] },
    address: 'South Square Crossroads',
    coverageRadiusMeters: 1200,
    details: { phone: '112', operationalHours: '24/7', crowdLevel: 'moderate' },
    safetyScoreContribution: 2.2
  },

  // 24/7 Safe Havens (Hospital / Apollo 24x7 Pharmacy / Metro Station / Cafe)
  {
    name: 'Apollo 24/7 Pharmacy & First-Aid Haven',
    type: 'safe_haven',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0012, BASE_LAT + 0.0038] },
    address: 'Commercial Plaza Ground Floor',
    coverageRadiusMeters: 300,
    details: { operationalHours: '24/7', isWorking: true, crowdLevel: 'high' },
    safetyScoreContribution: 1.5
  },
  {
    name: 'City Care Emergency Hospital',
    type: 'hospital_emergency',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0020, BASE_LAT + 0.0060] },
    address: 'Health Avenue Sector 1',
    coverageRadiusMeters: 600,
    details: { operationalHours: '24/7', isWorking: true, phone: '102' },
    safetyScoreContribution: 1.8
  },
  {
    name: '24-Hour Central Metro Transit Hub',
    type: 'busy_commercial_hub',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0040, BASE_LAT + 0.0040] },
    address: 'Central Station concourse',
    coverageRadiusMeters: 450,
    details: { operationalHours: '24/7', crowdLevel: 'high' },
    safetyScoreContribution: 1.6
  },

  // High-Definition CCTV Cameras along Main Corridors
  {
    name: 'Public AI Surveillance Camera #01',
    type: 'cctv_camera',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0010, BASE_LAT + 0.0010] },
    address: 'Main Boulevard Junction',
    coverageRadiusMeters: 90,
    details: { cameraType: '360 PTZ HD Smart Cam', isWorking: true },
    safetyScoreContribution: 1.0
  },
  {
    name: 'Commercial Bank Surveillance CCTV',
    type: 'cctv_camera',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0018, BASE_LAT + 0.0028] },
    address: 'Banking District Avenue',
    coverageRadiusMeters: 80,
    details: { cameraType: 'Night Vision IR CCTV', isWorking: true },
    safetyScoreContribution: 0.9
  },
  {
    name: 'Smart City Public Traffic Camera #07',
    type: 'cctv_camera',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0015, BASE_LAT + 0.0035] },
    address: 'University Road North',
    coverageRadiusMeters: 100,
    details: { cameraType: 'Smart City HD Cam', isWorking: true },
    safetyScoreContribution: 1.0
  },
  {
    name: 'Metro Overpass Security Camera',
    type: 'cctv_camera',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0038, BASE_LAT + 0.0045] },
    address: 'Metro Overpass Walkway',
    coverageRadiusMeters: 85,
    details: { cameraType: 'Night Vision Dome Cam', isWorking: true },
    safetyScoreContribution: 1.0
  },
  {
    name: 'Community Center CCTV #11',
    type: 'cctv_camera',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0040, BASE_LAT - 0.0015] },
    address: 'Community Park Promenade',
    coverageRadiusMeters: 80,
    details: { cameraType: 'Wide Angle PTZ', isWorking: true },
    safetyScoreContribution: 0.8
  },

  // Smart LED Streetlights along Boulevards
  {
    name: 'High-Lumen Smart LED Pole #101',
    type: 'street_light',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0005, BASE_LAT + 0.0008] },
    address: 'Boulevard Walk East',
    coverageRadiusMeters: 55,
    details: { lumens: 9000, isWorking: true },
    safetyScoreContribution: 0.8
  },
  {
    name: 'High-Lumen Smart LED Pole #102',
    type: 'street_light',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0012, BASE_LAT + 0.0018] },
    address: 'Boulevard Walk East',
    coverageRadiusMeters: 55,
    details: { lumens: 9000, isWorking: true },
    safetyScoreContribution: 0.8
  },
  {
    name: 'High-Lumen Smart LED Pole #103',
    type: 'street_light',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0016, BASE_LAT + 0.0028] },
    address: 'Boulevard Walk East',
    coverageRadiusMeters: 55,
    details: { lumens: 9000, isWorking: true },
    safetyScoreContribution: 0.8
  },
  {
    name: 'High-Lumen Smart LED Pole #104',
    type: 'street_light',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0010, BASE_LAT + 0.0025] },
    address: 'North Connector Road',
    coverageRadiusMeters: 55,
    details: { lumens: 8500, isWorking: true },
    safetyScoreContribution: 0.8
  },
  {
    name: 'High-Lumen Smart LED Pole #105',
    type: 'street_light',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0022, BASE_LAT + 0.0035] },
    address: 'North Connector Road',
    coverageRadiusMeters: 55,
    details: { lumens: 8500, isWorking: true },
    safetyScoreContribution: 0.8
  },
  {
    name: 'High-Lumen Smart LED Pole #106',
    type: 'street_light',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0032, BASE_LAT + 0.0042] },
    address: 'Metro Approach Walkway',
    coverageRadiusMeters: 55,
    details: { lumens: 9500, isWorking: true },
    safetyScoreContribution: 0.8
  }
];

const sampleIncidents = [
  {
    title: 'Broken Street Lights & Dark Alleyway',
    description: 'Multiple streetlights non-functional for past 2 weeks. Alley is completely pitch dark after 8 PM.',
    category: 'poor_lighting',
    severity: 'high',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0018, BASE_LAT - 0.0010] },
    address: 'Back Alley near Old Warehouses',
    timeOfDay: 'night',
    upvotes: 24,
    verified: true,
    verifiedCount: 18,
    status: 'active',
    reporterName: 'Priya S.',
    tags: ['broken-lights', 'dark-alley', 'avoid-at-night']
  },
  {
    title: 'Catcalling & Harassment Reported',
    description: 'Group loitering near closed construction site passing offensive comments to lone pedestrians.',
    category: 'harassment',
    severity: 'critical',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0035, BASE_LAT + 0.0045] },
    address: 'Under-construction flyover underpass',
    timeOfDay: 'late_night',
    upvotes: 42,
    verified: true,
    verifiedCount: 31,
    status: 'active',
    reporterName: 'Ananya R.',
    tags: ['harassment', 'underpass', 'unsafe-night']
  },
  {
    title: 'Deserted Road with No Visibility',
    description: 'Very low pedestrian activity after 9:30 PM, no open shops and overgrown trees blocking view.',
    category: 'deserted_area',
    severity: 'medium',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0050, BASE_LAT + 0.0012] },
    address: 'Service Lane behind Industrial Area',
    timeOfDay: 'night',
    upvotes: 15,
    verified: true,
    verifiedCount: 9,
    status: 'active',
    reporterName: 'Rahul V.',
    tags: ['deserted', 'isolated']
  },
  {
    title: 'Open Trench & Broken Sidewalk Hazard',
    description: 'Deep unbarricaded excavation ditch on the footpath. High risk of tripping in poor light.',
    category: 'physical_hazard',
    severity: 'medium',
    location: { type: 'Point', coordinates: [BASE_LNG + 0.0028, BASE_LAT - 0.0025] },
    address: 'East Cross Road 2',
    timeOfDay: 'any',
    upvotes: 11,
    verified: true,
    verifiedCount: 8,
    status: 'active',
    reporterName: 'Kavita M.',
    tags: ['construction-hazard', 'tripping-risk']
  },
  {
    title: 'Aggressive Stray Dogs Pack',
    description: 'Pack of 6-7 territorial dogs barking aggressively at cyclists and pedestrians after dark.',
    category: 'stray_animals',
    severity: 'low',
    location: { type: 'Point', coordinates: [BASE_LNG - 0.0025, BASE_LAT - 0.0040] },
    address: 'Near Park Boundary Wall',
    timeOfDay: 'night',
    upvotes: 7,
    verified: false,
    verifiedCount: 3,
    status: 'active',
    reporterName: 'Aman D.',
    tags: ['stray-animals']
  }
];

// In-memory runtime data cache for fallback mode
const inMemoryStore = {
  safetyPoints: [...sampleSafetyPoints],
  incidents: [...sampleIncidents.map((inc, i) => ({ ...inc, _id: `inc_${Date.now()}_${i}`, createdAt: new Date() }))],
  users: [
    {
      _id: 'user_guardian_1',
      name: 'SafeRoute Guardian',
      email: 'guardian@saferoute.ai',
      phone: '+91 98765 00001',
      avatar: '🛡️',
      guardianPoints: 120,
      guardianBadge: 'Silver Guardian',
      reportsSubmitted: 3,
      reportsVerified: 8,
      emergencyContacts: [
        { name: 'Mom', phone: '+91 98765 43210', relation: 'Mother', isPrimary: true },
        { name: 'David (Partner)', phone: '+91 91234 56789', relation: 'Partner', isPrimary: false },
        { name: 'Ayesha (Roommate)', phone: '+91 98111 22334', relation: 'Roommate', isPrimary: false }
      ],
      savedPlaces: []
    }
  ]
};

async function seedDatabase() {
  try {
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      console.log('[Seed] Clearing existing MongoDB collections...');
      await SafetyPoint.deleteMany({});
      await Incident.deleteMany({});
      await User.deleteMany({});

      console.log('[Seed] Inserting sample Safety Points...');
      await SafetyPoint.insertMany(sampleSafetyPoints);

      console.log('[Seed] Inserting sample Incidents...');
      await Incident.insertMany(sampleIncidents);

      console.log('[Seed] Inserting sample User Profile...');
      const { _id, ...userData } = inMemoryStore.users[0];
      await User.create(userData);

      console.log(`[Seed] Successfully populated MongoDB with ${sampleSafetyPoints.length} Safety Points and ${sampleIncidents.length} Incidents!`);
    } else {
      console.log('[Seed] MongoDB not connected; in-memory store initialized with rich demo data.');
    }
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
  }
}

if (require.main === module) {
  require('dotenv').config();
  const { connectDB } = require('../config/db');
  connectDB().then(async () => {
    await seedDatabase();
    try {
      await mongoose.disconnect();
    } catch (_) {}
    console.log('[Seed] Done.');
    process.exit(0);
  });
}

module.exports = {
  sampleSafetyPoints,
  sampleIncidents,
  inMemoryStore,
  seedDatabase,
  BASE_LAT,
  BASE_LNG
};
