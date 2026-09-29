import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LeftNavigation from '../components/LeftNavigation';

interface UserRecord {
  id: string;
  email: string;
  accountType: string;
  role: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  organizationName?: string;
  legalName?: string;
  streetAddress?: string;
  city?: string;
  pincode?: string;
  state?: string;
  country?: string;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal details popup
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
      setLoading(false);
    } catch (err: any) {
      setError('Access forbidden or database connection error.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAccountBadgeClass = (type: string) => {
    switch (type) {
      case 'Individual': return 'badge badge-individual';
      case 'Buyer': return 'badge badge-buyer';
      case 'Supplier': return 'badge badge-supplier';
      default: return 'badge badge-hybrid';
    }
  };

  if (loading) {
    return <div className="main-content"><div className="glass-card text-center">Loading User Directory...</div></div>;
  }

  return (
    <div className="feed-layout-container">
      {/* Left Sidebar */}
      <LeftNavigation activePage="admin" />

      {/* Directory Table Column */}
      <div className="feed-center-column" style={{ maxWidth: '1000px' }}>
        <div className="glass-card glass-card-lg" style={{ width: '100%', maxWidth: 'none' }}>
          <h2 className="card-title">Administrative Dashboard</h2>
          <p className="card-subtitle">Overview of all registered platform user profiles</p>

          {error && <div className="alert-error">{error}</div>}

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Profile Name / Company</th>
                  <th>Email Address</th>
                  <th>Account Type</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.accountType === 'Individual'
                        ? `${u.firstName} ${u.lastName}`
                        : u.organizationName || 'N/A'}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={getAccountBadgeClass(u.accountType)}>
                        {u.accountType || 'Unassigned'}
                      </span>
                    </td>
                    <td>{u.role}</td>
                    <td>
                      <button
                        type="button"
                        className="nav-btn"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => setSelectedUser(u)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No users registered on the platform.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="close-btn" onClick={() => setSelectedUser(null)}>&times;</button>
            <h3 className="card-title" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              User Profile Profile
            </h3>

            <div style={{ marginTop: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>User ID:</strong>
                <p style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>{selectedUser.id}</p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Email Address:</strong>
                <p>{selectedUser.email}</p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-secondary)' }}>Account Classification:</strong>
                <p>
                  <span className={getAccountBadgeClass(selectedUser.accountType)}>
                    {selectedUser.accountType || 'Unassigned'}
                  </span>
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', padding: '1rem 0', marginTop: '0.5rem' }}>
                {selectedUser.accountType === 'Individual' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <p><strong>First Name:</strong> {selectedUser.firstName}</p>
                    <p><strong>Last Name:</strong> {selectedUser.lastName}</p>
                    <p><strong>Date of Birth:</strong> {selectedUser.dob}</p>
                    <p><strong>Gender:</strong> {selectedUser.gender}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <p><strong>Organization Name:</strong> {selectedUser.organizationName}</p>
                    <p><strong>Legal Name:</strong> {selectedUser.legalName}</p>
                    <p><strong>Street Address:</strong> {selectedUser.streetAddress}</p>
                    <p><strong>City / Pincode:</strong> {selectedUser.city} - {selectedUser.pincode}</p>
                    <p><strong>State / Country:</strong> {selectedUser.state}, {selectedUser.country}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
