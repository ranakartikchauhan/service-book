import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Config() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/config')
      .then(({ data }) => {
        setConfig(data.data.config);
        setForm(data.data.config);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/admin/config', {
        commissionPercent: parseFloat(form.commissionPercent),
        autoReleaseHours: parseInt(form.autoReleaseHours),
        minJobBudget: parseFloat(form.minJobBudget),
        maxJobPhotos: parseInt(form.maxJobPhotos),
        registrationsOpen: form.registrationsOpen,
      });
      setConfig(data.data.config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Admin-editable settings — no code deploy needed</p>
        </div>
      </div>

      {saved && <div className="alert alert-success">✅ Settings saved successfully</div>}

      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Platform Commission (%)</label>
            <input
              type="number" min="0" max="50" step="0.5"
              value={form.commissionPercent ?? ''}
              onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Currently: {config?.commissionPercent}% — Workers receive {100 - (config?.commissionPercent || 0)}% of the job amount
            </span>
          </div>

          <div className="form-group">
            <label>Auto-Release Payment (hours after worker marks complete)</label>
            <input
              type="number" min="1" max="168"
              value={form.autoReleaseHours ?? ''}
              onChange={(e) => setForm({ ...form, autoReleaseHours: e.target.value })}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              If poster doesn't respond within this window, payment auto-releases to worker
            </span>
          </div>

          <div className="form-group">
            <label>Minimum Job Budget (₹)</label>
            <input
              type="number" min="0"
              value={form.minJobBudget ?? ''}
              onChange={(e) => setForm({ ...form, minJobBudget: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Max Photos per Job</label>
            <input
              type="number" min="1" max="20"
              value={form.maxJobPhotos ?? ''}
              onChange={(e) => setForm({ ...form, maxJobPhotos: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.registrationsOpen ?? true}
                onChange={(e) => setForm({ ...form, registrationsOpen: e.target.checked })}
                style={{ width: 'auto' }}
              />
              Registrations Open (uncheck to pause new sign-ups)
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
