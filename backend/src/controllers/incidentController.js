const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const { inMemoryStore } = require('../seed/seedData');

exports.getIncidents = async (req, res) => {
  try {
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      const incidents = await Incident.find({}).sort({ createdAt: -1 });
      return res.json({ success: true, count: incidents.length, incidents });
    }

    return res.json({
      success: true,
      count: inMemoryStore.incidents.length,
      incidents: inMemoryStore.incidents
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createIncident = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      severity = 'medium',
      coordinates, // [lng, lat]
      address = '',
      timeOfDay = 'night',
      reporterName = 'Community Guardian',
      tags = []
    } = req.body;

    if (!title || !category || !coordinates || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and valid coordinates [lng, lat] are required.'
      });
    }

    const newIncidentData = {
      title,
      description: description || '',
      category,
      severity,
      location: {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])]
      },
      address,
      timeOfDay,
      reporterName,
      tags,
      upvotes: 1,
      verified: severity === 'critical' ? false : true,
      verifiedCount: 1,
      status: 'active',
      reportedAt: new Date(),
    };

    const isMongooseConnected = mongoose.connection.readyState === 1;

    let savedIncident;
    if (isMongooseConnected) {
      savedIncident = await Incident.create(newIncidentData);
    } else {
      savedIncident = {
        ...newIncidentData,
        _id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryStore.incidents.unshift(savedIncident);
    }

    return res.status(201).json({
      success: true,
      message: 'Incident reported successfully! The community has been alerted.',
      incident: savedIncident
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.upvoteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected && mongoose.Types.ObjectId.isValid(id)) {
      const incident = await Incident.findById(id);
      if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });

      incident.upvotes += 1;
      incident.verifiedCount += 1;
      if (incident.verifiedCount >= 3) incident.verified = true;
      await incident.save();

      return res.json({ success: true, incident });
    }

    // Fallback store
    const memInc = inMemoryStore.incidents.find(i => i._id === id || String(i._id) === id);
    if (memInc) {
      memInc.upvotes = (memInc.upvotes || 0) + 1;
      memInc.verifiedCount = (memInc.verifiedCount || 1) + 1;
      if (memInc.verifiedCount >= 3) memInc.verified = true;
      return res.json({ success: true, incident: memInc });
    }

    return res.status(404).json({ success: false, message: 'Incident not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected && mongoose.Types.ObjectId.isValid(id)) {
      const incident = await Incident.findByIdAndUpdate(id, { status: 'resolved' }, { new: true });
      return res.json({ success: true, incident });
    }

    const memInc = inMemoryStore.incidents.find(i => i._id === id || String(i._id) === id);
    if (memInc) {
      memInc.status = 'resolved';
      return res.json({ success: true, incident: memInc });
    }

    return res.status(404).json({ success: false, message: 'Incident not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
