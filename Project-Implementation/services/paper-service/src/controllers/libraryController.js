const Bookmark = require('../models/Bookmark');
const Collection = require('../models/Collection');
const Paper = require('../models/Paper');
const { AppError, asyncHandler } = require('../../../../shared/errors');

const addBookmark = asyncHandler(async (req, res) => {
  const { paperId, notes, tags } = req.body;
  if (!paperId) throw new AppError('Paper ID is required', 400);

  let bookmark = await Bookmark.findOne({ userId: req.user.id, paperId });
  if (bookmark) {
    return res.status(200).json({ success: true, data: { bookmark, isExisting: true } });
  }

  bookmark = await Bookmark.create({ userId: req.user.id, paperId, notes: notes || '', tags: tags || [] });
  res.status(201).json({ success: true, data: { bookmark, isExisting: false } });
});

const getBookmarks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    Bookmark.find({ userId: req.user.id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('paperId', 'title authors publicationYear abstract keywords researchDomain isAnalyzed source externalId'),
    Bookmark.countDocuments({ userId: req.user.id }),
  ]);

  res.json({ success: true, data: { bookmarks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

const removeBookmark = asyncHandler(async (req, res) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
  const filter = {
    userId: req.user.id,
    ...(isObjectId ? { $or: [{ _id: req.params.id }, { paperId: req.params.id }] } : { _id: req.params.id })
  };

  const bookmark = await Bookmark.findOneAndDelete(filter);
  if (!bookmark) throw new AppError('Bookmark not found', 404);
  res.json({ success: true, message: 'Bookmark removed' });
});

const updateBookmark = asyncHandler(async (req, res) => {
  const { notes, tags } = req.body;
  const bookmark = await Bookmark.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { ...(notes !== undefined && { notes }), ...(tags !== undefined && { tags }) },
    { new: true }
  );
  if (!bookmark) throw new AppError('Bookmark not found', 404);
  res.json({ success: true, data: { bookmark } });
});

const createCollection = asyncHandler(async (req, res) => {
  const { name, description, isPublic, color } = req.body;
  if (!name) throw new AppError('Collection name is required', 400);

  const collection = await Collection.create({ userId: req.user.id, name, description, isPublic, color });
  res.status(201).json({ success: true, data: { collection } });
});

const getCollections = asyncHandler(async (req, res) => {
  const collections = await Collection.find({ userId: req.user.id }).sort('-updatedAt');
  res.json({ success: true, data: { collections } });
});

const getCollectionById = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, $or: [{ userId: req.user.id }, { isPublic: true }] }).populate('paperIds', 'title authors publicationYear abstract keywords');
  if (!collection) throw new AppError('Collection not found', 404);
  res.json({ success: true, data: { collection } });
});

const updateCollection = asyncHandler(async (req, res) => {
  const updates = {};
  ['name', 'description', 'isPublic', 'color'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  
  const collection = await Collection.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, updates, { new: true });
  if (!collection) throw new AppError('Collection not found', 404);
  res.json({ success: true, data: { collection } });
});

const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!collection) throw new AppError('Collection not found', 404);
  res.json({ success: true, message: 'Collection deleted' });
});

const addPaperToCollection = asyncHandler(async (req, res) => {
  const { paperId } = req.body;
  if (!paperId) throw new AppError('Paper ID is required', 400);

  const collection = await Collection.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $addToSet: { paperIds: paperId } }, { new: true });
  if (!collection) throw new AppError('Collection not found', 404);
  res.json({ success: true, data: { collection } });
});

const removePaperFromCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { $pull: { paperIds: req.params.paperId } }, { new: true });
  if (!collection) throw new AppError('Collection not found', 404);
  res.json({ success: true, data: { collection } });
});

module.exports = { addBookmark, getBookmarks, removeBookmark, updateBookmark, createCollection, getCollections, getCollectionById, updateCollection, deleteCollection, addPaperToCollection, removePaperFromCollection };
