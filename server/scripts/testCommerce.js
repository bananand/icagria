import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Booking from '../models/Booking.js';
import Farm from '../models/Farm.js';

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
    products: [],
    bookings: [],
  };

  // Keep track of any stock modifications on seeded products to restore them in finally
  const originalStockMap = new Map();

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

    console.log(`\n--- Running Products, Bookings & Pest Tips Tests on ${baseUrl} ---\n`);

    const timestamp = Date.now();
    const tempPassword = 'Password123!';

    // Register temporary users
    const farmerA = await registerUser(baseUrl, {
      name: 'Temp Farmer A',
      email: `test_comm_farmer_a_${timestamp}@example.com`,
      password: tempPassword,
      role: 'farmer',
    });
    const farmerB = await registerUser(baseUrl, {
      name: 'Temp Farmer B',
      email: `test_comm_farmer_b_${timestamp}@example.com`,
      password: tempPassword,
      role: 'farmer',
    });
    const buyer = await registerUser(baseUrl, {
      name: 'Temp Buyer',
      email: `test_comm_buyer_${timestamp}@example.com`,
      password: tempPassword,
      role: 'buyer',
    });

    const farmerAToken = farmerA.token;
    const farmerBToken = farmerB.token;
    const buyerToken = buyer.token;

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

    // Login seeded demo farmer for read-only tests
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
    // GROUP 1: Products API Checks
    // ==========================================

    // 1a. GET returns seeded products (at least 9 seeded)
    try {
      const getRes = await fetch(`${baseUrl}/api/products`, {
        headers: { Authorization: `Bearer ${farmerAToken}` },
      });
      const getData = await getRes.json();
      const products = getData.data || [];
      const has9 = products.length >= 9;
      recordResult(
        '1a. GET /api/products returns 9 seeded products',
        getRes.status === 200 && has9,
        `status: ${getRes.status}, count: ${products.length}`
      );
    } catch (e) {
      recordResult('1a. GET /api/products returns 9 seeded products', false, e.message);
    }

    // 1b. Category filter works
    try {
      const catRes = await fetch(`${baseUrl}/api/products?category=seeds`, {
        headers: { Authorization: `Bearer ${farmerAToken}` },
      });
      const catData = await catRes.json();
      const seedsProducts = catData.data || [];
      const allSeeds =
        seedsProducts.length > 0 && seedsProducts.every((p) => p.category === 'seeds');
      recordResult(
        '1b. Category filter (?category=seeds) returns only seeds',
        catRes.status === 200 && allSeeds,
        `status: ${catRes.status}, count: ${seedsProducts.length}`
      );
    } catch (e) {
      recordResult('1b. Category filter (?category=seeds) returns only seeds', false, e.message);
    }

    // 1c. Farmer POST /api/products returns 403
    try {
      const postRes = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          name: 'Forbidden Crop Seed',
          category: 'seeds',
          price: 10000,
          stock: 5,
        }),
      });
      recordResult(
        '1c. Farmer POST /api/products returns 403',
        postRes.status === 403,
        `status: ${postRes.status}`
      );
    } catch (e) {
      recordResult('1c. Farmer POST /api/products returns 403', false, e.message);
    }

    // 1d. Admin creates, updates, and deletes a temporary product
    try {
      const createRes = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: `Temp Admin Product ${timestamp}`,
          category: 'equipment',
          price: 75000,
          stock: 10,
          description: 'A temporary tool',
        }),
      });
      const createData = await createRes.json();
      const tempProdId = createData.data?._id;
      if (tempProdId) tempIds.products.push(tempProdId);

      const updateRes = await fetch(`${baseUrl}/api/products/${tempProdId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ price: 80000, stock: 12 }),
      });
      const updateData = await updateRes.json();

      const deleteRes = await fetch(`${baseUrl}/api/products/${tempProdId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const getDeletedRes = await fetch(`${baseUrl}/api/products/${tempProdId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const isPass =
        createRes.status === 201 &&
        updateRes.status === 200 &&
        updateData.data?.price === 80000 &&
        updateData.data?.stock === 12 &&
        deleteRes.status === 200 &&
        getDeletedRes.status === 404;

      recordResult(
        '1d. Admin creates, updates, and deletes temporary product',
        isPass,
        `create: ${createRes.status}, update: ${updateRes.status}, delete: ${deleteRes.status}, getDeleted: ${getDeletedRes.status}`
      );
    } catch (e) {
      recordResult('1d. Admin creates, updates, and deletes temporary product', false, e.message);
    }

    // ==========================================
    // GROUP 2: Bookings API Checks
    // ==========================================

    // Create a temporary product for booking tests to avoid altering seeded stock permanently
    const testProdRes = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Test Booking Product ${timestamp}`,
        category: 'seeds',
        price: 25000,
        stock: 10,
      }),
    });
    const testProdData = await testProdRes.json();
    const testProdId = testProdData.data?._id;
    if (testProdId) tempIds.products.push(testProdId);

    let bookingFarmerAId = null;

    // 2a. Farmer A books product with quantity 2 sending fake totalAmount
    try {
      const bookRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          type: 'product',
          product: testProdId,
          quantity: 2,
          totalAmount: 1, // Fake totalAmount that server MUST ignore
        }),
      });
      const bookData = await bookRes.json();
      bookingFarmerAId = bookData.data?._id;
      if (bookingFarmerAId) tempIds.bookings.push(bookingFarmerAId);

      const prodCheck = await Product.findById(testProdId);

      const isPass =
        bookRes.status === 201 &&
        bookData.data?.totalAmount === 50000 && // 25000 x 2
        bookData.data?.productName === `Test Booking Product ${timestamp}` &&
        bookData.data?.unitPrice === 25000 &&
        prodCheck?.stock === 8; // 10 - 2

      recordResult(
        '2a. Farmer A books product qty 2: server computes totalAmount (ignores fake), snapshot saved, stock drops by 2',
        isPass,
        `status: ${bookRes.status}, totalAmount: ${bookData.data?.totalAmount}, stock: ${prodCheck?.stock}`
      );
    } catch (e) {
      recordResult(
        '2a. Farmer A books product qty 2: server computes totalAmount (ignores fake), snapshot saved, stock drops by 2',
        false,
        e.message
      );
    }

    // 2b. Quantity above stock returns 409
    try {
      const overRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          type: 'product',
          product: testProdId,
          quantity: 999,
        }),
      });
      recordResult(
        '2b. Booking quantity above stock returns 409',
        overRes.status === 409,
        `status: ${overRes.status}`
      );
    } catch (e) {
      recordResult('2b. Booking quantity above stock returns 409', false, e.message);
    }

    // 2c. Cancelling restores stock
    try {
      const cancelRes = await fetch(`${baseUrl}/api/bookings/${bookingFarmerAId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${farmerAToken}` },
      });
      const prodCheck = await Product.findById(testProdId);

      const isPass = cancelRes.status === 200 && prodCheck?.stock === 10;
      recordResult(
        '2c. Owner cancels pending product booking: restores stock to 10',
        isPass,
        `status: ${cancelRes.status}, stock: ${prodCheck?.stock}`
      );
    } catch (e) {
      recordResult('2c. Owner cancels pending product booking: restores stock to 10', false, e.message);
    }

    // 2d. Consultation past date returns 400, future date returns 201
    try {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const pastRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          type: 'consultation',
          scheduledAt: pastDate,
          notes: 'Past meeting',
        }),
      });

      const futureRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          type: 'consultation',
          scheduledAt: futureDate,
          notes: 'Upcoming field consultation',
        }),
      });
      const futureData = await futureRes.json();
      if (futureData.data?._id) tempIds.bookings.push(futureData.data._id);

      const isPass =
        pastRes.status === 400 &&
        futureRes.status === 201 &&
        futureData.data?.totalAmount === 0;

      recordResult(
        '2d. Consultation: past date returns 400; future date returns 201 with totalAmount 0',
        isPass,
        `past: ${pastRes.status}, future: ${futureRes.status}, totalAmount: ${futureData.data?.totalAmount}`
      );
    } catch (e) {
      recordResult(
        '2d. Consultation: past date returns 400; future date returns 201 with totalAmount 0',
        false,
        e.message
      );
    }

    // 2e. Buyer POST /api/bookings returns 403
    try {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const buyerBookingRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          type: 'consultation',
          scheduledAt: futureDate,
        }),
      });
      recordResult(
        '2e. Buyer POST /api/bookings returns 403',
        buyerBookingRes.status === 403,
        `status: ${buyerBookingRes.status}`
      );
    } catch (e) {
      recordResult('2e. Buyer POST /api/bookings returns 403', false, e.message);
    }

    // 2f. Admin transitions pending->confirmed->delivered work and confirmed->pending returns 409
    try {
      // Create new booking for transition testing
      const newBookRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          type: 'product',
          product: testProdId,
          quantity: 1,
        }),
      });
      const newBookData = await newBookRes.json();
      const bId = newBookData.data?._id;
      if (bId) tempIds.bookings.push(bId);

      // pending -> confirmed
      const toConfirmedRes = await fetch(`${baseUrl}/api/bookings/${bId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      // confirmed -> delivered
      const toDeliveredRes = await fetch(`${baseUrl}/api/bookings/${bId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'delivered' }),
      });

      // delivered -> pending (invalid transition)
      const invalidRes = await fetch(`${baseUrl}/api/bookings/${bId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'pending' }),
      });

      const isPass =
        toConfirmedRes.status === 200 &&
        toDeliveredRes.status === 200 &&
        invalidRes.status === 409;

      recordResult(
        '2f. Admin status transitions: pending->confirmed->delivered succeed, confirmed/delivered->pending returns 409',
        isPass,
        `confirmed: ${toConfirmedRes.status}, delivered: ${toDeliveredRes.status}, invalid: ${invalidRes.status}`
      );
    } catch (e) {
      recordResult(
        '2f. Admin status transitions: pending->confirmed->delivered succeed, confirmed/delivered->pending returns 409',
        false,
        e.message
      );
    }

    // 2g. Farmer B cannot cancel farmer A's booking (403 or 404)
    try {
      const bookRes = await fetch(`${baseUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          type: 'product',
          product: testProdId,
          quantity: 1,
        }),
      });
      const bookData = await bookRes.json();
      const aBookingId = bookData.data?._id;
      if (aBookingId) tempIds.bookings.push(aBookingId);

      const cancelRes = await fetch(`${baseUrl}/api/bookings/${aBookingId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${farmerBToken}` },
      });

      const isPass = cancelRes.status === 403 || cancelRes.status === 404;
      recordResult(
        '2g. Farmer B cannot cancel farmer A booking (403 or 404)',
        isPass,
        `status: ${cancelRes.status}`
      );
    } catch (e) {
      recordResult('2g. Farmer B cannot cancel farmer A booking (403 or 404)', false, e.message);
    }

    // 2h. Two simultaneous bookings for last unit of temporary product with stock 1: exactly one succeeds
    try {
      const singleStockProdRes = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: `Single Stock Product ${timestamp}`,
          category: 'equipment',
          price: 15000,
          stock: 1,
        }),
      });
      const singleStockData = await singleStockProdRes.json();
      const singleStockId = singleStockData.data?._id;
      if (singleStockId) tempIds.products.push(singleStockId);

      const [res1, res2] = await Promise.all([
        fetch(`${baseUrl}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${farmerAToken}`,
          },
          body: JSON.stringify({
            type: 'product',
            product: singleStockId,
            quantity: 1,
          }),
        }),
        fetch(`${baseUrl}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${farmerBToken}`,
          },
          body: JSON.stringify({
            type: 'product',
            product: singleStockId,
            quantity: 1,
          }),
        }),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      if (data1.data?._id) tempIds.bookings.push(data1.data._id);
      if (data2.data?._id) tempIds.bookings.push(data2.data._id);

      const statuses = [res1.status, res2.status];
      const has201 = statuses.filter((s) => s === 201).length === 1;
      const has409 = statuses.filter((s) => s === 409).length === 1;

      const finalProd = await Product.findById(singleStockId);

      const isPass = has201 && has409 && finalProd?.stock === 0;
      recordResult(
        '2h. Concurrency check: two simultaneous bookings for stock 1, exactly one succeeds (201) and one fails (409)',
        isPass,
        `res1: ${res1.status}, res2: ${res2.status}, finalStock: ${finalProd?.stock}`
      );
    } catch (e) {
      recordResult(
        '2h. Concurrency check: two simultaneous bookings for stock 1, exactly one succeeds (201) and one fails (409)',
        false,
        e.message
      );
    }

    // ==========================================
    // GROUP 3: Pest Tips API Checks
    // ==========================================

    // 3a. Demo farmer GET /api/pest-tips?farmId=<first demo farm> returns tips for Sweet potato and Cassava and includes disclaimer
    try {
      const demoFarm = await Farm.findOne({ name: 'Sweet Potato Plot' });
      if (!demoFarm) {
        throw new Error('Seed demo farm "Sweet Potato Plot" not found');
      }

      const pestRes = await fetch(`${baseUrl}/api/pest-tips?farmId=${demoFarm._id}`, {
        headers: { Authorization: `Bearer ${demoFarmerToken}` },
      });
      const pestData = await pestRes.json();

      const cropTips = pestData.data || [];
      const hasSweetPotato = cropTips.some((c) => c.cropName === 'Sweet potato');
      const hasCassava = cropTips.some((c) => c.cropName === 'Cassava');
      const hasDisclaimer =
        typeof pestData.disclaimer === 'string' &&
        pestData.disclaimer.includes('General guidance only');

      const isPass =
        pestRes.status === 200 && hasSweetPotato && hasCassava && hasDisclaimer;

      recordResult(
        '3a. Demo farmer GET /api/pest-tips for first demo farm returns Sweet potato, Cassava tips and disclaimer',
        isPass,
        `status: ${pestRes.status}, sweetPotato: ${hasSweetPotato}, cassava: ${hasCassava}, disclaimer: ${hasDisclaimer}`
      );
    } catch (e) {
      recordResult(
        '3a. Demo farmer GET /api/pest-tips for first demo farm returns Sweet potato, Cassava tips and disclaimer',
        false,
        e.message
      );
    }

    // 3b. Another farmer gets 403 accessing demo farmer's farm pest tips
    try {
      const demoFarm = await Farm.findOne({ name: 'Sweet Potato Plot' });
      const otherRes = await fetch(`${baseUrl}/api/pest-tips?farmId=${demoFarm._id}`, {
        headers: { Authorization: `Bearer ${farmerAToken}` },
      });

      recordResult(
        '3b. Other farmer GET /api/pest-tips for demo farm returns 403',
        otherRes.status === 403,
        `status: ${otherRes.status}`
      );
    } catch (e) {
      recordResult(
        '3b. Other farmer GET /api/pest-tips for demo farm returns 403',
        false,
        e.message
      );
    }

    console.log('\n========================================');
    console.log(
      `Commerce Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`
    );
    console.log('========================================\n');
  } catch (error) {
    console.error('Test execution fatal error:', error.message);
    failed++;
  } finally {
    try {
      // Clean up temporary bookings
      if (tempIds.bookings.length > 0) {
        await Booking.deleteMany({ _id: { $in: tempIds.bookings } });
      }
      // Clean up temporary products
      if (tempIds.products.length > 0) {
        await Product.deleteMany({ _id: { $in: tempIds.products } });
      }
      // Clean up temporary users
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
