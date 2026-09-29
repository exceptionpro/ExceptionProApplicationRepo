import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

interface UserSession {
  email: string;
  role: string;
  accountType: string | null;
  profileComplete: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserSession | null;
  loading: boolean;
  login: (token: string, email: string, role: string, accountType: string | null, profileComplete: boolean) => void;
  socialLogin: (email: string) => Promise<boolean>;
  logout: () => void;
  setProfileCompleted: (accountType: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');
    const storedAccountType = localStorage.getItem('accountType');
    const storedProfileComplete = localStorage.getItem('profileComplete') === 'true';

    if (storedToken && storedEmail && storedRole) {
      setToken(storedToken);
      setUser({
        email: storedEmail,
        role: storedRole,
        accountType: storedAccountType === 'null' ? null : storedAccountType,
        profileComplete: storedProfileComplete,
      });
    }
    setLoading(false);
  }, []);

  const login = (
    authToken: string,
    email: string,
    role: string,
    accountType: string | null,
    profileComplete: boolean
  ) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('email', email);
    localStorage.setItem('role', role);
    localStorage.setItem('accountType', accountType || 'null');
    localStorage.setItem('profileComplete', String(profileComplete));

    setToken(authToken);
    setUser({
      email,
      role,
      accountType,
      profileComplete,
    });
  };

  const socialLogin = async (email: string): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/social-login', { email });
      const { token, email: userEmail, role, accountType, profileComplete } = response.data;
      login(token, userEmail, role, accountType, profileComplete);
      return profileComplete;
    } catch (err) {
      console.error('Social login failed', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('accountType');
    localStorage.removeItem('profileComplete');

    setToken(null);
    setUser(null);
  };

  const setProfileCompleted = (accountType: string) => {
    localStorage.setItem('accountType', accountType);
    localStorage.setItem('profileComplete', 'true');
    if (user) {
      setUser({
        ...user,
        accountType,
        profileComplete: true,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, socialLogin, logout, setProfileCompleted }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
