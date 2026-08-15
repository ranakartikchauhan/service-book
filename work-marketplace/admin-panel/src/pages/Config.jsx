import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Config() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', icon: 'briefcase', sortOrder: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingCat, setAddingCat] = useState(false);

  const fetchAll = async () => {
    try {
      const [cfgRes, catRes] = await Promise.all([
        api.get('/admin/config'),
        api.get('/admin/categories'),
      ]);
      setConfig(cfgRes.data.data.config);
      setForm(cfgRes.data.data.config);
      setCategories(catRes.data.data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return alert('Category name is required');
    setAddingCat(true);
    try {
      const { data } = await api.post('/admin/categories', newCat);
      setCategories((prev) => [...prev, data.data.category]);
      setNewCat({ name: '', icon: 'briefcase', sortOrder: categories.length + 1 });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add category');
    } finally {
      setAddingCat(false);
    }
  };

  const handleToggleCategory = async (cat) => {
    try {
      const { data } = await api.put(`/admin/categories/${cat._id}`, { active: !cat.active });
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? data.data.category : c)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform & Category Settings</h1>
          <p className="page-subtitle">Manage live platform rules and job categories dynamically</p>
        </div>
      </div>

      {saved && <div className="alert alert-success">✅ Settings saved successfully</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* PLATFORM CONFIG CARD */}
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>⚙️ General Platform Settings</h2>
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

        {/* CATEGORY MANAGEMENT CARD */}
        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📂 Job Categories Management</h2>

          {/* ADD NEW CATEGORY FORM */}
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="New Category Name (e.g. Electrician)"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              style={{ flex: 2 }}
            />
            <input
              type="text"
              placeholder="Icon slug (e.g. zap)"
              value={newCat.icon}
              onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={addingCat} style={{ whiteSpace: 'nowrap' }}>
              {addingCat ? 'Adding...' : '+ Add'}
            </button>
          </form>

          {/* CATEGORIES LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {categories.map((cat) => (
              <div
                key={cat._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  opacity: cat.active ? 1 : 0.5,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Icon: {cat.icon || 'default'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: cat.active ? '#22c55e20' : '#ef444420',
                      color: cat.active ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {cat.active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat._id, cat.name)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
