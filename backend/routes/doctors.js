const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MotherProfile = require('../models/MotherProfile');
const User = require('../models/User');
const VisitAssignment = require('../models/VisitAssignment');
const RiskLog = require('../models/RiskLog');
const { sendNurseAssignedAlert, sendEmergencyEscalation } = require('../services/smsService');

// GET /api/doctors/high-risk-mothers
router.get('/high-risk-mothers', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    let { region } = req.query;
    const query = { riskLevel: 'high' };
    if (req.user.role === 'doctor') {
      // only see mothers assigned to this doctor
      query.assignedDoctorId = req.user._id;
    } else {
      if (!region && req.user.role === 'doctor' && req.user.region) {
        region = req.user.region; // though this branch won't be hit for doctor anymore
      }
      if (region) query.region = region;
    }
    
    const profiles = await MotherProfile.find(query)
      .populate('userId', 'name email phone')
      .populate('assignedNurseId', 'name phone')
      .sort({ riskScore: -1 });
    
    res.json({ mothers: profiles, total: profiles.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/doctors/assign-nurse
router.post('/assign-nurse', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { motherId, nurseId, scheduledDate, visitType, priority, notes } = req.body;
    
    // Update mother profile
    await MotherProfile.findOneAndUpdate({ userId: motherId }, { assignedNurseId: nurseId });
    
    // Create visit assignment
    const visit = await VisitAssignment.create({
      motherId, nurseId,
      doctorId: req.user._id,
      scheduledDate: scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      visitType: visitType || 'urgent',
      priority: priority || 'high',
      notes,
      status: 'confirmed'
    });
    
    // SMS alert to mother
    const mother = await User.findById(motherId);
    const nurse = await User.findById(nurseId);
    if (mother?.phone) {
      await sendNurseAssignedAlert(mother, nurse.name, visit.scheduledDate);
    }
    
    res.json({ message: 'Nurse assigned and visit scheduled', visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/doctors/escalate
router.post('/escalate', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { motherId, hospital, reason } = req.body;
    const mother = await User.findById(motherId);
    
    if (mother?.phone) {
      await sendEmergencyEscalation(mother, hospital);
    }
    
    await RiskLog.create({
      motherId,
      riskScore: 100,
      calibratedScore: 100,
      riskLevel: 'high',
      triggeredBy: 'doctor',
      notes: `Emergency escalation to ${hospital}. Reason: ${reason}`
    });
    
    res.json({ message: `Case escalated to ${hospital}. SMS sent to mother.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/doctors/analytics
router.get('/analytics', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const totalMothers = await MotherProfile.countDocuments();
    const highRisk = await MotherProfile.countDocuments({ riskLevel: 'high' });
    const moderate = await MotherProfile.countDocuments({ riskLevel: 'moderate' });
    const low = await MotherProfile.countDocuments({ riskLevel: 'low' });
    const recentLogs = await RiskLog.find().sort({ createdAt: -1 }).limit(50);
    
    res.json({
      totalMothers, highRisk, moderate, low,
      recentActivityCount: recentLogs.length,
      riskDistribution: { high: highRisk, moderate, low }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/doctors/list - For admin
router.get('/list', protect, authorize('admin'), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
