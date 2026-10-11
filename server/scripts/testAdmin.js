import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Farm from '../models/Farm.js';
import Planting from '../models/Planting.js';
import Device from '../models/Device.js';
import PhReading from '../models/PhReading.js';
import Alert from '../models/Alert.js';
import Listing from '../models/Listing.js';
import Inquiry from '../models/Inquiry.js';
import Product from '../models/Product.js';
import Booking from '../models/Booking.js';
import Crop from '../models/Crop.js';

const runTests = async () => {
  let server;
  let passed = 0;
  let failed = 0;

  const recordResult = (description, isPass, detail = '') => {
    if (isPass) {
      passed++;
      console.log(`  [PASS] ${description}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${description} ${detail ? `- ${detail}` : ''}`);
    }
  };

  const tempIds = {
    users: [],
    farms: [],
    plantings: [],
    devices: [],
    readings: [],
    alerts: [],
    listings: [],
    inquiries: [],
    products: [],
    bookings: [],
  };

  const registerUser = async (baseUrl, { name, email, password, role }) => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword: password,
        role,
      }),
    });
    const data = await res.json();
    if (data.data?.user?._id) {
      tempIds.users.push(data.data.user._id);
    }
    return { res, data, token: data.data?.token };
  };

  try {
    await connectDB();

    server = app.listen(0);
    await new Promise((resolve) => server.on('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    console.log(`\n--- Running Reports & Admin Management Tests on ${baseUrl} ---\n`);

    const timestamp = Date.now();
    const tempPassword = 'Password123!';

    // Register temporary users
    const tempFarmerA = await registerUser(baseUrl, {
      name: 'Temp Farmer A',
      email: `test_admin_farmer_a_${timestamp}@example.com`,
      password: tempPassword,
      role: 'farmer',
    });
    const tempFarmerB = await registerUser(baseUrl, {
      name: 'Temp Farmer B',
      email: `test_admin_farmer_b_${timestamp}@example.com`,
      password: tempPassword,
      role: 'farmer',
    });
    const tempBuyer = await registerUser(baseUrl, {
      name: 'Temp Buyer',
      email: `test_admin_buyer_${timestamp}@example.com`,
      password: tempPassword,
      role: 'buyer',
    });

    const farmerAToken = tempFarmerA.token;
    const farmerBToken = tempFarmerB.token;
    const buyerToken = tempBuyer.token;
    const farmerAId = tempFarmerA.data.data?.user?._id;

    // Login admin
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.data?.token;

    // Login seeded demo farmer
    const demoFarmerRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'farmer@icagria.test',
        password: process.env.DEMO_PASSWORD,
      }),
    });
    const demoFarmerData = await demoFarmerRes.json();
    const demoFarmerToken = demoFarmerData.data?.token;

    // ==========================================
    // GROUP 1: Reports Checks
    // ==========================================

    // 1a. Demo farmer farm-summary returns ph.count > 0 and plantings with daysToHarvest
    try {
      const demoFarm = await Farm.findOne({ name: 'Sweet Potato Plot' });
      if (!demoFarm) throw new Error('Demo farm "Sweet Potato Plot" not found');

      const repRes = await fetch(
        `${baseUrl}/api/reports/farm-summary?farmId=${demoFarm._id}&days=30`,
        {
          headers: { Authorization: `Bearer ${demoFarmerToken}` },
        }
      );
      const repData = await repRes.json();

      const phCount = repData.data?.ph?.count || 0;
      const plantings = repData.data?.plantings || [];
      const hasDaysToHarvest =
        plantings.length > 0 &&
        plantings.every((p) => typeof p.daysToHarvest === 'number');

      const isPass = repRes.status === 200 && phCount > 0 && hasDaysToHarvest;
      recordResult(
        '1a. Demo farmer GET /api/reports/farm-summary returns ph.count > 0 and plantings with daysToHarvest',
        isPass,
        `status: ${repRes.status}, phCount: ${phCount}, plantings: ${plantings.length}`
      );
    } catch (e) {
      recordResult(
        '1a. Demo farmer GET /api/reports/farm-summary returns ph.count > 0 and plantings with daysToHarvest',
        false,
        e.message
      );
    }

    // 1b. Temp farmer gets 403 on demo farm
    try {
      const demoFarm = await Farm.findOne({ name: 'Sweet Potato Plot' });
      const repRes = await fetch(
        `${baseUrl}/api/reports/farm-summary?farmId=${demoFarm._id}`,
        {
          headers: { Authorization: `Bearer ${farmerAToken}` },
        }
      );
      recordResult(
        '1b. Temp farmer gets 403 on demo farm report',
        repRes.status === 403,
        `status: ${repRes.status}`
      );
    } catch (e) {
      recordResult('1b. Temp farmer gets 403 on demo farm report', false, e.message);
    }

    // 1c. Sales report works for temp farmer after one of their temp listings is marked sold
    try {
      // Farmer A creates a listing with unit ton and marks it sold
      const listRes = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          cropName: `Sales Test Sweet Potato ${timestamp}`,
          quantity: 2, // 2 tons = 2000 kg
          unit: 'ton',
          pricePerUnit: 10000000, // 10,000,000 IDR per ton -> 10,000 per kg -> 20,000,000 estimatedValue
        }),
      });
      const listData = await listRes.json();
      const listId = listData.data?._id;
      if (listId) tempIds.listings.push(listId);

      // Mark listing as sold
      await fetch(`${baseUrl}/api/listings/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({ status: 'sold' }),
      });

      const salesRes = await fetch(`${baseUrl}/api/reports/sales`, {
        headers: { Authorization: `Bearer ${farmerAToken}` },
      });
      const salesData = await salesRes.json();

      const soldBucket = salesData.data?.byStatus?.sold;
      const isPass =
        salesRes.status === 200 &&
        soldBucket?.count === 1 &&
        soldBucket?.totalQuantityKg === 2000 &&
        soldBucket?.estimatedValue === 20000000;

      recordResult(
        '1c. Sales report works for temp farmer with sold listing (quantity converted to kg, correct estimated value)',
        isPass,
        `status: ${salesRes.status}, count: ${soldBucket?.count}, qtyKg: ${soldBucket?.totalQuantityKg}, val: ${soldBucket?.estimatedValue}`
      );
    } catch (e) {
      recordResult(
        '1c. Sales report works for temp farmer with sold listing (quantity converted to kg, correct estimated value)',
        false,
        e.message
      );
    }

    // ==========================================
    // GROUP 2: Admin API Checks
    // ==========================================

    // 2a. GET /api/admin/stats returns 200 with required keys for admin and 403 for farmer
    try {
      const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const statsData = await statsRes.json();

      const data = statsData.data;
      const hasCounts =
        data?.counts?.users?.total !== undefined &&
        data?.counts?.farms !== undefined &&
        data?.counts?.plantings !== undefined &&
        data?.counts?.devices !== undefined &&
        data?.counts?.readings !== undefined &&
        data?.counts?.listings?.total !== undefined &&
        data?.counts?.inquiries?.total !== undefined &&
        data?.counts?.products !== undefined &&
        data?.counts?.bookings?.total !== undefined;
      const hasOverview = Array.isArray(data?.overview) && data.overview.length === 5;
      const hasRecent =
        Array.isArray(data?.recentUsers) &&
        Array.isArray(data?.recentListings) &&
        Array.isArray(data?.recentProducts);

      const farmerStatsRes = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${farmerAToken}` },
      });

      const isPass =
        statsRes.status === 200 &&
        hasCounts &&
        hasOverview &&
        hasRecent &&
        farmerStatsRes.status === 403;

      recordResult(
        '2a. GET /api/admin/stats returns 200 with required keys for admin and 403 for farmer',
        isPass,
        `status: ${statsRes.status}, counts: ${hasCounts}, overview: ${hasOverview}, farmerStatus: ${farmerStatsRes.status}`
      );
    } catch (e) {
      recordResult(
        '2a. GET /api/admin/stats returns 200 with required keys for admin and 403 for farmer',
        false,
        e.message
      );
    }

    // 2b. PUT on a temp user's role works
    try {
      const putRes = await fetch(`${baseUrl}/api/admin/users/${farmerAId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: 'buyer', name: 'Updated Temp Name' }),
      });
      const putData = await putRes.json();

      // Reset role back to farmer
      await fetch(`${baseUrl}/api/admin/users/${farmerAId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: 'farmer' }),
      });

      const isPass =
        putRes.status === 200 &&
        putData.data?.role === 'buyer' &&
        putData.data?.name === 'Updated Temp Name';

      recordResult(
        '2b. Admin PUT /api/admin/users/:id updates user role and name',
        isPass,
        `status: ${putRes.status}, role: ${putData.data?.role}`
      );
    } catch (e) {
      recordResult('2b. Admin PUT /api/admin/users/:id updates user role and name', false, e.message);
    }

    // 2c. Changing one's own role returns 409
    try {
      const adminUser = await User.findOne({ email: adminEmail });
      const ownRoleRes = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: 'farmer' }),
      });
      recordResult(
        '2c. Admin changing own role returns 409',
        ownRoleRes.status === 409,
        `status: ${ownRoleRes.status}`
      );
    } catch (e) {
      recordResult('2c. Admin changing own role returns 409', false, e.message);
    }

    // 2d. Deleting oneself returns 409
    try {
      const adminUser = await User.findOne({ email: adminEmail });
      const delSelfRes = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      recordResult(
        '2d. Admin deleting self returns 409',
        delSelfRes.status === 409,
        `status: ${delSelfRes.status}`
      );
    } catch (e) {
      recordResult('2d. Admin deleting self returns 409', false, e.message);
    }

    // 2e. Deleting another admin returns 409
    try {
      const secondAdmin = await User.create({
        name: 'Second Admin',
        email: `test_admin_2_${timestamp}@example.com`,
        password: tempPassword,
        role: 'admin',
      });
      tempIds.users.push(secondAdmin._id);

      const delOtherAdminRes = await fetch(`${baseUrl}/api/admin/users/${secondAdmin._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      recordResult(
        '2e. Admin deleting another admin returns 409',
        delOtherAdminRes.status === 409,
        `status: ${delOtherAdminRes.status}`
      );
    } catch (e) {
      recordResult('2e. Admin deleting another admin returns 409', false, e.message);
    }

    // 2f. Demoting the last remaining admin returns 409
    try {
      // First delete the temporary secondAdmin so only 1 admin remains
      const secondAdmin = await User.findOne({ email: `test_admin_2_${timestamp}@example.com` });
      if (secondAdmin) {
        await User.deleteOne({ _id: secondAdmin._id });
        const idx = tempIds.users.indexOf(secondAdmin._id);
        if (idx !== -1) tempIds.users.splice(idx, 1);
      }

      // Verify count is 1
      const countAdmins = await User.countDocuments({ role: 'admin' });
      const adminUser = await User.findOne({ email: adminEmail });

      const demoteRes = await fetch(`${baseUrl}/api/admin/users/${adminUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: 'buyer' }),
      });

      const isPass = countAdmins === 1 && demoteRes.status === 409;
      recordResult(
        '2f. Demoting the last remaining admin returns 409',
        isPass,
        `status: ${demoteRes.status}, count: ${countAdmins}`
      );
    } catch (e) {
      recordResult('2f. Demoting the last remaining admin returns 409', false, e.message);
    }

    // ==========================================
    // GROUP 3: Cascade Delete Check
    // ==========================================

    // 3. Create temp farmer with full ecosystem, delete via admin and verify cascade
    try {
      const cascadeFarmer = await registerUser(baseUrl, {
        name: 'Cascade Farmer',
        email: `test_admin_cascade_${timestamp}@example.com`,
        password: tempPassword,
        role: 'farmer',
      });
      const cFarmerToken = cascadeFarmer.token;
      const cFarmerId = cascadeFarmer.data.data?.user?._id;

      // 3.1 Create farm
      const sweetCrop = await Crop.findOne({ name: 'Sweet potato' });
      const farmRes = await fetch(`${baseUrl}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cFarmerToken}`,
        },
        body: JSON.stringify({
          name: `Cascade Farm ${timestamp}`,
          location: { text: 'Subang, West Java', lat: -6.56, lng: 107.76 },
          areaSize: 1.5,
          mainCrop: sweetCrop?._id,
        }),
      });
      const farmData = await farmRes.json();
      const cFarmId = farmData.data?._id;

      // 3.2 Create planting
      const plantingRes = await fetch(`${baseUrl}/api/plantings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cFarmerToken}`,
        },
        body: JSON.stringify({
          farm: cFarmId,
          crop: sweetCrop?._id,
          variety: 'Orange',
          quantity: 200,
        }),
      });
      const plantingData = await plantingRes.json();
      const cPlantingId = plantingData.data?._id;

      // 3.3 Create device
      const deviceRes = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cFarmerToken}`,
        },
        body: JSON.stringify({
          farm: cFarmId,
          name: 'Cascade Sensor',
          type: 'soil-ph',
          source: 'simulated',
        }),
      });
      const deviceData = await deviceRes.json();
      const cDeviceId = deviceData.data?._id;

      // 3.4 Create simulated reading
      const readingRes = await fetch(`${baseUrl}/api/readings/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cFarmerToken}`,
        },
        body: JSON.stringify({
          farmId: cFarmId,
          mode: 'auto',
        }),
      });
      const readingData = await readingRes.json();
      const cReadingId = readingData.data?.reading?._id;

      // 3.5 Create alert
      const alertDoc = await Alert.create({
        farm: cFarmId,
        user: cFarmerId,
        type: 'ph',
        message: 'Cascade test alert',
      });
      const cAlertId = alertDoc._id;

      // 3.6 Create listing
      const listingRes = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cFarmerToken}`,
        },
        body: JSON.stringify({
          cropName: `Cascade Yam ${timestamp}`,
          quantity: 50,
          pricePerUnit: 12000,
        }),
      });
      const listingData = await listingRes.json();
      const cListingId = listingData.data?._id;

      // 3.7 Temp buyer creates inquiry on that listing
      const inquiryRes = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          listing: cListingId,
          quantity: 5,
        }),
      });
      const inquiryData = await inquiryRes.json();
      const cInquiryId = inquiryData.data?._id;

      // 3.8 Create temporary product and pending product booking for cascade farmer
      const testProd = await Product.create({
        name: `Cascade Product ${timestamp}`,
        category: 'seeds',
        price: 20000,
        stock: 15,
      });
      tempIds.products.push(testProd._id);
      const initialStock = testProd.stock;

      const bookingRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cFarmerToken}`,
        },
        body: JSON.stringify({
          type: 'product',
          product: testProd._id,
          quantity: 3,
        }),
      });
      const bookingData = await bookingRes.json();
      const cBookingId = bookingData.data?._id;

      const prodAfterBooking = await Product.findById(testProd._id);

      // 3.9 Now delete the cascade farmer via admin endpoint
      const delUserRes = await fetch(`${baseUrl}/api/admin/users/${cFarmerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // Remove from tempIds.users to avoid double deletion in cleanup
      const uIdx = tempIds.users.indexOf(cFarmerId);
      if (uIdx !== -1) tempIds.users.splice(uIdx, 1);

      // 3.10 Verify database state
      const farmCheck = await Farm.findById(cFarmId);
      const plantingCheck = await Planting.findById(cPlantingId);
      const deviceCheck = await Device.findById(cDeviceId);
      const readingCheck = await PhReading.findById(cReadingId);
      const alertCheck = await Alert.findById(cAlertId);
      const listingCheck = await Listing.findById(cListingId);
      const inquiryCheck = await Inquiry.findById(cInquiryId);
      const bookingCheck = await Booking.findById(cBookingId);
      const prodCheck = await Product.findById(testProd._id);

      const isPass =
        delUserRes.status === 200 &&
        prodAfterBooking?.stock === 12 && // 15 - 3
        !farmCheck &&
        !plantingCheck &&
        !deviceCheck &&
        !readingCheck &&
        !alertCheck &&
        !listingCheck &&
        !inquiryCheck &&
        !bookingCheck &&
        prodCheck?.stock === initialStock; // Restored to 15

      recordResult(
        '3. Cascade delete of user deletes farm, planting, device, reading, alert, listing, inquiry, booking, and restores product stock',
        isPass,
        `delStatus: ${delUserRes.status}, farm: ${!farmCheck}, listing: ${!listingCheck}, inq: ${!inquiryCheck}, booking: ${!bookingCheck}, restoredStock: ${prodCheck?.stock}`
      );
    } catch (e) {
      recordResult(
        '3. Cascade delete of user deletes farm, planting, device, reading, alert, listing, inquiry, booking, and restores product stock',
        false,
        e.message
      );
    }

    // ==========================================
    // GROUP 4: Protected route without token returns 401
    // ==========================================
    try {
      const noTokenRes = await fetch(`${baseUrl}/api/admin/stats`);
      recordResult(
        '4. Protected route (/api/admin/stats) without token returns 401',
        noTokenRes.status === 401,
        `status: ${noTokenRes.status}`
      );
    } catch (e) {
      recordResult('4. Protected route (/api/admin/stats) without token returns 401', false, e.message);
    }

    console.log('\n========================================');
    console.log(
      `Admin Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`
    );
    console.log('========================================\n');
  } catch (error) {
    console.error('Test execution fatal error:', error.message);
    failed++;
  } finally {
    try {
      if (tempIds.bookings.length > 0) {
        await Booking.deleteMany({ _id: { $in: tempIds.bookings } });
      }
      if (tempIds.products.length > 0) {
        await Product.deleteMany({ _id: { $in: tempIds.products } });
      }
      if (tempIds.inquiries.length > 0) {
        await Inquiry.deleteMany({ _id: { $in: tempIds.inquiries } });
      }
      if (tempIds.listings.length > 0) {
        await Listing.deleteMany({ _id: { $in: tempIds.listings } });
      }
      if (tempIds.alerts.length > 0) {
        await Alert.deleteMany({ _id: { $in: tempIds.alerts } });
      }
      if (tempIds.readings.length > 0) {
        await PhReading.deleteMany({ _id: { $in: tempIds.readings } });
      }
      if (tempIds.devices.length > 0) {
        await Device.deleteMany({ _id: { $in: tempIds.devices } });
      }
      if (tempIds.plantings.length > 0) {
        await Planting.deleteMany({ _id: { $in: tempIds.plantings } });
      }
      if (tempIds.farms.length > 0) {
        await Farm.deleteMany({ _id: { $in: tempIds.farms } });
      }
      if (tempIds.users.length > 0) {
        await User.deleteMany({ _id: { $in: tempIds.users } });
      }
    } catch (cleanupErr) {
      console.error('Cleanup failed:', cleanupErr.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
