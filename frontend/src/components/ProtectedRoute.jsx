// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  // If there is no user, redirect to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a role is required and the user's role does not match,
  // redirect them to their main dashboard.
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  // If the user is authenticated (and has the right role, if required),
  // render the child components.
  return children;
}