// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Page Imports
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Clients from './pages/Clients';
import AdminApprovals from './pages/AdminApprovals';
import AdminExports from './pages/AdminExports';
import AdminUsers from './pages/AdminUsers';
import DashboardAdmin from './pages/DashboardAdmin'; // Import DashboardAdmin for the admin route

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute role="admin"><Clients /></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><AdminApprovals /></ProtectedRoute>} />
          <Route path="/admin/exports" element={<ProtectedRoute role="admin"><AdminExports /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />

          {/* Fallback for any other path */}
          <Route path="*" element={<div className="card"><h2>404 - Not Found</h2></div>} />
        </Routes>
      </main>
    </div>
  );
}