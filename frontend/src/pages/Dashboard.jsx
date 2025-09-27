import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="card">
      <h2>Dashboard</h2>
      <p>Welcome, {user?.email}</p>
      <div className="grid">
        <Link to="/clients" className="tile">Manage Clients</Link>
        <Link to="/sessions" className="tile">Log Sessions</Link>
        {user?.role === 'admin' && <Link to="/admin" className="tile">Admin Panel</Link>}
      </div>
    </div>
  );
}
