
const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');

router.post('/send', async (req, res) => {
  const { sender, receiver, message } = req.body;
  const newMsg = await DirectMessage.create({ sender, receiver, message });
  res.json(newMsg);
});

router.get('/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await DirectMessage.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 }
    ]
  }).sort({ createdAt: 1 });
  res.json(messages);
});

module.exports = router;
