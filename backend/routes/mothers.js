const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MotherProfile = require('../models/MotherProfile');
const User = require('../models/User');

// helper used inside multiple endpoints to auto-assign a doctor based on region
async function tryAssignDoctor(profile) {
  if (!profile || !profile.region) return profile;
  if (profile.assignedDoctorId) return profile; // already assigned
  const doctor = await User.findOne({ role: 'doctor', region: profile.region, isApproved: true, isActive: true });
  if (doctor) {
    profile.assignedDoctorId = doctor._id;
    await profile.save();
  }
  return profile;
}

// GET /api/mothers/profile
router.get('/profile', protect, authorize('mother'), async (req, res) => {
  try {
    let profile = await MotherProfile.findOne({ userId: req.user._id })
      .populate('assignedDoctorId', 'name email phone')
      .populate('assignedNurseId', 'name email phone');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    // make sure a doctor is assigned if possible
    profile = await tryAssignDoctor(profile);
    // repopulate doctor after potential change
    profile = await MotherProfile.findById(profile._id)
      .populate('assignedDoctorId', 'name email phone')
      .populate('assignedNurseId', 'name email phone');
    res.json({ profile, user: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/mothers/profile
router.put('/profile', protect, authorize('mother'), async (req, res) => {
  try {
    const allowed = ['age', 'weekOfPregnancy', 'trimester', 'deliveryDate', 'bloodGroup', 'height', 'weight',
      'bloodPressureSystolic', 'bloodPressureDiastolic', 'hemoglobin', 'bloodSugar', 'distanceToHospital',
      'region', 'symptoms', 'medicalHistory', 'currentMedications', 'allergies', 'phase',
      'babyName', 'babyDOB', 'babyWeight', 'feedingType', 'postpartumMoodScore'];
    
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    
    // Auto-compute trimester
    if (updates.weekOfPregnancy) {
      if (updates.weekOfPregnancy <= 13) updates.trimester = 1;
      else if (updates.weekOfPregnancy <= 26) updates.trimester = 2;
      else updates.trimester = 3;
    }

    const profile = await MotherProfile.findOneAndUpdate({ userId: req.user._id }, updates, { new: true, upsert: true });

    // if the mother submitted or changed a region, try to assign a doctor automatically
    if (updates.region) {
      await tryAssignDoctor(profile);
    }

    res.json({ profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/mothers/feeding-log
router.post('/feeding-log', protect, authorize('mother'), async (req, res) => {
  try {
    const { time, duration, type, notes } = req.body;
    const profile = await MotherProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { feedingLogs: { time: time || new Date(), duration, type, notes } } },
      { new: true }
    );
    res.json({ message: 'Feeding log added', feedingLogs: profile.feedingLogs.slice(-10) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/mothers/sleep-log
router.post('/sleep-log', protect, authorize('mother'), async (req, res) => {
  try {
    const { date, hours, quality } = req.body;
    const profile = await MotherProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { sleepLogs: { date: date || new Date(), hours, quality } } },
      { new: true }
    );
    res.json({ message: 'Sleep log added', sleepLogs: profile.sleepLogs.slice(-10) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/mothers/mood-log
router.post('/mood-log', protect, authorize('mother'), async (req, res) => {
  try {
    const { score, notes } = req.body;
    const profile = await MotherProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { moodLogs: { date: new Date(), score, notes } }, postpartumMoodScore: score },
      { new: true }
    );
    
    // Check for PPD risk
    const recentMoods = profile.moodLogs.slice(-7);
    const avgMood = recentMoods.reduce((a, b) => a + b.score, 0) / recentMoods.length;
    
    res.json({ message: 'Mood logged', avgMoodScore: avgMood, ppdRisk: avgMood <= 3 ? 'high' : avgMood <= 5 ? 'moderate' : 'low' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/mothers/all - For doctors/admin
router.get('/all', protect, authorize('doctor', 'admin', 'nurse'), async (req, res) => {
  try {
    let { region, riskLevel } = req.query;
    const query = {};

    // doctors should only see mothers that are assigned to them
    if (req.user.role === 'doctor') {
      query.assignedDoctorId = req.user._id;
    } else {
      // admin/nurse can filter by region if provided
      if (region) query.region = region;
    }
    if (riskLevel) query.riskLevel = riskLevel;
    
    const profiles = await MotherProfile.find(query)
      .populate('userId', 'name email phone createdAt')
      .populate('assignedDoctorId', 'name')
      .populate('assignedNurseId', 'name')
      .sort({ riskScore: -1 });
    
    res.json({ mothers: profiles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/mothers/assign-doctor (admin utility)
router.post('/assign-doctor', protect, authorize('admin'), async (req, res) => {
  try {
    const { motherId, doctorId } = req.body;
    if (!motherId || !doctorId) return res.status(400).json({ message: 'motherId and doctorId required' });
    await MotherProfile.findOneAndUpdate({ userId: motherId }, { assignedDoctorId: doctorId });
    res.json({ message: 'Doctor assigned to mother' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/mothers/request-nurse-visit
router.post('/request-nurse-visit', protect, authorize('mother'), async (req, res) => {
  try {
    const VisitAssignment = require('../models/VisitAssignment');
    const { preferredDate, notes } = req.body;
    const profile = await MotherProfile.findOne({ userId: req.user._id });
    
    if (!profile.assignedNurseId) {
      return res.status(400).json({ message: 'No nurse assigned yet. Please contact your doctor.' });
    }
    
    const visit = await VisitAssignment.create({
      motherId: req.user._id,
      nurseId: profile.assignedNurseId,
      scheduledDate: preferredDate || new Date(Date.now() + 48 * 60 * 60 * 1000),
      notes,
      visitType: 'routine',
      status: 'pending'
    });
    
    res.json({ message: 'Nurse visit requested', visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
