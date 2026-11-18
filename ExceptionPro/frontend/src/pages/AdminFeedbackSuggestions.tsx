import React, { useEffect, useState } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';
import type { FeedbackSuggestionRecord } from './FeedbackAndSuggestions';

const AdminFeedbackSuggestions: React.FC = () => {
  const [items, setItems] = useState<FeedbackSuggestionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'feedback' | 'suggestions'>('feedback');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<FeedbackSuggestionRecord | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'feedback' | 'suggestion'>('feedback');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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

  const fetchAllFeedbackSuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/feedback-suggestions');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load Feedback & Suggestions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFeedbackSuggestions();
  }, []);

  const getAccountBadgeClass = (type?: string) => {
    switch (type) {
      case 'Individual':
        return 'badge badge-individual';
      case 'Buyer':
        return 'badge badge-buyer';
      case 'Supplier':
        return 'badge badge-supplier';
      default:
        return 'badge badge-hybrid';
    }
  };

  const feedbackItems = items.filter(
    (item) => Boolean(item.feedbackText && item.feedbackText.trim() !== '') || item.submissionType === 'Feedback'
  );

  const suggestionItems = items.filter(
    (item) => Boolean(item.suggestionText && item.suggestionText.trim() !== '') || item.submissionType === 'Suggestion'
  );

  return (
    <div className="feed-layout-container" style={{ maxWidth: '1400px', width: '100%' }}>
      {/* Left Sidebar */}
      <LeftNavigation activePage="admin-feedback-suggestions" />

      {/* Main Content */}
      <div className="feed-center-column" style={{ flex: 1, maxWidth: '100%', width: '100%' }}>
        <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
                Feedback &amp; Suggestions
              </h2>
              <p className="card-subtitle" style={{ margin: 0 }}>
                Review all user-submitted Feedbacks and Suggestions across the platform
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '0.45rem 1rem', margin: 0 }}
              onClick={fetchAllFeedbackSuggestions}
            >
              Refresh
            </button>
          </div>

          {/* Two Section Tabs: a) Feedback | b) Suggestions */}
          <nav className="policy-nav-tabs" aria-label="Admin Feedback and Suggestions sections" style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              className={`policy-nav-tab ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
              style={{ cursor: 'pointer', border: 'none', background: activeTab === 'feedback' ? undefined : 'transparent' }}
            >
              Feedback ({feedbackItems.length})
            </button>
            <button
              type="button"
              className={`policy-nav-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
              style={{ cursor: 'pointer', border: 'none', background: activeTab === 'suggestions' ? undefined : 'transparent' }}
            >
              Suggestions ({suggestionItems.length})
            </button>
          </nav>

          {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Feedback &amp; Suggestions...</div>
          ) : activeTab === 'feedback' ? (
            /* =================================================================
               a) FEEDBACK SECTION — CARD-BASED LAYOUT
               ================================================================= */
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Submitted Feedbacks ({feedbackItems.length})
              </h3>

              {feedbackItems.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                  }}
                >
                  No Feedbacks have been submitted yet.
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    width: '100%',
                  }}
                >
                  {feedbackItems.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div>
                        {/* Card Top Header */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.75rem',
                            marginBottom: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                              }}
                            >
                              #{index + 1}
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: 'var(--accent-primary, #6366f1)',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                              }}
                            >
                              Feedback
                            </span>
                            <span className={getAccountBadgeClass(item.accountType)}>
                              {item.accountType || 'Member'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                          </span>
                        </div>

                        {/* Submitter Profile / Organization & Email */}
                        <div style={{ marginBottom: '0.85rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                            Submitted By
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                            {item.userName || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                            {item.userEmail}
                          </div>
                        </div>

                        {/* Feedback Content */}
                        <div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                            Feedback Message
                          </div>
                          <div
                            style={{
                              background: 'var(--glass-bg)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '0.85rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                              lineHeight: 1.55,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.feedbackText || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Action */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.75rem',
                        }}
                      >
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.35rem 0.9rem', fontSize: '0.82rem' }}
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedItemType('feedback');
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* =================================================================
               b) SUGGESTIONS SECTION — CARD-BASED LAYOUT
               ================================================================= */
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Submitted Suggestions ({suggestionItems.length})
              </h3>

              {suggestionItems.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                  }}
                >
                  No Suggestions have been submitted yet.
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                    width: '100%',
                  }}
                >
                  {suggestionItems.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        width: '100%',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div>
                        {/* Card Top Header */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '0.75rem',
                            marginBottom: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                              }}
                            >
                              #{index + 1}
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                              }}
                            >
                              Suggestion
                            </span>
                            <span className={getAccountBadgeClass(item.accountType)}>
                              {item.accountType || 'Member'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                          </span>
                        </div>

                        {/* Submitter Profile / Organization & Email */}
                        <div style={{ marginBottom: '0.85rem' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                            Submitted By
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                            {item.userName || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                            {item.userEmail}
                          </div>
                        </div>

                        {/* Suggestions / Detailed Steps Content */}
                        <div style={{ marginBottom: item.screenshotUrl ? '0.85rem' : 0 }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                            Suggestions (Detailed Steps)
                          </div>
                          <div
                            style={{
                              background: 'var(--glass-bg)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '0.85rem',
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                              lineHeight: 1.55,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.suggestionText || '—'}
                          </div>
                        </div>

                        {/* Optional Attached Screenshot */}
                        {item.screenshotUrl && (
                          <div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                              Attached Screenshot
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'var(--glass-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '0.6rem',
                              }}
                            >
                              <img
                                src={getMediaUrl(item.screenshotUrl)}
                                alt={item.screenshotFileName || 'Screenshot'}
                                style={{
                                  width: '64px',
                                  height: '64px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setPreviewImageUrl(getMediaUrl(item.screenshotUrl))}
                                title="Click to view screenshot"
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    marginBottom: '0.35rem',
                                  }}
                                >
                                  {item.screenshotFileName || 'Screenshot Image'}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', width: 'auto', margin: 0 }}
                                  onClick={() => setPreviewImageUrl(getMediaUrl(item.screenshotUrl))}
                                >
                                  View Image
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Action */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.75rem',
                        }}
                      >
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.35rem 0.9rem', fontSize: '0.82rem' }}
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedItemType('suggestion');
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setSelectedItem(null)}>
              &times;
            </button>
            <h3
              className="card-title"
              style={{
                fontSize: '1.4rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem',
              }}
            >
              {selectedItemType === 'feedback' ? 'Feedback Details' : 'Suggestion Details'}
            </h3>

            <div
              style={{
                marginTop: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Submitted By:</strong>
                  <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600 }}>{selectedItem.userName}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email Address:</strong>
                  <p style={{ margin: '0.2rem 0 0 0' }}>{selectedItem.userEmail}</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Account Type:</strong>
                  <p style={{ margin: '0.2rem 0 0 0' }}>
                    <span className={getAccountBadgeClass(selectedItem.accountType)}>
                      {selectedItem.accountType || 'Member'}
                    </span>
                  </p>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Submitted On:</strong>
                  <p style={{ margin: '0.2rem 0 0 0' }}>
                    {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : '—'}
                  </p>
                </div>
              </div>

              {selectedItemType === 'feedback' ? (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Feedback:
                  </strong>
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedItem.feedbackText || 'No feedback text provided.'}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                      Suggestions / Detailed Steps:
                    </strong>
                    <div
                      style={{
                        background: 'var(--bg-secondary)',
                        padding: '0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {selectedItem.suggestionText || 'No suggestion / defect steps provided.'}
                    </div>
                  </div>

                  {selectedItem.screenshotUrl && (
                    <div>
                      <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.45rem' }}>
                        Attached Screenshot ({selectedItem.screenshotFileName || 'Image'}):
                      </strong>
                      <img
                        src={getMediaUrl(selectedItem.screenshotUrl)}
                        alt={selectedItem.screenshotFileName || 'Screenshot'}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '360px',
                          borderRadius: '8px',
                          objectFit: 'contain',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                        }}
                        onClick={() => setPreviewImageUrl(getMediaUrl(selectedItem.screenshotUrl))}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewImageUrl && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewImageUrl(null)}
          style={{ zIndex: 2000 }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '900px', width: '92%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setPreviewImageUrl(null)}>
              &times;
            </button>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              Screenshot Image
            </h3>
            <img
              src={previewImageUrl}
              alt="Full Screenshot"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: '8px',
                objectFit: 'contain',
                border: '1px solid var(--border-color)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackSuggestions;
