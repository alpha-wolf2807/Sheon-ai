const mongoose = require('mongoose');

const motherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phase: { type: String, enum: ['prenatal', 'postnatal'], default: 'prenatal' },
  age: { type: Number },
  weekOfPregnancy: { type: Number, min: 1, max: 42 },
  trimester: { type: Number, enum: [1, 2, 3] },
  deliveryDate: { type: Date },
  bloodGroup: { type: String },
  height: { type: Number },
  weight: { type: Number },
  bloodPressureSystolic: { type: Number },
  bloodPressureDiastolic: { type: Number },
  hemoglobin: { type: Number },
  bloodSugar: { type: Number },
  distanceToHospital: { type: Number },
  state: { type: String },
  region: { type: String },
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedNurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  riskLevel: { type: String, enum: ['low', 'moderate', 'high'], default: 'low' },
  riskScore: { type: Number, default: 0 },
  symptoms: [String],
  medicalHistory: [String],
  currentMedications: [String],
  allergies: [String],
  // Postnatal fields
  babyName: { type: String },
  babyDOB: { type: Date },
  babyWeight: { type: Number },
  feedingType: { type: String, enum: ['breastfeeding', 'formula', 'mixed'] },
  postpartumMoodScore: { type: Number, default: 5 },
  recoveryStatus: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
  // Tracking
  feedingLogs: [{
    time: Date,
    duration: Number,
    type: String,
    notes: String
  }],
  sleepLogs: [{
    date: Date,
    hours: Number,
    quality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] }
  }],
  moodLogs: [{
    date: Date,
    score: Number,
    notes: String
  }],
  vaccinationSchedule: [{
    name: String,
    dueDate: Date,
    completed: Boolean,
    completedDate: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('MotherProfile', motherProfileSchema);
