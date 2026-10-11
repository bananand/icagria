import mongoose from 'mongoose';
import '../models/index.js';

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('Database connection error: MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'icagria',
    });
    console.log(`Connected to MongoDB: ${conn.connection.name} (host: ${conn.connection.host})`);

    // Call init on every registered model to build collections and indexes
    for (const model of Object.values(mongoose.models)) {
      await model.createCollection().catch(() => {});
      await model.init();
    }

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
