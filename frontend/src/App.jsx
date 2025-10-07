import { useState } from 'react';
import Login from './Login';
import Panel from './Panel';
import UsersAdmin from './UsersAdmin';
import DucaRecepcion from './DucaRecepcion';
import ConsultaEstados from './ConsultaEstados';
import ValidacionAgente from './ValidacionAgente';

export default function App(){
  const [role, setRole] = useState(localStorage.getItem('role'));
  if (!role) return <Login onAuth={setRole} />;

  return (
    <div style={{ padding: 16, display:'grid', gap:12 }}>
      <h1>SIGLAD</h1>
      <Panel role={role} />

      {role === 'ADMINISTRADOR' && <UsersAdmin />}
      {role === 'TRANSPORTISTA' && <DucaRecepcion />}
      {role === 'TRANSPORTISTA' && <ConsultaEstados />}
      {role === 'AGENTE_ADUANERO' && <ValidacionAgente />}

      <button onClick={()=>{ localStorage.clear(); location.reload(); }}>Cerrar sesión</button>
    </div>
  );
}
