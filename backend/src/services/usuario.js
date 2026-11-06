// Servicio de Usuario - Perfil, preferencias y configuración personal
const { now } = require('../clock');

/**
 * Obtener perfil completo del usuario actual
 */
function getPerfil(db, userId) {
  const user = db.prepare(`
    SELECT
      id_usuario,
      google_id,
      nombre,
      correo,
      rol,
      saldo_tokens,
      racha_dias,
      ultima_entrega_ok,
      preferencias_notificaciones,
      avatar_url,
      created_at
    FROM usuario
    WHERE id_usuario = ?
  `).get(userId);

  if (!user) return null;

  // Parsear preferencias JSON
  try {
    user.preferencias_notificaciones = JSON.parse(user.preferencias_notificaciones || '{}');
  } catch {
    user.preferencias_notificaciones = {
      push: true,
      correo: false,
      recordatorio_24h: true,
      recordatorio_1h: true
    };
  }

  // Verificar si tiene Google conectado
  const cred = db.prepare('SELECT 1 FROM credencial_google WHERE id_usuario = ?').get(userId);
  user.googleConectado = !!cred;

  return user;
}

/**
 * Actualizar datos básicos del perfil (nombre)
 */
function actualizarPerfil(db, userId, { nombre }) {
  if (!nombre || !nombre.trim()) {
    throw Object.assign(new Error('El nombre es obligatorio'), { status: 400 });
  }

  db.prepare('UPDATE usuario SET nombre = ? WHERE id_usuario = ?').run(nombre.trim(), userId);

  return getPerfil(db, userId);
}

/**
 * Obtener preferencias de notificaciones
 */
function getPreferencias(db, userId) {
  const user = db.prepare('SELECT preferencias_notificaciones FROM usuario WHERE id_usuario = ?').get(userId);
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

  try {
    return JSON.parse(user.preferencias_notificaciones || '{}');
  } catch {
    return {
      push: true,
      correo: false,
      recordatorio_24h: true,
      recordatorio_1h: true
    };
  }
}

/**
 * Actualizar preferencias de notificaciones
 */
function actualizarPreferencias(db, userId, preferencias) {
  const permitidas = ['push', 'correo', 'recordatorio_24h', 'recordatorio_1h'];
  const actual = getPreferencias(db, userId);
  const nuevas = { ...actual };

  for (const key of permitidas) {
    if (preferencias[key] !== undefined) {
      nuevas[key] = Boolean(preferencias[key]);
    }
  }

  db.prepare('UPDATE usuario SET preferencias_notificaciones = ? WHERE id_usuario = ?')
    .run(JSON.stringify(nuevas), userId);

  return nuevas;
}

/**
 * Desconectar Google (ya existe en oauth.js, esto es wrapper)
 */
function desconectarGoogle(db, userId) {
  const { desconectar } = require('./oauth');
  return desconectar(db, userId);
}

/**
 * Eliminar cuenta de usuario (admin o el propio usuario)
 * Nota: Las FK con CASCADE limpian cursos, tareas, tokens, etc.
 */
function eliminarCuenta(db, userId) {
  // Verificar que no sea el último admin
  const admins = db.prepare('SELECT COUNT(*) as n FROM usuario WHERE rol = "admin"').get().n;
  const user = db.prepare('SELECT rol FROM usuario WHERE id_usuario = ?').get(userId);

  if (user?.rol === 'admin' && admins <= 1) {
    throw Object.assign(new Error('No se puede eliminar el único administrador'), { status: 400 });
  }

  db.prepare('DELETE FROM usuario WHERE id_usuario = ?').run(userId);
  return { ok: true };
}

module.exports = {
  getPerfil,
  actualizarPerfil,
  getPreferencias,
  actualizarPreferencias,
  desconectarGoogle,
  eliminarCuenta
};