require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. IMPORT THE CORS PACKAGE
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors()); // 2. USE THE CORS MIDDLEWARE
app.use(express.json());


// --- ROUTES ---
app.get('/', (req, res) => {
  res.send('CAL Time & Billing API is running...');
});

// Use our authentication routes
app.use('/api/auth', require('./routes/auth'));

// Use our sessions routes
app.use('/api/sessions', require('./routes/sessions'));


app.use('/api/clients', require('./routes/clients'));
// ...after app.use('/api/clients',...)
app.use('/api/admin', require('./routes/admin'));
// --- SERVER STARTUP ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});