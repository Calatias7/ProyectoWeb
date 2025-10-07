const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const router = express.Router();

/* Login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const { rows } = await pool.query(
    'SELECT id, email, nombre, role, password_hash, activo FROM users WHERE email=$1',
    [email]
  );
  const u = rows[0];
  if (!u || !u.activo) return res.status(401).json({ error: 'Credenciales inválidas' });
  const ok = await bcrypt.compare(password || '', u.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, role: u.role, email: u.email, nombre: u.nombre });
});

module.exports = router;
