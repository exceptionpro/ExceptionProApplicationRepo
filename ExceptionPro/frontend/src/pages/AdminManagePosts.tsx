import React, { useEffect, useState } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';

export interface ReportedPostRecord {
  reportId: string;
  postId: string;
  postAuthorName: string;
  postAuthorEmail: string;
  postAccountType?: string;
  postDescription?: string;
  attachedMedia?: string[];
  mediaThumbnails?: string[];
  postStatus: string; // 'ACTIVE' | 'DISABLED' | 'DELETED'
  postDateCreated?: string;
  reportedByUserId?: string;
  reportedByUserName: string;
  reportedByUserEmail: string;
  reportedByAccountType?: string;
  reason: string;
  comments?: string;
  reportDateCreated: string;
}

const AdminManagePosts: React.FC = () => {
  const [reports, setReports] = useState<ReportedPostRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [actionPostId, setActionPostId] = useState<string | null>(null);
  const [viewingReport, setViewingReport] = useState<ReportedPostRecord | null>(null);

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

  const fetchReportedPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/reported-posts');
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reported posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedPosts();
  }, []);

  const handleDisablePost = async (postId: string) => {
    setError('');
    setSuccess('');
    setActionPostId(postId);
    try {
      await api.put(`/api/admin/posts/${postId}/disable`);
      setSuccess('Post has been disabled. It will no longer be visible to any users in the Home feed.');
      setReports((prev) =>
        prev.map((item) => (item.postId === postId ? { ...item, postStatus: 'DISABLED' } : item))
      );
      if (viewingReport && viewingReport.postId === postId) {
        setViewingReport({ ...viewingReport, postStatus: 'DISABLED' });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable post.');
    } finally {
      setActionPostId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setError('');
    setSuccess('');
    setActionPostId(postId);
    try {
      await api.delete(`/api/admin/posts/${postId}`);
      setSuccess('Post has been permanently deleted from the Home feed. You can still view the reported message here.');
      setReports((prev) =>
        prev.map((item) => (item.postId === postId ? { ...item, postStatus: 'DELETED' } : item))
      );
      if (viewingReport && viewingReport.postId === postId) {
        setViewingReport({ ...viewingReport, postStatus: 'DELETED' });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete post.');
    } finally {
      setActionPostId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    const upper = (status || 'ACTIVE').toUpperCase();
    if (upper === 'DELETED') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          Deleted
        </span>
      );
    }
    if (upper === 'DISABLED') {
      return (
        <span
          className="badge"
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          Disabled
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          padding: '0.25rem 0.6rem',
          borderRadius: '4px',
          fontWeight: 600,
        }}
      >
        Active
      </span>
    );
  };

  const renderMediaThumbnail = (mediaList?: string[]) => {
    if (!mediaList || mediaList.length === 0) {
      return <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Text Only</span>;
    }
    const firstUrl = mediaList[0];
    const ext = firstUrl.split('.').pop()?.toLowerCase() || '';
    const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(ext);
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
    const fullUrl = getMediaUrl(firstUrl);

    if (isImage) {
      return (
        <img
          src={fullUrl}
          alt="Post media"
          style={{
            width: '52px',
            height: '52px',
            objectFit: 'cover',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}
        />
      );
    }
    if (isVideo) {
      return (
        <video
          src={fullUrl}
          style={{
            width: '64px',
            height: '48px',
            objectFit: 'cover',
            borderRadius: '6px',
            background: '#000',
            border: '1px solid var(--border-color)',
          }}
          muted
        />
      );
    }
    return <span style={{ fontSize: '0.82rem' }}>📄 Attachment</span>;
  };

  return (
    <div className="feed-layout-container" style={{ maxWidth: '1400px', width: '100%' }}>
      {/* Left Sidebar */}
      <LeftNavigation activePage="admin-manage-posts" />

      {/* Main Content */}
      <div className="feed-center-column" style={{ flex: 1, maxWidth: '1150px', width: '100%' }}>
        <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
                Manage Posts — Reported Posts
              </h2>
              <p className="card-subtitle" style={{ margin: 0 }}>
                Review reported posts submitted by Buyers, Suppliers, and Individuals, and view, disable, or permanently delete them
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '0.45rem 1rem', margin: 0 }}
              onClick={fetchReportedPosts}
            >
              Refresh
            </button>
          </div>

          {error && <div className="alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
          {success && <div className="alert-success" style={{ marginTop: '1rem' }}>{success}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Reported Posts...</div>
          ) : (
            <div className="data-table-container" style={{ marginTop: '1.25rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Post Author</th>
                    <th>Media / Post Content</th>
                    <th>Reported By</th>
                    <th>Reason</th>
                    <th>Reported Message</th>
                    <th>Post Status</th>
                    <th>Reported Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((item, idx) => {
                    const isDisabled = item.postStatus?.toUpperCase() === 'DISABLED';
                    const isDeleted = item.postStatus?.toUpperCase() === 'DELETED';
                    const isBusy = actionPostId === item.postId;

                    return (
                      <tr key={item.reportId}>
                        <td>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.postAuthorName || 'N/A'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.postAuthorEmail}</div>
                        </td>
                        <td style={{ maxWidth: '220px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {renderMediaThumbnail(item.attachedMedia)}
                            <div
                              style={{
                                fontSize: '0.84rem',
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {item.postDescription || '(Media Post)'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.reportedByUserName || 'N/A'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.reportedByUserEmail}</div>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                            }}
                          >
                            {item.reason}
                          </span>
                        </td>
                        <td style={{ maxWidth: '220px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {item.comments || item.reason}
                        </td>
                        <td>{getStatusBadge(item.postStatus)}</td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                          {item.reportDateCreated ? new Date(item.reportDateCreated).toLocaleString() : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'nowrap' }}>
                            {/* a) View Button — always enabled so Admin can always read reported message */}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{
                                padding: '0.3rem 0.7rem',
                                fontSize: '0.8rem',
                                width: 'auto',
                                margin: 0,
                                fontWeight: 600,
                              }}
                              onClick={() => setViewingReport(item)}
                            >
                              View
                            </button>

                            {/* b) Disable Button */}
                            <button
                              type="button"
                              className="btn"
                              disabled={isDisabled || isDeleted || isBusy}
                              style={{
                                padding: '0.3rem 0.7rem',
                                fontSize: '0.8rem',
                                width: 'auto',
                                margin: 0,
                                background: '#f59e0b',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: isDisabled || isDeleted || isBusy ? 'not-allowed' : 'pointer',
                                opacity: isDisabled || isDeleted || isBusy ? 0.45 : 1,
                              }}
                              onClick={() => !isDisabled && !isDeleted && handleDisablePost(item.postId)}
                              title={
                                isDeleted
                                  ? 'Post is already deleted'
                                  : isDisabled
                                    ? 'Post is already disabled'
                                    : 'Disable Post'
                              }
                            >
                              Disable
                            </button>

                            {/* c) Delete Button */}
                            <button
                              type="button"
                              className="btn"
                              disabled={isDeleted || isBusy}
                              style={{
                                padding: '0.3rem 0.7rem',
                                fontSize: '0.8rem',
                                width: 'auto',
                                margin: 0,
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: isDeleted || isBusy ? 'not-allowed' : 'pointer',
                                opacity: isDeleted || isBusy ? 0.45 : 1,
                              }}
                              onClick={() => !isDeleted && handleDeletePost(item.postId)}
                              title={isDeleted ? 'Post is already deleted' : 'Delete Post Permanently'}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No reported posts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Reported Message & Post Details Modal */}
      {viewingReport && (
        <div className="modal-overlay" onClick={() => setViewingReport(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setViewingReport(null)}>
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
              Reported Post &amp; Message Details
            </h3>

            <div
              style={{
                marginTop: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem',
              }}
            >
              {/* Report Information */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>
                    🚩 Reported Message Details
                  </strong>
                  {getStatusBadge(viewingReport.postStatus)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Reported By:</span>
                    <strong>{viewingReport.reportedByUserName}</strong> ({viewingReport.reportedByUserEmail})
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Report Reason:</span>
                    <strong style={{ color: '#ef4444' }}>{viewingReport.reason}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Reported Date:</span>
                    <span>{viewingReport.reportDateCreated ? new Date(viewingReport.reportDateCreated).toLocaleString() : '—'}</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                    Reported Message / Comments:
                  </span>
                  <div
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'pre-wrap',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {viewingReport.comments && viewingReport.comments.trim() !== ''
                      ? viewingReport.comments
                      : `Reported for reason: ${viewingReport.reason}`}
                  </div>
                </div>
              </div>

              {/* Post Details */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1rem',
                }}
              >
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.6rem' }}>
                  Post Details
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Post Author:</span>
                    <strong>{viewingReport.postAuthorName}</strong> ({viewingReport.postAuthorEmail})
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'block' }}>Posted Date:</span>
                    <span>{viewingReport.postDateCreated ? new Date(viewingReport.postDateCreated).toLocaleString() : '—'}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                    Post Description:
                  </span>
                  <div
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {viewingReport.postDescription || '(No text description)'}
                  </div>
                </div>

                {viewingReport.attachedMedia && viewingReport.attachedMedia.length > 0 && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
                      Posted Media (Images / Videos):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {viewingReport.attachedMedia.map((url, idx) => {
                        const ext = url.split('.').pop()?.toLowerCase() || '';
                        const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(ext);
                        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                        const fullUrl = getMediaUrl(url);

                        if (isImage) {
                          return (
                            <img
                              key={idx}
                              src={fullUrl}
                              alt={`Reported media ${idx + 1}`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '340px',
                                borderRadius: '8px',
                                objectFit: 'contain',
                                border: '1px solid var(--border-color)',
                              }}
                            />
                          );
                        }
                        if (isVideo) {
                          return (
                            <video
                              key={idx}
                              src={fullUrl}
                              controls
                              style={{
                                maxWidth: '100%',
                                maxHeight: '340px',
                                borderRadius: '8px',
                                background: '#000',
                                border: '1px solid var(--border-color)',
                              }}
                            />
                          );
                        }
                        return (
                          <a
                            key={idx}
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
                          >
                            📎 View Attachment {idx + 1}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={
                    viewingReport.postStatus?.toUpperCase() === 'DISABLED' ||
                    viewingReport.postStatus?.toUpperCase() === 'DELETED' ||
                    actionPostId === viewingReport.postId
                  }
                  style={{
                    width: 'auto',
                    margin: 0,
                    padding: '0.45rem 1.1rem',
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor:
                      viewingReport.postStatus?.toUpperCase() === 'DISABLED' ||
                      viewingReport.postStatus?.toUpperCase() === 'DELETED'
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      viewingReport.postStatus?.toUpperCase() === 'DISABLED' ||
                      viewingReport.postStatus?.toUpperCase() === 'DELETED'
                        ? 0.45
                        : 1,
                  }}
                  onClick={() => handleDisablePost(viewingReport.postId)}
                >
                  Disable Post
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={
                    viewingReport.postStatus?.toUpperCase() === 'DELETED' ||
                    actionPostId === viewingReport.postId
                  }
                  style={{
                    width: 'auto',
                    margin: 0,
                    padding: '0.45rem 1.1rem',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor:
                      viewingReport.postStatus?.toUpperCase() === 'DELETED'
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      viewingReport.postStatus?.toUpperCase() === 'DELETED'
                        ? 0.45
                        : 1,
                  }}
                  onClick={() => handleDeletePost(viewingReport.postId)}
                >
                  Delete Post
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: 'auto', margin: 0, padding: '0.45rem 1.1rem' }}
                  onClick={() => setViewingReport(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagePosts;
