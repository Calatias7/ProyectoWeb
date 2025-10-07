const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

/* Listar usuarios */
router.get('/', requireAuth, requireRole('ADMINISTRADOR'), async (req, res) => {
  const q = (req.query.q || '').trim();
  let sql = 'SELECT id,nombre,email,role,activo,created_at FROM users';
  const params = [];
  if (q) { sql += ' WHERE nombre ILIKE $1 OR email ILIKE $1'; params.push(`%${q}%`); }
  sql += ' ORDER BY id DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

/* Crear usuario */
router.post('/', requireAuth, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { nombre = '', email, role, activo = true, password } = req.body || {};
  if (!email || !role) return res.status(400).json({ error: 'Email y rol son obligatorios' });
  const exists = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
  if (exists.rowCount) return res.status(409).json({ error: 'El email ya existe' });
  const hash = await bcrypt.hash(password || 'Cambiar123', 10);
  const { rows } = await pool.query(
    `INSERT INTO users (nombre,email,password_hash,role,activo)
     VALUES ($1,$2,$3,$4,$5) RETURNING id,nombre,email,role,activo,created_at`,
    [nombre, email, hash, role, !!activo]
  );
  res.status(201).json(rows[0]);
});

/* Eliminar */
router.delete('/:id', requireAuth, requireRole('ADMINISTRADOR'), async (req, res) => {
  const del = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
  if (!del.rowCount) return res.status(404).json({ error: 'No encontrado' });
  res.json({ ok: true });
});

/* Activar/Desactivar */
router.put('/:id/activo', requireAuth, requireRole('ADMINISTRADOR'), async (req, res) => {
  const { activo } = req.body || {};
  if (typeof activo !== 'boolean') return res.status(400).json({ error: 'activo debe ser booleano' });
  const up = await pool.query(
    'UPDATE users SET activo=$1 WHERE id=$2 RETURNING id,nombre,email,role,activo,created_at',
    [activo, req.params.id]
  );
  if (!up.rowCount) return res.status(404).json({ error: 'No encontrado' });
  res.json(up.rows[0]);
});

module.exports = router;
