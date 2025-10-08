const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireAnyRole = require('../middleware/requireAnyRole');

const router = express.Router();

/* Mis declaraciones (TRANSPORTISTA) */
router.get('/mis',
  requireAuth, requireAnyRole('TRANSPORTISTA'),
  async (req, res) => {
    const estado = req.query.estado || null;
    const { id: userId } = req.user;
    const { rows } = await pool.query(
      `SELECT numero_documento, estado, created_at, validated_at
         FROM declaraciones
        WHERE user_id = $1
          AND ($2::text IS NULL OR estado = $2)
        ORDER BY created_at DESC`,
      [userId, estado]
    );
    res.json(rows);
  }
);

/* Detalle (Transportista dueño, Agente o Admin) */
router.get('/:numero',
  requireAuth, requireAnyRole('TRANSPORTISTA','AGENTE_ADUANERO','ADMINISTRADOR'),
  async (req, res) => {
    const { numero } = req.params;
    const { id: userId, role } = req.user;

    const { rows } = await pool.query(
      `SELECT numero_documento, estado, created_at, validated_at, motivo_rechazo, duca_json, user_id
         FROM declaraciones
        WHERE numero_documento = $1`,
      [numero]
    );
    if (!rows.length) return res.status(404).json({ error: 'No existe' });

    const dec = rows[0];
    if (role === 'TRANSPORTISTA' && dec.user_id !== userId) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    delete dec.user_id;
    res.json(dec);
  }
);

module.exports = router;
