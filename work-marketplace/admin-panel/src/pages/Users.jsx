import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const limit = 20;

  const fetchUsers = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    api.get(`/admin/users?${params}`)
      .then(({ data }) => { setUsers(data.data.users); setTotal(data.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleSuspend = async (user) => {
    const action = user.isSuspended ? 'reinstate' : 'suspend';
    const reason = !user.isSuspended ? prompt('Reason for suspension:') : null;
    if (!user.isSuspended && !reason) return;

    setActionLoading(user._id);
    try {
      await api.patch(`/admin/users/${user._id}/suspend`, {
        suspend: !user.isSuspended,
        reason,
      });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{total} total users</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            style={{ width: 240 }}
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Mode</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        {user.profilePhotoUrl
                          ? <img src={user.profilePhotoUrl} className="avatar" alt="" style={{ width: 32, height: 32 }} />
                          : <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{user.name?.[0]}</div>}
                        <span style={{ fontWeight: 600 }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{user.phone}</td>
                    <td><span className="badge badge-info">{user.currentMode}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user.isSuspended
                        ? <span className="badge badge-danger">Suspended</span>
                        : <span className="badge badge-success">Active</span>}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.isSuspended ? 'btn-primary' : 'btn-danger'}`}
                        disabled={actionLoading === user._id}
                        onClick={() => toggleSuspend(user)}
                      >
                        {user.isSuspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="empty-state">No users found.</div>}
          </div>
        )}
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <button className="btn btn-ghost btn-sm" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}
