const express = require('express');
const router = express.Router();
const {
  search,
  getSearchHistory,
  getRecommendations,
  generateRecommendations,
  getRelatedPapers,
  importPaper,
  getRecommendationsByAbstract,
} = require('../controllers/searchRecController');
const { verifyToken } = require('../../../../shared/auth');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

// Search Routes
router.get('/search', optionalAuth, search);
router.post('/search/import', optionalAuth, importPaper);
router.get('/search/history', verifyToken, getSearchHistory);

// Recommendation Routes
router.get('/recommendations', verifyToken, getRecommendations);
router.get('/recommendations/paper/:paperId', getRelatedPapers);
router.post('/recommendations/generate', verifyToken, generateRecommendations);
router.post('/recommendations/abstract', optionalAuth, getRecommendationsByAbstract);

module.exports = router;
