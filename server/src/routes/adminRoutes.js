const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All admin routes are strictly guarded by verifyToken AND requireAdmin
router.use(verifyToken, requireAdmin);

router.get('/dashboard', adminController.getAdminDashboardMetrics);
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerDetails);
router.put('/customers/:id/status', adminController.updateCustomerStatus);
router.get('/documents', adminController.getAllDocuments);
router.get('/reminders', adminController.getReminderLogs);
router.post('/reminders/:id/retry', adminController.retryFailedReminder);
router.post('/trigger-check', adminController.triggerManualExpiryCheck);
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);
router.post('/test-sms', adminController.sendTestSMS);

module.exports = router;
