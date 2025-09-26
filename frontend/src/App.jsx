import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

function App() {
  // Add 'user' here to get it from the context
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <div>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'black' }}>
          <h1>CAL Time & Billing</h1>
        </Link>
        <div>
          {/* This conditional link will now work */}
          {user && user.role === 'admin' && (
            <Link to="/admin" style={{ marginRight: '1rem' }}>
              Admin
            </Link>
          )}
          {token ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;