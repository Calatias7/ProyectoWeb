// backend/db.js
const { Pool } = require('pg');

/*
 Soporta Render (DATABASE_URL con SSL) y local (.env con PGHOST, PGUSER, etc.)
 Prioriza DATABASE_URL; si no existe, usa variables sueltas.
*/

let pool;

if (process.env.DATABASE_URL) {
  // Render, Railway, etc.
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // necesario en muchos proveedores gestionados
    },
  });
} else {
  // Local
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'siglad',
    // ssl: false
  });
}

// (opcional) log básico para saber que se conectó
pool
  .connect()
  .then((c) => {
    c.release();
    console.log('✅ Conectado a PostgreSQL');
  })
  .catch((e) => {
    console.error('❌ Error conectando a PostgreSQL:', e.message);
  });

module.exports = pool; // <<--- exporta el Pool real
