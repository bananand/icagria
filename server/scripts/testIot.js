import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Farm from '../models/Farm.js';
import Device from '../models/Device.js';
import PhReading from '../models/PhReading.js';
import Alert from '../models/Alert.js';

const runTests = async () => {
  let server;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  const recordResult = (description, status, detail = '') => {
    if (status === 'PASS') {
      passed++;
      console.log(`  [PASS] ${description}`);
    } else if (status === 'SKIP') {
      skipped++;
      console.log(`  [SKIP] ${description} ${detail ? `- ${detail}` : ''}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${description} ${detail ? `- ${detail}` : ''}`);
    }
  };

  const createdIds = {
    devices: [],
    readings: [],
    alerts: [],
    users: [],
  };

  try {
    await connectDB();

    const initialReadingCount = await PhReading.countDocuments();
    const initialAlertCount = await Alert.countDocuments();

    server = app.listen(0);
    await new Promise((resolve) => server.on('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    console.log(`\n--- Running IoT & Weather Tests on ${baseUrl} ---\n`);

    // Logins
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

    // Register second farmer
    const timestamp = Date.now();
    const secondFarmerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Farmer',
        email: `test_iot_farmer_${timestamp}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'farmer',
      }),
    });
    const secondFarmerData = await secondFarmerRes.json();
    const secondFarmerToken = secondFarmerData.data?.token;
    if (secondFarmerData.data?.user?._id) {
      createdIds.users.push(secondFarmerData.data.user._id);
    }

    // Get demo farm
    const farmsRes = await fetch(`${baseUrl}/api/farms`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const farmsData = await farmsRes.json();
    const demoFarm1 = farmsData.data?.[0];
    const farm1Id = demoFarm1?._id;

    // CHECK GROUP 1: Demo farmer devices & historical readings
    try {
      const res = await fetch(`${baseUrl}/api/devices`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      const devices = data.data || [];
      const isPass =
        res.status === 200 &&
        devices.length === 2 &&
        devices.every((d) => d.apiKey === undefined);
      recordResult(
        '1a. Demo farmer GET /api/devices returns 2 devices without apiKey',
        isPass ? 'PASS' : 'FAIL',
        `count: ${devices.length}`
      );
    } catch (e) {
      recordResult('1a. Demo farmer GET /api/devices returns 2 devices without apiKey', 'FAIL', e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/readings?farmId=${farm1Id}&days=30`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      const readings = data.data?.readings || [];
      let isAscending = true;
      for (let i = 1; i < readings.length; i++) {
        if (new Date(readings[i].recordedAt) < new Date(readings[i - 1].recordedAt)) {
          isAscending = false;
          break;
        }
      }
      const isPass =
        res.status === 200 &&
        readings.length === 60 &&
        isAscending &&
        readings.every((r) => r.status !== undefined);
      recordResult(
        '1b. GET /api/readings?farmId=<farm1>&days=30 returns 60 readings in ascending order with status',
        isPass ? 'PASS' : 'FAIL',
        `count: ${readings.length}`
      );
    } catch (e) {
      recordResult(
        '1b. GET /api/readings?farmId=<farm1>&days=30 returns 60 readings in ascending order with status',
        'FAIL',
        e.message
      );
    }

    try {
      const res = await fetch(`${baseUrl}/api/readings/latest?farmId=${farm1Id}`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      const isPass =
        res.status === 200 &&
        data.data?.reading !== null &&
        data.data?.evaluation?.status !== undefined &&
        Array.isArray(data.data?.cropStatuses);
      recordResult(
        '1c. GET /api/readings/latest returns an evaluation with a valid status',
        isPass ? 'PASS' : 'FAIL',
        `status: ${data.data?.evaluation?.status}`
      );
    } catch (e) {
      recordResult('1c. GET /api/readings/latest returns an evaluation with a valid status', 'FAIL', e.message);
    }

    try {
      const res = await fetch(`${baseUrl}/api/readings/summary?farmId=${farm1Id}&days=30`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      const isPass =
        res.status === 200 &&
        data.data?.count === 60 &&
        Array.isArray(data.data?.daily) &&
        data.data.daily.length > 0;
      recordResult(
        '1d. GET /api/readings/summary?days=30 returns count 60 and a non-empty daily array',
        isPass ? 'PASS' : 'FAIL',
        `count: ${data.data?.count}, daily days: ${data.data?.daily?.length}`
      );
    } catch (e) {
      recordResult(
        '1d. GET /api/readings/summary?days=30 returns count 60 and a non-empty daily array',
        'FAIL',
        e.message
      );
    }

    // CHECK GROUP 2: Simulation & Alerts
    const farmerDevicesRes = await fetch(`${baseUrl}/api/devices?farmId=${farm1Id}`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    const farmerDevicesData = await farmerDevicesRes.json();
    const demoDevice1 = farmerDevicesData.data?.[0];

    let createdAlertIds = [];

    try {
      const autoRes = await fetch(`${baseUrl}/api/readings/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ deviceId: demoDevice1._id, mode: 'auto' }),
      });
      const autoData = await autoRes.json();
      if (autoData.data?.reading?._id) createdIds.readings.push(autoData.data.reading._id);
      if (autoData.data?.alert?._id) createdIds.alerts.push(autoData.data.alert._id);

      const val = autoData.data?.reading?.value;
      const isPass = autoRes.status === 201 && typeof val === 'number' && val >= 0 && val <= 14;
      recordResult(
        '2a. POST /api/readings/simulate mode auto returns 201 and value between 0 and 14',
        isPass ? 'PASS' : 'FAIL',
        `value: ${val}`
      );
    } catch (e) {
      recordResult(
        '2a. POST /api/readings/simulate mode auto returns 201 and value between 0 and 14',
        'FAIL',
        e.message
      );
    }

    try {
      const lowRes = await fetch(`${baseUrl}/api/readings/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ deviceId: demoDevice1._id, mode: 'low' }),
      });
      const lowData = await lowRes.json();
      if (lowData.data?.reading?._id) createdIds.readings.push(lowData.data.reading._id);
      if (lowData.data?.alert?._id) {
        createdIds.alerts.push(lowData.data.alert._id);
        createdAlertIds.push(lowData.data.alert._id);
      }

      const isPass =
        lowRes.status === 201 &&
        lowData.data?.evaluation?.status === 'too_acidic' &&
        lowData.data?.alert !== null;
      recordResult(
        '2b. POST /api/readings/simulate mode low returns status too_acidic and a non-null alert',
        isPass ? 'PASS' : 'FAIL',
        `status: ${lowData.data?.evaluation?.status}`
      );
    } catch (e) {
      recordResult(
        '2b. POST /api/readings/simulate mode low returns status too_acidic and a non-null alert',
        'FAIL',
        e.message
      );
    }

    try {
      const highRes = await fetch(`${baseUrl}/api/readings/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ deviceId: demoDevice1._id, mode: 'high' }),
      });
      const highData = await highRes.json();
      if (highData.data?.reading?._id) createdIds.readings.push(highData.data.reading._id);
      if (highData.data?.alert?._id) {
        createdIds.alerts.push(highData.data.alert._id);
        createdAlertIds.push(highData.data.alert._id);
      }

      const isPass =
        highRes.status === 201 &&
        highData.data?.evaluation?.status === 'too_alkaline' &&
        highData.data?.alert !== null;
      recordResult(
        '2c. POST /api/readings/simulate mode high returns status too_alkaline and a non-null alert',
        isPass ? 'PASS' : 'FAIL',
        `status: ${highData.data?.evaluation?.status}`
      );
    } catch (e) {
      recordResult(
        '2c. POST /api/readings/simulate mode high returns status too_alkaline and a non-null alert',
        'FAIL',
        e.message
      );
    }

    try {
      const alertsRes = await fetch(`${baseUrl}/api/alerts?unread=true`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const alertsData = await alertsRes.json();

      const countRes = await fetch(`${baseUrl}/api/alerts/unread-count`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const countData = await countRes.json();

      const isPass =
        alertsRes.status === 200 &&
        alertsData.data?.length >= 2 &&
        countData.data?.count === alertsData.data?.length;

      recordResult(
        '2d. GET /api/alerts?unread=true contains alerts and unread-count matches',
        isPass ? 'PASS' : 'FAIL',
        `count: ${countData.data?.count}`
      );
    } catch (e) {
      recordResult(
        '2d. GET /api/alerts?unread=true contains alerts and unread-count matches',
        'FAIL',
        e.message
      );
    }

    try {
      const targetAlertId = createdAlertIds[0];
      const readOneRes = await fetch(`${baseUrl}/api/alerts/${targetAlertId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const readOneData = await readOneRes.json();

      const readAllRes = await fetch(`${baseUrl}/api/alerts/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      const delRes = await fetch(`${baseUrl}/api/alerts/${targetAlertId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      const isPass =
        readOneRes.status === 200 &&
        readOneData.data?.isRead === true &&
        readAllRes.status === 200 &&
        delRes.status === 200;

      recordResult(
        '2e. PUT /read marks one read, PUT /read-all works, and DELETE removes an alert',
        isPass ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      recordResult(
        '2e. PUT /read marks one read, PUT /read-all works, and DELETE removes an alert',
        'FAIL',
        e.message
      );
    }

    // CHECK GROUP 3: Hardware Ingestion Flow
    let hwDevice;
    let hwApiKey;

    try {
      const regRes = await fetch(`${baseUrl}/api/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          farm: farm1Id,
          name: `Hardware ESP32 ${timestamp}`,
          source: 'hardware',
        }),
      });
      const regData = await regRes.json();
      hwDevice = regData.data;
      hwApiKey = regData.data?.apiKey;
      if (hwDevice?._id) createdIds.devices.push(hwDevice._id);

      const isPass = regRes.status === 201 && typeof hwApiKey === 'string' && hwApiKey.length === 32;
      recordResult(
        '3a. Create device with source hardware returns 201 and 32-character apiKey',
        isPass ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      recordResult('3a. Create device with source hardware returns 201 and 32-character apiKey', 'FAIL', e.message);
    }

    try {
      const postRes = await fetch(`${baseUrl}/api/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': hwApiKey,
        },
        body: JSON.stringify({ value: 6.2 }),
      });
      const postData = await postRes.json();
      if (postData.data?.reading?._id) createdIds.readings.push(postData.data.reading._id);

      const isPass =
        postRes.status === 201 &&
        postData.data?.reading?.value === 6.2 &&
        postData.data?.reading?.source === 'device';

      recordResult(
        '3b. POST /api/readings with x-device-key header returns 201 and source device',
        isPass ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      recordResult(
        '3b. POST /api/readings with x-device-key header returns 201 and source device',
        'FAIL',
        e.message
      );
    }

    try {
      const badKeyRes = await fetch(`${baseUrl}/api/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': 'invalid_device_key_123456789012',
        },
        body: JSON.stringify({ value: 6.0 }),
      });

      const badVal1Res = await fetch(`${baseUrl}/api/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': hwApiKey,
        },
        body: JSON.stringify({ value: 15 }),
      });

      const badVal2Res = await fetch(`${baseUrl}/api/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': hwApiKey,
        },
        body: JSON.stringify({ value: 'abc' }),
      });

      const isPass = badKeyRes.status === 401 && badVal1Res.status === 400 && badVal2Res.status === 400;
      recordResult(
        '3c. Hardware validation: wrong key -> 401; value 15 -> 400; value abc -> 400',
        isPass ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      recordResult(
        '3c. Hardware validation: wrong key -> 401; value 15 -> 400; value abc -> 400',
        'FAIL',
        e.message
      );
    }

    try {
      // Inactive device check
      await fetch(`${baseUrl}/api/devices/${hwDevice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ status: 'inactive' }),
      });

      const inactiveRes = await fetch(`${baseUrl}/api/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': hwApiKey,
        },
        body: JSON.stringify({ value: 6.2 }),
      });

      // Reactivate device and test regenerate-key
      await fetch(`${baseUrl}/api/devices/${hwDevice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ status: 'active' }),
      });

      const regenRes = await fetch(`${baseUrl}/api/devices/${hwDevice._id}/regenerate-key`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const regenData = await regenRes.json();
      const newApiKey = regenData.data?.apiKey;

      const oldKeyRes = await fetch(`${baseUrl}/api/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': hwApiKey,
        },
        body: JSON.stringify({ value: 6.2 }),
      });

      const newKeyRes = await fetch(`${baseUrl}/api/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-key': newApiKey,
        },
        body: JSON.stringify({ value: 6.2 }),
      });
      const newKeyData = await newKeyRes.json();
      if (newKeyData.data?.reading?._id) createdIds.readings.push(newKeyData.data.reading._id);

      const isPass =
        inactiveRes.status === 403 &&
        regenRes.status === 200 &&
        oldKeyRes.status === 401 &&
        newKeyRes.status === 201;

      recordResult(
        '3d. Inactive device returns 403; regenerate-key makes old key fail (401) and new key work (201)',
        isPass ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      recordResult(
        '3d. Inactive device returns 403; regenerate-key makes old key fail (401) and new key work (201)',
        'FAIL',
        e.message
      );
    }

    try {
      const delDevRes = await fetch(`${baseUrl}/api/devices/${hwDevice._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      const checkReadings = await PhReading.find({ device: hwDevice._id });
      const isPass = delDevRes.status === 200 && checkReadings.length === 0;

      recordResult(
        '3e. Deleting a device cascades and removes its readings',
        isPass ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      recordResult('3e. Deleting a device cascades and removes its readings', 'FAIL', e.message);
    }

    // CHECK GROUP 4: Scan Alert Endpoint
    try {
      const scan1Res = await fetch(`${baseUrl}/api/alerts/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ farmId: farm1Id, days: 7 }),
      });
      const scan1Data = await scan1Res.json();

      const scan2Res = await fetch(`${baseUrl}/api/alerts/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({ farmId: farm1Id, days: 7 }),
      });
      const scan2Data = await scan2Res.json();

      const isPass =
        scan1Res.status === 200 &&
        scan1Data.data?.created >= 1 &&
        scan2Res.status === 200 &&
        scan2Data.data?.created === 0;

      // Track all scanned alerts for cleanup
      const scannedAlerts = await Alert.find({ farm: farm1Id });
      scannedAlerts.forEach((a) => createdIds.alerts.push(a._id));

      recordResult(
        '4. POST /api/alerts/scan creates alerts on first run (>= 1) and returns created 0 on second run',
        isPass ? 'PASS' : 'FAIL',
        `run 1 created: ${scan1Data.data?.created}, run 2 created: ${scan2Data.data?.created}`
      );
    } catch (e) {
      recordResult(
        '4. POST /api/alerts/scan creates alerts on first run (>= 1) and returns created 0 on second run',
        'FAIL',
        e.message
      );
    }

    // CHECK GROUP 5: Access Control
    try {
      const sFarmerDevRes = await fetch(`${baseUrl}/api/devices?farmId=${farm1Id}`, {
        headers: { Authorization: `Bearer ${secondFarmerToken}` },
      });
      const sFarmerReadRes = await fetch(`${baseUrl}/api/readings?farmId=${farm1Id}`, {
        headers: { Authorization: `Bearer ${secondFarmerToken}` },
      });
      const sFarmerSimRes = await fetch(`${baseUrl}/api/readings/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondFarmerToken}`,
        },
        body: JSON.stringify({ deviceId: demoDevice1._id }),
      });
      const sFarmerScanRes = await fetch(`${baseUrl}/api/alerts/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secondFarmerToken}`,
        },
        body: JSON.stringify({ farmId: farm1Id }),
      });

      const buyerDevRes = await fetch(`${baseUrl}/api/devices`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });
      const buyerReadRes = await fetch(`${baseUrl}/api/readings?farmId=${farm1Id}`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      const adminReadRes = await fetch(`${baseUrl}/api/readings?farmId=${farm1Id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const adminSimRes = await fetch(`${baseUrl}/api/readings/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ deviceId: demoDevice1._id }),
      });

      const noTokenRes = await fetch(`${baseUrl}/api/readings?farmId=${farm1Id}`);

      const isPass =
        sFarmerDevRes.status === 403 &&
        sFarmerReadRes.status === 403 &&
        sFarmerSimRes.status === 403 &&
        sFarmerScanRes.status === 403 &&
        buyerDevRes.status === 403 &&
        buyerReadRes.status === 403 &&
        adminReadRes.status === 200 &&
        adminSimRes.status === 403 &&
        noTokenRes.status === 401;

      recordResult(
        '5. Access control: second farmer gets 403 on demo farm; buyer gets 403; admin read 200/simulate 403; no token 401',
        isPass ? 'PASS' : 'FAIL'
      );
    } catch (e) {
      recordResult(
        '5. Access control: second farmer gets 403 on demo farm; buyer gets 403; admin read 200/simulate 403; no token 401',
        'FAIL',
        e.message
      );
    }

    // CHECK GROUP 6: Weather API
    try {
      const noTokenWeather = await fetch(`${baseUrl}/api/weather`);
      const noLocationWeather = await fetch(`${baseUrl}/api/weather`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const badLatWeather = await fetch(`${baseUrl}/api/weather?lat=999&lon=100`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });

      const isBasicValid =
        noTokenWeather.status === 401 &&
        noLocationWeather.status === 400 &&
        badLatWeather.status === 400;

      if (!process.env.OPENWEATHER_API_KEY) {
        const noKeyRes = await fetch(`${baseUrl}/api/weather?farmId=${farm1Id}`, {
          headers: { Authorization: `Bearer ${farmerToken}` },
        });
        const isPass = isBasicValid && noKeyRes.status === 503;
        recordResult(
          '6. Weather API: validation checks pass and missing API key returns 503',
          isPass ? 'PASS' : 'FAIL'
        );
      } else {
        const farmWeatherRes = await fetch(`${baseUrl}/api/weather?farmId=${farm1Id}`, {
          headers: { Authorization: `Bearer ${farmerToken}` },
        });
        const farmWeatherText = await farmWeatherRes.text();

        // Check if API key is leaked in body
        const keyLeaked = farmWeatherText.includes(process.env.OPENWEATHER_API_KEY);

        if (farmWeatherRes.status === 502 || farmWeatherRes.status === 504) {
          recordResult(
            '6. Weather API integration with OpenWeatherMap',
            'SKIP',
            `Provider returned status ${farmWeatherRes.status} (network reachability or key activation pending)`
          );
        } else if (farmWeatherRes.status === 200 && !keyLeaked) {
          const farmWeatherData = JSON.parse(farmWeatherText);
          const hasLocation = !!farmWeatherData.data?.location;
          const hasCurrent = !!farmWeatherData.data?.current;
          const hasForecast = Array.isArray(farmWeatherData.data?.forecast);
          const hasTips = Array.isArray(farmWeatherData.data?.tips);

          const isPass = isBasicValid && hasLocation && hasCurrent && hasForecast && hasTips;
          recordResult(
            '6. Weather API returns 200 with location, current, forecast array, and tips without key leaks',
            isPass ? 'PASS' : 'FAIL'
          );
        } else {
          recordResult(
            '6. Weather API integration with OpenWeatherMap',
            'FAIL',
            `Status: ${farmWeatherRes.status}, keyLeaked: ${keyLeaked}`
          );
        }
      }
    } catch (e) {
      recordResult('6. Weather API integration with OpenWeatherMap', 'FAIL', e.message);
    }

    console.log('\n========================================');
    console.log(`IoT Test Summary: Total: ${passed + failed + skipped} | Passed: ${passed} | Skipped: ${skipped} | Failed: ${failed}`);
    console.log('========================================\n');
  } catch (fatalErr) {
    console.error('Fatal test execution error:', fatalErr.message);
    failed++;
  } finally {
    // Cleanup everything created during tests
    try {
      if (createdIds.users.length > 0) {
        await User.deleteMany({ _id: { $in: createdIds.users } });
      }
      if (createdIds.devices.length > 0) {
        await PhReading.deleteMany({ device: { $in: createdIds.devices } });
        await Device.deleteMany({ _id: { $in: createdIds.devices } });
      }
      if (createdIds.readings.length > 0) {
        await Alert.deleteMany({ reading: { $in: createdIds.readings } });
        await PhReading.deleteMany({ _id: { $in: createdIds.readings } });
      }
      if (createdIds.alerts.length > 0) {
        await Alert.deleteMany({ _id: { $in: createdIds.alerts } });
      }

      // Also clean up any simulated readings created during test run
      await PhReading.deleteMany({ source: 'simulated' });
      // Clean up any remaining alerts
      await Alert.deleteMany({});
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }

    const finalReadingCount = await PhReading.countDocuments();
    const finalAlertCount = await Alert.countDocuments();
    console.log(`Final Verification -> PhReadings count: ${finalReadingCount} (expected 120), Alerts count: ${finalAlertCount} (expected 0)`);

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
