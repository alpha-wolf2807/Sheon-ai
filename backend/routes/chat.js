const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const { sendDoctorUrgentReply } = require('../services/smsService');
const User = require('../models/User');

// GET /api/chat/:roomId/messages
router.get('/:roomId/messages', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.roomId })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/chat/:roomId/send
router.post('/:roomId/send', protect, async (req, res) => {
  try {
    const { message, receiverId, messageType, isUrgent } = req.body;
    
    const chatMsg = await ChatMessage.create({
      roomId: req.params.roomId,
      senderId: req.user._id,
      receiverId,
      message,
      messageType: messageType || 'text',
      isUrgent: isUrgent || false
    });

    const populated = await ChatMessage.findById(chatMsg._id).populate('senderId', 'name role');

    // Emit via socket
    const io = req.app.get('io');
    io.to(req.params.roomId).emit('receive-message', populated);

    // SMS for urgent doctor messages
    if (isUrgent && req.user.role === 'doctor' && receiverId) {
      const mother = await User.findById(receiverId);
      if (mother?.phone) {
        await sendDoctorUrgentReply(mother, req.user.name);
      }
    }

    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/chat/conversations - Get all chat rooms for a user
router.get('/my/conversations', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.aggregate([
      { $match: { $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$roomId', lastMessage: { $first: '$$ROOT' } } }
    ]);
    res.json({ conversations: messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
