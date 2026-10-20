import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCheck, Trash2, Calendar, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export const NotificationsPage = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications', { unreadOnly: unreadOnly ? 'true' : 'false' });
      if (res.success) {
        setNotifications(res.notifications || []);
      }
    } catch (err) {
      showToast('Failed to load notifications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      showToast('Failed to update notification.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.success) {
        showToast('All notifications marked as read.', 'success');
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      showToast('Failed to mark all as read.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        showToast('Notification removed.', 'info');
      }
    } catch (err) {
      showToast('Failed to delete notification.', 'error');
    }
  };

  return (
    <div>
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Notification Center</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            In-app expiry warnings, reminder stage alerts, and system notices
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`btn ${unreadOnly ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            {unreadOnly ? 'Showing Unread' : 'Show Unread Only'}
          </button>
          <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: '60px' }} />
            ))}
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Bell size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            No notifications
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {unreadOnly
              ? 'You have read all your notifications!'
              : 'You will receive reminders here whenever any document approaches its expiry dates.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((item) => (
            <div
              key={item._id}
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft:
                  item.type === 'critical'
                    ? '4px solid var(--accent-red)'
                    : item.type === 'warning'
                    ? '4px solid var(--accent-amber)'
                    : '4px solid var(--primary)',
                background: item.isRead ? '#ffffff' : '#f0f9ff',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ marginTop: '0.2rem' }}>
                  {item.type === 'critical' ? (
                    <AlertCircle size={20} color="var(--accent-red)" />
                  ) : item.type === 'warning' ? (
                    <AlertCircle size={20} color="var(--accent-amber)" />
                  ) : (
                    <Info size={20} color="var(--primary)" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{item.title}</h4>
                    {!item.isRead && (
                      <span className="badge badge-expiring" style={{ fontSize: '0.65rem' }}>
                        New
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {item.message}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <Calendar size={12} />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(item._id)}
                    className="btn btn-outline btn-sm"
                    title="Mark as Read"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item._id)}
                  className="btn-icon"
                  title="Delete Notification"
                  style={{ color: 'var(--text-light)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
