import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Verifications() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPending = () => {
    setLoading(true);
    api.get('/admin/verifications/pending')
      .then(({ data }) => setProfiles(data.data.profiles))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (workerId) => {
    setActionLoading(workerId);
    try {
      await api.post(`/admin/verifications/${workerId}/approve`);
      setProfiles((p) => p.filter((x) => x.userId._id !== workerId));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async () => {
    const workerId = rejectModal;
    setActionLoading(workerId);
    try {
      await api.post(`/admin/verifications/${workerId}/reject`, { reason: rejectReason });
      setProfiles((p) => p.filter((x) => x.userId._id !== workerId));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Worker Verifications</h1>
          <p className="page-subtitle">{profiles.length} pending review</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchPending}>🔄 Refresh</button>
      </div>

      {profiles.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 48 }}>✅</div>
          <p style={{ marginTop: 12, fontWeight: 600 }}>All caught up!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No pending verifications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {profiles.map((p) => (
            <div key={p._id} className="card" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              {/* Worker info */}
              <div style={{ flex: 1 }}>
                <div className="user-cell" style={{ marginBottom: 12 }}>
                  {p.userId.profilePhotoUrl
                    ? <img src={p.userId.profilePhotoUrl} alt="" className="avatar" />
                    : <div className="avatar">{p.userId.name?.[0]}</div>}
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.userId.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.userId.phone}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span><strong>ID Type:</strong> {p.verification.idType}</span>
                  <span><strong>Submitted:</strong> {new Date(p.verification.submittedAt).toLocaleDateString()}</span>
                </div>
                {p.skills?.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.skills.map((s) => <span key={s} className="badge badge-info">{s}</span>)}
                  </div>
                )}
              </div>

              {/* ID doc preview */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                {p.verification.signedIdDocUrl ? (
                  <a href={p.verification.signedIdDocUrl} target="_blank" rel="noreferrer">
                    <div className="btn btn-ghost btn-sm">🪪 View ID Document</div>
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No doc URL</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={actionLoading === p.userId._id}
                  onClick={() => approve(p.userId._id)}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  disabled={actionLoading === p.userId._id}
                  onClick={() => { setRejectModal(p.userId._id); setRejectReason(''); }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div className="card" style={{ width: 440 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Reject Verification</h3>
            <div className="form-group">
              <label>Reason (shown to worker)</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., ID document is unclear / expired / doesn't match name"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={reject} disabled={!rejectReason.trim()}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
