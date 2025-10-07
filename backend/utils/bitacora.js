// backend/utils/bitacora.js
const { pool } = require('../db');
async function logBitacora({ usuario, ip, operacion, resultado, numero_declaracion = null }) {
  await pool.query(
    `INSERT INTO bitacora_usuarios (usuario, ip_origen, operacion, resultado, numero_declaracion)
     VALUES ($1,$2,$3,$4,$5)`,
    [usuario || 'desconocido', ip || null, operacion, resultado, numero_declaracion]
  );
}
module.exports = { logBitacora };
