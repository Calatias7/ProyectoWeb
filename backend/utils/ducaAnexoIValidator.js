// backend/utils/ducaAnexoIValidator.js
function isString(v, max) { return typeof v === 'string' && (!max || v.length <= max); }
function isDate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v); }
function isDecimal(n) { return typeof n === 'number' && isFinite(n); }
function required(ok, msg, errs){ if(!ok) errs.push(msg); }
function validateForApproval(duca) {
  const e = [];
  if (!duca || typeof duca !== 'object') return { ok:false, errors:['DUCA inexistente'] };
  required(isString(duca.numeroDocumento, 20), 'numeroDocumento inválido', e);
  required(isDate(duca.fechaEmision), 'fechaEmision inválida (YYYY-MM-DD)', e);
  required(isString(duca.paisEmisor, 2), 'paisEmisor inválido', e);
  required(isString(duca.tipoOperacion, 20), 'tipoOperacion inválido', e);
  required(isString(duca.exportador?.nombreExportador, 100), 'nombreExportador inválido', e);
  required(isString(duca.importador?.nombreImportador, 100), 'nombreImportador inválido', e);
  required(isString(duca.transporte?.medioTransporte, 20), 'medioTransporte inválido', e);
  required(isDecimal(duca.valores?.valorAduanaTotal), 'valorAduanaTotal inválido', e);
  required(isString(duca.valores?.moneda, 3), 'moneda inválida', e);
  required(isString(duca.estadoDocumento, 20), 'estadoDocumento inválido', e);
  return { ok: e.length === 0, errors: e };
}
module.exports = { validateForApproval };
