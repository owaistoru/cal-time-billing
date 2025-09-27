// frontend/src/pages/DashboardAdmin.jsx
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';

export default function DashboardAdmin() {
  const [me, setMe] = useState(null);
  const [pending, setPending] = useState(0);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/me').catch(() => ({ data: null }));
        setMe(r.data || null);
      } catch { setMe(null); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/approvals/queue');
        setPending(Array.isArray(r.data) ? r.data.length : 0);
      } catch (e) {
        setErr(e?.response?.data?.msg || 'Failed to load approvals');
      }
    })();
  }, []);

  if (me && me.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="card">
      <h2>Admin Dashboard</h2>
      {err && <p className="error">{err}</p>}

      <div className="kpis">
        <div className="kpi">
          <div className="kpi-title">Pending Approvals</div>
          <div className="kpi-num">{pending}</div>
        </div>
      </div>

      <div className="actions" style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <Link className="btn" to="/admin/approvals">Open Approvals</Link>
        <Link className="btn" to="/admin/exports">Timesheet Exports</Link>
        <Link className="btn" to="/clients">Manage Clients</Link>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>What’s here</h3>
        <ul>
          <li><b>Approvals:</b> review and bulk approve/reject submitted sessions.</li>
          <li><b>Exports:</b> download tutor CSVs matching UVic/CAL timesheet columns.</li>
          <li><b>Clients:</b> admin-only client add/remove.</li>
        </ul>
      </div>
    </div>
  );
}
