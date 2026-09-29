import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

export interface NotificationItem {
  id: string;
  recipientId: string;
  recipientEmail: string;
  senderId?: string;
  senderEmail?: string;
  senderName: string;
  category: 'REQUISITIONS' | 'COLLABORATIONS' | 'POSTS' | 'MY_POST' | string;
  title: string;
  message: string;
  supplierComment?: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

type TabCategory = 'ALL' | 'REQUISITIONS' | 'COLLABORATIONS' | 'POSTS' | 'MY_POST';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabCategory>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const categoryParam = activeTab === 'ALL' ? '' : activeTab;
      const res = await api.get(`/api/notifications${categoryParam ? `?category=${categoryParam}` : ''}`);
      setNotifications(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCategoryBadge = (category: string) => {
    const catUpper = (category || '').toUpperCase();
    switch (catUpper) {
      case 'REQUISITIONS':
        return <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Requisitions</span>;
      case 'COLLABORATIONS':
        return <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Collaborations</span>;
      case 'POSTS':
        return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Posts</span>;
      case 'MY_POST':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>My Post</span>;
      default:
        return <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>General</span>;
    }
  };

  const tabs: { key: TabCategory; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'REQUISITIONS', label: 'Requisitions' },
    { key: 'COLLABORATIONS', label: 'Collaborations' },
    { key: 'POSTS', label: 'Posts' },
    { key: 'MY_POST', label: 'My Post' },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="feed-container" style={{ maxWidth: '100%', width: '100%', padding: '2rem', boxSizing: 'border-box' }}>
      <LeftNavigation activePage="notifications" />

      <main style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxSizing: 'border-box' }}>
        
        {/* Page Header */}
        <div className="glass-card glass-card-lg" style={{ padding: '2rem 2rem 1.25rem 2rem', width: '100%', maxWidth: 'none', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.6rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.8rem', background: 'var(--accent-primary)', color: '#fff', borderRadius: '20px', padding: '0.15rem 0.6rem', fontWeight: 700 }}>
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="card-subtitle" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
                Stay updated with activity across Requisitions, Collaborations, and Social Posts
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', width: 'auto', margin: 0, fontWeight: 600 }}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* LinkedIn-Style Horizontal Category Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
              overflowX: 'auto',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '20px',
                    border: isActive ? 'none' : '1px solid var(--border-color)',
                    background: isActive ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List Section */}
        <div className="glass-card glass-card-lg" style={{ padding: '1.5rem', width: '100%', maxWidth: 'none', boxSizing: 'border-box' }}>
          {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.75rem', opacity: 0.5 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>No notifications found</h4>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>There are no {activeTab !== 'ALL' ? activeTab.toLowerCase().replace('_', ' ') : ''} notifications at this time.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
              {notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markAsRead(item.id)}
                  style={{
                    background: item.isRead ? 'var(--bg-secondary)' : 'rgba(59, 130, 246, 0.04)',
                    border: item.isRead ? '1px solid var(--border-color)' : '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    cursor: item.isRead ? 'default' : 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Item Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--accent-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        {item.senderName ? item.senderName.charAt(0).toUpperCase() : 'N'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {item.senderName}
                          </span>
                          {getCategoryBadge(item.category)}
                        </div>
                        <h4 style={{ margin: '0.15rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatTimestamp(item.createdAt)}
                      </span>
                      {!item.isRead && (
                        <span
                          title="Unread"
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Main Message */}
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.45', width: '100%' }}>
                    {item.message}
                  </p>

                  {/* Supplier Response Comment Highlight Box (Full Supplier Comments) */}
                  {item.supplierComment && (
                    <div
                      style={{
                        background: 'var(--bg-primary)',
                        borderLeft: '4px solid var(--accent-primary)',
                        padding: '0.85rem 1rem',
                        borderRadius: '0 8px 8px 0',
                        marginTop: '0.25rem',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', letterSpacing: '0.5px', display: 'block', marginBottom: '0.25rem' }}>
                        Supplier Response Comments / Reason
                      </span>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        "{item.supplierComment}"
                      </p>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default NotificationsPage;
