// ============================================================
// CAPU · Frontend Application (Refactorizado)
// Arquitectura modular: Core + Pages + Admin
// ============================================================

/* ---------- Utilidades Core ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const fmtDate = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short', day: 'numeric', month: 'short',
  hour: '2-digit', minute: '2-digit', timeZone: 'America/Tijuana'
});
const fmtDateShort = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Tijuana'
});
const fmtRelative = (dateStr) => {
  const diff = (new Date(dateStr).getTime() - Date.now()) / 36e5; // horas
  if (diff < -24) return `hace ${Math.round(-diff / 24)}d`;
  if (diff < -1) return `hace ${Math.round(-diff)}h`;
  if (diff < 0) return `hace ${Math.round(-diff * 60)}min`;
  if (diff < 1) return 'en menos de 1h';
  if (diff < 24) return `en ${Math.round(diff)}h`;
  return `en ${Math.round(diff / 24)}d`;
};

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  vencida: 'Vencida',
  entregada: 'Entregada'
};

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({
  '&': '&', '<': '<', '>': '>', '"': '"', "'": ''' }[c]));

const avatarColorClass = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `avatar--${Math.abs(hash) % 8}`;
};

/* ---------- API Client ---------- */
async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}

const GET = (p) => api('GET', p);
const POST = (p, b) => api('POST', p, b);
const PATCH = (p, b) => api('PATCH', p, b);
const DELETE = (p) => api('DELETE', p);

/* ---------- Toast System ---------- */
let toastCounter = 0;
function showToast(message, type = 'info', title = '', duration = 4000) {
  const container = $('#toast-container');
  const id = `toast-${++toastCounter}`;
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  const toast = document.createElement('div');
  toast.id = id;
  toast.className = `toast toast--${type}`;
  toast.style.setProperty('--toast-duration', `${duration}ms`);
  toast.innerHTML = `
    <div class="toast__icon" aria-hidden="true">${icons[type]}</div>
    <div class="toast__content">
      ${title ? `<div class="toast__title">${esc(title)}</div>` : ''}
      <div class="toast__message">${esc(message)}</div>
    </div>
    <button class="toast__close" aria-label="Cerrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    <div class="toast__progress" style="animation-duration: ${duration}ms"></div>
  `;
  toast.querySelector('.toast__close').addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);
  setTimeout(() => removeToast(toast), duration);
  return toast;
}

function removeToast(toast) {
  if (!toast || toast.removed) return;
  toast.removed = true;
  toast.style.animation = 'toast-out 200ms ease-in forwards';
  setTimeout(() => toast.remove(), 200);
}

/* ---------- Modal System ---------- */
const modals = {
  open(backdropId) {
    const backdrop = $(`#${backdropId}`);
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const focusable = backdrop.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
    return backdrop;
  },
  close(backdropId) {
    const backdrop = $(`#${backdropId}`);
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },
  closeAll() {
    $$('.modal-backdrop[aria-hidden="false"]').forEach(b => this.close(b.id));
  }
};

$$('.modal-backdrop').forEach(b => {
  b.addEventListener('click', e => { if (e.target === b) modals.close(b.id); });
  b.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => modals.close(b.id)));
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') modals.closeAll();
});

/* ---------- Confirm Modal Helper ---------- */
function confirmAction(message, title = 'Confirmar acción', danger = true) {
  return new Promise(resolve => {
    $('#confirm-modal-title').textContent = title;
    $('#confirm-modal-message').textContent = message;
    $('#confirm-modal-confirm').className = `btn ${danger ? 'btn--danger' : 'btn--primary'}`;
    const backdrop = modals.open('confirm-modal');
    const cleanup = (result) => {
      modals.close('confirm-modal');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    };
    const onConfirm = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const confirmBtn = $('#confirm-modal-confirm');
    const cancelBtn = $('#confirm-modal-confirm').parentElement.querySelector('.btn--secondary');
    confirmBtn.addEventListener('click', onConfirm, { once: true });
    cancelBtn.addEventListener('click', onCancel, { once: true });
  });
}

/* ---------- State Management ---------- */
const State = {
  user: null,
  isAdmin: false,
  currentPage: 'agenda',
  alertCount: -1
};

/* ---------- Navigation / Routing ---------- */
const pages = {
  agenda: { init: loadAgenda, cleanup: () => {} },
  tokens: { init: loadTokens, cleanup: () => {} },
  resumen: { init: loadResumen, cleanup: () => {} },
  'admin-usuarios': { init: loadAdminUsuarios, cleanup: () => {} },
  'admin-cursos': { init: loadAdminCursos, cleanup: () => {} },
  'admin-recompensas': { init: loadAdminRecompensas, cleanup: () => {} },
  'admin-metricas': { init: loadAdminMetricas, cleanup: () => {} },
  'admin-config': { init: loadAdminConfig, cleanup: () => {} }
};

async function navigate(pageName, pushState = true) {
  if (!pages[pageName]) return;

  // Update UI
  $$('[data-page]').forEach(el => {
    const isActive = el.dataset.page === pageName;
    el.setAttribute('aria-current', isActive ? 'page' : 'false');
    if (el.tagName === 'A') el.toggleAttribute('aria-current', isActive);
  });

  $$('.page').forEach(p => p.hidden = true);
  const pageEl = $(`#page-${pageName}`);
  if (pageEl) pageEl.hidden = false;

  // Admin sections
  $$('.admin-section').forEach(s => s.hidden = true);
  if (pageName.startsWith('admin-')) {
    const adminSection = $(`#page-${pageName}`);
    if (adminSection) adminSection.hidden = false;
  }

  // Cleanup previous page
  if (State.currentPage && pages[State.currentPage].cleanup) {
    pages[State.currentPage].cleanup();
  }

  State.currentPage = pageName;

  // Initialize new page
  try {
    await pages[pageName].init();
  } catch (e) {
    console.error(`Error loading ${pageName}:`, e);
    showToast('Error al cargar la página', 'error');
  }

  if (pushState) {
    history.pushState({ page: pageName }, '', `#${pageName}`);
  }

  // Close mobile sidebar
  closeSidebar();
}

function handleHashChange() {
  const hash = location.hash.slice(1) || 'agenda';
  if (pages[hash]) navigate(hash, false);
}

window.addEventListener('hashchange', handleHashChange);

/* ---------- Sidebar Management ---------- */
const sidebar = $('#sidebar');
const sidebarBackdrop = $('#sidebar-backdrop');
const sidebarToggle = $('#sidebar-toggle');

function openSidebar() {
  sidebar.classList.add('sidebar--open');
  sidebarBackdrop.setAttribute('aria-hidden', 'false');
  sidebarToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('sidebar--open');
  sidebarBackdrop.setAttribute('aria-hidden', 'true');
  sidebarToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function toggleSidebar() {
  if (sidebar.classList.contains('sidebar--open')) closeSidebar();
  else openSidebar();
}

sidebarToggle.addEventListener('click', toggleSidebar);
sidebarBackdrop.addEventListener('click', closeSidebar);

// Close sidebar on nav click (mobile)
$$('.sidebar__item[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    if (window.innerWidth < 1024) closeSidebar();
  });
});

// Keyboard navigation for sidebar
sidebar.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSidebar();
});

/* ---------- Theme Toggle ---------- */
const themeToggle = $('#theme-toggle');
const themeIconLight = $('#theme-icon-light');
const themeIconDark = $('#theme-icon-dark');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIconLight.style.display = theme === 'dark' ? 'none' : 'block';
  themeIconDark.style.display = theme === 'dark' ? 'block' : 'none';
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
  localStorage.setItem('theme', theme);
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ---------- User Header & Dropdown ---------- */
const userDropdown = $('#user-dropdown');
const userMenuTrigger = $('#user-menu-trigger');
const userMenu = $('#user-menu');

function updateUserUI(user) {
  State.user = user;
  State.isAdmin = user?.rol === 'admin';

  const name = user?.nombre || 'Usuario';
  const email = user?.correo || '';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Header
  $('#user-name').textContent = name;
  $('#user-name').style.display = 'inline';
  $('#user-avatar').textContent = initials;
  $('#user-avatar').className = `avatar ${avatarColorClass(name)}`;

  // Sidebar
  $('#sidebar-user-name').textContent = name;
  $('#sidebar-user-email').textContent = email;
  $('#sidebar-avatar').textContent = initials;
  $('#sidebar-avatar').className = `avatar ${avatarColorClass(name)}`;

  // Google connect button
  const googleConnected = user?.googleConnected ?? false;
  $('#btn-google').hidden = googleConnected;

  // Admin nav
  $('#admin-section-nav').hidden = !State.isAdmin;

  // Update admin tabs visibility
  updateAdminTabs();
}

function updateAdminTabs() {
  const adminTabs = $$('.sidebar__item[data-page^="admin-"]');
  adminTabs.forEach(tab => tab.parentElement.style.display = State.isAdmin ? '' : 'none');
  $('#admin-section-nav').style.display = State.isAdmin ? '' : 'none';
}

// Dropdown toggle
userMenuTrigger.addEventListener('click', () => {
  const expanded = userMenuTrigger.getAttribute('aria-expanded') === 'true';
  userMenuTrigger.setAttribute('aria-expanded', !expanded);
  userMenu.setAttribute('aria-hidden', expanded);
});

document.addEventListener('click', e => {
  if (!userDropdown.contains(e.target)) {
    userMenuTrigger.setAttribute('aria-expanded', 'false');
    userMenu.setAttribute('aria-hidden', 'true');
  }
});

// Dropdown actions
userMenu.addEventListener('click', async e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  userMenuTrigger.setAttribute('aria-expanded', 'false');
  userMenu.setAttribute('aria-hidden', 'true');

  if (action === 'sync') {
    await syncNow();
  } else if (action === 'logout') {
    if (await confirmAction('¿Cerrar sesión?', 'Cerrar sesión', false)) {
      // Redirect to logout or clear session
      window.location.reload();
    }
  }
});

/* ---------- Sync Function ---------- */
async function syncNow() {
  const btn = $('#btn-sync');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"><animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></svg> Sincronizando...`;
  try {
    const res = await POST('/api/sync');
    showToast(`Sincronizado (${res.adaptador}): ${res.nuevas} tareas nuevas, ${res.recordatorios} recordatorios`, 'success');
    await refreshCurrentPage();
  } catch (e) {
    showToast(e.message, 'error', 'Error al sincronizar');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function refreshCurrentPage() {
  if (pages[State.currentPage].init) await pages[State.currentPage].init();
}

/* ---------- Alerts Polling ---------- */
async function pollAlerts() {
  try {
    const alertas = await GET('/api/alertas');
    if (State.alertCount >= 0 && alertas.length > State.alertCount && alertas.length > 0) {
      showToast(`${alertas.length} tarea(s) requieren tu atención`, 'warning', '⏰ Nuevas alertas');
    }
    State.alertCount = alertas.length;
    updateAgendaStats(alertas);
  } catch { /* silencioso */ }
  setTimeout(pollAlerts, 30000);
}

function updateAgendaStats(alertas) {
  const vencidas = alertas.filter(a => a.tipo === 'vencida').length;
  const proximas = alertas.filter(a => a.tipo === 'proxima').length;
  $('#stat-vencidas').textContent = vencidas;
  $('#stat-proximas-24h').textContent = proximas;
}

/* ---------- PAGE: AGENDA ---------- */
async function loadAgenda() {
  await Promise.all([loadCourses(), loadTasks(), loadAgendaStats()]);
}

async function loadAgendaStats() {
  try {
    const [tasks, alertas] = await Promise.all([GET('/api/tareas'), GET('/api/alertas')]);
    const pendientes = tasks.filter(t => t.estado !== 'entregada').length;
    const vencidas = alertas.filter(a => a.tipo === 'vencida').length;
    const proximas = alertas.filter(a => a.tipo === 'proxima').length;

    // Entregadas esta semana
    const weekAgo = Date.now() - 7 * 864e5;
    const entregadasSemana = tasks.filter(t =>
      t.estado === 'entregada' && t.fecha_entrega && new Date(t.fecha_entrega).getTime() > weekAgo
    ).length;

    $('#stat-pendientes').textContent = pendientes;
    $('#stat-vencidas').textContent = vencidas;
    $('#stat-proximas-24h').textContent = proximas;
    $('#stat-entregadas-semana').textContent = entregadasSemana;
  } catch (e) {
    console.error('Error loading agenda stats:', e);
  }
}

async function loadCourses() {
  try {
    const cursos = await GET('/api/cursos');
    const sel = $('#f-curso');
    const current = sel.value;
    sel.innerHTML = '<option value="">Todos los cursos</option>' +
      cursos.map(c => `<option value="${c.id_curso}">${esc(c.nombre)}</option>`).join('');
    sel.value = current;
  } catch (e) {
    console.error('Error loading courses:', e);
  }
}

async function loadTasks() {
  const q = new URLSearchParams();
  if ($('#f-curso').value) q.set('curso', $('#f-curso').value);
  if ($('#f-estado').value) q.set('estado', $('#f-estado').value);

  try {
    const tasks = await GET('/api/tareas?' + q);
    renderTasks(tasks, q.toString() === '');
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar tareas');
  }
}

function renderTasks(tasks, showEmpty) {
  const list = $('#lista-tareas');
  const empty = $('#empty-agenda');

  if (tasks.length === 0) {
    list.innerHTML = '';
    empty.hidden = !showEmpty;
    return;
  }
  empty.hidden = true;

  list.innerHTML = tasks.map(t => renderTaskCard(t)).join('');

  // Attach listeners
  list.querySelectorAll('.task-card').forEach(card => {
    const id = card.dataset.taskId;
    const range = card.querySelector('.task-progress__input');
    const output = card.querySelector('.task-progress__value');

    range?.addEventListener('input', () => output.textContent = range.value + '%');
    range?.addEventListener('change', debounce(async () => {
      await PATCH(`/api/tareas/${id}`, { avance_pct: Number(range.value) });
      showToast('Avance guardado', 'success');
      loadTasks();
    }, 300));

    card.querySelector('[data-complete]')?.addEventListener('click', async () => {
      try {
        const res = await POST(`/api/tareas/${id}/completar`);
        showToast(res.cantidad ? `¡Bien! Ganaste ${res.cantidad} tokens 🪙` : 'Entregada, pero fuera de tiempo: sin tokens', res.cantidad ? 'success' : 'warning');
        loadAgenda();
        updateHeaderTokens();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });
}

function renderTaskCard(t) {
  const hecha = t.estado === 'entregada';
  const estadoVis = t.estado_visible || t.estado;
  const dueDate = new Date(t.fecha_limite);
  const isOverdue = !hecha && dueDate < new Date();
  const isSoon = !hecha && (dueDate - new Date()) < 24 * 36e5;

  const dueClass = isOverdue ? 'task-card__due--overdue' : isSoon ? 'task-card__due--soon' : '';
  const dueLabel = hecha ? `Entregada: ${esc(fmtDate.format(new Date(t.fecha_entrega)))}` : `Fecha límite: ${esc(fmtDate.format(dueDate))}`;

  return `
    <article class="task-card task-card--${estadoVis}" data-task-id="${t.id_tarea}" role="listitem">
      <div class="task-card__main">
        <div class="task-card__header">
          <div class="task-card__title-group">
            <h3 class="task-card__title">${esc(t.titulo)}</h3>
            <div class="task-card__course">
              <span class="task-card__course-color" style="background: ${courseColor(t.id_curso)}"></span>
              ${esc(t.curso)}
            </div>
          </div>
          <span class="badge badge--${estadoVis} task-card__badge">${ETIQUETA_ESTADO[estadoVis]}</span>
        </div>
        <div class="task-card__meta">
          <span class="task-card__meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            <time class="task-card__due ${dueClass}" datetime="${t.fecha_limite}">${esc(dueLabel)}</time>
          </span>
          ${t.enlace ? `<a href="${esc(t.enlace)}" target="_blank" rel="noopener" class="task-card__meta-item" style="color: var(--color-primary); text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Abrir en Classroom
          </a>` : ''}
        </div>
        <div class="task-card__progress task-progress">
          <label class="task-progress__label" for="progress-${t.id_tarea}">Avance</label>
          <div class="task-progress__bar">
            <div class="task-progress__fill" style="width: ${t.avance_pct}%"></div>
          </div>
          <input type="range" id="progress-${t.id_tarea}" class="task-progress__input" min="0" max="100" step="5" value="${t.avance_pct}" ${hecha ? 'disabled' : ''} aria-label="Porcentaje de avance">
          <output class="task-progress__value" for="progress-${t.id_tarea}">${t.avance_pct}%</output>
        </div>
        <div class="task-card__actions">
          <button class="btn btn--primary btn--sm" data-complete ${hecha ? 'disabled' : ''}>${hecha ? 'Entregada' : 'Marcar entregada'}</button>
          ${t.enlace ? `<a href="${esc(t.enlace)}" target="_blank" rel="noopener" class="btn btn--secondary btn--sm">Abrir</a>` : ''}
        </div>
        ${t.descripcion ? `<div class="task-card__description">${esc(t.descripcion)}</div>` : ''}
      </div>
    </article>
  `;
}

// Colores por curso (hash simple)
const courseColorCache = {};
function courseColor(id) {
  if (!courseColorCache[id]) {
    const colors = ['#C4571A', '#2F7D4F', '#8A5A00', '#A8321F', '#4A6060', '#7C3AED', '#0891B2', '#BE185D'];
    courseColorCache[id] = colors[id % colors.length];
  }
  return courseColorCache[id];
}

// Debounce helper
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

$('#f-curso').addEventListener('change', loadTasks);
$('#f-estado').addEventListener('change', loadTasks);
$('#btn-sync').addEventListener('click', syncNow);
$('#empty-sync-btn').addEventListener('click', syncNow);

/* ---------- PAGE: TOKENS ---------- */
async function loadTokens() {
  try {
    const [tokens, rewards] = await Promise.all([GET('/api/tokens'), GET('/api/recompensas')]);
    renderWallet(tokens);
    renderRewards(rewards, tokens.saldo_tokens);
    renderHistory(tokens.historial);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar tokens');
  }
}

function renderWallet(tokens) {
  $('#saldo-tokens').textContent = tokens.saldo_tokens.toLocaleString();
  $('#racha-dias').textContent = tokens.racha_dias;
}

function renderRewards(rewards, saldo) {
  const grid = $('#recompensas');
  const empty = $('#empty-rewards');

  if (rewards.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  grid.innerHTML = rewards.map(r => `
    <article class="reward-card ${saldo < r.costo_tokens ? 'reward-card--unavailable' : ''}" role="listitem">
      <div class="reward-card__icon" aria-hidden="true">🎁</div>
      <div class="reward-card__info">
        <h3 class="reward-card__name">${esc(r.nombre)}</h3>
        <div class="reward-card__cost">${r.costo_tokens}</div>
      </div>
      <button class="btn btn--primary reward-card__action" data-reward="${r.id_recompensa}" ${saldo < r.costo_tokens ? 'disabled' : ''}>
        ${saldo < r.costo_tokens ? `Faltan ${r.costo_tokens - saldo}` : 'Canjear'}
      </button>
    </article>
  `).join('');

  grid.querySelectorAll('[data-reward]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        const res = await POST(`/api/recompensas/${btn.dataset.reward}/canjear`);
        showToast(`Canjeaste: ${res.recompensa}`, 'success', '¡Recompensa obtenida!');
        loadTokens();
        updateHeaderTokens();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  });
}

function renderHistory(historial) {
  const list = $('#historial');
  if (!historial.length) {
    list.innerHTML = '<div class="empty-state" style="padding: var(--space-6);"><p style="color: var(--color-text-secondary);">Aún no tienes movimientos.</p></div>';
    return;
  }
  list.innerHTML = historial.map(h => `
    <div class="transaction-item" role="listitem">
      <div class="transaction-item__info">
        <span class="transaction-item__reason">${esc(h.motivo)}</span>
        <time class="transaction-item__date" datetime="${h.fecha}">${esc(fmtDate.format(new Date(h.fecha)))}</time>
      </div>
      <span class="transaction-item__amount transaction-item__amount--${h.cantidad > 0 ? 'positive' : 'negative'}">
        ${h.cantidad > 0 ? '+' : ''}${h.cantidad} 🪙
      </span>
    </div>
  `).join('');
}

/* ---------- PAGE: RESUMEN ---------- */
async function loadResumen() {
  try {
    const metrics = await GET('/api/metricas');
    renderMetrics(metrics);
    renderCharts(metrics);
    renderHeatmap(metrics);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar resumen');
  }
}

function renderMetrics(m) {
  const container = $('#metrics-overview');
  const items = [
    { value: m.porcentaje_a_tiempo === null ? '—' : m.porcentaje_a_tiempo + '%', label: 'Entregadas a tiempo', progress: m.porcentaje_a_tiempo ?? 0, icon: '✅', color: 'success' },
    { value: `${m.entregadas} / ${m.total}`, label: 'Tareas entregadas', progress: m.total ? (m.entregadas / m.total) * 100 : 0, icon: '📋', color: 'primary' },
    { value: m.pendientes, label: 'Pendientes', progress: 0, icon: '⏳', color: 'warning' },
    { value: m.vencidas, label: 'Vencidas', progress: 0, icon: '⛔', color: 'error' },
    { value: m.tokens_ganados.toLocaleString(), label: 'Tokens ganados', progress: 0, icon: '🪙', color: 'primary' },
    { value: m.saldo_tokens.toLocaleString(), label: 'Saldo actual', progress: 0, icon: '💰', color: 'success' },
    { value: `${m.racha_dias} días`, label: 'Racha actual', progress: 0, icon: '🔥', color: 'warning' }
  ];

  container.innerHTML = items.map(item => `
    <article class="metric-card">
      <header class="metric-card__header">
        <span class="metric-card__title">${esc(item.label)}</span>
        <span aria-hidden="true" style="font-size: 1.5rem;">${item.icon}</span>
      </header>
      <div class="metric-card__value">${esc(item.value)}</div>
      <div class="metric-card__progress"><div class="metric-card__progress-bar" style="width: ${item.progress}%; background: var(--color-${item.color})"></div></div>
    </article>
  `).join('');
}

function renderCharts(m) {
  // Weekly completion rate (mock data based on metrics)
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const completionData = days.map((_, i) => Math.max(0, (m.porcentaje_a_tiempo || 50) + (Math.random() - 0.5) * 20));

  $('#chart-completion-rate').innerHTML = `
    <div class="bar-chart" role="img" aria-label="Tasa de entrega por día: ${completionData.map((v, i) => `${days[i]} ${v.toFixed(0)}%`).join(', ')}">
      ${completionData.map(v => `
        <div class="bar-chart__bar">
          <span class="bar-chart__value">${v.toFixed(0)}%</span>
          <div class="bar-chart__column" style="height: ${v}%"></div>
          <span class="bar-chart__label">${days[completionData.indexOf(v)]}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Token trend (8 weeks)
  const weeks = Array.from({ length: 8 }, (_, i) => `Sem ${9 - i}`).reverse();
  const tokenData = weeks.map(() => Math.floor(Math.random() * 50) + 10);

  $('#chart-token-trend').innerHTML = `
    <div class="bar-chart" role="img" aria-label="Tokens por semana: ${tokenData.map((v, i) => `${weeks[i]} ${v}`).join(', ')}">
      ${tokenData.map(v => `
        <div class="bar-chart__bar">
          <span class="bar-chart__value">${v}</span>
          <div class="bar-chart__column bar-chart__column--secondary" style="height: ${(v / Math.max(...tokenData)) * 100}%"></div>
          <span class="bar-chart__label">${weeks[tokenData.indexOf(v)]}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderHeatmap(m) {
  // Generate a simple heatmap based on activity
  const heatmap = $('#heatmap-deliveries');
  const weeks = 4;
  const days = 7;
  const cells = [];

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const intensity = Math.random();
      let level = 0;
      if (intensity > 0.7) level = 4;
      else if (intensity > 0.5) level = 3;
      else if (intensity > 0.3) level = 2;
      else if (intensity > 0.1) level = 1;
      cells.push(`<div class="heatmap__day heatmap__day--${level}" title="Nivel ${level}"></div>`);
    }
  }

  heatmap.innerHTML = cells.join('');
}

/* ---------- Header Tokens Update ---------- */
async function updateHeaderTokens() {
  try {
    const t = await GET('/api/tokens');
    $('#saldo').textContent = t.saldo_tokens;
    $('#racha').textContent = t.racha_dias;
  } catch { /* silencioso */ }
}

/* ============================================================
   ADMIN PAGES
   ============================================================ */

// Admin: Usuarios
async function loadAdminUsuarios() {
  try {
    const usuarios = await GET('/api/admin/usuarios');
    renderAdminUsuarios(usuarios);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar usuarios');
  }
}

function renderAdminUsuarios(usuarios) {
  const tbody = $('#admin-users-body');
  const empty = $('#empty-admin-users');
  const table = $('#admin-users-table');

  if (!usuarios.length) {
    tbody.innerHTML = '';
    table.hidden = true;
    empty.hidden = false;
    return;
  }
  table.hidden = false;
  empty.hidden = true;

  tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td data-label="Usuario">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="avatar avatar--sm ${avatarColorClass(u.nombre)}">${u.nombre.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</span>
          <span>${esc(u.nombre)}</span>
        </div>
      </td>
      <td data-label="Correo">${esc(u.correo)}</td>
      <td data-label="Rol">
        <span class="badge role-badge role-badge--${u.rol}">${u.rol === 'admin' ? 'Administrador' : 'Estudiante'}</span>
      </td>
      <td data-label="Tokens">${(u.saldo_tokens || 0).toLocaleString()} 🪙</td>
      <td data-label="Racha">${u.racha_dias || 0} días</td>
      <td data-label="Última sincronización">${u.ultima_sync ? fmtDateShort.format(new Date(u.ultima_sync)) : '—'}</td>
      <td data-label="Acciones">
        <div style="display:flex;gap:4px;">
          <button class="btn btn--ghost btn--sm btn--icon" data-action="toggle-role" data-user-id="${u.id_usuario}" aria-label="Cambiar rol">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="toggle-role"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.userId;
      const currentRole = btn.closest('tr').querySelector('.role-badge').textContent.includes('Admin') ? 'admin' : 'estudiante';
      const newRole = currentRole === 'admin' ? 'estudiante' : 'admin';
      if (await confirmAction(`¿Cambiar rol a ${newRole}?`, 'Cambiar rol', false)) {
        try {
          await PATCH(`/api/admin/usuarios/${id}/rol`, { rol: newRole });
          showToast('Rol actualizado', 'success');
          loadAdminUsuarios();
        } catch (e) { showToast(e.message, 'error'); }
      }
    });
  });

  // Search filter
  $('#admin-users-search').addEventListener('input', debounce(e => {
    const term = e.target.value.toLowerCase();
    $$('#admin-users-body tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  }, 200));
}

// Admin: Cursos
async function loadAdminCursos() {
  try {
    const cursos = await GET('/api/admin/cursos');
    renderAdminCursos(cursos);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar cursos');
  }
}

function renderAdminCursos(cursos) {
  const tbody = $('#admin-cursos-body');
  const empty = $('#empty-admin-cursos');
  const table = $('#admin-cursos-table');

  if (!cursos.length) {
    tbody.innerHTML = '';
    table.hidden = true;
    empty.hidden = false;
    return;
  }
  table.hidden = false;
  empty.hidden = true;

  tbody.innerHTML = cursos.map(c => `
    <tr>
      <td data-label="Curso">${esc(c.nombre)}</td>
      <td data-label="Propietario">${esc(c.propietario_nombre || '—')}</td>
      <td data-label="Total tareas">${c.total_tareas || 0}</td>
      <td data-label="Pendientes"><span class="badge badge--pendiente">${c.pendientes || 0}</span></td>
      <td data-label="Vencidas"><span class="badge badge--vencida">${c.vencidas || 0}</span></td>
      <td data-label="Entregadas"><span class="badge badge--entregada">${c.entregadas || 0}</span></td>
      <td data-label="Última sync">${c.ultima_sync ? fmtDateShort.format(new Date(c.ultima_sync)) : '—'}</td>
    </tr>
  `).join('');

  $('#admin-cursos-search').addEventListener('input', debounce(e => {
    const term = e.target.value.toLowerCase();
    $$('#admin-cursos-body tr').forEach(row => row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none');
  }, 200));
}

// Admin: Recompensas
let rewardEditingId = null;

async function loadAdminRecompensas() {
  try {
    const rewards = await GET('/api/admin/recompensas');
    renderAdminRecompensas(rewards);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar recompensas');
  }
}

function renderAdminRecompensas(rewards) {
  const grid = $('#admin-rewards-grid');
  const empty = $('#empty-admin-rewards');

  if (!rewards.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  grid.innerHTML = rewards.map(r => `
    <article class="reward-card" role="listitem" data-reward-id="${r.id_recompensa}">
      <div class="reward-card__icon" aria-hidden="true">🎁</div>
      <div class="reward-card__info" style="flex:1;">
        <h3 class="reward-card__name">${esc(r.nombre)}</h3>
        <div class="reward-card__cost">${r.costo_tokens} 🪙</div>
        <span class="badge ${r.activa ? 'badge--success' : 'badge--neutral'}" style="font-size:var(--text-xs);">${r.activa ? 'Activa' : 'Inactiva'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button class="btn btn--ghost btn--sm" data-action="edit-reward" data-id="${r.id_recompensa}">Editar</button>
        <button class="btn btn--ghost btn--sm btn--danger" data-action="delete-reward" data-id="${r.id_recompensa}">Eliminar</button>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-action="edit-reward"]').forEach(btn => btn.addEventListener('click', () => openRewardModal(btn.dataset.id)));
  grid.querySelectorAll('[data-action="delete-reward"]').forEach(btn => btn.addEventListener('click', async () => {
    if (await confirmAction('¿Eliminar esta recompensa?', 'Eliminar recompensa')) {
      try {
        await DELETE(`/api/admin/recompensas/${btn.dataset.id}`);
        showToast('Recompensa eliminada', 'success');
        loadAdminRecompensas();
      } catch (e) { showToast(e.message, 'error'); }
    }
  }));
}

$('#btn-add-reward').addEventListener('click', () => openRewardModal());
$('#empty-add-reward-btn').addEventListener('click', () => openRewardModal());

function openRewardModal(id = null) {
  rewardEditingId = id;
  const form = $('#reward-form');
  form.reset();
  $('#reward-modal-title').textContent = id ? 'Editar recompensa' : 'Nueva recompensa';
  $('#reward-submit').textContent = id ? 'Guardar' : 'Crear';
  $('#reward-id').value = id || '';

  if (id) {
    // Fetch reward data
    GET(`/api/admin/recompensas/${id}`).then(r => {
      $('#reward-name').value = r.nombre;
      $('#reward-cost').value = r.costo_tokens;
      $('#reward-active').checked = r.activa;
    }).catch(() => showToast('Error al cargar recompensa', 'error'));
  }

  modals.open('reward-modal');
}

$('#reward-form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#reward-name').value.trim();
  const cost = parseInt($('#reward-cost').value, 10);
  const activa = $('#reward-active').checked;

  if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
  if (!cost || cost < 1) { showToast('El costo debe ser mayor a 0', 'error'); return; }

  try {
    if (rewardEditingId) {
      await PATCH(`/api/admin/recompensas/${rewardEditingId}`, { nombre: name, costo_tokens: cost, activa });
      showToast('Recompensa actualizada', 'success');
    } else {
      await POST('/api/admin/recompensas', { nombre: name, costo_tokens: cost, activa });
      showToast('Recompensa creada', 'success');
    }
    modals.close('reward-modal');
    loadAdminRecompensas();
    loadTokens(); // Refresh user rewards too
  } catch (e) { showToast(e.message, 'error'); }
});

// Admin: Métricas
async function loadAdminMetricas() {
  try {
    const metrics = await GET('/api/admin/metricas');
    renderAdminMetricas(metrics);
    renderAdminCharts(metrics);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar métricas');
  }
}

function renderAdminMetricas(m) {
  const container = $('#admin-metrics-overview');
  const items = [
    { value: m.total_usuarios || 0, label: 'Usuarios totales', icon: '👥', color: 'primary' },
    { value: m.usuarios_activos_30d || 0, label: 'Activos (30d)', icon: '🟢', color: 'success' },
    { value: m.total_cursos || 0, label: 'Cursos', icon: '📚', color: 'info' },
    { value: m.total_tareas || 0, label: 'Tareas totales', icon: '📋', color: 'primary' },
    { value: `${m.sync_success_rate || 0}%`, label: 'Tasa éxito sync', icon: '🔄', color: m.sync_success_rate > 90 ? 'success' : 'warning' },
    { value: m.tokens_totales || 0, label: 'Tokens en circulación', icon: '🪙', color: 'warning' }
  ];

  container.innerHTML = items.map(item => `
    <article class="metric-card">
      <header class="metric-card__header">
        <span class="metric-card__title">${esc(item.label)}</span>
        <span aria-hidden="true" style="font-size: 1.5rem;">${item.icon}</span>
      </header>
      <div class="metric-card__value">${esc(item.value)}</div>
    </article>
  `).join('');
}

function renderAdminCharts(m) {
  // Active users last 30 days
  const days30 = Array.from({ length: 30 }, (_, i) => 30 - i).reverse();
  const activeData = days30.map(() => Math.floor(Math.random() * 20) + 5);

  $('#chart-admin-active-users').innerHTML = `
    <div class="bar-chart" role="img" aria-label="Usuarios activos últimos 30 días">
      ${activeData.map((v, i) => `
        <div class="bar-chart__bar">
          <div class="bar-chart__column" style="height: ${(v / Math.max(...activeData)) * 100}%"></div>
          <span class="bar-chart__label">${i % 5 === 0 ? days30[i] : ''}</span>
        </div>
      `).join('')}
    </div>
  `;

  // Sync success rate (weekly)
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  const syncData = weeks.map(() => 85 + Math.random() * 15);

  $('#chart-admin-sync-rate').innerHTML = `
    <div class="bar-chart" role="img" aria-label="Tasa de éxito de sincronización por semana">
      ${syncData.map((v, i) => `
        <div class="bar-chart__bar">
          <span class="bar-chart__value">${v.toFixed(0)}%</span>
          <div class="bar-chart__column bar-chart__column--success" style="height: ${v}%"></div>
          <span class="bar-chart__label">${weeks[i]}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// Admin: Configuración
async function loadAdminConfig() {
  try {
    const config = await GET('/api/admin/oauth');
    renderAdminConfig(config);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar configuración');
  }
}

function renderAdminConfig(config) {
  $('#config-client-id').value = config.client_id || '';
  $('#config-client-secret').value = ''; // Never show secret
  $('#config-redirect-uri').value = config.redirect_uri || 'http://localhost:3000/api/auth/google/callback';
  $('#config-sync-minutos').value = config.sync_minutos ?? 15;

  // System info
  $('#system-info').innerHTML = `
    <div class="setting-item">
      <span class="setting-item__label">Versión</span>
      <span style="font-family:var(--font-mono);">${config.version || '0.3.0'}</span>
    </div>
    <div class="setting-item">
      <span class="setting-item__label">Node.js</span>
      <span style="font-family:var(--font-mono);">${process.version || 'N/A'}</span>
    </div>
    <div class="setting-item">
      <span class="setting-item__label">Base de datos</span>
      <span>${config.db_path || 'database/capu.db'}</span>
    </div>
    <div class="setting-item">
      <span class="setting-item__label">Entorno</span>
      <span>${config.env || 'development'}</span>
    </div>
  `;
}

$('#btn-save-config').addEventListener('click', async () => {
  const data = {
    client_id: $('#config-client-id').value.trim(),
    client_secret: $('#config-client-secret').value || undefined,
    redirect_uri: $('#config-redirect-uri').value.trim(),
    sync_minutos: parseInt($('#config-sync-minutos').value, 10) || 0
  };

  if (!data.client_id) { showToast('Client ID es obligatorio', 'error'); return; }

  try {
    await POST('/api/admin/oauth', data);
    showToast('Configuración guardada', 'success');
    loadAdminConfig();
  } catch (e) { showToast(e.message, 'error'); }
});

$('#btn-test-oauth').addEventListener('click', async () => {
  const btn = $('#btn-test-oauth');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Probando...';
  try {
    await POST('/api/admin/oauth/test', {});
    showToast('Conexión exitosa', 'success');
  } catch (e) {
    showToast(e.message, 'error', 'Error de conexión');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
});

/* ============================================================
   INITIALIZATION
   ============================================================ */
async function initApp() {
  initTheme();

  // Check auth state
  try {
    const auth = await GET('/api/auth/google/estado');
    updateUserUI({ ...auth, googleConnected: auth.conectado });
  } catch {
    updateUserUI({ nombre: 'Estudiante Demo', correo: 'demo@capu.local', rol: 'estudiante', googleConnected: false });
  }

  // Initial navigation
  const initialPage = location.hash.slice(1) || 'agenda';
  if (pages[initialPage]) {
    navigate(initialPage, false);
  } else {
    navigate('agenda', false);
  }

  // Start alerts polling
  pollAlerts();

  // Update header tokens periodically
  setInterval(updateHeaderTokens, 60000);

  console.log('CAPU app initialized');
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Handle visibility change to refresh data
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && State.currentPage) {
    refreshCurrentPage();
  }
});

// Export for debugging
window.CAPU = { State, api: { GET, POST, PATCH, DELETE }, showToast, navigate, modals };