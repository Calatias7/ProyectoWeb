// backend/utils/bitacoraDeclaraciones.js
const { pool } = require('../db');
async function logBitacoraDeclaracion({ usuario, ip, resultado, numero_declaracion }) {
  await pool.query(
    `INSERT INTO bitacora_declaraciones (usuario, ip_origen, operacion, resultado, numero_declaracion)
     VALUES ($1,$2,'Registro declaración',$3,$4)`,
    [usuario || 'desconocido', ip || null, resultado, numero_declaracion || null]
  );
}
module.exports = { logBitacoraDeclaracion };
