import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

// Import Page Components
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ClientManagementPage from './pages/ClientManagementPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        // Protected routes are nested here
        element: <ProtectedRoute />,
        children: [
          {
            index: true, // Matches the root path '/'
            element: <HomePage />,
          },
          {
            path: 'admin', // Matches '/admin'
            element: <AdminPage />,
          },
		  {
			  path: 'admin/users',
			  element: <UserManagementPage />,
			},
          {
            path: 'admin/clients', // Matches '/admin/clients'
            element: <ClientManagementPage />,
          },
        ],
      },
      {
        // Public route
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);