import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/safety', label: 'Safety Events', icon: '🆘', sos: true },
  { to: '/verifications', label: 'Verifications', icon: '🪪' },
  { to: '/jobs', label: 'All Jobs', icon: '💼' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/transactions', label: 'Transactions', icon: '💰' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
  { to: '/config', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ activeSafetyCount = 0 }) {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>WorkMarket</h2>
        <p>Admin Dashboard</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.sos && activeSafetyCount > 0 && (
              <span className="nav-badge">{activeSafetyCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
          🚪 Log Out
        </button>
      </div>
    </aside>
  );
}
