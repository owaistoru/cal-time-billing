// frontend/src/pages/AdminApprovals.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

export default function AdminApprovals() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [reason, setReason] = useState('');
  const [me, setMe] = useState(null);
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
        setRows(Array.isArray(r.data) ? r.data : []);
        setSelected(new Set());
      } catch (e) {
        setErr(e?.response?.data?.msg || 'Failed to load approvals');
        setRows([]);
      }
    })();
  }, []);

  if (me && me.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const approve = async () => {
    if (!selected.size) return;
    setErr('');
    try {
      await api.post('/api/approvals/bulk', { approve: Array.from(selected) });
      // reload
      const r = await api.get('/api/approvals/queue');
      setRows(Array.isArray(r.data) ? r.data : []);
      setSelected(new Set());
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Approve failed');
    }
  };

  const reject = async () => {
    if (!selected.size) return;
    if (!reason.trim()) return alert('Enter a rejection reason');
    setErr('');
    try {
      const payload = { reject: Array.from(selected).map((id) => ({ id, reason })) };
      await api.post('/api/approvals/bulk', payload);
      setReason('');
      const r = await api.get('/api/approvals/queue');
      setRows(Array.isArray(r.data) ? r.data : []);
      setSelected(new Set());
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Reject failed');
    }
  };

  return (
    <div className="card">
      <h2>Approvals</h2>
      {err && <p className="error">{err}</p>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button className="btn" onClick={approve} disabled={!selected.size}>Approve selected</button>
        <input
          placeholder="Rejection reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn danger" onClick={reject} disabled={!selected.size || !reason.trim()}>Reject selected</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Tutor</th>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Position</th>
            <th>Client</th>
            <th>Subject/Course</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r) => (
            <tr key={r.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggle(r.id)}
                />
              </td>
              <td>{r.tutor_email}</td>
              <td>{r.session_date}</td>
              <td>{r.start_time}</td>
              <td>{r.end_time}</td>
              <td>{r.position}</td>
              <td>{[r.client_first_name, r.client_last_name].filter(Boolean).join(' ')}</td>
              <td>{[r.subject_code, r.course_number].filter(Boolean).join(' ')}</td>
              <td>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
