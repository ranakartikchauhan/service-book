import { useEffect, useState } from 'react';
import api from '../api/client';

const STATUS_BADGE = {
  open: 'badge-info',
  assigned: 'badge-warning',
  in_progress: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-neutral',
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (statusFilter) params.set('status', statusFilter);

    api.get(`/admin/jobs?${params}`)
      .then(({ data }) => { setJobs(data.data.jobs); setTotal(data.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  const statuses = ['', 'open', 'assigned', 'in_progress', 'completed', 'cancelled'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Jobs</h1>
          <p className="page-subtitle">{total} total jobs</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {statuses.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Category</th>
                  <th>Poster</th>
                  <th>Worker</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{job.title}</div>
                    </td>
                    <td>{job.category?.name || '—'}</td>
                    <td>
                      <div className="user-cell">
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {job.posterId?.name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13 }}>{job.posterId?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{job.posterId?.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {job.assignedWorkerId ? (
                        <div className="user-cell">
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {job.assignedWorkerId?.name?.[0]}
                          </div>
                          <div style={{ fontSize: 13 }}>{job.assignedWorkerId?.name}</div>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{job.budgetAmount?.toLocaleString()}</td>
                    <td><span className={`badge ${STATUS_BADGE[job.status]}`}>{job.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(job.scheduledDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && <div className="empty-state">No jobs found.</div>}
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
