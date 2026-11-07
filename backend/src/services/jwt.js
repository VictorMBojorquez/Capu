const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Genera un JWT firmado
 * @param {Object} payload - Datos a incluir en el token (ej: { sub: userId, correo, rol })
 * @returns {String} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica y decodifica un JWT
 * @param {String} token - JWT token a verificar
 * @returns {Object} Payload decodificado
 * @throws {Error} Si el token es inválido o expirado
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Middleware de autenticación JWT para Express
 * Extrae el token del header Authorization: Bearer <token>
 * Lo verifica y adjunta el usuario a req.user
 */
function authMiddleware(db) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorización requerido' });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      const user = db.prepare('SELECT id_usuario, nombre, correo, rol FROM usuario WHERE id_usuario = ?').get(decoded.sub);
      if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
}

module.exports = { generateToken, verifyToken, authMiddleware };