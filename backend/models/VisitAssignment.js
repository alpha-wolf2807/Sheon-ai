const mongoose = require('mongoose');

const visitAssignmentSchema = new mongoose.Schema({
  motherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  visitType: { type: String, enum: ['routine', 'urgent', 'follow-up'], default: 'routine' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  notes: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  }
}, { timestamps: true });

module.exports = mongoose.model('VisitAssignment', visitAssignmentSchema);
