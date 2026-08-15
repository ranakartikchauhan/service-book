import { useEffect, useState } from 'react';
import api from '../api/client';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/admin/subscription-plans');
      setPlans(data.data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleActive = async (plan) => {
    if (plan.isFree) return alert('Free tier cannot be disabled.');
    try {
      const { data } = await api.patch(`/admin/subscription-plans/${plan._id}/toggle-active`);
      setPlans((prev) => prev.map((p) => (p._id === plan._id ? data.data.plan : p)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle plan status');
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingPlan._id) {
        const { data } = await api.put(`/admin/subscription-plans/${editingPlan._id}`, editingPlan);
        setPlans((prev) => prev.map((p) => (p._id === editingPlan._id ? data.data.plan : p)));
      } else {
        const { data } = await api.post('/admin/subscription-plans', editingPlan);
        setPlans((prev) => [...prev, data.data.plan]);
      }
      setShowModal(false);
      setEditingPlan(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving plan');
    } finally {
      setSaving(false);
    }
  };

  const openNewPlanModal = (targetRole) => {
    setEditingPlan({
      name: '',
      targetRole: targetRole || 'worker',
      price: 199,
      billingCycle: 'monthly',
      isFree: false,
      active: true,
      limits: {
        maxApplicationsPerMonth: 50,
        profileBoost: true,
        commissionDiscountPercent: 5,
        maxJobPostingsPerMonth: 20,
      },
      displayFeatures: ['Feature 1', 'Feature 2'],
      sortOrder: 3,
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const workerPlans = plans.filter((p) => p.targetRole === 'worker');
  const posterPlans = plans.filter((p) => p.targetRole === 'poster');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Subscription Plans</h1>
          <p className="page-subtitle">Configure pricing tiers, usage limits, and perks for workers and posters</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => openNewPlanModal('worker')}>
            + New Worker Plan
          </button>
          <button className="btn btn-secondary" onClick={() => openNewPlanModal('poster')}>
            + New Poster Plan
          </button>
        </div>
      </div>

      {/* WORKER PLANS SECTION */}
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '20px 0 12px' }}>👷 Worker Subscription Tiers</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 36 }}>
        {workerPlans.map((plan) => (
          <PlanCard key={plan._id} plan={plan} onEdit={() => { setEditingPlan(plan); setShowModal(true); }} onToggle={() => handleToggleActive(plan)} />
        ))}
      </div>

      {/* POSTER PLANS SECTION */}
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '20px 0 12px' }}>🏠 Poster Subscription Tiers</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {posterPlans.map((plan) => (
          <PlanCard key={plan._id} plan={plan} onEdit={() => { setEditingPlan(plan); setShowModal(true); }} onToggle={() => handleToggleActive(plan)} />
        ))}
      </div>

      {/* PLAN EDIT MODAL */}
      {showModal && editingPlan && (
        <div style={modalOverlayStyle}>
          <div className="card" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {editingPlan._id ? `Edit ${editingPlan.name}` : 'Create Subscription Plan'}
            </h2>
            <form onSubmit={handleSavePlan}>
              <div className="form-group">
                <label>Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number" min="0"
                    disabled={editingPlan.isFree}
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select
                    disabled={editingPlan.isFree}
                    value={editingPlan.billingCycle}
                    onChange={(e) => setEditingPlan({ ...editingPlan, billingCycle: e.target.value })}
                  >
                    <option value="free">Free</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {editingPlan.targetRole === 'worker' ? (
                <>
                  <div className="form-group">
                    <label>Max Applications Per Month (-1 for Unlimited)</label>
                    <input
                      type="number"
                      value={editingPlan.limits?.maxApplicationsPerMonth ?? 10}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          limits: { ...editingPlan.limits, maxApplicationsPerMonth: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Commission Discount (%)</label>
                    <input
                      type="number" min="0" max="50"
                      value={editingPlan.limits?.commissionDiscountPercent ?? 0}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          limits: { ...editingPlan.limits, commissionDiscountPercent: parseFloat(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingPlan.limits?.profileBoost ?? false}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            limits: { ...editingPlan.limits, profileBoost: e.target.checked },
                          })
                        }
                        style={{ width: 'auto' }}
                      />
                      ⚡ Profile Boost (Higher Search Ranking)
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Max Job Postings Per Month (-1 for Unlimited)</label>
                    <input
                      type="number"
                      value={editingPlan.limits?.maxJobPostingsPerMonth ?? 3}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          limits: { ...editingPlan.limits, maxJobPostingsPerMonth: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingPlan.limits?.priorityWorkerMatching ?? false}
                        onChange={(e) =>
                          setEditingPlan({
                            ...editingPlan,
                            limits: { ...editingPlan.limits, priorityWorkerMatching: e.target.checked },
                          })
                        }
                        style={{ width: 'auto' }}
                      />
                      ⚡ Priority Matching with Verified Workers
                    </label>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Display Features (Comma-separated)</label>
                <textarea
                  rows={3}
                  value={editingPlan.displayFeatures?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      displayFeatures: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, onEdit, onToggle }) {
  return (
    <div className="card" style={{ border: plan.isFree ? '1px solid var(--border)' : '2px solid #6366f1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{plan.name}</h3>
        <span className={`badge ${plan.active ? 'badge-success' : 'badge-danger'}`}>
          {plan.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
        ₹{plan.price}
        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
          {plan.isFree ? ' / forever' : ` / ${plan.billingCycle}`}
        </span>
      </div>

      <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '10px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>LIMITS & PERKS</div>
        {plan.targetRole === 'worker' ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-main)' }}>
            <li>Applications: <strong>{plan.limits?.maxApplicationsPerMonth === -1 ? 'Unlimited' : `${plan.limits?.maxApplicationsPerMonth}/mo`}</strong></li>
            <li>Profile Boost: <strong>{plan.limits?.profileBoost ? '✅ Yes' : '❌ No'}</strong></li>
            <li>Commission Discount: <strong>{plan.limits?.commissionDiscountPercent}%</strong></li>
          </ul>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-main)' }}>
            <li>Job Posts: <strong>{plan.limits?.maxJobPostingsPerMonth === -1 ? 'Unlimited' : `${plan.limits?.maxJobPostingsPerMonth}/mo`}</strong></li>
            <li>Priority Matching: <strong>{plan.limits?.priorityWorkerMatching ? '✅ Yes' : '❌ No'}</strong></li>
            <li>Recurring Jobs: <strong>{plan.limits?.recurringJobsAllowed ? '✅ Allowed' : '❌ Standard'}</strong></li>
          </ul>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={onEdit}>
          ✏️ Edit Limits
        </button>
        {!plan.isFree && (
          <button className="btn btn-ghost" style={{ padding: '8px 12px' }} onClick={onToggle}>
            {plan.active ? 'Pause' : 'Activate'}
          </button>
        )}
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};
