require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const ducaRoutes = require('./routes/duca');
const consultaRoutes = require('./routes/consulta');
const validacionRoutes = require('./routes/validacion');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());

app.get('/health', (_,res)=>res.send('OK'));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/duca', ducaRoutes);
app.use('/api/consulta', consultaRoutes);
app.use('/api/validacion', validacionRoutes);

// 404
app.use((req,res)=>res.status(404).json({ error:'Ruta no encontrada' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Backend SIGLAD escuchando en puerto ${PORT}`));
