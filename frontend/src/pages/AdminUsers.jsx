import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user', full_name: '' });
  const [resetPass, setResetPass] = useState({});

  const load = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to load users');
    }
  };

  useEffect(() => { load(); }, []);

  const createUser = async e => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/api/admin/users', newUser);
      setNewUser({ email: '', password: '', role: 'user', full_name: '' });
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Failed to create user');
    }
  };

  const delUser = async (userToDelete) => {
    if (window.confirm(`Are you sure you want to permanently delete ${userToDelete.email}? This action cannot be undone.`)) {
      try {
        await api.delete(`/api/admin/users/${userToDelete.id}`);
        await load();
      } catch (e) {
        setErr(e?.response?.data?.msg || 'Delete failed');
      }
    }
  };

  return (
    <div className="card">
      <h2>Admin Users</h2>
      {err && <p className="error">{err}</p>}

      <form className="form grid" onSubmit={createUser} style={{ marginBottom: 24 }}>
        <label>Full Name<input value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} required /></label>
        <label>Email<input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required /></label>
        <label>Password<input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required /></label>
        <label>Role
          <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <div><button className="btn" type="submit">Create user</button></div>
      </form>

      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button
                  className="btn danger"
                  onClick={() => delUser(u)}
                  disabled={currentUser.id === u.id}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}