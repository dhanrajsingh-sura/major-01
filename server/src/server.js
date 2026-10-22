/**
 * server.js — Entry point for the ANVAYA backend.
 *
 * This file:
 * 1. Loads environment variables from .env
 * 2. Connects to MongoDB
 * 3. Starts the Express server on the configured port
 *
 * VIVA TIP: "server.js is the first file Node runs. It loads secrets
 *            from .env, connects to our MongoDB Atlas cluster, and then
 *            starts listening for HTTP requests on port 5000."
 */

// Load environment variables FIRST — before anything else reads process.env
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to database, then start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 ANVAYA Server running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();
