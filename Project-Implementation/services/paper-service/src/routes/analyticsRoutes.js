const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/analyticsController');
const { verifyToken } = require('../../../../shared/auth');

router.get('/dashboard', verifyToken, getDashboardStats);

module.exports = router;
