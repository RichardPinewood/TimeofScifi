const express = require('express');
const User = require('../models/user');
const Recommendation = require('../models/recommendations');
const Comment = require('../models/comment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers['x-auth-token'] || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name !== 'TokenExpiredError') {
      console.error('Authentication error:', error.message);
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await newUser.save();
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const payload = {
      id: user._id,
      email: user.email
    };
    
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '100y' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await Recommendation.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/recommendations/:id', async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id)
      .populate('author', 'username');
      
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/discussion/:id', async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id)
      .populate('author', 'username');
      
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    const comments = await Comment.find({ recommendationId: req.params.id })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    
    res.json({
      recommendation,
      comments
    });
  } catch (error) {
    console.error('Error in discussion endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/recommendations', authenticateUser, async (req, res) => {
  try {
    const { title, description, type, tags } = req.body;
    
    if (!title || !description || !type) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const recommendation = new Recommendation({
      title,
      description,
      type,
      author: req.user.id
    });

    const savedRecommendation = await recommendation.save();
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await Recommendation.updateOne(
        { _id: savedRecommendation._id },
        { $set: { tags: tags.slice(0, 2) } }
      );
      
      savedRecommendation.tags = tags.slice(0, 2);
    }
    
    res.status(201).json(savedRecommendation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/recommendations/:recommendationId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ 
      recommendationId: req.params.recommendationId 
    })
    .populate('author', 'username')
    .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/recommendations/:recommendationId/comments', authenticateUser, async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    
    const recommendation = await Recommendation.findById(req.params.recommendationId);
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    const comment = new Comment({
      recommendationId: req.params.recommendationId,
      author: req.user.id,
      content,
      parentComment: parentComment || null
    });
    
    await comment.save();
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username');
      
    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/comments/:commentId/vote', authenticateUser, async (req, res) => {
  try {
    const { voteType } = req.body;
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    const userId = req.user.id;
    
    comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
    comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
    
    if (voteType === 'upvote') {
      comment.upvotes.push(userId);
    } else if (voteType === 'downvote') {
      comment.downvotes.push(userId);
    }
    
    await comment.save();
    res.json({ 
      upvotes: comment.upvotes.length,
      downvotes: comment.downvotes.length,
      voteCount: comment.upvotes.length - comment.downvotes.length
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/comments/:commentId', authenticateUser, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    await Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;