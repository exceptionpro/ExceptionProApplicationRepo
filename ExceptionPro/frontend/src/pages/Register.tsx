import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 
  'Germany', 'France', 'Japan', 'China', 'Singapore', 'United Arab Emirates'
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  
  const [accountType, setAccountType] = useState('Individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  
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

    if (!email || !password || !retypePassword) {
      setError('Please fill in all core credentials fields.');
      return;
    }

    if (password !== retypePassword) {
      setError('Passwords do not match.');
      return;
    }

    // Prepare payload dynamically
    const payload: any = {
      email,
      password,
      retypePassword,
      accountType
    };

    if (accountType === 'Individual') {
      if (!firstName || !lastName || !dob || !gender) {
        setError('Please fill in all personal registration fields.');
        return;
      }
      payload.firstName = firstName;
      payload.lastName = lastName;
      payload.dob = dob;
      payload.gender = gender;
    } else {
      if (!organizationName || !legalName || !streetAddress || !city || !pincode || !state || !country) {
        setError('Please fill in all corporate registration fields.');
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
      await api.post('/api/auth/register', payload);
      setSuccess('Account created successfully! Redirecting to sign in page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Check database validation logs.');
      }
    }
  };

  return (
    <div className="main-content">
      <div className="glass-card glass-card-lg">
        <h2 className="card-title">Create New Account</h2>
        <p className="card-subtitle">Register your personal or corporate account on ExceptionPro</p>

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
              >
                <option value="Individual">Individual</option>
                <option value="Buyer">Buyer</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>

            <div className="form-group half-width">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group half-width">
              <label className="form-label">Retype Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Retype password"
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
              />
            </div>
          </div>

          <div className="separator" style={{ margin: '1rem 0 1.5rem 0' }}>Details</div>

          {/* Individual Signup Inputs */}
          {accountType === 'Individual' && (
            <div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Last Name"
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
                    style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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

          {/* Corporate Signup Inputs */}
          {accountType !== 'Individual' && (
            <div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label className="form-label">Organization Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Company Org Name"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Legal Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Legal Entity Name"
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
                  placeholder="123 Corporate Lane, Suite 100"
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
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pincode"
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
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div className="form-group half-width">
                  <label className="form-label">Country</label>
                  <select
                    className="form-input"
                    style={{ appearance: 'auto', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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

          <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }}>Register Account</button>
        </form>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1.5rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login" className="helper-link" style={{ display: 'inline', marginTop: 0 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
