const Paper = require('../models/Paper');
const Bookmark = require('../models/Bookmark');
const Collection = require('../models/Collection');
const PaperAnalysis = require('../models/PaperAnalysis');
const { asyncHandler } = require('../../../../shared/errors');

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [uploadedPapers, bookmarkedPapers, totalCollections, analyzedPapers, totalPlatformPapers, recentPapers] = await Promise.all([
    Paper.countDocuments({ uploadedBy: userId }),
    Bookmark.countDocuments({ userId }),
    Collection.countDocuments({ userId }),
    Paper.countDocuments({ isAnalyzed: true }),
    Paper.countDocuments({}),
    Paper.find({})
      .sort('-createdAt')
      .limit(5)
      .select('title authors publicationYear researchDomain isAnalyzed createdAt'),
  ]);

  // Aggregate paper topics across all papers for rich dashboard insights
  const papersWithKeywords = await Paper.find({}).select('keywords researchDomain');
  const keywordCounts = {};
  papersWithKeywords.forEach((paper) => {
    (paper.keywords || []).forEach((kw) => {
      if (kw) keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });
    if (paper.researchDomain) {
      keywordCounts[paper.researchDomain] = (keywordCounts[paper.researchDomain] || 0) + 1;
    }
  });

  const topTopics = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([topic, count]) => ({ topic, count }));

  res.json({
    success: true,
    data: {
      stats: {
        totalPlatformPapers,
        uploadedPapers,
        bookmarkedPapers,
        totalCollections,
        analyzedPapers,
      },
      topTopics,
      recentPapers,
    },
  });
});

module.exports = { getDashboardStats };
