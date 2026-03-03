const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { calculateRisk } = require('../services/riskEngine');
const RiskLog = require('../models/RiskLog');
const MotherProfile = require('../models/MotherProfile');
const User = require('../models/User');
const { sendHighRiskAlert } = require('../services/smsService');

// POST /api/risk/calculate - Calculate risk for authenticated mother
router.post('/calculate', protect, authorize('mother', 'nurse', 'doctor', 'admin'), async (req, res) => {
  try {
    const { motherId, triggeredBy, ...vitals } = req.body;
    const targetId = req.user.role === 'mother' ? req.user._id : motherId;

    const profile = await MotherProfile.findOne({ userId: targetId });
    if (!profile) return res.status(404).json({ message: 'Mother profile not found' });

    // Merge provided vitals with profile
    const mergedData = {
      age: profile.age,
      bloodPressureSystolic: profile.bloodPressureSystolic,
      bloodPressureDiastolic: profile.bloodPressureDiastolic,
      hemoglobin: profile.hemoglobin,
      bloodSugar: profile.bloodSugar,
      distanceToHospital: profile.distanceToHospital,
      region: profile.region,
      symptoms: profile.symptoms,
      ...vitals
    };

    const result = calculateRisk(mergedData);

    // Update profile risk level
    await MotherProfile.findOneAndUpdate(
      { userId: targetId },
      { riskLevel: result.riskLevel, riskScore: result.calibratedScore, ...vitals },
      { new: true }
    );

    // Log the risk calculation
    const riskLog = await RiskLog.create({
      motherId: targetId,
      riskScore: result.riskScore,
      calibratedScore: result.calibratedScore,
      uncalibratedScore: result.uncalibratedScore,
      riskLevel: result.riskLevel,
      breakdown: result.breakdown,
      biasAdjustment: result.biasAdjustment,
      triggeredBy: triggeredBy || (req.user.role === 'mother' ? 'self' : req.user.role)
    });

    // SMS alert for high risk
    if (result.riskLevel === 'high') {
      const mother = await User.findById(targetId);
      if (mother?.phone) {
        const smsResult = await sendHighRiskAlert(mother);
        await RiskLog.findByIdAndUpdate(riskLog._id, { smsAlertSent: smsResult.success });
      }
    }

    res.json({ ...result, logId: riskLog._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/risk/history/:motherId
router.get('/history/:motherId', protect, async (req, res) => {
  try {
    const targetId = req.user.role === 'mother' ? req.user._id : req.params.motherId;
    const logs = await RiskLog.find({ motherId: targetId }).sort({ createdAt: -1 }).limit(20);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/risk/high-risk-list - For doctors
router.get('/high-risk-list', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { region } = req.query;
    const query = { riskLevel: 'high' };
    if (region) query.region = region;
    
    const profiles = await MotherProfile.find(query)
      .populate('userId', 'name email phone')
      .populate('assignedDoctorId', 'name')
      .populate('assignedNurseId', 'name');
    
    res.json({ mothers: profiles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
