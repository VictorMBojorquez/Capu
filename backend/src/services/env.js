// Carga variables de un archivo .env (sin dependencias externas; Node >= 22).
// No sobreescribe variables ya definidas en el entorno.
const fs = require('node:fs');

function cargarEnv(ruta) {
  let contenido;
  try {
    contenido = fs.readFileSync(ruta, 'utf8');
  } catch {
    return false; // sin .env: se usan solo las variables del entorno (y el modo demostración)
  }
  for (const linea of contenido.split(/\r?\n/)) {
    if (/^\s*#/.test(linea) || !linea.trim()) continue;
    const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return true;
}

module.exports = { cargarEnv };
