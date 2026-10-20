const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { verifyToken } = require('../middleware/auth');

// All customer document routes are strictly authenticated
router.use(verifyToken);

router.get('/dashboard', documentController.getCustomerDashboard);
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);
router.post('/', documentController.createDocument);
router.put('/:id', documentController.updateDocument);
router.post('/:id/renew', documentController.renewDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
