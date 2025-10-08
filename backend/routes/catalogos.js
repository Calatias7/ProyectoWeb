// backend/routes/catalogos.js
const express = require('express');
const router = express.Router();

const pool = require('../db');                // <<--- IMPORTACIÓN CORRECTA
const requireAuth = require('../middleware/requireAuth');
const requireAnyRole = require('../middleware/requireAnyRole');

/**
 * GET /api/catalogos/aduanas
 * Devuelve { id, codigo, nombre } para los selects.
 * Roles permitidos: TRANSPORTISTA, ADMINISTRADOR, AGENTE_ADUANERO, IMPORTADOR
 */
router.get(
  '/aduanas',
  requireAuth,
  requireAnyRole('TRANSPORTISTA', 'ADMINISTRADOR', 'AGENTE_ADUANERO', 'IMPORTADOR'),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, codigo, nombre
           FROM aduanas
          ORDER BY nombre ASC`
      );
      res.json(rows || []);
    } catch (e) {
      console.error('❌ /api/catalogos/aduanas error:', e);
      res.status(500).json({ error: 'Error al obtener aduanas' });
    }
  }
);

module.exports = router;                      // <<--- EXPORTA EL ROUTER
