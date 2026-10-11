import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const runTests = async () => {
  let server;
  let passed = 0;
  let failed = 0;

  const testResults = [];

  const recordResult = (description, isPass, detail = '') => {
    if (isPass) {
      passed++;
      console.log(`  [PASS] ${description}`);
      testResults.push({ description, status: 'PASS' });
    } else {
      failed++;
      console.error(`  [FAIL] ${description} ${detail ? `- ${detail}` : ''}`);
      testResults.push({ description, status: 'FAIL', detail });
    }
  };

  try {
    // Connect to database
    await connectDB();

    // Start server on an ephemeral port
    server = app.listen(0);
    await new Promise((resolve) => server.on('listening', resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    console.log(`\n--- Running Auth & Role-Based Access Tests on ${baseUrl} ---\n`);

    const timestamp = Date.now();
    const farmerEmail = `test_auth_farmer_${timestamp}@example.com`;
    const unknownEmail = `test_auth_unknown_${timestamp}@example.com`;
    const password = 'Password123!';

    let farmerToken = '';
    let wrongPasswordMsg = '';

    // Check 1: register farmer returns 201 with token and no password field
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Farmer Test',
          email: farmerEmail,
          password,
          confirmPassword: password,
          role: 'farmer',
        }),
      });
      const data = await res.json();
      const isPass =
        res.status === 201 &&
        data.success === true &&
        data.message === 'Registration successful' &&
        !!data.data?.token &&
        !!data.data?.user &&
        data.data.user.password === undefined;

      if (isPass) farmerToken = data.data.token;
      recordResult(
        '1. register farmer returns 201 with token and no password field',
        isPass,
        `status: ${res.status}`
      );
    } catch (e) {
      recordResult('1. register farmer returns 201 with token and no password field', false, e.message);
    }

    // Check 2: duplicate email returns 409
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Farmer Duplicate',
          email: farmerEmail,
          password,
          confirmPassword: password,
          role: 'farmer',
        }),
      });
      const data = await res.json();
      const isPass = res.status === 409 && data.success === false;
      recordResult('2. duplicate email returns 409', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('2. duplicate email returns 409', false, e.message);
    }

    // Check 3: password mismatch returns 400
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Mismatch Test',
          email: `test_auth_mismatch_${timestamp}@example.com`,
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
          role: 'farmer',
        }),
      });
      const data = await res.json();
      const isPass = res.status === 400 && data.success === false;
      recordResult('3. password mismatch returns 400', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('3. password mismatch returns 400', false, e.message);
    }

    // Check 4: short password returns 400
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Short Pass Test',
          email: `test_auth_short_${timestamp}@example.com`,
          password: 'short',
          confirmPassword: 'short',
          role: 'farmer',
        }),
      });
      const data = await res.json();
      const isPass = res.status === 400 && data.success === false;
      recordResult('4. short password returns 400', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('4. short password returns 400', false, e.message);
    }

    // Check 5: registering as admin returns 403
    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Admin Attempt',
          email: `test_auth_admin_${timestamp}@example.com`,
          password,
          confirmPassword: password,
          role: 'admin',
        }),
      });
      const data = await res.json();
      const isPass = res.status === 403 && data.success === false;
      recordResult('5. registering as admin returns 403', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('5. registering as admin returns 403', false, e.message);
    }

    // Check 6: login succeeds
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: farmerEmail,
          password,
        }),
      });
      const data = await res.json();
      const isPass =
        res.status === 200 &&
        data.success === true &&
        !!data.data?.token &&
        !!data.data?.user &&
        data.data.user.password === undefined;
      recordResult('6. login succeeds', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('6. login succeeds', false, e.message);
    }

    // Check 7: wrong password returns 401
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: farmerEmail,
          password: 'WrongPassword999!',
        }),
      });
      const data = await res.json();
      wrongPasswordMsg = data.message;
      const isPass =
        res.status === 401 &&
        data.success === false &&
        data.message === 'Invalid email or password';
      recordResult('7. wrong password returns 401', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('7. wrong password returns 401', false, e.message);
    }

    // Check 8: unknown email returns 401 with the same message as wrong password
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: unknownEmail,
          password,
        }),
      });
      const data = await res.json();
      const isPass =
        res.status === 401 &&
        data.success === false &&
        data.message === wrongPasswordMsg &&
        data.message === 'Invalid email or password';
      recordResult(
        '8. unknown email returns 401 with the same message as wrong password',
        isPass,
        `status: ${res.status}`
      );
    } catch (e) {
      recordResult(
        '8. unknown email returns 401 with the same message as wrong password',
        false,
        e.message
      );
    }

    // Check 9: GET /me without token returns 401
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      const data = await res.json();
      const isPass = res.status === 401 && data.success === false;
      recordResult('9. GET /me without token returns 401', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('9. GET /me without token returns 401', false, e.message);
    }

    // Check 10: GET /me with token returns 200
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      const isPass =
        res.status === 200 &&
        data.success === true &&
        data.data?.email === farmerEmail &&
        data.data?.password === undefined;
      recordResult('10. GET /me with token returns 200', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('10. GET /me with token returns 200', false, e.message);
    }

    // Check 11: GET /me with a garbage token returns 401
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: 'Bearer thisisgarbage_invalid_token' },
      });
      const data = await res.json();
      const isPass = res.status === 401 && data.success === false;
      recordResult('11. GET /me with a garbage token returns 401', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('11. GET /me with a garbage token returns 401', false, e.message);
    }

    // Check 12: PUT /me updates the name but ignores an attempt to change the role
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          name: 'Updated Farmer Name',
          role: 'admin',
        }),
      });
      const data = await res.json();
      const isPass =
        res.status === 200 &&
        data.success === true &&
        data.data?.name === 'Updated Farmer Name' &&
        data.data?.role === 'farmer' &&
        data.data?.password === undefined;
      recordResult(
        '12. PUT /me updates the name but ignores an attempt to change the role',
        isPass,
        `status: ${res.status}`
      );
    } catch (e) {
      recordResult(
        '12. PUT /me updates the name but ignores an attempt to change the role',
        false,
        e.message
      );
    }

    // Check 13: GET /api/users as a farmer returns 403
    try {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      const data = await res.json();
      const isPass = res.status === 403 && data.success === false;
      recordResult('13. GET /api/users as a farmer returns 403', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('13. GET /api/users as a farmer returns 403', false, e.message);
    }

    // Check 14: GET /api/users without a token returns 401
    try {
      const res = await fetch(`${baseUrl}/api/users`);
      const data = await res.json();
      const isPass = res.status === 401 && data.success === false;
      recordResult('14. GET /api/users without a token returns 401', isPass, `status: ${res.status}`);
    } catch (e) {
      recordResult('14. GET /api/users without a token returns 401', false, e.message);
    }

    // Final summary
    console.log('\n========================================');
    console.log(`Auth Test Summary: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Test execution error:', error.message);
    failed++;
  } finally {
    // Delete all test users created during test
    try {
      const deleteResult = await User.deleteMany({ email: { $regex: /^test_auth_/i } });
      console.log(`Cleaned up ${deleteResult.deletedCount} test user(s) from database.`);
    } catch (cleanupError) {
      console.error('Failed to clean up test users:', cleanupError.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();
