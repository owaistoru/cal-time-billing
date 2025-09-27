// frontend/src/pages/Dashboard.jsx
import { useAuth } from '../context/AuthContext';
import DashboardAdmin from './DashboardAdmin';
import DashboardTutor from './DashboardTutor';

export default function Dashboard() {
  const { user } = useAuth();

  // This fallback should rarely be seen because ProtectedRoute handles it,
  // but it's good practice to have.
  if (!user) {
    return <div className="card"><p>Loading user data...</p></div>;
  }

  // Render the correct dashboard based on the user's role.
  return user.role === 'admin' ? <DashboardAdmin /> : <DashboardTutor />;
}