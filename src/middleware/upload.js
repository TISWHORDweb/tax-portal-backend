import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary storage for templates
const templateStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tax-templates',
    resource_type: 'raw', // Let Cloudinary detect the file type
    format: 'auto', 
    public_id: (req, file) => {
      // Remove extension from filename to prevent double extensions
      return `${file.originalname.split('.')[0]}-${Date.now()}`;
    }
  },
  filename: (req, file, cb) => {
    // This will be used to set a custom filename
    cb(null, file.originalname);
  }
});

// Configure Cloudinary storage for submissions
const submissionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tax-submissions',
    resource_type: 'auto',
    // format: 'auto',
    public_id: (req, file) => {
      // Remove extension from filename to prevent double extensions
      return `${file.originalname.split('.')[0]}-${Date.now()}`;
    }
  }
});


// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload Excel, Word, or PDF files.'), false);
  }
};

// File filter for supporting documents (allows images too)
const supportingDocsFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload Excel, Word, PDF, or image files.'), false);
  }
};

// Multer upload for templates
export const uploadTemplate = multer({
  storage: templateStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Multer upload for main submission file
export const uploadSubmissionMain = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Multer upload for supporting documents
export const uploadSupportingDocs = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: supportingDocsFilter
});

// Error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    console.log(err)
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.log(err)
    return res.status(400).json({ message: err.message });
  }
  next();
};