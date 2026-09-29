import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSearch from './UserSearch';
import api from '../services/api';

interface UserProfileDetails {
  organizationName?: string;
  accountType?: string;
  profilePicture?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

const HeaderNav: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<UserProfileDetails | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Fetch full user profile details on mount / when user changes
  useEffect(() => {
    if (!user) {
      setProfileData(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/api/users/me');
        setProfileData(res.data);
      } catch (err) {
        console.error('HeaderNav: Failed to fetch user profile', err);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Fetch unread messages count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/api/messages/conversations');
        const convs = res.data || [];
        const totalUnread = convs.reduce((acc: number, curr: any) => acc + (curr.unreadCount || 0), 0);
        setUnreadMessages(totalUnread);
      } catch (err) {
        // silent fail
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside handler for Facebook-style profile dropdown flyout
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavToPartners = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/profile', { state: { activeTab: 'partners' } });
  };

  const handleViewProfile = () => {
    setShowProfileDropdown(false);
    navigate('/profile');
  };

  const avatarUrl = profileData?.profilePicture ? getMediaUrl(profileData.profilePicture) : '';
  const displayName = profileData?.firstName && profileData?.lastName 
    ? `${profileData.firstName} ${profileData.lastName}` 
    : (profileData?.organizationName || user?.email || '');

  const organizationNameDisplay = profileData?.organizationName?.trim() || 'N/A';
  const accountTypeDisplay = profileData?.accountType || user?.accountType || (user?.role === 'ROLE_ADMIN' ? 'Admin' : 'Member');
  const userInitial = (user?.email || '').trim().charAt(0).toUpperCase() || 'U';

  const isHomeActive = location.pathname === '/feed' || location.pathname === '/';
  const isPartnersActive = location.pathname === '/profile' && location.state?.activeTab === 'partners';
  const isNotificationsActive = location.pathname === '/notifications';
  const isMessagingActive = location.pathname === '/messaging';

  return (
    <nav className="navbar" id="header-navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">ExceptionPro</Link>
        {user && <UserSearch />}
      </div>

      <div className="navbar-menu">
        {user ? (
          <>
            {/* 1. Home Icon with Home Label */}
            <Link
              to="/feed"
              className={`nav-link nav-icon-link ${isHomeActive ? 'active' : ''}`}
              title="Home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Home</span>
            </Link>

            {/* 2. Business Partners Icon with Business Partners Label */}
            <a
              href="/profile?tab=partners"
              onClick={handleNavToPartners}
              className={`nav-link nav-icon-link ${isPartnersActive ? 'active' : ''}`}
              title="Business Partners"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Business Partners</span>
            </a>

            {/* 3. Notifications Icon with Notifications Label */}
            <Link
              to="/notifications"
              className={`nav-link nav-icon-link ${isNotificationsActive ? 'active' : ''}`}
              title="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>Notifications</span>
            </Link>

            {/* 4. Messaging Icon with Messaging Label */}
            <Link
              to="/messaging"
              className={`nav-link nav-icon-link ${isMessagingActive ? 'active' : ''}`}
              title="Messaging"
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {unreadMessages > 0 && (
                  <span className="header-unread-badge">{unreadMessages}</span>
                )}
              </div>
              <span>Messaging</span>
            </Link>

            {/* 5. Top Right Round Profile Picture with Flyout Window (Facebook style) */}
            <div className="profile-flyout-container" ref={dropdownRef}>
              <button
                type="button"
                className="profile-avatar-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                aria-label="Toggle profile menu"
                title="Profile Menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {userInitial}
                  </div>
                )}
              </button>

              {/* Facebook-style Flyout Window Dropdown */}
              {showProfileDropdown && (
                <div className="profile-flyout-window" id="profile-flyout-window">
                  <div className="profile-flyout-header">
                    <div className="profile-flyout-avatar-large">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <div className="profile-flyout-user-info">
                      <div className="profile-flyout-name">{displayName}</div>
                      <div className="profile-flyout-email">{user.email}</div>
                    </div>
                  </div>

                  <div className="profile-flyout-divider" />

                  {/* Profile Metadata details */}
                  <div className="profile-flyout-details">
                    <div className="profile-detail-row">
                      <span className="detail-label">Organization:</span>
                      <span className="detail-value">{organizationNameDisplay}</span>
                    </div>
                    <div className="profile-detail-row">
                      <span className="detail-label">Account Type:</span>
                      <span className="detail-value badge-account-type">{accountTypeDisplay}</span>
                    </div>
                  </div>

                  <div className="profile-flyout-divider" />

                  {/* Actions */}
                  <div className="profile-flyout-actions">
                    <button
                      type="button"
                      className="profile-flyout-btn view-profile-btn"
                      onClick={handleViewProfile}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      View Profile
                    </button>

                    <button
                      type="button"
                      className="profile-flyout-btn logout-btn"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        logout();
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="nav-btn">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default HeaderNav;
