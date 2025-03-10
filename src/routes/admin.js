import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Template from '../models/Template.js';
import { sendTaxSubmissionApprovedEmail, sendTaxSubmissionDeclinedEmail } from '../services/index.js';

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTemplates = await Template.countDocuments({ isActive: true });
    const pendingSubmissions = await Submission.countDocuments({ status: 'pending' });

    const recentSubmissions = await Submission.find()
      .populate('userId', 'name nstin')
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('userId templateType status submittedAt');

    const formattedSubmissions = recentSubmissions.map(sub => ({
      _id: sub._id,
      nstin: sub.userId.nstin,
      userName: sub.userId.name,
      templateType: sub.templateType,
      status: sub.status,
      submittedAt: sub.submittedAt
    }));

    res.json({
      totalUsers,
      totalTemplates,
      pendingSubmissions,
      recentSubmissions: formattedSubmissions
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
// @access  Admin
router.get('/users', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const searchTerm = req.query.search || '';

    const searchQuery = searchTerm
      ? {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { nstin: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      : {};

    const totalUsers = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(searchQuery)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
      currentPage: page,
      totalPages,
      totalUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Admin
router.post('/users', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const { nstin, name, email, phone, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ $or: [{ nstin }, { email }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this NSTIN or email' });
    }

    user = new User({
      nstin,
      name,
      email,
      phone,
      password,
      role: role || 'user'
    });

    await user.save();

    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin
router.put('/users/:id', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already in use by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;

    if (password) {
      user.password = password;
    }

    await user.save();

    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/submissions
// @desc    Get all submissions with pagination and filters
// @access  Admin
router.get('/submissions', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const searchTerm = req.query.search || '';
    const status = req.query.status;

    let query = {};

    if (searchTerm) {
      query.$or = [
        { 'userId.name': { $regex: searchTerm, $options: 'i' } },
        { 'userId.nstin': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const totalSubmissions = await Submission.countDocuments(query);
    const totalPages = Math.ceil(totalSubmissions / limit);

    const submissions = await Submission.find(query)
      .populate('userId', 'name nstin email')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      submissions,
      currentPage: page,
      totalPages,
      totalSubmissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/submissions/:id/approve
// @desc    Approve submission
// @access  Admin
router.put('/submissions/:id/approve', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = 'approved';
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.user.id;
    submission.reviewComments = req.body.reviewComments;
    await submission.save();
    const user = await User.findById({_id: submission.userId});
  
    const userData = {
      email: user.email,
      name: user.name
    };
    await sendTaxSubmissionApprovedEmail(userData)
    res.json(submission);
  } catch (error) {
    console.error('Error approving submission:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/submissions/:id/reject
// @desc    Reject submission
// @access  Admin
router.put('/submissions/:id/reject', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (!req.body.reviewComments) {
      return res.status(400).json({ message: 'Review comments are required for rejection' });
    }

    submission.status = 'rejected';
    submission.reviewedAt = new Date();
    submission.reviewedBy = req.user.id;
    submission.reviewComments = req.body.reviewComments;

    await submission.save();
    const user = await User.findById({_id: submission.userId});
  
    const userData = {
      email: user.email,
      name: user.name
    };
    await sendTaxSubmissionDeclinedEmail(userData)
    res.json(submission);
  } catch (error) {
    console.error('Error rejecting submission:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;