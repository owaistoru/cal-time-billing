// frontend/src/components/NavBar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    // The AuthContext and ProtectedRoute will handle redirecting the user.
  };

  const linkCls = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <header className="nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to={user ? "/dashboard" : "/"} className="brand" style={{ fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>
          CAL Time Billing
        </Link>
        
        {user && (
          <nav style={{ display: 'flex', gap: 12 }}>
            <Link to="/dashboard" className={linkCls('/dashboard')}>
              Dashboard
            </Link>
            <Link to="/sessions" className={linkCls('/sessions')}>
              Sessions
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/users" className={linkCls('/admin/users')}>
                  Users
                </Link>
                <Link to="/clients" className={linkCls('/clients')}>
                  Clients
                </Link>
              </>
            )}
          </nav>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {user?.email ? (
          <>
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="btn danger">
              Logout
            </button>
          </>
        ) : (
          location.pathname !== '/login' && <Link to="/login" className="btn">Login</Link>
        )}
      </div>
      <style>{`
        .nav-link { color: #9ca3af; text-decoration: none; padding: 6px 10px; border-radius: 6px; transition: all 0.2s; }
        .nav-link:hover { background: #1f2937; color: #e5e7eb; }
        .nav-link.active { color: #ffffff; background: #3b82f6; }
      `}</style>
    </header>
  );
}