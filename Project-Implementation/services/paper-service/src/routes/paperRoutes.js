const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  createPaper, getPapers, getPaperById, updatePaper, deletePaper,
  uploadPaper, downloadPaper, getUserPapers, comparePapers, savePaperAnalysis,
  updatePaperStatus, reanalyzePaper, analyzeAbstract,
  toggleReadStatus, updatePaperNotes, getCitations, getReadingHistory, generateResearchReport
} = require('../controllers/paperController');
const { verifyToken } = require('../../../../shared/auth');

// Multer config — memory storage for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Specific routes must be defined before /:id parameter matching
router.get('/user/:userId', verifyToken, getUserPapers);
router.get('/reading/history', verifyToken, getReadingHistory);
router.post('/report/generate', verifyToken, generateResearchReport);
router.post('/compare', verifyToken, comparePapers);
router.post('/upload', verifyToken, upload.single('pdf'), uploadPaper);
router.post('/analyze-abstract', verifyToken, analyzeAbstract);

// Public routes
router.get('/', getPapers);
router.get('/:id', getPaperById);
router.get('/:id/pdf', downloadPaper); // Direct PDF streaming/viewing
router.get('/:id/download', downloadPaper);
router.get('/:id/citation', getCitations);
router.post('/:id/analysis', savePaperAnalysis); // Internal endpoint
router.patch('/:id/status', updatePaperStatus); // Internal endpoint for processing status
router.post('/:id/reanalyze', verifyToken, reanalyzePaper);

// Protected mutation routes
router.put('/:id/read', verifyToken, toggleReadStatus);
router.put('/:id/notes', verifyToken, updatePaperNotes);
router.post('/', verifyToken, createPaper);
router.put('/:id', verifyToken, updatePaper);
router.delete('/:id', verifyToken, deletePaper);

module.exports = router;
