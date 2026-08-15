import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Verifications from './pages/Verifications';
import SafetyEvents from './pages/SafetyEvents';
import Jobs from './pages/Jobs';
import Users from './pages/Users';
import Config from './pages/Config';
import { useEffect, useState } from 'react';
import api from './api/client';

function ProtectedLayout() {
  const [activeSafetyCount, setActiveSafetyCount] = useState(0);

  useEffect(() => {
    api.get('/admin/safety-events?status=active')
      .then(({ data }) => setActiveSafetyCount(data.data.events.length))
      .catch(() => {});

    // Poll every 60s for new SOS events
    const interval = setInterval(() => {
      api.get('/admin/safety-events?status=active')
        .then(({ data }) => setActiveSafetyCount(data.data.events.length))
        .catch(() => {});
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-layout">
      <Sidebar activeSafetyCount={activeSafetyCount} />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verifications" element={<Verifications />} />
          <Route path="/safety" element={<SafetyEvents />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/users" element={<Users />} />
          <Route path="/config" element={<Config />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ProtectedLayout />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
