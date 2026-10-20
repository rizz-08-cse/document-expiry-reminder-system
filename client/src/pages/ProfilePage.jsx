import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { User, BellRing, Smartphone, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    smsConsent: user?.smsConsent ?? true,
    reminderPreferences: {
      daysBefore30: user?.reminderPreferences?.daysBefore30 ?? true,
      daysBefore7: user?.reminderPreferences?.daysBefore7 ?? true,
      daysBefore1: user?.reminderPreferences?.daysBefore1 ?? true,
      onExpiryDay: user?.reminderPreferences?.onExpiryDay ?? true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile(profileData);
      showToast('Profile and notification preferences saved successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update preferences.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast('Please provide your current and new password.', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.success) {
        showToast('Password changed successfully.', 'success');
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Account & Preferences</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your personal details, SMS consent, and reminder timing stages
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Profile & Contact Details */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Personal Details</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your identity information and verified phone
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registered Mobile Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.75rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    disabled
                    value={user?.phone || ''}
                    style={{ background: '#f8fafc', color: '#64748b' }}
                  />
                </div>
                <div className="form-helper">Mobile numbers are locked for SMS delivery integrity</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-control"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>

            {/* SMS Consent Section */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                margin: '1.5rem 0',
                background: profileData.smsConsent ? '#f0fdf4' : '#fff7ed'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Smartphone
                    size={22}
                    color={profileData.smsConsent ? '#16a34a' : '#d97706'}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <div>
                    <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      Automated SMS Alerts Consent
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {profileData.smsConsent
                        ? 'Active: You will receive direct SMS reminders on your mobile (+91 ' + user?.phone + ') before your documents expire.'
                        : 'Inactive: Automatic SMS dispatch is paused. You will still receive in-app notifications.'}
                    </p>
                    {user?.smsConsentUpdatedAt && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                        Consent last modified: {new Date(user.smsConsentUpdatedAt).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={profileData.smsConsent}
                    onChange={(e) =>
                      setProfileData({ ...profileData, smsConsent: e.target.checked })
                    }
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                    {profileData.smsConsent ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

            {/* Reminder Stages Preferences */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Notify Me at Configured Intervals:
              </h4>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={profileData.reminderPreferences.daysBefore30}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        reminderPreferences: {
                          ...profileData.reminderPreferences,
                          daysBefore30: e.target.checked
                        }
                      })
                    }
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>30 Days Before</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={profileData.reminderPreferences.daysBefore7}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        reminderPreferences: {
                          ...profileData.reminderPreferences,
                          daysBefore7: e.target.checked
                        }
                      })
                    }
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>7 Days Before</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={profileData.reminderPreferences.daysBefore1}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        reminderPreferences: {
                          ...profileData.reminderPreferences,
                          daysBefore1: e.target.checked
                        }
                      })
                    }
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>1 Day Before</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={profileData.reminderPreferences.onExpiryDay}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        reminderPreferences: {
                          ...profileData.reminderPreferences,
                          onExpiryDay: e.target.checked
                        }
                      })
                    }
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>On Expiry Day</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: '#f1f5f9',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Security & Password</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Keep your account secure with a strong password
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Re-type new password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-outline" disabled={savingPassword}>
              {savingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
