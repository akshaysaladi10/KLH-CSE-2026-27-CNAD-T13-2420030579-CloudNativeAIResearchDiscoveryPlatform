const axios = require('axios');
const { createLogger } = require('../../../../shared/logger');

const logger = createLogger('openalex-provider');

const OPENALEX_BASE = 'https://api.openalex.org';

const searchOpenAlex = async (query, options = {}) => {
  const { page = 1, perPage = 10 } = options;

  try {
    const params = {
      search: query,
      page,
      per_page: perPage,
      sort: 'relevance_score:desc',
    };

    if (process.env.OPENALEX_EMAIL) {
      params.mailto = process.env.OPENALEX_EMAIL;
    }

    const response = await axios.get(`${OPENALEX_BASE}/works`, { params, timeout: 15000 });
    const { results, meta } = response.data;

    const papers = results.map((work) => ({
      title: work.title || 'Untitled',
      authors: (work.authorships || []).map((a) => ({
        name: a.author?.display_name || 'Unknown',
        affiliation: a.institutions?.[0]?.display_name || '',
      })),
      abstract: reconstructAbstract(work.abstract_inverted_index),
      publicationYear: work.publication_year,
      journal: work.primary_location?.source?.display_name || '',
      doi: work.doi ? work.doi.replace('https://doi.org/', '') : '',
      keywords: (work.keywords || []).map((k) => k.keyword || k.display_name).slice(0, 10),
      source: 'openalex',
      externalId: work.id,
      pdfUrl: work.open_access?.oa_url || work.primary_location?.pdf_url || '',
      citationCount: work.cited_by_count || 0,
      relevanceScore: work.relevance_score || 0,
    }));

    return {
      papers,
      total: meta?.count || papers.length,
      page,
      perPage,
    };
  } catch (error) {
    logger.error('OpenAlex search failed:', error.message);
    throw error;
  }
};

const reconstructAbstract = (invertedIndex) => {
  if (!invertedIndex) return '';
  try {
    const wordPositions = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        wordPositions.push({ word, pos });
      }
    }
    wordPositions.sort((a, b) => a.pos - b.pos);
    return wordPositions.map((wp) => wp.word).join(' ');
  } catch {
    return '';
  }
};

module.exports = { searchOpenAlex };
