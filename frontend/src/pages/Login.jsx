import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async e => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      nav('/');
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="card">
      <h2>Login</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={onSubmit} className="form">
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button className="btn" type="submit">Login</button>
      </form>
      <p>New here? <Link to="/register">Register</Link></p>
    </div>
  );
}
