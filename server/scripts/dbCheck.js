import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';

const runDbCheck = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;

    console.log(`\n=== Database Check: ${dbName} ===`);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'))
      .sort();

    console.log(`Found ${collectionNames.length} collection(s):`);
    for (const name of collectionNames) {
      const count = await db.collection(name).countDocuments();
      console.log(`  - ${name}: ${count} document(s)`);
    }

    console.log('=== Database Check Complete ===\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Database check failed: ${error.message}`);
    process.exit(1);
  }
};

runDbCheck();
