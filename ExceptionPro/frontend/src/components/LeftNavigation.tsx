import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface LeftNavigationProps {
  activePage: 'home' | 'profile' | 'partners' | 'catalogue' | 'requisition' | 'request-notification' | 'collaboration-requisition' | 'collaboration-request-notification' | 'notifications' | 'admin' | 'invoices' | 'purchase-receipts' | 'reconciliation' | 'payments';
}

const LeftNavigation: React.FC<LeftNavigationProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  const getMediaUrl = (url?: string) => {
    if (!url) return '';
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('uploads/')) {
      const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl;
      const baseUrl = api.defaults.baseURL || 'http://localhost:9090';
      return `${baseUrl}${cleanUrl}`;
    }
    return normalizedUrl;
  };

  useEffect(() => {
    if (!user) return;
    const fetchProfilePic = async () => {
      try {
        const res = await api.get('/api/users/me');
        if (res.data && res.data.profilePicture) {
          setProfilePictureUrl(getMediaUrl(res.data.profilePicture));
        }
      } catch (err) {
        // silent fail
      }
    };
    fetchProfilePic();
  }, [user]);

  const accountTypeRaw = (user?.accountType || '').toLowerCase().trim();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const isSupplier = accountTypeRaw.includes('supplier') || accountTypeRaw === '' || isAdmin;
  const isBuyer = accountTypeRaw.includes('buyer') || accountTypeRaw === '' || isAdmin;

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <aside className="feed-left-sidebar" style={{ width: '260px' }}>
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* User Profile Summary Card (Clickable to view profile) */}
        <div
          className="glass-card"
          style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
          onClick={handleProfileClick}
          title="Click to view My Profile"
        >
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem auto', display: 'block', boxShadow: 'var(--shadow-sm)' }}
            />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gradient)', margin: '0 auto 0.75rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {(user?.email || '').trim().charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem', wordBreak: 'break-all' }}>{user?.email}</h4>
          <span className="badge badge-individual" style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>
            {user?.role === 'ROLE_ADMIN' ? 'Admin' : user?.accountType || 'Member'}
          </span>
        </div>

        {/* Sidebar Navigation Options */}
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          {isSupplier && (
            <a
              href="/catalogue"
              className={`sidebar-link ${activePage === 'catalogue' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/catalogue'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Catalogue
            </a>
          )}

          {isSupplier && (
            <a
              href="/request-notification"
              className={`sidebar-link ${activePage === 'request-notification' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/request-notification'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Purchase Requests
            </a>
          )}

          {isSupplier && (
            <a
              href="/collaboration-request-notification"
              className={`sidebar-link ${activePage === 'collaboration-request-notification' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/collaboration-request-notification'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Collaboration Requests
            </a>
          )}

          {isBuyer && (
            <a
              href="/requisition"
              className={`sidebar-link ${activePage === 'requisition' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/requisition'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Requisition
            </a>
          )}

          {isBuyer && (
            <a
              href="/collaboration-requisition"
              className={`sidebar-link ${activePage === 'collaboration-requisition' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/collaboration-requisition'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Collaboration Requisition
            </a>
          )}

          {isBuyer && (
            <a
              href="/purchase-receipts"
              className={`sidebar-link ${activePage === 'purchase-receipts' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/purchase-receipts'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                <rect x="9" y="3" width="6" height="4" rx="1"></rect>
                <path d="M9 14l2 2 4-4"></path>
              </svg>
              Purchase Receipts
            </a>
          )}

          {/* Invoices: Displayed for Buyer and Supplier */}
          <a
            href="/invoices"
            className={`sidebar-link ${activePage === 'invoices' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); navigate('/invoices'); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Invoices
          </a>

          {/* Reconciliation: Displayed for Buyer */}
          {isBuyer && (
            <a
              href="/reconciliation"
              className={`sidebar-link ${activePage === 'reconciliation' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/reconciliation'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5"></path>
                <path d="M4 20L21 3"></path>
                <path d="M21 16v5h-5"></path>
                <path d="M15 15l6 6"></path>
                <path d="M4 4l5 5"></path>
              </svg>
              Reconciliation
            </a>
          )}

          {/* Payments: Displayed for Buyer and Supplier */}
          {(isBuyer || isSupplier) && (
            <a
              href="/payments"
              className={`sidebar-link ${activePage === 'payments' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/payments'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              Payments
            </a>
          )}

          {user?.role === 'ROLE_ADMIN' && (
            <a
              href="/admin"
              className={`sidebar-link ${activePage === 'admin' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Admin Dashboard
            </a>
          )}
        </div>
      </div>
    </aside>
  );
};

export default LeftNavigation;
