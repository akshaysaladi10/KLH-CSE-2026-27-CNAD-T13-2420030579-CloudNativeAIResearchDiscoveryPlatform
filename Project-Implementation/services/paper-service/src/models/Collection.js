const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Collection name is required'], trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    paperIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paper' }],
    isPublic: { type: Boolean, default: false },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Collection', collectionSchema);
