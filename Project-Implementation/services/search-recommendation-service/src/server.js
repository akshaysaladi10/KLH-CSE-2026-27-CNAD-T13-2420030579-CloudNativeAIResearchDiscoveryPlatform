require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('../../../shared/db');
const { createLogger } = require('../../../shared/logger');
const { errorHandler } = require('../../../shared/errors');
const routes = require('./routes/searchRecRoutes');

const app = express();
const logger = createLogger('search-rec-service');
const PORT = process.env.SEARCH_REC_PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'search-rec-service' }));

app.use('/api', routes);
app.use(errorHandler);

const start = async () => {
  await connectDB('search-rec-service');
  app.listen(PORT, () => logger.info(`Search & Recommendation Service running on port ${PORT}`));
};

start().catch((err) => {
  logger.error('Failed to start service:', err);
  process.exit(1);
});

module.exports = app;
