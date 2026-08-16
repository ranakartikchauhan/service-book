import { useState, useEffect } from 'react';
import api from '../api/client';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [ticketStatus, setTicketStatus] = useState('open');
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async (status = statusFilter) => {
    try {
      setLoading(true);
      const url = status ? `/admin/support-tickets?status=${status}` : '/admin/support-tickets';
      const { data } = await api.get(url);
      setTickets(data.data.tickets || []);
    } catch (err) {
      console.error('Error loading support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(statusFilter);
  }, [statusFilter]);

  const handleOpenDetail = (t) => {
    setSelectedTicket(t);
    setAdminNotes(t.adminNotes || '');
    setTicketStatus(t.status || 'open');
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      await api.patch(`/admin/support-tickets/${selectedTicket._id}`, {
        status: ticketStatus,
        adminNotes,
      });
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      alert('Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'resolved': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      case 'closed': return 'badge-neutral';
      default: return 'badge-danger';
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Customer Support Tickets & Inquiries</h1>
          <p>Review user inquiries, payment queries, safety disputes, and log resolution notes.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'open', 'in_progress', 'resolved'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s ? s.replace('_', ' ').toUpperCase() : 'ALL'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading support tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No support tickets found.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Subject</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700' }}>{t.userId?.name || 'User'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.userId?.phone} • {t.userId?.currentMode}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                      {t.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                    <div style={{ fontWeight: '600' }}>{t.subject}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.message}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${getStatusBadgeClass(t.status)}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenDetail(t)}>
                      Inspect / Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>Support Ticket Details</h2>
            <div style={{ margin: '14px 0', padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Submitted By:</div>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{selectedTicket.userId?.name} ({selectedTicket.userId?.phone})</div>
              <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>Role: {selectedTicket.userId?.currentMode}</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>SUBJECT</label>
              <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>{selectedTicket.subject}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>MESSAGE</label>
              <div style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '4px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                {selectedTicket.message}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>TICKET STATUS</label>
              <select
                className="input"
                style={{ width: '100%' }}
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
              >
                <option value="open">Open (Awaiting Resolution)</option>
                <option value="in_progress">In Progress (Support Working on it)</option>
                <option value="resolved">Resolved (Issue Fixed)</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>ADMIN RESOLUTION NOTES</label>
              <textarea
                className="input"
                style={{ width: '100%', height: '70px' }}
                placeholder="Log internal resolution steps taken (e.g. called worker, verified UPI, resolved dispute)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedTicket(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleUpdateTicket} disabled={updating}>
                {updating ? 'Saving...' : 'Update Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
