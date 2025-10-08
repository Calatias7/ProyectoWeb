// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

/* ======================
   POST /api/auth/login
   ====================== */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  try {
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
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/* =====================================
   GET /api/auth/profile  (requiere JWT)
   Devuelve: { id, nombre, email, role }
   ===================================== */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, role FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;
