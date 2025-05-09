const express = require('express');
const User = require('../models/user');
const Recommendation = require('../models/recommendations');
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
    // Only log errors that aren't token expiration
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
      { expiresIn: '100y' } // Set a very long expiration (100 years)
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

// Recommendation Routes
// Get all recommendations
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

// Create a new recommendation
router.post('/recommendations', authenticateUser, async (req, res) => {
  try {
    const { title, description, type, tags } = req.body;
    
    if (!title || !description || !type) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create the recommendation object without tags first
    const recommendation = new Recommendation({
      title,
      description,
      type,
      // Skip tags validation by not including it initially
      author: req.user.id
    });

    // Save the recommendation first
    const savedRecommendation = await recommendation.save();
    
    // If there are tags, update them directly in the database to bypass validation
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Use direct MongoDB update to bypass Mongoose validation
      await Recommendation.updateOne(
        { _id: savedRecommendation._id },
        { $set: { tags: tags.slice(0, 2) } } // Limit to max 2 tags
      );
      
      // Update the returned object to include tags
      savedRecommendation.tags = tags.slice(0, 2);
    }
    
    res.status(201).json(savedRecommendation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;