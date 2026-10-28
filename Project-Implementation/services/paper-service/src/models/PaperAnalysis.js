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
    executiveSummary: {
      type: String,
      default: '',
    },
    researchProblem: {
      type: String,
      default: '',
    },
    problemStatement: {
      type: String,
      default: '',
    },
    objectives: {
      type: String,
      default: '',
    },
    researchQuestions: {
      type: [String],
      default: [],
    },
    backgroundMotivation: {
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
    methodologyWorkflow: {
      type: String,
      default: '',
    },
    algorithms: {
      type: [String],
      default: [],
    },
    technologies: {
      type: [String],
      default: [],
    },
    datasets: {
      type: [String],
      default: [],
    },
    experimentalResults: {
      type: [String],
      default: [],
    },
    evaluationMetrics: {
      type: [String],
      default: [],
    },
    majorFindings: {
      type: [String],
      default: [],
    },
    contributionsNovelty: {
      type: [String],
      default: [],
    },
    limitations: {
      type: [String],
      default: [],
    },
    authorLimitations: {
      type: [String],
      default: [],
    },
    aiInferredGaps: {
      type: [String],
      default: [],
    },
    gapEvidence: {
      type: [String],
      default: [],
    },
    suggestedExperiments: {
      type: [String],
      default: [],
    },
    structuredGaps: [
      {
        category: {
          type: String,
          enum: ['author_reported', 'ai_inferred'],
          default: 'author_reported',
        },
        title: {
          type: String,
          default: '',
        },
        explanation: {
          type: String,
          default: '',
        },
        supportingText: {
          type: String,
          default: '',
        },
        pageReference: {
          type: String,
          default: '',
        },
        suggestedExperiment: {
          type: String,
          default: '',
        },
      },
    ],
    conclusion: {
      type: String,
      default: '',
    },
    researchGaps: {
      type: [String],
      default: [],
    },
    researchGapsDetailed: {
      unresolvedProblems: { type: [String], default: [] },
      existingApproachLimitations: { type: [String], default: [] },
      researchOpportunities: { type: [String], default: [] },
    },
    futureDirections: {
      type: [String],
      default: [],
    },
    relatedTopics: {
      type: [String],
      default: [],
    },
    analysisHistory: [
      {
        provider: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        summary: { type: String, default: '' },
        isConfigured: { type: Boolean, default: false },
      },
    ],
    references: [
      {
        title: { type: String, default: '' },
        authors: { type: String, default: '' },
        year: { type: Number },
        doi: { type: String, default: '' },
        raw: { type: String, default: '' },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    aiProvider: {
      type: String,
      default: '',
    },
    isConfigured: {
      type: Boolean,
      default: true,
    },
    configError: {
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
