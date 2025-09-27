import { useEffect, useState } from 'react';
import api from '../api';

export default function Clients() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', contact_email: '', notes: '' });
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try {
      const r = await api.get('/api/clients');
      const data = Array.isArray(r.data) ? r.data : [];
      setRows(data);
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to load clients');
      setRows([]); // prevent .map crash
    }
  };


  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/api/clients', {
        name: form.name,
        contact_email: form.contact_email || null,
        notes: form.notes || null
      });
      setForm({ name: '', contact_email: '', notes: '' });
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Failed to create client');
    }
  };

  const del = async id => {
    if (!confirm('Delete this client?')) return;
    try {
      await api.delete(`/api/clients/${id}`);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Delete failed');
    }
  };

  return (
    <div className="card">
      <h2>Clients</h2>
      {err && <p className="error">{err}</p>}

      <form className="form row" onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Contact email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
        <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button className="btn" type="submit">Add</button>
      </form>

      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Notes</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.contact_email || ''}</td>
              <td>{r.notes || ''}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td><button className="btn danger" onClick={() => del(r.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
