// Datos iniciales: usuario de demostración y catálogo de recompensas.
function seed(db) {
  const hay = db.prepare('SELECT COUNT(*) AS n FROM usuario').get().n;
  if (hay) return false;

  // Usuario demo (estudiante)
  db.prepare("INSERT INTO usuario (google_id, nombre, correo, rol) VALUES ('demo', 'Estudiante Demo', 'demo@capu.local', 'estudiante')").run();

  // Usuario admin (el que se conecta con Google OAuth - email del .env)
  db.prepare("INSERT INTO usuario (google_id, nombre, correo, rol) VALUES ('admin-oauth', 'Administrador CAPU', 'l23211974@tectijuana.edu.mx', 'admin')").run();

  const ins = db.prepare('INSERT INTO recompensa (nombre, costo_tokens) VALUES (?, ?)');
  [['Tema oscuro para la agenda', 20], ['Insignia “Madrugador”', 35], ['Avatar de Capu con gorro', 50], ['Pausa de racha (1 día)', 80]]
    .forEach(([n, c]) => ins.run(n, c));
  return true;
}
module.exports = { seed };
if (require.main === module) {
  const { openDb } = require('./db');
  console.log(seed(openDb()) ? 'Datos iniciales creados.' : 'La base de datos ya tenía datos.');
}