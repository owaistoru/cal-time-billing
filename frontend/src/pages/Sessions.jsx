// frontend/src/pages/Sessions.jsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// --- Constants (as defined in the backend) ---
const POSITIONS = [
  'Tutor','Learning Strategist','Intro Meeting (solo)','Intro Meeting (facilitated)',
  'Training','Peer Mentorship','Study Solutions','Coordinator','Program Development',
  'Image Description Specialist','Other'
];
const INTRO = new Set(['Intro Meeting (solo)','Intro Meeting (facilitated)']);

// --- Helper Functions ---
function roundQuarter(h) { return Math.round(h / 0.25) * 0.25; }

// Helper to format a Date object into a string suitable for <input type="datetime-local">
const toDateTimeLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function Sessions() {
  const { user } = useAuth(); // Get user data, including pay rate
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [duration, setDuration] = useState('1.0'); // Default duration of 1 hour

  const [form, setForm] = useState({
    position: 'Tutor',
    client_first_name: '',
    client_last_name: '',
    start_time: toDateTimeLocal(new Date()), // FEATURE: Default to current time
    notes: '',
    no_show: false
  });

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/api/sessions');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to load sessions');
    }
  };

  useEffect(() => { loadSessions(); }, []);

  // --- DERIVED VALUES for the smart UI ---
  const { hoursPreview, isMinApplied, totalAmount } = useMemo(() => {
    const dur = parseFloat(duration) || 0;
    const roundedHours = roundQuarter(dur);
    
    let finalHours = roundedHours;
    let minApplied = false;

    if (INTRO.has(form.position) && roundedHours < 0.5) {
      finalHours = 0.5;
      minApplied = true;
    }
    
    const rate = (user?.pay_rate_cents || 0) / 100;
    const amount = finalHours * rate;

    return { 
      hoursPreview: finalHours.toFixed(2), 
      isMinApplied: minApplied,
      totalAmount: amount.toFixed(2)
    };
  }, [duration, form.position, user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      // BUG FIX & FEATURE: Calculate end_time just before submitting
      const startTime = new Date(form.start_time);
      const durationMs = (parseFloat(duration) || 0) * 60 * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);

      await api.post('/api/sessions', {
        ...form,
        description: form.notes, // Align frontend 'notes' with backend 'description'
        end_time: endTime.toISOString() // Send the calculated end time
      });
      
      // Reset form to smart defaults
      setForm({
        position: 'Tutor', client_first_name: '', client_last_name: '',
        start_time: toDateTimeLocal(new Date()), notes: '', no_show: false
      });
      setDuration('1.0');
      await loadSessions();

    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Failed to create session');
    }
  };
  
  const del = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this session?')) {
      await api.delete(`/api/sessions/${id}`);
      await loadSessions();
    }
  };

  const payRate = (user?.pay_rate_cents || 0) / 100;

  return (
    <div className="card">
      <h2>Log a New Session</h2>
      {err && <p className="error">{err}</p>}

      <form className="form grid" onSubmit={onSubmit} style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <label>Position
          <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>Client First Name
          <input value={form.client_first_name} onChange={e => setForm({ ...form, client_first_name: e.target.value })}/>
        </label>
        <label>Client Last Name
          <input value={form.client_last_name} onChange={e => setForm({ ...form, client_last_name: e.target.value })}/>
        </label>
        
        <label>Start Time
          <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required/>
        </label>
        <label>Duration (hours)
          <input type="number" step="0.25" value={duration} onChange={e => setDuration(e.target.value)} required />
        </label>
        <label>Notes
          <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/>
        </label>
      </form>

      <div className="card" style={{ marginTop: '20px', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontSize: '1.2rem' }}>
                    Hours: <b>{hoursPreview}{isMinApplied && '*'}</b>
                </div>
                {isMinApplied && <p style={{fontSize: '0.8rem', color: '#9ca3af', margin: '4px 0 0'}}>*Intro Meeting minimum applied.</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Pay Rate: ${payRate.toFixed(2)}/hr</div>
                <div style={{ fontSize: '1.2rem' }}>
                    Total: <b>${totalAmount}</b>
                </div>
            </div>
            <button className="btn" onClick={onSubmit} style={{ padding: '12px 24px' }}>Add Session</button>
        </div>
      </div>

      <hr style={{margin: '24px 0', borderColor: 'var(--border)'}} />

      <h3>Logged Sessions</h3>
      <table className="table">
        <thead><tr>
          <th>Client</th><th>Start</th><th>End</th><th>Hours</th>
          <th>Position</th><th>Status</th><th>Notes</th><th></th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{`${r.client_first_name || ''} ${r.client_last_name || ''}`.trim() || r.client_name || 'N/A'}</td>
              <td>{new Date(r.start_time).toLocaleString('en-CA')}</td>
              <td>{new Date(r.end_time).toLocaleString('en-CA')}</td>
              <td>{r.hours != null ? Number(r.hours).toFixed(2) : ''}</td>
              <td>{r.position}</td>
              <td>{r.status}</td>
              <td>{r.description}{r.no_show ? (r.description ? '; No show' : 'No show') : ''}</td>
              <td><button className="btn danger" onClick={() => del(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}