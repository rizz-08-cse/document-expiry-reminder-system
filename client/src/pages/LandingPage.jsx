import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  BellRing,
  Calendar,
  FileCheck2,
  Clock,
  ArrowRight,
  Shield,
  Smartphone,
  Lock
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
          padding: '4rem 2rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '1.5rem'
            }}
          >
            <ShieldCheck size={16} />
            <span>Smart Expiry Reminders for India</span>
          </div>

          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              lineHeight: 1.2,
              marginBottom: '1.25rem'
            }}
          >
            Never Pay Fines or Face Delays for{' '}
            <span style={{ color: 'var(--primary)' }}>Expired Documents</span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-muted)',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}
          >
            Track your Driving Licence, Passport, Vehicle Insurance, RC, and certifications with
            automated SMS alerts scheduled in Indian Standard Time (IST). Privacy-first: no
            identity document images required.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
              <span>Get Started Free</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}>
              <span>Customer Sign In</span>
            </Link>
            <Link to="/admin/login" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              <Shield size={16} />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section style={{ maxWidth: '1100px', margin: '4rem auto 0 auto', padding: '0 2rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Designed for Everyday Peace of Mind
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3rem' }}>
          Built with precision scheduling, privacy isolation, and multi-channel notification support.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem'
          }}
        >
          <div className="card">
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Smartphone size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Automated SMS Alerts
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Receive direct SMS notifications at 30 days, 7 days, 1 day before expiry, and on the
              exact expiry date via MSG91 Flow API.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-green-light)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Privacy & Zero Doc Scans
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Your sensitive identity files stay safe with you. We only record document names and expiry
              dates with strict customer-level tenant isolation.
            </p>
          </div>

          <div className="card">
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-purple-light)',
                color: 'var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              <Clock size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Asia/Kolkata Persistent Cron
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Engineered with MongoDB idempotency keys so restarts and daily scheduler sweeps never
              send annoying duplicate reminders.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Demo Credentials Box */}
      <section
        style={{
          maxWidth: '900px',
          margin: '3.5rem auto 0 auto',
          padding: '0 2rem'
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '2px dashed var(--primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <FileCheck2 size={24} color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              Instant Demo Testing Credentials
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            The development environment comes pre-seeded with realistic sample accounts. You can also
            click the quick autofill buttons directly on the login pages:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem'
            }}
          >
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Customer Account:
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Mobile: <code style={{ color: 'var(--primary)', fontWeight: '600' }}>9888888888</code>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Password: <code style={{ color: 'var(--primary)', fontWeight: '600' }}>Password123!</code>
              </div>
              <Link to="/login" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                Login as Customer
              </Link>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Administrator Account:
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Email: <code style={{ color: 'var(--primary)', fontWeight: '600' }}>admin@system.local</code>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Password: <code style={{ color: 'var(--primary)', fontWeight: '600' }}>ChangeMeAdmin123!</code>
              </div>
              <Link to="/admin/login" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                Login as Admin
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
