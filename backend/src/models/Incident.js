const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: true,
    enum: [
      'poor_lighting',
      'harassment',
      'deserted_area',
      'suspicious_activity',
      'physical_hazard',
      'stray_animals',
      'theft_reported'
    ],
    default: 'poor_lighting',
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    type: String,
    default: '',
  },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'late_night', 'any'],
    default: 'night',
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  upvotes: {
    type: Number,
    default: 1,
  },
  upvotedBy: [String],
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedCount: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved'],
    default: 'active',
  },
  reporterName: {
    type: String,
    default: 'Community Guardian',
  },
  tags: [String],
}, {
  timestamps: true,
});

incidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Incident || mongoose.model('Incident', incidentSchema);
