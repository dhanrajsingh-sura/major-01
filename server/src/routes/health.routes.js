const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * GET /api/health
 *
 * A "health check" endpoint tells us if the server is running AND
 * if MongoDB is connected. This is the first thing we test after setup.
 *
 * Mongoose readyState values:
 *   0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 *
 * VIVA TIP: "The health endpoint returns server uptime and database
 *            connection status. It's useful for monitoring and was the
 *            first thing we verified after deployment."
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'ANVAYA API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStates[dbState] || 'unknown',
      name: mongoose.connection.name || 'not connected',
    },
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

module.exports = router;
