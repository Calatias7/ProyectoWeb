// backend/db.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || '';

/**
 * En Render (o cualquier host remoto) necesitamos SSL.
 * En local (localhost) no.
 */
const ssl =
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString,
  ssl
});

module.exports = { pool };
