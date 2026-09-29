import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface UserProfile {
  id: string;
  email: string;
  accountType: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  profilePicture?: string;
}

interface SearchResponseItem {
  profile: UserProfile;
  relationshipStatus: string;
  requestId: string | null;
}

const UserSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResponseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce API calls
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`/api/users/search?query=${encodeURIComponent(trimmed)}`);
        setSuggestions(response.data || []);
      } catch (error) {
        console.error('Error fetching user suggestions:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelectUser = (email: string) => {
    navigate(`/profile?email=${encodeURIComponent(email)}`);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    const normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/uploads/') || normalizedUrl.startsWith('uploads/')) {
      const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl;
      const baseUrl = api.defaults.baseURL || 'http://localhost:9090';
      return `${baseUrl}${cleanUrl}`;
    }
    return normalizedUrl;
  };

  const getInitials = (profile: UserProfile) => {
    if (profile.accountType === 'Individual') {
      const first = profile.firstName?.charAt(0) || '';
      const last = profile.lastName?.charAt(0) || '';
      return (first + last).toUpperCase() || profile.email.charAt(0).toUpperCase();
    } else {
      return profile.organizationName?.slice(0, 2).toUpperCase() || profile.email.charAt(0).toUpperCase();
    }
  };

  const getDisplayName = (profile: UserProfile) => {
    if (profile.accountType === 'Individual') {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email;
    }
    return profile.organizationName || profile.email;
  };

  return (
    <div className="user-search-container" ref={containerRef}>
      <div className="user-search-input-wrapper">
        <svg
          className="user-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          id="user-search-input"
          data-testid="user-search-input"
          className="user-search-input"
          placeholder="Search registered users by name, email"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />
        {query && (
          <button
            type="button"
            id="user-search-clear-btn"
            data-testid="user-search-clear-btn"
            className="user-search-clear-btn"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
          >
            &times;
          </button>
        )}
      </div>

      {showSuggestions && query.trim() && (
        <div className="user-search-dropdown" id="user-search-dropdown" data-testid="user-search-dropdown">
          {loading ? (
            <div className="user-search-loading" id="user-search-loading" data-testid="user-search-loading">
              <span className="spinner"></span> Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="user-search-suggestions" id="user-search-suggestions" data-testid="user-search-suggestions">
              {suggestions.map((item) => {
                const profile = item.profile;
                const displayName = getDisplayName(profile);
                const imageUrl = profile.profilePicture ? getMediaUrl(profile.profilePicture) : '';

                return (
                  <li
                    key={profile.id}
                    id={`user-search-item-${profile.id}`}
                    data-testid={`user-search-item-${profile.email}`}
                    className="user-search-item"
                    onClick={() => handleSelectUser(profile.email)}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={displayName}
                        className="user-search-avatar"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = (e.target as HTMLImageElement).nextElementSibling;
                          if (fallback) {
                            (fallback as HTMLDivElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    {!imageUrl || imageUrl === '' ? (
                      <div className="user-search-avatar-fallback">
                        {getInitials(profile)}
                      </div>
                    ) : (
                      <div className="user-search-avatar-fallback" style={{ display: 'none' }}>
                        {getInitials(profile)}
                      </div>
                    )}
                    <div className="user-search-info">
                      <div className="user-search-name" id={`user-search-name-${profile.id}`} data-testid={`user-search-name-${profile.email}`}>{displayName}</div>
                      <div className="user-search-email" id={`user-search-email-${profile.id}`} data-testid={`user-search-email-${profile.email}`}>{profile.email}</div>
                    </div>
                    <span className="user-search-badge" id={`user-search-badge-${profile.id}`} data-testid={`user-search-badge-${profile.email}`}>
                      {profile.accountType}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="user-search-no-results" id="user-search-no-results" data-testid="user-search-no-results">No users found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
