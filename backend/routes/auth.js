const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MotherProfile = require('../models/MotherProfile');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register - Only mothers can self-register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, region, state } = req.body;
    
    if (role && role !== 'mother') {
      return res.status(403).json({ message: 'Only mothers can self-register. Doctors and nurses are added by admin.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, role: 'mother', region });
    const profile = await MotherProfile.create({ userId: user._id, region, state });

    // try to assign a doctor immediately if region matches an existing approved doctor
    if (region) {
      const doctor = await User.findOne({ role: 'doctor', region, isApproved: true, isActive: true });
      if (doctor) {
        profile.assignedDoctorId = doctor._id;
        await profile.save();
        // notify the mother by SMS
        const { sendDoctorAssignedAlert } = require('../services/smsService');
        const mother = await User.findById(user._id);
        if (mother?.phone) {
          await sendDoctorAssignedAlert(mother, doctor.name);
        }
      }
    }

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });
    if (!user.isApproved) return res.status(403).json({ message: 'Your account is pending admin approval' });

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/admin/create-staff - Admin creates doctor/nurse accounts
router.post('/admin/create-staff', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    const { name, email, password, phone, role, region } = req.body;
    
    if (!['doctor', 'nurse'].includes(role)) {
      return res.status(400).json({ message: 'Can only create doctor or nurse accounts' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, phone, role, region, isApproved: false });
    res.status(201).json({ message: `${role} account created, pending approval`, user: { id: user._id, name, email, role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
