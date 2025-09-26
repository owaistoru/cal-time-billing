import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function LoginPage() {
  // State to hold what the user types in the form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State to hold any error message from the backend
  const [error, setError] = useState('');
  
  // Get the login function from our global AuthContext
  const { login } = useContext(AuthContext);
  
  // Get the navigate function from the router to redirect the user
  const navigate = useNavigate();

  // This function runs when the user clicks the "Login" button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the browser from refreshing
    setError(''); // Clear any previous errors

    try {
      // Call the login function from our context
      await login(email, password);
      
      // If login is successful, redirect to the home page
      navigate('/'); 

    } catch (err) {
      // If login fails, display an error message
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <h2>Login Page</h2>
      {/* The form calls handleSubmit when submitted */}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* This line will only display the error message if it exists */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;