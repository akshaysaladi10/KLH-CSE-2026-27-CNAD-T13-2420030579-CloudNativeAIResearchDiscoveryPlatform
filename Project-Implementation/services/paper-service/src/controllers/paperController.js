const Paper = require('../models/Paper');
const PaperAnalysis = require('../models/PaperAnalysis');
const { uploadFile, getDownloadUrl, deleteFile, getFile } = require('../services/s3Service');
const { AppError, asyncHandler } = require('../../../../shared/errors');
const { createLogger } = require('../../../../shared/logger');
const axios = require('axios');

const logger = createLogger('paper-controller');

const parseAuthors = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((a) => (typeof a === 'string' ? { name: a, affiliation: '' } : a));
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map((a) => (typeof a === 'string' ? { name: a, affiliation: '' } : a));
      }
    } catch {
      return input
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, affiliation: '' }));
    }
  }
  return [];
};

const parseKeywords = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((k) => String(k).trim()).filter(Boolean);
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed.map((k) => String(k).trim()).filter(Boolean);
    } catch {
      return input
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

// POST /api/papers
const createPaper = asyncHandler(async (req, res) => {
  const paperData = { ...req.body };
  if (req.user) {
    paperData.uploadedBy = req.user.id;
  }

  const paper = await Paper.create(paperData);

  res.status(201).json({
    success: true,
    data: { paper },
  });
});

// GET /api/papers
const getPapers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-createdAt';

  const filter = {};
  if (req.query.source) filter.source = req.query.source;
  if (req.query.year) filter.publicationYear = parseInt(req.query.year);
  if (req.query.keyword) filter.keywords = { $in: [req.query.keyword] };

  const [papers, total] = await Promise.all([
    Paper.find(filter).sort(sort).skip(skip).limit(limit).select('-fullText'),
    Paper.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      papers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// GET /api/papers/:id
const getPaperById = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  // Get analysis if exists
  let analysis = null;
  if (paper.isAnalyzed) {
    analysis = await PaperAnalysis.findOne({ paperId: paper._id });
  }

  res.json({
    success: true,
    data: { paper, analysis },
  });
});

// PUT /api/papers/:id
const updatePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  res.json({
    success: true,
    data: { paper },
  });
});

// DELETE /api/papers/:id
const deletePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  // Delete from S3 if uploaded
  if (paper.s3Key) {
    try {
      await deleteFile(paper.s3Key);
    } catch (err) {
      logger.warn(`Failed to delete S3 file ${paper.s3Key}:`, err.message);
    }
  }

  // Delete analysis
  await PaperAnalysis.deleteOne({ paperId: paper._id });
  await Paper.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Paper deleted successfully',
  });
});

// POST /api/papers/upload
const uploadPaper = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload a PDF file', 400);
  }

  // Generate S3 key
  const timestamp = Date.now();
  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const s3Key = `papers/${req.user.id}/${timestamp}-${safeName}`;

  // Upload to S3
  const pdfUrl = await uploadFile(req.file.buffer, s3Key, 'application/pdf');

  const authors = parseAuthors(req.body.authors);
  const keywords = parseKeywords(req.body.keywords);
  const researchDomain = req.body.researchDomain || req.body.domain || 'Computer Science';

  // Create paper record
  const paper = await Paper.create({
    title: req.body.title || req.file.originalname.replace('.pdf', ''),
    authors,
    abstract: req.body.abstract || '',
    publicationYear: parseInt(req.body.publicationYear) || new Date().getFullYear(),
    journal: req.body.journal || '',
    keywords,
    researchDomain,
    source: 'upload',
    pdfUrl,
    s3Key,
    uploadedBy: req.user.id,
    processingStatus: 'pending',
  });

  // Trigger PDF processing asynchronously
  try {
    const pdfServiceUrl = process.env.PDF_SERVICE_URL || 'http://localhost:8001';
    axios
      .post(`${pdfServiceUrl}/api/pdf/extract`, {
        paperId: paper._id.toString(),
        s3Key,
        pdfUrl,
      })
      .catch((err) => {
        logger.warn('PDF processing trigger failed (service may be offline):', err.message);
      });
  } catch (err) {
    logger.warn('Could not trigger PDF processing:', err.message);
  }

  res.status(201).json({
    success: true,
    data: { paper },
    message: 'PDF uploaded successfully. Processing will begin shortly.',
  });
});

// GET /api/papers/:id/download or /api/papers/:id/pdf
const downloadPaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  if (!paper.s3Key) {
    throw new AppError('No PDF file available for this paper', 404);
  }

  // If streaming requested or direct view
  if (req.query.stream === 'true' || !req.query.urlOnly) {
    try {
      const buffer = await getFile(paper.s3Key);
      res.setHeader('Content-Type', 'application/pdf');
      const safeTitle = (paper.title || 'paper').replace(/[^a-zA-Z0-9_-]/g, '_');
      res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"`);
      return res.send(buffer);
    } catch (err) {
      logger.warn(`Direct PDF stream failed, falling back to download URL: ${err.message}`);
    }
  }

  const downloadUrl = await getDownloadUrl(paper.s3Key);

  res.json({
    success: true,
    data: { downloadUrl },
  });
});

// GET /api/papers/user/:userId
const getUserPapers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [papers, total] = await Promise.all([
    Paper.find({ uploadedBy: req.params.userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .select('-fullText'),
    Paper.countDocuments({ uploadedBy: req.params.userId }),
  ]);

  res.json({
    success: true,
    data: {
      papers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

// POST /api/papers/compare
const comparePapers = asyncHandler(async (req, res) => {
  const { paperIds } = req.body;

  if (!paperIds || paperIds.length < 2 || paperIds.length > 4) {
    throw new AppError('Please provide 2-4 paper IDs for comparison', 400);
  }

  const papers = await Paper.find({ _id: { $in: paperIds } }).select('-fullText');
  if (papers.length !== paperIds.length) {
    throw new AppError('One or more papers not found', 404);
  }

  // Get analyses for papers that have them
  const analyses = await PaperAnalysis.find({ paperId: { $in: paperIds } });
  const analysisMap = {};
  analyses.forEach((a) => {
    analysisMap[a.paperId.toString()] = a;
  });

  // Build comparison data
  const comparison = papers.map((paper) => {
    const analysis = analysisMap[paper._id.toString()];
    return {
      paper: paper.toJSON(),
      analysis: analysis
        ? {
            methodology: analysis.methodology,
            majorFindings: analysis.majorFindings,
            limitations: analysis.limitations,
            researchGaps: analysis.researchGaps,
            futureDirections: analysis.futureDirections,
            keywords: analysis.keywords,
          }
        : null,
    };
  });

  res.json({
    success: true,
    data: { comparison },
  });
});

// POST /api/papers/:id/analysis
const savePaperAnalysis = asyncHandler(async (req, res) => {
  const paperId = req.params.id;
  const analysisData = req.body;

  const paper = await Paper.findById(paperId);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  // Upsert analysis
  let analysis = await PaperAnalysis.findOne({ paperId });
  if (analysis) {
    analysis = await PaperAnalysis.findOneAndUpdate({ paperId }, analysisData, { new: true });
  } else {
    analysis = await PaperAnalysis.create({ ...analysisData, paperId });
  }

  // Update paper status
  paper.analysisId = analysis._id;

  if (analysisData.aiProvider === 'unconfigured' || analysisData.aiProvider === 'not_configured') {
    paper.processingStatus = 'completed_without_ai';
    paper.isAnalyzed = false;
  } else if (analysisData.aiProvider === 'error' || analysisData.aiProvider === 'failed') {
    paper.processingStatus = 'failed';
    paper.isAnalyzed = false;
  } else {
    paper.processingStatus = 'completed';
    paper.isAnalyzed = true;
  }

  if ((!paper.keywords || paper.keywords.length === 0) && analysisData.keywords && analysisData.keywords.length > 0) {
    paper.keywords = analysisData.keywords;
  }
  if (!paper.abstract && analysisData.summary && analysisData.aiProvider !== 'unconfigured' && analysisData.aiProvider !== 'not_configured') {
    paper.abstract = analysisData.summary;
  }
  if (analysisData.fullText) {
    paper.fullText = analysisData.fullText;
  }
  if (analysisData.researchDomain && !paper.researchDomain) {
    paper.researchDomain = analysisData.researchDomain;
  }

  await paper.save();

  res.json({
    success: true,
    data: { analysis },
  });
});

// PATCH /api/papers/:id/status
const updatePaperStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'extracting', 'analyzing', 'completed', 'failed', 'completed_without_ai'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status: ${status}`, 400);
  }

  const paper = await Paper.findByIdAndUpdate(
    req.params.id,
    { processingStatus: status },
    { new: true }
  );

  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  res.json({
    success: true,
    data: { paper },
  });
});

// POST /api/papers/:id/reanalyze
const reanalyzePaper = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  if (!paper.s3Key && !paper.abstract && !paper.fullText) {
    throw new AppError('Paper has no content or uploaded PDF to analyze', 400);
  }

  if (paper.s3Key) {
    paper.processingStatus = 'extracting';
    await paper.save();

    const pdfServiceUrl = process.env.PDF_SERVICE_URL || 'http://localhost:8001';
    try {
      await axios.post(`${pdfServiceUrl}/api/pdf/extract`, {
        paperId: paper._id.toString(),
        s3Key: paper.s3Key,
        pdfUrl: paper.pdfUrl,
      });
    } catch (err) {
      logger.warn('Could not trigger PDF re-extraction:', err.message);
    }
  } else {
    paper.processingStatus = 'analyzing';
    await paper.save();

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8002';
    try {
      await axios.post(`${aiServiceUrl}/api/ai/analyze`, {
        paperId: paper._id.toString(),
        text: paper.fullText || paper.abstract,
      });
    } catch (err) {
      logger.warn('Could not trigger AI re-analysis:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'Re-analysis initiated',
    data: { paper },
  });
});

// POST /api/papers/analyze-abstract
const analyzeAbstract = asyncHandler(async (req, res) => {
  const { title, abstract, authors, keywords, researchDomain, publicationYear } = req.body;

  if (!abstract || !abstract.trim()) {
    throw new AppError('Research paper abstract is required', 400);
  }

  const cleanAbstract = abstract.trim();
  let cleanTitle = (title && title.trim()) || '';
  if (!cleanTitle) {
    // Extract first sentence or up to 80 chars
    const firstSentence = cleanAbstract.split(/[.\n]/)[0].trim();
    cleanTitle = firstSentence.length > 10 ? firstSentence.slice(0, 100) : 'Research Abstract Study';
  }

  const parsedAuthors = parseAuthors(authors);
  const parsedKeywords = parseKeywords(keywords);
  const domain = researchDomain || 'Computer Science';

  const paper = await Paper.create({
    title: cleanTitle,
    abstract: cleanAbstract,
    fullText: cleanAbstract,
    authors: parsedAuthors.length > 0 ? parsedAuthors : (req.user ? [{ name: req.user.name || 'Author', affiliation: '' }] : []),
    keywords: parsedKeywords,
    researchDomain: domain,
    publicationYear: parseInt(publicationYear) || new Date().getFullYear(),
    source: 'abstract',
    uploadedBy: req.user ? req.user.id : null,
    processingStatus: 'analyzing',
    isAnalyzed: false,
  });

  // Asynchronously trigger AI Service
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8002';
  try {
    axios
      .post(`${aiServiceUrl}/api/ai/analyze`, {
        paperId: paper._id.toString(),
        text: cleanAbstract,
      })
      .catch((err) => {
        logger.warn('AI Service trigger failed for abstract:', err.message);
      });
  } catch (err) {
    logger.warn('Could not send abstract to AI Service:', err.message);
  }

  res.status(201).json({
    success: true,
    data: { paper },
    message: 'Abstract submitted and AI analysis initiated successfully.',
  });
});

module.exports = {
  createPaper,
  getPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  uploadPaper,
  downloadPaper,
  getUserPapers,
  comparePapers,
  savePaperAnalysis,
  updatePaperStatus,
  reanalyzePaper,
  analyzeAbstract,
};
