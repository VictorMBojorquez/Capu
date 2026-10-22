// CAPU · interfaz web (Etapa II: agenda, avance, tokens y resumen).
const $ = (s) => document.querySelector(s);
const fmt = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Tijuana' });
const ETIQUETA = { pendiente: 'Pendiente', en_progreso: 'En progreso', vencida: 'Vencida', entregada: 'Entregada' };
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(metodo, ruta, cuerpo) {
  const r = await fetch(ruta, { method: metodo, headers: { 'content-type': 'application/json' }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || 'Ocurrió un error');
  return datos;
}
let temporizador;
function aviso(texto, error = false) {
  const t = $('#toast'); t.textContent = texto; t.className = 'toast' + (error ? ' error' : ''); t.hidden = false;
  clearTimeout(temporizador); temporizador = setTimeout(() => (t.hidden = true), 4200);
}
const intentar = (fn) => async (...a) => { try { await fn(...a); } catch (e) { aviso(e.message, true); } };

// ---- Pestañas ----
const vistas = { agenda: cargarAgenda, tokens: cargarTokens, resumen: cargarResumen };
function mostrar(nombre) {
  for (const n of Object.keys(vistas)) {
    $('#vista-' + n).hidden = n !== nombre;
    $('#tab-' + n).setAttribute('aria-selected', String(n === nombre));
  }
  intentar(vistas[nombre])();
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => mostrar(b.id.replace('tab-', ''))));

async function actualizarCabecera() {
  const t = await api('GET', '/api/tokens');
  $('#saldo').textContent = t.saldo_tokens; $('#racha').textContent = t.racha_dias;
}

// ---- Agenda ----
async function cargarAgenda() {
  const q = new URLSearchParams();
  if ($('#f-curso').value) q.set('curso', $('#f-curso').value);
  if ($('#f-estado').value) q.set('estado', $('#f-estado').value);
  const [lista, alertas] = await Promise.all([api('GET', '/api/tareas?' + q), api('GET', '/api/alertas'), actualizarCabecera()]);
  const ul = $('#lista-tareas'); ul.innerHTML = '';
  $('#vacio').hidden = lista.length > 0 || q.toString() !== '';
  $('#avisos').innerHTML = alertas.slice(0, 3).map((a) => a.tipo === 'vencida'
    ? `<div class="aviso critico">⛔ <b>Vencida:</b> “${esc(a.titulo)}” (${esc(a.curso)}) venció hace ${a.vencidasH} h.</div>`
    : `<div class="aviso">⏰ <b>Vence pronto:</b> “${esc(a.titulo)}” (${esc(a.curso)}) vence en ${a.faltanH} h.</div>`).join('');
  for (const t of lista) {
    const li = document.createElement('li'); li.className = `tarea ${t.estado_visible}`;
    const hecha = t.estado === 'entregada';
    li.innerHTML = `
      <div class="fila"><div><h3>${esc(t.titulo)}</h3><div class="curso">${esc(t.curso)}</div></div>
        <span class="etiqueta e-${t.estado_visible}">${ETIQUETA[t.estado_visible]}</span></div>
      <div class="fecha">${hecha ? 'Entregada: ' + esc(fmt.format(new Date(t.fecha_entrega))) : 'Fecha límite: ' + esc(fmt.format(new Date(t.fecha_limite)))}</div>
      <div class="avance"><label for="av-${t.id_tarea}">Avance</label>
        <input type="range" id="av-${t.id_tarea}" min="0" max="100" step="5" value="${t.avance_pct}" ${hecha ? 'disabled' : ''}>
        <output for="av-${t.id_tarea}">${t.avance_pct}%</output></div>
      <div class="botones">
        <button class="btn" data-completar="${t.id_tarea}" ${hecha ? 'disabled' : ''}>Marcar como entregada</button>
        ${t.enlace ? `<a class="btn enlace" href="${esc(t.enlace)}" target="_blank" rel="noopener">Abrir en Classroom</a>` : ''}
      </div>`;
    const rango = li.querySelector('input'), salida = li.querySelector('output');
    rango.addEventListener('input', () => (salida.textContent = rango.value + '%'));
    rango.addEventListener('change', intentar(async () => { await api('PATCH', '/api/tareas/' + t.id_tarea, { avance_pct: Number(rango.value) }); aviso('Avance guardado'); cargarAgenda(); }));
    li.querySelector('[data-completar]').addEventListener('click', intentar(async () => {
      const r = await api('POST', `/api/tareas/${t.id_tarea}/completar`);
      aviso(r.cantidad ? `¡Bien! Ganaste ${r.cantidad} tokens 🪙` : 'Entregada, pero fuera de tiempo: sin tokens esta vez');
      cargarAgenda();
    }));
    ul.appendChild(li);
  }
}
async function cargarCursos() {
  const sel = $('#f-curso'), actual = sel.value;
  sel.innerHTML = '<option value="">Todos</option>' + (await api('GET', '/api/cursos')).map((c) => `<option value="${c.id_curso}">${esc(c.nombre)}</option>`).join('');
  sel.value = actual;
}
$('#f-curso').addEventListener('change', intentar(cargarAgenda));
$('#f-estado').addEventListener('change', intentar(cargarAgenda));
$('#btn-sync').addEventListener('click', intentar(async () => {
  const b = $('#btn-sync'); b.disabled = true; b.textContent = 'Sincronizando…';
  try {
    const r = await api('POST', '/api/sync');
    aviso(`Sincronizado (${r.adaptador}): ${r.nuevas} tareas nuevas, ${r.recordatorios} recordatorios programados`);
    await cargarCursos(); await cargarAgenda();
  } finally { b.disabled = false; b.textContent = 'Sincronizar con Classroom'; }
}));

// ---- Tokens ----
async function cargarTokens() {
  const [t, rec] = await Promise.all([api('GET', '/api/tokens'), api('GET', '/api/recompensas')]);
  $('#saldo').textContent = t.saldo_tokens; $('#racha').textContent = t.racha_dias;
  $('#recompensas').innerHTML = rec.map((r) => `<div class="tarjeta"><h3>${esc(r.nombre)}</h3><div class="costo">🪙 ${r.costo_tokens}</div>
    <button class="btn secundario" data-canje="${r.id_recompensa}" ${t.saldo_tokens < r.costo_tokens ? 'disabled' : ''}>${t.saldo_tokens < r.costo_tokens ? `Faltan ${r.costo_tokens - t.saldo_tokens}` : 'Canjear'}</button></div>`).join('');
  document.querySelectorAll('[data-canje]').forEach((b) => b.addEventListener('click', intentar(async () => {
    const r = await api('POST', `/api/recompensas/${b.dataset.canje}/canjear`);
    aviso(`Canjeaste: ${r.recompensa}`); cargarTokens();
  })));
  $('#historial').innerHTML = t.historial.length ? t.historial.map((h) => `<li><div>${esc(h.motivo)}<small>${esc(fmt.format(new Date(h.fecha)))}</small></div>
    <span class="${h.cantidad > 0 ? 'mas' : 'menos'}">${h.cantidad > 0 ? '+' : ''}${h.cantidad}</span></li>`).join('') : '<li>Aún no tienes movimientos.</li>';
}

// ---- Resumen ----
async function cargarResumen() {
  const m = await api('GET', '/api/metricas');
  const items = [
    [m.porcentaje_a_tiempo === null ? '—' : m.porcentaje_a_tiempo + '%', 'Tareas entregadas a tiempo'],
    [m.entregadas + ' / ' + m.total, 'Tareas entregadas'], [m.pendientes, 'Pendientes'], [m.vencidas, 'Vencidas'],
    [m.tokens_ganados, 'Tokens ganados'], [m.saldo_tokens, 'Saldo actual'], [m.racha_dias + ' días', 'Racha actual'],
  ];
  $('#metricas').innerHTML = items.map(([n, e]) => `<div class="tarjeta"><div class="num">${esc(n)}</div><div class="et">${esc(e)}</div></div>`).join('');
}

// ---- Alertas (RF-06): sondeo periódico silencioso; avisa solo cuando aumentan ----
let alertasPrevias = -1;
async function vigilarAlertas() {
  try {
    const alertas = await api('GET', '/api/alertas');
    if (alertasPrevias >= 0 && alertas.length > alertasPrevias && alertas.length)
      aviso(`⏰ ${alertas.length} tarea(s) requieren tu atención`);
    alertasPrevias = alertas.length;
  } catch { /* silencioso: reintenta en el siguiente ciclo */ }
  setTimeout(vigilarAlertas, 30000);
}

// ---- Conexión con Google Classroom (RF-01) ----
async function estadoGoogle() {
  try { $('#btn-google').hidden = (await api('GET', '/api/auth/google/estado')).conectado; } catch { /* sin OAuth configurado */ }
}

intentar(async () => { await cargarCursos(); await cargarAgenda(); await estadoGoogle(); })();
vigilarAlertas();
