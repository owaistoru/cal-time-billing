import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api'; // IMPORT OUR NEW API CONFIG

function HomePage() {
  const [sessions, setSessions] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    notes: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const { token } = useContext(AuthContext);

  const fetchData = async () => {
    try {
      // USE THE NEW API INSTANCE - no config object needed!
      const sessionsRes = await api.get('/sessions/my-sessions');
      const clientsRes = await api.get('/clients');
      setSessions(sessionsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

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
      // USE THE NEW API INSTANCE - no config object needed!
      await api.post('/sessions', formData);
      
      setSuccessMessage('Session logged successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      setFormData({
        client_id: '',
        session_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        notes: '',
      });

      fetchData();
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
      
      {successMessage && <p style={{ color: 'green', marginTop: '1rem' }}>{successMessage}</p>}

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