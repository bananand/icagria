import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';
import Planting from '../models/Planting.js';
import Device from '../models/Device.js';
import PhReading from '../models/PhReading.js';
import Alert from '../models/Alert.js';
import { demoFarms, demoPlantings } from './demoData.js';

// Deterministic pseudo-random number generator (Mulberry32)
const createRNG = (seed) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const runSeed = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Error: Refusing to run seed script in production environment.');
    process.exit(1);
  }

  const requiredEnvs = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'DEMO_PASSWORD'];
  const missingEnvs = requiredEnvs.filter((key) => !process.env[key]);
  if (missingEnvs.length > 0) {
    console.error(`Error: Missing required environment variable(s): ${missingEnvs.join(', ')}`);
    process.exit(1);
  }

  const isReset = process.argv.includes('--reset');

  try {
    await connectDB();

    // Reset step: remove demo farmer and buyer plus all their data
    if (isReset) {
      const demoEmails = ['farmer@icagria.test', 'buyer@icagria.test'];
      const demoUsers = await User.find({ email: { $in: demoEmails } });
      const demoUserIds = demoUsers.map((u) => u._id);

      const farmsToDelete = await Farm.find({ owner: { $in: demoUserIds } });
      const farmIdsToDelete = farmsToDelete.map((f) => f._id);

      await Planting.deleteMany({ farm: { $in: farmIdsToDelete } });
      await Device.deleteMany({ farm: { $in: farmIdsToDelete } });
      await PhReading.deleteMany({ farm: { $in: farmIdsToDelete } });
      await Alert.deleteMany({
        $or: [{ farm: { $in: farmIdsToDelete } }, { user: { $in: demoUserIds } }],
      });
      await Farm.deleteMany({ _id: { $in: farmIdsToDelete } });
      await User.deleteMany({ _id: { $in: demoUserIds } });
    }

    // 1. Seed crops from crops.json
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const cropsRaw = fs.readFileSync(path.join(__dirname, 'crops.json'), 'utf-8');
    const { crops } = JSON.parse(cropsRaw);

    const cropMap = new Map();
    for (const cropData of crops) {
      const crop = await Crop.findOneAndUpdate(
        { name: cropData.name },
        { $set: cropData },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      cropMap.set(crop.name, crop);
    }

    // 2. Seed Users
    const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'icagria Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      });
    }

    let demoFarmer = await User.findOne({ email: 'farmer@icagria.test' });
    if (!demoFarmer) {
      demoFarmer = await User.create({
        name: 'Demo Farmer',
        email: 'farmer@icagria.test',
        password: process.env.DEMO_PASSWORD,
        role: 'farmer',
      });
    }

    let demoBuyer = await User.findOne({ email: 'buyer@icagria.test' });
    if (!demoBuyer) {
      demoBuyer = await User.create({
        name: 'Demo Buyer',
        email: 'buyer@icagria.test',
        password: process.env.DEMO_PASSWORD,
        role: 'buyer',
      });
    }

    // 3. Seed Demo Farms for Demo Farmer
    const farmMap = new Map();
    for (const farmData of demoFarms) {
      const mainCrop = cropMap.get(farmData.mainCropName);
      const farm = await Farm.findOneAndUpdate(
        { owner: demoFarmer._id, name: farmData.name },
        {
          $set: {
            owner: demoFarmer._id,
            name: farmData.name,
            location: farmData.location,
            areaSize: farmData.areaSize,
            mainCrop: mainCrop ? mainCrop._id : undefined,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      farmMap.set(farm.name, farm);
    }

    // 4. Seed Plantings
    const now = new Date();
    for (const pData of demoPlantings) {
      const farm = farmMap.get(pData.farmName);
      const crop = cropMap.get(pData.cropName);
      if (farm && crop) {
        const plantedDate = new Date(now);
        plantedDate.setDate(plantedDate.getDate() - pData.daysAgoPlanted);

        const expectedHarvestDate = new Date(plantedDate);
        expectedHarvestDate.setDate(expectedHarvestDate.getDate() + (crop.growthDays || 90));

        await Planting.findOneAndUpdate(
          { farm: farm._id, crop: crop._id },
          {
            $set: {
              farm: farm._id,
              crop: crop._id,
              variety: pData.variety,
              plantedDate,
              expectedHarvestDate,
              status: 'growing',
            },
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      }
    }

    // 5. Seed Devices & Historical pH Readings
    const rng = createRNG(424242);
    let totalReadingsSeeded = 0;

    for (const farm of farmMap.values()) {
      let device = await Device.findOne({ farm: farm._id });
      if (!device) {
        const apiKey = crypto.randomBytes(16).toString('hex');
        device = await Device.create({
          farm: farm._id,
          name: 'Simulated pH Sensor 1',
          type: 'soil-ph',
          source: 'simulated',
          status: 'active',
          apiKey,
        });
      }

      // Delete existing seed readings for this farm to ensure idempotency
      await PhReading.deleteMany({ farm: farm._id, source: 'seed' });

      // Identify main crop bounds for realistic simulated readings
      const cropDoc = farm.mainCrop ? await Crop.findById(farm.mainCrop) : null;
      const phMin = cropDoc ? cropDoc.phMin : 6.0;
      const phMax = cropDoc ? cropDoc.phMax : 7.0;
      const midpoint = (phMin + phMax) / 2;

      const readings = [];
      let latestReadingDate = null;

      // 30 days x 2 readings per day (08:00 and 17:00)
      for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const baseDate = new Date(now);
        baseDate.setDate(baseDate.getDate() - dayOffset);

        const times = [
          { hour: 8, minute: 0 },
          { hour: 17, minute: 0 },
        ];

        for (let tIdx = 0; tIdx < times.length; tIdx++) {
          const readingTime = new Date(baseDate);
          readingTime.setHours(times[tIdx].hour, times[tIdx].minute, 0, 0);

          if (!latestReadingDate || readingTime > latestReadingDate) {
            latestReadingDate = readingTime;
          }

          let val;

          // Inject out-of-range readings in the last 7 days
          if (dayOffset === 4 && tIdx === 0) {
            // Below phMin by 0.3 to 0.5
            const drop = 0.3 + rng() * 0.2;
            val = phMin - drop;
          } else if (dayOffset === 2 && tIdx === 1) {
            // Above phMax by 0.2 to 0.4
            const spike = 0.2 + rng() * 0.2;
            val = phMax + spike;
          } else {
            // In-range reading: midpoint + small noise (+-0.15) + gentle wave
            const noise = (rng() * 2 - 1) * 0.15;
            const drift = Math.sin((dayOffset / 30) * Math.PI * 2) * 0.1;
            val = midpoint + drift + noise;
          }

          const roundedVal = Math.round(Math.min(14, Math.max(0, val)) * 100) / 100;

          readings.push({
            device: device._id,
            farm: farm._id,
            value: roundedVal,
            recordedAt: readingTime,
            source: 'seed',
          });
        }
      }

      await PhReading.insertMany(readings);
      totalReadingsSeeded += readings.length;

      if (latestReadingDate) {
        device.lastSeenAt = latestReadingDate;
        await device.save();
      }
    }

    // Print final counts only
    const counts = {
      crops: await Crop.countDocuments(),
      users: await User.countDocuments(),
      farms: await Farm.countDocuments(),
      plantings: await Planting.countDocuments(),
      devices: await Device.countDocuments(),
      phReadings: await PhReading.countDocuments(),
    };

    console.log('\n=== Database Seed Summary ===');
    console.log(`Crops:       ${counts.crops}`);
    console.log(`Users:       ${counts.users}`);
    console.log(`Farms:       ${counts.farms}`);
    console.log(`Plantings:   ${counts.plantings}`);
    console.log(`Devices:     ${counts.devices}`);
    console.log(`PhReadings:  ${counts.phReadings}`);
    console.log('=== Seed Completed Successfully ===\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runSeed();
