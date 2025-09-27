// frontend/src/pages/HomePage.jsx
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  // If the user is already logged in, redirect them to their dashboard.
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise, display the public home page.
  return (
    <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '2.5rem', color: '#e5e7eb' }}>
        Welcome to CAL Time Billing
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#9ca3af', maxWidth: '600px', margin: '1rem auto' }}>
        Streamline your session tracking and timesheet submissions with ease. Log in to continue or create an account to get started.
      </p>
      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link to="/login" className="btn" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          Login
        </Link>
        <Link to="/register" className="btn" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#374151' }}>
          Register
        </Link>
      </div>
    </div>
  );
}