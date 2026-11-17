import React, { useEffect, useState } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';
import type { FeedbackSuggestionRecord } from './FeedbackAndSuggestions';

const AdminFeedbackSuggestions: React.FC = () => {
  const [items, setItems] = useState<FeedbackSuggestionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<FeedbackSuggestionRecord | null>(null);
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
      setItems(res.data || []);
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

  return (
    <div className="feed-layout-container" style={{ maxWidth: '1400px', width: '100%' }}>
      {/* Left Sidebar */}
      <LeftNavigation activePage="admin-feedback-suggestions" />

      {/* Main Content */}
      <div className="feed-center-column" style={{ flex: 1, maxWidth: '1150px', width: '100%' }}>
        <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
                Feedback &amp; Suggestions
              </h2>
              <p className="card-subtitle" style={{ margin: 0 }}>
                All user-submitted Feedbacks and Suggestions / Defects across the platform
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

          {error && <div className="alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Feedback &amp; Suggestions...</div>
          ) : (
            <div className="data-table-container" style={{ marginTop: '1.25rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Profile / Organization</th>
                    <th>Email Address</th>
                    <th>Account Type</th>
                    <th>Type</th>
                    <th>Feedback</th>
                    <th>Suggestions (Detailed Steps)</th>
                    <th>Screenshot</th>
                    <th>Submitted Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.userName || 'N/A'}</td>
                      <td>{item.userEmail}</td>
                      <td>
                        <span className={getAccountBadgeClass(item.accountType)}>
                          {item.accountType || 'Member'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background:
                              item.submissionType === 'Feedback'
                                ? 'rgba(99, 102, 241, 0.15)'
                                : item.submissionType === 'Suggestion'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                            color:
                              item.submissionType === 'Feedback'
                                ? 'var(--accent-primary, #6366f1)'
                                : item.submissionType === 'Suggestion'
                                  ? '#10b981'
                                  : '#f59e0b',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {item.submissionType}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {item.feedbackText || '—'}
                      </td>
                      <td style={{ maxWidth: '280px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {item.suggestionText || '—'}
                      </td>
                      <td>
                        {item.screenshotUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img
                              src={getMediaUrl(item.screenshotUrl)}
                              alt={item.screenshotFileName || 'Screenshot'}
                              style={{
                                width: '44px',
                                height: '44px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                cursor: 'pointer',
                              }}
                              onClick={() => setPreviewImageUrl(getMediaUrl(item.screenshotUrl))}
                              title="Click to view screenshot"
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', margin: 0 }}
                              onClick={() => setPreviewImageUrl(getMediaUrl(item.screenshotUrl))}
                            >
                              View Image
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No Image</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="nav-btn"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                          onClick={() => setSelectedItem(item)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No Feedbacks or Suggestions have been submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
              Feedback &amp; Suggestion Details
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

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  a) Feedback:
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

              <div>
                <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  b) Suggestions / Detailed Steps:
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
