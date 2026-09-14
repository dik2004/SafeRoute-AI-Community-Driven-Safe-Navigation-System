const express = require('express');
const router = express.Router();

const routeController = require('../controllers/routeController');
const incidentController = require('../controllers/incidentController');
const safetyPointController = require('../controllers/safetyPointController');
const analyticsController = require('../controllers/analyticsController');
const userController = require('../controllers/userController');
const sosController = require('../controllers/sosController');
const { getDBStatus } = require('../config/db');

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SafeRoute API',
    timestamp: new Date().toISOString(),
    database: getDBStatus()
  });
});

// Routing
router.post('/routes/calculate', routeController.calculateRoutes);

// Community Incidents
router.get('/incidents', incidentController.getIncidents);
router.post('/incidents', incidentController.createIncident);
router.patch('/incidents/:id/upvote', incidentController.upvoteIncident);
router.patch('/incidents/:id/resolve', incidentController.resolveIncident);

// Safety Points (CCTV, Lights, Police, Safe Havens)
router.get('/safety-points', safetyPointController.getSafetyPoints);
router.post('/safety-points', safetyPointController.createSafetyPoint);

// Analytics & Area Scoring
router.get('/analytics/area-score', analyticsController.getAreaSafetyScore);
router.get('/analytics/overview', analyticsController.getSystemOverview);

// User Profile, Emergency Contacts & Guardian Rewards
router.get('/user/profile', userController.getProfile);
router.put('/user/profile', userController.updateProfile);
router.post('/user/contacts', userController.addEmergencyContact);
router.delete('/user/contacts/:index', userController.deleteEmergencyContact);
router.post('/user/places', userController.addSavedPlace);
router.delete('/user/places/:index', userController.deleteSavedPlace);
router.post('/user/points', userController.awardPoints);

// Emergency SOS Hub
router.post('/sos/trigger', sosController.triggerSOS);
router.post('/sos/cancel', sosController.cancelSOS);
router.get('/sos/status', sosController.getActiveSOS);

module.exports = router;
