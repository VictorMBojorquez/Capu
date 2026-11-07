const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { now } = require('../clock');
const { generateToken } = require('./jwt');
const { FRONTEND_URL, BCRYPT_ROUNDS, APP_URL } = require('../config/env');
const { enviarVerificacionEmail, enviarResetPassword, enviarBienvenida } = require('./email');

/** Registrar nuevo usuario con email/password */
async function registrarUsuario(db, { nombre, correo, password }) {
  // Validaciones
  if (!nombre?.trim()) throw Object.assign(new Error('El nombre es obligatorio'), { status: 400 });
  if (!correo?.trim()) throw Object.assign(new Error('El email es obligatorio'), { status: 400 });
  if (!password || password.length < 8) throw Object.assign(new Error('La contraseña debe tener al menos 8 caracteres'), { status: 400 });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) throw Object.assign(new Error('Email inválido'), { status: 400 });

  // Verificar si ya existe
  const existente = db.prepare('SELECT id_usuario, auth_provider FROM usuario WHERE correo = ?').get(correo.toLowerCase());
  if (existente) {
    // Si existe con Google, permitir vincular
    if (existente.auth_provider === 'google') {
      throw Object.assign(new Error('Este email ya está registrado con Google. Inicia sesión con Google o usa "Olvidé mi contraseña".'), { status: 409 });
    }
    throw Object.assign(new Error('Este email ya está registrado'), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const verificationToken = uuidv4();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

  const info = db.prepare(`
    INSERT INTO usuario (nombre, correo, password_hash, email_verificado, email_verification_token, email_verification_expires, auth_provider, rol, saldo_tokens, racha_dias, preferencias_notificaciones, created_at)
    VALUES (?, ?, ?, 0, ?, ?, 'email', 'estudiante', 0, 0, '{"push":true,"correo":false,"recordatorio_24h":true,"recordatorio_1h":true}', ?)
  `).run(nombre.trim(), correo.toLowerCase(), passwordHash, verificationToken, verificationExpires, now().toISOString());

  const userId = info.lastInsertRowid;

  // Enviar email de verificación (Fase 12)
  try {
    await enviarVerificacionEmail(correo.toLowerCase(), nombre.trim(), verificationToken);
  } catch (emailError) {
    console.error('[Auth] Error sending verification email:', emailError);
    // No fallar el registro si falla el email
  }

  // Enviar email de bienvenida (Fase 12)
  try {
    await enviarBienvenida(correo.toLowerCase(), nombre.trim());
  } catch (emailError) {
    console.error('[Auth] Error sending welcome email:', emailError);
    // No fallar el registro si falla el email
  }

  const token = generateToken({ sub: userId, correo, rol: 'estudiante' });

  return {
    usuario: { id_usuario: userId, nombre, correo, rol: 'estudiante', email_verificado: 0 },
    token,
    mensaje: 'Registro exitoso. Revisa tu email para verificar tu cuenta.'
  };
}

/** Login con email/password */
async function loginEmailPassword(db, { correo, password }) {
  if (!correo?.trim() || !password) {
    throw Object.assign(new Error('Email y contraseña son obligatorios'), { status: 400 });
  }

  const user = db.prepare('SELECT * FROM usuario WHERE correo = ?').get(correo.toLowerCase());
  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  // Verificar que tiene auth_provider email o both
  if (user.auth_provider === 'google') {
    throw Object.assign(new Error('Esta cuenta usa Google. Inicia sesión con Google.'), { status: 401 });
  }

  if (!user.password_hash) {
    throw Object.assign(new Error('Esta cuenta no tiene contraseña configurada'), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const token = generateToken({ sub: user.id_usuario, correo: user.correo, rol: user.rol });

  return {
    usuario: { id_usuario: user.id_usuario, nombre: user.nombre, correo: user.correo, rol: user.rol, email_verificado: user.email_verificado },
    token
  };
}

/** Verificar email con token */
async function verificarEmail(db, token) {
  if (!token) throw Object.assign(new Error('Token requerido'), { status: 400 });

  const user = db.prepare('SELECT id_usuario FROM usuario WHERE email_verification_token = ? AND email_verification_expires > ?').get(token, now().toISOString());
  if (!user) throw Object.assign(new Error('Token inválido o expirado'), { status: 400 });

  db.prepare('UPDATE usuario SET email_verificado = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id_usuario = ?').run(user.id_usuario);

  return { ok: true, mensaje: 'Email verificado correctamente' };
}

/** Solicitar reset de contraseña */
async function solicitarResetPassword(db, correo) {
  if (!correo?.trim()) throw Object.assign(new Error('Email requerido'), { status: 400 });

  const user = db.prepare('SELECT id_usuario, nombre FROM usuario WHERE correo = ? AND auth_provider IN (\'email\', \'both\')').get(correo.toLowerCase());

  // Siempre respondemos OK por seguridad (no revelar si existe el email)
  if (!user) return { ok: true, mensaje: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' };

  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h

  db.prepare('UPDATE usuario SET password_reset_token = ?, password_reset_expires = ? WHERE id_usuario = ?').run(resetToken, resetExpires, user.id_usuario);

  // Enviar email de reset (Fase 12)
  try {
    await enviarResetPassword(correo.toLowerCase(), user.nombre, resetToken);
  } catch (emailError) {
    console.error('[Auth] Error sending reset email:', emailError);
    // No fallar si falla el email
  }

  return { ok: true, mensaje: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' };
}

/** Resetear contraseña con token */
async function resetPassword(db, { token, password }) {
  if (!token || !password) throw Object.assign(new Error('Token y nueva contraseña requeridos'), { status: 400 });
  if (password.length < 8) throw Object.assign(new Error('La contraseña debe tener al menos 8 caracteres'), { status: 400 });

  const user = db.prepare('SELECT id_usuario FROM usuario WHERE password_reset_token = ? AND password_reset_expires > ?').get(token, now().toISOString());
  if (!user) throw Object.assign(new Error('Token inválido o expirado'), { status: 400 });

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  db.prepare('UPDATE usuario SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id_usuario = ?').run(passwordHash, user.id_usuario);

  return { ok: true, mensaje: 'Contraseña restablecida correctamente' };
}

/** Cambiar contraseña (usuario logueado) */
async function cambiarPassword(db, userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) throw Object.assign(new Error('Contraseña actual y nueva son requeridas'), { status: 400 });
  if (newPassword.length < 8) throw Object.assign(new Error('La nueva contraseña debe tener al menos 8 caracteres'), { status: 400 });

  const user = db.prepare('SELECT password_hash FROM usuario WHERE id_usuario = ?').get(userId);
  if (!user || !user.password_hash) throw Object.assign(new Error('No tienes contraseña configurada (usas Google)'), { status: 400 });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw Object.assign(new Error('Contraseña actual incorrecta'), { status: 401 });

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  db.prepare('UPDATE usuario SET password_hash = ? WHERE id_usuario = ?').run(passwordHash, userId);

  return { ok: true, mensaje: 'Contraseña cambiada correctamente' };
}

/** Vincular cuenta Google a usuario email existente */
async function vincularGoogle(db, userId, googleId) {
  const user = db.prepare('SELECT auth_provider FROM usuario WHERE id_usuario = ?').get(userId);
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

  if (user.auth_provider === 'google') throw Object.assign(new Error('Ya está vinculado a Google'), { status: 400 });

  const newProvider = user.auth_provider === 'email' ? 'both' : 'google';
  db.prepare('UPDATE usuario SET google_id = ?, auth_provider = ? WHERE id_usuario = ?').run(googleId, newProvider, userId);

  return { ok: true, auth_provider: newProvider };
}

module.exports = {
  registrarUsuario,
  loginEmailPassword,
  verificarEmail,
  solicitarResetPassword,
  resetPassword,
  cambiarPassword,
  vincularGoogle
};