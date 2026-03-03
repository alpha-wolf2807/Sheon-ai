const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CommunityPost = require('../models/CommunityPost');

// GET /api/community/posts
router.get('/posts', protect, async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const posts = await CommunityPost.find(query)
      .populate('authorId', 'name')
      .populate('comments.userId', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(50);
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/community/posts
router.post('/posts', protect, async (req, res) => {
  try {
    const { content, category, isAnonymous } = req.body;
    const post = await CommunityPost.create({
      authorId: req.user._id,
      content,
      category: category || 'general',
      isAnonymous: isAnonymous || false
    });
    const populated = await CommunityPost.findById(post._id).populate('authorId', 'name');
    res.status(201).json({ post: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/community/posts/:postId/like
router.post('/posts/:postId/like', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    const userIdStr = req.user._id.toString();
    const liked = post.likes.map(id => id.toString()).includes(userIdStr);
    if (liked) {
      post.likes = post.likes.filter(id => id.toString() !== userIdStr);
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();
    res.json({ liked: !liked, likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/community/posts/:postId/comment
router.post('/posts/:postId/comment', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: { userId: req.user._id, content: req.body.content } } },
      { new: true }
    ).populate('authorId', 'name').populate('comments.userId', 'name');
    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
