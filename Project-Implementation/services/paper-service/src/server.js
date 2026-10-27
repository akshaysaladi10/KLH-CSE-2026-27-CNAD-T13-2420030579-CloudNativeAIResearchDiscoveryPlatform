require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('../../../shared/db');
const { createLogger } = require('../../../shared/logger');
const { errorHandler } = require('../../../shared/errors');
const paperRoutes = require('./routes/paperRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const logger = createLogger('paper-service');
const PORT = process.env.PAPER_PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'paper-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/papers', paperRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(errorHandler);

const start = async () => {
  await connectDB('paper-service');
  app.listen(PORT, () => {
    logger.info(`Paper Service running on port ${PORT}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start paper service:', err);
  process.exit(1);
});

module.exports = app;
