import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const { token } = useContext(AuthContext);
  const config = { headers: { 'x-auth-token': token } };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', config);
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);
  
  // Note: For simplicity, this example doesn't include an "Edit User" form pop-up.
  // A full implementation would have a modal or separate edit page.
  // For now, this page will just display the users.

  return (
    <div>
      <h2>Manage Users</h2>
      <p>This table displays all users in the system. Future updates could include forms to edit user details.</p>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Pay Rate ($)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.full_name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.pay_rate_cents ? (user.pay_rate_cents / 100).toFixed(2) : 'N/A'}</td>
              <td>{user.is_active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagementPage;