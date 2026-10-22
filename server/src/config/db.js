const mongoose = require('mongoose');

/**
 * connectDB — Connects to MongoDB using the URI from environment variables.
 * 
 * WHY: We keep the connection string in .env so credentials are never
 *      checked into Git. Mongoose handles connection pooling automatically.
 * 
 * VIVA TIP: "We use mongoose.connect() with the URI stored in process.env.
 *            If the connection fails, we log the error and exit the process
 *            so the server doesn't run without a database."
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 7+ no longer needs useNewUrlParser / useUnifiedTopology
      // — they are always enabled. We pass dbName to target our database.
      dbName: 'anvaya',
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit with failure code
  }
};

module.exports = connectDB;
