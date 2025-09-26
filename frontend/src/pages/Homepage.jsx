import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function HomePage() {
  // State for the list of sessions and clients
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  
  // State for the form inputs
  const [formData, setFormData] = useState({
    client_id: '',
    session_date: new Date().toISOString().split('T')[0], // Defaults to today
    start_time: '',
    end_time: '',
    notes: '',
  });
  
  const { token } = useContext(AuthContext);

  // Function to fetch data from the backend
  const fetchData = async () => {
    const config = { headers: { 'x-auth-token': token } };
    try {
      const sessionsRes = await axios.get('http://localhost:5000/api/sessions/my-sessions', config);
      const clientsRes = await axios.get('http://localhost:5000/api/clients', config);
      setSessions(sessionsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Fetch data when the component first loads
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { 'x-auth-token': token } };
      await axios.post('http://localhost:5000/api/sessions', formData, config);
      fetchData(); // Refresh the list of sessions after adding a new one
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  return (
    <div>
      <h2>Tutor Dashboard</h2>
      
      <hr />

      <h3>Log a New Session</h3>
      <form onSubmit={handleSubmit}>
        <select name="client_id" value={formData.client_id} onChange={handleChange} required>
          <option value="">-- Select a Client --</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.client_name}</option>
          ))}
        </select>
        <input type="date" name="session_date" value={formData.session_date} onChange={handleChange} required />
        <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} required />
        <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} required />
        <textarea name="notes" placeholder="Session Notes" value={formData.notes} onChange={handleChange}></textarea>
        <button type="submit">Log Session</button>
      </form>

      <hr />

      <h3>My Past Sessions</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{new Date(session.session_date).toLocaleDateString()}</td>
              <td>{clients.find(c => c.id === session.client_id)?.client_name || 'N/A'}</td>
              <td>{session.start_time}</td>
              <td>{session.end_time}</td>
              <td>{session.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HomePage;