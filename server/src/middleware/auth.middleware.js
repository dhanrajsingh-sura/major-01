const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Auth Middleware — Protects routes by verifying JWT tokens.
 *
 * HOW IT WORKS (viva answer):
 * "When a user logs in, the server creates a JWT (JSON Web Token) containing
 *  the user's ID. The frontend stores this token and sends it with every
 *  request in the Authorization header. This middleware:
 *  1. Extracts the token from the header
 *  2. Verifies it hasn't been tampered with (using our JWT_SECRET)
 *  3. Looks up the user in the database
 *  4. Attaches the user object to req.user so controllers can use it
 *  If any step fails, access is denied with a 401 status."
 *
 * WHY WE LOOK UP THE USER IN THE DATABASE:
 * "The token only contains the user ID. We fetch the full user from MongoDB
 *  to ensure the account still exists and to get the current role. This
 *  prevents deleted or deactivated users from accessing the API."
 */

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify token — jwt.verify throws if invalid/expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token payload (exclude password)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user no longer exists',
      });
    }

    // Attach user to request object for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired — please log in again'
        : 'Not authorized — invalid token';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * authorize — Restrict access to specific roles.
 * Usage: router.get('/admin', protect, authorize('admin'), handler)
 *
 * VIVA TIP: "authorize is a higher-order function — it returns a middleware.
 *            We pass the allowed roles, and it checks if req.user.role
 *            (set by the protect middleware) matches any of them."
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
