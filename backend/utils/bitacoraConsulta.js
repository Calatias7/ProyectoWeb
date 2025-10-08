// backend/utils/bitacoraConsulta.js
const pool = require('../db'); 
async function logConsulta({ usuario, ip, numero_declaracion }) {
  await pool.query(
    `INSERT INTO bitacora_declaraciones (usuario, ip_origen, operacion, resultado, numero_declaracion)
     VALUES ($1,$2,'Consulta Declaracion',NULL,$3)`,
    [usuario || 'desconocido', ip || null, numero_declaracion || null]
  );
}
module.exports = { logConsulta };
