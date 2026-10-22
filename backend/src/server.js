const { createApp } = require('./app');
const { openDb } = require('./db');
const { now } = require('./clock');
const { sincronizar } = require('./services/sync');
const { programarRecordatorios } = require('./services/reminders');
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
    try {
      const token = await oauth.tokenValido(db, 1, now());
      const adaptador = token ? googleAdapter(token) : mockAdapter(now());
      const r = await sincronizar(db, adaptador, now());
      programarRecordatorios(db, now());
      console.log(`Sincronización automática (${r.adaptador}): ${r.nuevas} nuevas, ${r.entregasDetectadas} entregas, ${r.recordatorios} recordatorios`);
    } catch (e) { console.error('Sincronización automática falló:', e.message); }
  };
  const t = setInterval(ciclo, minutos * 60e3);
  t.unref?.();
}
