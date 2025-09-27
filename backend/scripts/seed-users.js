require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { hasColumn, mapRoleLabel } = require('../lib/schema');

(async () => {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_DATABASE
  });

  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const ADMIN_PASS  = process.env.SEED_ADMIN_PASS  || 'Admin123!';
  const USER_EMAIL  = process.env.SEED_USER_EMAIL  || 'test@example.com';
  const USER_PASS   = process.env.SEED_USER_PASS   || 'Password123';

  const hasFullName = await hasColumn('users', 'full_name');

  async function upsertUser(email, password, desiredRole, fullName) {
    const role = await mapRoleLabel(desiredRole);
    const hash = await bcrypt.hash(password, 12);

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) {
      const set = ['password_hash = $1', 'role = $2'];
      const vals = [hash, role];
      let i = vals.length + 1;
      if (hasFullName) { set.push(`full_name = $${i++}`); vals.push(fullName || email.split('@')[0]); }
      vals.push(email);
      const q = await pool.query(`UPDATE users SET ${set.join(', ')} WHERE email = $${i} RETURNING id, email, role`, vals);
      console.log('Updated user:', q.rows[0]);
    } else {
      let q;
      if (hasFullName) {
        q = await pool.query(
          'INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
          [email, hash, role, fullName || email.split('@')[0]]
        );
      } else {
        q = await pool.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
          [email, hash, role]
        );
      }
      console.log('Inserted user:', q.rows[0]);
    }
  }

  try {
    await upsertUser(ADMIN_EMAIL, ADMIN_PASS, 'admin', 'Admin');
    await upsertUser(USER_EMAIL,  USER_PASS,  'user',  'Test User');
    console.log('Seeding complete.');
  } catch (e) {
    console.error('Seed error:', e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
