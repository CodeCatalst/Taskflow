import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`⚠️  Server will continue running, but database operations will fail.`);
    console.error(`🔧 Fix: Add your IP to MongoDB Atlas whitelist or allow 0.0.0.0/0`);
  }
};

export default connectDB;