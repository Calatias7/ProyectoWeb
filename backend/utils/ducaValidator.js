// backend/utils/ducaValidator.js
function isString(v, max){ return typeof v === 'string' && (!max || v.length <= max); }
function isInt(v, d){ return Number.isInteger(v) && (d ? String(Math.abs(v)).length <= d : true); }
function isDecimal(v){ return typeof v === 'number' && isFinite(v); }
function isDateYYYYMMDD(v){ return /^\d{4}-\d{2}-\d{2}$/.test(v); }
function required(cond,msg,errors){ if(!cond) errors.push(msg); }

function validateDUCA(payload){
  const errors = [];
  if (!payload || typeof payload !== 'object') return { ok:false, errors:['Estructura JSON inválida'] };
  const duca = payload.duca;
  required(duca && typeof duca === 'object', 'duca requerido', errors);
  if (!duca) return { ok:false, errors };

  required(isString(duca.numeroDocumento, 20), 'numeroDocumento inválido', errors);
  required(isDateYYYYMMDD(duca.fechaEmision), 'fechaEmision inválida (YYYY-MM-DD)', errors);
  required(isString(duca.paisEmisor, 2), 'paisEmisor inválido', errors);
  required(isString(duca.tipoOperacion, 20), 'tipoOperacion inválido', errors);

  const ex = duca.exportador;
  required(ex && typeof ex === 'object', 'exportador requerido', errors);
  if (ex) {
    required(isString(ex.idExportador, 15), 'idExportador inválido', errors);
    required(isString(ex.nombreExportador, 100), 'nombreExportador inválido', errors);
  }

  const im = duca.importador;
  required(im && typeof im === 'object', 'importador requerido', errors);
  if (im) {
    required(isString(im.idImportador, 15), 'idImportador inválido', errors);
    required(isString(im.nombreImportador, 100), 'nombreImportador inválido', errors);
  }

  const tr = duca.transporte;
  required(tr && typeof tr === 'object', 'transporte requerido', errors);
  if (tr) {
    required(isString(tr.medioTransporte, 20), 'medioTransporte inválido', errors);
    required(isString(tr.placaVehiculo, 10), 'placaVehiculo inválida', errors);
    const ruta = tr.ruta;
    required(ruta && typeof ruta === 'object', 'ruta requerida', errors);
    if (ruta) {
      required(isString(ruta.aduanaSalida, 50), 'aduanaSalida inválida', errors);
      required(isString(ruta.aduanaEntrada, 50), 'aduanaEntrada inválida', errors);
      required(isString(ruta.paisDestino, 2), 'paisDestino inválido', errors);
    }
  }

  const m = duca.mercancias;
  required(m && typeof m === 'object', 'mercancias requerido', errors);
  if (m) {
    required(isInt(m.numeroItems, 3), 'numeroItems inválido', errors);
    required(Array.isArray(m.items) && m.items.length === m.numeroItems, 'items inválido', errors);
    if (Array.isArray(m.items)) {
      for (const it of m.items) {
        required(isInt(it.linea, 3), 'item.linea inválido', errors);
        required(isString(it.descripcion, 120), 'item.descripcion inválido', errors);
        required(isInt(it.cantidad, 8), 'item.cantidad inválido', errors);
        required(isString(it.unidadMedida, 10), 'item.unidadMedida inválido', errors);
        required(isDecimal(it.valorUnitario), 'item.valorUnitario inválido', errors);
        required(isString(it.paisOrigen, 2), 'item.paisOrigen inválido', errors);
      }
    }
  }

  const val = duca.valores;
  required(val && typeof val === 'object', 'valores requerido', errors);
  if (val) {
    required(isDecimal(val.valorFactura), 'valorFactura inválido', errors);
    required(isDecimal(val.valorAduanaTotal), 'valorAduanaTotal inválido', errors);
    required(isString(val.moneda, 3), 'moneda inválida', errors);
  }

  required(isString(duca.estadoDocumento, 20), 'estadoDocumento inválido', errors);
  required(isString(duca.firmaElectronica, 64), 'firmaElectronica inválida', errors);

  return { ok: errors.length === 0, errors };
}
module.exports = { validateDUCA };
