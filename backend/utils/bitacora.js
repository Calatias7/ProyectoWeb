// backend/utils/bitacora.js
const pool = require('../db');

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  return (xf && xf.split(',')[0].trim()) || req.socket.remoteAddress || '';
}

/**
 * Registra un evento en bitacora_usuarios
 * @param {Request} req  - Express request (para IP y req.user)
 * @param {object} opts  - { operacion, resultado, usuarioEmail?, actorId? }
 */
async function logBitacora(req, { operacion, resultado, usuarioEmail, actorId }) {
  const ip = getClientIp(req);
  const uid = actorId ?? (req.user ? req.user.id : null);
  const email = usuarioEmail ?? (req.user ? req.user.email : '');

  try {
    await pool.query(
      `INSERT INTO public.bitacora_usuarios (usuario, actor_id, ip_origen, operacion, resultado)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, uid, ip, operacion, resultado]
    );
  } catch (err) {
    console.error('logBitacora error:', err.message);
    // No romper el flujo si falla el log
  }
}

module.exports = { logBitacora, getClientIp };
