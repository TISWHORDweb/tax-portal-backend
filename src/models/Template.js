import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['annual_returns', 'remittance_schedule', 'withholding_tax'],
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true,
      default: '1.0'
    },
    originalFilename: { type: String },
    fileExtension: { type: String },
    downloadCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Template = mongoose.model('Template', templateSchema);

export default Template;