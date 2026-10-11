import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Crop from '../models/Crop.js';
import Farm from '../models/Farm.js';
import Planting from '../models/Planting.js';

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
    crops: [],
    farms: [],
    plantings: [],
    users: [],
  };

  try {
    await connectDB();

    server = app.listen(0);
    await new Promise((resolve) => server.on('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    console.log(`\n--- Running Crops, Farms, and Plantings Tests on ${baseUrl} ---\n`);

    // 1. Log in users
    // Admin login
    const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    });
    const adminData = await adminRes.json();
    const adminToken = adminData.data?.token;

    // Demo Farmer login
    const farmerRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'farmer@icagria.test',
        password: process.env.DEMO_PASSWORD,
      }),
    });
    const farmerData = await farmerRes.json();
    const farmerToken = farmerData.data?.token;
    const farmerUser = farmerData.data?.user;

    // Demo Buyer login
    const buyerRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'buyer@icagria.test',
        password: process.env.DEMO_PASSWORD,
      }),
    });
    const buyerData = await buyerRes.json();
    const buyerToken = buyerData.data?.token;

    // Register temporary second farmer
    const timestamp = Date.now();
    const secondFarmerEmail = `test_farm_second_${timestamp}@example.com`;
    const secondFarmerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Farmer',
        email: secondFarmerEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'farmer',
      }),
    });
    const secondFarmerData = await secondFarmerRes.json();
    const secondFarmerToken = secondFarmerData.data?.token;
    if (secondFarmerData.data?.user?._id) {
      tempIds.users.push(secondFarmerData.data.user._id);
    }

    // CHECK GROUP 1: Crops Public Reads
    let seededCrops = [];
    try {
      const res = await fetch(`${baseUrl}/api/crops`);
      const data = await res.json();
      seededCrops = data.data || [];
      const isPass = res.status === 200 && Array.isArray(data.data) && data.data.length === 6;
      recordResult('1a. GET /api/crops (no token) returns 6 crops', isPass, `count: ${seededCrops.length}`);
    } catch (e) {
      recordResult('1a. GET /api/crops (no token) returns 6 crops', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/crops?type=legume`);
      const data = await res.json();
      const isPass = res.status === 200 && Array.isArray(data.data) && data.data.length === 3;
      recordResult('1b. GET /api/crops?type=legume returns 3 crops', isPass, `count: ${data.data?.length}`);
    } catch (e) {
      recordResult('1b. GET /api/crops?type=legume returns 3 crops', false, e.message);
    }

    try {
      const firstCrop = seededCrops[0];
      const res = await fetch(`${baseUrl}/api/crops/${firstCrop._id}`);
      const data = await res.json();
      const isPass = res.status === 200 && data.data?._id === firstCrop._id;
      recordResult('1c. GET /api/crops/:id works', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('1c. GET /api/crops/:id works', false, e.message);
    }

    // CHECK GROUP 2: Crop Writes & Permissions
    try {
      const res = await fetch(`${baseUrl}/api/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          name: 'Forbidden Farmer Crop',
          type: 'tuber',
          phMin: 5.5,
          phMax: 6.5,
        }),
      });
      const isPass = res.status === 403;
      recordResult('2a. POST /api/crops as farmer returns 403', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('2a. POST /api/crops as farmer returns 403', false, e.message);
    }

    let tempCropId = null;
    try {
      // Create temp crop as admin
      const createRes = await fetch(`${baseUrl}/api/crops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: `Temp Test Crop ${timestamp}`,
          type: 'tuber',
          phMin: 5.5,
          phMax: 6.5,
          growthDays: 100,
        }),
      });
      const createData = await createRes.json();
      tempCropId = createData.data?._id;
      if (tempCropId) tempIds.crops.push(tempCropId);

      // Update temp crop as admin
      const updateRes = await fetch(`${baseUrl}/api/crops/${tempCropId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          scientificName: 'Temp scientific',
        }),
      });

      // Delete temp crop as admin
      const deleteRes = await fetch(`${baseUrl}/api/crops/${tempCropId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const isPass =
        createRes.status === 201 &&
        updateRes.status === 200 &&
        deleteRes.status === 200;

      recordResult(
        '2b. POST, PUT, DELETE /api/crops as admin creates, updates, and deletes temporary crop',
        isPass,
        `create: ${createRes.status}, update: ${updateRes.status}, delete: ${deleteRes.status}`
      );
    } catch (e) {
      recordResult(
        '2b. POST, PUT, DELETE /api/crops as admin creates, updates, and deletes temporary crop',
        false,
        e.message
      );
    }

    // CHECK GROUP 3: Demo Farmer Farms & Validation
    let demoFarmsList = [];
    try {
      const res = await fetch(`${baseUrl}/api/farms`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      demoFarmsList = data.data || [];
      const isPass =
        res.status === 200 &&
        demoFarmsList.length === 2 &&
        !!demoFarmsList[0].mainCrop &&
        typeof demoFarmsList[0].mainCrop.name === 'string';
      recordResult(
        '3a. Demo farmer GET /api/farms returns 2 demo farms with mainCrop populated',
        isPass,
        `count: ${demoFarmsList.length}`
      );
    } catch (e) {
      recordResult(
        '3a. Demo farmer GET /api/farms returns 2 demo farms with mainCrop populated',
        false,
        e.message
      );
    }

    let tempFarmId = null;
    try {
      const res = await fetch(`${baseUrl}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          name: `Test Farm ${timestamp}`,
          location: { text: 'Subang, West Java', lat: -6.5, lng: 107.5 },
          areaSize: 4,
        }),
      });
      const data = await res.json();
      tempFarmId = data.data?._id;
      if (tempFarmId) tempIds.farms.push(tempFarmId);

      const isPass =
        res.status === 201 &&
        data.data?.owner === farmerUser._id &&
        data.data?.name === `Test Farm ${timestamp}`;
      recordResult(
        '3b. Creating a farm returns 201 and owner equals the user',
        isPass,
        `status: ${res.status}, owner: ${data.data?.owner}`
      );
    } catch (e) {
      recordResult('3b. Creating a farm returns 201 and owner equals the user', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/farms/${tempFarmId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          name: `Updated Test Farm ${timestamp}`,
        }),
      });
      const data = await res.json();
      const isPass = res.status === 200 && data.data?.name === `Updated Test Farm ${timestamp}`;
      recordResult('3c. Updating a farm works', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('3c. Updating a farm works', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          name: 'Zero Area Farm',
          location: { text: 'Location' },
          areaSize: 0,
        }),
      });
      const isPass = res.status === 400;
      recordResult('3d. Creating a farm with areaSize 0 returns 400', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('3d. Creating a farm with areaSize 0 returns 400', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          name: 'Invalid Lat Farm',
          location: { text: 'Location', lat: 150 },
          areaSize: 1,
        }),
      });
      const isPass = res.status === 400;
      recordResult('3e. Creating a farm with invalid lat returns 400', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('3e. Creating a farm with invalid lat returns 400', false, e.message);
    }

    // CHECK GROUP 4: Farms RBAC
    const firstDemoFarmId = demoFarmsList[0]?._id;
    try {
      const getRes = await fetch(`${baseUrl}/api/farms/${firstDemoFarmId}`, {
        headers: { Authorization: `Bearer ${secondFarmerToken}` },
      });
      const putRes = await fetch(`${baseUrl}/api/farms/${firstDemoFarmId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondFarmerToken}`,
        },
        body: JSON.stringify({ name: 'Hacked Name' }),
      });
      const delRes = await fetch(`${baseUrl}/api/farms/${firstDemoFarmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secondFarmerToken}` },
      });

      const isPass = getRes.status === 403 && putRes.status === 403 && delRes.status === 403;
      recordResult(
        "4a. Second farmer GET, PUT, and DELETE on demo farmer's farm each return 403",
        isPass,
        `GET: ${getRes.status}, PUT: ${putRes.status}, DELETE: ${delRes.status}`
      );
    } catch (e) {
      recordResult(
        "4a. Second farmer GET, PUT, and DELETE on demo farmer's farm each return 403",
        false,
        e.message
      );
    }

    try {
      const res = await fetch(`${baseUrl}/api/farms`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const isPass = res.status === 403;
      recordResult('4b. Buyer GET /api/farms returns 403', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('4b. Buyer GET /api/farms returns 403', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/farms`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const isPass =
        res.status === 200 &&
        Array.isArray(data.data) &&
        data.data.length >= 2 &&
        !!data.data[0].owner?.email;
      recordResult(
        '4c. Admin GET /api/farms sees all farms with owner populated',
        isPass,
        `status: ${res.status}`
      );
    } catch (e) {
      recordResult('4c. Admin GET /api/farms sees all farms with owner populated', false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/farms/${firstDemoFarmId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: 'Admin Attempt' }),
      });
      const isPass = res.status === 403;
      recordResult('4d. Admin PUT on a farm returns 403', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('4d. Admin PUT on a farm returns 403', false, e.message);
    }

    // CHECK GROUP 5: Plantings API
    const sweetPotatoCrop = seededCrops.find((c) => c.name === 'Sweet potato');
    let tempPlantingId = null;

    try {
      const plantDateStr = '2026-05-01';
      const plantRes = await fetch(`${baseUrl}/api/plantings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          farm: tempFarmId,
          crop: sweetPotatoCrop._id,
          variety: 'Local Beta',
          plantedDate: plantDateStr,
        }),
      });
      const plantData = await plantRes.json();
      tempPlantingId = plantData.data?._id;
      if (tempPlantingId) tempIds.plantings.push(tempPlantingId);

      const expectedHarvest = new Date(plantData.data?.expectedHarvestDate);
      const expectedDayCount = Math.round(
        (expectedHarvest - new Date(plantDateStr)) / (1000 * 60 * 60 * 24)
      );

      const isPass =
        plantRes.status === 201 &&
        expectedDayCount === (sweetPotatoCrop.growthDays || 120);

      recordResult(
        '5a. Planting with plantedDate and no expectedHarvestDate computes expectedHarvestDate correctly',
        isPass,
        `days calculated: ${expectedDayCount}`
      );
    } catch (e) {
      recordResult(
        '5a. Planting with plantedDate and no expectedHarvestDate computes expectedHarvestDate correctly',
        false,
        e.message
      );
    }

    try {
      const res = await fetch(`${baseUrl}/api/plantings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondFarmerToken}`,
        },
        body: JSON.stringify({
          farm: tempFarmId,
          crop: sweetPotatoCrop._id,
        }),
      });
      const isPass = res.status === 403;
      recordResult("5b. Planting on another farmer's farm returns 403", isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult("5b. Planting on another farmer's farm returns 403", false, e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/plantings?farmId=${tempFarmId}`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      const isPass =
        res.status === 200 &&
        Array.isArray(data.data) &&
        data.data.every((p) => p.farm?._id === tempFarmId || p.farm === tempFarmId);
      recordResult('5c. ?farmId= filter on GET /api/plantings works', isPass, `count: ${data.data?.length}`);
    } catch (e) {
      recordResult('5c. ?farmId= filter on GET /api/plantings works', false, e.message);
    }

    try {
      const putRes = await fetch(`${baseUrl}/api/plantings/${tempPlantingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          variety: 'Updated Variety',
          quantity: 200,
        }),
      });
      const putData = await putRes.json();

      const delRes = await fetch(`${baseUrl}/api/plantings/${tempPlantingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      const isPass =
        putRes.status === 200 &&
        putData.data?.variety === 'Updated Variety' &&
        delRes.status === 200;

      recordResult(
        '5d. Updating and deleting plantings work',
        isPass,
        `PUT: ${putRes.status}, DELETE: ${delRes.status}`
      );
    } catch (e) {
      recordResult('5d. Updating and deleting plantings work', false, e.message);
    }

    // CHECK GROUP 6: Cascading Delete
    try {
      // 1. Create a farm
      const cfRes = await fetch(`${baseUrl}/api/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          name: `Cascade Farm ${timestamp}`,
          location: { text: 'Cascade Location' },
          areaSize: 1,
        }),
      });
      const cfData = await cfRes.json();
      const cascadeFarmId = cfData.data?._id;

      // 2. Create planting on it
      const cpRes = await fetch(`${baseUrl}/api/plantings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          farm: cascadeFarmId,
          crop: sweetPotatoCrop._id,
        }),
      });
      const cpData = await cpRes.json();
      const cascadePlantingId = cpData.data?._id;

      // 3. Delete farm
      const dfRes = await fetch(`${baseUrl}/api/farms/${cascadeFarmId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      // 4. Verify planting is removed
      const checkPRes = await fetch(`${baseUrl}/api/plantings/${cascadePlantingId}`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      const isPass =
        cfRes.status === 201 &&
        cpRes.status === 201 &&
        dfRes.status === 200 &&
        checkPRes.status === 404;

      recordResult(
        '6. Deleting a farm also removes its plantings',
        isPass,
        `DELETE farm: ${dfRes.status}, GET deleted planting: ${checkPRes.status}`
      );
    } catch (e) {
      recordResult('6. Deleting a farm also removes its plantings', false, e.message);
    }

    // CHECK GROUP 7: Crop Delete Conflict when referenced by plantings
    try {
      const res = await fetch(`${baseUrl}/api/crops/${sweetPotatoCrop._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const isPass = res.status === 409 && data.success === false;
      recordResult(
        '7. Admin DELETE of seeded Sweet potato crop returns 409 because plantings reference it',
        isPass,
        `status: ${res.status}`
      );
    } catch (e) {
      recordResult(
        '7. Admin DELETE of seeded Sweet potato crop returns 409 because plantings reference it',
        false,
        e.message
      );
    }

    // CHECK GROUP 8: Admin GET /api/users
    try {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const users = data.data || [];
      const hasAdmin = users.some((u) => u.email === process.env.ADMIN_EMAIL.toLowerCase().trim());
      const hasFarmer = users.some((u) => u.email === 'farmer@icagria.test');
      const hasBuyer = users.some((u) => u.email === 'buyer@icagria.test');

      const isPass = res.status === 200 && hasAdmin && hasFarmer && hasBuyer;
      recordResult(
        '8. Admin GET /api/users returns 200 and contains the admin and demo users',
        isPass,
        `status: ${res.status}, users count: ${users.length}`
      );
    } catch (e) {
      recordResult(
        '8. Admin GET /api/users returns 200 and contains the admin and demo users',
        false,
        e.message
      );
    }

    console.log('\n========================================');
    console.log(`Farms Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Test execution fatal error:', error.message);
    failed++;
  } finally {
    try {
      // Cleanup temporary second farmer
      if (tempIds.users.length > 0) {
        await User.deleteMany({ _id: { $in: tempIds.users } });
      }
      // Cleanup temporary crops, farms, and plantings
      if (tempIds.crops.length > 0) {
        await Crop.deleteMany({ _id: { $in: tempIds.crops } });
      }
      if (tempIds.farms.length > 0) {
        await Planting.deleteMany({ farm: { $in: tempIds.farms } });
        await Farm.deleteMany({ _id: { $in: tempIds.farms } });
      }
      if (tempIds.plantings.length > 0) {
        await Planting.deleteMany({ _id: { $in: tempIds.plantings } });
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
