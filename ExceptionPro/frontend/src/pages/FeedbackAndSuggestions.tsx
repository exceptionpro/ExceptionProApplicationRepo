import React, { useState, useEffect, useRef } from 'react';
import LeftNavigation from '../components/LeftNavigation';
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

  // Section a) Feedback state
  const [feedbackText, setFeedbackText] = useState<string>('');

  // Section b) Suggestions (Defects) state
  const [suggestionText, setSuggestionText] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
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
    if (user) {
      fetchMySubmissions();
    }
  }, [user]);

  const fetchMySubmissions = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/api/feedback-suggestions/my');
      setMySubmissions(res.data || []);
    } catch (err) {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (mode: 'feedback' | 'suggestion' | 'both') => {
    setError('');
    setSuccess('');

    const cleanFeedback = feedbackText.trim();
    const cleanSuggestion = suggestionText.trim();

    if (mode === 'feedback' && !cleanFeedback) {
      setError('Please enter your Feedback before submitting.');
      return;
    }

    if (mode === 'suggestion' && !cleanSuggestion) {
      setError('Please enter Detailed steps in the Suggestions (Defects) section before submitting.');
      return;
    }

    if (mode === 'both' && !cleanFeedback && !cleanSuggestion) {
      setError('Please enter Feedback or Suggestions / Detailed steps before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      let uploadedFileName: string | undefined = undefined;

      // Upload optional screenshot if submitting suggestion or both
      if ((mode === 'suggestion' || mode === 'both') && screenshotFile) {
        const formData = new FormData();
        formData.append('file', screenshotFile);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrl = uploadRes.data?.fileUrl;
        uploadedFileName = screenshotFile.name;
      }

      const payload = {
        submissionType:
          mode === 'feedback'
            ? 'Feedback'
            : mode === 'suggestion'
              ? 'Suggestion'
              : cleanFeedback && cleanSuggestion
                ? 'Feedback & Suggestion'
                : cleanFeedback
                  ? 'Feedback'
                  : 'Suggestion',
        feedbackText: mode === 'suggestion' ? '' : cleanFeedback,
        suggestionText: mode === 'feedback' ? '' : cleanSuggestion,
        screenshotUrl: uploadedUrl || '',
        screenshotFileName: uploadedFileName || '',
      };

      await api.post('/api/feedback-suggestions', payload);

      if (mode === 'feedback') {
        setFeedbackText('');
        setSuccess('Your Feedback has been submitted and sent to Admin successfully!');
      } else if (mode === 'suggestion') {
        setSuggestionText('');
        handleRemoveScreenshot();
        setSuccess('Your Suggestion / Defect report has been submitted and sent to Admin successfully!');
      } else {
        setFeedbackText('');
        setSuggestionText('');
        handleRemoveScreenshot();
        setSuccess('Your Feedback and Suggestions have been submitted and sent to Admin successfully!');
      }

      fetchMySubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit Feedback / Suggestion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feed-container" style={{ maxWidth: '1400px', width: '100%' }}>
      {user && <LeftNavigation activePage="feedback-suggestions" />}

      <main style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-card glass-card-lg" style={{ padding: '2rem', width: '100%', maxWidth: 'none' }}>
          <h2 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
            Feedback and Suggestions
          </h2>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
            Share your platform feedback or report suggestions and defects with detailed steps. Your submission will be sent directly to the Admin.
          </p>

          {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
          {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* =================================================================
                SECTION A: FEEDBACK
                ================================================================= */}
            <section
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary, #6366f1)',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                  }}
                >
                  a) Feedback
                </span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  Feedback Section
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Share your experience, general thoughts, or comments regarding the ExceptionPro platform.
              </p>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Your Feedback
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Enter your feedback here..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={submitting}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={() => handleSubmit('feedback')}
                  style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </section>

            {/* =================================================================
                SECTION B: SUGGESTIONS (DEFECTS)
                ================================================================= */}
            <section
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                  }}
                >
                  b) Suggestions
                </span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  Suggestions / Defects Section
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Provide feature suggestions or report defects with detailed reproduction steps and an optional screenshot image.
              </p>

              {/* Detailed Steps Text Area */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Detailed Steps (Suggestions / Defects)
                </label>
                <textarea
                  className="form-input"
                  rows={5}
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
                  Upload Screenshot (Image) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional — JPG, JPEG, PNG, WEBP)</span>
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

                {screenshotPreview && (
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
                      src={screenshotPreview}
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
                        {screenshotFile?.name}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={() => handleSubmit('suggestion')}
                  style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Suggestion / Defect'}
                </button>

                {feedbackText.trim() !== '' && suggestionText.trim() !== '' && (
                  <button
                    type="button"
                    className="btn"
                    disabled={submitting}
                    onClick={() => handleSubmit('both')}
                    style={{
                      width: 'auto',
                      padding: '0.6rem 1.5rem',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Both (Feedback & Suggestions)'}
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* =================================================================
            USER'S PREVIOUSLY SUBMITTED FEEDBACK & SUGGESTIONS
            ================================================================= */}
        {user && (
          <div className="glass-card glass-card-lg" style={{ padding: '2rem', width: '100%', maxWidth: 'none' }}>
            <h3 className="card-title" style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
              My Submitted Feedback &amp; Suggestions
            </h3>
            <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
              History of feedback and suggestions you have sent to Admin
            </p>

            {loadingHistory ? (
              <div>Loading your submissions...</div>
            ) : mySubmissions.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
                You have not submitted any feedback or suggestions yet.
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Feedback</th>
                      <th>Suggestions / Detailed Steps</th>
                      <th>Screenshot</th>
                      <th>Submitted On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySubmissions.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
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
                        <td style={{ whiteSpace: 'pre-wrap', maxWidth: '300px' }}>
                          {item.feedbackText || '—'}
                        </td>
                        <td style={{ whiteSpace: 'pre-wrap', maxWidth: '350px' }}>
                          {item.suggestionText || '—'}
                        </td>
                        <td>
                          {item.screenshotUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img
                                src={getMediaUrl(item.screenshotUrl)}
                                alt={item.screenshotFileName || 'Screenshot'}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setPreviewModalUrl(getMediaUrl(item.screenshotUrl))}
                                title="Click to enlarge screenshot"
                              />
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', margin: 0 }}
                                onClick={() => setPreviewModalUrl(getMediaUrl(item.screenshotUrl))}
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

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
