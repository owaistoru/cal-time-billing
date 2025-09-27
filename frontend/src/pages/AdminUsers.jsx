import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ALLOWED_ROLES = ['tutor', 'admin'];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'tutor', // default to valid enum
  });

  const load = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to load users');
    }
  };

  useEffect(() => { load(); }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setErr('');

    const payload = {
      full_name: (newUser.full_name || '').trim(),
      email: (newUser.email || '').trim(),
      password: newUser.password || '',
      role: newUser.role, // send exactly 'tutor' or 'admin'
    };

    if (!payload.full_name || !payload.email || !payload.password) {
      setErr('Full name, email, and password are required.');
      return;
    }
    if (!ALLOWED_ROLES.includes(payload.role)) {
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
  };

  const delUser = async (u) => {
    if (!window.confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Delete failed');
    }
  };

  return (
    <div className="card">
      <h2>Admin Users</h2>
      {err && <p className="error">{err}</p>}

      <form className="form grid" onSubmit={createUser} style={{ marginBottom: 24 }}>
        <label>Full Name
          <input
            value={newUser.full_name}
            onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
            required
          />
        </label>

        <label>Email
          <input
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </label>

        <label>Password
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </label>

        <label>Role
          <select
            value={newUser.role}
            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="tutor">Tutor</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div>
          <button className="btn" type="submit">Create user</button>
        </div>
      </form>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td>{u.full_name || u.name}</td>
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
          {rows.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center', opacity: 0.7 }}>No users yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
