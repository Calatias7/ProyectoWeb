import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

function useAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function UsersAdmin() {
  const headers = useAuthHeader();

  const [form, setForm] = useState({
    nombre: '', email: '', role: 'IMPORTADOR', activo: true, password: ''
  });
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setMsg('');
    try {
      const { data } = await axios.get(`${API_BASE}/api/users`, { headers, params: { q: q || undefined } });
      setUsers(data);
    } catch (e) { setMsg(e.response?.data?.error || 'Error al listar'); }
  }

  async function createUser(e) {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/users`, form, { headers });
      setForm({ nombre: '', email: '', role: 'IMPORTADOR', activo: true, password: '' });
      await load();
      alert('Usuario creado');
    } catch (e) { alert(e.response?.data?.error || 'Error al crear'); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar usuario?')) return;
    try { await axios.delete(`${API_BASE}/api/users/${id}`, { headers }); await load(); }
    catch (e) { alert(e.response?.data?.error || 'Error al eliminar'); }
  }

  async function toggleActivo(u) {
    try {
      const { data } = await axios.put(`${API_BASE}/api/users/${u.id}/activo`, { activo: !u.activo }, { headers });
      setUsers(prev => prev.map(x => x.id === u.id ? data : x));
    } catch (e) { alert(e.response?.data?.error || 'Error al cambiar estado'); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h2>Gestión de Usuarios</h2>

      <form onSubmit={createUser} style={{ display:'grid', gap:6, maxWidth:520 }}>
        <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} />
        <input placeholder="Correo" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
          <option value="IMPORTADOR">IMPORTADOR</option>
          <option value="TRANSPORTISTA">TRANSPORTISTA</option>
          <option value="AGENTE_ADUANERO">AGENTE_ADUANERO</option>
          <option value="ADMINISTRADOR">ADMINISTRADOR</option>
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={form.activo} onChange={e=>setForm({...form, activo:e.target.checked})} />
          Activo
        </label>
        <input placeholder="Contraseña (opcional)" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <button type="submit">Nuevo usuario</button>
      </form>

      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={load}>Buscar</button>
      </div>

      <table border="1" cellPadding="6" style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead>
          <tr>
            <th style={{ width:60 }}>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th style={{ width:180 }}>Rol</th>
            <th style={{ width:90 }}>Activo</th>
            <th style={{ width:220 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre || '-'}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.activo ? 'Sí' : 'No'}</td>
              <td style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={() => toggleActivo(u)}>{u.activo ? 'Desactivar' : 'Activar'}</button>
                <button type="button" onClick={() => eliminar(u.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {msg && <div style={{ color:'crimson' }}>{msg}</div>}
    </div>
  );
}
