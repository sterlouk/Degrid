import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Falls back to mock data mode if MONGODB_URI is not provided
 * @returns {Promise<boolean>} Connection status
 */
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri.trim() === '') {
      console.log('⚠️  No MongoDB URI provided - Running in MOCK DATA mode');
      return false;
    }

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);

    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Falling back to MOCK DATA mode');
    return false;
  }
};

/**
 * Close database connection gracefully
 */
const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing database:', error.message);
  }
};

export { connectDatabase, closeDatabase };
