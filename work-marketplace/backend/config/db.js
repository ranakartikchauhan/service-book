const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI environment variable is missing!');
    throw new Error('MONGO_URI is required');
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  };

  try {
    if (!cachedConnection) {
      cachedConnection = await mongoose.connect(mongoUri, opts);
      console.log(`✅ MongoDB connected: ${cachedConnection.connection.host}`);
    }
    return cachedConnection;
  } catch (error) {
    cachedConnection = null;
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
