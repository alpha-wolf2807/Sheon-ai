const mongoose = require('mongoose');

const riskLogSchema = new mongoose.Schema({
  motherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  riskScore: { type: Number, required: true },
  calibratedScore: { type: Number, required: true },
  riskLevel: { type: String, enum: ['low', 'moderate', 'high'], required: true },
  breakdown: {
    bp: { score: Number, weight: Number, contribution: Number, status: String },
    hemoglobin: { score: Number, weight: Number, contribution: Number, status: String },
    bloodSugar: { score: Number, weight: Number, contribution: Number, status: String },
    age: { score: Number, weight: Number, contribution: Number, status: String },
    distance: { score: Number, weight: Number, contribution: Number, status: String },
    silentRisk: { detected: Boolean, flags: [String] }
  },
  biasAdjustment: {
    multiplier: Number,
    reason: String,
    region: String
  },
  uncalibratedScore: { type: Number },
  triggeredBy: { type: String, enum: ['self', 'nurse-visit', 'system', 'doctor'], default: 'self' },
  smsAlertSent: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('RiskLog', riskLogSchema);
