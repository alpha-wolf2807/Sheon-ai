const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['general', 'nutrition', 'exercise', 'mental-health', 'baby-care', 'tips'], default: 'general' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isAnonymous: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
