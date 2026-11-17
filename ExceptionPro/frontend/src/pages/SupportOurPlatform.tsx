import React, { useState, useEffect } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface PlatformSponsorshipRecord {
  id: string;
  userId?: string;
  sponsorName: string;
  emailId: string;
  phoneNumber?: string;
  amountRange: string;
  currency: string;
  accountType?: string;
  submittedByEmail?: string;
  createdAt: string;
}

const SPONSOR_AMOUNT_RANGES = [
  '10- 100',
  '100-250',
  '250-500',
  '500-1000',
];

const SupportOurPlatform: React.FC = () => {
  const { user } = useAuth();

  const [sponsorName, setSponsorName] = useState<string>('');
  const [emailId, setEmailId] = useState<string>(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [amountRange, setAmountRange] = useState<string>('');
  const [currency, setCurrency] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [mySponsorships, setMySponsorships] = useState<PlatformSponsorshipRecord[]>([]);

  useEffect(() => {
    if (user) {
      if (!emailId && user.email) {
        setEmailId(user.email);
      }
      fetchMySponsorships();
    }
  }, [user]);

  const fetchMySponsorships = async () => {
    try {
      const res = await api.get('/api/support-platform/my');
      if (Array.isArray(res.data)) {
        setMySponsorships(res.data);
      }
    } catch {
      // silent fail
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!sponsorName.trim()) {
      setError('Please enter Sponsor Name.');
      return;
    }
    if (!emailId.trim()) {
      setError('Please enter Email ID.');
      return;
    }
    if (!amountRange) {
      setError("Please select the amount you'd like to Sponsor.");
      return;
    }
    if (!currency.trim()) {
      setError('Please enter Currency.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/support-platform', {
        sponsorName: sponsorName.trim(),
        emailId: emailId.trim(),
        phoneNumber: phoneNumber.trim(),
        amountRange,
        currency: currency.trim(),
      });

      setSuccess('Thank you for supporting ExceptionPro! Your sponsorship details have been sent to admin@exceptionpro.com.');
      setSponsorName('');
      setPhoneNumber('');
      setAmountRange('');
      setCurrency('');
      fetchMySponsorships();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit sponsorship details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feed-container" style={{ maxWidth: '1400px', width: '100%' }}>
      {user && <LeftNavigation activePage="support-platform" />}

      <main style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-card glass-card-lg" style={{ padding: '2rem', width: '100%', maxWidth: 'none' }}>
          <h2 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
            Support Our Platform
          </h2>
          <p className="card-subtitle" style={{ marginBottom: '1.75rem' }}>
            Partner with ExceptionPro to empower seamless B2B Buyer and Supplier collaboration worldwide
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '2rem',
              alignItems: 'stretch',
            }}
          >
            {/* =================================================================
                a) LEFT SIDE: REQUEST FOR SPONSOR
                ================================================================= */}
            <section
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent-primary, #6366f1)',
                    fontWeight: 700,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    marginBottom: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Become a Platform Sponsor
                </span>
                <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>
                  Why Sponsor ExceptionPro?
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                  ExceptionPro connects Buyers and Suppliers on a unified digital procurement, requisition, invoicing, reconciliation, and collaboration network. Your sponsorship directly accelerates platform innovation, cloud infrastructure reliability, and continuous feature enhancements for our growing business community.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: 'var(--glass-bg)',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🚀</span>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.92rem' }}>
                        Fuel B2B Procurement Innovation
                      </strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Support next-generation tools for automated 3-way reconciliation, smart requisitions, and real-time supplier collaboration.
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: 'var(--glass-bg)',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.92rem' }}>
                        High-Availability Infrastructure &amp; Security
                      </strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Help us scale high-speed servers, enterprise-grade data protection, and 24/7 uptime for organizations worldwide.
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: 'var(--glass-bg)',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>🤝</span>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.92rem' }}>
                        Empower Global Buyer–Supplier Connections
                      </strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Every sponsorship contribution helps keep core collaboration features accessible to emerging businesses and partners.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem',
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                }}
              >
                All sponsorship inquiries are routed directly to our administration team at{' '}
                <strong style={{ color: 'var(--accent-primary, #6366f1)' }}>admin@exceptionpro.com</strong>.
              </div>
            </section>

            {/* =================================================================
                b) RIGHT SIDE: SPONSORSHIP FORM
                ================================================================= */}
            <section
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.35rem 0', color: 'var(--text-primary)' }}>
                Sponsorship Form
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Fill in your details below to sponsor ExceptionPro
              </p>

              {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
              {success && <div className="alert-success" style={{ marginBottom: '1.25rem' }}>{success}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* i) Sponsor Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Sponsor Name: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Sponsor / Organization Name"
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {/* ii) Email ID */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Email ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter Email ID"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {/* iii) Phone Number (Optional) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter Phone Number (Optional)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {/* iv) Select the amount you'd like to Sponsor */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Select the amount you'd like to Sponsor: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    value={amountRange}
                    onChange={(e) => setAmountRange(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    <option value="">-- Select Amount Range --</option>
                    {SPONSOR_AMOUNT_RANGES.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>

                {/* v) Currency : Text Field */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Currency : <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Currency (e.g. USD, INR, EUR)"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ width: '100%', padding: '0.75rem 1.5rem', fontWeight: 600 }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Sponsorship'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>

        {/* User's Previous Sponsorship Submissions */}
        {user && mySponsorships.length > 0 && (
          <div className="glass-card glass-card-lg" style={{ padding: '2rem', width: '100%', maxWidth: 'none' }}>
            <h3 className="card-title" style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
              My Sponsorship Submissions
            </h3>
            <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
              Details sent to admin@exceptionpro.com
            </p>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sponsor Name</th>
                    <th>Email ID</th>
                    <th>Phone Number</th>
                    <th>Amount Range</th>
                    <th>Currency</th>
                    <th>Submitted On</th>
                  </tr>
                </thead>
                <tbody>
                  {mySponsorships.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.sponsorName}</td>
                      <td>{item.emailId}</td>
                      <td>{item.phoneNumber || '—'}</td>
                      <td>
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
                          {item.amountRange}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.currency}</td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SupportOurPlatform;
