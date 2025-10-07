import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

function useAuthHeader(){
  const t = localStorage.getItem('token');
  return { Authorization: `Bearer ${t}` };
}
function fmtDate(x){ if(!x) return '-'; try{return new Date(x).toLocaleString();}catch{return String(x);} }

export default function ValidacionAgente(){
  const headers = useAuthHeader();
  const [pendientes, setPendientes] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [msg, setMsg] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  async function loadPendientes(){
    setMsg(''); setDetalle(null);
    try{
      const { data } = await axios.get(`${API_BASE}/api/validacion/pendientes`, { headers });
      setPendientes(data);
    }catch(e){ setMsg(e.response?.data?.error || 'Error al obtener pendientes'); }
  }

  async function ver(numero){
    setMsg(''); setDetalle(null);
    try{
      const { data } = await axios.get(`${API_BASE}/api/consulta/${numero}`, { headers });
      setDetalle(data);
    }catch(e){ setMsg(e.response?.data?.error || 'Error al obtener detalle'); }
  }

  useEffect(()=>{ loadPendientes(); },[]);

  // Normalización y verificación de faltantes
  const norm = useMemo(()=>{
    if (!detalle) return null;
    const dj = detalle.duca_json?.duca || detalle.duca_json || {};
    const mercs = (dj.mercancias?.items) || [];
    const faltantes = [];

    if (!dj.importador?.idImportador) faltantes.push('Importador: ID');
    if (!dj.importador?.nombreImportador) faltantes.push('Importador: Nombre');

    if (!dj.transporte?.medioTransporte) faltantes.push('Transporte: Medio');
    if (!dj.transporte?.ruta?.aduanaSalida) faltantes.push('Transporte: Aduana salida');
    if (!dj.transporte?.ruta?.aduanaEntrada) faltantes.push('Transporte: Aduana entrada');
    if (!dj.transporte?.ruta?.paisDestino) faltantes.push('Transporte: País destino');

    if (!mercs.length) faltantes.push('Mercancías: Debe existir al menos un ítem');
    mercs.forEach((it, i)=>{
      const n = it.linea ?? (i+1);
      if (!it.descripcion) faltantes.push(`Ítem ${n}: Descripción`);
      if (!(Number(it.cantidad)>0)) faltantes.push(`Ítem ${n}: Cantidad`);
      if (!it.unidadMedida) faltantes.push(`Ítem ${n}: Unidad de medida`);
      if (!(Number(it.valorUnitario)>0)) faltantes.push(`Ítem ${n}: Valor unitario`);
      if (!it.paisOrigen) faltantes.push(`Ítem ${n}: País origen`);
    });

    if (!dj.valores?.moneda) faltantes.push('Valores: Moneda');
    if (dj.valores?.valorFactura == null) faltantes.push('Valores: Valor factura');
    if (dj.valores?.valorAduanaTotal == null) faltantes.push('Valores: Valor aduana total');

    return {
      numero: detalle.numero_documento,
      estado: detalle.estado,
      creada: detalle.created_at,
      validada: detalle.validated_at,
      motivo: detalle.motivo_rechazo || '',
      dj,
      mercs,
      faltantes
    };
  }, [detalle]);

  async function aprobar(numero){
    if (!numero) return;
    setLoadingAction(true); setMsg('');
    try{
      await axios.post(`${API_BASE}/api/validacion/${numero}/aprobar`, {}, { headers });
      await loadPendientes(); setDetalle(null);
      alert('Declaración aprobada.');
    }catch(e){ setMsg(e.response?.data?.error || 'Error al aprobar'); }
    finally{ setLoadingAction(false); }
  }

  async function rechazar(numero){
    if (!numero) return;
    const motivo = window.prompt('Motivo de rechazo (obligatorio):');
    if (!motivo || !motivo.trim()) return alert('El motivo es obligatorio para rechazar.');
    setLoadingAction(true); setMsg('');
    try{
      await axios.post(`${API_BASE}/api/validacion/${numero}/rechazar`, { motivo }, { headers });
      await loadPendientes(); setDetalle(null);
      alert('Declaración rechazada.');
    }catch(e){ setMsg(e.response?.data?.error || 'Error al rechazar'); }
    finally{ setLoadingAction(false); }
  }

  return (
    <div style={{ display:'grid', gap:12 }}>
      <h2>Validación de Declaraciones</h2>
      <button onClick={loadPendientes}>Refrescar pendientes</button>

      <table border="1" cellPadding="6" style={{ width:'100%', borderCollapse:'collapse', marginTop:8 }}>
        <thead>
          <tr><th>No.</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr>
        </thead>
        <tbody>
          {pendientes.map(p=>(
            <tr key={p.numero_documento}>
              <td>{p.numero_documento}</td>
              <td>{p.estado}</td>
              <td>{fmtDate(p.created_at)}</td>
              <td><button onClick={()=>ver(p.numero_documento)}>Ver</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {msg && <div style={{ color:'crimson' }}>{msg}</div>}

      {norm && (
        <div style={{ border:'1px solid #ccc', padding:12 }}>
          <h3>Detalle {norm.numero}</h3>

          {norm.faltantes.length > 0 && (
            <div style={{ background:'#fff3cd', border:'1px solid #ffeeba', padding:10, marginBottom:12 }}>
              <b>Datos incompletos:</b>
              <ul style={{ margin:'6px 0 0 18px' }}>
                {norm.faltantes.map((f,i)=><li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            <div><b>Estado:</b> {norm.estado}</div>
            <div><b>Creada:</b> {fmtDate(norm.creada)}</div>
            <div><b>Revisado:</b> {fmtDate(norm.validada)}</div>
          </div>

          <fieldset style={{ marginTop:10 }}>
            <legend>Importador</legend>
            <div><b>ID:</b> {norm.dj.importador?.idImportador || '-'}</div>
            <div><b>Nombre:</b> {norm.dj.importador?.nombreImportador || '-'}</div>
          </fieldset>

          <fieldset style={{ marginTop:10 }}>
            <legend>Transporte</legend>
            <div><b>Medio:</b> {norm.dj.transporte?.medioTransporte || '-'}</div>
            <div><b>Placa:</b> {norm.dj.transporte?.placaVehiculo || '-'}</div>
            <div><b>Aduana salida:</b> {norm.dj.transporte?.ruta?.aduanaSalida || '-'}</div>
            <div><b>Aduana entrada:</b> {norm.dj.transporte?.ruta?.aduanaEntrada || '-'}</div>
            <div><b>País destino:</b> {norm.dj.transporte?.ruta?.paisDestino || '-'}</div>
          </fieldset>

          <fieldset style={{ marginTop:10 }}>
            <legend>Mercancías</legend>
            <table border="1" cellPadding="6" style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th>#</th><th>Cant.</th><th>País</th><th>Descripción</th><th>Unidad</th><th>PU</th><th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {norm.mercs.map((it,i)=>{
                  const q = Number(it.cantidad)||0;
                  const pu = Number(it.valorUnitario)||0;
                  const sub = q*pu;
                  return (
                    <tr key={i}>
                      <td>{it.linea || i+1}</td>
                      <td>{q}</td>
                      <td>{it.paisOrigen || '-'}</td>
                      <td>{it.descripcion || '-'}</td>
                      <td>{it.unidadMedida || '-'}</td>
                      <td>{pu.toFixed(2)}</td>
                      <td>{sub.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </fieldset>

          <fieldset style={{ marginTop:10 }}>
            <legend>Valores</legend>
            <div><b>Moneda:</b> {norm.dj.valores?.moneda || '-'}</div>
            <div><b>Valor factura:</b> {norm.dj.valores?.valorFactura ?? '-'}</div>
            <div><b>Valor aduana total:</b> {norm.dj.valores?.valorAduanaTotal ?? '-'}</div>
          </fieldset>

          <div style={{ display:'flex', gap:10, marginTop:12 }}>
            <button disabled={loadingAction} onClick={()=>aprobar(norm.numero)}>Aprobar</button>
            <button disabled={loadingAction} onClick={()=>rechazar(norm.numero)}>Rechazar</button>
          </div>

          {norm.motivo && (
            <fieldset style={{ marginTop:10 }}>
              <legend>Motivo de rechazo</legend>
              <div>{norm.motivo}</div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}
