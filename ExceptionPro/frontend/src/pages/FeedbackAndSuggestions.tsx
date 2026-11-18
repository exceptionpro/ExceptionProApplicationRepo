import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface FeedbackSuggestionRecord {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  accountType?: string;
  submissionType: string;
  feedbackText?: string;
  suggestionText?: string;
  screenshotUrl?: string;
  screenshotFileName?: string;
  createdAt: string;
}

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB

const FeedbackAndSuggestions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab: 'feedback' | 'suggestions'
  const [activeTab, setActiveTab] = useState<'feedback' | 'suggestions'>('feedback');

  // i) Feedback state (Create & Inline Edit)
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);

  // ii) Suggestions state (Create & Inline Edit)
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [existingScreenshotUrl, setExistingScreenshotUrl] = useState<string>('');
  const [existingScreenshotFileName, setExistingScreenshotFileName] = useState<string>('');
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Submission & History state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [mySubmissions, setMySubmissions] = useState<FeedbackSuggestionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user) {
      fetchMySubmissions();
    }
  }, [user]);

  const fetchMySubmissions = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/api/feedback-suggestions/my');
      setMySubmissions(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silent fail
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (!e.target.files || e.target.files.length === 0) {
      setScreenshotFile(null);
      setScreenshotPreview('');
      return;
    }

    const file = e.target.files[0];
    const dotIdx = file.name.lastIndexOf('.');
    const ext = dotIdx !== -1 ? file.name.substring(dotIdx).toLowerCase() : '';

    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      setError(`Invalid image format. Allowed formats are: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Screenshot image size exceeds the 20 MB limit. Please select a smaller image.');
      e.target.value = '';
      return;
    }

    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview('');
    setExistingScreenshotUrl('');
    setExistingScreenshotFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartEditFeedback = (item: FeedbackSuggestionRecord) => {
    setError('');
    setSuccess('');
    setActiveTab('feedback');
    setEditingFeedbackId(item.id);
    setFeedbackText(item.feedbackText || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditFeedback = () => {
    setEditingFeedbackId(null);
    setFeedbackText('');
    setError('');
  };

  const handleStartEditSuggestion = (item: FeedbackSuggestionRecord) => {
    setError('');
    setSuccess('');
    setActiveTab('suggestions');
    setEditingSuggestionId(item.id);
    setSuggestionText(item.suggestionText || '');
    setExistingScreenshotUrl(item.screenshotUrl || '');
    setExistingScreenshotFileName(item.screenshotFileName || '');
    setScreenshotFile(null);
    setScreenshotPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditSuggestion = () => {
    setEditingSuggestionId(null);
    setSuggestionText('');
    handleRemoveScreenshot();
    setError('');
  };

  const handleSubmit = async (mode: 'feedback' | 'suggestion') => {
    setError('');
    setSuccess('');

    const cleanFeedback = feedbackText.trim();
    const cleanSuggestion = suggestionText.trim();

    if (mode === 'feedback' && !cleanFeedback) {
      setError('Please enter your Feedback before submitting.');
      return;
    }

    if (mode === 'suggestion' && !cleanSuggestion) {
      setError('Please enter Detailed steps in the Suggestions section before submitting.');
      return;
    }

    const editId = mode === 'feedback' ? editingFeedbackId : editingSuggestionId;

    setSubmitting(true);
    try {
      let uploadedUrl: string | undefined = mode === 'suggestion' ? existingScreenshotUrl : undefined;
      let uploadedFileName: string | undefined = mode === 'suggestion' ? existingScreenshotFileName : undefined;

      if (mode === 'suggestion' && screenshotFile) {
        const formData = new FormData();
        formData.append('file', screenshotFile);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrl = uploadRes.data?.fileUrl;
        uploadedFileName = screenshotFile.name;
      }

      const payload = {
        id: editId || undefined,
        submissionType: mode === 'feedback' ? 'Feedback' : 'Suggestion',
        feedbackText: mode === 'feedback' ? cleanFeedback : '',
        suggestionText: mode === 'suggestion' ? cleanSuggestion : '',
        screenshotUrl: uploadedUrl || '',
        screenshotFileName: uploadedFileName || '',
      };

      if (editId) {
        try {
          const res = await api.put(`/api/feedback-suggestions/${editId}`, payload);
          setMySubmissions((prev) => prev.map((r) => (r.id === editId ? res.data : r)));
        } catch {
          const res = await api.post('/api/feedback-suggestions', payload);
          setMySubmissions((prev) => prev.map((r) => (r.id === editId ? res.data : r)));
        }
      } else {
        await api.post('/api/feedback-suggestions', payload);
      }

      if (mode === 'feedback') {
        setFeedbackText('');
        setEditingFeedbackId(null);
        setSuccess(
          editId
            ? 'Your Feedback has been updated successfully!'
            : 'Your Feedback has been submitted and sent to Admin successfully!'
        );
      } else {
        setSuggestionText('');
        setEditingSuggestionId(null);
        handleRemoveScreenshot();
        setSuccess(
          editId
            ? 'Your Suggestion has been updated successfully!'
            : 'Your Suggestion has been submitted and sent to Admin successfully!'
        );
      }

      fetchMySubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save Feedback / Suggestion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackSubmissions = mySubmissions.filter(
    (item) => Boolean(item.feedbackText && item.feedbackText.trim() !== '') || item.submissionType === 'Feedback'
  );

  const suggestionSubmissions = mySubmissions.filter(
    (item) => Boolean(item.suggestionText && item.suggestionText.trim() !== '') || item.submissionType === 'Suggestion'
  );

  return (
    <div className="policy-page-wrapper">
      <div className="policy-container">
        {/* Top Navigation Bar (same style as Terms and Conditions) */}
        <div className="policy-top-bar">
          <button
            type="button"
            className="policy-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Two-Tab Switcher: 'Feedback' and 'Suggestions' */}
        <nav className="policy-nav-tabs" aria-label="Feedback and Suggestions tabs">
          <button
            type="button"
            className={`policy-nav-tab ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('feedback');
              setError('');
              setSuccess('');
            }}
            style={{ cursor: 'pointer', border: 'none', background: activeTab === 'feedback' ? undefined : 'transparent' }}
          >
            Feedback
          </button>
          <button
            type="button"
            className={`policy-nav-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('suggestions');
              setError('');
              setSuccess('');
            }}
            style={{ cursor: 'pointer', border: 'none', background: activeTab === 'suggestions' ? undefined : 'transparent' }}
          >
            Suggestions
          </button>
        </nav>

        {/* Main Card (same style as Terms and Conditions document card) */}
        <article className="policy-card" id="policy-feedback-suggestions">
          <header className="policy-header">
            <div className="policy-badge">USER VOICE &amp; SUPPORT</div>
            <h1 className="policy-title">Feedback and Suggestions</h1>
            <div className="policy-meta">
              <span className="policy-meta-item">
                Share your feedback or report suggestions and defects directly to the ExceptionPro Admin
              </span>
              <span className="policy-meta-dot">•</span>
              <span className="policy-meta-item">ExceptionPro Platform</span>
            </div>
          </header>

          <hr className="policy-divider" />

          <div className="policy-body">
            {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
            {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

            {/* =================================================================
                TAB i) FEEDBACK
                ================================================================= */}
            {activeTab === 'feedback' && (
              <>
                <section className="policy-section" style={{ marginTop: 0 }}>
                  <h2 className="policy-section-heading">
                    <span className="section-number">1. </span>
                    {editingFeedbackId ? 'Edit Feedback' : 'Feedback'}
                  </h2>
                  <p className="policy-paragraph" style={{ marginBottom: '1.25rem' }}>
                    {editingFeedbackId
                      ? 'Update your selected feedback below and click Update Feedback to save changes.'
                      : 'Share your experience, general thoughts, or comments regarding the ExceptionPro platform. Your feedback will be sent directly to the Admin.'}
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Your Feedback <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={5}
                      placeholder="Enter your feedback here..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      disabled={submitting}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    {editingFeedbackId && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={submitting}
                        onClick={handleCancelEditFeedback}
                        style={{ width: 'auto', padding: '0.65rem 1.35rem', margin: 0 }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submitting}
                      onClick={() => handleSubmit('feedback')}
                      style={{ width: 'auto', padding: '0.65rem 1.75rem', margin: 0 }}
                    >
                      {submitting
                        ? editingFeedbackId
                          ? 'Updating...'
                          : 'Submitting...'
                        : editingFeedbackId
                          ? 'Update Feedback'
                          : 'Submit Feedback'}
                    </button>
                  </div>
                </section>

                {/* My Submitted Feedback — Card-Based Layout with 100% Width */}
                {user && (
                  <section className="policy-section" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', width: '100%' }}>
                    <h2 className="policy-section-heading" style={{ marginBottom: '1rem' }}>
                      My Submitted Feedback ({feedbackSubmissions.length})
                    </h2>
                    {loadingHistory ? (
                      <div>Loading your feedback...</div>
                    ) : feedbackSubmissions.length === 0 ? (
                      <div
                        style={{
                          color: 'var(--text-muted)',
                          textAlign: 'center',
                          padding: '2rem 1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          width: '100%',
                        }}
                      >
                        No feedback submitted yet.
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
                        {feedbackSubmissions.map((item, idx) => (
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
                            {/* Card Header */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '0.75rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                  #{idx + 1}
                                </span>
                                <span
                                  className="badge"
                                  style={{
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: 'var(--accent-primary, #6366f1)',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    fontSize: '0.78rem',
                                  }}
                                >
                                  Feedback
                                </span>
                              </div>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                Submitted On: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                              </span>
                            </div>

                            {/* Card Body: Feedback Text */}
                            <div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Feedback
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  background: 'var(--glass-bg)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  padding: '0.9rem',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.92rem',
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {item.feedbackText || '—'}
                              </div>
                            </div>

                            {/* Card Footer: Edit Action */}
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
                                onClick={() => handleStartEditFeedback(item)}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {/* =================================================================
                TAB ii) SUGGESTIONS
                ================================================================= */}
            {activeTab === 'suggestions' && (
              <>
                <section className="policy-section" style={{ marginTop: 0 }}>
                  <h2 className="policy-section-heading">
                    <span className="section-number">2. </span>
                    {editingSuggestionId ? 'Edit Suggestion' : 'Suggestions'}
                  </h2>
                  <p className="policy-paragraph" style={{ marginBottom: '1.25rem' }}>
                    {editingSuggestionId
                      ? 'Update your selected suggestion or screenshot below and click Update Suggestion to save changes.'
                      : 'Provide feature suggestions or report defects with detailed reproduction steps and an optional screenshot image.'}
                  </p>

                  {/* Detailed Steps Text Area */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Detailed Steps (Suggestions / Defects) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={6}
                      placeholder="Provide detailed steps for your suggestion or defect (e.g. 1. Navigate to page... 2. Click on... 3. Expected vs Actual behavior)..."
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      disabled={submitting}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>

                  {/* Optional Screenshot (Image) Upload */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Upload Screenshot (Image){' '}
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                        (Optional — JPG, JPEG, PNG, WEBP)
                      </span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="form-input"
                      onChange={handleScreenshotChange}
                      disabled={submitting}
                      style={{ padding: '0.5rem' }}
                    />

                    {(screenshotPreview || existingScreenshotUrl) && (
                      <div
                        style={{
                          marginTop: '0.85rem',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          background: 'var(--glass-bg)',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <img
                          src={screenshotPreview || getMediaUrl(existingScreenshotUrl)}
                          alt="Screenshot Preview"
                          style={{
                            maxWidth: '280px',
                            maxHeight: '180px',
                            borderRadius: '6px',
                            objectFit: 'contain',
                            border: '1px solid var(--border-color)',
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                            {screenshotFile?.name || existingScreenshotFileName || 'Attached Screenshot'}
                          </span>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleRemoveScreenshot}
                            style={{
                              padding: '0.25rem 0.65rem',
                              fontSize: '0.78rem',
                              width: 'auto',
                              margin: 0,
                              color: '#ef4444',
                              borderColor: '#ef4444',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    {editingSuggestionId && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={submitting}
                        onClick={handleCancelEditSuggestion}
                        style={{ width: 'auto', padding: '0.65rem 1.35rem', margin: 0 }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submitting}
                      onClick={() => handleSubmit('suggestion')}
                      style={{ width: 'auto', padding: '0.65rem 1.75rem', margin: 0 }}
                    >
                      {submitting
                        ? editingSuggestionId
                          ? 'Updating...'
                          : 'Submitting...'
                        : editingSuggestionId
                          ? 'Update Suggestion'
                          : 'Submit Suggestion'}
                    </button>
                  </div>
                </section>

                {/* My Submitted Suggestions — Card-Based Layout with 100% Width */}
                {user && (
                  <section className="policy-section" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', width: '100%' }}>
                    <h2 className="policy-section-heading" style={{ marginBottom: '1rem' }}>
                      My Submitted Suggestions ({suggestionSubmissions.length})
                    </h2>
                    {loadingHistory ? (
                      <div>Loading your suggestions...</div>
                    ) : suggestionSubmissions.length === 0 ? (
                      <div
                        style={{
                          color: 'var(--text-muted)',
                          textAlign: 'center',
                          padding: '2rem 1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          width: '100%',
                        }}
                      >
                        No suggestions submitted yet.
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
                        {suggestionSubmissions.map((item, idx) => (
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
                            {/* Card Header */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '0.75rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                  #{idx + 1}
                                </span>
                                <span
                                  className="badge"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '4px',
                                    fontWeight: 600,
                                    fontSize: '0.78rem',
                                  }}
                                >
                                  Suggestion
                                </span>
                              </div>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                Submitted On: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                              </span>
                            </div>

                            {/* Card Body: Detailed Steps */}
                            <div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Suggestions / Detailed Steps
                              </div>
                              <div
                                style={{
                                  width: '100%',
                                  background: 'var(--glass-bg)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  padding: '0.9rem',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.92rem',
                                  lineHeight: 1.6,
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
                                  Screenshot
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: 'var(--glass-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '0.65rem',
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
                                    onClick={() => setPreviewModalUrl(getMediaUrl(item.screenshotUrl))}
                                    title="Click to enlarge screenshot"
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: '0.82rem',
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
                                      onClick={() => setPreviewModalUrl(getMediaUrl(item.screenshotUrl))}
                                    >
                                      View
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Card Footer: Edit Action */}
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
                                onClick={() => handleStartEditSuggestion(item)}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </article>
      </div>

      {/* Full-size Screenshot Preview Modal */}
      {previewModalUrl && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewModalUrl(null)}
          style={{ zIndex: 2000 }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '850px', width: '90%', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={() => setPreviewModalUrl(null)}>
              &times;
            </button>
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              Screenshot Preview
            </h3>
            <img
              src={previewModalUrl}
              alt="Screenshot Full View"
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

export default FeedbackAndSuggestions;
