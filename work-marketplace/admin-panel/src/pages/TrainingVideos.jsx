import { useState, useEffect } from 'react';
import api from '../api/client';

export default function TrainingVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    durationMinutes: 3,
    language: 'Hindi',
    category: 'onboarding',
    sortOrder: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/training-videos');
      setVideos(data.data.videos || []);
    } catch (err) {
      console.error('Error loading training videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleOpenAdd = () => {
    setEditingVideo(null);
    setForm({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      durationMinutes: 3,
      language: 'Hindi',
      category: 'onboarding',
      sortOrder: videos.length + 1,
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVideo(v);
    setForm({
      title: v.title,
      description: v.description || '',
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl || '',
      durationMinutes: v.durationMinutes || 3,
      language: v.language || 'Hindi',
      category: v.category || 'general',
      sortOrder: v.sortOrder || 0,
      active: v.active !== undefined ? v.active : true,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.videoUrl.trim()) {
      alert('Please provide at least Title and Video URL.');
      return;
    }

    setSaving(true);
    try {
      if (editingVideo) {
        await api.put(`/admin/training-videos/${editingVideo._id}`, form);
        setMsg({ type: 'success', text: 'Video updated successfully!' });
      } else {
        await api.post('/admin/training-videos', form);
        setMsg({ type: 'success', text: 'Training video added!' });
      }
      setShowModal(false);
      fetchVideos();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save video.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training video?')) return;
    try {
      await api.delete(`/admin/training-videos/${id}`);
      fetchVideos();
    } catch (err) {
      alert('Failed to delete video.');
    }
  };

  const handleToggleActive = async (v) => {
    try {
      await api.put(`/admin/training-videos/${v._id}`, { active: !v.active });
      fetchVideos();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Worker Training Videos & Academy</h1>
          <p>Upload video links (YouTube, MP4, Vimeo, Cloudinary) to train workers on app features, safety & client rules.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Upload / Add Video
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: msg.type === 'success' ? '#10b981' : '#ef4444',
          border: `1px solid ${msg.type === 'success' ? '#10b981' : '#ef4444'}`
        }}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading training videos...</div>
      ) : videos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No training videos created yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={handleOpenAdd}>
            Add First Training Video
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {videos.map((v) => (
            <div key={v._id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '100%', height: '160px', backgroundColor: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                <img
                  src={v.thumbnailUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80'}
                  alt={v.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  ⏱️ {v.durationMinutes} min
                </span>
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: v.active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {v.active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div style={{ padding: '16px 0 0 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                    {v.category}
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                    {v.language}
                  </span>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '4px 0 8px 0', lineHeight: 1.3 }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px', flex: 1 }}>
                  {v.description || 'No description provided.'}
                </p>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <a
                    href={v.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    ▶️ Preview
                  </a>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(v)}>
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: v.active ? '#ef4444' : '#10b981' }}
                    onClick={() => handleToggleActive(v)}
                  >
                    {v.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444', marginLeft: 'auto' }}
                    onClick={() => handleDelete(v._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editingVideo ? 'Edit Training Video' : 'Add New Training Video'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
              Paste a YouTube URL or direct MP4/video link. This video will appear in the worker app onboarding and academy.
            </p>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Video Title * (e.g. Hindi & English)</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Customer Se Baat Karne Ka Tareeqa (Rules)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Video URL * (YouTube / MP4 / Cloudinary link)</label>
                <input
                  type="url"
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="https://www.youtube.com/watch?v=... or https://res.cloudinary.com/.../video.mp4"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Thumbnail Image URL (Optional)</label>
                <input
                  type="url"
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="https://images.unsplash.com/... or Cloudinary image link"
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Category</label>
                  <select
                    className="input"
                    style={{ width: '100%' }}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="onboarding">Onboarding (शुरुआत)</option>
                    <option value="customer_service">Customer Service (बातचीत)</option>
                    <option value="payments">Payments (पैसे & बैंक)</option>
                    <option value="safety">Safety (सुरक्षा & SOS)</option>
                    <option value="skills">Skills (काम का हुनर)</option>
                    <option value="general">General (सामान्य)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="input"
                    style={{ width: '100%' }}
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Language</label>
                  <input
                    type="text"
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="e.g. Hindi / English"
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Display Order</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Description / Lesson Summary</label>
                <textarea
                  className="input"
                  style={{ width: '100%', height: '70px' }}
                  placeholder="Explain what the worker will learn in this video lesson..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingVideo ? 'Save Changes' : 'Publish Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
