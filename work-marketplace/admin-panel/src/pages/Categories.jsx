import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: '', icon: 'briefcase', sortOrder: 0 });
  const [addingCat, setAddingCat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      setCategories(data.data.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏷️ Category Management</h1>
          <p className="page-subtitle">Add, edit, and manage dynamic job categories for posters and workers</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="badge badge-info">{categories.length} Total Categories</span>
          <span className="badge badge-success">{categories.filter((c) => c.active).length} Active</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* ADD NEW CATEGORY CARD */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>➕ Add New Category</h2>
          <form onSubmit={handleAddCategory}>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                placeholder="e.g. Electrician, Plumbing, Carpentry"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Icon Slug / Name</label>
              <input
                type="text"
                placeholder="e.g. zap, wrench, hammer, briefcase"
                value={newCat.icon}
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Icon identifier used in mobile app and web.
              </span>
            </div>

            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                min="0"
                value={newCat.sortOrder}
                onChange={(e) => setNewCat({ ...newCat, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={addingCat}>
              {addingCat ? 'Adding Category...' : '✨ Create Category'}
            </button>
          </form>
        </div>

        {/* ALL CATEGORIES LIST CARD */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>📋 All Categories</h2>
            <input
              type="text"
              placeholder="🔍 Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 220, padding: '8px 12px', fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
            {filteredCategories.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                No categories found. Add your first category!
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div
                  key={cat._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    opacity: cat.active ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        backgroundColor: 'var(--card-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        border: '1px solid var(--border)',
                      }}
                    >
                      🏷️
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-main)' }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Icon: <code>{cat.icon || 'briefcase'}</code> • Order: {cat.sortOrder ?? 0}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: cat.active ? '#22c55e20' : '#ef444420',
                        color: cat.active ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {cat.active ? '● Active' : '○ Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat._id, cat.name)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: 14,
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                      }}
                      title="Delete Category"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
