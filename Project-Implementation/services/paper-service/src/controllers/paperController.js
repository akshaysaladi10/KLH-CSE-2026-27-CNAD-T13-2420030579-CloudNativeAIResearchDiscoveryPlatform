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

// Helper to format academic citations in standard scholarly styles
const formatCitations = (paper) => {
  const authorsList = paper.authors && paper.authors.length > 0
    ? paper.authors.map(a => (typeof a === 'string' ? a : a.name)).filter(Boolean)
    : ['Anonymous'];

  const year = paper.publicationYear || new Date(paper.createdAt || Date.now()).getFullYear();
  const title = paper.title || 'Untitled Research';
  const journal = paper.journal || paper.publisher || 'Scholarly Research Archive';
  const doi = paper.doi ? `https://doi.org/${paper.doi}` : '';
  const firstAuthor = authorsList[0] || 'Author';
  const firstAuthorSurname = firstAuthor.split(' ').pop().toLowerCase().replace(/[^a-z]/g, '') || 'research';
  const citeKey = `${firstAuthorSurname}${year}${title.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}`;

  // APA 7th Edition
  const apaAuthors = authorsList.length === 1
    ? authorsList[0]
    : authorsList.length === 2
    ? `${authorsList[0]} & ${authorsList[1]}`
    : `${authorsList[0]} et al.`;
  const apa = `${apaAuthors} (${year}). ${title}. ${journal}.${doi ? ` ${doi}` : ''}`;

  // IEEE
  const ieeeAuthors = authorsList.length === 1
    ? authorsList[0]
    : authorsList.length <= 3
    ? authorsList.join(', ')
    : `${authorsList[0]} et al.`;
  const ieee = `${ieeeAuthors}, "${title}," ${journal}, ${year}.${doi ? ` doi: ${paper.doi}.` : ''}`;

  // MLA 9th Edition
  const mlaAuthors = authorsList.length === 1
    ? authorsList[0]
    : authorsList.length === 2
    ? `${authorsList[0]}, and ${authorsList[1]}`
    : `${authorsList[0]}, et al.`;
  const mla = `${mlaAuthors}. "${title}." ${journal}, ${year}.${doi ? ` ${doi}` : ''}`;

  // Chicago 17th Edition
  const chicago = `${apaAuthors}. "${title}." ${journal} (${year}).${doi ? ` ${doi}` : ''}`;

  // BibTeX
  const bibtexAuthors = authorsList.join(' and ');
  const bibtex = `@article{${citeKey},
  title = {${title}},
  author = {${bibtexAuthors}},
  journal = {${journal}},
  year = {${year}}${paper.doi ? `,\n  doi = {${paper.doi}}` : ''}${paper.externalId ? `,\n  note = {External ID: ${paper.externalId}}` : ''}
}`;

  return {
    bibtex,
    apa,
    ieee,
    mla,
    chicago,
  };
};

// GET /api/papers/:id
const getPaperById = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  // Asynchronously record read/view activity
  Paper.findByIdAndUpdate(paper._id, {
    $inc: { viewCount: 1 },
    lastViewedAt: new Date(),
  }).exec();

  // Retrieve analysis document if present
  const analysis = await PaperAnalysis.findOne({ paperId: paper._id });

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
            summary: analysis.summary,
            researchProblem: analysis.researchProblem,
            objectives: analysis.objectives,
            methodology: analysis.methodology,
            algorithms: analysis.algorithms || [],
            technologies: analysis.technologies || [],
            datasets: analysis.datasets || [],
            experimentalResults: analysis.experimentalResults || [],
            majorFindings: analysis.majorFindings || [],
            limitations: analysis.limitations || [],
            conclusion: analysis.conclusion || '',
            researchGaps: analysis.researchGaps || [],
            researchGapsDetailed: analysis.researchGapsDetailed || {},
            futureDirections: analysis.futureDirections || [],
            keywords: analysis.keywords || [],
            aiProvider: analysis.aiProvider,
            isConfigured: analysis.isConfigured !== false,
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
    analysis = await PaperAnalysis.findOneAndUpdate({ paperId }, analysisData, { new: true, runValidators: true });
  } else {
    analysis = await PaperAnalysis.create({ ...analysisData, paperId });
  }

  // Update paper status
  paper.analysisId = analysis._id;

  const hasGapsOrFindings = (analysisData.structuredGaps && analysisData.structuredGaps.length > 0) ||
                            (analysisData.majorFindings && analysisData.majorFindings.length > 0) ||
                            (analysisData.limitations && analysisData.limitations.length > 0);

  if (analysisData.aiProvider === 'error' || analysisData.aiProvider === 'failed') {
    paper.processingStatus = 'failed';
    paper.isAnalyzed = false;
  } else if (analysisData.aiProvider === 'unconfigured' || analysisData.aiProvider === 'not_configured' || analysisData.isConfigured === false) {
    if (hasGapsOrFindings) {
      paper.processingStatus = 'completed';
      paper.isAnalyzed = true;
    } else {
      paper.processingStatus = 'completed_without_ai';
      paper.isAnalyzed = false;
    }
  } else {
    paper.processingStatus = 'completed';
    paper.isAnalyzed = true;
  }

  if ((!paper.keywords || paper.keywords.length === 0) && analysisData.keywords && analysisData.keywords.length > 0) {
    paper.keywords = analysisData.keywords;
  }
  if (!paper.abstract && analysisData.summary) {
    paper.abstract = analysisData.summary;
  }
  if (analysisData.fullText) {
    paper.fullText = analysisData.fullText;
  }
  if (analysisData.researchDomain && !paper.researchDomain) {
    paper.researchDomain = analysisData.researchDomain;
  }
  if (analysisData.references && Array.isArray(analysisData.references) && analysisData.references.length > 0) {
    paper.references = analysisData.references;
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

// PUT /api/papers/:id/read - Toggle read status
const toggleReadStatus = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  paper.isRead = !paper.isRead;
  paper.readAt = paper.isRead ? new Date() : null;
  await paper.save();

  res.json({
    success: true,
    data: {
      isRead: paper.isRead,
      readAt: paper.readAt,
      paperId: paper._id,
    },
  });
});

// PUT /api/papers/:id/notes - Update user personal research notes and highlights
const updatePaperNotes = asyncHandler(async (req, res) => {
  const { userNotes, highlights } = req.body;
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  if (userNotes !== undefined) paper.userNotes = userNotes;
  if (highlights !== undefined) paper.highlights = highlights;
  await paper.save();

  res.json({
    success: true,
    data: {
      paperId: paper._id,
      userNotes: paper.userNotes,
      highlights: paper.highlights,
    },
    message: 'Research notes saved successfully.',
  });
});

// GET /api/papers/:id/citation - Generate citation formats
const getCitations = asyncHandler(async (req, res) => {
  const paper = await Paper.findById(req.params.id);
  if (!paper) {
    throw new AppError('Paper not found', 404);
  }

  const citations = formatCitations(paper);
  res.json({
    success: true,
    data: { citations },
  });
});

// GET /api/papers/reading/history - Get user reading and viewed history
const getReadingHistory = asyncHandler(async (req, res) => {
  const papers = await Paper.find({
    $or: [
      { isRead: true },
      { lastViewedAt: { $ne: null } },
      { userNotes: { $ne: '' } },
    ],
  })
    .sort('-lastViewedAt -updatedAt')
    .limit(50)
    .select('title authors publicationYear journal doi researchDomain isAnalyzed isRead readAt userNotes lastViewedAt viewCount processingStatus');

  res.json({
    success: true,
    data: { papers },
  });
});

// POST /api/papers/report/generate - Generate synthesis report across selected papers
const generateResearchReport = asyncHandler(async (req, res) => {
  const { paperIds, title = 'Research Synthesis & Comparative Analysis Report' } = req.body;

  if (!paperIds || !Array.isArray(paperIds) || paperIds.length === 0) {
    throw new AppError('Please provide at least one paper ID for report generation', 400);
  }

  const papers = await Paper.find({ _id: { $in: paperIds } }).select('-fullText');
  const analyses = await PaperAnalysis.find({ paperId: { $in: paperIds } });

  const analysisMap = {};
  analyses.forEach((a) => {
    analysisMap[a.paperId.toString()] = a;
  });

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Construct structured markdown report
  let md = `# ${title}\n\n`;
  md += `**Date:** ${generatedDate}  \n`;
  md += `**Total Analyzed Papers:** ${papers.length}  \n`;
  md += `**Platform:** Cloud-Native AI Research Discovery Platform\n\n`;
  md += `---\n\n`;

  md += `## 1. Executive Summary\n\n`;
  md += `This report synthesizes findings, methodological frameworks, empirical results, and identified research gaps across ${papers.length} selected scholarly publications within the domain of **${papers[0]?.researchDomain || 'Computer Science'}**.\n\n`;

  md += `## 2. Literature Survey & Paper Summaries\n\n`;
  papers.forEach((p, idx) => {
    const a = analysisMap[p._id.toString()];
    const authors = p.authors && p.authors.length > 0 ? p.authors.map(x => x.name || x).join(', ') : 'Scholarly Authors';
    md += `### 2.${idx + 1} ${p.title}\n`;
    md += `- **Authors:** ${authors}\n`;
    md += `- **Year:** ${p.publicationYear || 'Recent'} | **Journal/Venue:** ${p.journal || p.publisher || 'N/A'}\n`;
    if (p.doi) md += `- **DOI:** [${p.doi}](https://doi.org/${p.doi})\n`;
    md += `\n**Core Abstract / Summary:**\n${a?.summary || p.abstract || 'Abstract unavailable.'}\n\n`;

    if (a?.methodology) {
      md += `**Methodology:**\n${a.methodology}\n\n`;
    }
    if (a?.majorFindings && a.majorFindings.length > 0) {
      md += `**Key Findings:**\n`;
      a.majorFindings.forEach((f) => { md += `- ${f}\n`; });
      md += `\n`;
    }
  });

  md += `## 3. Comparative Research Matrix\n\n`;
  md += `| Paper | Research Problem | Methodology | Key Results / Metrics | Stated Limitations |\n`;
  md += `|---|---|---|---|---|\n`;
  papers.forEach((p) => {
    const a = analysisMap[p._id.toString()];
    const shortTitle = p.title.length > 40 ? p.title.slice(0, 37) + '...' : p.title;
    const problem = (a?.researchProblem || p.researchDomain || 'N/A').replace(/\|/g, '-').slice(0, 60);
    const method = (a?.methodology || 'Empirical').replace(/\|/g, '-').slice(0, 60);
    const results = (a?.experimentalResults?.[0] || a?.majorFindings?.[0] || 'Reported in text').replace(/\|/g, '-').slice(0, 60);
    const lim = (a?.limitations?.[0] || 'See paper text').replace(/\|/g, '-').slice(0, 60);
    md += `| ${shortTitle} | ${problem} | ${method} | ${results} | ${lim} |\n`;
  });
  md += `\n`;

  md += `## 4. Synthesis of Research Gaps & Future Directions\n\n`;
  const allGaps = [];
  const allFutures = [];
  analyses.forEach((a) => {
    (a.researchGaps || []).forEach((g) => { if (!allGaps.includes(g)) allGaps.push(g); });
    (a.futureDirections || []).forEach((f) => { if (!allFutures.includes(f)) allFutures.push(f); });
  });

  if (allGaps.length > 0) {
    md += `### 4.1 Identified Scientific Gaps:\n`;
    allGaps.slice(0, 8).forEach((g) => { md += `- ${g}\n`; });
    md += `\n`;
  }
  if (allFutures.length > 0) {
    md += `### 4.2 Recommended Future Research Directions:\n`;
    allFutures.slice(0, 8).forEach((f) => { md += `- ${f}\n`; });
    md += `\n`;
  }

  md += `## 5. Bibliographic References\n\n`;
  papers.forEach((p, idx) => {
    const cite = formatCitations(p);
    md += `[${idx + 1}] ${cite.apa}\n\n`;
  });

  res.json({
    success: true,
    data: {
      report: {
        title,
        generatedDate,
        paperCount: papers.length,
        markdown: md,
        papers: papers.map((p) => ({
          _id: p._id,
          title: p.title,
          authors: p.authors,
          publicationYear: p.publicationYear,
          journal: p.journal,
          doi: p.doi,
          analysis: analysisMap[p._id.toString()] || null,
        })),
      },
    },
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
  toggleReadStatus,
  updatePaperNotes,
  getCitations,
  getReadingHistory,
  generateResearchReport,
};
