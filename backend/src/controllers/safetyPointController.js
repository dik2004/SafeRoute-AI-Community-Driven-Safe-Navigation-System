const mongoose = require('mongoose');
const SafetyPoint = require('../models/SafetyPoint');
const { inMemoryStore } = require('../seed/seedData');

exports.getSafetyPoints = async (req, res) => {
  try {
    const { type } = req.query;
    const isMongooseConnected = mongoose.connection.readyState === 1;

    let filter = {};
    if (type) filter.type = type;

    if (isMongooseConnected) {
      const points = await SafetyPoint.find(filter);
      return res.json({ success: true, count: points.length, safetyPoints: points });
    }

    let points = inMemoryStore.safetyPoints;
    if (type) {
      points = points.filter(p => p.type === type);
    }

    return res.json({
      success: true,
      count: points.length,
      safetyPoints: points
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSafetyPoint = async (req, res) => {
  try {
    const { name, type, coordinates, address, coverageRadiusMeters, details } = req.body;

    if (!name || !type || !coordinates || coordinates.length < 2) {
      return res.status(400).json({ success: false, message: 'Name, type, and coordinates are required.' });
    }

    const newPoint = {
      name,
      type,
      location: {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])]
      },
      address: address || '',
      coverageRadiusMeters: coverageRadiusMeters || 50,
      details: details || {}
    };

    const isMongooseConnected = mongoose.connection.readyState === 1;

    let saved;
    if (isMongooseConnected) {
      saved = await SafetyPoint.create(newPoint);
    } else {
      saved = {
        ...newPoint,
        _id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date()
      };
      inMemoryStore.safetyPoints.push(saved);
    }

    return res.status(201).json({ success: true, safetyPoint: saved });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
