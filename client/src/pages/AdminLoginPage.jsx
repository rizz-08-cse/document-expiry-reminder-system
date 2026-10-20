import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Sparkles, Lock, ArrowLeft } from 'lucide-react';

export const AdminLoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please enter admin credentials.', 'error');
      return;
    }

    try {
      setLoading(true);
      await adminLogin(identifier, password);
      showToast('Administrator authenticated successfully.', 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      showToast(err.message || 'Admin authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setIdentifier('admin@system.local');
    setPassword('ChangeMeAdmin123!');
    showToast('Default Administrator credentials loaded!', 'info');
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.25rem',
          borderTop: '4px solid #0f172a'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Restricted access for system administrators
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email or Mobile</label>
            <input
              type="text"
              className="form-control"
              placeholder="admin@system.local"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: '#0f172a',
              color: '#fff'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Enter Admin Console'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              padding: '0 0.5rem',
              color: 'var(--text-light)',
              fontSize: '0.8rem'
            }}
          >
            DEMO SEED
          </span>
        </div>

        <button
          type="button"
          onClick={handleFillDemoAdmin}
          className="btn btn-outline"
          style={{ width: '100%', fontSize: '0.85rem' }}
        >
          <Sparkles size={16} color="var(--primary)" />
          <span>Fill Demo Admin Credentials</span>
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <Link
            to="/login"
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Customer Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
