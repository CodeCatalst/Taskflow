import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000
};

const connectWithUri = async (uri) => {
  const conn = await mongoose.connect(uri, mongooseOptions);
  return conn;
};

const startMemoryMongo = async () => {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create({
      instance: {
        ip: '127.0.0.1',
        port: 27017,
        dbName: 'taskflow'
      }
    });
  }

  return memoryServer.getUri('taskflow');
};

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const conn = await connectWithUri(process.env.MONGODB_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('❌ MongoDB Connection Error: MONGODB_URI is not set in backend/.env');
      return;
    }

    const memoryUri = await startMemoryMongo();
    process.env.MONGODB_URI = memoryUri;
    const conn = await connectWithUri(memoryUri);
    console.log(`✅ In-memory MongoDB Connected: ${conn.connection.host}`);
    console.log('ℹ️ Running with local in-memory database for development');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production' && !memoryServer) {
      try {
        const memoryUri = await startMemoryMongo();
        process.env.MONGODB_URI = memoryUri;
        const conn = await connectWithUri(memoryUri);
        console.log(`✅ In-memory MongoDB Connected: ${conn.connection.host}`);
        console.log('ℹ️ Running with local in-memory database fallback');
        return;
      } catch (fallbackError) {
        console.error(`❌ MongoDB Connection Error: ${fallbackError.message}`);
        console.error('⚠️  Database connection unavailable (primary + fallback failed).');
        return;
      }
    }

    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`⚠️  Server will continue running, but database operations will fail.`);
    console.error(`🔧 Fix: Add your IP to MongoDB Atlas whitelist or allow 0.0.0.0/0`);
  }
};

export default connectDB;