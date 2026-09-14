const mongoose = require('mongoose');

let isConnected = false;
let isInMemoryFallback = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saferoute_db';

  console.log(`[Database] Attempting connection to MongoDB (${uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local / Custom URI'})...`);

  try {
    mongoose.set('strictQuery', false);

    // Timeout after 2000ms if not reachable
    const connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout (2000ms)')), 2200)
    );

    const conn = await Promise.race([connectionPromise, timeoutPromise]);
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`[Database] MongoDB Atlas / Local Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database Notice] MongoDB connection attempt finished: ${error.message}`);
    console.log(`[Database Notice] Running with Active SafeRoute In-Memory Store & Preloaded City Hub Data.`);
    console.log(`[Database Notice] To connect your MongoDB Atlas cluster anytime, simply update MONGODB_URI in backend/.env`);
    isConnected = false;
    isInMemoryFallback = true;
    return false;
  }
};

const getDBStatus = () => ({
  isConnected,
  isInMemoryFallback,
  uri: process.env.MONGODB_URI ? 'Configured (MongoDB Atlas / URI)' : 'Default (Local / Fallback)'
});

module.exports = { connectDB, getDBStatus };
