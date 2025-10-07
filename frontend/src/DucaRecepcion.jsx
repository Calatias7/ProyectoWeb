import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

function useAuthHeader(){
  const t = localStorage.getItem('token');
  return { Authorization: `Bearer ${t}` };
}

const UNIDADES = ['CAJA','PALETS','CONTENEDOR'];
const PAISES_CA = ['GT','SV','HN','NI','CR','PA','BZ'];

function hoyISO(){ return new Date().toISOString().slice(0,10); }
function randomDUCA() {
  const n = Math.floor(Math.random() * 900000 + 100000);
  return `GT${new Date().getFullYear()}DUCA${n}`;
}

export default function DucaRecepcion(){
  const headers = useAuthHeader();

  // Declaración
  const [numero, setNumero] = useState(randomDUCA());
  const [fechaEmision, setFechaEmision] = useState(hoyISO());
  const [paisEmisor] = useState('GT');

  // Importador
  const [idImportador, setIdImportador] = useState('');
  const [nombreImportador, setNombreImportador] = useState('');

  // Transporte
  const [medioTransporte, setMedioTransporte] = useState('TERRESTRE');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [aduanaSalida, setAduanaSalida] = useState('');
  const [aduanaEntrada, setAduanaEntrada] = useState('');
  const [paisDestino, setPaisDestino] = useState('');

  // Mercancías
  const [items, setItems] = useState([
    { cantidad:'', paisOrigen:'GT', descripcion:'', unidadMedida:'CAJA', valorUnitario:'' }
  ]);
  const addItem = () => setItems([...items, { cantidad:'', paisOrigen:'GT', descripcion:'', unidadMedida:'CAJA', valorUnitario:'' }]);
  const delItem = (i) => setItems(items.filter((_,ix)=>ix!==i));
  const updItem = (i, k, v) => setItems(items.map((it,ix)=>ix===i?{...it,[k]:v}:it));

  // Valores
  const [moneda, setMoneda] = useState('GTQ');
  const [valorFactura, setValorFactura] = useState('');
  const [valorAduanaTotal, setValorAduanaTotal] = useState('');

  // Estado UI
  const [msg, setMsg] = useState('');

  // Autocálculo totales
  const totalCalc = useMemo(() =>
    items.reduce((acc, it) => acc + (Number(it.cantidad)||0) * (Number(it.valorUnitario)||0), 0)
  , [items]);

  useEffect(()=>{
    const t = totalCalc.toFixed(2);
    setValorFactura(t);
    setValorAduanaTotal(t);
  }, [totalCalc]);

  async function enviar(){
    setMsg('');
    const duca = {
      numeroDocumento: numero,
      fechaEmision,
      paisEmisor,
      importador: { idImportador, nombreImportador },
      transporte: {
        medioTransporte,
        placaVehiculo,
        ruta: { aduanaSalida, aduanaEntrada, paisDestino }
      },
      mercancias: {
        items: items.map((it,idx)=>({ linea: idx+1, ...it }))
      },
      valores: {
        moneda,
        valorFactura: Number(valorFactura||0),
        valorAduanaTotal: Number(valorAduanaTotal||0)
      }
    };

    try{
      const { data } = await axios.post(`${API_BASE}/api/duca/enviar`, { duca }, { headers });
      alert('Declaración enviada con éxito');
      // N° documento nuevo automáticamente
      setNumero(randomDUCA());
      // (opcional) reset de algunos campos
      // setItems([{ cantidad:'', paisOrigen:'GT', descripcion:'', unidadMedida:'CAJA', valorUnitario:'' }]);
    }catch(e){
      setMsg(e.response?.data?.error || 'Error al enviar la declaración');
    }
  }

  return (
    <div style={{ display:'grid', gap:10 }}>
      <h2>Registro de DUCA (Transportista)</h2>

      <fieldset>
        <legend>Declaración</legend>
        Nº Documento
        <input style={{width:260}} value={numero} onChange={e=>setNumero(e.target.value)} />
        &nbsp; Fecha Emisión
        <input type="date" value={fechaEmision} onChange={e=>setFechaEmision(e.target.value)} />
        &nbsp; País Emisor
        <input readOnly style={{width:80}} value={paisEmisor} />
      </fieldset>

      <fieldset>
        <legend>Importador</legend>
        ID <input style={{width:120}} value={idImportador} onChange={e=>setIdImportador(e.target.value)} />
        &nbsp; Nombre <input style={{width:220}} value={nombreImportador} onChange={e=>setNombreImportador(e.target.value)} />
      </fieldset>

      <fieldset>
        <legend>Transporte</legend>
        Medio
        <select value={medioTransporte} onChange={e=>setMedioTransporte(e.target.value)}>
          <option>TERRESTRE</option>
          <option>AEREO</option>
          <option>MARITIMO</option>
        </select>
        &nbsp; Placa
        <input style={{width:150}} value={placaVehiculo} onChange={e=>setPlacaVehiculo(e.target.value)} />
        &nbsp; Aduana salida
        <input value={aduanaSalida} onChange={e=>setAduanaSalida(e.target.value)} />
        &nbsp; Aduana entrada
        <input value={aduanaEntrada} onChange={e=>setAduanaEntrada(e.target.value)} />
        &nbsp; País destino
        <select value={paisDestino} onChange={e=>setPaisDestino(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          {PAISES_CA.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </fieldset>

      <fieldset>
        <legend>Mercancías</legend>
        {items.map((it, idx)=>(
          <div key={idx} style={{ display:'grid', gridTemplateColumns:'90px 90px 1fr 180px 150px auto', gap:6, marginBottom:6 }}>
            <input placeholder="Cantidad" value={it.cantidad} onChange={e=>updItem(idx,'cantidad',e.target.value)} />
            <input placeholder="País de origen" value={it.paisOrigen} onChange={e=>updItem(idx,'paisOrigen',e.target.value)} />
            <input placeholder="Descripción" value={it.descripcion} onChange={e=>updItem(idx,'descripcion',e.target.value)} />
            <select value={it.unidadMedida} onChange={e=>updItem(idx,'unidadMedida',e.target.value)}>
              {UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
            <input placeholder="Valor unitario" value={it.valorUnitario} onChange={e=>updItem(idx,'valorUnitario',e.target.value)} />
            <button type="button" onClick={()=>delItem(idx)}>Eliminar</button>
          </div>
        ))}
        <button type="button" onClick={addItem}>Agregar ítem</button>
      </fieldset>

      <fieldset>
        <legend>Valores</legend>
        Valor factura
        <input value={valorFactura} onChange={e=>setValorFactura(e.target.value)} />
        &nbsp; Valor aduana total
        <input value={valorAduanaTotal} onChange={e=>setValorAduanaTotal(e.target.value)} />
        &nbsp; Moneda
        <select value={moneda} onChange={e=>setMoneda(e.target.value)}>
          <option>GTQ</option>
          <option>USD</option>
        </select>
        <div style={{ fontSize:12, color:'#666' }}>Mostrando importes en {moneda}.</div>
      </fieldset>

      <button onClick={enviar}>Enviar declaración</button>
      {msg && <div style={{ color:'crimson' }}>{msg}</div>}
    </div>
  );
}
