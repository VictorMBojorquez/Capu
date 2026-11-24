// Reloj inyectable: permite fijar la fecha con CAPU_FIXED_NOW (pruebas y demostraciones).
function now() {
  const fixed = process.env.CAPU_FIXED_NOW;
  return fixed ? new Date(fixed) : new Date();
}
module.exports = { now };
