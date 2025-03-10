import express from 'express';
import { body } from 'express-validator';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { uploadTemplate } from '../middleware/upload.js';
import Template from '../models/Template.js';

const router = express.Router();

// @route   GET /api/templates
// @desc    Get all active templates
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await Template.find({ isActive: true })
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/templates/types
// @desc    Get template types
// @access  Private
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const templates = await Template.find({ isActive: true })
      .select('name type')
      .sort({ type: 1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching template types:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/templates/count
// @desc    Get count of active templates
// @access  Private
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const count = await Template.countDocuments({ isActive: true });
    res.json({ count });
  } catch (error) {
    console.error('Error counting templates:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/templates/download-log
// @desc    Log template download
// @access  Private
router.post('/download-log', authenticateToken, async (req, res) => {
  try {
    const template = await Template.findById(req.body.templateId);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    template.downloadCount += 1;
    await template.save();

    res.json({ message: 'Download logged successfully' });
  } catch (error) {
    console.error('Error logging download:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Routes

// @route   GET /api/admin/templates
// @desc    Get all templates (including inactive)
// @access  Admin
router.get('/', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const templates = await Template.find()
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/templates
// @desc    Upload new template
// @access  Admin
router.post(
  '/',
  [
    authenticateToken,
    isAdmin,
    uploadTemplate.single('file'),
    body('name').notEmpty().withMessage('Template name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('type').isIn(['annual_returns', 'remittance_schedule', 'withholding_tax'])
      .withMessage('Invalid template type'),
    body('version').notEmpty().withMessage('Version is required')
  ],
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Please upload a template file' });
      }
      
      // Extract the file extension from original filename
      const originalFilename = req.file.originalname;
      const fileExtension = originalFilename.split('.').pop();
      
      const template = new Template({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        version: req.body.version,
        fileUrl: req.file.path,
        cloudinaryId: req.file.filename,
        originalFilename: originalFilename, // Store original filename
        fileExtension: fileExtension  // Store the file extension
      });
      
      await template.save();
      res.status(201).json(template);
    } catch (error) {
      console.error('Error uploading template:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/admin/templates/:id
// @desc    Delete template
// @access  Admin
router.delete('/:id', [authenticateToken, isAdmin], async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Instead of deleting, mark as inactive
    template.isActive = false;
    await template.save();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;