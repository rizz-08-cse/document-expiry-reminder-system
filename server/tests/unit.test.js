const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeIndianPhone, formatForMSG91, isSamplePhoneNumber } = require('../src/utils/phoneValidator');
const Document = require('../src/models/Document');
const reminderScheduler = require('../src/services/reminderScheduler');

test('Phone Validator - Normalizes valid Indian mobile numbers', () => {
  assert.equal(normalizeIndianPhone('9876543210'), '9876543210');
  assert.equal(normalizeIndianPhone('+919876543210'), '9876543210');
  assert.equal(normalizeIndianPhone('919876543210'), '9876543210');
  assert.equal(normalizeIndianPhone('09876543210'), '9876543210');
  assert.equal(normalizeIndianPhone(' 98765 43210 '), '9876543210');
});

test('Phone Validator - Rejects invalid numbers', () => {
  assert.equal(normalizeIndianPhone('1234567890'), null); // starts with 1
  assert.equal(normalizeIndianPhone('98765'), null); // too short
  assert.equal(normalizeIndianPhone('abcdefghij'), null);
});

test('Phone Validator - Formats for MSG91 correctly', () => {
  assert.equal(formatForMSG91('9876543210'), '919876543210');
  assert.equal(formatForMSG91('invalid'), null);
});

test('Phone Validator - Correctly identifies sample/seed numbers', () => {
  assert.equal(isSamplePhoneNumber('9999999999'), true);
  assert.equal(isSamplePhoneNumber('9888888888'), true);
  assert.equal(isSamplePhoneNumber('9111111111'), true);
  assert.equal(isSamplePhoneNumber('9823456781'), false);
});

test('Document Model - Expiry calculations and state resolution', () => {
  const refDate = new Date('2026-10-17T00:00:00.000Z');

  // 1. Valid (60 days in future)
  const validDoc = new Document({
    title: 'Passport',
    documentType: 'Passport',
    expiryDate: new Date('2026-12-16T00:00:00.000Z'),
    status: 'active'
  });
  const validMeta = validDoc.getStatusMeta(refDate);
  assert.equal(validMeta.state, 'Valid');
  assert.equal(validMeta.daysRemaining, 60);

  // 2. Expiring soon (10 days in future)
  const soonDoc = new Document({
    title: 'Driving Licence',
    documentType: 'Driving Licence',
    expiryDate: new Date('2026-10-27T00:00:00.000Z'),
    status: 'active'
  });
  const soonMeta = soonDoc.getStatusMeta(refDate);
  assert.equal(soonMeta.state, 'Expiring Soon');
  assert.equal(soonMeta.daysRemaining, 10);

  // 3. Expired (5 days in past)
  const expiredDoc = new Document({
    title: 'Insurance',
    documentType: 'Vehicle Insurance',
    expiryDate: new Date('2026-10-12T00:00:00.000Z'),
    status: 'active'
  });
  const expiredMeta = expiredDoc.getStatusMeta(refDate);
  assert.equal(expiredMeta.state, 'Expired');
  assert.equal(expiredMeta.daysRemaining, -5);

  // 4. Renewed status
  const renewedDoc = new Document({
    title: 'RC',
    documentType: 'RC',
    expiryDate: new Date('2026-10-12T00:00:00.000Z'),
    status: 'renewed'
  });
  const renewedMeta = renewedDoc.getStatusMeta(refDate);
  assert.equal(renewedMeta.state, 'Renewed');
});

test('Reminder Scheduler - Stage mapping and calendar difference', () => {
  const refDate = new Date('2026-10-17T00:00:00.000Z');

  const expiry30 = new Date('2026-11-16T00:00:00.000Z');
  const days30 = reminderScheduler.getCalendarDaysRemaining(expiry30, refDate);
  assert.equal(days30, 30);
  assert.equal(reminderScheduler.mapDaysToStage(days30), '30_days');

  const expiry7 = new Date('2026-10-24T00:00:00.000Z');
  const days7 = reminderScheduler.getCalendarDaysRemaining(expiry7, refDate);
  assert.equal(days7, 7);
  assert.equal(reminderScheduler.mapDaysToStage(days7), '7_days');

  const expiry1 = new Date('2026-10-18T00:00:00.000Z');
  const days1 = reminderScheduler.getCalendarDaysRemaining(expiry1, refDate);
  assert.equal(days1, 1);
  assert.equal(reminderScheduler.mapDaysToStage(days1), '1_day');

  const expiry0 = new Date('2026-10-17T00:00:00.000Z');
  const days0 = reminderScheduler.getCalendarDaysRemaining(expiry0, refDate);
  assert.equal(days0, 0);
  assert.equal(reminderScheduler.mapDaysToStage(days0), 'expiry_day');
});
