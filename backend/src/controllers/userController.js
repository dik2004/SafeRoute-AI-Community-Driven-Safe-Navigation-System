const mongoose = require('mongoose');
const User = require('../models/User');
const { inMemoryStore } = require('../seed/seedData');

exports.getProfile = async (req, res) => {
  try {
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      let user = await User.findOne({});
      if (!user) {
        const { _id, ...userData } = inMemoryStore.users[0];
        user = await User.create(userData);
      } else if (user.savedPlaces && user.savedPlaces.some(p => p.address && p.address.includes('Apartment 4B'))) {
        user.savedPlaces = [];
        await user.save();
      }
      return res.json({ success: true, user });
    }

    return res.json({
      success: true,
      user: inMemoryStore.users[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, guardianBadge, avatar } = req.body;
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      const user = await User.findOneAndUpdate(
        {},
        { $set: { ...(name && { name }), ...(phone && { phone }), ...(guardianBadge && { guardianBadge }), ...(avatar && { avatar }) } },
        { new: true, upsert: true }
      );
      return res.json({ success: true, user });
    }

    const user = inMemoryStore.users[0];
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (guardianBadge) user.guardianBadge = guardianBadge;
    if (avatar) user.avatar = avatar;

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relation = 'Emergency Contact', isPrimary = false } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    const newContact = { name, phone, relation, isPrimary };
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      const user = await User.findOne({});
      if (user) {
        if (isPrimary) {
          user.emergencyContacts.forEach(c => c.isPrimary = false);
        }
        user.emergencyContacts.push(newContact);
        await user.save();
        return res.json({ success: true, contacts: user.emergencyContacts });
      }
    }

    const user = inMemoryStore.users[0];
    if (isPrimary) {
      user.emergencyContacts.forEach(c => c.isPrimary = false);
    }
    user.emergencyContacts.push(newContact);
    return res.json({ success: true, contacts: user.emergencyContacts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEmergencyContact = async (req, res) => {
  try {
    const { index } = req.params;
    const idx = parseInt(index, 10);
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      const user = await User.findOne({});
      if (user && user.emergencyContacts[idx]) {
        user.emergencyContacts.splice(idx, 1);
        await user.save();
        return res.json({ success: true, contacts: user.emergencyContacts });
      }
    }

    const user = inMemoryStore.users[0];
    if (user.emergencyContacts[idx]) {
      user.emergencyContacts.splice(idx, 1);
      return res.json({ success: true, contacts: user.emergencyContacts });
    }

    return res.status(404).json({ success: false, message: 'Contact index not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.awardPoints = async (req, res) => {
  try {
    const { points = 10, reason = 'Community Contribution' } = req.body;
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      const user = await User.findOne({});
      if (user) {
        user.guardianPoints = (user.guardianPoints || 0) + points;
        if (user.guardianPoints >= 250) user.guardianBadge = 'Guardian Commander';
        else if (user.guardianPoints >= 100) user.guardianBadge = 'Silver Guardian';
        else user.guardianBadge = 'Bronze Guardian';

        if (reason.includes('report')) user.reportsSubmitted = (user.reportsSubmitted || 0) + 1;
        if (reason.includes('verify') || reason.includes('upvote')) user.reportsVerified = (user.reportsVerified || 0) + 1;

        await user.save();
        return res.json({ success: true, guardianPoints: user.guardianPoints, guardianBadge: user.guardianBadge });
      }
    }

    const user = inMemoryStore.users[0];
    user.guardianPoints = (user.guardianPoints || 0) + points;
    if (user.guardianPoints >= 250) user.guardianBadge = 'Guardian Commander';
    else if (user.guardianPoints >= 100) user.guardianBadge = 'Silver Guardian';
    else user.guardianBadge = 'Bronze Guardian';

    if (reason.includes('report')) user.reportsSubmitted = (user.reportsSubmitted || 0) + 1;
    if (reason.includes('verify') || reason.includes('upvote')) user.reportsVerified = (user.reportsVerified || 0) + 1;

    return res.json({ success: true, guardianPoints: user.guardianPoints, guardianBadge: user.guardianBadge });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addSavedPlace = async (req, res) => {
  try {
    const { label, address, lat, lng, icon = 'map-pin', details = '' } = req.body;

    if (!label || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'Label, latitude, and longitude are required.' });
    }

    const newPlace = {
      label,
      address: address || label,
      lat: Number(lat),
      lng: Number(lng),
      icon: icon || 'map-pin',
      details: details || '',
      createdAt: new Date()
    };

    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      let user = await User.findOne({});
      if (user) {
        if (!user.savedPlaces) user.savedPlaces = [];
        user.savedPlaces.push(newPlace);
        await user.save();
        return res.json({ success: true, savedPlaces: user.savedPlaces, place: newPlace });
      }
    }

    const user = inMemoryStore.users[0];
    if (!user.savedPlaces) user.savedPlaces = [];
    user.savedPlaces.push(newPlace);

    return res.json({ success: true, savedPlaces: user.savedPlaces, place: newPlace });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSavedPlace = async (req, res) => {
  try {
    const { index } = req.params;
    const idx = parseInt(index, 10);
    const isMongooseConnected = mongoose.connection.readyState === 1;

    if (isMongooseConnected) {
      let user = await User.findOne({});
      if (user && user.savedPlaces && user.savedPlaces[idx] !== undefined) {
        user.savedPlaces.splice(idx, 1);
        await user.save();
        return res.json({ success: true, savedPlaces: user.savedPlaces });
      }
    }

    const user = inMemoryStore.users[0];
    if (user.savedPlaces && user.savedPlaces[idx] !== undefined) {
      user.savedPlaces.splice(idx, 1);
      return res.json({ success: true, savedPlaces: user.savedPlaces });
    }

    return res.status(404).json({ success: false, message: 'Saved place index not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
