import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import HeaderNav from './components/HeaderNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ProfileCompletion from './pages/ProfileCompletion';
import AdminDashboard from './pages/AdminDashboard';
import SocialFeed from './pages/SocialFeed';
import Catalogue from './pages/Catalogue';
import Requisition from './pages/Requisition';
import RequestNotification from './pages/RequestNotification';
import CollaborationRequisition from './pages/CollaborationRequisition';
import CollaborationRequestNotification from './pages/CollaborationRequestNotification';
import Notifications from './pages/Notifications';
import Invoices from './pages/Invoices';
import PurchaseReceipts from './pages/PurchaseReceipts';
import Reconciliation from './pages/Reconciliation';
import Payments from './pages/Payments';
import Messaging from './pages/Messaging';
import MessagingWidget from './components/MessagingWidget';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <HeaderNav />

      <Routes>
        <Route path="/" element={<Navigate to={user ? (user.role === 'ROLE_ADMIN' ? "/admin" : "/feed") : "/login"} replace />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/feed" replace /> : <Register />} />

        <Route path="/feed" element={
          <PrivateRoute>
            <SocialFeed />
          </PrivateRoute>
        } />

        <Route path="/notifications" element={
          <PrivateRoute>
            <Notifications />
          </PrivateRoute>
        } />

        <Route path="/messaging" element={
          <PrivateRoute>
            <Messaging />
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />

        <Route path="/catalogue" element={
          <PrivateRoute>
            <Catalogue />
          </PrivateRoute>
        } />

        <Route path="/requisition" element={
          <PrivateRoute>
            <Requisition />
          </PrivateRoute>
        } />

        <Route path="/request-notification" element={
          <PrivateRoute>
            <RequestNotification />
          </PrivateRoute>
        } />

        <Route path="/collaboration-requisition" element={
          <PrivateRoute>
            <CollaborationRequisition />
          </PrivateRoute>
        } />

        <Route path="/collaboration-request-notification" element={
          <PrivateRoute>
            <CollaborationRequestNotification />
          </PrivateRoute>
        } />

        <Route path="/invoices" element={
          <PrivateRoute>
            <Invoices />
          </PrivateRoute>
        } />

        <Route path="/purchase-receipts" element={
          <PrivateRoute>
            <PurchaseReceipts />
          </PrivateRoute>
        } />

        <Route path="/reconciliation" element={
          <PrivateRoute>
            <Reconciliation />
          </PrivateRoute>
        } />

        <Route path="/payments" element={
          <PrivateRoute>
            <Payments />
          </PrivateRoute>
        } />

        <Route path="/profile-completion" element={
          <PrivateRoute>
            <ProfileCompletion />
          </PrivateRoute>
        } />

        <Route path="/admin" element={
          <PrivateRoute requireAdmin={true}>
            <AdminDashboard />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global Collapsible Bottom-Right Messaging Chat Window */}
      {user && <MessagingWidget />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
