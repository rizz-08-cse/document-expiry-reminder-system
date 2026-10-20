const Document = require('../models/Document');
const Notification = require('../models/Notification');

// List Customer Documents with Search, Filter & Sort
const getDocuments = async (req, res) => {
  try {
    const { search, type, state, status, sortBy = 'expiryDate', order = 'asc' } = req.query;
    const userId = req.user._id;

    // Base query scoped to the authenticated customer
    const query = { userId };

    if (type && type !== 'all') {
      query.documentType = type;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { documentNumber: regex },
        { notes: regex },
        { customTypeName: regex }
      ];
    }

    const sortDirection = order === 'desc' ? -1 : 1;
    const sortObj = {};
    sortObj[sortBy] = sortDirection;

    let documents = await Document.find(query).sort(sortObj);

    // Compute live state and daysRemaining for each document
    const now = new Date();
    let enriched = documents.map((doc) => {
      const meta = doc.getStatusMeta(now);
      return {
        ...doc.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      };
    });

    // Filter by computed state if requested
    if (state && state !== 'all') {
      enriched = enriched.filter((doc) => doc.state.toLowerCase() === state.toLowerCase());
    }

    return res.json({
      success: true,
      count: enriched.length,
      documents: enriched
    });
  } catch (error) {
    console.error('[Document Controller] getDocuments error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents.'
    });
  }
};

// Get Single Document by ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied.'
      });
    }

    const meta = document.getStatusMeta(new Date());

    return res.json({
      success: true,
      document: {
        ...document.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      }
    });
  } catch (error) {
    console.error('[Document Controller] getDocumentById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve document details.'
    });
  }
};

// Create New Document
const createDocument = async (req, res) => {
  try {
    const { title, documentType, customTypeName, documentNumber, issueDate, expiryDate, notes } = req.body;

    if (!title || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Document title and expiry date are required.'
      });
    }

    const parsedExpiry = new Date(expiryDate);
    if (isNaN(parsedExpiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiry date format.'
      });
    }

    let parsedIssue = null;
    if (issueDate) {
      parsedIssue = new Date(issueDate);
      if (isNaN(parsedIssue.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid issue date format.'
        });
      }
      if (parsedIssue > parsedExpiry) {
        return res.status(400).json({
          success: false,
          message: 'Issue date cannot be later than expiry date.'
        });
      }
    }

    const newDoc = await Document.create({
      userId: req.user._id,
      title: title.trim(),
      documentType: documentType || 'Driving Licence',
      customTypeName: customTypeName ? customTypeName.trim() : undefined,
      documentNumber: documentNumber ? documentNumber.trim() : undefined,
      issueDate: parsedIssue,
      expiryDate: parsedExpiry,
      notes: notes ? notes.trim() : undefined,
      status: 'active'
    });

    const meta = newDoc.getStatusMeta();

    return res.status(201).json({
      success: true,
      message: 'Document added successfully.',
      document: {
        ...newDoc.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      }
    });
  } catch (error) {
    console.error('[Document Controller] createDocument error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create document.'
    });
  }
};

// Update Document
const updateDocument = async (req, res) => {
  try {
    const { title, documentType, customTypeName, documentNumber, issueDate, expiryDate, notes, status } = req.body;

    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied.'
      });
    }

    if (title) doc.title = title.trim();
    if (documentType) doc.documentType = documentType;
    if (customTypeName !== undefined) doc.customTypeName = customTypeName ? customTypeName.trim() : undefined;
    if (documentNumber !== undefined) doc.documentNumber = documentNumber ? documentNumber.trim() : undefined;
    if (notes !== undefined) doc.notes = notes ? notes.trim() : undefined;
    if (status && ['active', 'renewed', 'archived'].includes(status)) doc.status = status;

    if (issueDate) {
      const parsedIssue = new Date(issueDate);
      if (!isNaN(parsedIssue.getTime())) doc.issueDate = parsedIssue;
    }

    if (expiryDate) {
      const parsedExpiry = new Date(expiryDate);
      if (isNaN(parsedExpiry.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
      }
      doc.expiryDate = parsedExpiry;
    }

    await doc.save();
    const meta = doc.getStatusMeta();

    return res.json({
      success: true,
      message: 'Document updated successfully.',
      document: {
        ...doc.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      }
    });
  } catch (error) {
    console.error('[Document Controller] updateDocument error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update document.'
    });
  }
};

// Renew Document
const renewDocument = async (req, res) => {
  try {
    const { newExpiryDate, renewalNotes } = req.body;

    if (!newExpiryDate) {
      return res.status(400).json({
        success: false,
        message: 'New expiry date is required to renew the document.'
      });
    }

    const parsedNewExpiry = new Date(newExpiryDate);
    if (isNaN(parsedNewExpiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid new expiry date format.'
      });
    }

    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied.'
      });
    }

    // Save previous expiry in renewal history
    doc.renewalHistory.push({
      previousExpiryDate: doc.expiryDate,
      renewedAt: new Date(),
      notes: renewalNotes ? renewalNotes.trim() : 'Document renewed'
    });

    // Update to new expiry date and mark status active
    doc.expiryDate = parsedNewExpiry;
    doc.status = 'active';

    await doc.save();
    const meta = doc.getStatusMeta();

    return res.json({
      success: true,
      message: 'Document renewed successfully! New reminders will be scheduled.',
      document: {
        ...doc.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      }
    });
  } catch (error) {
    console.error('[Document Controller] renewDocument error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to renew document.'
    });
  }
};

// Delete Document
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied.'
      });
    }

    // Clean up notifications for this document
    await Notification.deleteMany({ documentId: doc._id, userId: req.user._id });

    return res.json({
      success: true,
      message: 'Document removed successfully.'
    });
  } catch (error) {
    console.error('[Document Controller] deleteDocument error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document.'
    });
  }
};

// Customer Dashboard Metrics & Recent Expiries
const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const documents = await Document.find({ userId });

    const now = new Date();
    let total = documents.length;
    let valid = 0;
    let expiringSoon = 0;
    let expired = 0;
    let renewed = 0;

    const enriched = documents.map((doc) => {
      const meta = doc.getStatusMeta(now);
      if (meta.state === 'Valid') valid++;
      else if (meta.state === 'Expiring Soon') expiringSoon++;
      else if (meta.state === 'Expired') expired++;
      else if (meta.state === 'Renewed') renewed++;

      return {
        ...doc.toJSON(),
        daysRemaining: meta.daysRemaining,
        state: meta.state,
        badgeClass: meta.badgeClass
      };
    });

    // Upcoming expiring documents sorted by closest expiry
    const upcomingExpiring = enriched
      .filter((d) => d.status === 'active' && d.daysRemaining >= 0)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);

    // Recent unread notifications
    const unreadNotifications = await Notification.countDocuments({ userId, isRead: false });

    return res.json({
      success: true,
      metrics: {
        total,
        valid,
        expiringSoon,
        expired,
        renewed,
        unreadNotifications
      },
      upcomingExpiring
    });
  } catch (error) {
    console.error('[Document Controller] getCustomerDashboard error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard metrics.'
    });
  }
};

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  renewDocument,
  deleteDocument,
  getCustomerDashboard
};
