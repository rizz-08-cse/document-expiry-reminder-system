import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requireRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="skeleton"
            style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem auto' }}
          />
          <p style={{ color: '#64748b' }}>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = requireRole === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={redirectUrl} state={{ from: location }} replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    const fallbackUrl = user?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={fallbackUrl} replace />;
  }

  return children;
};
