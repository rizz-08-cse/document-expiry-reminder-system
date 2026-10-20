const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Document = require('../src/models/Document');
const ReminderLog = require('../src/models/ReminderLog');
const reminderScheduler = require('../src/services/reminderScheduler');

let mongoServer;
let server;
let baseUrl;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {},
    binary: {
      checkMD5: false
    },
    spawn: {
      timeout: 120000
    }
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('API Integration - Full User, Document, RBAC & Idempotency Flow', async (t) => {
  let customerToken = '';
  let customerId = '';
  let docId = '';
  let adminToken = '';

  await t.test('1. Customer Registration', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arun Kumar',
        phone: '9845012345',
        email: 'arun.test@example.com',
        password: 'Password123!',
        smsConsent: true
      })
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.phone, '9845012345');
    customerToken = data.token;
    customerId = data.user._id;
  });

  await t.test('2. Customer Login with Phone', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '9845012345',
        password: 'Password123!'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(data.token);
  });

  await t.test('3. Create Document', async () => {
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const res = await fetch(`${baseUrl}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        title: 'Vehicle Insurance Comprehensive',
        documentType: 'Vehicle Insurance',
        documentNumber: 'POL-2026-9901',
        expiryDate: expiry.toISOString(),
        notes: 'Private car policy'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.equal(data.document.title, 'Vehicle Insurance Comprehensive');
    assert.equal(data.document.state, 'Expiring Soon');
    docId = data.document._id;
  });

  await t.test('4. Fetch Customer Dashboard Metrics', async () => {
    const res = await fetch(`${baseUrl}/api/documents/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.metrics.total, 1);
    assert.equal(data.metrics.expiringSoon, 1);
  });

  await t.test('5. Renew Document', async () => {
    const newExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year later
    const res = await fetch(`${baseUrl}/api/documents/${docId}/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        newExpiryDate: newExpiry.toISOString(),
        renewalNotes: 'Policy renewed for next 1 year'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.equal(data.document.state, 'Valid');
    assert.equal(data.document.renewalHistory.length, 1);
  });

  await t.test('6. RBAC Security: Customer cannot access Admin endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });

    const data = await res.json();
    assert.equal(res.status, 403);
    assert.equal(data.success, false);
    assert.match(data.message, /privileges/i);
  });

  await t.test('7. Admin Setup and Dashboard Access', async () => {
    // Create an admin user directly
    const admin = await User.create({
      name: 'Super Admin',
      phone: '9999999998',
      email: 'admin.test@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
      status: 'active'
    });

    // Admin login
    const loginRes = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin.test@example.com',
        password: 'AdminPassword123!'
      })
    });

    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200);
    assert.equal(loginData.success, true);
    adminToken = loginData.token;

    // Fetch admin dashboard
    const dashRes = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const dashData = await dashRes.json();
    assert.equal(dashRes.status, 200);
    assert.equal(dashData.success, true);
    assert.ok(dashData.metrics.customers.total >= 1);
    assert.ok(dashData.metrics.documents.total >= 1);
  });

  await t.test('8. Duplicate Reminder Prevention via Idempotency Key', async () => {
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateStr = expiryDate.toISOString().slice(0, 10);
    const idempotencyKey = `${docId}_7_days_${dateStr}`;

    // 1st insert succeeds
    const log1 = await ReminderLog.create({
      documentId: docId,
      userId: customerId,
      stage: '7_days',
      targetExpiryDate: expiryDate,
      idempotencyKey,
      recipientPhone: '9845012345',
      messageContent: 'Test alert message',
      status: 'simulated'
    });
    assert.ok(log1);

    // 2nd insert with exact same idempotency key must reject
    let threwDuplicate = false;
    try {
      await ReminderLog.create({
        documentId: docId,
        userId: customerId,
        stage: '7_days',
        targetExpiryDate: expiryDate,
        idempotencyKey,
        recipientPhone: '9845012345',
        messageContent: 'Duplicate test alert message',
        status: 'simulated'
      });
    } catch (err) {
      if (err.code === 11000) {
        threwDuplicate = true;
      }
    }
    assert.equal(threwDuplicate, true, 'Duplicate reminder log with identical idempotency key was blocked');
  });
});
