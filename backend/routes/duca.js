const express = require('express');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

/* Enviar DUCA (solo TRANSPORTISTA) */
router.post('/enviar', requireAuth, requireRole('TRANSPORTISTA'), async (req, res) => {
  const { duca } = req.body || {};
  if (!duca) return res.status(400).json({ error: 'Falta duca' });

  const numero = duca.numeroDocumento;
  const userId = req.user.id;

  await pool.query(
    `INSERT INTO declaraciones (numero_documento, estado, duca_json, user_id, created_at)
     VALUES ($1, 'PENDIENTE', $2, $3, NOW())`,
    [numero, duca, userId]
  );

  await pool.query(
    `INSERT INTO bitacora_duca (numero_documento, usuario, accion, detalle)
     VALUES ($1, $2, 'ENVIAR', 'Creada por transportista')`,
    [numero, req.user.email]
  );

  res.json({ ok: true, numero });
});

module.exports = router;
