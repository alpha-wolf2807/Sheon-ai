const mongoose = require('mongoose');

const regionAnalyticsSchema = new mongoose.Schema({
  region: { type: String, required: true, unique: true },
  state: String,
  coordinates: { lat: Number, lng: Number },
  totalMothers: { type: Number, default: 0 },
  highRiskCount: { type: Number, default: 0 },
  moderateRiskCount: { type: Number, default: 0 },
  lowRiskCount: { type: Number, default: 0 },
  activeNurses: { type: Number, default: 0 },
  activeDoctors: { type: Number, default: 0 },
  hospitalizationRate: { type: Number, default: 0 },
  maternalMortalityRate: { type: Number, default: 0 },
  preventedComplications: { type: Number, default: 0 },
  avgDistanceToHospital: { type: Number, default: 0 },
  biasAdjustmentFactor: { type: Number, default: 1.0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RegionAnalytics', regionAnalyticsSchema);
