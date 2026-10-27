const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../../../../shared/errors');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, institution, researchInterests } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Create user
  const user = await User.create({
    name,
    email,
    passwordHash: password,
    institution: institution || '',
    researchInterests: researchInterests || [],
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include passwordHash for comparison
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user);

  res.json({
    success: true,
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

// GET /api/auth/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
});

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ['name', 'institution', 'researchInterests', 'avatar'];
  const updates = {};

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: { user },
  });
});

// POST /api/auth/refresh
const refreshToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const token = generateToken(user);

  res.json({
    success: true,
    data: { token },
  });
});

module.exports = { register, login, getProfile, updateProfile, refreshToken };
