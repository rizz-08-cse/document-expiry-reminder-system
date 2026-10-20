const mongoose = require('mongoose');

let memoryServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // 1. Try specified connection URI if provided
  if (uri && uri.trim() !== '') {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Could not connect to configured MONGODB_URI: ${err.message}`);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Production MongoDB connection failed: ${err.message}`);
      }
      console.log('[Database] Falling back to development in-memory MongoDB...');
    }
  }

  // 2. Development fallback with mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create({
      spawn: { timeout: 120000 }
    });
    const memUri = memoryServerInstance.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] Connected to In-Memory MongoDB (Dev Fallback): ${memUri}`);
    console.log('[Database] Note: For persistent data or Atlas, provide MONGODB_URI in server/.env');
    return conn;
  } catch (memErr) {
    console.error('[Database] Failed to initialize in-memory fallback:', memErr.message);
    throw new Error('Database connection failed. Please ensure MongoDB is running or configure MONGODB_URI in .env');
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    }
    console.log('[Database] Disconnected successfully');
  } catch (err) {
    console.error('[Database] Disconnect error:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
