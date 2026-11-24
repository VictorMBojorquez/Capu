const { createApp } = require('./app');
const { openDb } = require('./db');
const { now } = require('./clock');
const { cargarEnv } = require('./services/env');
const path = require('node:path');

cargarEnv(path.join(__dirname, '..', '..', '.env')); // GOOGLE_CLIENT_ID, etc.

const { sincronizar } = require('./services/sync');
const oauth = require('./services/oauth');
const mockAdapter = require('./services/classroom/mock');
const googleAdapter = require('./services/classroom/google');

const app = createApp();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CAPU escuchando en http://localhost:${PORT}`));

// Ciclo de sincronización automática (RF-03/RF-06): CAPU_SYNC_MINUTOS=15 lo activa.
// Usa la credencial OAuth guardada; si el usuario no conectó Classroom, cae al adaptador demo.
const minutos = Number(process.env.CAPU_SYNC_MINUTOS || 0);
if (minutos > 0) {
  const db = app.get('db');
  const ciclo = async () => {
    const usuarios = db.prepare('SELECT id_usuario FROM usuario ORDER BY id_usuario').all();
    for (const { id_usuario } of usuarios) {
      try {
        const token = await oauth.tokenValido(db, id_usuario, now());
        if (!token && id_usuario !== 1) continue; // sólo el usuario demo usa el adaptador simulado
        const adaptador = token ? googleAdapter(token) : mockAdapter(now());
        const r = await sincronizar(db, adaptador, now(), id_usuario);
        console.log(`Sincronización automática usuario ${id_usuario} (${r.adaptador}): ${r.nuevas} nuevas, ${r.entregasDetectadas} entregas, ${r.recordatorios} recordatorios`);
      } catch (e) { console.error(`Sincronización automática falló (usuario ${id_usuario}):`, e.message); }
    }
  };
  const t = setInterval(ciclo, minutos * 60e3);
  t.unref?.();
}
