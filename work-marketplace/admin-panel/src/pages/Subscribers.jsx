import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantForm, setGrantForm] = useState({ userId: '', planId: '', days: 30 });
  const [granting, setGranting] = useState(false);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/subscribers', { params });
      setSubscribers(data.data.subscribers || []);
      setTotal(data.data.total || 0);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlansAndUsers = async () => {
    try {
      const [plansRes, usersRes] = await Promise.all([
        api.get('/admin/subscription-plans'),
        api.get('/admin/users'),
      ]);
      setPlans(plansRes.data.data.plans || []);
      setUsers(usersRes.data.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    loadPlansAndUsers();
  }, []);

  const handleGrantSubscription = async (e) => {
    e.preventDefault();
    if (!grantForm.userId || !grantForm.planId) {
      return alert('Please select both a User and a Plan');
    }
    setGranting(true);
    try {
      await api.post(`/admin/subscribers/${grantForm.userId}/grant`, {
        planId: grantForm.planId,
        days: parseInt(grantForm.days) || 30,
      });
      alert('Subscription granted successfully!');
      setShowGrantModal(false);
      fetchSubscribers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant subscription');
    } finally {
      setGranting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Subscribers & Grants</h1>
          <p className="page-subtitle">Track active subscriptions, renewal dates, and manual customer grants</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGrantModal(true)}>
          🎁 Grant Subscription Override
        </button>
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Roles</option>
          <option value="worker">Workers</option>
          <option value="poster">Posters</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="badge badge-info" style={{ alignSelf: 'center' }}>
          {total} Total Subscribers
        </span>
      </div>

      {/* SUBSCRIBERS TABLE */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : subscribers.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            No subscriptions found matching filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Plan Tier</th>
                  <th>Price</th>
                  <th>Usage (This Cycle)</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sub.userId?.name || 'User'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.userId?.phone}</div>
                    </td>
                    <td>
                      <span className={`badge ${sub.role === 'worker' ? 'badge-info' : 'badge-warning'}`}>
                        {sub.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{sub.planId?.name || 'Free Tier'}</td>
                    <td>{sub.planId?.price ? `₹${sub.planId.price}` : 'Free'}</td>
                    <td style={{ fontSize: 13 }}>
                      {sub.role === 'worker'
                        ? `${sub.usageThisCycle?.applicationsUsed || 0} applications`
                        : `${sub.usageThisCycle?.jobsPostedUsed || 0} job posts`}
                    </td>
                    <td>
                      <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GRANT SUBSCRIPTION MODAL */}
      {showGrantModal && (
        <div style={modalOverlayStyle}>
          <div className="card" style={{ width: 480, margin: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🎁 Grant / Extend Subscription</h2>
            <form onSubmit={handleGrantSubscription}>
              <div className="form-group">
                <label>Select User</label>
                <select
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                  required
                >
                  <option value="">-- Select a User --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.phone}) — {u.currentMode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Plan to Grant</label>
                <select
                  value={grantForm.planId}
                  onChange={(e) => setGrantForm({ ...grantForm, planId: e.target.value })}
                  required
                >
                  <option value="">-- Select a Plan --</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.targetRole}) — ₹{p.price}/mo
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Grant Duration (Days)</label>
                <input
                  type="number" min="1" max="365"
                  value={grantForm.days}
                  onChange={(e) => setGrantForm({ ...grantForm, days: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowGrantModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={granting}>
                  {granting ? 'Granting...' : 'Confirm Grant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};
