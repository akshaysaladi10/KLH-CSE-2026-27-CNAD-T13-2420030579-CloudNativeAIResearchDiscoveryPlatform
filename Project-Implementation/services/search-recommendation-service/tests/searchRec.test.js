const mongoose = require('mongoose');
const Recommendation = require('../src/models/Recommendation');
const SearchHistory = require('../src/models/SearchHistory');
const {
  calculateKeywordSimilarity,
  extractKeywordsFromAbstract,
} = require('../src/controllers/searchRecController');

describe('Search & Recommendation Service Suite', () => {
  describe('Recommendation Model Schema Validation', () => {
    it('should fail validation when userId or paperId is missing', () => {
      const rec = new Recommendation({
        score: 0.85,
      });
      const err = rec.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.userId).toBeDefined();
      expect(err.errors.paperId).toBeDefined();
    });

    it('should validate successfully with valid fields', () => {
      const rec = new Recommendation({
        userId: new mongoose.Types.ObjectId(),
        paperId: new mongoose.Types.ObjectId(),
        score: 0.92,
        reason: 'Shares keywords: Kubernetes, Cloud, Microservices',
        method: 'keyword',
      });
      const err = rec.validateSync();
      expect(err).toBeUndefined();
      expect(rec.score).toBe(0.92);
      expect(rec.method).toBe('keyword');
    });

    it('should reject score outside 0 to 1 range', () => {
      const rec = new Recommendation({
        userId: new mongoose.Types.ObjectId(),
        paperId: new mongoose.Types.ObjectId(),
        score: 1.5,
      });
      const err = rec.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.score).toBeDefined();
    });
  });

  describe('SearchHistory Model Schema Validation', () => {
    it('should require userId and query', () => {
      const history = new SearchHistory({});
      const err = history.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.userId).toBeDefined();
      expect(err.errors.query).toBeDefined();
    });

    it('should validate with valid query and filters', () => {
      const history = new SearchHistory({
        userId: new mongoose.Types.ObjectId(),
        query: 'large language models in cloud',
        resultCount: 24,
      });
      const err = history.validateSync();
      expect(err).toBeUndefined();
      expect(history.resultCount).toBe(24);
    });
  });

  describe('Keyword Similarity Calculation (Jaccard Index)', () => {
    it('should return 1.0 for identical sets of keywords regardless of case', () => {
      const k1 = ['Kubernetes', 'Cloud Computing', 'Docker'];
      const k2 = ['kubernetes', 'cloud computing', 'docker'];
      const similarity = calculateKeywordSimilarity(k1, k2);
      expect(similarity).toBe(1.0);
    });

    it('should return 0.0 for completely disjoint sets of keywords', () => {
      const k1 = ['Quantum Computing', 'Qubits'];
      const k2 = ['Organic Chemistry', 'Proteins'];
      const similarity = calculateKeywordSimilarity(k1, k2);
      expect(similarity).toBe(0.0);
    });

    it('should return 0.0 when either array is empty', () => {
      expect(calculateKeywordSimilarity([], ['AI'])).toBe(0);
      expect(calculateKeywordSimilarity(['AI'], [])).toBe(0);
      expect(calculateKeywordSimilarity([], [])).toBe(0);
    });

    it('should correctly calculate partial overlap ratio', () => {
      // k1 has 3 items, k2 has 3 items, 1 shared -> intersection = 1, union = 5 -> 0.2
      const k1 = ['AI', 'Cloud', 'DevOps'];
      const k2 = ['Cloud', 'Kubernetes', 'Microservices'];
      const similarity = calculateKeywordSimilarity(k1, k2);
      expect(similarity).toBeCloseTo(0.2, 5);
    });
  });

  describe('Abstract Keyword Extraction', () => {
    it('should extract top frequent non-stopword academic concepts', () => {
      const abstractText = `
        This research investigates distributed transformer architectures for natural language processing.
        We evaluate transformer latency on multi-node Kubernetes clusters. The experimental results
        demonstrate that distributed transformer pipelines reduce communication overhead.
      `;
      const keywords = extractKeywordsFromAbstract(abstractText);
      expect(keywords).toBeInstanceOf(Array);
      expect(keywords.length).toBeGreaterThan(0);
      // 'transformer' or 'distributed' should be among the top extracted terms
      const lowerKeywords = keywords.map((k) => k.toLowerCase());
      expect(
        lowerKeywords.includes('transformer') ||
        lowerKeywords.includes('distributed') ||
        lowerKeywords.includes('architectures')
      ).toBe(true);
    });

    it('should filter out common academic stopwords such as "paper", "proposed", "study"', () => {
      const text = 'This paper presents a proposed study on machine learning algorithms.';
      const keywords = extractKeywordsFromAbstract(text);
      const lowerKeywords = keywords.map((k) => k.toLowerCase());
      expect(lowerKeywords).not.toContain('paper');
      expect(lowerKeywords).not.toContain('proposed');
      expect(lowerKeywords).not.toContain('study');
    });
  });
});
