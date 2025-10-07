require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

(async ()=>{
  try {
    const email = 'admin@siglad.test';
    const pass = 'Admin123';
    const hash = await bcrypt.hash(pass, 10);

    await pool.query(`
      INSERT INTO users (nombre,email,password_hash,role,activo)
      VALUES ('Administrador',$1,$2,'ADMINISTRADOR',true)
      ON CONFLICT (email) DO NOTHING
    `,[email, hash]);

    console.log('Admin creado/listo:', email, pass);
  } catch (err) {
    console.error('Seed falló:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
