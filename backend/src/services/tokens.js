const { transaction } = require('../db');

const BASE = 10;            // tokens por entrega a tiempo
const BONO_ANTICIPADA = 5;  // entrega con 24 h o más de anticipación
const BONO_RACHA_MAX = 5;   // tope del bono por racha
const HORAS_ANTICIPADA = 24;

/**
 * Regla de gamificación (RF-07). Función pura, fácil de probar.
 * - Entrega a tiempo: BASE tokens.
 * - Entrega con >= 24 h de anticipación: +BONO_ANTICIPADA.
 * - Racha de días con entregas a tiempo: +min(racha, BONO_RACHA_MAX).
 * - Entrega tardía: 0 tokens.
 */
function calcularTokens({ fechaLimite, fechaEntrega, racha = 0 }) {
  const limite = new Date(fechaLimite).getTime();
  const entrega = new Date(fechaEntrega).getTime();
  if (entrega > limite) return { cantidad: 0, aTiempo: false, motivo: 'Entrega tardía: sin tokens' };
  const partes = [`base ${BASE}`];
  let cantidad = BASE;
  if (limite - entrega >= HORAS_ANTICIPADA * 3600e3) { cantidad += BONO_ANTICIPADA; partes.push(`anticipada +${BONO_ANTICIPADA}`); }
  const bonoRacha = Math.min(Math.max(racha, 0), BONO_RACHA_MAX);
  if (bonoRacha > 0) { cantidad += bonoRacha; partes.push(`racha +${bonoRacha}`); }
  return { cantidad, aTiempo: true, motivo: `Entrega a tiempo (${partes.join(', ')})` };
}

const dia = (d) => new Date(d).toISOString().slice(0, 10);

/** Calcula la nueva racha: consecutiva si la última entrega a tiempo fue ayer. */
function nuevaRacha(ultimaFecha, rachaActual, hoy) {
  const h = dia(hoy);
  if (ultimaFecha === h) return Math.max(rachaActual, 1);
  const ayer = dia(new Date(new Date(h).getTime() - 86400e3));
  return ultimaFecha === ayer ? rachaActual + 1 : 1;
}

/**
 * Marca una tarea como entregada y otorga tokens. No premia dos veces la misma tarea.
 * actualizarRacha=false cuando la entrega se detecta por sincronización.
 */
function registrarEntrega(db, idTarea, fechaEntrega, { actualizarRacha = true, idUsuario = 1 } = {}) {
  return transaction(db, () => {
    const tarea = db.prepare('SELECT * FROM tarea WHERE id_tarea = ?').get(idTarea);
    if (!tarea) throw Object.assign(new Error('Tarea no encontrada'), { status: 404 });
    if (tarea.estado === 'entregada') throw Object.assign(new Error('La tarea ya fue entregada'), { status: 409 });
    const u = db.prepare('SELECT * FROM usuario WHERE id_usuario = ?').get(idUsuario);
    const entrega = new Date(fechaEntrega).toISOString();
    const premio = calcularTokens({ fechaLimite: tarea.fecha_limite, fechaEntrega: entrega, racha: u.racha_dias });
    let racha = u.racha_dias, ultima = u.ultima_entrega_ok;
    if (actualizarRacha) {
      if (premio.aTiempo) { racha = nuevaRacha(u.ultima_entrega_ok, u.racha_dias, entrega); ultima = dia(entrega); }
      else { racha = 0; }
    }
    db.prepare("UPDATE tarea SET estado='entregada', avance_pct=100, fecha_entrega=? WHERE id_tarea=?").run(entrega, idTarea);
    if (premio.cantidad > 0) {
      db.prepare('INSERT INTO transaccion_token (id_usuario,id_tarea,cantidad,motivo,fecha) VALUES (?,?,?,?,?)')
        .run(idUsuario, idTarea, premio.cantidad, premio.motivo, entrega);
    }
    db.prepare('UPDATE usuario SET saldo_tokens = saldo_tokens + ?, racha_dias = ?, ultima_entrega_ok = ? WHERE id_usuario = ?')
      .run(premio.cantidad, racha, ultima, idUsuario);
    return { ...premio, racha };
  });
}

/** Canjea tokens por una recompensa (RF-09). */
function canjear(db, idRecompensa, fecha, idUsuario = 1) {
  return transaction(db, () => {
    const rec = db.prepare('SELECT * FROM recompensa WHERE id_recompensa = ? AND activa = 1').get(idRecompensa);
    if (!rec) throw Object.assign(new Error('Recompensa no disponible'), { status: 404 });
    const u = db.prepare('SELECT saldo_tokens FROM usuario WHERE id_usuario = ?').get(idUsuario);
    if (u.saldo_tokens < rec.costo_tokens)
      throw Object.assign(new Error(`Tokens insuficientes (faltan ${rec.costo_tokens - u.saldo_tokens})`), { status: 422 });
    const f = new Date(fecha).toISOString();
    db.prepare('INSERT INTO canje (id_usuario,id_recompensa,fecha) VALUES (?,?,?)').run(idUsuario, idRecompensa, f);
    db.prepare('INSERT INTO transaccion_token (id_usuario,id_tarea,cantidad,motivo,fecha) VALUES (?,?,?,?,?)')
      .run(idUsuario, null, -rec.costo_tokens, `Canje: ${rec.nombre}`, f);
    db.prepare('UPDATE usuario SET saldo_tokens = saldo_tokens - ? WHERE id_usuario = ?').run(rec.costo_tokens, idUsuario);
    return { recompensa: rec.nombre, costo: rec.costo_tokens };
  });
}

module.exports = { calcularTokens, nuevaRacha, registrarEntrega, canjear, BASE, BONO_ANTICIPADA };
