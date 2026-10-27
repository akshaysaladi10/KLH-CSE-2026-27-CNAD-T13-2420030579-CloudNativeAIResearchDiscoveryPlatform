const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be at most 100 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  institution: Joi.string().max(200).optional().allow(''),
  researchInterests: Joi.array().items(Joi.string()).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  institution: Joi.string().max(200).optional().allow(''),
  researchInterests: Joi.array().items(Joi.string()).optional(),
  avatar: Joi.string().uri().optional().allow(''),
});

module.exports = { registerSchema, loginSchema, updateProfileSchema };
