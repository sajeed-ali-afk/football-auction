import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// ✅ Lazy load all pages — each page only loads when visited
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const AuctionPage = lazy(() => import('./pages/AuctionPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));

// ✅ Inline loading screen — no extra component import needed at startup
const PageLoader = () => (
  <div style={{
    background: '#060612',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  }}>
    <div style={{ position: 'relative', width: '48px', height: '48px' }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: '#00ff87',
        animation: 'spin 1s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: '4px',
        borderRadius: '50%',
        border: '2px solid transparent',
        borderTopColor: '#00d4ff',
        animation: 'spin 0.7s linear infinite reverse',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px',
      }}>⚽</div>
    </div>
    <p style={{ color: '#4b5563', fontSize: '12px', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
      LOADING...
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/room/:roomId/lobby" element={<PrivateRoute><LobbyPage /></PrivateRoute>} />
      <Route path="/room/:roomId/auction" element={<PrivateRoute><AuctionPage /></PrivateRoute>} />
      <Route path="/room/:roomId/results" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-dark-500 font-body">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}