// Email Service - Phase 12
const nodemailer = require('nodemailer');

let transporter = null;
let emailConfig = null;

/**
 * Cargar configuración de email desde variables de entorno
 */
function cargarConfigEmail() {
  const env = require('../config/env');

  emailConfig = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    from: env.SMTP_FROM,
    appUrl: env.APP_URL
  };

  return emailConfig;
}

/**
 * Obtener o crear transporter de nodemailer
 */
function getTransporter() {
  if (!transporter) {
    if (!emailConfig) {
      cargarConfigEmail();
    }

    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('[Email] SMTP credentials not configured, emails will be logged only');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }
  return transporter;
}

/**
 * Enviar email genérico
 */
async function enviarEmail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const config = emailConfig || cargarConfigEmail();

  if (!transporter) {
    // Modo desarrollo: loguear en lugar de enviar
    console.log('[Email] Would send email:', { to, subject, html: html ? 'HTML content' : 'No HTML', text });
    return { success: true, preview: true, message: 'Email logged (no SMTP configured)' };
  }

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
      text
    });
    console.log('[Email] Sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error sending:', error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }
}

/**
 * Plantilla base para emails
 */
function baseTemplate({ title, content, actionUrl, actionText }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #C4571A 0%, #E87A2A 100%); padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; border-radius: 16px; background: white; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="22" fill="#C4571A"/>
          <path d="M25 45 Q40 70 50 62 L78 28" stroke="white" stroke-width="9" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${title}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      ${content}
    </div>

    <!-- Action Button -->
    ${actionUrl && actionText ? `
    <div style="padding: 0 30px 30px; text-align: center;">
      <a href="${actionUrl}" style="display: inline-block; background: #C4571A; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        ${actionText}
      </a>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px 30px; border-top: 1px solid #eee; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #888;">CAPU - Agenda Inteligente</p>
      <p style="margin: 0; font-size: 11px; color: #aaa;">Este email fue enviado automáticamente, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Email de bienvenida
 */
async function enviarBienvenida(email, nombre) {
  const config = emailConfig || cargarConfigEmail();
  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>¡Bienvenido a CAPU! Tu cuenta ha sido creada exitosamente.</p>
    <p>CAPU es tu agenda inteligente que te ayuda a organizar tus tareas, recibir recordatorios y ganar recompensas por tus entregas a tiempo.</p>
    <p>Para empezar:</p>
    <ul style="padding-left: 20px;">
      <li>Explora tu <strong>Agenda</strong> para ver tus tareas</li>
      <li>Usa el <strong>Calendario</strong> para visualizar tus entregas</li>
      <li>Revisa el <strong>Centro de Notificaciones</strong> para estar al día</li>
      <li>Gana <strong>Tokens</strong> por entregas a tiempo y cámbialos por recompensas</li>
    </ul>
    <p>Si tienes Google Classroom, puedes conectarlo desde tu perfil para sincronizar tus tareas automáticamente.</p>
  `;
  return enviarEmail({
    to: email,
    subject: '¡Bienvenido a CAPU! 🎓',
    html: baseTemplate({
      title: '¡Bienvenido a CAPU!',
      content,
      actionUrl: `${config.appUrl}/#agenda`,
      actionText: 'Ir a mi Agenda'
    })
  });
}

/**
 * Email de verificación
 */
async function enviarVerificacionEmail(email, nombre, token) {
  const config = emailConfig || cargarConfigEmail();
  const verificationUrl = `${config.appUrl}/#reset-password?token=${token}&type=verify`;
  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>Gracias por registrarte en CAPU. Para completar tu registro, por favor verifica tu dirección de correo electrónico.</p>
    <p>Haz clic en el botón de abajo para verificar tu cuenta:</p>
  `;
  return enviarEmail({
    to: email,
    subject: 'Verifica tu correo electrónico - CAPU',
    html: baseTemplate({
      title: 'Verifica tu correo',
      content,
      actionUrl: verificationUrl,
      actionText: 'Verificar mi cuenta'
    })
  });
}

/**
 * Email de restablecimiento de contraseña
 */
async function enviarResetPassword(email, nombre, token) {
  const config = emailConfig || cargarConfigEmail();
  const resetUrl = `${config.appUrl}/#reset-password?token=${token}`;
  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>Recibimos una solicitud para restablecer tu contraseña en CAPU.</p>
    <p>Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expira en 1 hora.</p>
    <p style="color: #888; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este email.</p>
  `;
  return enviarEmail({
    to: email,
    subject: 'Restablece tu contraseña - CAPU',
    html: baseTemplate({
      title: 'Restablecer contraseña',
      content,
      actionUrl: resetUrl,
      actionText: 'Restablecer contraseña'
    })
  });
}

/**
 * Email de recordatorio de tarea (24h y 1h)
 */
async function enviarRecordatorioTarea(email, nombre, tarea, horas) {
  const config = emailConfig || cargarConfigEmail();
  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>Tu tarea <strong>"${tarea.titulo}"</strong> vence en <strong>${horas} hora${horas > 1 ? 's' : ''}</strong>.</p>
    <p>Curso: ${tarea.curso}</p>
    <p>Fecha límite: ${new Date(tarea.fecha_limite).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
    <p>No olvides completarla a tiempo para ganar tus tokens.</p>
  `;
  return enviarEmail({
    to: email,
    subject: `⏰ Recordatorio: "${tarea.titulo}" vence en ${horas} hora${horas > 1 ? 's' : ''}`,
    html: baseTemplate({
      title: 'Recordatorio de entrega',
      content,
      actionUrl: `${config.appUrl}/#agenda`,
      actionText: 'Ver en Agenda'
    })
  });
}

/**
 * Email semanal de resumen
 */
async function enviarResumenSemanal(email, nombre, resumen) {
  const config = emailConfig || cargarConfigEmail();
  const content = `
    <p style="font-size: 16px;">Hola <strong>${nombre}</strong>,</p>
    <p>Aquí tienes tu resumen semanal de CAPU:</p>
    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 16px; color: #C4571A;">📊 Esta semana</h3>
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <div style="font-size: 28px; font-weight: 700; color: #C4571A;">${resumen.entregadas || 0}</div>
          <div style="font-size: 12px; color: #888;">Entregadas</div>
        </div>
        <div>
          <div style="font-size: 28px; font-weight: 700; color: #4CAF50;">${resumen.tokens_ganados || 0} 🪙</div>
          <div style="font-size: 12px; color: #888;">Tokens ganados</div>
        </div>
        <div>
          <div style="font-size: 28px; font-weight: 700; color: #FF9800;">${resumen.racha_actual || 0} 🔥</div>
          <div style="font-size: 12px; color: #888;">Racha actual</div>
        </div>
      </div>
    </div>
    ${resumen.proximas_vencer && resumen.proximas_vencer.length > 0 ? `
    <h3 style="color: #C4571A;">⏰ Próximas a vencer</h3>
    <ul style="padding-left: 20px;">
      ${resumen.proximas_vencer.slice(0, 5).map(t => `<li>${t.titulo} - ${new Date(t.fecha_limite).toLocaleDateString('es-MX')}</li>`).join('')}
    </ul>
    ` : ''}
  `;
  return enviarEmail({
    to: email,
    subject: '📊 Tu resumen semanal en CAPU',
    html: baseTemplate({
      title: 'Resumen semanal',
      content,
      actionUrl: `${config.appUrl}/#resumen`,
      actionText: 'Ver Resumen Completo'
    })
  });
}

/**
 * Probar configuración de email
 */
async function testEmailConfig(config) {
  const testTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: { rejectUnauthorized: false }
  });

  try {
    await testTransporter.verify();
    return { ok: true, message: 'Configuración SMTP válida' };
  } catch (error) {
    throw new Error(`Configuración inválida: ${error.message}`);
  }
}

module.exports = {
  cargarConfigEmail,
  getTransporter,
  enviarEmail,
  enviarBienvenida,
  enviarVerificacionEmail,
  enviarResetPassword,
  enviarRecordatorioTarea,
  enviarResumenSemanal,
  testEmailConfig,
  baseTemplate
};