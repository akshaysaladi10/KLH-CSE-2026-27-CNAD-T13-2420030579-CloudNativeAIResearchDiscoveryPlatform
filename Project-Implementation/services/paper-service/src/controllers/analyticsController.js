const Paper = require('../models/Paper');
const Bookmark = require('../models/Bookmark');
const Collection = require('../models/Collection');
const PaperAnalysis = require('../models/PaperAnalysis');
const { asyncHandler } = require('../../../../shared/errors');

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    uploadedPapers,
    bookmarkedPapers,
    totalCollections,
    analyzedPapers,
    totalPlatformPapers,
    recentPapers,
    allPapersSummary,
    recentBookmarks,
    recentCollectionsList
  ] = await Promise.all([
    Paper.countDocuments({ uploadedBy: userId }),
    Bookmark.countDocuments({ userId }),
    Collection.countDocuments({ userId }),
    Paper.countDocuments({ isAnalyzed: true }),
    Paper.countDocuments({}),
    Paper.find({})
      .sort('-createdAt')
      .limit(6)
      .select('title authors publicationYear researchDomain isAnalyzed processingStatus source createdAt s3Key doi'),
    Paper.find({})
      .select('publicationYear keywords researchDomain processingStatus isAnalyzed createdAt'),
    Bookmark.find({ userId })
      .sort('-createdAt')
      .limit(4)
      .populate('paperId', 'title'),
    Collection.find({ userId })
      .sort('-createdAt')
      .limit(3)
      .select('name paperIds createdAt')
  ]);

  // Aggregate paper topics & keywords
  const keywordCounts = {};
  const yearCounts = {};
  const statusCounts = {
    pending: 0,
    extracting: 0,
    analyzing: 0,
    completed: 0,
    failed: 0,
    completed_without_ai: 0,
  };

  // Activity over last 6 months
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toLocaleString('default', { month: 'short' });
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key: yearMonth, label: monthKey, uploads: 0, analyses: 0 });
  }

  allPapersSummary.forEach((paper) => {
    (paper.keywords || []).forEach((kw) => {
      if (kw) {
        const clean = kw.trim();
        keywordCounts[clean] = (keywordCounts[clean] || 0) + 1;
      }
    });
    if (paper.researchDomain) {
      keywordCounts[paper.researchDomain] = (keywordCounts[paper.researchDomain] || 0) + 1;
    }
    if (paper.publicationYear) {
      yearCounts[paper.publicationYear] = (yearCounts[paper.publicationYear] || 0) + 1;
    }
    if (paper.processingStatus && statusCounts[paper.processingStatus] !== undefined) {
      statusCounts[paper.processingStatus]++;
    }

    if (paper.createdAt) {
      const pDate = new Date(paper.createdAt);
      const ym = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((m) => m.key === ym);
      if (bucket) {
        bucket.uploads++;
        if (paper.isAnalyzed) bucket.analyses++;
      }
    }
  });

  const topTopics = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }));

  const yearDistribution = Object.entries(yearCounts)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 8)
    .map(([year, count]) => ({ year: parseInt(year), count }));

  // Build unified real activity timeline
  const activityTimeline = [];

  recentPapers.forEach((p) => {
    activityTimeline.push({
      id: `paper-${p._id}`,
      type: p.source === 'upload' ? 'upload' : (p.source === 'abstract' ? 'abstract' : 'discovery'),
      title: p.title,
      timestamp: p.createdAt,
      paperId: p._id,
      isAnalyzed: p.isAnalyzed,
      status: p.processingStatus,
    });
  });

  recentBookmarks.forEach((b) => {
    if (b.paperId) {
      activityTimeline.push({
        id: `bm-${b._id}`,
        type: 'bookmark',
        title: `Bookmarked: ${b.paperId.title || 'Paper'}`,
        timestamp: b.createdAt,
        paperId: b.paperId._id,
      });
    }
  });

  recentCollectionsList.forEach((c) => {
    activityTimeline.push({
      id: `col-${c._id}`,
      type: 'collection',
      title: `Created collection: ${c.name}`,
      timestamp: c.createdAt,
      count: c.paperIds?.length || 0,
    });
  });

  activityTimeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
      activityOverTime: months,
      yearDistribution,
      processingOverview: statusCounts,
      recentActivity: activityTimeline.slice(0, 10),
    },
  });
});

module.exports = { getDashboardStats };
