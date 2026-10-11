import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Inquiry from '../models/Inquiry.js';

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
    listings: [],
    inquiries: [],
  };

  const listingHasContactLeak = (listingsPayload) => {
    const str = JSON.stringify(listingsPayload);
    if (/"email"\s*:/.test(str)) return true;
    if (/"phone"\s*:/.test(str)) return true;
    return false;
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

    console.log(`\n--- Running Listings & Inquiries Tests on ${baseUrl} ---\n`);

    const timestamp = Date.now();
    const tempPassword = 'Password123!';

    const farmerA = await registerUser(baseUrl, {
      name: 'Temp Farmer A',
      email: `test_list_farmer_a_${timestamp}@example.com`,
      password: tempPassword,
      role: 'farmer',
    });
    const farmerB = await registerUser(baseUrl, {
      name: 'Temp Farmer B',
      email: `test_list_farmer_b_${timestamp}@example.com`,
      password: tempPassword,
      role: 'farmer',
    });
    const buyer = await registerUser(baseUrl, {
      name: 'Temp Buyer',
      email: `test_list_buyer_${timestamp}@example.com`,
      password: tempPassword,
      role: 'buyer',
    });

    const farmerAToken = farmerA.token;
    const farmerBToken = farmerB.token;
    const buyerToken = buyer.token;
    const farmerAId = farmerA.data.data?.user?._id;

    const demoBuyerRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'buyer@icagria.test',
        password: process.env.DEMO_PASSWORD,
      }),
    });
    const demoBuyerData = await demoBuyerRes.json();
    const demoBuyerToken = demoBuyerData.data?.token;

    let tempListingId = null;

    // GROUP 1: Listings create & read
    try {
      const createRes = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          cropName: `Searchable Yam ${timestamp}`,
          quantity: 40,
          unit: 'kg',
          pricePerUnit: 5000,
          location: 'Test Location',
        }),
      });
      const createData = await createRes.json();
      tempListingId = createData.data?._id;
      if (tempListingId) tempIds.listings.push(tempListingId);

      const sellerId = createData.data?.seller?._id || createData.data?.seller;
      const isPass =
        createRes.status === 201 && String(sellerId) === String(farmerAId);
      recordResult('1a. Farmer A creates listing (201, seller equals A)', isPass, `status: ${createRes.status}`);
    } catch (e) {
      recordResult('1a. Farmer A creates listing (201, seller equals A)', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          cropName: 'Buyer Crop',
          quantity: 10,
          pricePerUnit: 1000,
        }),
      });
      recordResult('1b. Buyer POST /api/listings returns 403', res.status === 403, `status: ${res.status}`);
    } catch (e) {
      recordResult('1b. Buyer POST /api/listings returns 403', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          cropName: 'Zero Qty',
          quantity: 0,
          pricePerUnit: 1000,
        }),
      });
      recordResult('1c. quantity 0 returns 400', res.status === 400, `status: ${res.status}`);
    } catch (e) {
      recordResult('1c. quantity 0 returns 400', false, e.message);
    }

    try {
      const listRes = await fetch(`${baseUrl}/api/listings?search=Searchable%20Yam`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const listData = await listRes.json();
      const listings = listData.data?.listings || [];
      const found = listings.some((l) => l._id === tempListingId);

      const sortRes = await fetch(`${baseUrl}/api/listings?sort=price_asc&limit=50`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const sortData = await sortRes.json();
      const sorted = sortData.data?.listings || [];
      let sortOk = sorted.length >= 2;
      if (sortOk) {
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].pricePerUnit < sorted[i - 1].pricePerUnit) {
            sortOk = false;
            break;
          }
        }
      }

      const noLeak = !listingHasContactLeak(listData.data) && !listingHasContactLeak(sortData.data);

      const isPass = listRes.status === 200 && found && sortRes.status === 200 && sortOk && noLeak;
      recordResult(
        '1d. Buyer GET listings: search finds listing, price_asc works, no phone/email',
        isPass,
        `found: ${found}, sortOk: ${sortOk}, noLeak: ${noLeak}`
      );
    } catch (e) {
      recordResult('1d. Buyer GET listings: search finds listing, price_asc works, no phone/email', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/listings/${tempListingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerBToken}`,
        },
        body: JSON.stringify({ quantity: 99 }),
      });
      recordResult('1e. Farmer B PUT listing returns 403', res.status === 403, `status: ${res.status}`);
    } catch (e) {
      recordResult('1e. Farmer B PUT listing returns 403', false, e.message);
    }

    // GROUP 2: Inquiries
    let inquiryId = null;

    try {
      const res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          listing: tempListingId,
          quantity: 10,
          message: 'Interested',
        }),
      });
      const data = await res.json();
      inquiryId = data.data?._id;
      if (inquiryId) tempIds.inquiries.push(inquiryId);
      recordResult('2a. Buyer creates inquiry (201)', res.status === 201, `status: ${res.status}`);
    } catch (e) {
      recordResult('2a. Buyer creates inquiry (201)', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ listing: tempListingId }),
      });
      recordResult('2b. Duplicate pending inquiry returns 409', res.status === 409, `status: ${res.status}`);
    } catch (e) {
      recordResult('2b. Duplicate pending inquiry returns 409', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ listing: tempListingId, quantity: 999 }),
      });
      recordResult('2c. quantity above listing returns 400', res.status === 400, `status: ${res.status}`);
    } catch (e) {
      recordResult('2c. quantity above listing returns 400', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({ listing: tempListingId }),
      });
      recordResult('2d. Farmer POST /api/inquiries returns 403', res.status === 403, `status: ${res.status}`);
    } catch (e) {
      recordResult('2d. Farmer POST /api/inquiries returns 403', false, e.message);
    }

    try {
      const aRes = await fetch(`${baseUrl}/api/inquiries`, {
        headers: { Authorization: `Bearer ${farmerAToken}` },
      });
      const aData = await aRes.json();
      const aHas = (aData.data || []).some((i) => i._id === inquiryId);

      const bRes = await fetch(`${baseUrl}/api/inquiries`, {
        headers: { Authorization: `Bearer ${farmerBToken}` },
      });
      const bData = await bRes.json();
      const bHas = (bData.data || []).some((i) => i._id === inquiryId);

      recordResult(
        '2e. Farmer A sees inquiry; farmer B does not',
        aRes.status === 200 && aHas && bRes.status === 200 && !bHas,
        `A has: ${aHas}, B has: ${bHas}`
      );
    } catch (e) {
      recordResult('2e. Farmer A sees inquiry; farmer B does not', false, e.message);
    }

    // GROUP 3: Phone visibility & accept
    const testPhone = '+6281234567890';

    try {
      await fetch(`${baseUrl}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({ phone: testPhone }),
      });

      const pendingRes = await fetch(`${baseUrl}/api/inquiries`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const pendingData = await pendingRes.json();
      const pendingInquiry = (pendingData.data || []).find((i) => i._id === inquiryId);
      const pendingPhone = pendingInquiry?.seller?.phone;

      const acceptRes = await fetch(`${baseUrl}/api/inquiries/${inquiryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({ status: 'accepted' }),
      });
      const acceptData = await acceptRes.json();

      const listingRes = await fetch(`${baseUrl}/api/listings/${tempListingId}`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const listingData = await listingRes.json();

      const acceptedRes = await fetch(`${baseUrl}/api/inquiries`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const acceptedData = await acceptedRes.json();
      const acceptedInquiry = (acceptedData.data || []).find((i) => i._id === inquiryId);
      const acceptedPhone = acceptedInquiry?.seller?.phone;

      const isPass =
        pendingPhone === undefined &&
        acceptRes.status === 200 &&
        listingData.data?.status === 'reserved' &&
        acceptedPhone === testPhone;

      recordResult(
        '3. Phone hidden while pending; accept reserves listing; phone visible after accept',
        isPass,
        `pendingPhone: ${pendingPhone}, listing: ${listingData.data?.status}, acceptedPhone: ${acceptedPhone}`
      );
    } catch (e) {
      recordResult(
        '3. Phone hidden while pending; accept reserves listing; phone visible after accept',
        false,
        e.message
      );
    }

    // GROUP 4: Sold, edit sold, delete rules
    let soldListingId = null;
    let pendingInq1 = null;
    let pendingInq2 = null;

    try {
      const deleteListingRes = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          cropName: `Delete Inquiry Crop ${timestamp}`,
          quantity: 15,
          pricePerUnit: 6000,
        }),
      });
      const deleteListingData = await deleteListingRes.json();
      const deleteListingId = deleteListingData.data?._id;
      if (deleteListingId) tempIds.listings.push(deleteListingId);

      const deleteInqRes = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ listing: deleteListingId, quantity: 2 }),
      });
      const deleteInqData = await deleteInqRes.json();
      const deleteInqId = deleteInqData.data?._id;

      const delPendingRes = await fetch(`${baseUrl}/api/inquiries/${deleteInqId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      const delAcceptedRes = await fetch(`${baseUrl}/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      const buyer2 = await registerUser(baseUrl, {
        name: 'Temp Buyer 2',
        email: `test_list_buyer2_${timestamp}@example.com`,
        password: tempPassword,
        role: 'buyer',
      });

      const createListingRes = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({
          cropName: `Sold Test Crop ${timestamp}`,
          quantity: 20,
          pricePerUnit: 7000,
        }),
      });
      const createListingData = await createListingRes.json();
      soldListingId = createListingData.data?._id;
      if (soldListingId) tempIds.listings.push(soldListingId);

      const inq1Res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({ listing: soldListingId, quantity: 5 }),
      });
      const inq1Data = await inq1Res.json();
      pendingInq1 = inq1Data.data?._id;
      if (pendingInq1) tempIds.inquiries.push(pendingInq1);

      const inq2Res = await fetch(`${baseUrl}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyer2.token}`,
        },
        body: JSON.stringify({ listing: soldListingId, quantity: 3 }),
      });
      const inq2Data = await inq2Res.json();
      pendingInq2 = inq2Data.data?._id;
      if (pendingInq2) tempIds.inquiries.push(pendingInq2);

      await fetch(`${baseUrl}/api/listings/${soldListingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({ status: 'sold' }),
      });

      const inqCheck1 = await Inquiry.findById(pendingInq1);
      const inqCheck2 = await Inquiry.findById(pendingInq2);

      const soldEditRes = await fetch(`${baseUrl}/api/listings/${soldListingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerAToken}`,
        },
        body: JSON.stringify({ description: 'Should fail' }),
      });

      const isPass =
        inqCheck1?.status === 'rejected' &&
        inqCheck2?.status === 'rejected' &&
        soldEditRes.status === 409 &&
        delPendingRes.status === 200 &&
        delAcceptedRes.status === 403;

      recordResult(
        '4. Sold rejects pending inquiries; edit sold 409; delete pending ok, accepted forbidden',
        isPass,
        `inq1: ${inqCheck1?.status}, inq2: ${inqCheck2?.status}, edit: ${soldEditRes.status}, delP: ${delPendingRes.status}, delA: ${delAcceptedRes.status}`
      );
    } catch (e) {
      recordResult(
        '4. Sold rejects pending inquiries; edit sold 409; delete pending ok, accepted forbidden',
        false,
        e.message
      );
    }

    // GROUP 5: Seeded listings
    try {
      const res = await fetch(`${baseUrl}/api/listings`, {
        headers: { Authorization: `Bearer ${demoBuyerToken}` },
      });
      const data = await res.json();
      const listings = data.data?.listings || [];
      const hasSweet = listings.some((l) => l.cropName === 'Sweet Potato');
      const hasPeanut = listings.some((l) => l.cropName === 'Peanut');

      recordResult(
        '5. Demo buyer GET /api/listings (default status) includes 2 seeded listings',
        res.status === 200 && hasSweet && hasPeanut,
        `count: ${listings.length}, sweet: ${hasSweet}, peanut: ${hasPeanut}`
      );
    } catch (e) {
      recordResult(
        '5. Demo buyer GET /api/listings (default status) includes 2 seeded listings',
        false,
        e.message
      );
    }

    console.log('\n========================================');
    console.log(
      `Listings Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`
    );
    console.log('========================================\n');
  } catch (error) {
    console.error('Test execution fatal error:', error.message);
    failed++;
  } finally {
    try {
      if (tempIds.inquiries.length > 0) {
        await Inquiry.deleteMany({ _id: { $in: tempIds.inquiries } });
      }
      if (tempIds.listings.length > 0) {
        await Inquiry.deleteMany({ listing: { $in: tempIds.listings } });
        await Listing.deleteMany({ _id: { $in: tempIds.listings } });
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
