const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const VisitAssignment = require('../models/VisitAssignment');

router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'nurse' ? { nurseId: req.user._id } :
                  req.user.role === 'mother' ? { motherId: req.user._id } : {};
    const visits = await VisitAssignment.find(query)
      .populate('motherId', 'name phone')
      .populate('nurseId', 'name phone')
      .sort({ scheduledDate: 1 });
    res.json({ visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
