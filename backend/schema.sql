-- ==========================================
-- BASE DE DATOS SIGLAD (PostgreSQL)
-- ==========================================

-- Elimina si existe (solo para desarrollo)
DROP TABLE IF EXISTS bitacora_duca CASCADE;
DROP TABLE IF EXISTS bitacora_usuarios CASCADE;
DROP TABLE IF EXISTS declaraciones CASCADE;
DROP TABLE IF EXISTS aduanas CASCADE;
DROP TABLE IF EXISTS paises CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- 1️⃣ USUARIOS
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMINISTRADOR','TRANSPORTISTA','AGENTE_ADUANERO','IMPORTADOR')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Usuarios del sistema SIGLAD (importadores, agentes, transportistas, admin).';

-- ==========================================
-- 2️⃣ DECLARACIONES (DUCA)
-- ==========================================
CREATE TABLE IF NOT EXISTS declaraciones (
  id SERIAL PRIMARY KEY,
  numero_documento TEXT UNIQUE NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE','VALIDADA','RECHAZADA')),
  duca_json JSONB NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  motivo_rechazo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMP
);

COMMENT ON COLUMN declaraciones.duca_json IS 'Contenido completo de la DUCA en formato JSONB';
COMMENT ON COLUMN declaraciones.motivo_rechazo IS 'Motivo del rechazo si aplica';

CREATE INDEX IF NOT EXISTS idx_declaraciones_user_id ON declaraciones(user_id);
CREATE INDEX IF NOT EXISTS idx_declaraciones_estado ON declaraciones(estado);
CREATE INDEX IF NOT EXISTS idx_declaraciones_numero ON declaraciones(numero_documento);

-- ==========================================
-- 3️⃣ BITÁCORAS
-- ==========================================
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

COMMENT ON TABLE bitacora_duca IS 'Registra acciones sobre las declaraciones DUCA';
COMMENT ON TABLE bitacora_usuarios IS 'Registra accesos y operaciones de los usuarios';

-- ==========================================
-- 4️⃣ CATÁLOGOS
-- ==========================================
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

-- ==========================================
-- 5️⃣ DATOS INICIALES
-- ==========================================

-- Aduanas base
INSERT INTO aduanas (codigo, nombre) VALUES
  ('GUA-001', 'Aduana Central de Guatemala'),
  ('HND-001', 'Aduana El Amatillo (Honduras)'),
  ('SLV-001', 'Aduana San Cristóbal (El Salvador)'),
  ('CRI-001', 'Aduana Peñas Blancas (Costa Rica)')
ON CONFLICT DO NOTHING;

-- Países base
INSERT INTO paises (iso2, nombre) VALUES
  ('GT', 'Guatemala'),
  ('HN', 'Honduras'),
  ('SV', 'El Salvador'),
  ('CR', 'Costa Rica'),
  ('NI', 'Nicaragua'),
  ('PA', 'Panamá')
ON CONFLICT DO NOTHING;

-- Usuarios de prueba
-- Contraseñas deben generarse desde Node con bcrypt.hash('clave', 10)
INSERT INTO users (nombre, email, password_hash, role) VALUES
  ('Admin Principal', 'admin@siglad.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'ADMINISTRADOR'),
  ('Transportista 1', 'trans1@siglad.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'TRANSPORTISTA'),
  ('Agente Aduanero 1', 'agente1@siglad.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'AGENTE_ADUANERO'),
  ('Importador 1', 'import1@siglad.com', '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'IMPORTADOR')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 6️⃣ VISTAS ÚTILES
-- ==========================================

-- Vista simple para facilitar consultas de auditoría
CREATE OR REPLACE VIEW v_declaraciones_detalle AS
SELECT
  d.id,
  d.numero_documento,
  d.estado,
  u.nombre AS usuario,
  u.role AS rol,
  d.created_at,
  d.validated_at,
  d.motivo_rechazo,
  d.duca_json
FROM declaraciones d
JOIN users u ON u.id = d.user_id;

-- ==========================================
-- 7️⃣ TRIGGER DE BITÁCORA
-- ==========================================

CREATE OR REPLACE FUNCTION log_bitacora_duca()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO bitacora_duca (numero_documento, usuario, accion, detalle)
  VALUES (
    NEW.numero_documento,
    (SELECT email FROM users WHERE id = NEW.user_id),
    TG_OP,
    CONCAT('Cambio en estado: ', COALESCE(OLD.estado, 'N/A'), ' → ', NEW.estado)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bitacora_duca ON declaraciones;

CREATE TRIGGER trg_bitacora_duca
AFTER INSERT OR UPDATE ON declaraciones
FOR EACH ROW
EXECUTE FUNCTION log_bitacora_duca();

-- ==========================================
-- 8️⃣ CONSULTA DE PRUEBA
-- ==========================================
-- SELECT * FROM v_declaraciones_detalle;
-- SELECT * FROM bitacora_duca ORDER BY fecha_registro DESC;
-- SELECT numero_documento, estado, motivo_rechazo FROM declaraciones;