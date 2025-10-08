// backend/utils/bitacoraValidacion.js
const pool = require('../db'); 
async function logValidacion({ usuario, ip, resultado, numero_declaracion }) {
  await pool.query(
    `INSERT INTO bitacora_declaraciones (usuario, ip_origen, operacion, resultado, numero_declaracion)
     VALUES ($1,$2,'Validación',$3,$4)`,
    [usuario || 'desconocido', ip || null, resultado, numero_declaracion || null]
  );
}
module.exports = { logValidacion };
