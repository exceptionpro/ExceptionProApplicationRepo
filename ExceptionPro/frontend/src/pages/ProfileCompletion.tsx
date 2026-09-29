import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 
  'Germany', 'France', 'Japan', 'China', 'Singapore', 'United Arab Emirates'
];

const ProfileCompletion: React.FC = () => {
  const { setProfileCompleted, logout } = useAuth();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState('Individual');

  // Individual fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');

  // Corporate fields
  const [organizationName, setOrganizationName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload: any = {};

    if (accountType === 'Individual') {
      if (!firstName || !lastName || !dob || !gender) {
        setError('Please fill in all personal fields.');
        return;
      }
      payload.firstName = firstName;
      payload.lastName = lastName;
      payload.dob = dob;
      payload.gender = gender;
    } else {
      if (!organizationName || !legalName || !streetAddress || !city || !pincode || !state || !country) {
        setError('Please fill in all organizational fields.');
        return;
      }
      payload.organizationName = organizationName;
      payload.legalName = legalName;
      payload.streetAddress = streetAddress;
      payload.city = city;
      payload.pincode = pincode;
      payload.state = state;
      payload.country = country;
    }

    try {
      await api.post(`/api/auth/social-complete?accountType=${accountType}`, payload);
      setProfileCompleted(accountType);
      setSuccess('Profile completed! Access granted.');
      setTimeout(() => {
        navigate('/feed');
      }, 1500);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Profile completion failed. Check backend connectivity.');
      }
    }
  };

  return (
    <div className="main-content">
      <div className="glass-card glass-card-lg">
        <h2 className="card-title" style={{ color: 'var(--accent-primary)' }}>Complete Your Profile</h2>
        <p className="card-subtitle">Set up your account details before continuing</p>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ maxWidth: '300px' }}>
            <label className="form-label">Account Type</label>
            <select
              className="form-input"
              style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: '#fff' }}
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="Individual">Individual</option>
              <option value="Buyer">Buyer</option>
              <option value="Supplier">Supplier</option>
              <option value="Buyer and Supplier">Buyer and Supplier</option>
            </select>
          </div>

          <div className="separator" style={{ margin: '1rem 0 1.5rem 0' }}>Profile Details</div>

          {accountType === 'Individual' && (
            <div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-input"
                    style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: '#fff' }}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {accountType !== 'Individual' && (
            <div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Organization Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Legal Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Country</label>
                  <select
                    className="form-input"
                    style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: '#fff' }}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }}>Save Profile</button>
            <button type="button" className="btn-secondary" onClick={() => logout()} style={{ flex: 1, marginTop: 0 }}>Logout</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletion;
