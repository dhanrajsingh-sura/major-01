const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * Auth Controller — Handles registration, login, and profile retrieval.
 *
 * IMPORTANT SECURITY PATTERNS (viva answer):
 * 1. Passwords are hashed by the User model's pre-save hook — we never
 *    store plaintext passwords.
 * 2. We never return password hashes in API responses.
 * 3. JWT tokens are signed with a secret key from .env — never hardcoded.
 * 4. Login uses the same error message for "user not found" and "wrong
 *    password" to prevent email enumeration attacks.
 * 5. The profile endpoint trusts ONLY the token (req.user from middleware),
 *    not any user-supplied ID.
 */

// ──── Helper: Generate JWT Token ────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
const register = async (req, res) => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Only allow 'student' or 'alumni' during registration
    // (admins are created manually or by existing admins)
    const allowedRoles = ['student', 'alumni'];
    const userRole = allowedRoles.includes(role) ? role : 'student';

    // Create user (password is hashed by the pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Return user data WITHOUT password
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: user.toSafeObject(),
        token,
      },
    });
  } catch (error) {
    // Handle Mongoose duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0], // Return first validation error
        errors: messages,
      });
    }

    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }

    const { email, password } = req.body;

    // Find user and explicitly include the password field
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    // Use the SAME error message whether user doesn't exist or password is wrong
    // This prevents attackers from learning which emails are registered
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare provided password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Protected by the auth middleware — req.user is set from the JWT,
 * NOT from any user-supplied parameter.
 */
const getMe = async (req, res) => {
  try {
    // req.user was set by the protect middleware from the verified JWT
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
    });
  }
};

module.exports = { register, login, getMe };
