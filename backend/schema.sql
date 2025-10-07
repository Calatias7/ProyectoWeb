-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMINISTRADOR','TRANSPORTISTA','AGENTE_ADUANERO','IMPORTADOR')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Declaraciones (DUCA)
CREATE TABLE IF NOT EXISTS declaraciones (
  id SERIAL PRIMARY KEY,
  numero_documento TEXT UNIQUE NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE','VALIDADA','RECHAZADA')),
  duca_json JSONB NOT NULL,
  user_id INTEGER REFERENCES users(id),
  motivo_rechazo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_declaraciones_user_id ON declaraciones(user_id);
CREATE INDEX IF NOT EXISTS idx_declaraciones_estado ON declaraciones(estado);

-- Bitácoras
CREATE TABLE IF NOT EXISTS bitacora_usuarios (
  id SERIAL PRIMARY KEY,
  usuario TEXT,
  ip_origen TEXT,
  operacion TEXT,
  resultado TEXT,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bitacora_duca (
  id SERIAL PRIMARY KEY,
  numero_documento TEXT,
  usuario TEXT,
  accion TEXT,
  detalle TEXT,
  fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Catálogos (opcionales)
CREATE TABLE IF NOT EXISTS aduanas (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS paises (
  id SERIAL PRIMARY KEY,
  iso2 TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL
);

INSERT INTO paises (iso2,nombre) VALUES
  ('GT','Guatemala'),('SV','El Salvador'),('HN','Honduras'),
  ('NI','Nicaragua'),('CR','Costa Rica'),('PA','Panamá'),('BZ','Belice')
ON CONFLICT (iso2) DO NOTHING;