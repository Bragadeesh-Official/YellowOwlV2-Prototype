import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_SESSION_KEY, MOCK_SCHOOLS, MOCK_ADMIN_USERS, type School, type AdminUser } from '@/mock/adminData';
import SchoolsSection from './SchoolsSection';
import logo from '@/assets/yellowowllogo.png';

type Section = 'schools';

const NAV_ITEMS: { key: Section; label: string; short: string }[] = [
  { key: 'schools', label: 'Tenants', short: 'Te' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>('schools');
  const [collapsed, setCollapsed] = useState(false);

  // Lifted and persistent states
  const [schools, setSchools] = useState<School[]>(() => {
    const saved = localStorage.getItem('yellowowl_admin_schools');
    return saved ? JSON.parse(saved) : MOCK_SCHOOLS;
  });
  const [users, setUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('yellowowl_admin_users');
    return saved ? JSON.parse(saved) : MOCK_ADMIN_USERS;
  });

  const updateSchools = (newSchools: School[] | ((prev: School[]) => School[])) => {
    setSchools(prev => {
      const next = typeof newSchools === 'function' ? newSchools(prev) : newSchools;
      localStorage.setItem('yellowowl_admin_schools', JSON.stringify(next));
      return next;
    });
  };

  const updateUsers = (newUsers: AdminUser[] | ((prev: AdminUser[]) => AdminUser[])) => {
    setUsers(prev => {
      const next = typeof newUsers === 'function' ? newUsers(prev) : newUsers;
      localStorage.setItem('yellowowl_admin_users', JSON.stringify(next));
      return next;
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    navigate('/login');
  };

  const navBtn = (item: (typeof NAV_ITEMS)[number]) => {
    const active = section === item.key;
    return (
      <button
        key={item.key}
        onClick={() => setSection(item.key)}
        title={collapsed ? item.label : undefined}
        className={`admin-nav-btn ${active ? 'active' : ''}`}
        style={{
          width: '100%',
          textAlign: collapsed ? 'center' : 'left',
          padding: collapsed ? '12px 0' : '12px 14px',
        }}
      >
        {collapsed ? item.short : item.label}
      </button>
    );
  };

  const ghostBtn = (label: string, shortLabel: string, onClick: () => void, danger = false) => (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`admin-ghost-btn ${danger ? 'danger' : ''}`}
      style={{
        width: '100%',
        textAlign: collapsed ? 'center' : 'left',
        padding: collapsed ? '10px 0' : '10px 14px',
      }}
    >
      {collapsed ? shortLabel : label}
    </button>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? 64 : 240,
          background: '#ffffff',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          height: '100vh',
          transition: 'width 0.25s ease',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: '1px solid #E2E8F0',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: collapsed ? '15px 0' : '20px 16px',
            borderBottom: '1px solid #E2E8F0',
            textAlign: 'center',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? (
            <img src={logo} alt="Logo" style={{ height: 40, margin: '0 auto', objectFit: 'contain' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'left' }}>
              <img src={logo} alt="Yellow Owl Logo" style={{ height: 52, objectFit: 'contain' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#1f2937', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>Yellow Owl</div>
                <div style={{ color: '#B8A800', fontSize: 10, fontWeight: 700, letterSpacing: 1.2 }}>
                  SUPER ADMIN
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV_ITEMS.map(navBtn)}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px 8px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ghostBtn(collapsed ? '›' : '‹ Collapse', collapsed ? '›' : '‹', () => setCollapsed(c => !c))}
          {ghostBtn('Sign Out', 'Out', handleSignOut, true)}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {section === 'schools' && (
          <SchoolsSection schools={schools} setSchools={updateSchools} users={users} setUsers={updateUsers} />
        )}
      </main>
    </div>
  );
}
