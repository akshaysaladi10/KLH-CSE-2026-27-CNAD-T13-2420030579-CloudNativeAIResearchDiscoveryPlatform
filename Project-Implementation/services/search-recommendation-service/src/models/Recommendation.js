const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper', required: true },
    score: { type: Number, default: 0, min: 0, max: 1 },
    reason: { type: String, default: '' },
    basedOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paper' }],
    method: { type: String, enum: ['keyword', 'topic'], default: 'keyword' },
  },
  { timestamps: true }
);

recommendationSchema.index({ userId: 1, score: -1 });
module.exports = mongoose.model('Recommendation', recommendationSchema);
