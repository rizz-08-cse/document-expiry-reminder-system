const User = require('../models/User');
const Document = require('../models/Document');
const ReminderLog = require('../models/ReminderLog');
const SystemSetting = require('../models/SystemSetting');

const seedInitialData = async () => {
  try {
    // 1. Ensure Default Administrator Exists
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@system.local';
    const adminPhone = process.env.ADMIN_DEFAULT_PHONE || '9999999999';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMeAdmin123!';

    let admin = await User.findOne({ $or: [{ email: adminEmail }, { phone: adminPhone }] });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'admin',
        status: 'active',
        smsConsent: true
      });
      console.log(`[Seed] Default administrator created: ${adminEmail} (phone: ${adminPhone})`);
    }

    // 2. Default System Settings
    const stagesSetting = await SystemSetting.findOne({ key: 'reminder_stages' });
    if (!stagesSetting) {
      await SystemSetting.create({
        key: 'reminder_stages',
        value: [30, 7, 1, 0],
        description: 'Automatic reminder notification intervals (days before expiry)'
      });
    }

    const simSetting = await SystemSetting.findOne({ key: 'sms_simulation_mode' });
    if (!simSetting) {
      await SystemSetting.create({
        key: 'sms_simulation_mode',
        value: true,
        description: 'Safe demo simulation mode for SMS'
      });
    }

    // In development mode, check if sample customer data is needed
    const customerCount = await User.countDocuments({ role: 'customer' });
    if (customerCount === 0) {
      console.log('[Seed] Seeding realistic sample customer data (development only)...');

      // Sample Customer 1
      const customer1 = await User.create({
        name: 'Rajesh Sharma [Sample]',
        email: 'rajesh.sample@example.com',
        phone: '9888888888',
        password: 'Password123!',
        role: 'customer',
        status: 'active',
        smsConsent: true
      });

      // Sample Customer 2
      const customer2 = await User.create({
        name: 'Priya Patel [Sample]',
        email: 'priya.sample@example.com',
        phone: '9111111111',
        password: 'Password123!',
        role: 'customer',
        status: 'active',
        smsConsent: true
      });

      const today = new Date();

      // Expiring in 5 days
      const in5Days = new Date(today);
      in5Days.setDate(today.getDate() + 5);

      // Expiring in 300 days
      const in300Days = new Date(today);
      in300Days.setDate(today.getDate() + 300);

      // Expired 12 days ago
      const expired12DaysAgo = new Date(today);
      expired12DaysAgo.setDate(today.getDate() - 12);

      // Issue date 1 year ago
      const issue1YearAgo = new Date(today);
      issue1YearAgo.setFullYear(today.getFullYear() - 1);

      // Sample Documents for Rajesh
      const doc1 = await Document.create({
        userId: customer1._id,
        title: 'Commercial Driving Licence',
        documentType: 'Driving Licence',
        documentNumber: 'DL-0420110012345',
        issueDate: issue1YearAgo,
        expiryDate: in5Days,
        notes: 'Commercial vehicle endorsement category HMV.',
        status: 'active'
      });

      await Document.create({
        userId: customer1._id,
        title: 'Indian Passport (36 Pages)',
        documentType: 'Passport',
        documentNumber: 'Z8942150',
        issueDate: issue1YearAgo,
        expiryDate: in300Days,
        notes: 'Regular Indian passport issued at RPO Delhi.',
        status: 'active'
      });

      await Document.create({
        userId: customer1._id,
        title: 'Four Wheeler Comprehensive Insurance',
        documentType: 'Vehicle Insurance',
        documentNumber: 'POL-ICICI-883921',
        issueDate: issue1YearAgo,
        expiryDate: expired12DaysAgo,
        notes: 'Needs immediate renewal to avoid penalty.',
        status: 'active'
      });

      // Sample Documents for Priya
      await Document.create({
        userId: customer2._id,
        title: 'Chartered Accountant Practice Certificate',
        documentType: 'Certificate',
        documentNumber: 'ICAI-COP-7741',
        issueDate: issue1YearAgo,
        expiryDate: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000),
        notes: 'Annual COP renewal required by month end.',
        status: 'active'
      });

      // Sample reminder log for demonstration
      await ReminderLog.create({
        documentId: doc1._id,
        userId: customer1._id,
        stage: '7_days',
        targetExpiryDate: in5Days,
        idempotencyKey: `${doc1._id}_7_days_${in5Days.toISOString().slice(0, 10)}`,
        channel: 'sms',
        recipientPhone: customer1.phone,
        messageContent: `Alert: Your Driving Licence "${doc1.title}" expires on ${in5Days.toLocaleDateString('en-IN')}. Please renew.`,
        status: 'simulated',
        provider: 'simulated',
        providerResponseId: 'SIM-DEMO-SAMPLE-LOG',
        lastAttemptAt: new Date()
      });

      console.log('[Seed] Realistic sample data successfully seeded.');
    }
  } catch (error) {
    console.error('[Seed] Seeding error:', error.message);
  }
};

module.exports = { seedInitialData };
