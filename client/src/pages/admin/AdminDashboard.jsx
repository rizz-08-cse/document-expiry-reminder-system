import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Users,
  FileText,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Play,
  Smartphone,
  Shield,
  Activity,
  History,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggeringCheck, setTriggeringCheck] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Retrying log state
  const [retryingId, setRetryingId] = useState(null);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load admin metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const handleManualCheck = async () => {
    try {
      setTriggeringCheck(true);
      const res = await api.post('/admin/trigger-check');
      if (res.success) {
        setCheckResult(res.results);
        showToast('Manual expiry check completed!', 'success');
        fetchDashboardMetrics();
      }
    } catch (err) {
      showToast(err.message || 'Manual check execution failed.', 'error');
    } finally {
      setTriggeringCheck(false);
    }
  };

  const handleRetryReminder = async (logId) => {
    try {
      setRetryingId(logId);
      const res = await api.post(`/admin/reminders/${logId}/retry`);
      if (res.success) {
        showToast('Reminder retried successfully.', 'success');
        fetchDashboardMetrics();
      }
    } catch (err) {
      showToast(err.message || 'Retry failed.', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div>
      {/* Top Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-accepted">System Administrator</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Timezone: Asia/Kolkata
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Admin Operations Center</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleManualCheck}
            className="btn btn-primary"
            disabled={triggeringCheck}
          >
            <Play size={16} />
            <span>{triggeringCheck ? 'Running Sweep...' : 'Trigger Expiry Check Now'}</span>
          </button>
          <Link to="/admin/settings" className="btn btn-outline">
            <Smartphone size={16} />
            <span>SMS Provider Settings</span>
          </Link>
        </div>
      </div>

      {/* Provider Status Pill */}
      {data?.metrics?.smsProvider && (
        <div
          style={{
            background: data.metrics.smsProvider.isSimulationMode ? '#f8fafc' : '#f0fdf4',
            border: '1px solid var(--border-color)',
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
            <Smartphone
              size={20}
              color={data.metrics.smsProvider.isSimulationMode ? '#64748b' : '#16a34a'}
            />
            <div>
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                Active SMS Engine:{' '}
                {data.metrics.smsProvider.isSimulationMode
                  ? 'Demo / Simulation Mode (Safe zero-cost)'
                  : 'MSG91 Flow API (Production Gateway)'}
              </span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {data.metrics.smsProvider.isSimulationMode
                  ? 'All dispatches recorded locally. Real cellular SMS disabled.'
                  : `Sender ID: ${data.metrics.smsProvider.senderId} | Template Configured: ${data.metrics.smsProvider.templateIdConfigured ? 'Yes' : 'No'}`}
              </span>
            </div>
          </div>
          <Link to="/admin/settings" className="btn btn-outline btn-sm">
            Configure Gateway
          </Link>
        </div>
      )}

      {/* Metrics Cards */}
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
              <h4>Total Customers</h4>
              <div className="metric-value">{data?.metrics?.customers?.total ?? 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {data?.metrics?.customers?.active ?? 0} Active /{' '}
                {data?.metrics?.customers?.suspended ?? 0} Suspended
              </div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={24} />
            </div>
          </div>

          <div className="metric-card valid">
            <div className="metric-info">
              <h4>Total Documents</h4>
              <div className="metric-value">{data?.metrics?.documents?.total ?? 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                {data?.metrics?.documents?.upcomingExpiries ?? 0} Expiring in 30d
              </div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
              <FileText size={24} />
            </div>
          </div>

          <div className="metric-card expiring">
            <div className="metric-info">
              <h4>Reminders Attempted</h4>
              <div className="metric-value">{data?.metrics?.reminders?.attempted ?? 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Across all stages
              </div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--accent-amber-light)', color: 'var(--accent-amber)' }}>
              <Send size={24} />
            </div>
          </div>

          <div className="metric-card expired">
            <div className="metric-info">
              <h4>Successful / Failed</h4>
              <div className="metric-value" style={{ fontSize: '1.5rem' }}>
                <span style={{ color: 'var(--accent-green)' }}>
                  {data?.metrics?.reminders?.successful ?? 0}
                </span>{' '}
                /{' '}
                <span style={{ color: 'var(--accent-red)' }}>
                  {data?.metrics?.reminders?.failed ?? 0}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Dispatched successfully
              </div>
            </div>
            <div className="metric-icon" style={{ background: 'var(--accent-red-light)', color: 'var(--accent-red)' }}>
              <Activity size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Reminder Logs Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Recent Reminder Dispatches</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Live audit trail of automatic reminders and SMS provider acceptance
            </p>
          </div>
          <Link to="/admin/reminders" className="btn btn-outline btn-sm">
            View All Logs
          </Link>
        </div>

        {data?.recentReminderLogs?.length === 0 ? (
          <div className="empty-state">
            <p style={{ color: 'var(--text-muted)' }}>
              No reminders have been dispatched yet. Click "Trigger Expiry Check Now" to evaluate.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipient / Customer</th>
                  <th>Document</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Provider ID / Response</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentReminderLogs?.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{log.userId?.name || 'Customer'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        +91 {log.recipientPhone}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{log.documentId?.title || 'Document'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.documentId?.documentType}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-accepted" style={{ textTransform: 'uppercase' }}>
                        {log.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem' }}>
                        {log.providerResponseId || log.errorMessage || '—'}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleRetryReminder(log._id)}
                          className="btn btn-outline btn-sm"
                          disabled={retryingId === log._id}
                        >
                          <RefreshCw size={14} />
                          <span>{retryingId === log._id ? 'Retrying...' : 'Retry'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Check Run Summary Modal */}
      <Modal
        isOpen={Boolean(checkResult)}
        onClose={() => setCheckResult(null)}
        title="Expiry Check Sweep Results"
        footer={
          <button type="button" className="btn btn-primary" onClick={() => setCheckResult(null)}>
            Dismiss
          </button>
        }
      >
        {checkResult && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              The scheduler evaluated all active documents against configured reminder stages for reference date{' '}
              <strong>{checkResult.referenceDate}</strong>.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Documents Checked</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  {checkResult.totalActiveDocuments}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Matched Exact Stages</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  {checkResult.matchedExpiring}
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>Dispatched Reminders</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                  {checkResult.dispatched}
                </div>
              </div>

              <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>Failed Sends</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>
                  {checkResult.failed}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div>• Duplicate sends prevented by idempotency keys: <strong>{checkResult.skippedDuplicates}</strong></div>
              <div>• Skipped due to customer preferences/no SMS consent: <strong>{checkResult.skippedPreferences}</strong></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
