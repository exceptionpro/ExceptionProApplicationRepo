import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff', color: '#0f172a' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Enforce social login profile completion redirect (AD-2)
  if (!user.profileComplete && location.pathname !== '/profile-completion') {
    return <Navigate to="/profile-completion" replace />;
  }

  // Block accessing completion page if already complete
  if (user.profileComplete && location.pathname === '/profile-completion') {
    return <Navigate to="/feed" replace />;
  }

  // Enforce Admin role checks (AD-1)
  if (requireAdmin && user.role !== 'ROLE_ADMIN') {
    return (
      <div className="main-content">
        <div className="glass-card text-center" style={{ textAlign: 'center' }}>
          <h2 className="card-title" style={{ color: '#ef4444' }}>403 Forbidden</h2>
          <p className="card-subtitle">You do not have permission to access the Admin Dashboard.</p>
          <Navigate to="/feed" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;
