const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const MotherProfile = require('../models/MotherProfile');
const { generateBabyGrowthUpdate, generateNutritionPlan, generateEmotionalSupport, generateExercisePlan, generateMedicationGuidance } = require('../services/geminiService');

router.get('/baby-update', protect, async (req, res) => {
  try {
    const profile = await MotherProfile.findOne({ userId: req.user._id });
    const week = profile?.weekOfPregnancy || parseInt(req.query.week) || 12;
    const update = await generateBabyGrowthUpdate(week);
    res.json({ update, week });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/nutrition', protect, async (req, res) => {
  try {
    const profile = await MotherProfile.findOne({ userId: req.user._id });
    const plan = await generateNutritionPlan(profile || {});
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/emotional-support', protect, async (req, res) => {
  try {
    const { moodScore, notes } = req.body;
    const response = await generateEmotionalSupport(moodScore || 5, notes);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/exercise-plan', protect, async (req, res) => {
  try {
    const profile = await MotherProfile.findOne({ userId: req.user._id });
    const plan = await generateExercisePlan(profile?.trimester || 1, profile?.phase || 'prenatal', profile?.weight);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/medication-guidance', protect, async (req, res) => {
  try {
    const profile = await MotherProfile.findOne({ userId: req.user._id });
    const guidance = await generateMedicationGuidance(profile?.currentMedications || [], profile?.trimester || 1);
    res.json(guidance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
