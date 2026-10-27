const express = require('express');
const router = express.Router();
const { addBookmark, getBookmarks, removeBookmark, updateBookmark, createCollection, getCollections, getCollectionById, updateCollection, deleteCollection, addPaperToCollection, removePaperFromCollection } = require('../controllers/libraryController');
const { verifyToken } = require('../../../../shared/auth');

router.use(verifyToken);

router.post('/bookmarks', addBookmark);
router.get('/bookmarks', getBookmarks);
router.put('/bookmarks/:id', updateBookmark);
router.delete('/bookmarks/:id', removeBookmark);

router.post('/collections', createCollection);
router.get('/collections', getCollections);
router.get('/collections/:id', getCollectionById);
router.put('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);
router.post('/collections/:id/papers', addPaperToCollection);
router.delete('/collections/:id/papers/:paperId', removePaperFromCollection);

module.exports = router;
