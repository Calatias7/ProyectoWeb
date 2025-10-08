# 🚛 SIGLAD — Sistema Integrado de Gestión Logística Aduanera y Declaraciones

**SIGLAD** es una plataforma web diseñada para la gestión completa de declaraciones aduaneras electrónicas (DUCA), validación de agentes aduaneros y control de usuarios con distintos roles administrativos.  
Permite el registro, envío, consulta y validación de documentos de transporte dentro de la región centroamericana.

---

## 📂 Estructura del proyecto

```
siglad/
├── backend/              # API Node.js + Express + PostgreSQL
│   ├── routes/           # Rutas: auth, users, duca, consulta, validación
│   ├── middleware/       # Autenticación y control de roles
│   ├── scripts/          # Scripts utilitarios (seed admin)
│   ├── db.js             # Conexión a PostgreSQL
│   ├── server.js         # Servidor principal Express
│   ├── package.json
│   ├── .env.example      # Variables de entorno base
│   └── .gitignore
│
├── frontend/             # Interfaz React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   ├── Panel.jsx
│   │   ├── UsersAdmin.jsx
│   │   ├── DucaRecepcion.jsx
│   │   ├── ConsultaEstados.jsx
│   │   └── ValidacionAgente.jsx
│   ├── package.json
│   └── vite.config.js
│
└── database/
    └── schema.sql        # Estructura de base de datos PostgreSQL
```

---

## 🧠 Funcionalidades principales

| Rol | Permisos | Descripción |
|-----|-----------|--------------|
| **Administrador** | 👥 CRUD de usuarios, control de roles y estados | Gestiona usuarios activos/inactivos y crea cuentas nuevas |
| **Transportista** | 🚚 Registro y envío de DUCA | Crea declaraciones con datos de transporte, mercancías, valores y monedas |
| **Agente Aduanero** | 🧾 Validación | Consulta declaraciones pendientes y puede **Aprobar** o **Rechazar** (con motivo obligatorio) |
| **Importador** | 🔎 Consulta | Visualiza el estado y detalles de sus declaraciones aduaneras |

---

## 🏗️ Arquitectura

- **Backend:** Node.js + Express  
- **Base de datos:** PostgreSQL  
- **Frontend:** React + Vite  
- **Autenticación:** JWT + bcryptjs  
- **Despliegue:** Render (backend + frontend)  
- **ORM:** consultas SQL puras mediante `pg.Pool`  

---

## ⚙️ Instalación local

### 🔸 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/siglad-proyecto.git
cd siglad-proyecto
```

### 🔸 2. Configurar el backend
```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus credenciales PostgreSQL:

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
JWT_SECRET=clave-super-secreta
PORT=3000
```

Instalar dependencias:
```bash
npm install
```

Ejecutar el script de administrador:
```bash
npm run seed:admin
```

Ejecutar el servidor:
```bash
npm run dev
```

---

### 🔸 3. Configurar el frontend

Abrir nueva terminal:
```bash
cd ../frontend
npm install
npm run dev
```

Abrir en el navegador:  
👉 [http://localhost:5173](http://localhost:5173)

---

## 🧩 Roles predefinidos

| Rol | Usuario | Contraseña |
|------|-----------|-------------|
| **Administrador** | `admin@siglad.test` | `Admin123` |

*(Puedes crear otros usuarios desde el panel de administrador.)*

---

## 🗃️ Base de datos

Ubicación: `database/schema.sql`  
Contiene las tablas:
- `users`
- `declaraciones`
- `bitacora_usuarios`
- `bitacora_duca`
- `aduanas`
- `paises`

Ejecutar en PostgreSQL:

```bash
psql "postgres://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require" -f database/schema.sql
```

---

## 🚀 Despliegue en Render

1. Conectar este repositorio a **Render**  
2. Crear un nuevo servicio web (Node.js)  
3. En variables de entorno, añadir:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Comando de inicio:
   ```
   npm run dev
   ```
5. Para el frontend, crear un **Static Site** con:
   ```
   npm run build
   ```
   Directorio de publicación: `/dist`

---

## 📈 Estado del proyecto

- ✅ Backend funcional con JWT y roles
- ✅ Frontend React modular
- ✅ Validación y bitácoras
- ✅ Soporte Render + PostgreSQL
- 🚧 Próximas mejoras: dashboard, reportes PDF y logs auditables

---

## 🤝 Créditos

Desarrollado por **Víctor**  
Proyecto académico y técnico guiado con **Clean Architecture + MVC**,  
con soporte a múltiples roles y despliegue en nube (Render).

---

## 🪶 Licencia

MIT © 2025 — Puedes usar, modificar y mejorar este sistema libremente.
