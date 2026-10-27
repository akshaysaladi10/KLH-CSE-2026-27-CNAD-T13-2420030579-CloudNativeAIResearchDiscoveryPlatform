const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, refreshToken } = require('../controllers/authController');
const { verifyToken } = require('../../../../shared/auth');
const { validateRequest } = require('../../../../shared/errors');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/authValidators');

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, validateRequest(updateProfileSchema), updateProfile);
router.post('/refresh', verifyToken, refreshToken);

module.exports = router;
