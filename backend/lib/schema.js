// backend/lib/schema.js
'use strict';

const db = require('../db');

/**
 * Check if a column exists on a given table in the public schema.
 * @param {string} table
 * @param {string} column
 * @returns {Promise<boolean>}
 */
async function hasColumn(table, column) {
  const q = await db.query(
    `
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = $1
       AND column_name  = $2
    `,
    [table, column]
  );
  return q.rowCount > 0;
}

/**
 * Whether the clients table has a user_id ownership column.
 * @returns {Promise<boolean>}
 */
async function clientsHasUserId() {
  return hasColumn('clients', 'user_id');
}

/**
 * Best-effort column to display a client's name in SELECTs.
 * NOTE: This function returns a *single column name* suitable for "c.<name>" usage.
 * We intentionally DO NOT synthesize "first_name || ' ' || last_name" here, because
 * many callers construct "c.${col}" and that syntax would not qualify both operands.
 *
 * Order of preference: name, client_name, full_name. If none exist, return null.
 *
 * @returns {Promise<string|null>} e.g., "name" or "client_name" or "full_name"
 */
async function getClientsNameColumn() {
  const candidates = ['name', 'client_name', 'full_name'];
  for (const col of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await hasColumn('clients', col)) return col;
  }
  return null;
}

module.exports = {
  hasColumn,
  clientsHasUserId,
  getClientsNameColumn
};
