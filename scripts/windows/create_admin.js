// backend/scripts/create_admin.js
// Idempotent: creates or updates the first admin.
// Usage (CLI):
//   node scripts/create_admin.js --email admin@example.com --password admin123 --name "Admin"
// Or via env:
//   BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... BOOTSTRAP_ADMIN_NAME="Admin" node scripts/create_admin.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Client } = require('pg');
const bcrypt = require('bcrypt');

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  const env = process.env[`BOOTSTRAP_ADMIN_${name.toUpperCase()}`];
  return env !== undefined ? env : def;
}

(async () => {
  const email = arg('email', 'admin@example.com');
  const password = arg('password', 'admin123');
  const fullName = arg('name', 'Admin');
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL missing in backend/.env');
    process.exit(1);
  }

  const client = new Client({ connectionString: String(process.env.DATABASE_URL || '') });
  await client.connect();

  // Determine whether the column is full_name or name
  const { rows } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='users' AND column_name IN ('full_name','name')
  `);
  const nameCol = rows.some(r => r.column_name === 'full_name') ? 'full_name' : 'name';

  const hash = await bcrypt.hash(String(password), rounds);

  const exists = await client.query('SELECT id FROM users WHERE email=$1', [email]);
  if (exists.rowCount === 0) {
    const sql = `INSERT INTO users (${nameCol}, email, password_hash, role, pay_rate_cents)
                 VALUES ($1,$2,$3,'admin',2850)`;
    await client.query(sql, [fullName, email, hash]);
    console.log(`Created admin: ${email}`);
  } else {
    await client.query('UPDATE users SET password_hash=$2, role=$3 WHERE email=$1',
      [email, hash, 'admin']);
    console.log(`Updated admin: ${email}`);
  }

  await client.end();
})().catch(e => {
  console.error('create_admin failed:', e.message);
  process.exit(1);
});
