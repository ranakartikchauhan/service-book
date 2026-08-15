import { useEffect, useState } from 'react';
import api from '../api/client';

const StatCard = ({ label, value, danger = false }) => (
  <div className={`stat-card ${danger ? 'danger' : ''}`}>
    <span className="stat-label">{label}</span>
    <span className={`stat-value ${danger ? 'danger' : ''}`}>{value ?? '—'}</span>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Platform overview at a glance</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      {stats?.activeSafetyEvents > 0 && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className="sos-indicator" />
          <strong>⚠️ {stats.activeSafetyEvents} active safety event{stats.activeSafetyEvents > 1 ? 's' : ''} require immediate attention.</strong>
          <a href="/safety" className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }}>View Safety Events</a>
        </div>
      )}

      <div className="stat-grid">
        <StatCard label="Total Users" value={stats?.totalUsers?.toLocaleString()} />
        <StatCard label="Total Jobs" value={stats?.totalJobs?.toLocaleString()} />
        <StatCard label="Active Jobs" value={stats?.activeJobs?.toLocaleString()} />
        <StatCard label="Completed Jobs" value={stats?.completedJobs?.toLocaleString()} />
        <StatCard label="Pending Verifications" value={stats?.pendingVerifications} danger={stats?.pendingVerifications > 0} />
        <StatCard label="🆘 Active SOS Events" value={stats?.activeSafetyEvents} danger={stats?.activeSafetyEvents > 0} />
        <StatCard label="Revenue (Commission)" value={stats?.totalRevenue ? `₹${stats.totalRevenue.toLocaleString()}` : '₹0'} />
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/verifications" className="btn btn-primary">🪪 Review Verifications</a>
          <a href="/safety" className="btn btn-danger">🆘 Safety Events</a>
          <a href="/jobs" className="btn btn-ghost">💼 View All Jobs</a>
          <a href="/config" className="btn btn-ghost">⚙️ Platform Settings</a>
        </div>
      </div>
    </div>
  );
}
