// frontend/src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api, { clearAuthToken } from '../api';

export default function Navbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  async function handleLogout() {
	  // Best effort: tell server; then nuke token locally
	  try { await api.post('/api/auth/logout'); } catch {}
	  clearAuthToken();
	  // hard redirect so App re-fetches /api/me and shows logged-out UI
	  window.location.href = '/';
  }

  const linkCls = (path) =>
    location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0b1220',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Link to="/" className="brand" style={{ fontWeight: 700, color: '#9db1ff', textDecoration: 'none' }}>
          CAL
        </Link>

        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/sessions" className={linkCls('/sessions')}>
            Sessions
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin" className={linkCls('/admin')}>
                Admin
              </Link>
              <Link to="/clients" className={linkCls('/clients')}>
                Clients
              </Link>
            </>
          )}
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {user?.email ? (
            <>
              <span style={{ opacity: 0.8 }}>{user.email}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: '#4a79ff',
                  color: 'white',
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* tiny CSS helpers for active link */}
      <style>{`
        .nav-link { color: #c9d1f0; text-decoration: none; padding: 6px 8px; border-radius: 8px; }
        .nav-link:hover { background: rgba(255,255,255,0.06); }
        .nav-link.active { color: #ffffff; background: rgba(74,121,255,0.18); }
      `}</style>
    </header>
  );
}
