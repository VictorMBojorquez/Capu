-- CAPU · Esquema de base de datos (SQLite en desarrollo)
-- Corresponde al modelo entidad-relación del Plan de Calidad (Etapa I), sección 15.4.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario    INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id     TEXT UNIQUE,
  nombre        TEXT NOT NULL,
  correo        TEXT NOT NULL,
  saldo_tokens  INTEGER NOT NULL DEFAULT 0 CHECK (saldo_tokens >= 0),
  racha_dias    INTEGER NOT NULL DEFAULT 0,
  ultima_entrega_ok TEXT            -- fecha (YYYY-MM-DD) de la última entrega a tiempo
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
  classroom_id  TEXT NOT NULL,
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
