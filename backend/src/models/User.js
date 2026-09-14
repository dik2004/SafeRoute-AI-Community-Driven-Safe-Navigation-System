const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Community Guardian'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    default: 'guardian@saferoute.ai'
  },
  phone: {
    type: String,
    default: '+91 98765 00001'
  },
  password: {
    type: String,
    default: 'demo_secure_pass_2026'
  },
  avatar: {
    type: String,
    default: '🛡️'
  },
  guardianPoints: {
    type: Number,
    default: 120,
  },
  guardianBadge: {
    type: String,
    default: 'Silver Guardian'
  },
  reportsSubmitted: {
    type: Number,
    default: 3
  },
  reportsVerified: {
    type: Number,
    default: 8
  },
  emergencyContacts: [
    {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relation: { type: String, default: 'Emergency Contact' },
      isPrimary: { type: Boolean, default: false }
    }
  ],
  savedPlaces: [
    {
      label: { type: String, required: true },
      address: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      icon: { type: String, default: 'home' }
    }
  ]
}, {
  timestamps: true,
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
