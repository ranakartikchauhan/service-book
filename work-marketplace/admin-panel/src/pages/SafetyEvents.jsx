import { useEffect, useState } from 'react';
import api from '../api/client';
import { getAdminSocket } from '../services/socket';

const STATUS_BADGE = {
  active: 'badge-danger',
  acknowledged_by_admin: 'badge-warning',
  resolved: 'badge-success',
  false_alarm: 'badge-neutral',
};

export default function SafetyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [updating, setUpdating] = useState(null);

  const fetchEvents = (status) => {
    setLoading(true);
    api.get(`/admin/safety-events?status=${status}`)
      .then(({ data }) => setEvents(data.data.events))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents(statusFilter);

    // Real-time live emergency radar via Render WebSocket Gateway
    const socket = getAdminSocket();
    const handleNewSos = (eventData) => {
      console.log('🚨 [LIVE SOS ALERT RECEIVED VIA WEBSOCKET]:', eventData);
      setEvents((prev) => [eventData, ...prev]);
    };

    socket.on('safety:sos', handleNewSos);
    return () => {
      socket.off('safety:sos', handleNewSos);
    };
  }, [statusFilter]);

  const updateEvent = async (id, status, adminNotes) => {
    setUpdating(id);
    try {
      await api.patch(`/admin/safety-events/${id}`, { status, adminNotes });
      fetchEvents(statusFilter);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating event');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: statusFilter === 'active' ? 'var(--danger)' : undefined }}>
            {statusFilter === 'active' && '🆘 '} Safety Events
          </h1>
          <p className="page-subtitle">This is the highest-priority view in the admin panel</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['active', 'acknowledged_by_admin', 'resolved', 'false_alarm'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 48 }}>✅</div>
          <p style={{ marginTop: 12, fontWeight: 600 }}>No {statusFilter.replace(/_/g, ' ')} safety events</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {events.map((event) => (
            <EventCard key={event._id} event={event} updating={updating} onUpdate={updateEvent} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, updating, onUpdate }) {
  const [notes, setNotes] = useState(event.adminNotes || '');

  const [lng, lat] = event.location?.coordinates || [0, 0];
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="card" style={{ borderColor: event.status === 'active' ? 'var(--danger)' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="user-cell">
          {event.status === 'active' && <div className="sos-indicator" />}
          {event.userId?.profilePhotoUrl
            ? <img src={event.userId.profilePhotoUrl} className="avatar" alt="" />
            : <div className="avatar">{event.userId?.name?.[0]}</div>}
          <div>
            <div style={{ fontWeight: 700 }}>{event.userId?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{event.userId?.phone}</div>
          </div>
        </div>
        <span className={`badge ${STATUS_BADGE[event.status]}`}>{event.status.replace(/_/g, ' ')}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 16 }}>
        <div><span style={{ color: 'var(--text-muted)' }}>Job:</span> {event.jobId?.title || 'Unknown'}</div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Triggered:</span>{' '}
          {new Date(event.triggeredAt).toLocaleString()}
        </div>
        <div>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            📍 View GPS Map ({lat.toFixed(4)}, {lng.toFixed(4)})
          </a>
        </div>
        {event.emergencyContact && (
          <div>
            <span style={{ color: 'var(--text-muted)' }}>🚨 Emergency Contact:</span>{' '}
            <strong>{event.emergencyContact.name}</strong> ({event.emergencyContact.phone} - {event.emergencyContact.relationship})
          </div>
        )}
        {event.resolvedAt && (
          <div><span style={{ color: 'var(--text-muted)' }}>Resolved:</span> {new Date(event.resolvedAt).toLocaleString()}</div>
        )}
      </div>

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label>Admin Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this safety event..."
        />
      </div>

      {event.status === 'active' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            disabled={updating === event._id}
            onClick={() => onUpdate(event._id, 'acknowledged_by_admin', notes)}
          >
            ✓ Acknowledge
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={updating === event._id}
            onClick={() => onUpdate(event._id, 'resolved', notes)}
          >
            ✅ Mark Resolved
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={updating === event._id}
            onClick={() => onUpdate(event._id, 'false_alarm', notes)}
          >
            ↩ False Alarm
          </button>
        </div>
      )}
      {event.status === 'acknowledged_by_admin' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            disabled={updating === event._id}
            onClick={() => onUpdate(event._id, 'resolved', notes)}
          >
            ✅ Mark Resolved
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={updating === event._id}
            onClick={() => onUpdate(event._id, 'false_alarm', notes)}
          >
            ↩ False Alarm
          </button>
        </div>
      )}
    </div>
  );
}
