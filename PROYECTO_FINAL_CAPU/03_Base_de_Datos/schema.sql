-- CAPU · Esquema de base de datos (SQLite en desarrollo)
-- Corresponde al modelo entidad-relación del Plan de Calidad (Etapa I), sección 15.4.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario    INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id     TEXT UNIQUE,
  nombre        TEXT NOT NULL,
  correo        TEXT NOT NULL,
  password_hash TEXT,
  email_verificado INTEGER NOT NULL DEFAULT 0,
  email_verification_token TEXT,
  email_verification_expires TEXT,
  password_reset_token TEXT,
  password_reset_expires TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'google' CHECK (auth_provider IN ('google', 'email', 'both')),
  rol           TEXT NOT NULL DEFAULT 'estudiante' CHECK (rol IN ('estudiante','admin')),
  saldo_tokens  INTEGER NOT NULL DEFAULT 0 CHECK (saldo_tokens >= 0),
  racha_dias    INTEGER NOT NULL DEFAULT 0,
  ultima_entrega_ok TEXT,            -- fecha (YYYY-MM-DD) de la última entrega a tiempo
  preferencias_notificaciones TEXT DEFAULT '{"push":true,"correo":false,"recordatorio_24h":true,"recordatorio_1h":true}',
  avatar_url    TEXT,
  created_at    TEXT DEFAULT '2024-01-01 00:00:00',
  onboarding_completado INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_email ON usuario(correo);

-- Credencial OAuth 2.0 de Google (RF-01). Una fila por usuario; renovable con refresh_token.
CREATE TABLE IF NOT EXISTS credencial_google (
  id_usuario    INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expira        TEXT NOT NULL,      -- fecha ISO 8601 en que vence el access_token
  actualizado   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS curso (
  id_curso      INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario    INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  classroom_id  TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  UNIQUE (id_usuario, classroom_id)
);

CREATE TABLE IF NOT EXISTS tarea (
  id_tarea      INTEGER PRIMARY KEY AUTOINCREMENT,
  id_curso      INTEGER NOT NULL REFERENCES curso(id_curso) ON DELETE CASCADE,
  classroom_id  TEXT,               -- nullable para tareas personalizadas
  source        TEXT NOT NULL DEFAULT 'classroom' CHECK (source IN ('classroom', 'custom')),
  titulo        TEXT NOT NULL,
  descripcion   TEXT,
  fecha_limite  TEXT NOT NULL,      -- ISO 8601 (UTC)
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','en_progreso','entregada')),
  avance_pct    INTEGER NOT NULL DEFAULT 0 CHECK (avance_pct BETWEEN 0 AND 100),
  fecha_entrega TEXT,
  enlace        TEXT,               -- enlace directo a la tarea en Google Classroom (RF-10)
  UNIQUE (id_curso, classroom_id)
);

CREATE INDEX IF NOT EXISTS idx_tarea_source ON tarea(source);

CREATE TABLE IF NOT EXISTS recordatorio (
  id_recordatorio INTEGER PRIMARY KEY AUTOINCREMENT,
  id_tarea      INTEGER NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
  fecha_hora    TEXT NOT NULL,
  canal         TEXT NOT NULL DEFAULT 'push' CHECK (canal IN ('push','correo')),
  enviado       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (id_tarea, fecha_hora, canal)
);

CREATE TABLE IF NOT EXISTS transaccion_token (
  id_transaccion INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario    INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_tarea      INTEGER REFERENCES tarea(id_tarea) ON DELETE SET NULL,
  cantidad      INTEGER NOT NULL,   -- positiva = ganancia, negativa = canje
  motivo        TEXT NOT NULL,
  fecha         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recompensa (
  id_recompensa INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  costo_tokens  INTEGER NOT NULL CHECK (costo_tokens > 0),
  activa        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS canje (
  id_canje      INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario    INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_recompensa INTEGER NOT NULL REFERENCES recompensa(id_recompensa),
  fecha         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tarea_fecha ON tarea(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_recordatorio_pend ON recordatorio(enviado, fecha_hora);

-- Notificaciones (Centro de Notificaciones - Fase 4)
CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario    INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('entrega', 'recordatorio', 'vencida', 'sistema', 'recompensa')),
  titulo        TEXT NOT NULL,
  mensaje       TEXT,
  leida         INTEGER NOT NULL DEFAULT 0,
  datos_json    TEXT,              -- datos adicionales en JSON (ej: id_tarea, id_recompensa)
  fecha         TEXT NOT NULL      -- ISO 8601
);

CREATE INDEX IF NOT EXISTS idx_notificacion_usuario_fecha ON notificacion(id_usuario, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_notificacion_usuario_leida ON notificacion(id_usuario, leida);

-- Auditoría/Logs (Fase 6)
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria    INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario      INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  accion          TEXT NOT NULL,
  entidad         TEXT,
  entidad_id      INTEGER,
  datos_anteriores TEXT,  -- JSON
  datos_nuevos    TEXT,    -- JSON
  ip              TEXT,
  user_agent      TEXT,
  fecha           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_fecha ON auditoria(id_usuario, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion_fecha ON auditoria(accion, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria(entidad, entidad_id);
