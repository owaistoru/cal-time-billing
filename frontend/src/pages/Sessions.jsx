// frontend/src/pages/Sessions.jsx
import { useEffect, useMemo, useState } from 'react';
import api from '../api';

const POSITIONS = [
  'Tutor','Learning Strategist','Intro Meeting (solo)','Intro Meeting (facilitated)',
  'Training','Peer Mentorship','Study Solutions','Coordinator','Program Development',
  'Image Description Specialist','Other'
];
const INTRO = new Set(['Intro Meeting (solo)','Intro Meeting (facilitated)']);
const TRAINING = new Set(['Training']);
const IDS = new Set(['Image Description Specialist']);

function parseMaybe(d) {
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(d);
}
function diffHours(a,b) {
  const da = parseMaybe(a), db = parseMaybe(b);
  if (!da || !db) return '';
  let h = (db - da)/3600000;
  if (h < 0) h += 24; // UI preview only; server is source of truth
  return h;
}
function roundQuarter(h) { return Math.round(h/0.25)*0.25; }

export default function Sessions() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [err, setErr] = useState('');
  const [f, setF] = useState({
    position: 'Tutor',
    client_id: '',
    client_first_name: '',
    client_last_name: '',
    subject_code: '',
    course_number: '',
    start_time: '',
    end_time: '',
    description: '',
    no_show: false
  });

  const role = me?.role || 'user';
  const isAdmin = role === 'admin';

  const hoursPreview = useMemo(() => {
    const h = diffHours(f.start_time, f.end_time);
    if (h === '') return '';
    let v = roundQuarter(h);
    if (INTRO.has(f.position) && v < 0.5) v = 0.5;
    return v.toFixed(2);
  }, [f.start_time, f.end_time, f.position]);

  const load = async () => {
    setErr('');
    try {
      const [meRes, sRes] = await Promise.all([
        api.get('/api/me').catch(() => ({ data: null })),
        api.get('/api/sessions')
      ]);
      setMe(meRes.data || null);
      setRows(Array.isArray(sRes.data) ? sRes.data : []);
      // Only admins get client list (tutors shouldn't manage clients)
      if (meRes?.data?.role === 'admin') {
        const c = await api.get('/api/clients').catch(() => ({ data: [] }));
        setClients(Array.isArray(c.data) ? c.data : []);
      } else {
        setClients([]); // ensure empty for tutors
      }
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to load data');
      setRows([]); setClients([]);
    }
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const body = { ...f };
      // Tutors never send client_id (policy); Admin may include it
      if (!isAdmin || TRAINING.has(f.position) || IDS.has(f.position) || !f.client_id) {
        delete body.client_id;
      } else {
        body.client_id = Number(f.client_id);
      }
      await api.post('/api/sessions', body);
      setF({
        position: f.position,
        client_id: '',
        client_first_name: '',
        client_last_name: '',
        subject_code: '',
        course_number: '',
        start_time: '',
        end_time: '',
        description: '',
        no_show: false
      });
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Create failed');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this session?')) return;
    try { await api.delete(`/api/sessions/${id}`); await load(); }
    catch (e) { setErr(e?.response?.data?.msg || 'Delete failed'); }
  };

  const needsClient = !(TRAINING.has(f.position) || IDS.has(f.position));
  const needsCourse = IDS.has(f.position);

  return (
    <div className="card">
      <h2>Sessions</h2>
      {err && <p className="error">{err}</p>}

      <form className="form grid2" onSubmit={onSubmit}>
        <label>Position
          <select value={f.position} onChange={e => setF({ ...f, position: e.target.value })}>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>

        {/* Admin can optionally pick an existing client; tutors cannot */}
        {isAdmin && needsClient && (
          <label>Client (existing)
            <select
              value={f.client_id}
              onChange={e => setF({ ...f, client_id: e.target.value })}
            >
              <option value="">Select client</option>
              {(clients || []).map(c =>
                <option key={c.id} value={c.id}>
                  {c.name ?? c.client_name ?? c.full_name ?? `#${c.id}`}
                </option>
              )}
            </select>
          </label>
        )}

        {needsClient && (
          <>
            <label>Client First Name
              <input value={f.client_first_name} onChange={e => setF({ ...f, client_first_name: e.target.value })}/>
            </label>
            <label>Client Last Name
              <input value={f.client_last_name} onChange={e => setF({ ...f, client_last_name: e.target.value })}/>
            </label>
          </>
        )}

        {needsCourse && (
          <>
            <label>Subject (e.g., PSYC, LS)
              <input value={f.subject_code} onChange={e => setF({ ...f, subject_code: e.target.value })}/>
            </label>
            <label>Course Number
              <input value={f.course_number} onChange={e => setF({ ...f, course_number: e.target.value })}/>
            </label>
          </>
        )}

        <label>Start
          <input type="datetime-local" value={f.start_time} onChange={e => setF({ ...f, start_time: e.target.value })} required/>
        </label>
        <label>End
          <input type="datetime-local" value={f.end_time} onChange={e => setF({ ...f, end_time: e.target.value })} required/>
        </label>

        <label>Notes
          <input value={f.description} onChange={e => setF({ ...f, description: e.target.value })}/>
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={!!f.no_show} onChange={e => setF({ ...f, no_show: e.target.checked })}/>
          No show
        </label>

        <div>
          <div style={{opacity:.7, marginBottom:8}}>Hours (preview): <b>{hoursPreview}</b></div>
          <button className="btn" type="submit">Add</button>
        </div>
      </form>

      <table className="table">
        <thead><tr>
          <th>Client</th><th>Start</th><th>End</th><th>Hours</th>
          <th>Position</th><th>Status</th><th>Notes</th><th></th>
        </tr></thead>
        <tbody>
          {(rows || []).map(r => (
            <tr key={r.id}>
              <td>{r.client_first_name || r.client_last_name
                    ? `${r.client_first_name ?? ''} ${r.client_last_name ?? ''}`.trim()
                    : (r.client_name || r.client_id || '')}</td>
              <td>{new Date(r.start_time).toLocaleString()}</td>
              <td>{new Date(r.end_time).toLocaleString()}</td>
              <td>{r.hours == null ? '' : Number(r.hours).toFixed(2)}</td>
              <td>{r.position || ''}</td>
              <td>{r.status || ''}</td>
              <td>{r.description || ''}{r.no_show ? (r.description ? '; No show' : 'No show') : ''}</td>
              <td><button className="btn danger" onClick={() => del(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
