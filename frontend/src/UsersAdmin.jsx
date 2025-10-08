import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

function useAuthHeader() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

const ROLES = ['IMPORTADOR', 'TRANSPORTISTA', 'AGENTE_ADUANERO', 'ADMINISTRADOR'];

export default function UsersAdmin() {
  const headers = useAuthHeader();

  // Form de alta
  const [form, setForm] = useState({
    nombre: '', email: '', role: 'IMPORTADOR', activo: true, password: ''
  });

  // Listado / búsqueda
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  // Edición en línea
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    nombre: '', email: '', role: 'IMPORTADOR', password: ''
  });
  const [showPwd, setShowPwd] = useState(false);

  async function load() {
    setMsg('');
    try {
      const { data } = await axios.get(`${API_BASE}/api/users`, {
        headers,
        params: { q: q || undefined }
      });
      setUsers(data);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error al listar');
    }
  }

  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/users`, form, { headers });
      setForm({ nombre: '', email: '', role: 'IMPORTADOR', activo: true, password: '' });
      await load();
      alert('Usuario creado');
    } catch (e) {
      alert(e.response?.data?.error || 'Error al crear');
    }
  }

  async function toggleActivo(u) {
    try {
      const { data } = await axios.put(`${API_BASE}/api/users/${u.id}/activo`, { activo: !u.activo }, { headers });
      setUsers(prev => prev.map(x => x.id === u.id ? data : x));
    } catch (e) {
      alert(e.response?.data?.error || 'Error al cambiar estado');
    }
  }

  function startEdit(u) {
    setEditId(u.id);
    setEditData({
      nombre: u.nombre || '',
      email: u.email || '',
      role: u.role || 'IMPORTADOR',
      password: '' // nueva contraseña (opcional)
    });
    setShowPwd(false);
  }

  function cancelEdit() {
    setEditId(null);
    setEditData({ nombre: '', email: '', role: 'IMPORTADOR', password: '' });
    setShowPwd(false);
  }

  async function saveEdit() {
    try {
      // Tomamos el estado actual del usuario para NO forzar activo=true al editar
      const current = users.find(x => x.id === editId);
      const payload = {
        nombre: editData.nombre,
        email: editData.email,
        role: editData.role,
        activo: current?.activo ?? true
      };
      if (editData.password && editData.password.trim()) {
        payload.password = editData.password.trim(); // opcional
      }

      const { data } = await axios.put(`${API_BASE}/api/users/${editId}`, payload, { headers });
      setUsers(prev => prev.map(x => x.id === editId ? data : x));
      cancelEdit();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al actualizar');
    }
  }

  return (
    <div style={{ display:'grid', gap:16 }}>
      <h2>Gestión de Usuarios</h2>

      {/* Alta */}
      <form onSubmit={createUser} style={{ display:'grid', gap:6, maxWidth:520 }}>
        <input placeholder="Nombre" value={form.nombre}
               onChange={e=>setForm({...form, nombre:e.target.value})} />
        <input placeholder="Correo" value={form.email}
               onChange={e=>setForm({...form, email:e.target.value})} />
        <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={form.activo}
                 onChange={e=>setForm({...form, activo:e.target.checked})} />
          Activo
        </label>
        <input type="password" placeholder="Contraseña (opcional)"
               value={form.password}
               onChange={e=>setForm({...form, password:e.target.value})} />
        <button type="submit">Nuevo usuario</button>
      </form>

      {/* Filtro */}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={load}>Buscar</button>
      </div>

      {/* Tabla */}
      <table border="1" cellPadding="6" style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead style={{ background:'#eee' }}>
          <tr>
            <th style={{ width:60 }}>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th style={{ width:200 }}>Rol</th>
            <th style={{ width:100 }}>Estado</th>
            <th style={{ width:360 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const editing = u.id === editId;
            return (
              <tr key={u.id}>
                <td>{u.id}</td>

                <td>
                  {editing ? (
                    <input value={editData.nombre}
                           onChange={e=>setEditData({...editData, nombre:e.target.value})}
                           style={{ width:'100%' }} />
                  ) : (u.nombre || '-')}
                </td>

                <td>
                  {editing ? (
                    <input value={editData.email}
                           onChange={e=>setEditData({...editData, email:e.target.value})}
                           style={{ width:'100%' }} />
                  ) : u.email}
                </td>

                <td>
                  {editing ? (
                    <select value={editData.role}
                            onChange={e=>setEditData({...editData, role:e.target.value})}
                            style={{ width:'100%' }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : u.role}
                </td>

                <td style={{ color: u.activo ? 'green' : 'red', fontWeight:'bold' }}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </td>

                <td>
                  {!editing ? (
                    <div style={{ display:'flex', gap:8 }}>
                      <button type="button" onClick={() => startEdit(u)}>Editar</button>
                      <button type="button" onClick={() => toggleActivo(u)}>
                        {u.activo ? 'Inactivar' : 'Activar'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gap:6 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <button type="button" onClick={saveEdit}>Guardar</button>
                        <button type="button" onClick={cancelEdit}>Cancelar</button>
                        <button type="button" onClick={() => toggleActivo(u)}>
                          {u.activo ? 'Inactivar' : 'Activar'}
                        </button>
                      </div>

                      {/* Nueva contraseña (opcional) */}
                      <div style={{ display:'grid', gap:4, maxWidth:360 }}>
                        <label style={{ fontSize:12, color:'#444' }}>Nueva contraseña (opcional)</label>
                        <div style={{ display:'flex', gap:6 }}>
                          <input
                            type={showPwd ? 'text' : 'password'}
                            placeholder="Dejar en blanco para no cambiar"
                            value={editData.password}
                            onChange={e=>setEditData({...editData, password:e.target.value})}
                            style={{ flex:1 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd(s => !s)}
                            title={showPwd ? 'Ocultar' : 'Mostrar'}
                          >
                            {showPwd ? 'Ocultar' : 'Mostrar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {msg && <div style={{ color:'crimson' }}>{msg}</div>}
    </div>
  );
}
