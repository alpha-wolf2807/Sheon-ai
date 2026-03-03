const mongoose = require('mongoose');

const visitReportSchema = new mongoose.Schema({
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitAssignment', required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  motherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vitals: {
    bloodPressureSystolic: Number,
    bloodPressureDiastolic: Number,
    temperature: Number,
    weight: Number,
    pulseRate: Number,
    oxygenSaturation: Number
  },
  symptoms: [String],
  observations: String,
  recommendations: String,
  medicationsAdministered: [String],
  images: [String],
  nextVisitDate: Date,
  riskRecalculated: { type: Boolean, default: false },
  newRiskLevel: String
}, { timestamps: true });

module.exports = mongoose.model('VisitReport', visitReportSchema);
