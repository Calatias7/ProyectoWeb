// backend/routes/duca.js
const express = require('express');
const router = express.Router();

const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const requireAnyRole = require('../middleware/requireAnyRole');
const { logBitacora } = require('../utils/bitacora'); // <-- NUEVO


// ======================================================
// Enviar DUCA (TRANSPORTISTA)
// ======================================================
router.post('/enviar', requireAuth, requireRole('TRANSPORTISTA'), async (req, res) => {
  try {
    const { duca } = req.body;
    if (!duca) return res.status(400).json({ error: 'Datos faltantes.' });

    const numero = duca.numeroDocumento;
    if (!numero) return res.status(400).json({ error: 'Falta numeroDocumento.' });

    // Guardamos el objeto JSON directamente (pg lo serializa) con cast a jsonb
    await pool.query(
      `INSERT INTO declaraciones (numero_documento, estado, duca_json, user_id)
       VALUES ($1, 'PENDIENTE', $2::jsonb, $3)`,
      [numero, duca, req.user.id]
    );

    // Bitácora usuarios (quién ejecuta la acción)
    await logBitacora(req, { operacion: 'DUCA_ENVIAR', resultado: 'OK' });

    // Bitácora específica de DUCA (histórico de documento)
    try {
      await pool.query(
        `INSERT INTO bitacora_duca (numero_documento, usuario, accion, detalle)
         VALUES ($1, $2, 'ENVIAR', 'DUCA creada por transportista')`,
        [numero, req.user.email || req.user.nombre || `user:${req.user.id}`]
      );
    } catch (_) {}

    res.json({ ok: true, numero });
  } catch (err) {
    await logBitacora(req, { operacion: 'DUCA_ENVIAR', resultado: 'ERROR' });
    console.error('❌ /api/duca/enviar error:', err);
    res.status(500).json({ error: 'Error al guardar declaración.' });
  }
});

// ======================================================
// Consulta de declaraciones (lista)
// - Transportista: solo sus DUCA (user_id)
// - Admin/Agente: todas
// - ?estado=Todos|PENDIENTE|VALIDADA|RECHAZADA
// Devuelve fechas formateadas: creada, revisada
// ======================================================
router.get(
  '/consulta',
  requireAuth,
  requireAnyRole('TRANSPORTISTA', 'ADMINISTRADOR', 'AGENTE_ADUANERO'),
  async (req, res) => {
    try {
      const { estado } = req.query;
      const userId = req.user.id;
      const role = req.user.role;

      let sql = `
        SELECT numero_documento,
               estado,
               TO_CHAR(created_at, 'DD/MM/YYYY, HH24:MI:SS') AS creada,
               CASE WHEN validated_at IS NULL
                    THEN '-'
                    ELSE TO_CHAR(validated_at, 'DD/MM/YYYY, HH24:MI:SS')
               END AS revisada,
               motivo_rechazo,
               user_id
          FROM declaraciones
         WHERE 1=1
      `;
      const params = [];

      if (estado && estado !== 'Todos') {
        params.push(estado);
        sql += ` AND estado = $${params.length}`;
      }

      if (role === 'TRANSPORTISTA') {
        params.push(userId);
        sql += ` AND user_id = $${params.length}`;
      }

      sql += ` ORDER BY created_at DESC`;

      const { rows } = await pool.query(sql, params);

      await logBitacora(req, { operacion: 'DUCA_CONSULTA', resultado: 'OK' });

      res.json(rows);
    } catch (err) {
      await logBitacora(req, { operacion: 'DUCA_CONSULTA', resultado: 'ERROR' });
      console.error('❌ /api/duca/consulta error:', err);
      res.status(500).json({ error: 'Error al obtener lista.' });
    }
  }
);

// ======================================================
// Detalle por número
// Devuelve creada/revisada formateadas y motivo_rechazo
// ======================================================
router.get(
  '/detalle/:numero',
  requireAuth,
  requireAnyRole('TRANSPORTISTA', 'ADMINISTRADOR', 'AGENTE_ADUANERO'),
  async (req, res) => {
    try {
      const { numero } = req.params;

      const { rows } = await pool.query(
        `SELECT numero_documento,
                estado,
                duca_json AS duca,
                motivo_rechazo,
                TO_CHAR(created_at, 'DD/MM/YYYY, HH24:MI:SS') AS creada,
                CASE WHEN validated_at IS NULL
                     THEN '-'
                     ELSE TO_CHAR(validated_at, 'DD/MM/YYYY, HH24:MI:SS')
                END AS revisada,
                user_id
           FROM declaraciones
          WHERE numero_documento = $1`,
        [numero]
      );

      if (rows.length === 0) return res.status(404).json({ error: 'No encontrada.' });

      const det = rows[0];
      if (req.user.role === 'TRANSPORTISTA' && det.user_id !== req.user.id) {
        await logBitacora(req, { operacion: 'DUCA_DETALLE', resultado: 'ERROR' });
        return res.status(403).json({ error: 'Sin permisos para ver esta DUCA.' });
      }

      await logBitacora(req, { operacion: 'DUCA_DETALLE', resultado: 'OK' });

      res.json(det);
    } catch (err) {
      await logBitacora(req, { operacion: 'DUCA_DETALLE', resultado: 'ERROR' });
      console.error('❌ /api/duca/detalle error:', err);
      res.status(500).json({ error: 'Error al obtener detalle.' });
    }
  }
);

// ======================================================
// Pendientes para Agente
// ======================================================
router.get('/pendientes', requireAuth, requireRole('AGENTE_ADUANERO'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT numero_documento,
              estado,
              TO_CHAR(created_at,'DD/MM/YYYY, HH24:MI:SS') AS creada
         FROM declaraciones
        WHERE estado = 'PENDIENTE'
        ORDER BY created_at DESC`
    );

    await logBitacora(req, { operacion: 'DUCA_PENDIENTES', resultado: 'OK' });

    res.json(rows);
  } catch (err) {
    await logBitacora(req, { operacion: 'DUCA_PENDIENTES', resultado: 'ERROR' });
    console.error('❌ /api/duca/pendientes error:', err);
    res.status(500).json({ error: 'Error al obtener pendientes.' });
  }
});

// ======================================================
// Aprobar (AGENTE_ADUANERO)
// ======================================================
router.post('/aprobar/:numero', requireAuth, requireRole('AGENTE_ADUANERO'), async (req, res) => {
  try {
    const { numero } = req.params;

    await pool.query(
      `UPDATE declaraciones
          SET estado='VALIDADA',
              validated_at = NOW(),
              motivo_rechazo = NULL
        WHERE numero_documento = $1`,
      [numero]
    );

    await logBitacora(req, { operacion: 'DUCA_APROBAR', resultado: 'OK' });

    try {
      await pool.query(
        `INSERT INTO bitacora_duca (numero_documento, usuario, accion, detalle)
         VALUES ($1, $2, 'APROBAR', 'Aprobada por agente aduanero')`,
        [numero, req.user.email || req.user.nombre || `user:${req.user.id}`]
      );
    } catch (_) {}

    res.json({ ok: true });
  } catch (err) {
    await logBitacora(req, { operacion: 'DUCA_APROBAR', resultado: 'ERROR' });
    console.error('❌ /api/duca/aprobar error:', err);
    res.status(500).json({ error: 'Error al aprobar.' });
  }
});

// ======================================================
// Rechazar (AGENTE_ADUANERO) - requiere motivo
// ======================================================
router.post('/rechazar/:numero', requireAuth, requireRole('AGENTE_ADUANERO'), async (req, res) => {
  try {
    const { numero } = req.params;
    const { motivo } = req.body;
    if (!motivo || !motivo.trim()) return res.status(400).json({ error: 'Motivo requerido.' });

    await pool.query(
      `UPDATE declaraciones
          SET estado='RECHAZADA',
              validated_at = NOW(),
              motivo_rechazo = $2
        WHERE numero_documento = $1`,
      [numero, motivo.trim()]
    );

    await logBitacora(req, { operacion: 'DUCA_RECHAZAR', resultado: 'OK' });

    try {
      await pool.query(
        `INSERT INTO bitacora_duca (numero_documento, usuario, accion, detalle)
         VALUES ($1, $2, 'RECHAZAR', $3)`,
        [numero, req.user.email || req.user.nombre || `user:${req.user.id}`, motivo.trim()]
      );
    } catch (_) {}

    res.json({ ok: true });
  } catch (err) {
    await logBitacora(req, { operacion: 'DUCA_RECHAZAR', resultado: 'ERROR' });
    console.error('❌ /api/duca/rechazar error:', err);
    res.status(500).json({ error: 'Error al rechazar.' });
  }
});

module.exports = router;
