import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { token } = useContext(AuthContext);

  // If there's a token, render the child components (the protected page)
  // Otherwise, redirect to the /login page
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;