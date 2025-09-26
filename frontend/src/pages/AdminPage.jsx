import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Add this import
function AdminPage() {
  const [sessions, setSessions] = useState([]);
  const { token } = useContext(AuthContext);

  const fetchSubmittedSessions = async () => {
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.get('http://localhost:5000/api/admin/sessions/submitted', config);
      setSessions(res.data);
    } catch (error) {
      console.error('Error fetching submitted sessions:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSubmittedSessions();
    }
  }, [token]);

  const handleUpdateStatus = async (id, status) => {
    const config = { headers: { 'x-auth-token': token } };
    try {
      await axios.put(`http://localhost:5000/api/admin/sessions/${id}/status`, { status }, config);
      fetchSubmittedSessions(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div>
      <h2>Admin Dashboard: Sessions for Approval</h2>
	  <nav>
	  <Link to="/admin/clients">Manage Clients</Link> | {' '}
	  <Link to="/admin/users">Manage Users</Link> {/* We'll build this next */}
	</nav>
	<hr />
	<h3>Sessions for Approval</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Tutor</th>
            <th>Client</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{new Date(session.session_date).toLocaleDateString()}</td>
              <td>{session.tutor_name}</td>
              <td>{session.client_name}</td>
              <td>{session.start_time} - {session.end_time}</td>
              <td>
                <button onClick={() => handleUpdateStatus(session.id, 'approved')}>Approve</button>
                <button onClick={() => handleUpdateStatus(session.id, 'rejected')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPage;