// frontend/src/pages/AdminExports.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

export default function AdminExports() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');
  const [users, setUsers] = useState(null); // null = unknown (fetching/failed), [] = none
  const [tutorId, setTutorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // who am i?
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/me').catch(() => ({ data: null }));
        setMe(r.data || null);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  // optional list of users (nice-to-have, not required)
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/users'); // if you don't have this route, we'll degrade gracefully
        const list = Array.isArray(r.data) ? r.data : [];
        // keep only tutors by role if present
        const filtered = list.filter(u => (u.role ? u.role !== 'admin' : true));
        setUsers(filtered);
      } catch {
        setUsers(null); // will show manual input for tutorId
      }
    })();
  }, []);

  if (me && me.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const download = () => {
    setErr('');
    const id = String(tutorId || '').trim();
    if (!id) {
      setErr('Pick or enter a Tutor ID.');
      return;
    }
    const url =
      `/api/exports/timesheet?tutorId=${encodeURIComponent(id)}` +
      `&from=${encodeURIComponent(from || '')}` +
      `&to=${encodeURIComponent(to || '')}`;
    window.location = url;
  };

  return (
    <div className="card">
      <h2>Timesheet Export (CSV)</h2>
      {err && <p className="error">{err}</p>}

      <div className="form grid2">
        {Array.isArray(users) ? (
          <label>Tutor
            <select
              value={tutorId}
              onChange={e => setTutorId(e.target.value)}
            >
              <option value="">Select tutor</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.email || `User #${u.id}`} {u.role ? `(${u.role})` : ''}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>Tutor ID
            <input
              type="number"
              placeholder="Enter tutor user ID"
              value={tutorId}
              onChange={e => setTutorId(e.target.value)}
            />
          </label>
        )}

        <label>From
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </label>

        <label>To
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </label>

        <div>
          <button className="btn" onClick={download}>Download CSV</button>
        </div>
      </div>

      <p style={{opacity:.8, marginTop:12}}>
        Exports only <b>approved</b> sessions in the selected date range.
        Output matches UVic/CAL columns (Position, Client First/Last, Subject, Course, Month, Day, Start, End, Hours, Notes).
      </p>
    </div>
  );
}
