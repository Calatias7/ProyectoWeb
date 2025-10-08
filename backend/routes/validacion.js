const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const onlyAgent = [requireAuth, requireRole('AGENTE_ADUANERO')];

/* Pendientes */
router.get('/pendientes', ...onlyAgent, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT numero_documento, estado, created_at
       FROM declaraciones
      WHERE estado='PENDIENTE'
      ORDER BY created_at ASC`
  );
  res.json(rows);
});

/* Aprobar */
router.post('/:numero/aprobar', ...onlyAgent, async (req, res) => {
  const { numero } = req.params;
  const up = await pool.query(
    `UPDATE declaraciones
        SET estado='VALIDADA', validated_at=NOW(), motivo_rechazo=NULL
      WHERE numero_documento=$1
      RETURNING numero_documento, estado, validated_at`,
    [numero]
  );
  if (!up.rowCount) return res.status(404).json({ error: 'No existe' });
  await pool.query(
    `INSERT INTO bitacora_duca (numero_documento, usuario, accion, detalle)
     VALUES ($1,$2,'APROBAR','Aprobada por agente')`,
    [numero, req.user.email]
  );
  res.json({ ok: true, ...up.rows[0] });
});

/* Rechazar (motivo obligatorio) */
router.post('/:numero/rechazar', ...onlyAgent, async (req, res) => {
  const { numero } = req.params;
  const motivo = (req.body?.motivo || '').trim();
  if (!motivo) return res.status(400).json({ error: 'El motivo es obligatorio' });
  const up = await pool.query(
    `UPDATE declaraciones
        SET estado='RECHAZADA', validated_at=NOW(), motivo_rechazo=$2
      WHERE numero_documento=$1
      RETURNING numero_documento, estado, validated_at, motivo_rechazo`,
    [numero, motivo]
  );
  if (!up.rowCount) return res.status(404).json({ error: 'No existe' });
  await pool.query(
    `INSERT INTO bitacora_duca (numero_documento, usuario, accion, detalle)
     VALUES ($1,$2,'RECHAZAR',$3)`,
    [numero, req.user.email, motivo]
  );
  res.json({ ok: true, ...up.rows[0] });
});

module.exports = router;
