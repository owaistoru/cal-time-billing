import { useEffect, useState } from 'react';
import api from '../api';

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' });
  const [resetPass, setResetPass] = useState({});

  const load = async () => {
    setErr('');
    try {
		const r = await api.get('/api/admin/users');
		setRows(Array.isArray(r.data) ? r.data : []);

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
      setNewUser({ email: '', password: '', role: 'user' });
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Failed to create user');
    }
  };

  const changeRole = async (id, role) => {
    try {
      await api.post(`/api/admin/users/${id}/role`, { role });
      await load();
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to change role');
    }
  };

  const doReset = async (id) => {
    const pw = resetPass[id];
    if (!pw) return;
    try {
      await api.post(`/api/admin/users/${id}/reset-password`, { password: pw });
      setResetPass(s => ({ ...s, [id]: '' }));
      await load();
    } catch (e) {
      setErr(e?.response?.data?.msg || 'Failed to reset password');
    }
  };

  return (
    <div className="card">
      <h2>Admin Users</h2>
      {err && <p className="error">{err}</p>}

      <form className="form grid2" onSubmit={createUser} style={{marginBottom:12}}>
        <label>Email
          <input type="email" required value={newUser.email}
                 onChange={e=>setNewUser({...newUser, email:e.target.value})}/>
        </label>
        <label>Password
          <input type="password" required value={newUser.password}
                 onChange={e=>setNewUser({...newUser, password:e.target.value})}/>
        </label>
        <label>Role
          <select value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button className="btn" type="submit">Create user</button>
      </form>

      <table className="table">
        <thead><tr><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{new Date(u.created_at).toLocaleString()}</td>
              <td style={{display:'grid', gap:8}}>
                <div>
                  <button className="btn" onClick={() => changeRole(u.id, 'user')}>Make user</button>{' '}
                  <button className="btn" onClick={() => changeRole(u.id, 'admin')}>Make admin</button>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <input
                    placeholder="New password"
                    type="password"
                    value={resetPass[u.id] || ''}
                    onChange={e => setResetPass(s => ({ ...s, [u.id]: e.target.value }))}
                  />
                  <button className="btn" onClick={() => doReset(u.id)}>Reset</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
