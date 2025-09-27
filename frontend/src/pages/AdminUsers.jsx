// frontend/src/pages/AdminUsers.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ROLES = ['tutor', 'admin'];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [q, setQ] = useState('');

  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'tutor',
  });

  async function load() {
    try {
      setErr('');
      const { data } = await api.get('/api/admin/users'); // backend GET /api/admin/users
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to load users');
    }
  }

  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    setErr('');
    const payload = {
      full_name: (newUser.full_name || '').trim(),
      email: (newUser.email || '').trim(),
      password: newUser.password || '',
      role: newUser.role,
    };
    if (!payload.full_name || !payload.email || !payload.password) {
      setErr('Full name, email, and password are required.');
      return;
    }
    if (!ROLES.includes(payload.role)) {
      setErr("Role must be 'tutor' or 'admin'.");
      return;
    }
    try {
      await api.post('/api/admin/users', payload);
      setNewUser({ full_name: '', email: '', password: '', role: 'tutor' });
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Failed to create user');
    }
  }

  async function delUser(u) {
    if (!window.confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Delete failed');
    }
  }

  const filtered = useMemo(() => {
    let out = rows;
    if (roleFilter !== 'All') {
      out = out.filter(r => (r.role || '').toLowerCase() === roleFilter.toLowerCase());
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter(r =>
        String(r.id).includes(s) ||
        (r.email || '').toLowerCase().includes(s) ||
        (r.full_name || r.name || '').toLowerCase().includes(s)
      );
    }
    return out;
  }, [rows, roleFilter, q]);

  return (
    <div className="card">
      <h2 className="mb-3">Admin Users</h2>
      {err && <p className="error">{err}</p>}

      <form className="form grid" onSubmit={createUser} style={{ marginBottom: 24 }}>
        <label>Full Name
          <input
            value={newUser.full_name}
            onChange={e => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
            required
          />
        </label>

        <label>Email
          <input
            type="email"
            value={newUser.email}
            onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </label>

        <label>Password
          <input
            type="password"
            value={newUser.password}
            onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </label>

        <label>Role
          <select
            value={newUser.role}
            onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="tutor">Tutor</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div>
          <button className="btn" type="submit">Create user</button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2">
          <span className="opacity-80">Role</span>
          <select
            className="bg-transparent border rounded px-3 py-2"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option>All</option>
            <option value="tutor">Tutor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <input
          className="rounded bg-slate-800 px-3 py-2 flex-1"
          placeholder="Search by name, email, or ID…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <table className="table">
        <thead>
          <tr><th>#</th><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map((u, i) => (
            <tr key={u.id}>
              <td>{i + 1}</td>
              <td>{u.id}</td>
              <td>{u.full_name || u.name || '-'}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button
                  className="btn danger"
                  onClick={() => delUser(u)}
                  disabled={currentUser?.id === u.id}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', opacity: 0.7 }}>No users.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
