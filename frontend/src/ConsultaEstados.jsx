// frontend/src/ConsultaEstados.jsx
import { useEffect, useState } from 'react';
import { API_BASE } from './api';

export default function ConsultaEstados() {
  const [estados, setEstados] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [detalle, setDetalle] = useState(null);

  const token = localStorage.getItem('token');

  async function cargarEstados() {
    try {
      const r = await fetch(`${API_BASE}/api/duca/consulta?estado=${encodeURIComponent(estadoFiltro)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setEstados(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Error al obtener las declaraciones.');
    }
  }

  async function verDetalle(numero) {
    try {
      const r = await fetch(`${API_BASE}/api/duca/detalle/${numero}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      setDetalle(data);
    } catch (e) {
      console.error(e);
      alert('Error al obtener detalle.');
    }
  }

  useEffect(() => {
    cargarEstados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoFiltro]);

  return (
    <div style={{ marginTop: 16 }}>
      <h2>Consulta de Estados</h2>

      <div style={{ marginBottom: 8 }}>
        <label>Estado:&nbsp;</label>
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option>Todos</option>
          <option>PENDIENTE</option>
          <option>VALIDADA</option>
          <option>RECHAZADA</option>
        </select>
        &nbsp;
        <button onClick={cargarEstados}>Buscar</button>
      </div>

      <table border="1" cellPadding="4" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>DUCA</th>
            <th>Estado</th>
            <th>Creada</th>
            <th>Revisada</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {estados.length === 0 ? (
            <tr><td colSpan="5">No existe</td></tr>
          ) : estados.map((e) => (
            <tr key={e.numero_documento}>
              <td>{e.numero_documento}</td>
              <td>{e.estado}</td>
              <td>{e.creada || '-'}</td>
              <td>{e.revisada || '-'}</td>
              <td><button onClick={() => verDetalle(e.numero_documento)}>Ver detalle</button></td>
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

          {detalle.estado === 'RECHAZADA' && detalle.motivo_rechazo && (
            <div style={{ background: '#fff2f2', border: '1px solid #f00', padding: 8, marginBottom: 10 }}>
              <b>Motivo del rechazo:</b> {detalle.motivo_rechazo}
            </div>
          )}

          <fieldset style={{ marginTop: 8 }}>
            <legend>Importador</legend>
            <p><b>ID:</b> {detalle.duca?.importador?.idImportador || '-'}</p>
            <p><b>Nombre:</b> {detalle.duca?.importador?.nombreImportador || '-'}</p>
          </fieldset>

          <fieldset style={{ marginTop: 8 }}>
            <legend>Transporte</legend>
            <p><b>Medio:</b> {detalle.duca?.transporte?.medio || '-'}</p>
            <p><b>Placa:</b> {detalle.duca?.transporte?.placa || '-'}</p>
            <p><b>Aduana salida:</b> {detalle.duca?.transporte?.aduanaSalida || '-'}</p>
            <p><b>Aduana entrada:</b> {detalle.duca?.transporte?.aduanaEntrada || '-'}</p>
            <p><b>País destino:</b> {detalle.duca?.transporte?.paisDestino || '-'}</p>
          </fieldset>

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
                  <th>PU ({detalle.duca?.valores?.moneda || 'GTQ'})</th>
                </tr>
              </thead>
              <tbody>
                {(detalle.duca?.mercancias?.items || []).map((m, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{m.cantidad}</td>
                    <td>{m.paisOrigen}</td>
                    <td>{m.descripcion}</td>
                    <td>{m.unidadMedida}</td>
                    <td>{m.valorUnitario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </fieldset>

          <fieldset style={{ marginTop: 8 }}>
            <legend>Valores</legend>
            <p><b>Moneda:</b> {detalle.duca?.valores?.moneda || 'GTQ'}</p>
            <p><b>Valor factura:</b> {detalle.duca?.valores?.valorFactura} ({detalle.duca?.valores?.moneda || 'GTQ'})</p>
            <p><b>Valor aduana total:</b> {detalle.duca?.valores?.valorAduanaTotal} ({detalle.duca?.valores?.moneda || 'GTQ'})</p>
          </fieldset>
        </div>
      )}
    </div>
  );
}
