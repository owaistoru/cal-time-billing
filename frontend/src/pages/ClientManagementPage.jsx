import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function ClientManagementPage() {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({ id: null, client_name: '', billing_info: '' });
  const [isEditing, setIsEditing] = useState(false);
  const { token } = useContext(AuthContext);
  const config = { headers: { 'x-auth-token': token } };

  const fetchClients = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/clients', config);
      setClients(res.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  useEffect(() => {
    if (token) fetchClients();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update existing client
        await axios.put(`http://localhost:5000/api/clients/${formData.id}`, formData, config);
      } else {
        // Create new client
        await axios.post('http://localhost:5000/api/clients', formData, config);
      }
      resetForm();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client) => {
    setIsEditing(true);
    setFormData({ id: client.id, client_name: client.client_name, billing_info: client.billing_info });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`http://localhost:5000/api/clients/${id}`, config);
        fetchClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert(error.response.data.msg || 'Could not delete client.');
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({ id: null, client_name: '', billing_info: '' });
  };

  return (
    <div>
      <h2>Manage Clients</h2>
      
      <h3>{isEditing ? 'Edit Client' : 'Add New Client'}</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="client_name" placeholder="Client Name" value={formData.client_name} onChange={handleChange} required />
        <textarea name="billing_info" placeholder="Billing Info" value={formData.billing_info} onChange={handleChange}></textarea>
        <button type="submit">{isEditing ? 'Update Client' : 'Add Client'}</button>
        {isEditing && <button type="button" onClick={resetForm}>Cancel Edit</button>}
      </form>

      <hr />

      <h3>Existing Clients</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Billing Info</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.client_name}</td>
              <td>{client.billing_info}</td>
              <td>
                <button onClick={() => handleEdit(client)}>Edit</button>
                <button onClick={() => handleDelete(client.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientManagementPage;