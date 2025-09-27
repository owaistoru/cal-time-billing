// frontend/src/pages/DashboardTutor.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../api';

// Compute next Friday 4:30 PM (local) — payroll deadline hint
function nextFridayAt1630(now = new Date()) {
  const d = new Date(now);
  const minutesNow = d.getHours() * 60 + d.getMinutes();
  const isPastDeadlineToday = d.getDay() === 5 && minutesNow >= (16 * 60 + 30);

  let daysToFri = (5 - d.getDay() + 7) % 7;
  if (daysToFri === 0 && isPastDeadlineToday) daysToFri = 7;

  const n = new Date(d);
  n.setDate(d.getDate() + daysToFri);
  n.setHours(16, 30, 0, 0);
  return n;
}

export default function DashboardTutor() {
  const [rows, setRows] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    // Fetch current user (if your app already keeps this in context, replace with that)
    (async () => {
      try {
        const me = await api.get('/api/me').catch(() => ({ data: null }));
        setAuthUser(me.data || null);
      } catch {
        setAuthUser(null);
      }
    })();

    (async () => {
      try {
        const r = await api.get('/api/sessions');
        setRows(Array.isArray(r.data) ? r.data : []);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  // If this route is somehow opened by an admin, punt them to Admin dashboard.
  if (authUser?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const kpi = useMemo(() => {
    const now = new Date();
    const wkstart = new Date(now);
    wkstart.setHours(0, 0, 0, 0);
    wkstart.setDate(now.getDate() - now.getDay()); // Sun start

    const m0 = new Date(now.getFullYear(), now.getMonth(), 1);

    let week = 0, month = 0, pending = 0;
    for (const s of rows) {
      const h = Number(s.hours || 0);
      const st = new Date(s.start_time);
      if (st >= wkstart) week += h;
      if (st >= m0) month += h;
      if (s.status === 'submitted') pending++;
    }
    return { week, month, pending };
  }, [rows]);

  const deadline = nextFridayAt1630();
  const countdown = useMemo(() => {
    const ms = +deadline - +new Date();
    if (ms <= 0) return 'due now';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return `${d}d ${h}h`;
  }, [deadline]);

  const downloadCsv = () => {
    const url = `/api/exports/timesheet?from=${from || ''}&to=${to || ''}`;
    window.location = url; // server will infer current user
  };

  const last = (rows || []).slice(0, 5).map(r => ({
    id: r.id,
    start: new Date(r.start_time).toLocaleString(),
    client: [r.client_first_name, r.client_last_name].filter(Boolean).join(' ') || r.client_name || '',
    pos: r.position || '',
    hrs: (Number(r.hours || 0)).toFixed(2),
    status: r.status
  }));

  return (
    <div className="card">
      <h2>My Dashboard</h2>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-title">Hours (This Week)</div>
          <div className="kpi-num">{kpi.week.toFixed(2)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Hours (This Month)</div>
          <div className="kpi-num">{kpi.month.toFixed(2)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Pending Approvals</div>
          <div className="kpi-num">{kpi.pending}</div>
        </div>
        <div className="kpi">
          <div className="kpi-title">Next Payroll Deadline</div>
          <div className="kpi-num">{deadline.toLocaleString()}</div>
          <div className="kpi-sub">in {countdown}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="actions" style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <Link className="btn" to="/sessions">Log a session</Link>
        <Link className="btn" to="/sessions">Duplicate last</Link>
        {/* Timer could be added later */}
      </div>

      {/* Self export */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Export my timesheet (CSV)</h3>
        <div className="form grid2">
          <label>From
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </label>
          <label>To
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </label>
          <div>
            <button className="btn" onClick={downloadCsv}>Download</button>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Recent sessions</h3>
        <table className="table">
          <thead>
            <tr><th>Date/Time</th><th>Client</th><th>Position</th><th>Hours</th><th>Status</th></tr>
          </thead>
          <tbody>
            {last.map(r => (
              <tr key={r.id}>
                <td>{r.start}</td>
                <td>{r.client}</td>
                <td>{r.pos}</td>
                <td>{r.hrs}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance nudges */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Guidelines (auto-checked by the system)</h3>
        <ul>
          <li>Sessions round to <b>0.25</b> hour increments.</li>
          <li>“Intro Meeting” positions bill a minimum of <b>0.5</b> hours.</li>
          <li>“Training” rows skip client names.</li>
          <li>“Image Description Specialist” requires <b>Subject</b> and <b>Course</b> but no client names.</li>
          <li>If a student does not attend, add note: <b>“No show”</b>.</li>
        </ul>
      </div>
    </div>
  );
}
