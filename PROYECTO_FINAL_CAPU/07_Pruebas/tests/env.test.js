const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const { cargarEnv } = require('../backend/src/services/env');

test('carga claves de .env, respeta comillas y no sobreescribe el entorno', () => {
  const ruta = path.join(os.tmpdir(), `capu-env-${Date.now()}-${process.pid}`);
  fs.writeFileSync(ruta, '# comentario\n\nKEY_DEMO=hola\nVALOR_COMILLAS="texto con espacios"\nYA_DEF=archivo\n');
  process.env.YA_DEF = 'entorno';
  try {
    assert.equal(cargarEnv(ruta), true);
    assert.equal(process.env.KEY_DEMO, 'hola');
    assert.equal(process.env.VALOR_COMILLAS, 'texto con espacios');
    assert.equal(process.env.YA_DEF, 'entorno'); // el entorno manda
  } finally {
    fs.unlinkSync(ruta);
    delete process.env.KEY_DEMO; delete process.env.VALOR_COMILLAS; delete process.env.YA_DEF;
  }
});
test('sin archivo no lanza error y devuelve false', () => {
  assert.equal(cargarEnv('no-existe-este-archivo.env'), false);
});
