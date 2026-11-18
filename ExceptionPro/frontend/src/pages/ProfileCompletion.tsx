import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileCompletion: React.FC = () => {
  const { user, setProfileCompleted, logout } = useAuth();
  const navigate = useNavigate();

  const gmailAddress = user?.email || localStorage.getItem('email') || '';

  const [accountType, setAccountType] = useState<string>('Buyer');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<string>('Male');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (accountType !== 'Buyer' && accountType !== 'Supplier') {
      setError('Please select Account Type as either Buyer or Supplier.');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !dob || !gender) {
      setError('Please fill in First Name, Last Name, Date of Birth, and Gender.');
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      gender,
    };

    setSaving(true);
    try {
      await api.post(`/api/auth/social-complete?accountType=${encodeURIComponent(accountType)}`, payload);
      setProfileCompleted(accountType);
      setSuccess('Profile saved! Logging you into ExceptionPro...');
      setTimeout(() => {
        navigate('/feed');
      }, 1000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Profile completion failed. Check backend connectivity.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="main-content">
      <div className="glass-card glass-card-lg">
        <h2 className="card-title" style={{ color: 'var(--accent-primary)' }}>Complete Your Profile</h2>
        <p className="card-subtitle">
          Select your Account Type (Buyer or Supplier) and enter your details on first login to access ExceptionPro
        </p>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Account Type</label>
              <select
                className="form-input"
                style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                required
              >
                <option value="Buyer">Buyer</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>

            <div className="form-group half-width">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={gmailAddress}
                readOnly
                disabled
                style={{ opacity: 0.75, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="separator" style={{ margin: '1rem 0 1.5rem 0' }}>Profile Details</div>

          <div>
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group half-width">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              <div className="form-group half-width">
                <label className="form-label">Gender</label>
                <select
                  className="form-input"
                  style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ flex: 1, marginTop: 0 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => logout()}
              style={{ flex: 1, marginTop: 0 }}
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletion;
