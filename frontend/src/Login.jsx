import { useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('admin@siglad.test');
  const [password, setPassword] = useState('Admin123');
  const [msg, setMsg] = useState('');

  async function submit(e){
    e.preventDefault();
    setMsg('');
    try{
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      onAuth(data.role);
    }catch(e){
      setMsg(e.response?.data?.error || 'Error');
    }
  }

  return (
    <form onSubmit={submit} style={{ display:'grid', gap:8, width:320, margin:'5rem auto' }}>
      <h2>Ingresar</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button>Entrar</button>
      {msg && <div style={{ color:'crimson' }}>{msg}</div>}
    </form>
  );
}
