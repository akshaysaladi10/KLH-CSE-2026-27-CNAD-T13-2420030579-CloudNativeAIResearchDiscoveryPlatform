const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true, trim: true },
    filters: { type: Object, default: {} },
    resultCount: { type: Number, default: 0 },
    source: { type: String, default: 'openalex' },
  },
  { timestamps: true }
);

searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
module.exports = mongoose.model('SearchHistory', searchHistorySchema);
