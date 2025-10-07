// backend/routes/paises.js
const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// GET /api/paises?region=CENTROAMERICA
router.get('/', async (req, res) => {
  try {
    const region = (req.query.region || '').trim().toUpperCase();
    let sql = 'SELECT id, iso2, nombre, region FROM paises';
    const params = [];
    if (region) { sql += ' WHERE region=$1'; params.push(region); }
    sql += ' ORDER BY nombre ASC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener países' });
  }
});

module.exports = router;
