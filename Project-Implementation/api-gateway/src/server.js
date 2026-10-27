require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const { createLogger } = require('../../shared/logger');
const { errorHandler } = require('../../shared/errors');

const app = express();
const logger = createLogger('api-gateway');
const PORT = process.env.PORT || 3000;

// ── Security Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: { message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Request Logging ──
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// ── Body Parsing ──
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Service Proxy Configuration ──
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  papers: process.env.PAPER_SERVICE_URL || 'http://localhost:3002',
  searchRec: process.env.SEARCH_REC_SERVICE_URL || 'http://localhost:3003',
  pdf: process.env.PDF_SERVICE_URL || 'http://localhost:8001',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:8002',
};

// ── Cluster Health Check ──
app.get('/health', async (req, res) => {
  const serviceChecks = await Promise.allSettled(
    Object.entries(services).map(async ([name, url]) => {
      try {
        const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
        const data = await response.json();
        return { name, status: data?.status || 'healthy', reachable: response.ok };
      } catch (err) {
        return { name, status: 'offline', reachable: false, error: err.message };
      }
    })
  );

  const downstream = {};
  serviceChecks.forEach((check, index) => {
    const serviceName = Object.keys(services)[index];
    if (check.status === 'fulfilled') {
      downstream[serviceName] = check.value;
    } else {
      downstream[serviceName] = { status: 'offline', reachable: false };
    }
  });

  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: downstream,
  });
});

// Proxy options factory
const createProxy = (target, prefix = '') => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const base = prefix || req.baseUrl || '';
      return `${base}${path}`;
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }
        fixRequestBody(proxyReq, req);
        logger.debug(`Proxying ${req.method} ${req.originalUrl} → ${target}`);
      },
      error: (err, req, res) => {
        logger.error(`Proxy error: ${err.message}`, { target, path: req.originalUrl });
        res.status(502).json({
          success: false,
          error: { message: 'Service temporarily unavailable' },
        });
      },
    },
  });
};

// ── Route Proxying ──
app.use('/api/auth', createProxy(services.auth, '/api/auth'));
app.use('/api/papers', createProxy(services.papers, '/api/papers'));
app.use('/api/library', createProxy(services.papers, '/api/library'));
app.use('/api/analytics', createProxy(services.papers, '/api/analytics'));
app.use('/api/search', createProxy(services.searchRec, '/api/search'));
app.use('/api/recommendations', createProxy(services.searchRec, '/api/recommendations'));
app.use('/api/pdf', createProxy(services.pdf, '/api/pdf'));
app.use('/api/ai', createProxy(services.ai, '/api/ai'));

// ── 404 Handler ──
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.originalUrl} not found` },
  });
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start Server ──
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Service routes configured:');
  Object.entries(services).forEach(([name, url]) => {
    logger.info(`  /api/${name} → ${url}`);
  });
});

module.exports = app;
