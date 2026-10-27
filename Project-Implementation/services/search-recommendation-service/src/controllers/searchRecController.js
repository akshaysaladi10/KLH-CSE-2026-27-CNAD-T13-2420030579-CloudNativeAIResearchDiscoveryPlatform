const { searchOpenAlex } = require('../providers/openalexProvider');
const SearchHistory = require('../models/SearchHistory');
const Recommendation = require('../models/Recommendation');
const { AppError, asyncHandler } = require('../../../../shared/errors');
const { createLogger } = require('../../../../shared/logger');
const mongoose = require('mongoose');

const logger = createLogger('search-rec-controller');

// Lazy load references to models living in other services
const getPaperModel = () => {
  if (mongoose.models.Paper) return mongoose.models.Paper;
  return mongoose.model('Paper', new mongoose.Schema({}, { strict: false, collection: 'papers' }));
};

const getBookmarkModel = () => {
  if (mongoose.models.Bookmark) return mongoose.models.Bookmark;
  return mongoose.model('Bookmark', new mongoose.Schema({}, { strict: false, collection: 'bookmarks' }));
};

// ── SEARCH ──
const search = asyncHandler(async (req, res) => {
  const { q, page = 1, perPage = 10, source = 'openalex' } = req.query;

  if (!q || q.trim().length === 0) {
    throw new AppError('Search query is required', 400);
  }

  const pageNum = parseInt(page);
  const perPageNum = Math.min(parseInt(perPage), 50);

  let results = { papers: [], total: 0 };

  if (source === 'openalex') {
    try {
      results = await searchOpenAlex(q, { page: pageNum, perPage: perPageNum });
    } catch (oaErr) {
      logger.warn(`OpenAlex search failed: ${oaErr.message}. Falling back to local catalog.`);
      const Paper = getPaperModel();
      const skip = (pageNum - 1) * perPageNum;
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const filter = {
        $or: [
          { title: regex },
          { 'authors.name': regex },
          { keywords: regex },
          { researchDomain: regex },
          { abstract: regex },
        ],
      };
      const [papers, total] = await Promise.all([
        Paper.find(filter).skip(skip).limit(perPageNum).select('-fullText'),
        Paper.countDocuments(filter),
      ]);
      results = {
        papers,
        total,
        page: pageNum,
        perPage: perPageNum,
        fallback: true,
        notice: 'External academic search is temporarily unreachable. Displaying relevant publications from local repository.',
      };
    }
  } else if (source === 'local') {
    const Paper = getPaperModel();
    const skip = (pageNum - 1) * perPageNum;
    
    let papers = [];
    let total = 0;
    try {
      [papers, total] = await Promise.all([
        Paper.find({ $text: { $search: q } }).sort({ score: { $meta: 'textScore' } }).skip(skip).limit(perPageNum).select('-fullText'),
        Paper.countDocuments({ $text: { $search: q } })
      ]);
    } catch (err) {
      // Text index may not be present
    }

    // If text index was missing or returned 0 results, fall back to case-insensitive regex
    if (!papers || papers.length === 0) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const filter = {
        $or: [
          { title: regex },
          { 'authors.name': regex },
          { keywords: regex },
          { researchDomain: regex },
          { abstract: regex },
        ],
      };
      [papers, total] = await Promise.all([
        Paper.find(filter).skip(skip).limit(perPageNum).select('-fullText'),
        Paper.countDocuments(filter),
      ]);
    }
    results = { papers, total, page: pageNum, perPage: perPageNum };
  } else {
    try {
      results = await searchOpenAlex(q, { page: pageNum, perPage: perPageNum });
    } catch {
      results = { papers: [], total: 0, page: pageNum, perPage: perPageNum };
    }
  }

  if (req.user) {
    try {
      await SearchHistory.create({
        userId: req.user.id,
        query: q,
        filters: { source, page: pageNum },
        resultCount: results.papers.length,
        source: source || 'openalex',
      });
    } catch (err) {
      logger.warn('Failed to save search history:', err.message);
    }
  }

  res.json({
    success: true,
    data: {
      ...results,
      query: q,
      source: source || 'openalex',
    },
  });
});

const getSearchHistory = asyncHandler(async (req, res) => {
  const history = await SearchHistory.find({ userId: req.user.id }).sort('-createdAt').limit(20);
  res.json({ success: true, data: { history } });
});

// ── RECOMMENDATIONS ──
const calculateKeywordSimilarity = (keywords1, keywords2) => {
  if (!keywords1.length || !keywords2.length) return 0;
  const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
  const set2 = new Set(keywords2.map((k) => k.toLowerCase()));
  let intersection = 0;
  for (const k of set1) { if (set2.has(k)) intersection++; }
  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
};

const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await Recommendation.find({ userId: req.user.id }).sort('-score').limit(10);
  
  const Paper = getPaperModel();
  const paperIds = recommendations.map((r) => r.paperId);
  const papers = await Paper.find({ _id: { $in: paperIds } }).select('-fullText');
  
  const paperMap = {};
  papers.forEach((p) => { paperMap[p._id.toString()] = p; });

  const enrichedRecs = recommendations.map((rec) => ({
    ...rec.toJSON(),
    paper: paperMap[rec.paperId.toString()] || null,
  }));

  res.json({ success: true, data: { recommendations: enrichedRecs } });
});

const generateRecommendations = asyncHandler(async (req, res) => {
  const Paper = getPaperModel();
  const Bookmark = getBookmarkModel();

  const bookmarks = await Bookmark.find({ userId: req.user.id }).select('paperId');
  const bookmarkedIds = bookmarks.map((b) => b.paperId);

  const userPapers = await Paper.find({
    $or: [{ _id: { $in: bookmarkedIds } }, { uploadedBy: req.user.id }],
  }).select('keywords title abstract');

  if (userPapers.length === 0) {
    return res.json({ success: true, data: { recommendations: [], message: 'Save or upload papers first to get recommendations' } });
  }

  const userKeywords = [...new Set(userPapers.flatMap((p) => p.keywords || []))];
  const excludeIds = [...bookmarkedIds, ...userPapers.map((p) => p._id)];
  
  const candidatePapers = await Paper.find({
    _id: { $nin: excludeIds },
    keywords: { $in: userKeywords },
  }).select('keywords title abstract').limit(100);

  const scoredCandidates = candidatePapers.map((candidate) => {
    const similarity = calculateKeywordSimilarity(userKeywords, candidate.keywords || []);
    const matchingKeywords = (candidate.keywords || []).filter((k) =>
      userKeywords.map((uk) => uk.toLowerCase()).includes(k.toLowerCase())
    );

    return {
      paperId: candidate._id,
      score: Math.round(similarity * 100) / 100,
      reason: `Shares keywords: ${matchingKeywords.slice(0, 3).join(', ')}`,
      basedOn: userPapers.slice(0, 3).map((p) => p._id),
      method: 'keyword',
    };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);
  const topRecs = scoredCandidates.slice(0, 10);

  await Recommendation.deleteMany({ userId: req.user.id });
  const savedRecs = await Recommendation.insertMany(topRecs.map((r) => ({ ...r, userId: req.user.id })));

  res.json({ success: true, data: { recommendations: savedRecs } });
});

// ── RELATED PAPERS FOR A SPECIFIC PAPER ──
const getRelatedPapers = asyncHandler(async (req, res) => {
  const { paperId } = req.params;
  const Paper = getPaperModel();

  if (!mongoose.Types.ObjectId.isValid(paperId)) {
    return res.json({ success: true, data: { relatedPapers: [] } });
  }

  const currentPaper = await Paper.findById(paperId);
  if (!currentPaper) {
    throw new AppError('Paper not found', 404);
  }

  const currentKeywords = currentPaper.keywords || [];
  const currentDomain = currentPaper.researchDomain || '';

  // Find candidate papers excluding this one
  const candidates = await Paper.find({
    _id: { $ne: currentPaper._id },
    $or: [
      { keywords: { $in: currentKeywords } },
      { researchDomain: currentDomain },
    ],
  })
    .limit(30)
    .select('title authors publicationYear abstract keywords researchDomain isAnalyzed');

  const scored = candidates.map((candidate) => {
    let score = 0;
    const similarity = calculateKeywordSimilarity(currentKeywords, candidate.keywords || []);
    score += similarity * 0.7;

    if (candidate.researchDomain && candidate.researchDomain === currentDomain) {
      score += 0.3;
    }

    return {
      paper: candidate,
      score: Math.round(score * 100) / 100,
      sharedKeywords: (candidate.keywords || []).filter((k) =>
        currentKeywords.map((ck) => ck.toLowerCase()).includes(k.toLowerCase())
      ),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const relatedPapers = scored.slice(0, 6);

  res.json({
    success: true,
    data: {
      relatedPapers,
      basePaperId: paperId,
    },
  });
});

// ── IMPORT PAPER FROM EXTERNAL / OPENALEX ──
const importPaper = asyncHandler(async (req, res) => {
  const paperData = req.body;
  if (!paperData || !paperData.title) {
    throw new AppError('Paper title is required', 400);
  }

  const Paper = getPaperModel();

  // Check if paper already exists by externalId, DOI, or exact title
  let existing = null;
  if (paperData.externalId) {
    existing = await Paper.findOne({ externalId: paperData.externalId });
  }
  if (!existing && paperData.doi) {
    existing = await Paper.findOne({ doi: paperData.doi });
  }
  if (!existing) {
    existing = await Paper.findOne({ title: paperData.title.trim() });
  }

  const targetPaper = existing || await Paper.create({
    title: paperData.title.trim(),
    authors: paperData.authors || [],
    abstract: paperData.abstract || '',
    publicationYear: parseInt(paperData.publicationYear) || new Date().getFullYear(),
    journal: paperData.journal || '',
    doi: paperData.doi || '',
    keywords: paperData.keywords || [],
    source: 'openalex',
    externalId: paperData.externalId || '',
    pdfUrl: paperData.pdfUrl || '',
    citationCount: paperData.citationCount || 0,
    researchDomain: paperData.researchDomain || 'Computer Science',
    uploadedBy: req.user ? req.user.id : null,
    processingStatus: 'completed_without_ai',
  });

  // Automatically bookmark for the user so it's directly accessible in Saved Bookmarks
  if (req.user && req.user.id) {
    try {
      const Bookmark = getBookmarkModel();
      const existingBookmark = await Bookmark.findOne({ userId: req.user.id, paperId: targetPaper._id });
      if (!existingBookmark) {
        await Bookmark.create({ userId: req.user.id, paperId: targetPaper._id });
      }
    } catch (bErr) {
      logger.warn(`Could not auto-bookmark imported paper: ${bErr.message}`);
    }
  }

  if (existing) {
    return res.json({
      success: true,
      message: 'Paper already exists in platform library and has been bookmarked',
      data: { paper: existing, isExisting: true },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Paper imported into platform library and bookmarked successfully',
    data: { paper: targetPaper, isExisting: false },
  });
});

// Extract key terms from text
const extractKeywordsFromAbstract = (text) => {
  const stopwords = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'were', 'which',
    'been', 'their', 'they', 'will', 'more', 'these', 'when', 'also', 'into', 'than',
    'them', 'some', 'such', 'other', 'most', 'over', 'only', 'after', 'even', 'then',
    'while', 'where', 'each', 'what', 'both', 'between', 'under', 'through', 'about',
    'paper', 'using', 'used', 'based', 'approach', 'system', 'proposed', 'results',
    'research', 'study', 'presents', 'evaluates', 'investigates'
  ]);
  const words = text.toLowerCase().match(/\b[a-zA-Z]{4,}\b/g) || [];
  const freq = {};
  for (const w of words) {
    if (!stopwords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
};

// ── RECOMMENDATIONS BY ABSTRACT ──
const getRecommendationsByAbstract = asyncHandler(async (req, res) => {
  const { abstract, title = '', limit = 6 } = req.body;
  if (!abstract || !abstract.trim()) {
    throw new AppError('Abstract text is required for contextual recommendations', 400);
  }

  const extractedKeywords = extractKeywordsFromAbstract(abstract);
  const Paper = getPaperModel();

  // Search candidate papers in local database
  const regexList = extractedKeywords.slice(0, 5).map((k) => new RegExp(k, 'i'));
  const candidatePapers = await Paper.find({
    $or: [
      { keywords: { $in: extractedKeywords } },
      ...regexList.map((r) => ({ title: r })),
      ...regexList.map((r) => ({ abstract: r })),
    ],
  })
    .limit(30)
    .select('title authors publicationYear abstract keywords researchDomain isAnalyzed source externalId');

  const scoredCandidates = candidatePapers.map((candidate) => {
    const similarity = calculateKeywordSimilarity(extractedKeywords, candidate.keywords || []);
    const sharedKeywords = (candidate.keywords || []).filter((k) =>
      extractedKeywords.map((ek) => ek.toLowerCase()).includes(k.toLowerCase())
    );
    return {
      paper: candidate,
      score: Math.round(similarity * 100) / 100,
      sharedKeywords,
      matchReason: sharedKeywords.length > 0 
        ? `Overlapping topics: ${sharedKeywords.slice(0, 3).join(', ')}`
        : 'Domain alignment',
    };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);
  const recommendations = scoredCandidates.slice(0, parseInt(limit) || 6);

  res.json({
    success: true,
    data: {
      recommendations,
      extractedKeywords,
      querySnippet: abstract.slice(0, 150) + '...',
    },
  });
});

module.exports = {
  search,
  getSearchHistory,
  getRecommendations,
  generateRecommendations,
  getRelatedPapers,
  importPaper,
  getRecommendationsByAbstract,
  calculateKeywordSimilarity,
  extractKeywordsFromAbstract,
};
