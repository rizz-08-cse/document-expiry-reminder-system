import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  AlertTriangle,
  History,
  Check
} from 'lucide-react';

const DOC_TYPES = [
  'Driving Licence',
  'Passport',
  'Vehicle Insurance',
  'RC',
  'Certificate',
  'Custom'
];

export const DocumentsPage = () => {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [renewDoc, setRenewDoc] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    documentType: 'Driving Licence',
    customTypeName: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: ''
  });

  const [renewExpiryDate, setRenewExpiryDate] = useState('');
  const [renewNotes, setRenewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents', {
        search,
        state: stateFilter,
        type: typeFilter,
        sortBy,
        order: sortOrder
      });
      if (res.success) {
        setDocuments(res.documents || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load documents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [stateFilter, typeFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      documentType: 'Driving Licence',
      customTypeName: '',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      notes: ''
    });
  };

  // Add Document Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.expiryDate) {
      showToast('Document title and expiry date are required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/documents', formData);
      if (res.success) {
        showToast('Document added to reminder schedule successfully!', 'success');
        setIsAddOpen(false);
        resetForm();
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add document.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (doc) => {
    setEditDoc(doc);
    setFormData({
      title: doc.title,
      documentType: doc.documentType,
      customTypeName: doc.customTypeName || '',
      documentNumber: doc.documentNumber || '',
      issueDate: doc.issueDate ? doc.issueDate.slice(0, 10) : '',
      expiryDate: doc.expiryDate ? doc.expiryDate.slice(0, 10) : '',
      notes: doc.notes || ''
    });
  };

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/documents/${editDoc._id}`, formData);
      if (res.success) {
        showToast('Document updated successfully.', 'success');
        setEditDoc(null);
        resetForm();
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update document.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Renew Modal
  const handleOpenRenew = (doc) => {
    setRenewDoc(doc);
    const nextDate = new Date(doc.expiryDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    setRenewExpiryDate(nextDate.toISOString().slice(0, 10));
    setRenewNotes('');
  };

  // Renew Submit
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewExpiryDate) {
      showToast('Please specify a new expiry date.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/documents/${renewDoc._id}/renew`, {
        newExpiryDate: renewExpiryDate,
        renewalNotes: renewNotes
      });
      if (res.success) {
        showToast(`Document "${renewDoc.title}" renewed! Reminders rescheduled.`, 'success');
        setRenewDoc(null);
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.message || 'Renewal failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      const res = await api.delete(`/documents/${deleteDoc._id}`);
      if (res.success) {
        showToast('Document deleted successfully.', 'success');
        setDeleteDoc(null);
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete document.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Title & Add Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>My Documents</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage your registered documents and active expiry schedules
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>Add Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            flex: '1 1 250px',
            display: 'flex',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          <Search
            size={18}
            color="var(--text-light)"
            style={{ position: 'absolute', left: '0.75rem' }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search by title, number, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </form>

        {/* State Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Status:
          </span>
          <select
            className="form-control"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
          >
            <option value="all">All States</option>
            <option value="Valid">Valid</option>
            <option value="Expiring Soon">Expiring Soon (≤30d)</option>
            <option value="Expired">Expired</option>
            <option value="Renewed">Renewed</option>
          </select>
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Type:
          </span>
          <select
            className="form-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
          >
            <option value="all">All Types</option>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Sort:
          </span>
          <select
            className="form-control"
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_');
              setSortBy(sb);
              setSortOrder(so);
            }}
            style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
          >
            <option value="expiryDate_asc">Expiry (Closest First)</option>
            <option value="expiryDate_desc">Expiry (Furthest First)</option>
            <option value="createdAt_desc">Date Added (Newest)</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: '52px' }} />
            ))}
          </div>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No documents found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {search || stateFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Add your first document to begin receiving timely reminders!'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add Document</span>
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Details</th>
                <th>Type</th>
                <th>Doc Number</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>State & Days</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {doc.title}
                    </div>
                    {doc.renewalHistory && doc.renewalHistory.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--accent-purple)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          marginTop: '0.2rem'
                        }}
                      >
                        <History size={12} />
                        <span>Renewed {doc.renewalHistory.length} time(s)</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: '500' }}>
                      {doc.documentType === 'Custom' ? doc.customTypeName : doc.documentType}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {doc.documentNumber || '—'}
                    </code>
                  </td>
                  <td>
                    {doc.issueDate
                      ? new Date(doc.issueDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      <span style={{ fontWeight: '600' }}>
                        {new Date(doc.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge state={doc.state} daysRemaining={doc.daysRemaining} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        onClick={() => setViewDoc(doc)}
                        className="btn-icon"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenRenew(doc)}
                        className="btn-icon"
                        title="Renew Document"
                        style={{ color: 'var(--accent-purple)' }}
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="btn-icon"
                        title="Edit Document"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteDoc(doc)}
                        className="btn-icon"
                        title="Delete Document"
                        style={{ color: 'var(--accent-red)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Document Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Document to Track"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsAddOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving Document...' : 'Save Document'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label">Document Title *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="e.g. My Driving Licence / Car Insurance"
              value={formData.title}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Document Type *</label>
            <select
              name="documentType"
              className="form-control"
              value={formData.documentType}
              onChange={handleFormChange}
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {formData.documentType === 'Custom' && (
            <div className="form-group">
              <label className="form-label">Custom Type Name *</label>
              <input
                type="text"
                name="customTypeName"
                className="form-control"
                placeholder="e.g. Rent Agreement / Fire Safety Cert"
                value={formData.customTypeName}
                onChange={handleFormChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Document Number (Optional)</label>
            <input
              type="text"
              name="documentNumber"
              className="form-control"
              placeholder="e.g. DL-0420110012345"
              value={formData.documentNumber}
              onChange={handleFormChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Issue Date (Optional)</label>
              <input
                type="date"
                name="issueDate"
                className="form-control"
                value={formData.issueDate}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                className="form-control"
                value={formData.expiryDate}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              name="notes"
              className="form-control"
              rows="3"
              placeholder="Additional information, policy agent, renewal link, etc."
              value={formData.notes}
              onChange={handleFormChange}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Document Modal */}
      <Modal
        isOpen={Boolean(editDoc)}
        onClose={() => setEditDoc(null)}
        title={`Edit Document: ${editDoc?.title}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setEditDoc(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEditSubmit}
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Document Title *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Document Type *</label>
            <select
              name="documentType"
              className="form-control"
              value={formData.documentType}
              onChange={handleFormChange}
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {formData.documentType === 'Custom' && (
            <div className="form-group">
              <label className="form-label">Custom Type Name</label>
              <input
                type="text"
                name="customTypeName"
                className="form-control"
                value={formData.customTypeName}
                onChange={handleFormChange}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Document Number</label>
            <input
              type="text"
              name="documentNumber"
              className="form-control"
              value={formData.documentNumber}
              onChange={handleFormChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input
                type="date"
                name="issueDate"
                className="form-control"
                value={formData.issueDate}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                className="form-control"
                value={formData.expiryDate}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-control"
              rows="3"
              value={formData.notes}
              onChange={handleFormChange}
            />
          </div>
        </form>
      </Modal>

      {/* Renew Document Modal */}
      <Modal
        isOpen={Boolean(renewDoc)}
        onClose={() => setRenewDoc(null)}
        title={`Renew Document: ${renewDoc?.title}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setRenewDoc(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRenewSubmit}
              disabled={submitting}
            >
              {submitting ? 'Renewing...' : 'Confirm Renewal'}
            </button>
          </>
        }
      >
        <form onSubmit={handleRenewSubmit}>
          <div className="form-group">
            <label className="form-label">Current Expiry</label>
            <input
              type="text"
              className="form-control"
              disabled
              value={
                renewDoc?.expiryDate
                  ? new Date(renewDoc.expiryDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  : ''
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Expiry Date *</label>
            <input
              type="date"
              className="form-control"
              value={renewExpiryDate}
              onChange={(e) => setRenewExpiryDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Renewal Notes</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Policy renewed for 1 year with Bajaj Allianz"
              value={renewNotes}
              onChange={(e) => setRenewNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* View Document Details Modal */}
      <Modal
        isOpen={Boolean(viewDoc)}
        onClose={() => setViewDoc(null)}
        title="Document Details"
        footer={
          <button type="button" className="btn btn-outline" onClick={() => setViewDoc(null)}>
            Close
          </button>
        }
      >
        {viewDoc && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                {viewDoc.title}
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-accepted">{viewDoc.documentType}</span>
                <StatusBadge state={viewDoc.state} daysRemaining={viewDoc.daysRemaining} />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Document Number:</strong>
                <div>{viewDoc.documentNumber || 'Not specified'}</div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Expiry Date:</strong>
                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                  {new Date(viewDoc.expiryDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Issue Date:</strong>
                <div>
                  {viewDoc.issueDate
                    ? new Date(viewDoc.issueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Not specified'}
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Tracking Status:</strong>
                <div style={{ textTransform: 'capitalize' }}>{viewDoc.status}</div>
              </div>
            </div>

            {viewDoc.notes && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Notes:</strong>
                <p style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                  {viewDoc.notes}
                </p>
              </div>
            )}

            {/* Renewal History Audit */}
            <div>
              <strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Renewal Audit Trail:
              </strong>
              {viewDoc.renewalHistory && viewDoc.renewalHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {viewDoc.renewalHistory.map((hist, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>
                        Previous Expiry: {new Date(hist.previousExpiryDate).toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Renewed on {new Date(hist.renewedAt).toLocaleDateString('en-IN')} — {hist.notes}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  No prior renewals recorded yet.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteDoc)}
        onClose={() => setDeleteDoc(null)}
        title="Confirm Document Deletion"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setDeleteDoc(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Yes, Delete Document'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-red-light)',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
              Are you sure you want to remove this document?
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Deleting <strong>"{deleteDoc?.title}"</strong> will permanently stop scheduled expiry
              SMS reminders and clear its associated notifications. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
