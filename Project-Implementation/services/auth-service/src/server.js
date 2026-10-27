require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('../../../shared/db');
const { createLogger } = require('../../../shared/logger');
const { errorHandler } = require('../../../shared/errors');
const authRoutes = require('./routes/authRoutes');

const app = express();
const logger = createLogger('auth-service');
const PORT = process.env.AUTH_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB('auth-service');
  app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start auth service:', err);
  process.exit(1);
});

module.exports = app;
