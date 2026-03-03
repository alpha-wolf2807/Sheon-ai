const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const VisitAssignment = require('../models/VisitAssignment');
const VisitReport = require('../models/VisitReport');
const MotherProfile = require('../models/MotherProfile');
const { calculateRisk } = require('../services/riskEngine');
const RiskLog = require('../models/RiskLog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/visit-reports';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/nurses/my-visits
router.get('/my-visits', protect, authorize('nurse'), async (req, res) => {
  try {
    const visits = await VisitAssignment.find({ nurseId: req.user._id })
      .populate('motherId', 'name email phone')
      .sort({ scheduledDate: 1 });
    res.json({ visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/nurses/visits/:visitId/start
router.put('/visits/:visitId/start', protect, authorize('nurse'), async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const visit = await VisitAssignment.findByIdAndUpdate(
      req.params.visitId,
      { status: 'in-progress', location: { lat, lng, address } },
      { new: true }
    );
    res.json({ message: 'Visit started', visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/nurses/visits/:visitId/report
router.post('/visits/:visitId/report', protect, authorize('nurse'), upload.array('images', 5), async (req, res) => {
  try {
    const visit = await VisitAssignment.findById(req.params.visitId);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    const { vitals, symptoms, observations, recommendations, medicationsAdministered, nextVisitDate } = req.body;
    const parsedVitals = typeof vitals === 'string' ? JSON.parse(vitals) : vitals;
    const parsedSymptoms = typeof symptoms === 'string' ? JSON.parse(symptoms) : symptoms || [];
    
    const images = req.files?.map(f => f.path) || [];

    const report = await VisitReport.create({
      visitId: visit._id,
      nurseId: req.user._id,
      motherId: visit.motherId,
      vitals: parsedVitals,
      symptoms: parsedSymptoms,
      observations,
      recommendations,
      medicationsAdministered: typeof medicationsAdministered === 'string' ? JSON.parse(medicationsAdministered) : medicationsAdministered || [],
      images,
      nextVisitDate
    });

    // Update visit status
    await VisitAssignment.findByIdAndUpdate(visit._id, { status: 'completed' });

    // Trigger risk recalculation with new vitals
    const profile = await MotherProfile.findOne({ userId: visit.motherId });
    if (profile) {
      const mergedData = {
        age: profile.age,
        bloodPressureSystolic: parsedVitals.bloodPressureSystolic || profile.bloodPressureSystolic,
        bloodPressureDiastolic: parsedVitals.bloodPressureDiastolic || profile.bloodPressureDiastolic,
        hemoglobin: profile.hemoglobin,
        bloodSugar: profile.bloodSugar,
        distanceToHospital: profile.distanceToHospital,
        region: profile.region,
        symptoms: parsedSymptoms
      };
      
      const riskResult = calculateRisk(mergedData);
      
      await MotherProfile.findOneAndUpdate(
        { userId: visit.motherId },
        { riskLevel: riskResult.riskLevel, riskScore: riskResult.calibratedScore, ...parsedVitals }
      );
      
      await RiskLog.create({
        motherId: visit.motherId,
        riskScore: riskResult.riskScore,
        calibratedScore: riskResult.calibratedScore,
        uncalibratedScore: riskResult.uncalibratedScore,
        riskLevel: riskResult.riskLevel,
        breakdown: riskResult.breakdown,
        biasAdjustment: riskResult.biasAdjustment,
        triggeredBy: 'nurse-visit'
      });
      
      await VisitReport.findByIdAndUpdate(report._id, { riskRecalculated: true, newRiskLevel: riskResult.riskLevel });
    }

    res.json({ message: 'Visit report submitted and risk recalculated', report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/nurses/list - For admin/doctors
router.get('/list', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const User = require('../models/User');
    const nurses = await User.find({ role: 'nurse', isApproved: true }).select('-password');
    res.json({ nurses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
