const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  trigger: { type: String, enum: ['high-risk', 'nurse-assigned', 'doctor-assigned', 'doctor-urgent', 'emergency', 'lab-reminder', 'appointment', 'test'] },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  provider: { type: String, enum: ['twilio', 'fast2sms'], default: 'twilio' },
  messageId: String,
  error: String
}, { timestamps: true });

module.exports = mongoose.model('SMSLog', smsLogSchema);
