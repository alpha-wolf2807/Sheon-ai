const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sendSMS, sendLabReminder } = require('../services/smsService');
const SMSLog = require('../models/SMSLog');
const User = require('../models/User');

// POST /api/sms/send-test
router.post('/send-test', protect, authorize('admin'), async (req, res) => {
  try {
    const { phone, message } = req.body;
    const result = await sendSMS(phone, message, 'test');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/sms/lab-reminder
router.post('/lab-reminder', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { motherId, testName, dueDate } = req.body;
    const mother = await User.findById(motherId);
    if (!mother?.phone) return res.status(400).json({ message: 'Mother phone not found' });
    const result = await sendLabReminder(mother, testName, dueDate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/sms/logs
router.get('/logs', protect, authorize('admin'), async (req, res) => {
  try {
    const logs = await SMSLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
