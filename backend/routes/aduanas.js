// backend/routes/aduanas.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Catálogo público de aduanas (sin auth)
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, codigo, nombre, COALESCE(pais, \'Guatemala\') AS pais FROM aduanas ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener aduanas' });
  }
});

module.exports = router;
