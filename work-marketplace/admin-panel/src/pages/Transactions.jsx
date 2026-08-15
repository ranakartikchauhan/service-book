import { useEffect, useState } from 'react';
import api from '../api/client';

const STATUS_BADGE = {
  held_in_escrow: { label: 'In Escrow', class: 'badge-warning' },
  released: { label: 'Released', class: 'badge-success' },
  refunded: { label: 'Refunded', class: 'badge-danger' },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchTransactions = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/transactions', { params: { page: p, limit: 15 } });
      setTransactions(data.data.transactions || []);
      setTotal(data.data.total || 0);
      setPage(data.data.page || 1);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, []);

  const totalPlatformEarnings = transactions
    .filter((t) => t.status === 'released')
    .reduce((sum, t) => sum + (t.platformCommission || 0), 0);

  if (loading && transactions.length === 0) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Transactions & Escrow</h1>
          <p className="page-subtitle">Track payments, held escrows, and platform revenue</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="badge badge-success">
            ₹{totalPlatformEarnings.toLocaleString()} Platform Commission (Page)
          </div>
          <div className="badge badge-info">{total} Total Records</div>
        </div>
      </div>

      <div className="card">
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            No transactions recorded yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Poster</th>
                  <th>Worker</th>
                  <th>Gross Amount</th>
                  <th>Platform Fee</th>
                  <th>Worker Payout</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const badge = STATUS_BADGE[tx.status] || { label: tx.status, class: 'badge-muted' };
                  return (
                    <tr key={tx._id}>
                      <td style={{ fontWeight: 600 }}>{tx.jobId?.title || 'Job #' + tx.jobId?._id?.slice(-6) || '—'}</td>
                      <td>{tx.posterId?.name || '—'}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.posterId?.phone}</span></td>
                      <td>{tx.workerId?.name || '—'}<br /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.workerId?.phone}</span></td>
                      <td style={{ fontWeight: 700 }}>₹{tx.grossAmount?.toLocaleString()}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>+₹{tx.platformCommission?.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-muted)' }}>₹{tx.workerPayoutAmount?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${badge.class}`}>{badge.label}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
