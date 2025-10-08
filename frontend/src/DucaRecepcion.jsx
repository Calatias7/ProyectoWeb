// frontend/src/DucaRecepcion.jsx
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

function useAuthHeader() {
  const t = localStorage.getItem('token');
  return { Authorization: `Bearer ${t}` };
}

const UNIDADES = ['CAJA', 'PALETS', 'CONTENEDOR'];
const PAISES_CA = ['GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'BZ'];

/* Tasas de ejemplo (base interna = GTQ).
   Si luego quieres reales, las movemos al backend/DB. */
const FX = {
  GTQ: 1,
  USD: 0.128, // 1 GTQ -> 0.128 USD (ajústalo si deseas)
};

const f2 = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

function hoyISO() { return new Date().toISOString().slice(0, 10); }
function randomDUCA() {
  const n = Math.floor(Math.random() * 900000 + 100000);
  return `GT${new Date().getFullYear()}DUCA${n}`;
}

export default function DucaRecepcion() {
  const headers = useAuthHeader();

  // Declaración
  const [numero, setNumero] = useState(randomDUCA());
  const [fechaEmision, setFechaEmision] = useState(hoyISO());
  const [paisEmisor] = useState('GT');

  // Transporte
  const [medioTransporte, setMedioTransporte] = useState('TERRESTRE');
  const [placaVehiculo, setPlacaVehiculo] = useState('');

  // Aduanas
  const [aduanas, setAduanas] = useState([]);
  const [aduanaSalida, setAduanaSalida] = useState('');
  const [aduanaEntrada, setAduanaEntrada] = useState('');

  const [paisDestino, setPaisDestino] = useState('GT');

  // Mercancías
  const [items, setItems] = useState([
    { cantidad: '', paisOrigen: 'GT', descripcion: '', unidadMedida: 'CAJA', valorUnitario: '' },
  ]);
  const addItem = () =>
    setItems((p) => [...p, { cantidad: '', paisOrigen: 'GT', descripcion: '', unidadMedida: 'CAJA', valorUnitario: '' }]);
  const delItem = (i) => setItems((p) => p.filter((_, ix) => ix !== i));
  const updItem = (i, k, v) => setItems((p) => p.map((it, ix) => (ix === i ? { ...it, [k]: v } : it)));

  // Valores
  const [moneda, setMoneda] = useState('GTQ');
  const [valorFactura, setValorFactura] = useState('');
  const [valorAduanaTotal, setValorAduanaTotal] = useState('');

  // Importadores
  const [importadores, setImportadores] = useState([]);
  const [importadorId, setImportadorId] = useState('');
  const importadorSel = useMemo(
    () => importadores.find((i) => String(i.id) === String(importadorId)) || null,
    [importadores, importadorId]
  );

  // UI
  const [msg, setMsg] = useState('');

  // Totales desde items (SIEMPRE)
  const totalCalc = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.valorUnitario) || 0), 0),
    [items]
  );
  useEffect(() => {
    const t = f2(totalCalc);
    setValorFactura(t);
    setValorAduanaTotal(t);
  }, [totalCalc]);

  // Cargas
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/users/importadores`, { headers });
        setImportadores(data || []);
        if (data?.length && !importadorId) setImportadorId(String(data[0].id));
      } catch (e) {
        console.error(e);
        alert('Error al cargar la lista de importadores.');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/catalogos/aduanas`, { headers });
        setAduanas(data || []);
        if (data?.length) {
          if (!aduanaSalida) setAduanaSalida(String(data[0].codigo || data[0].id));
          if (!aduanaEntrada) setAduanaEntrada(String(data[0].codigo || data[0].id));
        }
      } catch (e) {
        console.error(e);
        alert('Error al cargar el catálogo de aduanas.');
      }
    })();
  }, []);

  // Conversión de moneda: convierte PU de cada item y luego totales se recalculan
  function onChangeMoneda(e) {
    const nueva = e.target.value;
    if (nueva === moneda) return;
    const rateOld = FX[moneda] || 1;
    const rateNew = FX[nueva] || 1;
    const factor = rateNew / rateOld;

    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        valorUnitario: f2((Number(it.valorUnitario) || 0) * factor),
      }))
    );
    setMoneda(nueva);
    // totales se recalculan automáticamente desde items
  }

  async function enviar() {
    setMsg('');
    if (!importadorSel) return alert('Seleccione un importador.');
    if (!aduanaSalida || !aduanaEntrada) return alert('Seleccione aduana de salida y de entrada.');

    const duca = {
      numeroDocumento: numero,
      fechaEmision,
      paisEmisor,
      importador: {
        idImportador: importadorSel.id,
        nombreImportador: importadorSel.nombre,
      },
      transporte: {
        medioTransporte,
        placaVehiculo,
        ruta: { aduanaSalida, aduanaEntrada, paisDestino },
      },
      mercancias: {
        items: items.map((it, idx) => ({
          linea: idx + 1,
          cantidad: it.cantidad,
          paisOrigen: it.paisOrigen,
          descripcion: it.descripcion,
          unidadMedida: it.unidadMedida,
          valorUnitario: it.valorUnitario,
        })),
      },
      valores: {
        moneda,
        valorFactura: Number(valorFactura || 0),
        valorAduanaTotal: Number(valorAduanaTotal || 0),
      },
    };

    try {
      const { data } = await axios.post(`${API_BASE}/api/duca/enviar`, { duca }, { headers });
      alert('Declaración enviada con éxito (número: ' + (data.numero || numero) + ')');
      setNumero(randomDUCA());
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error al enviar la declaración');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <h2>Registro de DUCA (Transportista)</h2>

      <fieldset>
        <legend>Declaración</legend>
        Nº Documento
        <input style={{ width: 260 }} value={numero} onChange={(e) => setNumero(e.target.value)} />
        &nbsp; Fecha Emisión
        <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
        &nbsp; País Emisor
        <input readOnly style={{ width: 80 }} value={paisEmisor} />
      </fieldset>

      {/* Importador */}
      <fieldset>
        <legend>Importador</legend>
        <label>Seleccionar:&nbsp;</label>
        <select value={importadorId} onChange={(e) => setImportadorId(e.target.value)} style={{ minWidth: 320 }}>
          {importadores.length === 0 && <option value="">-- No hay importadores --</option>}
          {importadores.map((i) => (
            <option key={i.id} value={i.id}>{i.nombre}</option>
          ))}
        </select>
        <div style={{ marginTop: 8 }}>
          <label>Nombre:&nbsp;</label>
          <input readOnly style={{ width: 280 }} value={importadorSel?.nombre || ''} />
          &nbsp;&nbsp;
          <label>ID:&nbsp;</label>
          <input readOnly style={{ width: 100 }} value={importadorSel?.id || ''} />
        </div>
      </fieldset>

      {/* Transporte */}
      <fieldset>
        <legend>Transporte</legend>
        Medio
        <select value={medioTransporte} onChange={(e) => setMedioTransporte(e.target.value)}>
          <option>TERRESTRE</option>
          <option>AEREO</option>
          <option>MARITIMO</option>
        </select>
        &nbsp; Placa
        <input style={{ width: 150 }} value={placaVehiculo} onChange={(e) => setPlacaVehiculo(e.target.value)} />
        &nbsp; Aduana salida
        <select value={aduanaSalida} onChange={(e) => setAduanaSalida(e.target.value)}>
          {aduanas.length === 0 && <option value="">-- Sin aduanas --</option>}
          {aduanas.map((a) => (
            <option key={a.id} value={a.codigo || a.id}>
              {a.nombre} ({a.codigo})
            </option>
          ))}
        </select>
        &nbsp; Aduana entrada
        <select value={aduanaEntrada} onChange={(e) => setAduanaEntrada(e.target.value)}>
          {aduanas.length === 0 && <option value="">-- Sin aduanas --</option>}
          {aduanas.map((a) => (
            <option key={a.id} value={a.codigo || a.id}>
              {a.nombre} ({a.codigo})
            </option>
          ))}
        </select>
        &nbsp; País destino
        <select value={paisDestino} onChange={(e) => setPaisDestino(e.target.value)}>
          {PAISES_CA.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </fieldset>

      {/* Mercancías */}
      <fieldset>
        <legend>Mercancías</legend>
        {items.map((it, idx) => (
          <div
            key={idx}
            style={{ display: 'grid', gridTemplateColumns: '90px 90px 1fr 180px 150px auto', gap: 6, marginBottom: 6 }}
          >
            <input placeholder="Cantidad" value={it.cantidad} onChange={(e) => updItem(idx, 'cantidad', e.target.value)} />
            <input placeholder="País de origen" value={it.paisOrigen} onChange={(e) => updItem(idx, 'paisOrigen', e.target.value)} />
            <input placeholder="Descripción" value={it.descripcion} onChange={(e) => updItem(idx, 'descripcion', e.target.value)} />
            <select value={it.unidadMedida} onChange={(e) => updItem(idx, 'unidadMedida', e.target.value)}>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input placeholder="Valor unitario" value={it.valorUnitario} onChange={(e) => updItem(idx, 'valorUnitario', e.target.value)} />
            <button type="button" onClick={() => delItem(idx)}>Eliminar</button>
          </div>
        ))}
        <button type="button" onClick={addItem}>Agregar ítem</button>
      </fieldset>

      {/* Valores */}
      <fieldset>
        <legend>Valores</legend>
        Valor factura
        <input value={valorFactura} onChange={(e) => setValorFactura(e.target.value)} />
        &nbsp; Valor aduana total
        <input value={valorAduanaTotal} onChange={(e) => setValorAduanaTotal(e.target.value)} />
        &nbsp; Moneda
        <select value={moneda} onChange={onChangeMoneda}>
          <option>GTQ</option>
          <option>USD</option>
        </select>
        <div style={{ fontSize: 12, color: '#666' }}>Mostrando importes en {moneda}.</div>
      </fieldset>

      <button onClick={enviar}>Enviar declaración</button>
      {msg && <div style={{ color: 'crimson' }}>{msg}</div>}
    </div>
  );
}
