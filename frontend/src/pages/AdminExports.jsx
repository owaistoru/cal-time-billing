// frontend/src/pages/AdminExports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';

export default function AdminExports() {
  const [users, setUsers] = useState([]);
  const [loadErr, setLoadErr] = useState('');
  const [tutorId, setTutorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState('');

  // Load all users from the admin endpoint and keep only tutors
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadErr('');
        const { data } = await api.get('/api/admin/users'); // admin list
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setUsers(list.filter(u => (u.role || '').toLowerCase() === 'tutor'));
      } catch (e) {
        if (!alive) return;
        setLoadErr('Could not load tutors list. You can still paste a Tutor ID manually.');
        setUsers([]); // degrade gracefully
      }
    })();
    return () => { alive = false; };
  }, []);

  const canDownload = useMemo(
    () => String(tutorId || '').trim() && from && to,
    [tutorId, from, to]
  );

  async function handleDownload() {
    try {
      setErr('');
      if (!tutorId) return setErr('Pick a tutor or enter a Tutor ID.');
      if (!from || !to) return setErr('Select both From and To dates.');

      setDownloading(true);
      const qs = new URLSearchParams({ tutorId: String(tutorId), from, to }).toString();

      // Use axios instance so Authorization header is included automatically.
      const res = await api.get(`/api/exports/timesheet?${qs}`, { responseType: 'blob' });
      const blob = res.data;

      const a = document.createElement('a');
      const fname = `timesheet_${tutorId}_${from}_${to}.csv`.replace(/[^a-zA-Z0-9_.-]/g, '_');
      a.href = URL.createObjectURL(blob);
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 0);
    } catch (e) {
      const msg = e?.response?.status ? `Export failed: ${e.response.status}` : (e.message || 'Export failed');
      setErr(msg);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-6">Timesheet Exports</h1>

      {loadErr && <div className="mb-3 text-yellow-400 text-sm">{loadErr}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm mb-1">Tutor</label>
          {users.length > 0 ? (
            <select
              className="w-full rounded bg-slate-800 p-2"
              value={tutorId}
              onChange={e => setTutorId(e.target.value)}
            >
              <option value="">select</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name ? `${u.full_name} — ${u.email}` : u.email} (id {u.id})
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full rounded bg-slate-800 p-2"
              placeholder="Paste Tutor ID"
              value={tutorId}
              onChange={e => setTutorId(e.target.value)}
            />
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">From (YYYY-MM-DD)</label>
          <input type="date" className="w-full rounded bg-slate-800 p-2" value={from} onChange={e => setFrom(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm mb-1">To (YYYY-MM-DD)</label>
          <input type="date" className="w-full rounded bg-slate-800 p-2" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {err && <div className="mt-3 text-red-400 text-sm">{err}</div>}

      <button
        className="mt-4 px-4 py-2 rounded bg-blue-600 disabled:opacity-50"
        disabled={!canDownload || downloading}
        onClick={handleDownload}
      >
        {downloading ? 'Preparing CSV…' : 'Download CSV'}
      </button>

      <p className="text-sm opacity-80 mt-4">
        Exports include <b>approved</b> sessions for the selected tutor within the dates provided.
      </p>
    </div>
  );
}
