import React, { useEffect, useState } from 'react';
import LeftNavigation from '../components/LeftNavigation';
import api from '../services/api';
import type { PlatformSponsorshipRecord } from './SupportOurPlatform';

const AdminSupportPlatform: React.FC = () => {
  const [items, setItems] = useState<PlatformSponsorshipRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<PlatformSponsorshipRecord | null>(null);

  const fetchAllSponsorships = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/support-platform');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load Support Our Platform sponsorship records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSponsorships();
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
      <LeftNavigation activePage="admin-support-platform" />

      {/* Main Content */}
      <div className="feed-center-column" style={{ flex: 1, maxWidth: '1150px', width: '100%' }}>
        <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
            <div>
              <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>
                Support Our Platform — Sponsorship Submissions
              </h2>
              <p className="card-subtitle" style={{ margin: 0 }}>
                All sponsorship details submitted by users and organizations to admin@exceptionpro.com
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '0.45rem 1rem', margin: 0 }}
              onClick={fetchAllSponsorships}
            >
              Refresh
            </button>
          </div>

          {error && <div className="alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Sponsorship Submissions...</div>
          ) : (
            <div className="data-table-container" style={{ marginTop: '1.25rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sponsor Name</th>
                    <th>Email ID</th>
                    <th>Phone Number</th>
                    <th>Amount to Sponsor</th>
                    <th>Currency</th>
                    <th>Account Type</th>
                    <th>Submitted Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
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
                      <td>
                        <span className={getAccountBadgeClass(item.accountType)}>
                          {item.accountType || 'Member'}
                        </span>
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
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No sponsorship submissions have been received yet.
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
            style={{ maxWidth: '580px', width: '92%' }}
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
              Sponsorship Submission Details
            </h3>

            <div
              style={{
                marginTop: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sponsor Name:</strong>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, fontSize: '1.05rem' }}>{selectedItem.sponsorName}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email ID:</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>{selectedItem.emailId}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone Number:</strong>
                <p style={{ margin: '0.2rem 0 0 0' }}>{selectedItem.phoneNumber || 'Not Provided'}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Selected Amount Range:</strong>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: '#10b981' }}>{selectedItem.amountRange}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Currency:</strong>
                <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600 }}>{selectedItem.currency}</p>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportPlatform;
