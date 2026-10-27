const mongoose = require('mongoose');

const paperAnalysisSchema = new mongoose.Schema(
  {
    paperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper',
      required: true,
    },
    summary: {
      type: String,
      default: '',
    },
    researchProblem: {
      type: String,
      default: '',
    },
    objectives: {
      type: String,
      default: '',
    },
    researchDomain: {
      type: String,
      default: '',
    },
    keywords: {
      type: [String],
      default: [],
    },
    importantConcepts: {
      type: [String],
      default: [],
    },
    methodology: {
      type: String,
      default: '',
    },
    majorFindings: {
      type: [String],
      default: [],
    },
    limitations: {
      type: [String],
      default: [],
    },
    researchGaps: {
      type: [String],
      default: [],
    },
    futureDirections: {
      type: [String],
      default: [],
    },
    relatedTopics: {
      type: [String],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    aiProvider: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

paperAnalysisSchema.index({ paperId: 1 }, { unique: true });

module.exports = mongoose.model('PaperAnalysis', paperAnalysisSchema);
