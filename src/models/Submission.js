import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    templateType: {
      type: String,
      required: true
    },
    taxPeriod: {
      type: String,
      required: true
    },
    mainFileUrl: {
      type: String,
      required: true
    },
    mainFileCloudinaryId: {
      type: String,
      required: true
    },
    supportingDocUrl: {
      type: String,
      required: true
    },
    supportingDocCloudinaryId: {
      type: String,
      required: true
    },
    comments: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewComments: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;