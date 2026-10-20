import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Users, Search, Ban, CheckCircle, Eye, FileText, Smartphone } from 'lucide-react';

export const AdminCustomersPage = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Status Change Modal
  const [actionCustomer, setActionCustomer] = useState(null);
  const [actionType, setActionType] = useState('suspend');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Customer Detail Modal
  const [viewCustomer, setViewCustomer] = useState(null);
  const [customerDocs, setCustomerDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers', {
        search,
        status: statusFilter,
        page
      });
      if (res.success) {
        setCustomers(res.customers || []);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch customer list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleOpenAction = (customer, type) => {
    setActionCustomer(customer);
    setActionType(type);
    setReason('');
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newStatus = actionType === 'suspend' ? 'suspended' : 'active';
      const res = await api.put(`/admin/customers/${actionCustomer._id}/status`, {
        status: newStatus,
        reason
      });
      if (res.success) {
        showToast(`Customer account ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`, 'success');
        setActionCustomer(null);
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update customer status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (customer) => {
    setViewCustomer(customer);
    try {
      setLoadingDocs(true);
      const res = await api.get(`/admin/customers/${customer._id}`);
      if (res.success) {
        setCustomerDocs(res.documents || []);
      }
    } catch (err) {
      showToast('Failed to load customer documents.', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Customer Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Inspect registered customers, monitor document usage, and manage access privileges
        </p>
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
        <form
          onSubmit={handleSearchSubmit}
          style={{ flex: '1 1 250px', display: 'flex', position: 'relative' }}
        >
          <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by customer name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Account Status:
          </span>
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="all">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: '52px' }} />
            ))}
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No customers found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Email</th>
                <th>Documents</th>
                <th>SMS Consent</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      Joined {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '500' }}>+91 {c.phone}</span>
                  </td>
                  <td>{c.email || '—'}</td>
                  <td>
                    <span className="badge badge-accepted">
                      {c.documentCount ?? 0} Docs
                    </span>
                  </td>
                  <td>
                    {c.smsConsent ? (
                      <span className="badge badge-valid">Opted In</span>
                    ) : (
                      <span className="badge badge-simulated">Opted Out</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleViewDetails(c)}
                        className="btn btn-outline btn-sm"
                        title="View Customer Documents"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      {c.status === 'active' ? (
                        <button
                          onClick={() => handleOpenAction(c, 'suspend')}
                          className="btn btn-danger-outline btn-sm"
                          title="Suspend Customer"
                        >
                          <Ban size={14} />
                          <span>Suspend</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAction(c, 'reactivate')}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                          title="Reactivate Customer"
                        >
                          <CheckCircle size={14} />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      <Modal
        isOpen={Boolean(actionCustomer)}
        onClose={() => setActionCustomer(null)}
        title={`${actionType === 'suspend' ? 'Suspend' : 'Reactivate'} Customer Account`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setActionCustomer(null)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${actionType === 'suspend' ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleConfirmStatusChange}
              disabled={submitting}
            >
              {submitting
                ? 'Processing...'
                : actionType === 'suspend'
                ? 'Confirm Suspension'
                : 'Confirm Reactivation'}
            </button>
          </>
        }
      >
        <form onSubmit={handleConfirmStatusChange}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {actionType === 'suspend'
              ? `Suspending "${actionCustomer?.name}" (+91 ${actionCustomer?.phone}) will immediately prevent login and stop automatic reminders until reactivated.`
              : `Reactivating "${actionCustomer?.name}" will restore login access and resume reminder schedules.`}
          </p>

          <div className="form-group">
            <label className="form-label">Audit Reason *</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Provide justification for security audit trail..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Customer Detail & Documents Drawer */}
      <Modal
        isOpen={Boolean(viewCustomer)}
        onClose={() => setViewCustomer(null)}
        title={`Customer: ${viewCustomer?.name}`}
        footer={
          <button type="button" className="btn btn-outline" onClick={() => setViewCustomer(null)}>
            Close
          </button>
        }
      >
        {viewCustomer && (
          <div>
            <div
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.9rem'
              }}
            >
              <div><strong>Mobile:</strong> +91 {viewCustomer.phone}</div>
              <div><strong>Email:</strong> {viewCustomer.email || 'None'}</div>
              <div><strong>SMS Consent:</strong> {viewCustomer.smsConsent ? 'Yes' : 'No'}</div>
              <div><strong>Account Status:</strong> {viewCustomer.status}</div>
            </div>

            <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
              Tracked Documents ({customerDocs.length})
            </h4>

            {loadingDocs ? (
              <div className="skeleton" style={{ height: '80px' }} />
            ) : customerDocs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This customer has not registered any documents yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {customerDocs.map((d) => (
                  <div
                    key={d._id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{d.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {d.documentType} • Expires {new Date(d.expiryDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <StatusBadge state={d.state} daysRemaining={d.daysRemaining} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
