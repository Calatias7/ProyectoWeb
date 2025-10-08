// backend/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const pool = require('../db'); // <<--- IMPORTACIÓN CORRECTA
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const requireAnyRole = require('../middleware/requireAnyRole');

/**
 * GET /api/users
 * Lista usuarios (solo ADMINISTRADOR). Soporta ?q= para buscar por nombre o email.
 */
router.get('/',
  requireAuth,
  requireRole('ADMINISTRADOR'),
  async (req, res) => {
    try {
      const q = (req.query.q || '').trim();
      let sql = `
        SELECT id, nombre, email, role, activo, to_char(created_at,'DD/MM/YYYY') AS creado
        FROM users
        WHERE 1=1
      `;
      const params = [];
      if (q) {
        params.push(`%${q.toLowerCase()}%`);
        params.push(`%${q.toLowerCase()}%`);
        sql += ` AND (LOWER(nombre) LIKE $${params.length - 1} OR LOWER(email) LIKE $${params.length})`;
      }
      sql += ` ORDER BY id DESC`;

      const { rows } = await pool.query(sql, params);
      res.json(rows);
    } catch (e) {
      console.error('❌ /api/users GET:', e);
      res.status(500).json({ error: 'Error al listar usuarios' });
    }
  }
);

/**
 * POST /api/users
 * Crea usuario (solo ADMINISTRADOR). password es opcional (si viene, se hashea).
 * body: { nombre, email, role, activo, password }
 */
router.post('/',
  requireAuth,
  requireRole('ADMINISTRADOR'),
  async (req, res) => {
    try {
      const { nombre = '', email = '', role, activo = true, password = '' } = req.body;
      if (!email || !role) return res.status(400).json({ error: 'Email y rol son obligatorios.' });

      let password_hash = 'x';
      if (password && password.trim()) {
        password_hash = await bcrypt.hash(password.trim(), 10);
      }

      await pool.query(
        `INSERT INTO users (nombre, email, password_hash, role, activo)
         VALUES ($1, $2, $3, $4, $5)`,
        [nombre, email.toLowerCase(), password_hash, role, !!activo]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error('❌ /api/users POST:', e);
      if (e.code === '23505') return res.status(400).json({ error: 'El email ya existe.' });
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  }
);

/**
 * PUT /api/users/:id/activo
 * Activa/Desactiva (solo ADMINISTRADOR)
 */
router.put('/:id/activo',
  requireAuth,
  requireRole('ADMINISTRADOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      await pool.query(`UPDATE users SET activo = $1 WHERE id = $2`, [!!activo, id]);
      res.json({ ok: true });
    } catch (e) {
      console.error('❌ /api/users PUT activo:', e);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Elimina (solo ADMINISTRADOR)
 */
router.delete('/:id',
  requireAuth,
  requireRole('ADMINISTRADOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
      res.json({ ok: true });
    } catch (e) {
      console.error('❌ /api/users DELETE:', e);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
);

/**
 * GET /api/users/importadores
 * Devuelve lista { id, nombre } para el selector de importadores
 * (Transportista, Admin y Agente pueden ver).
 */
router.get('/importadores',
  requireAuth,
  requireAnyRole('TRANSPORTISTA', 'ADMINISTRADOR', 'AGENTE_ADUANERO'),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, nombre
         FROM users
         WHERE role = 'IMPORTADOR' AND activo = true
         ORDER BY nombre ASC`
      );
      res.json(rows);
    } catch (e) {
      console.error('❌ /api/users/importadores:', e);
      res.status(500).json({ error: 'Error al listar importadores' });
    }
  }
);

module.exports = router;
