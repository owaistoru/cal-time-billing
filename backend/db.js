// Import the Pool class from the pg library
const { Pool } = require('pg');

// Create a new Pool instance
// The Pool will use the environment variables we set to connect to the database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// We export an object with a query method
// This allows us to easily use the pool to run queries from other files
module.exports = {
  query: (text, params) => pool.query(text, params),
};