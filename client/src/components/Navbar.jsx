import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldAlert, Bell, User, LogOut, FileText, Shield } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      const fetchUnread = async () => {
        try {
          const res = await api.get('/notifications?unreadOnly=true');
          if (res.success) {
            setUnreadCount(res.unreadCount || 0);
          }
        } catch (e) {
          // silently handle
        }
      };

      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <div className="brand-icon">
          <FileText size={22} />
        </div>
        <span>DocuExpire</span>
      </Link>

      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            {!isAdmin ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link to="/documents" className="nav-link">
                  My Documents
                </Link>
                <Link to="/notifications" className="nav-link" style={{ position: 'relative' }}>
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        borderRadius: '9999px',
                        padding: '1px 5px',
                        minWidth: '16px',
                        textAlign: 'center'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="nav-link">
                  <User size={18} />
                  <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/admin" className="nav-link">
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </Link>
                <span className="badge badge-accepted" style={{ marginLeft: '0.5rem' }}>
                  Admin Mode
                </span>
              </>
            )}

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              style={{ marginLeft: '0.5rem' }}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              Customer Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
            <Link to="/admin/login" className="nav-link" style={{ fontSize: '0.85rem' }}>
              Admin Portal
            </Link>
          </>
        )}
      </nav>
    </header>
  );
};
