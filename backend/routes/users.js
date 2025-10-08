// backend/routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const pool = require('../db'); // Importación correcta
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const requireAnyRole = require('../middleware/requireAnyRole');
const { logBitacora } = require('../utils/bitacora'); // bitácora usuarios

/**
 * GET /api/users
 * Lista usuarios (solo ADMINISTRADOR). Soporta ?q= para buscar por nombre o email.
 */
router.get(
  '/',
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
      await logBitacora(req, { operacion: 'USUARIO_LISTA', resultado: 'OK' });
      res.json(rows);
    } catch (e) {
      await logBitacora(req, { operacion: 'USUARIO_LISTA', resultado: 'ERROR' });
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
router.post(
  '/',
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

      await logBitacora(req, { operacion: 'USUARIO_ALTA', resultado: 'OK' });
      res.json({ ok: true });
    } catch (e) {
      await logBitacora(req, { operacion: 'USUARIO_ALTA', resultado: 'ERROR' });
      console.error('❌ /api/users POST:', e);
      if (e.code === '23505') return res.status(400).json({ error: 'El email ya existe.' });
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  }
);

/**
 * PUT /api/users/:id
 * Edita nombre, email, role, activo y (OPCIONAL) cambia la contraseña.
 * body: { nombre, email, role, activo, password? }
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('ADMINISTRADOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre = '', email = '', role, activo = true, password = '' } = req.body;

      if (!email || !role) return res.status(400).json({ error: 'Email y rol son obligatorios.' });

      // Construcción dinámica por si NO se quiere cambiar contraseña
      let sql = `
        UPDATE users
           SET nombre = $1,
               email  = $2,
               role   = $3,
               activo = $4
      `;
      const params = [nombre, email.toLowerCase(), role, !!activo];

      if (password && password.trim()) {
        const hash = await bcrypt.hash(password.trim(), 10);
        sql += `, password_hash = $5`;
        params.push(hash);
      }
      sql += ` WHERE id = $${params.length + 1} RETURNING id, nombre, email, role, activo, to_char(created_at,'DD/MM/YYYY') AS creado`;
      params.push(id);

      const { rowCount, rows } = await pool.query(sql, params);
      if (!rowCount) {
        await logBitacora(req, { operacion: 'USUARIO_EDITAR', resultado: 'ERROR' });
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await logBitacora(req, { operacion: 'USUARIO_EDITAR', resultado: 'OK' });
      res.json(rows[0]);
    } catch (e) {
      await logBitacora(req, { operacion: 'USUARIO_EDITAR', resultado: 'ERROR' });
      console.error('❌ /api/users PUT :id', e);
      if (e.code === '23505') return res.status(400).json({ error: 'El email ya existe.' });
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
);

/**
 * PUT /api/users/:id/activo
 * Activa/Desactiva (solo ADMINISTRADOR)
 */
router.put(
  '/:id/activo',
  requireAuth,
  requireRole('ADMINISTRADOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const { rowCount, rows } = await pool.query(
        `UPDATE users
            SET activo = $1
          WHERE id = $2
          RETURNING id, nombre, email, role, activo, to_char(created_at,'DD/MM/YYYY') AS creado`,
        [!!activo, id]
      );

      if (!rowCount) {
        await logBitacora(req, { operacion: 'USUARIO_ACTIVO', resultado: 'ERROR' });
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await logBitacora(req, { operacion: 'USUARIO_ACTIVO', resultado: 'OK' });
      res.json(rows[0]);
    } catch (e) {
      await logBitacora(req, { operacion: 'USUARIO_ACTIVO', resultado: 'ERROR' });
      console.error('❌ /api/users PUT activo:', e);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Elimina (solo ADMINISTRADOR)
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMINISTRADOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rowCount } = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

      if (!rowCount) {
        await logBitacora(req, { operacion: 'USUARIO_BAJA', resultado: 'ERROR' });
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      await logBitacora(req, { operacion: 'USUARIO_BAJA', resultado: 'OK' });
      res.json({ ok: true });
    } catch (e) {
      await logBitacora(req, { operacion: 'USUARIO_BAJA', resultado: 'ERROR' });
      console.error('❌ /api/users DELETE:', e);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
);

/**
 * GET /api/users/importadores
 * Devuelve lista { id, nombre } para el selector de importadores.
 */
router.get(
  '/importadores',
  requireAuth,
  requireAnyRole('TRANSPORTISTA', 'ADMINISTRADOR', 'AGENTE_ADUANERO'),
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, nombre
           FROM users
          WHERE role = 'IMPORTADOR' AND activo = true
          ORDER BY nombre ASC`
      );

      await logBitacora(req, { operacion: 'IMPORTADORES_LISTA', resultado: 'OK' });
      res.json(rows);
    } catch (e) {
      await logBitacora(req, { operacion: 'IMPORTADORES_LISTA', resultado: 'ERROR' });
      console.error('❌ /api/users/importadores:', e);
      res.status(500).json({ error: 'Error al listar importadores' });
    }
  }
);

module.exports = router;
