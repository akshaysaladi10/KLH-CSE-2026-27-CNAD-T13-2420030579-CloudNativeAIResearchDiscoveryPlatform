const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 500,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    authors: [
      {
        name: { type: String, required: true },
        affiliation: { type: String, default: '' },
      },
    ],
    abstract: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    publicationYear: {
      type: Number,
      min: 1900,
      max: 2100,
    },
    journal: {
      type: String,
      default: '',
      trim: true,
    },
    publisher: {
      type: String,
      default: '',
      trim: true,
    },
    doi: {
      type: String,
      trim: true,
      sparse: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ['openalex', 'arxiv', 'crossref', 'upload', 'manual', 'abstract'],
      default: 'manual',
    },
    externalId: {
      type: String,
      default: '',
    },
    pdfUrl: {
      type: String,
      default: '',
    },
    s3Key: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fullText: {
      type: String,
      default: '',
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    userNotes: {
      type: String,
      default: '',
      maxlength: 5000,
    },
    highlights: {
      type: [String],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
    citationCount: {
      type: Number,
      default: 0,
    },
    researchDomain: {
      type: String,
      default: 'Computer Science',
      trim: true,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'extracting', 'analyzing', 'completed', 'failed', 'completed_without_ai'],
      default: 'pending',
    },
    isAnalyzed: {
      type: Boolean,
      default: false,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    references: [
      {
        title: { type: String, default: '' },
        authors: { type: String, default: '' },
        year: { type: Number },
        doi: { type: String, default: '' },
        raw: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Text indexes for search
paperSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });
paperSchema.index({ uploadedBy: 1 });
paperSchema.index({ source: 1 });
paperSchema.index({ publicationYear: -1 });
paperSchema.index({ externalId: 1, source: 1 });

module.exports = mongoose.model('Paper', paperSchema, 'papers');
