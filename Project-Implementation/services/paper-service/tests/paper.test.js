const mongoose = require('mongoose');
const Paper = require('../src/models/Paper');
const PaperAnalysis = require('../src/models/PaperAnalysis');
const Collection = require('../src/models/Collection');

describe('Paper Service & Models Suite', () => {
  describe('Paper Model Schema Validation', () => {
    it('should fail validation when title is missing', () => {
      const paper = new Paper({
        abstract: 'Sample abstract without title',
      });
      const err = paper.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.title).toBeDefined();
    });

    it('should validate successfully with required fields and defaults', () => {
      const paper = new Paper({
        title: 'Cloud-Native Distributed Computing Frameworks',
        abstract: 'This paper investigates Kubernetes orchestration for AI microservices.',
      });
      const err = paper.validateSync();
      expect(err).toBeUndefined();
      expect(paper.processingStatus).toBe('pending');
      expect(paper.isAnalyzed).toBe(false);
      expect(paper.source).toBe('manual');
      expect(paper.researchDomain).toBe('Computer Science');
    });

    it('should accept valid source types including abstract and upload', () => {
      const sources = ['abstract', 'upload', 'openalex', 'arxiv', 'crossref', 'manual'];
      sources.forEach((src) => {
        const paper = new Paper({
          title: `Paper from ${src}`,
          source: src,
        });
        const err = paper.validateSync();
        expect(err).toBeUndefined();
        expect(paper.source).toBe(src);
      });
    });

    it('should accept completed_without_ai as valid processingStatus for scanned PDFs', () => {
      const paper = new Paper({
        title: 'Scanned Document Report',
        processingStatus: 'completed_without_ai',
      });
      const err = paper.validateSync();
      expect(err).toBeUndefined();
      expect(paper.processingStatus).toBe('completed_without_ai');
    });
  });

  describe('PaperAnalysis Model Schema Validation', () => {
    it('should fail validation when paperId is missing', () => {
      const analysis = new PaperAnalysis({
        summary: 'Test summary without paperId',
      });
      const err = analysis.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.paperId).toBeDefined();
    });

    it('should validate successfully with paperId and structured AI fields', () => {
      const fakePaperId = new mongoose.Types.ObjectId();
      const analysis = new PaperAnalysis({
        paperId: fakePaperId,
        summary: 'A study on AI microservice orchestration.',
        researchProblem: 'Resource contention in high-throughput clusters.',
        objectives: 'Design an autoscaling scheduler for neural inference.',
        methodology: 'Empirical benchmark on 10-node Kubernetes cluster.',
        majorFindings: ['Latency dropped by 38%', 'Throughput scaled linearly'],
        limitations: ['Evaluated only with ResNet-50 and BERT'],
        researchGaps: ['Multi-cloud federation was not addressed'],
        futureDirections: ['Investigate eBPF-based network monitoring'],
        keywords: ['Kubernetes', 'Microservices', 'AI Inference'],
        aiProvider: 'Local Scientific NLP Pipeline (Extractive & Section Analysis)',
      });

      const err = analysis.validateSync();
      expect(err).toBeUndefined();
      expect(analysis.majorFindings).toHaveLength(2);
      expect(analysis.keywords).toContain('Kubernetes');
      expect(analysis.aiProvider).toContain('Local Scientific NLP');
    });
  });

  describe('Collection Model Schema Validation', () => {
    it('should require a name and userId', () => {
      const coll = new Collection({});
      const err = coll.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.userId).toBeDefined();
    });

    it('should validate with valid name and userId', () => {
      const coll = new Collection({
        name: 'My Distributed Systems Papers',
        userId: new mongoose.Types.ObjectId(),
        paperIds: [new mongoose.Types.ObjectId()],
      });
      const err = coll.validateSync();
      expect(err).toBeUndefined();
      expect(coll.paperIds).toHaveLength(1);
    });
  });

  describe('Abstract Submission Validation Logic', () => {
    it('should reject submission when abstract is empty string or whitespace', () => {
      const testCases = ['', '   ', null, undefined];
      testCases.forEach((val) => {
        const isValid = typeof val === 'string' && val.trim().length > 0;
        expect(isValid).toBe(false);
      });
    });

    it('should accept valid abstract text', () => {
      const validAbstract = 'Deep learning models require scalable infrastructure for distributed training.';
      const isValid = typeof validAbstract === 'string' && validAbstract.trim().length > 0;
      expect(isValid).toBe(true);
    });

    it('should correctly normalize author inputs from comma-separated string or array', () => {
      const normalizeAuthors = (authorsInput) => {
        let authors = [];
        if (typeof authorsInput === 'string' && authorsInput.trim()) {
          authors = authorsInput.split(',').map((a) => ({ name: a.trim(), affiliation: '' }));
        } else if (Array.isArray(authorsInput)) {
          authors = authorsInput.map((a) =>
            typeof a === 'string' ? { name: a.trim(), affiliation: '' } : a
          );
        }
        return authors;
      };

      const fromString = normalizeAuthors('Dr. Alice Chen, Prof. Bob Smith');
      expect(fromString).toEqual([
        { name: 'Dr. Alice Chen', affiliation: '' },
        { name: 'Prof. Bob Smith', affiliation: '' },
      ]);

      const fromArray = normalizeAuthors(['Dr. Alice Chen', 'Prof. Bob Smith']);
      expect(fromArray).toEqual([
        { name: 'Dr. Alice Chen', affiliation: '' },
        { name: 'Prof. Bob Smith', affiliation: '' },
      ]);
    });
  });
});
