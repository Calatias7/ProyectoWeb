// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { logBitacora } = require('../utils/bitacora'); // <<-- nuevo

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

    // Usuario no existe o inactivo
    if (!u || !u.activo) {
      await logBitacora(req, { operacion: 'LOGIN', resultado: 'ERROR', usuarioEmail: email || '' });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Validar contraseña
    const ok = await bcrypt.compare(password || '', u.password_hash);
    if (!ok) {
      await logBitacora(req, { operacion: 'LOGIN', resultado: 'ERROR', usuarioEmail: u.email, actorId: u.id });
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Login OK -> registrar en bitácora
    await logBitacora(req, { operacion: 'LOGIN', resultado: 'OK', usuarioEmail: u.email, actorId: u.id });

    const token = jwt.sign(
      { id: u.id, email: u.email, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ token, role: u.role, email: u.email, nombre: u.nombre });
  } catch (err) {
    // Excepción en login -> registrar
    await logBitacora(req, { operacion: 'LOGIN', resultado: 'EXCEPTION', usuarioEmail: email || '' });
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
