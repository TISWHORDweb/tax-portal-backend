import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { handleMulterError, uploadSubmissionMain, uploadSupportingDocs } from '../middleware/upload.js';
import Submission from '../models/Submission.js';
import multer from 'multer';

const router = express.Router();

// @route   GET /api/submissions/recent
// @desc    Get user's recent submissions
// @access  Private
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id })
      .sort({ submittedAt: -1 })
      .limit(5);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching recent submissions:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/submissions
// @desc    Create new submission
// @access  Private
router.post(
  '/',
  authenticateToken,
  // Use multer to handle multiple fields
  (req, res, next) => {
    const upload = multer({
      storage: uploadSubmissionMain.storage,
      limits: uploadSubmissionMain.limits,
      fileFilter: uploadSubmissionMain.fileFilter,
    }).fields([
      { name: 'mainFile', maxCount: 1 },
      { name: 'supportingDoc', maxCount: 1 },
    ]);

    upload(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log('Files:', req.files); // Log all uploaded files
      console.log('Body:', req.body); // Log the form data

      if (!req.files || !req.files.mainFile) {
        return res.status(400).json({ message: 'Please upload the main template file' });
      }

      const mainFile = req.files.mainFile[0];
      const supportingDoc = req.files.supportingDoc[0];
    

      const submission = new Submission({
        userId: req.user.id,
        templateType: req.body.templateType,
        taxPeriod: req.body.taxPeriod,
        mainFileUrl: mainFile.path,
        mainFileCloudinaryId: mainFile.filename,
        supportingDocUrl: supportingDoc.path,
        supportingDocCloudinaryId: supportingDoc.filename,
        comments: req.body.comments
      });

      await submission.save();
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating submission:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router;