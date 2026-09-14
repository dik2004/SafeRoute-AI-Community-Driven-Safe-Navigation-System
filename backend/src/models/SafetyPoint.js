const mongoose = require('mongoose');

const safetyPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'police_station',
      'cctv_camera',
      'street_light',
      'safe_haven',
      'hospital_emergency',
      'women_help_booth',
      'busy_commercial_hub'
    ],
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
  coverageRadiusMeters: {
    type: Number,
    default: 50, // default radius of safety influence
  },
  details: {
    lumens: { type: Number, default: 4000 },
    operationalHours: { type: String, default: '24/7' },
    phone: { type: String, default: '' },
    isWorking: { type: Boolean, default: true },
    cameraType: { type: String, default: '360 PTZ HD' },
    crowdLevel: { type: String, enum: ['high', 'moderate', 'low'], default: 'moderate' }
  },
  safetyScoreContribution: {
    type: Number,
    default: 1.0,
  }
}, {
  timestamps: true,
});

safetyPointSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.SafetyPoint || mongoose.model('SafetyPoint', safetyPointSchema);
