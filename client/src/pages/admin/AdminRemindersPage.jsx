import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Send, RefreshCw, Smartphone, AlertCircle, Calendar, Hash } from 'lucide-react';

export const AdminRemindersPage = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [retryingId, setRetryingId] = useState(null);

  const fetchReminderLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reminders', {
        status: statusFilter,
        stage: stageFilter,
        page
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotalPages(res.pages || 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch reminder logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminderLogs();
  }, [statusFilter, stageFilter, page]);

  const handleRetry = async (logId) => {
    try {
      setRetryingId(logId);
      const res = await api.post(`/admin/reminders/${logId}/retry`);
      if (res.success) {
        showToast('Reminder retried successfully.', 'success');
        fetchReminderLogs();
      }
    } catch (err) {
      showToast(err.message || 'Retry failed.', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Reminder Dispatches & Audit</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Inspect automated SMS attempts, idempotency keys, provider responses, and error logs
        </p>
      </div>

      {/* Filters */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Dispatch Status:
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
            <option value="all">All Statuses</option>
            <option value="simulated">Simulated (Demo)</option>
            <option value="provider_accepted">Provider Accepted (MSG91)</option>
            <option value="failed">Failed</option>
            <option value="attempted">Attempted</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            Stage:
          </span>
          <select
            className="form-control"
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: 'auto' }}
          >
            <option value="all">All Stages</option>
            <option value="30_days">30 Days</option>
            <option value="7_days">7 Days</option>
            <option value="1_day">1 Day</option>
            <option value="expiry_day">Expiry Day</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: '52px' }} />
            ))}
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Send size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No reminder logs found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Logs will appear when automatic sweeps run or test SMS are dispatched.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Recipient / Customer</th>
                <th>Target Document</th>
                <th>Stage</th>
                <th>Idempotency Key</th>
                <th>Status</th>
                <th>Provider & Response</th>
                <th>Attempt Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
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
                      {log.stage?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Hash size={12} color="var(--text-light)" />
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.idempotencyKey.slice(-16)}...
                      </code>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        {log.provider}
                      </span>
                    </div>
                    {log.errorMessage ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-red)' }}>
                        {log.errorMessage}
                      </span>
                    ) : (
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.providerResponseId || 'OK'}
                      </code>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {log.retryCount > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                        Retried {log.retryCount}x
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {log.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(log._id)}
                        className="btn btn-outline btn-sm"
                        disabled={retryingId === log._id || log.retryCount >= 3}
                        title="Retry manual send"
                      >
                        <RefreshCw size={14} />
                        <span>{retryingId === log._id ? 'Retrying...' : 'Retry Send'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
};
