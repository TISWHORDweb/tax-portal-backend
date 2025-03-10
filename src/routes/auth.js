import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/auth/enroll
// @desc    Register a new user
// @access  Public
router.post(
  '/enroll',
  [
    body('nstin', 'NSTIN is required').notEmpty().isLength({ min: 10, max: 15 }),
    body('name', 'Name is required').notEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('phone', 'Phone number is required').notEmpty().isLength({ min: 10, max: 15 }),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nstin, name, email, phone, password } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ $or: [{ nstin }, { email }] });
      if (user) {
        return res.status(400).json({ message: 'User already exists with this NSTIN or email' });
      }

      // Create new user
      user = new User({
        nstin,
        name,
        email,
        phone,
        password
      });

      await user.save();

      // Create JWT token
      const payload = {
        id: user.id,
        nstin: user.nstin,
        name: user.name,
        email: user.email,
        role: user.role
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error('Error in user enrollment:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('nstin', 'NSTIN is required').notEmpty(),
    body('password', 'Password is required').exists()
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nstin, password } = req.body;

    try {
      // Check if user exists
      const user = await User.findOne({ nstin });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Create JWT token
      const payload = {
        id: user.id,
        nstin: user.nstin,
        name: user.name,
        email: user.email,
        role: user.role
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error('Error in user login:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;