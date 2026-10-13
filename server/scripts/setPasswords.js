import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const runSetPasswords = async () => {
  // 1. Refuse to run if NODE_ENV is "production"
  if (process.env.NODE_ENV === 'production') {
    console.error('Error: Refusing to run setPasswords script in production environment.');
    process.exit(1);
  }

  // 2. Read ADMIN_EMAIL, ADMIN_PASSWORD, and DEMO_PASSWORD from process.env.
  // If any is missing, stop with a message naming the missing variable (never print values).
  const requiredEnvs = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'DEMO_PASSWORD'];
  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);
  if (missingEnvs.length > 0) {
    console.error(`Error: Missing required environment variable(s): ${missingEnvs.join(', ')}`);
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const demoPassword = process.env.DEMO_PASSWORD;

  const targets = [
    { email: adminEmail, password: adminPassword },
    { email: 'farmer@icagria.test', password: demoPassword },
    { email: 'buyer@icagria.test', password: demoPassword },
  ];

  try {
    // 3. Connect with config/db.js
    await connectDB();

    console.log('\n=== Setting Account Passwords ===');

    // 4. For admin (ADMIN_EMAIL), farmer@icagria.test, and buyer@icagria.test:
    // find the user with select("+password") and, if it exists, set user.password to the env value
    // and save() so the existing pre-save hook hashes it.
    // If the user does not exist, print that it was skipped and suggest running npm run seed.
    // 5. Print only the email and "updated" or "skipped" per account. Never print passwords or hashes.
    // 6. Do not change any other data.
    for (const target of targets) {
      const user = await User.findOne({ email: target.email }).select('+password');

      if (!user) {
        console.log(`${target.email}: skipped (user not found, suggest running npm run seed)`);
      } else {
        user.password = target.password;
        await user.save();
        console.log(`${target.email}: updated`);
      }
    }

    console.log('=== Account Passwords Set Complete ===\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Failed to set passwords: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runSetPasswords();
