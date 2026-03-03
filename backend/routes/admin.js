const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const MotherProfile = require('../models/MotherProfile');
const RiskLog = require('../models/RiskLog');
const SMSLog = require('../models/SMSLog');
const { getHeatmapData, getRegionStats } = require('../services/heatmapService');
const PDFDocument = require('pdfkit');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalMothers, pendingApprovals, totalDoctors, totalNurses, highRisk, recentLogs, totalSMS] = await Promise.all([
      User.countDocuments(),
      MotherProfile.countDocuments(),
      User.countDocuments({ isApproved: false }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'nurse' }),
      MotherProfile.countDocuments({ riskLevel: 'high' }),
      RiskLog.find().sort({ createdAt: -1 }).limit(10).populate('motherId', 'name'),
      SMSLog.countDocuments({ status: 'sent' })
    ]);

    const preventedComplications = await RiskLog.countDocuments({ riskLevel: { $in: ['moderate', 'high'] }, triggeredBy: 'nurse-visit' });

    res.json({ totalUsers, totalMothers, pendingApprovals, totalDoctors, totalNurses, highRisk, recentLogs, totalSMS, preventedComplications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/pending-approvals
router.get('/pending-approvals', protect, authorize('admin'), async (req, res) => {
  try {
    const pending = await User.find({ isApproved: false, role: { $in: ['doctor', 'nurse'] } }).select('-password');
    res.json({ pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/approve/:userId
router.put('/approve/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { region } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isApproved: true, ...(region && { region }) },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // if we're approving a doctor and a region was supplied, link existing moms and notify them
    if (user.role === 'doctor' && user.region) {
      // find mothers who will be assigned now
      const toNotify = await MotherProfile.find({ region: user.region, assignedDoctorId: { $exists: false } });
      if (toNotify.length) {
        // perform the bulk assignment
        await MotherProfile.updateMany(
          { region: user.region, assignedDoctorId: { $exists: false } },
          { assignedDoctorId: user._id }
        );
        // send SMS alerts
        const { sendDoctorAssignedAlert } = require('../services/smsService');
        for (const prof of toNotify) {
          const mother = await User.findById(prof.userId);
          if (mother?.phone) {
            await sendDoctorAssignedAlert(mother, user.name);
          }
        }
      }
    }

    res.json({ message: `${user.role} approved`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/reject/:userId
router.put('/reject/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { isActive: false });
    res.json({ message: 'User rejected and deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/heatmap
router.get('/heatmap', protect, authorize('admin'), async (req, res) => {
  try {
    // base mock data (for coordinates and historic analytics)
    const base = getRegionStats();

    // Aggregate mothers by region from database
    const agg = await MotherProfile.aggregate([
      { $group: { _id: { $ifNull: ['$region', 'Unknown'] }, totalMothers: { $sum: 1 }, highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } }, moderateRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'moderate'] }, 1, 0] } }, lowRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } } } }
    ]);

    // Build a map from base regions for quick lookup
    const baseMap = {};
    base.regions.forEach(r => { baseMap[r.region] = r; });

    // Merge aggregated regions with base map
    const mergedRegions = [];
    // first, include or update base regions
    Object.values(baseMap).forEach(r => {
      const found = agg.find(a => a._id === r.region);
      if (found) {
        mergedRegions.push({
          ...r,
          totalMothers: found.totalMothers,
          highRiskCount: found.highRisk,
          moderateRiskCount: found.moderateRisk,
          lowRiskCount: found.lowRisk
        });
      } else {
        mergedRegions.push(r);
      }
    });

    // add any regions present in DB but not in base map
    agg.forEach(a => {
      if (!baseMap[a._id]) {
        mergedRegions.push({
          region: a._id,
          state: '',
          coordinates: null,
          totalMothers: a.totalMothers,
          highRiskCount: a.highRisk,
          moderateRiskCount: a.moderateRisk,
          lowRiskCount: a.lowRisk,
          activeNurses: 0,
          activeDoctors: 0,
          hospitalizationRate: 0,
          preventedComplications: 0,
          avgDistanceToHospital: 0,
          biasAdjustmentFactor: 1.2
        });
      }
    });

    // Aggregate by state for state-level heatmap (state only used for heatmap)
    const stateAgg = await MotherProfile.aggregate([
      { $group: { _id: { $ifNull: ['$state', 'Unknown'] }, totalMothers: { $sum: 1 }, highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } }, moderateRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'moderate'] }, 1, 0] } }, lowRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } } } }
    ]);

    const states = stateAgg.map(s => ({ state: s._id, totalMothers: s.totalMothers, highRisk: s.highRisk, moderateRisk: s.moderateRisk, lowRisk: s.lowRisk }));

    const result = {
      totalRegions: mergedRegions.length,
      totalMothers: mergedRegions.reduce((s, r) => s + (r.totalMothers || 0), 0),
      totalHighRisk: mergedRegions.reduce((s, r) => s + (r.highRiskCount || 0), 0),
      totalPrevented: mergedRegions.reduce((s, r) => s + (r.preventedComplications || 0), 0),
      avgHospitalDistance: mergedRegions.reduce((s, r) => s + (r.avgDistanceToHospital || 0), 0) / Math.max(1, mergedRegions.length),
      regions: mergedRegions,
      states
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/generate-report - Comprehensive PDF hospital report
router.get('/generate-report', protect, authorize('admin'), async (req, res) => {
  try {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Sheon-Hospital-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    // Fetch comprehensive data
    const [totalMothers, highRiskMothers, moderateRiskMothers, lowRiskMothers, 
            totalDoctors, totalNurses, totalAdmins, pendingApprovals,
            nurseVisits, smsSent, riskCalculations, preventedComplications] = await Promise.all([
      MotherProfile.countDocuments(),
      MotherProfile.countDocuments({ riskLevel: 'high' }),
      MotherProfile.countDocuments({ riskLevel: 'moderate' }),
      MotherProfile.countDocuments({ riskLevel: 'low' }),
      User.countDocuments({ role: 'doctor', isApproved: true }),
      User.countDocuments({ role: 'nurse', isApproved: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isApproved: false }),
      RiskLog.countDocuments({ triggeredBy: 'nurse-visit' }),
      SMSLog.countDocuments({ status: 'sent' }),
      RiskLog.countDocuments(),
      RiskLog.countDocuments({ riskLevel: { $in: ['moderate', 'high'] }, triggeredBy: 'nurse-visit' })
    ]);

    // Get regional heatmap data
    const baseHeatmap = getRegionStats();
    const agg = await MotherProfile.aggregate([
      { $group: { _id: { $ifNull: ['$region', 'Unknown'] }, totalMothers: { $sum: 1 }, highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } }, moderateRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'moderate'] }, 1, 0] } }, lowRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } } } }
    ]);

    // Merge data
    const baseMap = {};
    baseHeatmap.regions.forEach(r => { baseMap[r.region] = r; });
    const mergedRegions = [];
    Object.values(baseMap).forEach(r => {
      const found = agg.find(a => a._id === r.region);
      mergedRegions.push({...r, ...(found && { totalMothers: found.totalMothers, highRiskCount: found.highRisk, moderateRiskCount: found.moderateRisk, lowRiskCount: found.lowRisk })});
    });
    agg.forEach(a => {
      if (!baseMap[a._id]) {
        mergedRegions.push({ region: a._id, state: '', totalMothers: a.totalMothers, highRiskCount: a.highRisk, moderateRiskCount: a.moderateRisk, lowRiskCount: a.lowRisk, activeNurses: 0, activeDoctors: 0, preventedComplications: 0, biasAdjustmentFactor: 1.2 });
      }
    });

    // Get top risk logs
    const topRisks = await RiskLog.find().sort({ createdAt: -1 }).limit(5).populate('motherId', 'age weekOfPregnancy region');

    // ════════════════════════════════════════════════════════════════
    // HEADER & TITLE
    // ════════════════════════════════════════════════════════════════
    doc.fontSize(28).fillColor('#5B2EFF').font('Helvetica-Bold').text('Sheon AI', { align: 'center' });
    doc.fontSize(14).fillColor('#666').font('Helvetica').text('Maternal Health Intelligence & Care Network', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#999').text('Hospital Comprehensive System Report', { align: 'center' });
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#5B2EFF');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333').text(`Report Generated: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, { align: 'right' });
    doc.moveDown(1);

    // ════════════════════════════════════════════════════════════════
    // EXECUTIVE SUMMARY
    // ════════════════════════════════════════════════════════════════
    doc.fontSize(16).fillColor('#5B2EFF').font('Helvetica-Bold').text('EXECUTIVE SUMMARY');
    doc.fontSize(10).fillColor('#555').font('Helvetica');
    doc.text(`This report provides a comprehensive overview of the Sheon AI system performance, regional coverage, risk metrics, and healthcare outcomes.`);
    doc.moveDown(0.5);

    // ════════════════════════════════════════════════════════════════
    // DASHBOARD METRICS (2-COLUMN LAYOUT)
    // ════════════════════════════════════════════════════════════════
    doc.fontSize(14).fillColor('#5B2EFF').font('Helvetica-Bold').text('Key Metrics Dashboard');
    doc.moveDown(0.3);
    
    const col1X = 60, col2X = 310, colWidth = 220, rowHeight = 20;
    const metrics = [
      { label: 'Total Mothers Monitored', value: totalMothers, color: '#7A56FF' },
      { label: 'Total System Users', value: (totalDoctors + totalNurses + totalAdmins), color: '#5B2EFF' },
      { label: 'Active Doctors', value: totalDoctors, color: '#34d399' },
      { label: 'Active Nurses', value: totalNurses, color: '#34d399' },
      { label: 'High Risk Cases', value: highRiskMothers, color: '#f87171' },
      { label: 'Moderate Risk', value: moderateRiskMothers, color: '#facc15' },
      { label: 'Low Risk', value: lowRiskMothers, color: '#34d399' },
      { label: 'Risk Assessments Run', value: riskCalculations, color: '#5B2EFF' },
    ];

    let currentY = doc.y;
    metrics.forEach((m, i) => {
      const x = i % 2 === 0 ? col1X : col2X;
      const y = currentY + Math.floor(i / 2) * rowHeight;
      
      doc.fontSize(9).fillColor('#555').font('Helvetica').text(m.label, x, y, { width: colWidth - 20 });
      doc.fontSize(13).fillColor(m.color).font('Helvetica-Bold').text(m.value.toString(), x + colWidth - 60, y, { align: 'right', width: 50 });
    });
    doc.y = currentY + Math.ceil(metrics.length / 2) * rowHeight + 10;
    doc.moveDown(0.5);

    // ════════════════════════════════════════════════════════════════
    // RISK DISTRIBUTION
    // ════════════════════════════════════════════════════════════════
    doc.fontSize(14).fillColor('#5B2EFF').font('Helvetica-Bold').text('Risk Classification Breakdown');
    doc.moveDown(0.3);
    const totalRisks = highRiskMothers + moderateRiskMothers + lowRiskMothers || 1;
    const highPct = Math.round((highRiskMothers / totalRisks) * 100);
    const modPct = Math.round((moderateRiskMothers / totalRisks) * 100);
    const lowPct = Math.round((lowRiskMothers / totalRisks) * 100);
    
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    doc.text(`🔴 High Risk: ${highRiskMothers} (${highPct}%)`, 60);
    doc.rect(100, doc.y - 12, 150 * (highPct / 100), 10).fillColor('#f87171').fill();
    doc.moveDown(0.5);
    
    doc.text(`🟡 Moderate Risk: ${moderateRiskMothers} (${modPct}%)`, 60);
    doc.rect(100, doc.y - 12, 150 * (modPct / 100), 10).fillColor('#facc15').fill();
    doc.moveDown(0.5);
    
    doc.text(`🟢 Low Risk: ${lowRiskMothers} (${lowPct}%)`, 60);
    doc.rect(100, doc.y - 12, 150 * (lowPct / 100), 10).fillColor('#34d399').fill();
    doc.moveDown(1);

    // ════════════════════════════════════════════════════════════════
    // REGIONAL HEATMAP TABLE
    // ════════════════════════════════════════════════════════════════
    doc.fontSize(14).fillColor('#5B2EFF').font('Helvetica-Bold').text('Regional Coverage & Risk Density');
    doc.moveDown(0.3);
    
    doc.fontSize(9).fillColor('#555').font('Helvetica');
    const tableTop = doc.y + 10;
    const colWidths = [90, 70, 60, 50, 50, 50];
    const headers = ['Region', 'Mothers', 'Risk %', 'Nurses', 'Distance', 'Prevented'];
    const headerX = [60, 150, 220, 280, 330, 380];
    
    // Draw header row
    doc.rect(50, tableTop, 490, 18).fillColor('#5B2EFF').fill();
    headers.forEach((h, i) => {
      doc.fontSize(9).fillColor('#FFF').font('Helvetica-Bold').text(h, headerX[i], tableTop + 4, { width: colWidths[i] });
    });
    
    let tableY = tableTop + 18;
    mergedRegions.slice(0, 10).forEach((r, idx) => {
      const riskPct = r.totalMothers > 0 ? Math.round((r.highRiskCount / r.totalMothers) * 100) : 0;
      const bg = riskPct > 40 ? '#ffe0e0' : riskPct > 25 ? '#fff5e0' : '#e0f5e0';
      
      doc.rect(50, tableY, 490, 16).fillColor(bg).fill();
      doc.fontSize(8).fillColor('#333').font('Helvetica');
      doc.text(r.region, headerX[0], tableY + 2, { width: colWidths[0] });
      doc.text(r.totalMothers.toString(), headerX[1], tableY + 2, { width: colWidths[1], align: 'center' });
      doc.text(`${riskPct}%`, headerX[2], tableY + 2, { width: colWidths[2], align: 'center' });
      doc.text(r.activeNurses?.toString() || '0', headerX[3], tableY + 2, { width: colWidths[3], align: 'center' });
      doc.text(`${r.avgDistanceToHospital || 0} km`, headerX[4], tableY + 2, { width: colWidths[4], align: 'center' });
      doc.text((r.preventedComplications || 0).toString(), headerX[5], tableY + 2, { width: colWidths[5], align: 'center' });
      
      tableY += 16;
    });
    doc.moveDown(Math.ceil(Math.min(mergedRegions.length, 10) * 16 / 15) + 1);

    // ════════════════════════════════════════════════════════════════
    // PAGE BREAK
    // ════════════════════════════════════════════════════════════════
    doc.addPage();

    // ════════════════════════════════════════════════════════════════
    // INTERVENTION METRICS
    // ════════════════════════════════════════════════════════════════
    doc.fontSize(16).fillColor('#5B2EFF').font('Helvetica-Bold').text('Healthcare Intervention & Prevention');
    doc.moveDown(0.5);
    
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    doc.text(`✓ Nurse Visits Completed: ${nurseVisits}`, 60);
    doc.text(`✓ SMS Alerts Delivered: ${smsSent}`, 60);
    doc.text(`✓ Complications Prevented: ${preventedComplications}`, 60);
    doc.text(`✓ Prevention Rate: ${totalRisks > 0 ? Math.round((preventedComplications / totalRisks) * 100) : 0}%`, 60);
    doc.moveDown(1);

    // ════════════════════════════════════════════════════════════════
    // SYSTEM IMPACT & RECOMMENDATIONS
    // ════════════════════════════════════════════════════════════════
    doc.fontSize(14).fillColor('#5B2EFF').font('Helvetica-Bold').text('Hospital Recommendations');
    doc.moveDown(0.3);
    
    const recommendations = [
      highRiskMothers > 0 ? `Schedule urgent consultations for ${highRiskMothers} high-risk mothers` : 'Maintain current monitoring protocols',
      pendingApprovals > 0 ? `Review and approve ${pendingApprovals} pending healthcare provider accounts` : 'All providers approved',
      'Ensure SMS notification system is operational for timely alerts',
      'Conduct bi-weekly risk assessment reviews with clinical team',
      'Monitor regional heatmap for coverage gaps and resource allocation',
      'Schedule quarterly data review meetings with stakeholders'
    ];

    recommendations.forEach((rec, i) => {
      doc.fontSize(10).fillColor('#333').font('Helvetica');
      doc.text(`${i + 1}. ${rec}`, 60, doc.y, { width: 450 });
      doc.moveDown(0.4);
    });
    doc.moveDown(0.5);

    // ════════════════════════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════════════════════════
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#5B2EFF');
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#999').font('Helvetica').text(
      'Sheon AI — Bias-Calibrated Predictive Maternal Intelligence & Care Network\nDesigned for Hospital Integration | Real-time Risk Monitoring | Evidence-Based Interventions',
      { align: 'center' }
    );
    doc.fontSize(8).fillColor('#ccc').text(`Confidential Hospital Document | ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/sms-logs
router.get('/sms-logs', protect, authorize('admin'), async (req, res) => {
  try {
    const logs = await SMSLog.find().sort({ createdAt: -1 }).limit(50).populate('recipientId', 'name');
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
