import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  Calendar
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Renew Modal state
  const [renewDoc, setRenewDoc] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [renewalNotes, setRenewalNotes] = useState('');
  const [renewing, setRenewing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/dashboard');
      if (res.success) {
        setMetrics(res.metrics);
        setUpcoming(res.upcomingExpiring || []);
      }
    } catch (err) {
      showToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenRenew = (doc) => {
    setRenewDoc(doc);
    // Default new expiry date to 1 year from current expiry
    const curr = new Date(doc.expiryDate);
    curr.setFullYear(curr.getFullYear() + 1);
    setNewExpiryDate(curr.toISOString().slice(0, 10));
    setRenewalNotes('');
  };

  const handleExecuteRenew = async (e) => {
    e.preventDefault();
    if (!newExpiryDate) {
      showToast('Please select a new expiry date.', 'error');
      return;
    }

    try {
      setRenewing(true);
      const res = await api.post(`/documents/${renewDoc._id}/renew`, {
        newExpiryDate,
        renewalNotes
      });
      if (res.success) {
        showToast(`"${renewDoc.title}" renewed successfully!`, 'success');
        setRenewDoc(null);
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Renewal failed.', 'error');
    } finally {
      setRenewing(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Here is your live document status overview and upcoming expiry alerts
          </p>
        </div>

        <Link to="/documents" className="btn btn-primary">
          <Plus size={18} />
          <span>Add New Document</span>
        </Link>
      </div>

      {/* SMS Consent Status Alert Banner if disabled */}
      {user?.smsConsent === false && (
        <div
          style={{
            background: 'var(--accent-amber-light)',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Smartphone size={20} color="#b45309" />
            <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
              <strong>SMS Alerts are currently disabled.</strong> Enable SMS notifications to receive
              timely alerts directly to your mobile (+91 {user?.phone}).
            </span>
          </div>
          <Link to="/profile" className="btn btn-outline btn-sm" style={{ borderColor: '#d97706' }}>
            Enable in Settings
          </Link>
        </div>
      )}

      {/* Summary Metric Cards */}
      {loading ? (
        <div className="metric-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton" style={{ height: '110px' }} />
          ))}
        </div>
      ) : (
        <div className="metric-grid">
          <div className="metric-card total">
            <div className="metric-info">
              <h4>Total Tracked</h4>
              <div className="metric-value">{metrics?.total ?? 0}</div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <FileText size={24} />
            </div>
          </div>

          <div className="metric-card valid">
            <div className="metric-info">
              <h4>Valid Documents</h4>
              <div className="metric-value">{metrics?.valid ?? 0}</div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="metric-card expiring">
            <div className="metric-info">
              <h4>Expiring Soon (30d)</h4>
              <div className="metric-value" style={{ color: 'var(--accent-amber)' }}>
                {metrics?.expiringSoon ?? 0}
              </div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)' }}>
              <Clock size={24} />
            </div>
          </div>

          <div className="metric-card expired">
            <div className="metric-info">
              <h4>Expired Documents</h4>
              <div className="metric-value" style={{ color: 'var(--accent-red)' }}>
                {metrics?.expired ?? 0}
              </div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--accent-red-light)', color: 'var(--accent-red)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Expiries Table Section */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Closest Upcoming Expiries</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Documents requiring your earliest attention
            </p>
          </div>
          <Link to="/documents" className="btn btn-outline btn-sm">
            <span>View All Documents</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton" style={{ height: '48px' }} />
            <div className="skeleton" style={{ height: '48px' }} />
            <div className="skeleton" style={{ height: '48px' }} />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckCircle2 size={28} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.35rem' }}>
              All Caught Up!
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              You don't have any documents expiring in the immediate window.
            </p>
            <Link to="/documents" className="btn btn-primary btn-sm">
              <Plus size={16} />
              <span>Add a Document to Track</span>
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Type</th>
                  <th>Doc Number</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((doc) => (
                  <tr key={doc._id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{doc.title}</div>
                      {doc.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {doc.notes}
                        </div>
                      )}
                    </td>
                    <td>{doc.documentType === 'Custom' ? doc.customTypeName : doc.documentType}</td>
                    <td>
                      <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {doc.documentNumber || '—'}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        <span>
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
                      <button
                        onClick={() => handleOpenRenew(doc)}
                        className="btn btn-outline btn-sm"
                        title="Renew this document"
                      >
                        <RefreshCw size={14} />
                        <span>Renew</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Renew Modal Dialog */}
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
              disabled={renewing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExecuteRenew}
              disabled={renewing}
            >
              {renewing ? 'Saving Renewal...' : 'Confirm Renewal'}
            </button>
          </>
        }
      >
        <form onSubmit={handleExecuteRenew}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Updating the expiry date will archive the previous expiry into your renewal history and
            re-enable automated reminder notifications for the new cycle.
          </p>

          <div className="form-group">
            <label className="form-label">Current Expiry Date</label>
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
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Renewal Notes (Optional)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Paid annual premium via portal / Receipt #48291"
              value={renewalNotes}
              onChange={(e) => setRenewalNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
