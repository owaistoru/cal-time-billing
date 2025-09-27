// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';

// Layout
import Navbar from './components/Navbar';

// Pages (comment out the ones you don't have)
import Sessions from './pages/Sessions';
import DashboardTutor from './pages/DashboardTutor';
import DashboardAdmin from './pages/DashboardAdmin';
// import Clients from './pages/Clients';
// import AdminApprovals from './pages/AdminApprovals';
// import AdminExports from './pages/AdminExports';

function App() {
  const [me, setMe] = useState(undefined); // undefined = loading, null = not signed in

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/me').catch(() => ({ data: null }));
        setMe(r?.data ?? null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  if (me === undefined) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  const role = me?.role === 'admin' ? 'admin' : 'user';

  return (
    <BrowserRouter>
      <Navbar user={me || null} />

      <main style={{ maxWidth: 1100, margin: '24px auto', padding: '0 16px' }}>
        <Routes>
          {/* Home by role */}
          <Route
            path="/"
            element={role === 'admin' ? <DashboardAdmin /> : <DashboardTutor />}
          />

          {/* Shared */}
          <Route path="/sessions" element={<Sessions />} />

          {/* Admin-only routes (uncomment only if these files exist) */}
          {/* {role === 'admin' && <Route path="/clients" element={<Clients />} />} */}
          {/* {role === 'admin' && <Route path="/admin/approvals" element={<AdminApprovals />} />} */}
          {/* {role === 'admin' && <Route path="/admin/exports" element={<AdminExports />} />} */}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
// Clear JWT from client so subsequent requests are anonymous
export function clearAuthToken() {
  try { localStorage.removeItem('token'); } catch {}
  try { delete api.defaults.headers.common['Authorization']; } catch {}
}