/**
 * Sheon AI — Database Seeder
 * Creates demo accounts for all roles + sample data
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const MotherProfile = require('./models/MotherProfile');
const RiskLog = require('./models/RiskLog');
const CommunityPost = require('./models/CommunityPost');
const RegionAnalytics = require('./models/RegionAnalytics');
const { getHeatmapData } = require('./services/heatmapService');

const DEMO_PASS = 'Demo@1234';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      MotherProfile.deleteMany({}),
      RiskLog.deleteMany({}),
      CommunityPost.deleteMany({}),
      RegionAnalytics.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Admin ──
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@Sheon.com',
      password: 'Admin@1234',
      role: 'admin',
      phone: '+919999999999',
      isApproved: true,
      isActive: true
    });
    console.log('👑 Admin created');

    // ── Doctor ──
    const doctor = await User.create({
      name: 'Dr. Anil Sharma',
      email: 'doctor@demo.com',
      password: DEMO_PASS,
      role: 'doctor',
      phone: '+918888888888',
      region: 'Bihar Rural North',
      isApproved: true,
      isActive: true
    });
    console.log('⚕️  Doctor created');

    // ── Nurse ──
    const nurse = await User.create({
      name: 'Nurse Sunita Devi',
      email: 'nurse@demo.com',
      password: DEMO_PASS,
      role: 'nurse',
      phone: '+917777777777',
      region: 'Bihar Rural North',
      isApproved: true,
      isActive: true
    });
    console.log('🩺 Nurse created');

    // ── Mothers (3 demo accounts) ──
    const mothersData = [
      {
        user: {
          name: 'Priya Kumari',
          email: 'mother@demo.com',
          password: DEMO_PASS,
          role: 'mother',
          phone: '+916666666666',
          region: 'Bihar Rural North',
          isApproved: true,
          isActive: true
        },
        profile: {
          phase: 'prenatal',
          age: 24,
          weekOfPregnancy: 28,
          trimester: 3,
          bloodGroup: 'B+',
          height: 158,
          weight: 58,
          bloodPressureSystolic: 142,
          bloodPressureDiastolic: 92,
          hemoglobin: 9.2,
          bloodSugar: 148,
          distanceToHospital: 34,
          region: 'Bihar Rural North',
          riskLevel: 'high',
          riskScore: 78,
          symptoms: ['headache', 'swelling', 'blurred vision'],
          medicalHistory: ['Anaemia in first trimester'],
          currentMedications: ['Folic Acid', 'Iron Supplements'],
          allergies: ['Penicillin']
        }
      },
      {
        user: {
          name: 'Meena Tribal',
          email: 'mother2@demo.com',
          password: DEMO_PASS,
          role: 'mother',
          phone: '+915555555555',
          region: 'Jharkhand Tribal Belt',
          isApproved: true,
          isActive: true
        },
        profile: {
          phase: 'prenatal',
          age: 19,
          weekOfPregnancy: 16,
          trimester: 2,
          bloodGroup: 'O+',
          height: 152,
          weight: 46,
          bloodPressureSystolic: 128,
          bloodPressureDiastolic: 84,
          hemoglobin: 10.1,
          bloodSugar: 102,
          distanceToHospital: 52,
          region: 'Jharkhand Tribal Belt',
          riskLevel: 'moderate',
          riskScore: 48,
          symptoms: ['fatigue', 'dizziness'],
          medicalHistory: [],
          currentMedications: ['Iron Supplements'],
          allergies: []
        }
      },
      {
        user: {
          name: 'Rekha Singh',
          email: 'mother3@demo.com',
          password: DEMO_PASS,
          role: 'mother',
          phone: '+914444444444',
          region: 'Delhi NCR',
          isApproved: true,
          isActive: true
        },
        profile: {
          phase: 'postnatal',
          age: 29,
          bloodGroup: 'A+',
          height: 162,
          weight: 62,
          region: 'Delhi NCR',
          riskLevel: 'low',
          riskScore: 18,
          symptoms: [],
          babyName: 'Arya',
          babyDOB: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          babyWeight: 3.2,
          feedingType: 'breastfeeding',
          postpartumMoodScore: 7,
          recoveryStatus: 'good',
          moodLogs: [
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), score: 7, notes: 'Feeling better today' },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), score: 6, notes: 'Tired but okay' },
            { date: new Date(), score: 7, notes: '' }
          ],
          vaccinationSchedule: [
            { name: 'BCG', dueDate: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000), completed: true, completedDate: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000) },
            { name: 'Hepatitis B (1st dose)', dueDate: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000), completed: true, completedDate: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000) },
            { name: 'OPV (1st dose)', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), completed: false },
          ]
        }
      }
    ];

    const createdMothers = [];
    for (const m of mothersData) {
      const userDoc = await User.create(m.user);
      const profileDoc = await MotherProfile.create({ userId: userDoc._id, ...m.profile });
      createdMothers.push({ user: userDoc, profile: profileDoc });
    }
    console.log('💜 Mothers created (3)');

    // auto-assign doctors to seeded mothers based on region
    for (const m of createdMothers) {
      if (m.profile.region) {
        const docMatch = await User.findOne({ role: 'doctor', region: m.profile.region, isApproved: true, isActive: true });
        if (docMatch) {
          await MotherProfile.findByIdAndUpdate(m.profile._id, { assignedDoctorId: docMatch._id });
        }
      }
    }

    // for demo we also set nurse for first mother explicitly
    await MotherProfile.findOneAndUpdate(
      { userId: createdMothers[0].user._id },
      { assignedNurseId: nurse._id }
    );

    // ── Risk Logs ──
    const riskLogData = [
      { motherId: createdMothers[0].user._id, riskScore: 78, calibratedScore: 78, uncalibratedScore: 58, riskLevel: 'high', triggeredBy: 'self',
        breakdown: {
          bp: { score: 80, weight: 0.28, contribution: 22, status: 'hypertension' },
          hemoglobin: { score: 75, weight: 0.22, contribution: 17, status: 'moderate-anemia' },
          bloodSugar: { score: 70, weight: 0.20, contribution: 14, status: 'gestational-diabetes' },
          age: { score: 10, weight: 0.15, contribution: 2, status: 'optimal' },
          distance: { score: 65, weight: 0.15, contribution: 10, status: 'remote' },
          silentRisk: { detected: true, flags: ['⚠️ Headache + swelling may indicate early preeclampsia', '⚠️ Visual disturbance — possible hypertensive crisis'] }
        },
        biasAdjustment: { multiplier: 1.35, reason: 'Rural area: increased under-reporting of complications', region: 'Bihar Rural North' }
      },
      { motherId: createdMothers[0].user._id, riskScore: 65, calibratedScore: 65, uncalibratedScore: 50, riskLevel: 'high', triggeredBy: 'nurse-visit',
        breakdown: {
          bp: { score: 68, weight: 0.28, contribution: 19, status: 'hypertension' },
          hemoglobin: { score: 70, weight: 0.22, contribution: 15, status: 'moderate-anemia' },
          bloodSugar: { score: 60, weight: 0.20, contribution: 12, status: 'gestational-diabetes' },
          age: { score: 10, weight: 0.15, contribution: 2, status: 'optimal' },
          distance: { score: 65, weight: 0.15, contribution: 10, status: 'remote' },
          silentRisk: { detected: false, flags: [] }
        },
        biasAdjustment: { multiplier: 1.3, reason: 'Rural area adjustment', region: 'Bihar Rural North' }
      },
      { motherId: createdMothers[1].user._id, riskScore: 48, calibratedScore: 72, uncalibratedScore: 48, riskLevel: 'moderate', triggeredBy: 'self',
        breakdown: {
          bp: { score: 55, weight: 0.28, contribution: 15, status: 'elevated' },
          hemoglobin: { score: 45, weight: 0.22, contribution: 10, status: 'mild-anemia' },
          bloodSugar: { score: 10, weight: 0.20, contribution: 2, status: 'normal' },
          age: { score: 50, weight: 0.15, contribution: 8, status: 'young-mother' },
          distance: { score: 90, weight: 0.15, contribution: 14, status: 'critically-remote' },
          silentRisk: { detected: false, flags: [] }
        },
        biasAdjustment: { multiplier: 1.5, reason: 'Tribal area: significant healthcare access disparity', region: 'Jharkhand Tribal Belt' }
      }
    ];

    for (const rl of riskLogData) {
      await RiskLog.create(rl);
    }
    console.log('📊 Risk logs created');

    // ── Community Posts ──
    const posts = [
      { authorId: createdMothers[0].user._id, content: 'Anyone else experiencing a lot of swelling in the third trimester? My ankles are really bad. What helps? 💜', category: 'general', likes: [], comments: [] },
      { authorId: createdMothers[2].user._id, content: 'For new moms — coconut water really helped me with milk supply! Also drinking lots of ragi porridge. Hope this helps someone 🙏', category: 'nutrition', isPinned: true, likes: [createdMothers[0].user._id], comments: [] },
      { authorId: createdMothers[1].user._id, content: 'The prenatal yoga videos on YouTube have been so calming for me. Even 15 minutes a day makes a big difference in back pain!', category: 'exercise', likes: [], comments: [] },
      { authorId: createdMothers[2].user._id, content: 'Day 45 postpartum — getting a bit better each day. To anyone struggling, you are SO strong. This phase will pass 💕', category: 'mental-health', likes: [createdMothers[0].user._id, createdMothers[1].user._id], comments: [] }
    ];
    for (const p of posts) await CommunityPost.create(p);
    console.log('💬 Community posts created');

    // ── Region Analytics (from heatmap service) ──
    const regions = getHeatmapData();
    for (const r of regions) await RegionAnalytics.create(r);
    console.log('🗺️  Region analytics seeded');

    // ── Pending approval ──
    await User.create({
      name: 'Dr. Kavitha Reddy',
      email: 'dr.kavitha@hospital.com',
      password: DEMO_PASS,
      role: 'doctor',
      phone: '+913333333333',
      region: 'Tamil Nadu Semi-Urban',
      isApproved: false,
      isActive: true
    });
    await User.create({
      name: 'Nurse Fatima Khan',
      email: 'nurse.fatima@care.com',
      password: DEMO_PASS,
      role: 'nurse',
      phone: '+912222222222',
      region: 'UP Eastern District',
      isApproved: false,
      isActive: true
    });
    console.log('⏳ Pending approval accounts created');

    console.log('\n✅ ====== SEED COMPLETE ====== ✅');
    console.log('\n🔑 Demo Login Credentials:');
    console.log('  👑 Admin    → admin@Sheon.com  / Admin@1234');
    console.log('  ⚕️  Doctor   → doctor@demo.com        / Demo@1234');
    console.log('  🩺 Nurse    → nurse@demo.com          / Demo@1234');
    console.log('  💜 Mother   → mother@demo.com         / Demo@1234 (High Risk, Prenatal)');
    console.log('  💜 Mother 2 → mother2@demo.com        / Demo@1234 (Moderate Risk, Prenatal)');
    console.log('  💜 Mother 3 → mother3@demo.com        / Demo@1234 (Low Risk, Postnatal)');
    console.log('\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
