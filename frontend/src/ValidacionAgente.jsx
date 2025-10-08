import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from './api';

/** Lee un path anidado: get(o, 'a.b.c') */
function get(o, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), o);
}
/** Intenta varios paths y devuelve el primero que exista. */
function getAny(o, paths = []) {
  for (const p of paths) {
    const v = get(o, p);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}
/** Campo requerido simple */
function req(duca, path, label, faltantes) {
  const v = get(duca, path);
  const empty =
    v === undefined ||
    v === null ||
    (typeof v === 'string' && v.trim() === '') ||
    (typeof v === 'number' && Number.isNaN(v));
  if (empty) faltantes.push(label);
  return v;
}
/** Requerido pero tolerando varias rutas posibles */
function reqAny(duca, paths, label, faltantes) {
  const v = getAny(duca, paths);
  if (
    v === undefined ||
    v === null ||
    (typeof v === 'string' && v.trim() === '')
  ) {
    faltantes.push(label);
  }
  return v;
}

/** Valida DUCA y devuelve lista de faltantes human-readable */
function validarDuca(duca) {
  const faltantes = [];
  if (!duca || typeof duca !== 'object') return ['Estructura de DUCA vacía o inválida'];

  // Declaración
  req(duca, 'numeroDocumento', 'N° Documento', faltantes);
  req(duca, 'fechaEmision', 'Fecha de emisión', faltantes);
  req(duca, 'paisEmisor', 'País emisor', faltantes);
  req(duca, 'tipoOperacion', 'Tipo de operación', faltantes); // OBLIGATORIO

  // Importador
  req(duca, 'importador.idImportador', 'Importador - ID', faltantes);
  req(duca, 'importador.nombreImportador', 'Importador - Nombre', faltantes);

  // Transporte (tolerante a ambos esquemas)
  reqAny(duca, ['transporte.medio', 'transporte.medioTransporte'], 'Transporte - Medio', faltantes);
  reqAny(duca, ['transporte.placa', 'transporte.placaVehiculo'], 'Transporte - Placa', faltantes);
  
  // Placa opcional: si querés obligatoria, usa reqAny(...) con label y paths.
  reqAny(duca, ['transporte.aduanaSalida', 'transporte.ruta.aduanaSalida'], 'Transporte - Aduana salida', faltantes);
  reqAny(duca, ['transporte.aduanaEntrada', 'transporte.ruta.aduanaEntrada'], 'Transporte - Aduana entrada', faltantes);
  reqAny(duca, ['transporte.paisDestino', 'transporte.ruta.paisDestino'], 'Transporte - País destino', faltantes);

  // Mercancías
  const items = duca?.mercancias?.items || [];
  if (!Array.isArray(items) || items.length === 0) {
    faltantes.push('Mercancías - Debe haber al menos 1 ítem');
  } else {
    items.forEach((it, idx) => {
      const ix = idx + 1;
      if (it == null || typeof it !== 'object') {
        faltantes.push(`Mercancías[${ix}] - Ítem inválido`);
        return;
      }
      if (!(Number(it.cantidad) > 0)) faltantes.push(`Mercancías[${ix}] - Cantidad (>0)`);
      if (!it.paisOrigen) faltantes.push(`Mercancías[${ix}] - País de origen`);
      if (!it.descripcion) faltantes.push(`Mercancías[${ix}] - Descripción`);
      if (!it.unidadMedida) faltantes.push(`Mercancías[${ix}] - Unidad de medida`);
      if (!(Number(it.valorUnitario) >= 0)) faltantes.push(`Mercancías[${ix}] - Valor unitario (>=0)`);
    });
  }

  // Valores
  req(duca, 'valores.moneda', 'Valores - Moneda', faltantes);
  if (!(Number(duca?.valores?.valorFactura) >= 0)) faltantes.push('Valores - Valor factura (>=0)');
  if (!(Number(duca?.valores?.valorAduanaTotal) >= 0)) faltantes.push('Valores - Valor aduana total (>=0)');

  return faltantes;
}

export default function ValidacionAgente() {
  const [pendientes, setPendientes] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [motivo, setMotivo] = useState('');
  const token = localStorage.getItem('token');

  async function cargarPendientes() {
    try {
      const r = await fetch(`${API_BASE}/api/duca/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setPendientes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Error al obtener pendientes');
    }
  }

  async function verDetalle(numero) {
    try {
      const r = await fetch(`${API_BASE}/api/duca/detalle/${numero}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setDetalle(data);
      setMotivo('');
    } catch (e) {
      console.error(e);
      alert('Error al obtener detalle');
    }
  }

  async function aprobar(numero) {
    if (!window.confirm(`¿Aprobar DUCA ${numero}?`)) return;
    try {
      await fetch(`${API_BASE}/api/duca/aprobar/${numero}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('DUCA aprobada');
      setDetalle(null);
      cargarPendientes();
    } catch (e) {
      console.error(e);
      alert('Error al aprobar DUCA');
    }
  }

  async function rechazar(numero) {
    if (!motivo.trim()) {
      alert('Debe ingresar un motivo de rechazo');
      return;
    }
    if (!window.confirm(`¿Rechazar DUCA ${numero}?`)) return;
    try {
      await fetch(`${API_BASE}/api/duca/rechazar/${numero}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      });
      alert('DUCA rechazada');
      setDetalle(null);
      setMotivo('');
      cargarPendientes();
    } catch (e) {
      console.error(e);
      alert('Error al rechazar DUCA');
    }
  }

  useEffect(() => {
    cargarPendientes();
  }, []);

  const faltantes = useMemo(() => validarDuca(detalle?.duca), [detalle]);
  const duca = detalle?.duca || {};

  // Lecturas tolerantes para transporte y presentaciones
  const tMedio = getAny(duca, ['transporte.medio', 'transporte.medioTransporte']) || '-';
  const tPlaca = getAny(duca, ['transporte.placa', 'transporte.placaVehiculo']) || '-';
  const tAduanaSalida = getAny(duca, ['transporte.aduanaSalida', 'transporte.ruta.aduanaSalida']) || '-';
  const tAduanaEntrada = getAny(duca, ['transporte.aduanaEntrada', 'transporte.ruta.aduanaEntrada']) || '-';
  const tPaisDestino = getAny(duca, ['transporte.paisDestino', 'transporte.ruta.paisDestino']) || '-';

  return (
    <div style={{ marginTop: 16 }}>
      <h2>Validación de Declaraciones</h2>
      <button onClick={cargarPendientes}>Refrescar pendientes</button>

      <table border="1" cellPadding="4" style={{ width: '100%', marginTop: 10, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>No.</th>
            <th>Estado</th>
            <th>Fecha creación</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {pendientes.length === 0 ? (
            <tr><td colSpan="4">Sin pendientes</td></tr>
          ) : pendientes.map((p) => (
            <tr key={p.numero_documento}>
              <td>{p.numero_documento}</td>
              <td>{p.estado}</td>
              <td>{p.creada}</td>
              <td><button onClick={() => verDetalle(p.numero_documento)}>Ver</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {detalle && (
        <div style={{ marginTop: 16, border: '1px solid #ccc', padding: 10 }}>
          <h3>Detalle {detalle.numero_documento}</h3>

          <p>
            <b>Estado:</b> {detalle.estado} &nbsp;|&nbsp;
            <b>Creada:</b> {detalle.creada} &nbsp;|&nbsp;
            <b>Revisada:</b> {detalle.revisada}
          </p>

          {/* Aviso de faltantes */}
          {faltantes.length > 0 && (
            <div style={{ background:'#fff9e6', border:'1px solid #f0ad4e', padding:10, marginBottom:12 }}>
              <b>Datos faltantes:</b>
              <ul style={{ marginTop: 6 }}>
                {faltantes.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Declaración */}
          <fieldset style={{ marginTop: 8 }}>
            <legend>Declaración</legend>
            <p><b>N° Documento:</b> {duca?.numeroDocumento || '-'}</p>
            <p><b>Fecha emisión:</b> {duca?.fechaEmision || '-'}</p>
            <p><b>País emisor:</b> {duca?.paisEmisor || '-'}</p>
            <p><b>Tipo operación:</b> {duca?.tipoOperacion || '-'}</p>
          </fieldset>

          {/* Importador */}
          <fieldset style={{ marginTop: 8 }}>
            <legend>Importador</legend>
            <p><b>ID:</b> {duca?.importador?.idImportador || '-'}</p>
            <p><b>Nombre:</b> {duca?.importador?.nombreImportador || '-'}</p>
          </fieldset>

          {/* Transporte */}
          <fieldset style={{ marginTop: 8 }}>
            <legend>Transporte</legend>
            <p><b>Medio:</b> {tMedio}</p>
            <p><b>Placa:</b> {tPlaca}</p>
            <p><b>Aduana salida:</b> {tAduanaSalida}</p>
            <p><b>Aduana entrada:</b> {tAduanaEntrada}</p>
            <p><b>País destino:</b> {tPaisDestino}</p>
          </fieldset>

          {/* Mercancías */}
          <fieldset style={{ marginTop: 8 }}>
            <legend>Mercancías</legend>
            <table border="1" cellPadding="3" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#eee' }}>
                <tr>
                  <th>#</th>
                  <th>Cant.</th>
                  <th>País</th>
                  <th>Descripción</th>
                  <th>Unidad</th>
                  <th>PU ({duca?.valores?.moneda || 'GTQ'})</th>
                </tr>
              </thead>
              <tbody>
                {(duca?.mercancias?.items || []).map((m, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{m?.cantidad ?? '-'}</td>
                    <td>{m?.paisOrigen || '-'}</td>
                    <td>{m?.descripcion || '-'}</td>
                    <td>{m?.unidadMedida || '-'}</td>
                    <td>{m?.valorUnitario ?? '-'}</td>
                  </tr>
                ))}
                {(!duca?.mercancias?.items || duca?.mercancias?.items.length === 0) && (
                  <tr><td colSpan="6">Sin ítems</td></tr>
                )}
              </tbody>
            </table>
          </fieldset>

          {/* Valores */}
          <fieldset style={{ marginTop: 8 }}>
            <legend>Valores</legend>
            <p><b>Moneda:</b> {duca?.valores?.moneda || 'GTQ'}</p>
            <p><b>Valor factura:</b> {duca?.valores?.valorFactura ?? '-'}</p>
            <p><b>Valor aduana total:</b> {duca?.valores?.valorAduanaTotal ?? '-'}</p>
          </fieldset>

          <div style={{ marginTop: 16 }}>
            <h4>Acción del agente aduanero</h4>
            <textarea
              placeholder="Motivo del rechazo (obligatorio si se rechaza)"
              rows="3"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
            ></textarea>

            <button
              style={{ background: '#4caf50', color: 'white', marginRight: 8 }}
              onClick={() => aprobar(detalle.numero_documento)}
            >
              Aprobar
            </button>

            <button
              style={{ background: '#f44336', color: 'white' }}
              onClick={() => rechazar(detalle.numero_documento)}
            >
              Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
