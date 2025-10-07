import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

function useAuthHeader(){ const t=localStorage.getItem('token'); return { Authorization:`Bearer ${t}` }; }
function fmtDate(x){ if(!x) return '-'; try{return new Date(x).toLocaleString();}catch{return String(x);} }

export default function ConsultaEstados(){
  const headers = useAuthHeader();
  const [items, setItems] = useState([]);
  const [estado, setEstado] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [msg, setMsg] = useState('');

  async function load(){
    setMsg('');
    try{
      const { data } = await axios.get(`${API_BASE}/api/consulta/mis`, { headers, params:{ estado: estado || undefined } });
      setItems(data);
    }catch(e){ setMsg(e.response?.data?.error || 'Error al cargar'); }
  }

  async function ver(numero){
    setMsg('');
    try{
      const { data } = await axios.get(`${API_BASE}/api/consulta/${numero}`, { headers });
      setDetalle(data);
    }catch(e){ setMsg(e.response?.data?.error || 'Error al obtener detalle'); }
  }

  useEffect(()=>{ load(); },[]);

  const dj = useMemo(()=> detalle ? (detalle.duca_json?.duca || detalle.duca_json || {}) : null, [detalle]);

  return (
    <div style={{ display:'grid', gap:12 }}>
      <h2>Consulta de Estados</h2>

      <div>
        Estado:&nbsp;
        <select value={estado} onChange={e=>setEstado(e.target.value)}>
          <option value="">Todos</option>
          <option>PENDIENTE</option>
          <option>VALIDADA</option>
          <option>RECHAZADA</option>
        </select>
        &nbsp;<button onClick={load}>Buscar</button>
      </div>

      <table border="1" cellPadding="6" style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead>
          <tr>
            <th>DUCA</th>
            <th>Estado</th>
            <th>Creada</th>
            <th>Revisado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it=>(
            <tr key={it.numero_documento}>
              <td>{it.numero_documento}</td>
              <td>{it.estado}</td>
              <td>{fmtDate(it.created_at)}</td>
              <td>{fmtDate(it.validated_at)}</td>
              <td><button onClick={()=>ver(it.numero_documento)}>Ver detalle</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {msg && <div style={{ color:'crimson' }}>{msg}</div>}

      {dj && (
        <div style={{ border:'1px solid #ccc', padding:12 }}>
          <h3>Detalle {detalle.numero_documento}</h3>
          <div><b>Estado:</b> {detalle.estado}</div>
          <div><b>Creada:</b> {fmtDate(detalle.created_at)} &nbsp;|&nbsp; <b>Revisado:</b> {fmtDate(detalle.validated_at)}</div>

          <fieldset style={{ marginTop:10 }}>
            <legend>Importador</legend>
            <div><b>ID:</b> {dj.importador?.idImportador || '-'}</div>
            <div><b>Nombre:</b> {dj.importador?.nombreImportador || '-'}</div>
          </fieldset>

          <fieldset style={{ marginTop:10 }}>
            <legend>Transporte</legend>
            <div><b>Medio:</b> {dj.transporte?.medioTransporte || '-'}</div>
            <div><b>Placa:</b> {dj.transporte?.placaVehiculo || '-'}</div>
            <div><b>Aduana salida:</b> {dj.transporte?.ruta?.aduanaSalida || '-'}</div>
            <div><b>Aduana entrada:</b> {dj.transporte?.ruta?.aduanaEntrada || '-'}</div>
            <div><b>País destino:</b> {dj.transporte?.ruta?.paisDestino || '-'}</div>
          </fieldset>

          <fieldset style={{ marginTop:10 }}>
            <legend>Mercancías</legend>
            <table border="1" cellPadding="6" style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th>#</th><th>Cant.</th><th>País</th><th>Descripción</th><th>Unidad</th><th>PU</th>
                </tr>
              </thead>
              <tbody>
                {(dj.mercancias?.items||[]).map((it, i)=>(
                  <tr key={i}>
                    <td>{it.linea || i+1}</td>
                    <td>{it.cantidad}</td>
                    <td>{it.paisOrigen}</td>
                    <td>{it.descripcion}</td>
                    <td>{it.unidadMedida}</td>
                    <td>{it.valorUnitario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </fieldset>

          <fieldset style={{ marginTop:10 }}>
            <legend>Valores</legend>
            <div><b>Moneda:</b> {dj.valores?.moneda || '-'}</div>
            <div><b>Valor factura:</b> {dj.valores?.valorFactura ?? '-'}</div>
            <div><b>Valor aduana total:</b> {dj.valores?.valorAduanaTotal ?? '-'}</div>
          </fieldset>

          {detalle.motivo_rechazo && (
            <fieldset style={{ marginTop:10 }}>
              <legend>Motivo de rechazo</legend>
              <div>{detalle.motivo_rechazo}</div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}
