import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface LeftNavigationProps {
  activePage: 'dashboard' | 'home' | 'profile' | 'partners' | 'catalogue' | 'requisition' | 'request-notification' | 'collaboration-requisition' | 'collaboration-request-notification' | 'notifications' | 'admin' | 'admin-manage-posts' | 'admin-feedback-suggestions' | 'feedback-suggestions' | 'admin-support-platform' | 'support-platform' | 'invoices' | 'purchase-receipts' | 'replacement-requests' | 'reconciliation' | 'payments';
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
  const isAdmin = user?.role === 'ROLE_ADMIN' || (user?.email || '').toLowerCase().trim() === 'admin@exceptionpro.com';

  const isSupplier = !isAdmin && (accountTypeRaw.includes('supplier') || accountTypeRaw === '');
  const isBuyer = !isAdmin && (accountTypeRaw.includes('buyer') || accountTypeRaw === '');

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
          {/* 1. Dashboard: FIRST item in Left Navigation for Suppliers and Buyers */}
          {(isBuyer || isSupplier) && (
            <a
              href="/dashboard"
              className={`sidebar-link ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                <rect x="3" y="16" width="7" height="5" rx="1"></rect>
              </svg>
              Dashboard
            </a>
          )}
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

          {isBuyer && (
            <a
              href="/replacement-requests"
              className={`sidebar-link ${activePage === 'replacement-requests' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/replacement-requests'); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Replacement Requests
            </a>
          )}

          {isSupplier && !isBuyer && (
            <a
              href="/purchase-receipts"
              className={`sidebar-link ${activePage === 'purchase-receipts' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/purchase-receipts'); }}
              title="Receipt Confirmations / Receipt Acknowledgements"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                <rect x="9" y="3" width="6" height="4" rx="1"></rect>
                <path d="M9 14l2 2 4-4"></path>
              </svg>
              Receipts
            </a>
          )}

          {isSupplier && !isBuyer && (
            <a
              href="/replacements"
              className={`sidebar-link ${activePage === 'replacement-requests' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/replacements'); }}
              title="Replacements Confirmations / Replacements Acknowledgements"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Replacements
            </a>
          )}

          {/* Invoices: Displayed for Buyer and Supplier */}
          {(isBuyer || isSupplier) && (
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
          )}

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

          {isAdmin && (
            <>
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
              <a
                href="/admin/manage-posts"
                className={`sidebar-link ${activePage === 'admin-manage-posts' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); navigate('/admin/manage-posts'); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                Manage Posts
              </a>
              <a
                href="/admin/feedback-suggestions"
                className={`sidebar-link ${activePage === 'admin-feedback-suggestions' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); navigate('/admin/feedback-suggestions'); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Feedback &amp; Suggestions
              </a>
              <a
                href="/admin/support-our-platform"
                className={`sidebar-link ${activePage === 'admin-support-platform' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); navigate('/admin/support-our-platform'); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Support Our Platform
              </a>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default LeftNavigation;
