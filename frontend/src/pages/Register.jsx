import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const onSubmit = async e => {
    e.preventDefault();
    setErr('');
    try {
      await register(email, password, fullName || undefined);
      nav('/');
    } catch (e2) {
      setErr(e2?.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={onSubmit} className="form">
        <label>Full name
          <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
        </label>
        <label>Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button className="btn" type="submit">Create account</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
