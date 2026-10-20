import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Settings,
  Smartphone,
  ShieldCheck,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [smsStatus, setSmsStatus] = useState(null);
  const [cronSchedule, setCronSchedule] = useState('');
  const [timezone, setTimezone] = useState('');

  // Settings form state
  const [smsSimulationMode, setSmsSimulationMode] = useState(true);
  const [stages, setStages] = useState([30, 7, 1, 0]);
  const [savingSettings, setSavingSettings] = useState(false);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [testRecipientName, setTestRecipientName] = useState('');
  const [isExplicitConfirmation, setIsExplicitConfirmation] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.success) {
        setSmsStatus(res.smsStatus);
        setCronSchedule(res.configuredCronSchedule);
        setTimezone(res.configuredTimezone);
        if (res.smsStatus) {
          setSmsSimulationMode(res.smsStatus.isSimulationMode);
        }
      }
    } catch (err) {
      showToast('Failed to load system settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await api.put('/admin/settings', {
        smsSimulationMode,
        reminderStages: stages
      });
      if (res.success) {
        showToast('System configuration updated successfully.', 'success');
        fetchSettings();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendTestSMS = async (e) => {
    e.preventDefault();
    if (!testPhone) {
      showToast('Please enter target phone number.', 'error');
      return;
    }
    if (!isExplicitConfirmation) {
      showToast('Please explicitly confirm recipient authorization.', 'error');
      return;
    }

    try {
      setSendingTest(true);
      const res = await api.post('/admin/test-sms', {
        phone: testPhone,
        recipientName: testRecipientName,
        isExplicitConfirmation: true
      });
      setTestResult(res);
      if (res.success) {
        showToast('Test SMS dispatch completed!', 'success');
      } else {
        showToast(res.message || 'Test SMS returned failure.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send test SMS.', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>System & SMS Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Configure automated expiry sweeps, MSG91 gateway credentials, and test SMS dispatches
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Gateway Status Summary Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>SMS Gateway Diagnostics</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Active provider configuration status
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}
          >
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Provider Engine:</div>
              <div style={{ fontWeight: '600', textTransform: 'uppercase', color: 'var(--primary)' }}>
                {smsStatus?.activeProvider}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MSG91 Credentials:</div>
              <div style={{ fontWeight: '600' }}>
                {smsStatus?.msg91Configured ? 'Configured (Auth Key Set)' : 'Not Configured (Demo Fallback)'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DLT Sender ID:</div>
              <div style={{ fontWeight: '600' }}>{smsStatus?.senderId}</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scheduler Engine:</div>
              <div style={{ fontWeight: '600' }}>
                cron: {cronSchedule} ({timezone})
              </div>
            </div>
          </div>

          {/* Simulation Toggle Form */}
          <form onSubmit={handleSaveSettings}>
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                background: smsSimulationMode ? '#f8fafc' : '#f0fdf4',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                    Safe Simulation / Demo Mode
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    When enabled, automated sweeps and test dispatches log simulated messages in the
                    database and console without charging or transmitting to real telecommunication
                    carriers. Uncheck only when ready for real MSG91 carrier transmission.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={smsSimulationMode}
                  onChange={(e) => setSmsSimulationMode(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Authorized Test SMS Tool */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600' }}>Authorized Test SMS Tool</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Verify SMS gateway dispatch with strict recipient confirmation
              </p>
            </div>
          </div>

          <form onSubmit={handleSendTestSMS}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Recipient Mobile Number *</label>
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
                    type="tel"
                    className="form-control"
                    placeholder="9876543210"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Recipient Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Admin Tester"
                  value={testRecipientName}
                  onChange={(e) => setTestRecipientName(e.target.value)}
                />
              </div>
            </div>

            {/* Explicit Confirmation Checkbox */}
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              <input
                type="checkbox"
                id="explicitConfirmation"
                checked={isExplicitConfirmation}
                onChange={(e) => setIsExplicitConfirmation(e.target.checked)}
                style={{ marginTop: '0.25rem', width: '16px', height: '16px', accentColor: '#d97706' }}
              />
              <label htmlFor="explicitConfirmation" style={{ fontSize: '0.85rem', color: '#92400e', cursor: 'pointer', lineHeight: 1.4 }}>
                <strong>Explicit Recipient Authorization:</strong> I verify that this target mobile
                number is authorized for diagnostic testing and that this action is audited.
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sendingTest || !isExplicitConfirmation}
            >
              <Send size={16} />
              <span>{sendingTest ? 'Dispatching Test...' : 'Dispatch Test SMS'}</span>
            </button>
          </form>

          {/* Test SMS Response Banner */}
          {testResult && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: testResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {testResult.success ? (
                  <CheckCircle2 size={18} color="#16a34a" />
                ) : (
                  <AlertTriangle size={18} color="#dc2626" />
                )}
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                  {testResult.success ? 'Dispatch Succeeded' : 'Dispatch Failed'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{testResult.message}</p>
              {testResult.details && (
                <pre
                  style={{
                    background: 'rgba(0,0,0,0.05)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    overflowX: 'auto'
                  }}
                >
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
