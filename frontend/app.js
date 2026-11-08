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
const fmtDateTime = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', timeZone: 'America/Tijuana'
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

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return map[c];
});

const avatarColorClass = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `avatar--${Math.abs(hash) % 8}`;
};

/* ---------- API Client ---------- */
function getAuthToken() {
  return localStorage.getItem('capu_token');
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem('capu_token', token);
  } else {
    localStorage.removeItem('capu_token');
  }
}

function clearAuth() {
  localStorage.removeItem('capu_token');
  localStorage.removeItem('capu_user');
}

async function api(method, path, body) {
  const headers = { 'content-type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // If 401, clear auth and redirect to login
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      clearAuth();
      window.location.href = '/#login';
    }
    throw Object.assign(new Error(data.error || 'Error en la petición'), { status: res.status });
  }
  return data;
}
const GET = (path) => api('GET', path);
const POST = (path, body) => api('POST', path, body);
const PATCH = (path, body) => api('PATCH', path, body);
const DELETE = (path) => api('DELETE', path);

/* ---------- Toast System ---------- */
function showToast(message, type = 'info', title = '') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <div class="toast__icon" aria-hidden="true">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</div>
    <div class="toast__content">
      ${title ? `<div class="toast__title">${esc(title)}</div>` : ''}
      <div class="toast__message">${esc(message)}</div>
    </div>
    <button class="toast__close" aria-label="Cerrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    <div class="toast__progress"></div>
  `;
  container.appendChild(toast);
  const progress = toast.querySelector('.toast__progress');
  progress.style.animation = 'toast-progress 4s linear forwards';
  toast.querySelector('.toast__close').addEventListener('click', () => toast.remove());
  setTimeout(() => toast.remove(), 4500);
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
    const cancelBtn = $('#confirm-modal-cancel');
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

/* ---------- Debounce helper ---------- */
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

/* ---------- Navigation / Routing ---------- */
const pages = {
  // Public pages (no auth required)
  register: { init: loadRegister, cleanup: () => {} },
  login: { init: loadLogin, cleanup: () => {} },
  'forgot-password': { init: loadForgotPassword, cleanup: () => {} },
  'reset-password': { init: loadResetPassword, cleanup: () => {} },
  // Protected pages (auth required)
  agenda: { init: loadAgenda, cleanup: () => {} },
  tokens: { init: loadTokens, cleanup: () => {} },
  resumen: { init: loadResumen, cleanup: () => {} },
  perfil: { init: loadPerfil, cleanup: () => {} },
  calendario: { init: loadCalendario, cleanup: () => {} },
  notificaciones: { init: loadNotificaciones, cleanup: () => {} },
  'admin-usuarios': { init: loadAdminUsuarios, cleanup: () => {} },
  'admin-cursos': { init: loadAdminCursos, cleanup: () => {} },
  'admin-recompensas': { init: loadAdminRecompensas, cleanup: () => {} },
  'admin-metricas': { init: loadAdminMetricas, cleanup: () => {} },
  'admin-config': { init: loadAdminConfig, cleanup: () => {} },
  'admin-tareas': { init: loadAdminTareas, cleanup: () => {} },
  'admin-auditoria': { init: loadAdminAuditoria, cleanup: () => {} }
};

// Public pages that don't require authentication
const PUBLIC_PAGES = ['register', 'login', 'forgot-password', 'reset-password'];

/**
 * Validate the current JWT token by calling /api/usuario/perfil
 * Returns user object if valid, null if invalid/expired
 */
async function validateToken() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const perfil = await GET('/api/usuario/perfil');
    return { ...perfil, googleConnected: perfil.googleConectado || false };
  } catch (e) {
    // Token invalid or expired
    clearAuth();
    return null;
  }
}

async function navigate(pageName, pushState = true) {
  if (!pages[pageName]) return;

  // Check authentication for protected pages
  const isPublicPage = PUBLIC_PAGES.includes(pageName);
  const hasToken = !!getAuthToken();

  if (!isPublicPage && !hasToken) {
    // Redirect to login if trying to access protected page without auth
    navigate('login', false);
    return;
  }

  // If authenticated user tries to access public auth pages, redirect to agenda
  if (isPublicPage && hasToken && pageName !== 'reset-password') {
    // Allow reset-password even if authenticated (token in URL)
    navigate('agenda', false);
    return;
  }

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

  // Update navigation visibility based on auth state
  updateNavigationVisibility(hasToken);

  // Initialize new page
  try {
    await pages[pageName].init();
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar página');
  }
}

function handleHashChange() {
  const hash = location.hash.slice(1) || 'login';
  if (pages[hash]) navigate(hash, false);
}

window.addEventListener('hashchange', handleHashChange);

/* ---------- Auth Navigation Visibility ---------- */
function updateNavigationVisibility(isAuthenticated) {
  const authOnlyElements = $$('.auth-only');
  const publicOnlyElements = $$('.public-only');

  authOnlyElements.forEach(el => {
    el.style.display = isAuthenticated ? '' : 'none';
  });
  publicOnlyElements.forEach(el => {
    el.style.display = isAuthenticated ? 'none' : '';
  });

  // Update bottom navigation for mobile
  const bottomNavAuth = $('#bottom-nav');
  const bottomNavPublic = $('#bottom-nav-public');
  if (bottomNavAuth) {
    bottomNavAuth.style.display = isAuthenticated ? 'block' : 'none';
  }
  if (bottomNavPublic) {
    bottomNavPublic.style.display = isAuthenticated ? 'none' : 'block';
  }
}

/* ---------- Theme Management ---------- */
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

  // Google connect button - handle both property names (backend returns googleConectado)
  const googleConnected = user?.googleConnected ?? user?.googleConectado ?? false;
  if (googleConnected) {
    $('#btn-google-connect-header').hidden = true;
    $('#btn-google-disconnect-header').hidden = false;
  } else {
    $('#btn-google-connect-header').hidden = false;
    $('#btn-google-disconnect-header').hidden = true;
  }

  // Admin nav items
  $$('.admin-nav-item').forEach(el => el.hidden = !State.isAdmin);
}

/* ---------- User Dropdown Menu Handlers ---------- */
function attachUserDropdownHandlers() {
  const userMenu = $('#user-menu');
  if (!userMenu) return;

  userMenu.querySelectorAll('[data-action]').forEach(item => {
    item.replaceWith(item.cloneNode(true));
  });

  // Profile action
  $('#user-menu [data-action="profile"]')?.addEventListener('click', () => {
    modals.close('user-dropdown');
    navigate('perfil');
  });

  // Sync action
  $('#user-menu [data-action="sync"]')?.addEventListener('click', async () => {
    modals.close('user-dropdown');
    try {
      const res = await POST('/api/sync');
      showToast(res.message || 'Sincronización completada', 'success');
      loadAgenda();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  // Logout action
  $('#user-menu [data-action="logout"]')?.addEventListener('click', async () => {
    modals.close('user-dropdown');
    if (await confirmAction('¿Cerrar sesión? Tendrás que iniciar sesión de nuevo.', 'Cerrar sesión', false)) {
      clearAuth();
      showToast('Sesión cerrada', 'success');
      navigate('login');
    }
  });

  // Disconnect Google action
  $('#user-menu [data-action="disconnect-google"]')?.addEventListener('click', async () => {
    modals.close('user-dropdown');
    if (await confirmAction('¿Desconectar tu cuenta de Google? Perderás la sincronización automática con Classroom.', 'Desconectar Google', true)) {
      try {
        await DELETE('/api/usuario/google');
        showToast('Google desconectado', 'success');
        loadPerfil();
      } catch (e) {
        showToast(e.message, 'error');
      }
    }
  });
}

// Attach handlers when DOM is ready
document.addEventListener('DOMContentLoaded', attachUserDropdownHandlers);

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
  if ($('#f-source').value) q.set('source', $('#f-source').value);

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

    card.querySelector('[data-complete]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const res = await POST(`/api/tareas/${id}/completar`);
        showToast(res.cantidad ? `¡Bien! Ganaste ${res.cantidad} tokens 🪙` : 'Entregada, pero fuera de tiempo: sin tokens', res.cantidad ? 'success' : 'warning');
        loadAgenda();
        updateHeaderTokens();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });

    // Click on card body to open detail modal (not on buttons/inputs/links)
    card.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, input, select, textarea');
      if (!target) {
        openTaskDetail(id);
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
  const isCustom = t.source === 'custom';

  const dueClass = isOverdue ? 'task-card__due--overdue' : isSoon ? 'task-card__due--soon' : '';
  const dueLabel = hecha ? `Entregada: ${esc(fmtDate.format(new Date(t.fecha_entrega)))}` : `Fecha límite: ${esc(fmtDate.format(dueDate))}`;

  const sourceBadge = isCustom ? `<span class="badge badge--custom task-card__source-badge">Personalizada</span>` : `<span class="badge badge--classroom task-card__source-badge">Classroom</span>`;

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
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <span class="badge badge--${estadoVis} task-card__badge">${ETIQUETA_ESTADO[estadoVis]}</span>
            ${sourceBadge}
          </div>
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

/* ---------- PAGE: TAREA DETALLE (MODAL) ---------- */
function openTaskDetail(id) {
  const modal = modals.open('task-detail-modal');
  loadTaskDetail(id);
}

async function loadTaskDetail(id) {
  try {
    const tarea = await GET(`/api/tareas/${id}`);
    renderTaskDetail(tarea);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar detalle');
    modals.close('task-detail-modal');
  }
}

function renderTaskDetail(t) {
  if (!t) return;

  const body = $('#task-detail-body');
  const btnComplete = $('#task-detail-complete');
  const linkClassroom = $('#task-detail-open-classroom');
  const btnEdit = $('#task-detail-edit');

  const hecha = t.estado === 'entregada';
  const dueDate = new Date(t.fecha_limite);
  const isOverdue = !hecha && dueDate < new Date();
  const isCustom = t.source === 'custom';

  // Title
  $('#task-detail-modal-title').textContent = t.titulo;

  // Course badge
  const courseColorValue = courseColor(t.id_curso);
  const badgeClass = `badge badge--${t.estado_visible} badge--lg`;

  // Format dates
  const fechaLimiteStr = fmtDate.format(dueDate);
  const fechaEntregaStr = t.fecha_entrega ? fmtDate.format(new Date(t.fecha_entrega)) : '—';

  // Progress ring
  const progressPct = t.avance_pct || 0;
  const ringColor = hecha ? 'var(--color-success)' : isOverdue ? 'var(--color-error)' : 'var(--color-primary)';

  const sourceBadge = isCustom ? `<span class="badge badge--custom" style="margin-left: var(--space-2);">Personalizada</span>` : `<span class="badge badge--classroom" style="margin-left: var(--space-2);">Classroom</span>`;

  body.innerHTML = `
    <div class="task-detail">
      <div class="task-detail__header">
        <div class="task-detail__course" style="border-left-color: ${courseColorValue};">
          <span class="task-detail__course-name">${esc(t.curso)}${sourceBadge}</span>
          <span class="${badgeClass}">${ETIQUETA_ESTADO[t.estado_visible]}</span>
        </div>
      </div>

      <div class="task-detail__progress-ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" stroke-width="8"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="${ringColor}" stroke-width="8"
            stroke-dasharray="${2 * Math.PI * 50}" stroke-dashoffset="${2 * Math.PI * 50 * (1 - progressPct / 100)}"
            stroke-linecap="round" style="transform: rotate(-90deg); transform-origin: 60px 60px;"/>
        </svg>
        <div class="task-detail__progress-center">${progressPct}%</div>
      </div>

      <div class="task-detail__meta-grid">
        <div class="task-detail__meta-item">
          <span class="task-detail__meta-label">Fecha límite</span>
          <span class="task-detail__meta-value ${isOverdue && !hecha ? 'task-detail__meta-value--overdue' : ''}">${esc(fechaLimiteStr)}</span>
        </div>
        <div class="task-detail__meta-item">
          <span class="task-detail__meta-label">Estado</span>
          <span class="task-detail__meta-value">${hecha ? `Entregada el ${esc(fechaEntregaStr)}` : (isOverdue ? 'Vencida' : 'Pendiente')}</span>
        </div>
        <div class="task-detail__meta-item">
          <span class="task-detail__meta-label">Avance actual</span>
          <span class="task-detail__meta-value">${progressPct}%</span>
        </div>
      </div>

      ${t.descripcion ? `
        <div class="task-detail__description">
          <h4>Descripción</h4>
          <div class="task-detail__description-text">${esc(t.descripcion)}</div>
        </div>
      ` : ''}

      <div class="task-detail__progress-slider">
        <label class="task-detail__slider-label" for="detail-progress-slider">Actualizar avance</label>
        <div class="task-detail__slider-wrapper">
          <input type="range" id="detail-progress-slider" class="task-detail__slider" min="0" max="100" step="5" value="${progressPct}" ${hecha ? 'disabled' : ''} aria-label="Porcentaje de avance">
          <output id="detail-progress-output" class="task-detail__slider-output">${progressPct}%</output>
        </div>
      </div>
    </div>
  `;

  // Show/hide buttons
  if (hecha) {
    btnComplete.hidden = true;
  } else {
    btnComplete.hidden = false;
  }

  // Classroom link only for classroom tasks
  if (t.enlace && !isCustom) {
    linkClassroom.hidden = false;
    linkClassroom.href = t.enlace;
  } else {
    linkClassroom.hidden = true;
  }

  // Edit button only for custom tasks
  if (isCustom && !hecha) {
    btnEdit.hidden = false;
  } else {
    btnEdit.hidden = true;
  }

  // Attach listeners
  attachTaskDetailListeners(t.id_tarea, hecha, isCustom);
}

function attachTaskDetailListeners(id, hecha, isCustom) {
  // Progress slider
  const slider = $('#detail-progress-slider');
  const output = $('#detail-progress-output');

  if (slider && !hecha) {
    slider.replaceWith(slider.cloneNode(true));
    const newSlider = $('#detail-progress-slider');
    newSlider.addEventListener('input', () => {
      output.textContent = newSlider.value + '%';
    });
    newSlider.addEventListener('change', debounce(async () => {
      try {
        await PATCH(`/api/tareas/${id}`, { avance_pct: Number(newSlider.value) });
        showToast('Avance actualizado', 'success');
        loadAgenda(); // Refresh the list
      } catch (e) {
        showToast(e.message, 'error');
      }
    }, 300));
  }

  // Complete button
  const btnComplete = $('#task-detail-complete');
  if (btnComplete && !hecha) {
    btnComplete.replaceWith(btnComplete.cloneNode(true));
    $('#task-detail-complete').addEventListener('click', async () => {
      try {
        const res = await POST(`/api/tareas/${id}/completar`);
        showToast(res.cantidad ? `¡Bien! Ganaste ${res.cantidad} tokens 🪙` : 'Entregada, pero fuera de tiempo: sin tokens', res.cantidad ? 'success' : 'warning');
        modals.close('task-detail-modal');
        loadAgenda();
        updateHeaderTokens();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }

  // Edit button for custom tasks
  const btnEdit = $('#task-detail-edit');
  if (btnEdit && isCustom && !hecha) {
    btnEdit.replaceWith(btnEdit.cloneNode(true));
    $('#task-detail-edit').addEventListener('click', () => {
      modals.close('task-detail-modal');
      openEditTaskModal(id);
    });
  }
}

/* ---------- CUSTOM TASKS (Crear/Editar) ---------- */

// Open Create Task Modal
async function openCreateTaskModal() {
  await loadCreateTaskForm();
  modals.open('create-task-modal');
  // Set min date to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $('#create-task-fecha-limite').min = now.toISOString().slice(0, 16);
}

// Load courses into create task form
async function loadCreateTaskForm() {
  try {
    const cursos = await GET('/api/cursos');
    const sel = $('#create-task-curso');
    sel.innerHTML = '<option value="">Sin curso asignado</option>' +
      cursos.map(c => `<option value="${c.id_curso}">${esc(c.nombre)}</option>`).join('');
  } catch (e) {
    console.error('Error loading courses for create task:', e);
  }
  // Reset form
  $('#create-task-form').reset();
  // Set default priority to media
  $('#create-task-form input[name="create-task-prioridad"][value="media"]').checked = true;
}

// Handle create task submit
async function handleCreateTaskSubmit(e) {
  e.preventDefault();
  const form = $('#create-task-form');

  // Validate
  const titulo = $('#create-task-titulo').value.trim();
  const fechaLimite = $('#create-task-fecha-limite').value;

  if (!titulo) {
    showError('create-task-titulo-error', 'El título es obligatorio');
    return;
  }
  if (!fechaLimite) {
    showError('create-task-fecha-error', 'La fecha límite es obligatoria');
    return;
  }

  // Clear errors
  clearError('create-task-titulo-error');
  clearError('create-task-fecha-error');

  const idCurso = $('#create-task-curso').value || null;
  const descripcion = $('#create-task-descripcion').value.trim() || null;
  const prioridad = form.querySelector('input[name="create-task-prioridad"]:checked').value;

  const btnSubmit = $('#create-task-submit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Creando...';

  try {
    await POST('/api/tareas/custom', {
      titulo,
      descripcion,
      fecha_limite: new Date(fechaLimite).toISOString(),
      id_curso: idCurso ? Number(idCurso) : undefined,
      prioridad
    });
    showToast('Tarea personalizada creada', 'success');
    modals.close('create-task-modal');
    loadAgenda();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Crear tarea
    `;
  }
}

// Open Edit Task Modal
async function openEditTaskModal(id) {
  try {
    const tarea = await GET(`/api/tareas/${id}`);
    if (!tarea || tarea.source !== 'custom') {
      showToast('Tarea no encontrada o no es personalizable', 'error');
      return;
    }
    await loadEditTaskForm(tarea);
    modals.open('edit-task-modal');
    // Set min date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#edit-task-fecha-limite').min = now.toISOString().slice(0, 16);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar tarea');
  }
}

// Load task data into edit form
async function loadEditTaskForm(tarea) {
  try {
    const cursos = await GET('/api/cursos');
    const sel = $('#edit-task-curso');
    sel.innerHTML = '<option value="">Sin curso asignado</option>' +
      cursos.map(c => `<option value="${c.id_curso}" ${c.id_curso === tarea.id_curso ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('');
  } catch (e) {
    console.error('Error loading courses for edit task:', e);
  }

  $('#edit-task-id').value = tarea.id_tarea;
  $('#edit-task-titulo').value = tarea.titulo;
  $('#edit-task-descripcion').value = tarea.descripcion || '';
  // Format date for datetime-local input
  if (tarea.fecha_limite) {
    const date = new Date(tarea.fecha_limite);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    $('#edit-task-fecha-limite').value = date.toISOString().slice(0, 16);
  }
  // Set priority (default to media if not set)
  const prioridad = tarea.prioridad || 'media';
  $(`#edit-task-form input[name="edit-task-prioridad"][value="${prioridad}"]`).checked = true;
}

// Handle edit task submit
async function handleEditTaskSubmit(e) {
  e.preventDefault();
  const form = $('#edit-task-form');

  // Validate
  const titulo = $('#edit-task-titulo').value.trim();
  const fechaLimite = $('#edit-task-fecha-limite').value;

  if (!titulo) {
    showError('edit-task-titulo-error', 'El título es obligatorio');
    return;
  }
  if (!fechaLimite) {
    showError('edit-task-fecha-error', 'La fecha límite es obligatoria');
    return;
  }

  // Clear errors
  clearError('edit-task-titulo-error');
  clearError('edit-task-fecha-error');

  const id = Number($('#edit-task-id').value);
  const idCurso = $('#edit-task-curso').value || null;
  const descripcion = $('#edit-task-descripcion').value.trim() || null;
  const prioridad = form.querySelector('input[name="edit-task-prioridad"]:checked').value;

  const btnSubmit = $('#edit-task-submit');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Guardando...';

  try {
    await PATCH(`/api/tareas/custom/${id}`, {
      titulo,
      descripcion,
      fecha_limite: new Date(fechaLimite).toISOString(),
      id_curso: idCurso ? Number(idCurso) : undefined,
      prioridad
    });
    showToast('Tarea actualizada', 'success');
    modals.close('edit-task-modal');
    loadAgenda();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Guardar cambios';
  }
}

// Handle delete custom task
async function handleDeleteTaskCustom(id) {
  if (await confirmAction('¿Eliminar esta tarea personalizada? Esta acción no se puede deshacer.', 'Eliminar tarea personalizada', true)) {
    try {
      await DELETE(`/api/tareas/custom/${id}`);
      showToast('Tarea eliminada', 'success');
      modals.close('edit-task-modal');
      loadAgenda();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
}

// Helper functions for form validation
function showError(id, message) {
  const el = $(`#${id}`);
  if (el) {
    el.textContent = message;
    el.hidden = false;
    el.previousElementSibling?.classList.add('form-input--error');
  }
}

function clearError(id) {
  const el = $(`#${id}`);
  if (el) {
    el.hidden = true;
    el.previousElementSibling?.classList.remove('form-input--error');
  }
}

/* ---------- PAGE: PERFIL ---------- */
async function loadPerfil() {
  try {
    const perfil = await GET('/api/usuario/perfil');
    renderPerfil(perfil);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar perfil');
  }
}

function renderPerfil(perfil) {
  if (!perfil) return;

  // Avatar grande con iniciales
  const avatarEl = $('#perfil-avatar-large');
  const iniciales = perfil.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  avatarEl.textContent = iniciales;
  avatarEl.className = `avatar avatar--xl ${avatarColorClass(perfil.nombre)}`;
  avatarEl.setAttribute('aria-label', `Avatar de ${perfil.nombre}`);

  // Datos personales
  $('#perfil-nombre').value = perfil.nombre;
  $('#perfil-correo').value = perfil.correo;
  $('#perfil-rol').value = perfil.rol === 'admin' ? 'Administrador' : 'Estudiante';

  // Google conexión
  const googleStatus = $('#perfil-google-status');
  const btnConnect = $('#btn-google-connect');
  const btnDisconnect = $('#btn-google-disconnect');

  if (perfil.googleConectado) {
    googleStatus.textContent = 'Conectado ✓';
    googleStatus.style.color = 'var(--color-success)';
    btnConnect.hidden = true;
    btnDisconnect.hidden = false;
  } else {
    googleStatus.textContent = 'No conectado';
    googleStatus.style.color = 'var(--color-text-muted)';
    btnConnect.hidden = false;
    btnDisconnect.hidden = true;
  }

  // Preferencias de notificaciones
  renderPreferencias(perfil.preferencias_notificaciones);

  // Event listeners
  attachPerfilListeners();
}

function renderPreferencias(prefs) {
  const grid = $('#preferencias-grid');
  const opciones = [
    { key: 'push', label: 'Notificaciones push', desc: 'Recibir avisos en el navegador', icon: '🔔' },
    { key: 'correo', label: 'Notificaciones por correo', desc: 'Enviar avisos a tu email', icon: '📧' },
    { key: 'recordatorio_24h', label: 'Recordatorio 24 horas antes', desc: 'Aviso un día antes de la entrega', icon: '⏰' },
    { key: 'recordatorio_1h', label: 'Recordatorio 1 hora antes', desc: 'Aviso una hora antes de la entrega', icon: '⏱️' }
  ];

  grid.innerHTML = opciones.map(opt => `
    <label class="setting-item form-check" style="flex-direction: row; align-items: flex-start; gap: var(--space-3);">
      <span style="font-size: 1.5rem; flex-shrink: 0;" aria-hidden="true">${opt.icon}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 500; color: var(--color-text);">${esc(opt.label)}</div>
        <div class="setting-item__help">${esc(opt.desc)}</div>
      </div>
      <input type="checkbox" class="form-check-input" id="pref-${opt.key}" name="pref-${opt.key}" ${prefs[opt.key] ? 'checked' : ''} data-pref-key="${opt.key}">
      <span class="form-check-label" style="position: absolute; width: 1px; height: 1px; overflow: hidden;">${esc(opt.label)}</span>
    </label>
  `).join('');
}

function attachPerfilListeners() {
  // Guardar perfil (nombre)
  const btnGuardar = $('#btn-guardar-perfil');
  if (btnGuardar) {
    btnGuardar.replaceWith(btnGuardar.cloneNode(true));
    $('#btn-guardar-perfil').addEventListener('click', async () => {
      const nombre = $('#perfil-nombre').value.trim();
      if (!nombre) {
        showToast('El nombre es obligatorio', 'error');
        return;
      }
      try {
        await PATCH('/api/usuario/perfil', { nombre });
        showToast('Perfil actualizado', 'success');
        loadPerfil(); // Recargar para actualizar header/sidebar
        // Actualizar header si hay función
        if (typeof updateHeaderTokens === 'function') updateHeaderTokens();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }

  // Preferencias toggles
  document.querySelectorAll('#preferencias-grid input[type="checkbox"]').forEach(cb => {
    cb.replaceWith(cb.cloneNode(true));
    document.querySelector(`#pref-${cb.dataset.prefKey}`).addEventListener('change', async () => {
      const key = cb.dataset.prefKey;
      const value = cb.checked;
      try {
        await PATCH('/api/usuario/preferencias', { [key]: value });
        showToast('Preferencia guardada', 'success');
      } catch (e) {
        showToast(e.message, 'error');
        cb.checked = !value; // Revert on error
      }
    });
  });

  // Desconectar Google
  const btnGoogleDisconnect = $('#btn-google-disconnect');
  if (btnGoogleDisconnect) {
    btnGoogleDisconnect.replaceWith(btnGoogleDisconnect.cloneNode(true));
    $('#btn-google-disconnect').addEventListener('click', async () => {
      if (await confirmAction('¿Desconectar tu cuenta de Google? Perderás la sincronización automática con Classroom.', 'Desconectar Google', true)) {
        try {
          await DELETE('/api/usuario/google');
          showToast('Google desconectado', 'success');
          loadPerfil();
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    });
  }

  // Cerrar sesión
  const btnCerrarSesion = $('#btn-cerrar-sesion');
  if (btnCerrarSesion) {
    btnCerrarSesion.replaceWith(btnCerrarSesion.cloneNode(true));
    $('#btn-cerrar-sesion').addEventListener('click', async () => {
      if (await confirmAction('¿Cerrar sesión? Tendrás que iniciar sesión de nuevo.', 'Cerrar sesión', false)) {
        // Limpiar estado local
        clearAuth();
        showToast('Sesión cerrada', 'success');
        // Redirigir a login
        navigate('login');
      }
    });
  }

  // Eliminar cuenta
  const btnEliminarCuenta = $('#btn-eliminar-cuenta');
  if (btnEliminarCuenta) {
    btnEliminarCuenta.replaceWith(btnEliminarCuenta.cloneNode(true));
    $('#btn-eliminar-cuenta').addEventListener('click', async () => {
      // Doble confirmación para acción destructiva
      const first = await confirmAction('¿Eliminar tu cuenta PERMANENTEMENTE? Se borrarán todos tus datos, tareas, tokens y preferencias. Esta acción NO SE PUEDE DESHACER.', 'Eliminar cuenta', true);
      if (!first) return;

      // Segunda confirmación con prompt
      const input = prompt('ÚLTIMA CONFIRMACIÓN: Escribe "ELIMINAR" para confirmar la eliminación permanente de tu cuenta:');
      if (input !== 'ELIMINAR') {
        showToast('Eliminación cancelada: el texto no coincide', 'warning');
        return;
      }

      try {
        await DELETE('/api/usuario/cuenta');
        showToast('Cuenta eliminada', 'success');
        localStorage.clear();
        window.location.href = '/';
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }
}

/* ============================================================
   AUTH PAGES (Register, Login, Forgot Password, Reset Password)
   ============================================================ */

/* ----- PAGE: REGISTER ----- */
async function loadRegister() {
  renderRegister();
  attachRegisterListeners();
}

function renderRegister() {
  // Clear any previous error states
  const form = $('#register-form');
  if (form) form.reset();
}

function attachRegisterListeners() {
  const form = $('#register-form');
  if (!form) return;

  form.replaceWith(form.cloneNode(true));
  const newForm = $('#register-form');

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = $('#register-nombre').value.trim();
    const correo = $('#register-correo').value.trim().toLowerCase();
    const password = $('#register-password').value;
    const passwordConfirm = $('#register-password-confirm').value;
    const terminos = $('#register-terminos').checked;

    // Clear previous errors
    clearError('register-nombre-error');
    clearError('register-correo-error');
    clearError('register-password-error');
    clearError('register-password-confirm-error');
    clearError('register-terminos-error');

    // Validate
    let hasError = false;

    if (!nombre) {
      showError('register-nombre-error', 'El nombre es obligatorio');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo) {
      showError('register-correo-error', 'El email es obligatorio');
      hasError = true;
    } else if (!emailRegex.test(correo)) {
      showError('register-correo-error', 'Email inválido');
      hasError = true;
    }

    if (!password) {
      showError('register-password-error', 'La contraseña es obligatoria');
      hasError = true;
    } else if (password.length < 8) {
      showError('register-password-error', 'La contraseña debe tener al menos 8 caracteres');
      hasError = true;
    }

    if (password !== passwordConfirm) {
      showError('register-password-confirm-error', 'Las contraseñas no coinciden');
      hasError = true;
    }

    if (!terminos) {
      showError('register-terminos-error', 'Debes aceptar los términos y condiciones');
      hasError = true;
    }

    if (hasError) return;

    const btnSubmit = $('#register-submit');
    btnSubmit.disabled = true;
    btnSubmit.classList.add('btn--loading');

    try {
      const res = await POST('/api/auth/registro', { nombre, correo, password });
      setAuthToken(res.token);
      showToast(res.mensaje, 'success');
      // Navigate to agenda
      navigate('agenda');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('btn--loading');
    }
  });
}

/* ----- PAGE: LOGIN ----- */
async function loadLogin() {
  renderLogin();
  attachLoginListeners();
}

function renderLogin() {
  const form = $('#login-form');
  if (form) form.reset();
}

function attachLoginListeners() {
  const form = $('#login-form');
  if (!form) return;

  form.replaceWith(form.cloneNode(true));
  const newForm = $('#login-form');

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = $('#login-correo').value.trim().toLowerCase();
    const password = $('#login-password').value;

    // Clear previous errors
    clearError('login-correo-error');
    clearError('login-password-error');

    // Validate
    let hasError = false;

    if (!correo) {
      showError('login-correo-error', 'El email es obligatorio');
      hasError = true;
    }

    if (!password) {
      showError('login-password-error', 'La contraseña es obligatoria');
      hasError = true;
    }

    if (hasError) return;

    const btnSubmit = $('#login-submit');
    btnSubmit.disabled = true;
    btnSubmit.classList.add('btn--loading');

    try {
      const res = await POST('/api/auth/login', { correo, password });
      setAuthToken(res.token);
      showToast('Sesión iniciada correctamente', 'success');
      // Redirect based on role
      if (res.usuario.rol === 'admin') {
        navigate('admin-usuarios');
      } else {
        navigate('agenda');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('btn--loading');
    }
  });
}

/* ----- PAGE: FORGOT PASSWORD ----- */
async function loadForgotPassword() {
  renderForgotPassword();
  attachForgotPasswordListeners();
}

function renderForgotPassword() {
  const form = $('#forgot-password-form');
  if (form) form.reset();
}

function attachForgotPasswordListeners() {
  const form = $('#forgot-password-form');
  if (!form) return;

  form.replaceWith(form.cloneNode(true));
  const newForm = $('#forgot-password-form');

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = $('#forgot-correo').value.trim().toLowerCase();

    // Clear previous errors
    clearError('forgot-correo-error');

    // Validate
    if (!correo) {
      showError('forgot-correo-error', 'El email es obligatorio');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      showError('forgot-correo-error', 'Email inválido');
      return;
    }

    const btnSubmit = $('#forgot-password-submit');
    btnSubmit.disabled = true;
    btnSubmit.classList.add('btn--loading');

    try {
      const res = await POST('/api/auth/olvide-password', { correo });
      showToast(res.mensaje, 'success');
      // Navigate to login after a delay
      setTimeout(() => navigate('login'), 2000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('btn--loading');
    }
  });
}

/* ----- PAGE: RESET PASSWORD ----- */
async function loadResetPassword() {
  renderResetPassword();
  attachResetPasswordListeners();
}

function renderResetPassword() {
  const form = $('#reset-password-form');
  if (form) form.reset();

  // Extract token from URL hash
  const hash = location.hash.slice(1);
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const token = params.get('token') || params.get('t');

  if (token) {
    $('#reset-password-token').value = token;
  } else {
    showToast('Token de restablecimiento requerido', 'error');
    setTimeout(() => navigate('forgot-password'), 2000);
  }
}

function attachResetPasswordListeners() {
  const form = $('#reset-password-form');
  if (!form) return;

  form.replaceWith(form.cloneNode(true));
  const newForm = $('#reset-password-form');

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = $('#reset-password-token').value;
    const password = $('#reset-password').value;
    const passwordConfirm = $('#reset-password-confirm').value;

    // Clear previous errors
    clearError('reset-password-error');
    clearError('reset-password-confirm-error');

    // Validate
    let hasError = false;

    if (!token) {
      showToast('Token de restablecimiento requerido', 'error');
      return;
    }

    if (!password) {
      showError('reset-password-error', 'La nueva contraseña es obligatoria');
      hasError = true;
    } else if (password.length < 8) {
      showError('reset-password-error', 'La contraseña debe tener al menos 8 caracteres');
      hasError = true;
    }

    if (password !== passwordConfirm) {
      showError('reset-password-confirm-error', 'Las contraseñas no coinciden');
      hasError = true;
    }

    if (hasError) return;

    const btnSubmit = $('#reset-password-submit');
    btnSubmit.disabled = true;
    btnSubmit.classList.add('btn--loading');

    try {
      const res = await POST('/api/auth/reset-password', { token, password });
      showToast(res.mensaje, 'success');
      // Navigate to login after a delay
      setTimeout(() => navigate('login'), 2000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('btn--loading');
    }
  });
}

/* ---------- Header Tokens Update ---------- */
async function updateHeaderTokens() {
  try {
    const t = await GET('/api/tokens');
    $('#saldo-tokens').textContent = t.saldo_tokens;
    $('#racha-dias').textContent = t.racha_dias;
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
      <td data-label="Propietario">${esc(c.usuario_nombre)}</td>
      <td data-label="Classroom ID">${esc(c.classroom_id)}</td>
      <td data-label="Tareas">${c.tareas_count || 0}</td>
      <td data-label="Última sincronización">${c.ultima_sync ? fmtDateShort.format(new Date(c.ultima_sync)) : '—'}</td>
    </tr>
  `).join('');
}

// Admin: Recompensas
async function loadAdminRecompensas() {
  try {
    const recompensas = await GET('/api/admin/recompensas');
    renderAdminRecompensas(recompensas);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar recompensas');
  }
}

function renderAdminRecompensas(recompensas) {
  const grid = $('#admin-rewards-grid');
  const empty = $('#empty-admin-rewards');

  if (!recompensas.length) {
    grid.innerHTML = '';
    grid.hidden = true;
    empty.hidden = false;
    return;
  }
  grid.hidden = false;
  empty.hidden = true;

  grid.innerHTML = recompensas.map(r => `
    <article class="reward-card" data-reward-id="${r.id_recompensa}">
      <div class="reward-card__header">
        <h3 class="reward-card__name">${esc(r.nombre)}</h3>
        <span class="badge badge--${r.activa ? 'success' : 'secondary'}">${r.activa ? 'Activa' : 'Inactiva'}</span>
      </div>
      <div class="reward-card__cost">${esc(r.costo_tokens)} 🪙</div>
      <div class="reward-card__actions">
        <button class="btn btn--ghost btn--sm" data-edit-reward aria-label="Editar recompensa"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/></svg></button>
        <button class="btn btn--danger btn--sm" data-delete-reward aria-label="Eliminar recompensa"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-edit-reward]').forEach(btn => {
    btn.addEventListener('click', () => openRewardModal(btn.closest('.reward-card').dataset.rewardId));
  });
  grid.querySelectorAll('[data-delete-reward]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('.reward-card').dataset.rewardId;
      if (await confirmAction('¿Eliminar esta recompensa?', 'Eliminar recompensa', true)) {
        try {
          await DELETE(`/api/admin/recompensas/${id}`);
          showToast('Recompensa eliminada', 'success');
          loadAdminRecompensas();
        } catch (e) { showToast(e.message, 'error'); }
      }
    });
  });
}

// Admin: Reward Modal
function openRewardModal(id = null) {
  const form = $('#reward-form');
  form.reset();
  $('#reward-id').value = id || '';
  $('#reward-modal-title').textContent = id ? 'Editar recompensa' : 'Nueva recompensa';
  $('#reward-submit').textContent = id ? 'Actualizar' : 'Crear';
  $('#reward-active').checked = true;

  if (id) {
    GET(`/api/admin/recompensas/${id}`).then(r => {
      $('#reward-name').value = r.nombre;
      $('#reward-cost').value = r.costo_tokens;
      $('#reward-active').checked = r.activa;
    }).catch(e => showToast(e.message, 'error'));
  }

  modals.open('reward-modal');
}

$('#reward-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#reward-id').value;
  const data = {
    nombre: $('#reward-name').value.trim(),
    costo_tokens: Number($('#reward-cost').value),
    activa: $('#reward-active').checked
  };
  if (!data.nombre || !data.costo_tokens) return;

  try {
    if (id) {
      await PATCH(`/api/admin/recompensas/${id}`, data);
      showToast('Recompensa actualizada', 'success');
    } else {
      await POST('/api/admin/recompensas', data);
      showToast('Recompensa creada', 'success');
    }
    modals.close('reward-modal');
    loadAdminRecompensas();
  } catch (e) {
    showToast(e.message, 'error');
  }
});

$('#btn-add-reward').addEventListener('click', () => openRewardModal());
$('#empty-add-reward-btn').addEventListener('click', () => openRewardModal());

// Admin: Métricas
async function loadAdminMetricas() {
  try {
    const metricas = await GET('/api/admin/metricas');
    renderAdminMetricas(metricas);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar métricas');
  }
}

function renderAdminMetricas(m) {
  const overview = $('#admin-metrics-overview');
  const items = [
    { value: m.total_usuarios || 0, label: 'Usuarios totales', icon: '👥', color: 'primary' },
    { value: m.usuarios_admin || 0, label: 'Administradores', icon: '🛡️', color: 'warning' },
    { value: m.cursos || 0, label: 'Cursos', icon: '📚', color: 'success' },
    { value: m.tareas || 0, label: 'Tareas', icon: '📋', color: 'primary' },
    { value: m.tareas_entregadas || 0, label: 'Entregadas', icon: '✅', color: 'success' },
    { value: m.tareas_pendientes || 0, label: 'Pendientes', icon: '⏳', color: 'warning' },
    { value: m.tokens_totales || 0, label: 'Tokens totales', icon: '🪙', color: 'primary' },
    { value: m.recompensas || 0, label: 'Recompensas', icon: '🎁', color: 'success' }
  ];

  overview.innerHTML = items.map(item => `
    <article class="metric-card">
      <header class="metric-card__header">
        <span class="metric-card__title">${esc(item.label)}</span>
        <span aria-hidden="true" style="font-size: 1.5rem;">${item.icon}</span>
      </header>
      <div class="metric-card__value">${esc(item.value.toLocaleString())}</div>
    </article>
  `).join('');

  // Charts
  renderAdminCharts(m);
}

function renderAdminCharts(m) {
  // Usuarios activos
  const activeUsers = $('#chart-admin-active-users');
  const days = 30;
  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  const activeData = labels.map(() => Math.floor(Math.random() * 20) + 5);

  activeUsers.innerHTML = `
    <div class="line-chart" role="img" aria-label="Usuarios activos últimos 30 días">
      ${activeData.map((v, i) => `
        <div class="line-chart__point" style="left: ${(i / (days - 1)) * 100}%; bottom: ${(v / Math.max(...activeData)) * 100}%;" title="${labels[i]}: ${v}"></div>
      `).join('')}
      <div class="line-chart__line" style="--points: ${activeData.map((v, i) => `${(i / (days - 1)) * 100}% ${100 - (v / Math.max(...activeData)) * 100}%`).join(', ')};"></div>
      <div class="line-chart__labels">${labels.map((l, i) => i % 5 === 0 ? `<span style="left: ${(i / (days - 1)) * 100}%">${esc(l)}</span>` : '').join('')}</div>
    </div>
  `;

  // Sync rate
  const syncRate = $('#chart-admin-sync-rate');
  const syncLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const syncData = syncLabels.map(() => Math.floor(Math.random() * 30) + 70);

  syncRate.innerHTML = `
    <div class="bar-chart" role="img" aria-label="Tasa de éxito de sincronización por día">
      ${syncData.map((v, i) => `
        <div class="bar-chart__bar">
          <span class="bar-chart__value">${v}%</span>
          <div class="bar-chart__column" style="height: ${v}%"></div>
          <span class="bar-chart__label">${syncLabels[i]}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// Admin: Config
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
  $('#config-client-secret').value = config.client_secret || '';
  $('#config-redirect-uri').value = config.redirect_uri || 'http://localhost:3000/api/auth/google/callback';
  $('#config-sync-minutos').value = config.sync_minutos || 15;

  // System info
  const sysInfo = $('#system-info');
  sysInfo.innerHTML = `
    <div class="setting-item">
      <label class="setting-item__label">Versión</label>
      <span class="setting-item__value">0.3.0</span>
    </div>
    <div class="setting-item">
      <label class="setting-item__label">Entorno</label>
      <span class="setting-item__value">Desarrollo</span>
    </div>
    <div class="setting-item">
      <label class="setting-item__label">Base de datos</label>
      <span class="setting-item__value">SQLite</span>
    </div>
    <div class="setting-item">
      <label class="setting-item__label">Node.js</label>
      <span class="setting-item__value">${process.version}</span>
    </div>
  `;
}

$('#btn-save-config').addEventListener('click', async () => {
  const data = {
    client_id: $('#config-client-id').value.trim(),
    client_secret: $('#config-client-secret').value.trim(),
    redirect_uri: $('#config-redirect-uri').value.trim(),
    sync_minutos: Number($('#config-sync-minutos').value)
  };
  try {
    await POST('/api/admin/oauth', data);
    showToast('Configuración guardada', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
});

$('#btn-test-oauth').addEventListener('click', async () => {
  const config = {
    client_id: $('#config-client-id').value.trim(),
    client_secret: $('#config-client-secret').value.trim(),
    redirect_uri: $('#config-redirect-uri').value.trim()
  };
  try {
    const res = await POST('/api/admin/oauth/test', config);
    showToast(res.ok ? 'Conexión exitosa' : 'Error de conexión', res.ok ? 'success' : 'error');
  } catch (e) {
    showToast(e.message, 'error');
  }
});

/* ---------- PAGE: ADMIN TAREAS ---------- */

let adminTasksState = {
  currentPage: 1,
  pageSize: 20,
  totalItems: 0,
  filters: {
    usuario: '',
    curso: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: ''
  }
};

async function loadAdminTareas() {
  // Load filter options (usuarios, cursos)
  await loadAdminTaskFilters();

  // Attach event listeners
  attachAdminTaskListeners();

  // Load first page
  await loadAdminTasksPage(1);
}

async function loadAdminTaskFilters() {
  try {
    // Load usuarios for filter
    const usuarios = await GET('/api/admin/usuarios');
    const usuarioSelect = $('#admin-task-filter-usuario');
    const usuarioModalSelect = $('#admin-task-usuario');
    if (usuarioSelect) {
      usuarioSelect.innerHTML = '<option value="">Todos los usuarios</option>' +
        usuarios.map(u => `<option value="${u.id_usuario}">${esc(u.nombre)} (${esc(u.correo)})</option>`).join('');
    }
    if (usuarioModalSelect) {
      usuarioModalSelect.innerHTML = '<option value="">Seleccionar usuario</option>' +
        usuarios.map(u => `<option value="${u.id_usuario}">${esc(u.nombre)} (${esc(u.correo)})</option>`).join('');
    }

    // Load cursos for filter
    const cursos = await GET('/api/admin/cursos');
    const cursoSelect = $('#admin-task-filter-curso');
    if (cursoSelect) {
      cursoSelect.innerHTML = '<option value="">Todos los cursos</option>' +
        cursos.map(c => `<option value="${c.id_curso}">${esc(c.nombre)}</option>`).join('');
    }
  } catch (e) {
    console.error('Error loading admin task filters:', e);
  }
}

function attachAdminTaskListeners() {
  // Filter form
  const filterUsuario = $('#admin-task-filter-usuario');
  const filterCurso = $('#admin-task-filter-curso');
  const filterEstado = $('#admin-task-filter-estado');
  const filterDesde = $('#admin-task-filter-desde');
  const filterHasta = $('#admin-task-filter-hasta');
  const btnClear = $('#btn-admin-task-filter-clear');

  [filterUsuario, filterCurso, filterEstado, filterDesde, filterHasta].forEach(el => {
    if (el) {
      el.replaceWith(el.cloneNode(true));
    }
  });

  // Re-get elements after cloning
  const newFilterUsuario = $('#admin-task-filter-usuario');
  const newFilterCurso = $('#admin-task-filter-curso');
  const newFilterEstado = $('#admin-task-filter-estado');
  const newFilterDesde = $('#admin-task-filter-desde');
  const newFilterHasta = $('#admin-task-filter-hasta');
  const newBtnClear = $('#btn-admin-task-filter-clear');

  [newFilterUsuario, newFilterCurso, newFilterEstado, newFilterDesde, newFilterHasta].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        adminTasksState.filters.usuario = newFilterUsuario.value;
        adminTasksState.filters.curso = newFilterCurso.value;
        adminTasksState.filters.estado = newFilterEstado.value;
        adminTasksState.filters.fechaDesde = newFilterDesde.value;
        adminTasksState.filters.fechaHasta = newFilterHasta.value;
        adminTasksState.currentPage = 1;
        loadAdminTasksPage(1);
      });
    }
  });

  if (newBtnClear) {
    newBtnClear.replaceWith(newBtnClear.cloneNode(true));
    $('#btn-admin-task-filter-clear').addEventListener('click', () => {
      adminTasksState.filters = {
        usuario: '', curso: '', estado: '', fechaDesde: '', fechaHasta: ''
      };
      adminTasksState.currentPage = 1;
      if (newFilterUsuario) newFilterUsuario.value = '';
      if (newFilterCurso) newFilterCurso.value = '';
      if (newFilterEstado) newFilterEstado.value = '';
      if (newFilterDesde) newFilterDesde.value = '';
      if (newFilterHasta) newFilterHasta.value = '';
      loadAdminTasksPage(1);
    });
  }

  // Create task button
  const btnCreate = $('#btn-admin-task-create');
  if (btnCreate) {
    btnCreate.replaceWith(btnCreate.cloneNode(true));
    $('#btn-admin-task-create').addEventListener('click', () => openAdminTaskModal());
  }

  // Pagination
  const btnPrev = $('#admin-tasks-btn-prev');
  const btnNext = $('#admin-tasks-btn-next');

  if (btnPrev) {
    btnPrev.replaceWith(btnPrev.cloneNode(true));
    $('#admin-tasks-btn-prev').addEventListener('click', () => {
      if (adminTasksState.currentPage > 1) {
        loadAdminTasksPage(adminTasksState.currentPage - 1);
      }
    });
  }
  if (btnNext) {
    btnNext.replaceWith(btnNext.cloneNode(true));
    $('#admin-tasks-btn-next').addEventListener('click', () => {
      const totalPages = Math.ceil(adminTasksState.totalItems / adminTasksState.pageSize);
      if (adminTasksState.currentPage < totalPages) {
        loadAdminTasksPage(adminTasksState.currentPage + 1);
      }
    });
  }

  // Admin task modal form
  const modal = $('#admin-task-modal');
  const form = $('#admin-task-form');
  const usuarioSelect = $('#admin-task-usuario');
  const cursoSelect = $('#admin-task-curso');

  if (usuarioSelect) {
    usuarioSelect.addEventListener('change', async () => {
      const userId = usuarioSelect.value;
      if (userId) {
        // Load cursos for this user
        try {
          const cursos = await GET(`/api/admin/cursos`);
          const userCursos = cursos.filter(c => c.id_usuario == userId);
          cursoSelect.innerHTML = '<option value="">Seleccionar curso</option>' +
            userCursos.map(c => `<option value="${c.id_curso}">${esc(c.nombre)}</option>`).join('');
          cursoSelect.disabled = false;
        } catch (e) {
          cursoSelect.innerHTML = '<option value="">Error al cargar cursos</option>';
          cursoSelect.disabled = true;
        }
      } else {
        cursoSelect.innerHTML = '<option value="">Primero selecciona un usuario</option>';
        cursoSelect.disabled = true;
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveAdminTask();
    });
  }

  // Close modal handlers
  modal?.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
    btn.addEventListener('click', closeAdminTaskModal);
  });
}

async function loadAdminTasksPage(page) {
  adminTasksState.currentPage = page;

  const { usuario, curso, estado, fechaDesde, fechaHasta } = adminTasksState.filters;

  try {
    const params = new URLSearchParams({
      limit: String(adminTasksState.pageSize),
      offset: String((page - 1) * adminTasksState.pageSize)
    });
    if (usuario) params.append('usuario', usuario);
    if (curso) params.append('curso', curso);
    if (estado) params.append('estado', estado);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const res = await GET(`/api/admin/tareas?${params.toString()}`);
    adminTasksState.totalItems = res.total;
    renderAdminTasksTable(res.items);
    renderAdminTasksPagination();
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar tareas');
    const tbody = $('#admin-tasks-tbody');
    const empty = $('#admin-tasks-empty');
    const table = $('#admin-tasks-table-container');
    if (tbody) tbody.innerHTML = '';
    if (table) table.hidden = true;
    if (empty) empty.hidden = false;
  }
}

function renderAdminTasksTable(tasks) {
  const tbody = $('#admin-tasks-tbody');
  const empty = $('#admin-tasks-empty');
  const table = $('#admin-tasks-table-container');

  if (!tasks.length) {
    if (tbody) tbody.innerHTML = '';
    if (table) table.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  if (table) table.hidden = false;
  if (empty) empty.hidden = true;

  const estadoLabels = {
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    vencida: 'Vencida',
    entregada: 'Entregada'
  };

  const estadoClasses = {
    pendiente: 'badge--pending',
    en_progreso: 'badge--in-progress',
    vencida: 'badge--overdue',
    entregada: 'badge--done'
  };

  const sourceLabels = {
    classroom: 'Classroom',
    custom: 'Personalizada',
    admin: 'Admin'
  };

  tbody.innerHTML = tasks.map(task => `
    <tr data-task-id="${task.id_tarea}">
      <td>
        <div style="font-weight: 500;">${esc(task.titulo)}</div>
        ${task.descripcion ? `<div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: 2px;">${esc(task.descripcion.slice(0, 100))}${task.descripcion.length > 100 ? '...' : ''}</div>` : ''}
      </td>
      <td>${esc(task.usuario_nombre || 'N/A')}<br><small style="color: var(--color-text-secondary);">${esc(task.usuario_correo || '')}</small></td>
      <td>${esc(task.curso_nombre || 'N/A')}</td>
      <td><span class="badge ${estadoClasses[task.estado] || ''}">${estadoLabels[task.estado] || task.estado}</span></td>
      <td>${task.fecha_limite ? fmtDateTime.format(new Date(task.fecha_limite)) : 'Sin fecha'}</td>
      <td><span class="badge badge--${task.source || 'custom'}">${sourceLabels[task.source] || task.source}</span></td>
      <td>
        <div class="task-actions">
          <button class="btn btn--ghost btn--sm btn-edit-task" data-task-id="${task.id_tarea}" aria-label="Editar tarea">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn--ghost btn--sm btn-delete-task" data-task-id="${task.id_tarea}" aria-label="Eliminar tarea">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach click listeners for edit/delete
  tbody.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', () => openAdminTaskModal(btn.dataset.taskId));
  });

  tbody.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', async () => {
      const taskId = btn.dataset.taskId;
      if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
        try {
          await DELETE(`/api/admin/tareas/${taskId}`);
          showToast('Tarea eliminada', 'success');
          loadAdminTasksPage(adminTasksState.currentPage);
        } catch (e) {
          showToast(e.message, 'error', 'Error al eliminar tarea');
        }
      }
    });
  });
}

function renderAdminTasksPagination() {
  const pagination = $('#admin-tasks-pagination');
  const btnPrev = $('#admin-tasks-btn-prev');
  const btnNext = $('#admin-tasks-btn-next');
  const info = $('#admin-tasks-pagination-info');

  const totalPages = Math.ceil(adminTasksState.totalItems / adminTasksState.pageSize);

  if (totalPages <= 1) {
    if (pagination) pagination.hidden = true;
    return;
  }

  if (pagination) pagination.hidden = false;
  if (btnPrev) btnPrev.disabled = adminTasksState.currentPage <= 1;
  if (btnNext) btnNext.disabled = adminTasksState.currentPage >= totalPages;
  if (info) info.textContent = `Página ${adminTasksState.currentPage} de ${totalPages}`;
}

function openAdminTaskModal(taskId = null) {
  const modal = $('#admin-task-modal');
  const title = $('#admin-task-modal-title');
  const form = $('#admin-task-form');
  const submitBtn = $('#admin-task-submit');
  const taskIdInput = $('#admin-task-id');
  const usuarioInput = $('#admin-task-usuario');
  const cursoInput = $('#admin-task-curso');
  const tituloInput = $('#admin-task-titulo');
  const descripcionInput = $('#admin-task-descripcion');
  const fechaLimiteInput = $('#admin-task-fecha-limite');
  const estadoInput = $('#admin-task-estado');
  const avanceInput = $('#admin-task-avance');

  if (!modal || !form) return;

  form.reset();
  taskIdInput.value = taskId || '';

  if (taskId) {
    title.textContent = 'Editar tarea';
    submitBtn.querySelector('.btn__text').textContent = 'Guardar cambios';
    loadAdminTaskForEdit(taskId);
  } else {
    title.textContent = 'Nueva tarea';
    submitBtn.querySelector('.btn__text').textContent = 'Crear tarea';
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    fechaLimiteInput.value = tomorrow.toISOString().slice(0, 16);
  }

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

async function loadAdminTaskForEdit(taskId) {
  try {
    const task = await GET(`/api/admin/tareas/${taskId}`);
    if (!task) return;

    $('#admin-task-id').value = task.id_tarea;
    $('#admin-task-titulo').value = task.titulo || '';
    $('#admin-task-descripcion').value = task.descripcion || '';
    $('#admin-task-fecha-limite').value = task.fecha_limite ? new Date(task.fecha_limite).toISOString().slice(0, 16) : '';
    $('#admin-task-estado').value = task.estado || 'pendiente';
    $('#admin-task-avance').value = task.avance_pct || 0;

    // Set usuario and load cursos
    if (task.id_usuario) {
      $('#admin-task-usuario').value = task.id_usuario;
      // Trigger change to load cursos
      const event = new Event('change');
      $('#admin-task-usuario').dispatchEvent(event);
      // Wait a bit for cursos to load
      setTimeout(() => {
        if (task.id_curso) {
          $('#admin-task-curso').value = task.id_curso;
        }
      }, 100);
    }
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar tarea');
  }
}

async function saveAdminTask() {
  const taskId = $('#admin-task-id').value;
  const data = {
    id_usuario: Number($('#admin-task-usuario').value),
    id_curso: Number($('#admin-task-curso').value),
    titulo: $('#admin-task-titulo').value.trim(),
    descripcion: $('#admin-task-descripcion').value.trim() || null,
    fecha_limite: $('#admin-task-fecha-limite').value,
    estado: $('#admin-task-estado').value,
    avance_pct: Number($('#admin-task-avance').value) || 0
  };

  if (!data.id_usuario || !data.id_curso || !data.titulo || !data.fecha_limite) {
    showToast('Completa todos los campos obligatorios', 'error');
    return;
  }

  const submitBtn = $('#admin-task-submit');
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn__loading').hidden = false;
  submitBtn.querySelector('.btn__text').hidden = true;

  try {
    if (taskId) {
      await PATCH(`/api/admin/tareas/${taskId}`, data);
      showToast('Tarea actualizada', 'success');
    } else {
      await POST('/api/admin/tareas', data);
      showToast('Tarea creada', 'success');
    }
    closeAdminTaskModal();
    loadAdminTasksPage(adminTasksState.currentPage);
  } catch (e) {
    showToast(e.message, 'error', taskId ? 'Error al actualizar tarea' : 'Error al crear tarea');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn__loading').hidden = true;
    submitBtn.querySelector('.btn__text').hidden = false;
  }
}

function closeAdminTaskModal() {
  const modal = $('#admin-task-modal');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/* ---------- PAGE: ADMIN AUDITORÍA ---------- */

let adminAuditState = {
  currentPage: 1,
  pageSize: 20,
  totalItems: 0,
  filters: {
    usuario: '',
    accion: '',
    entidad: '',
    fechaDesde: '',
    fechaHasta: ''
  }
};

async function loadAdminAuditoria() {
  // Load filter options (usuarios, acciones, entidades)
  await loadAdminAuditFilters();

  // Attach event listeners
  attachAdminAuditListeners();

  // Load first page
  await loadAdminAuditPage(1);
}

async function loadAdminAuditFilters() {
  try {
    // Load usuarios for filter
    const usuarios = await GET('/api/admin/usuarios');
    const usuarioSelect = $('#audit-filter-usuario');
    if (usuarioSelect) {
      usuarioSelect.innerHTML = '<option value="">Todos los usuarios</option>' +
        usuarios.map(u => `<option value="${u.id_usuario}">${esc(u.nombre)} (${esc(u.correo)})</option>`).join('');
    }

    // Load acciones for filter
    const acciones = await GET('/api/admin/auditoria/acciones');
    const accionSelect = $('#audit-filter-accion');
    if (accionSelect) {
      accionSelect.innerHTML = '<option value="">Todas las acciones</option>' +
        acciones.map(a => `<option value="${a}">${a}</option>`).join('');
    }

    // Load entidades for filter
    const entidades = await GET('/api/admin/auditoria/entidades');
    const entidadSelect = $('#audit-filter-entidad');
    if (entidadSelect) {
      entidadSelect.innerHTML = '<option value="">Todas las entidades</option>' +
        entidades.map(e => `<option value="${e}">${e}</option>`).join('');
    }
  } catch (e) {
    console.error('Error loading admin audit filters:', e);
  }
}

function attachAdminAuditListeners() {
  // Filter elements
  const filterUsuario = $('#audit-filter-usuario');
  const filterAccion = $('#audit-filter-accion');
  const filterEntidad = $('#audit-filter-entidad');
  const filterDesde = $('#audit-filter-desde');
  const filterHasta = $('#audit-filter-hasta');
  const btnClear = $('#btn-audit-filter-clear');

  [filterUsuario, filterAccion, filterEntidad, filterDesde, filterHasta].forEach(el => {
    if (el) {
      el.replaceWith(el.cloneNode(true));
    }
  });

  // Re-get elements after cloning
  const newFilterUsuario = $('#audit-filter-usuario');
  const newFilterAccion = $('#audit-filter-accion');
  const newFilterEntidad = $('#audit-filter-entidad');
  const newFilterDesde = $('#audit-filter-desde');
  const newFilterHasta = $('#audit-filter-hasta');
  const newBtnClear = $('#btn-audit-filter-clear');

  [newFilterUsuario, newFilterAccion, newFilterEntidad, newFilterDesde, newFilterHasta].forEach(el => {
    if (el) {
      el.addEventListener('change', () => {
        adminAuditState.filters.usuario = newFilterUsuario.value;
        adminAuditState.filters.accion = newFilterAccion.value;
        adminAuditState.filters.entidad = newFilterEntidad.value;
        adminAuditState.filters.fechaDesde = newFilterDesde.value;
        adminAuditState.filters.fechaHasta = newFilterHasta.value;
        adminAuditState.currentPage = 1;
        loadAdminAuditPage(1);
      });
    }
  });

  if (newBtnClear) {
    newBtnClear.replaceWith(newBtnClear.cloneNode(true));
    $('#btn-audit-filter-clear').addEventListener('click', () => {
      adminAuditState.filters = {
        usuario: '', accion: '', entidad: '', fechaDesde: '', fechaHasta: ''
      };
      adminAuditState.currentPage = 1;
      if (newFilterUsuario) newFilterUsuario.value = '';
      if (newFilterAccion) newFilterAccion.value = '';
      if (newFilterEntidad) newFilterEntidad.value = '';
      if (newFilterDesde) newFilterDesde.value = '';
      if (newFilterHasta) newFilterHasta.value = '';
      loadAdminAuditPage(1);
    });
  }

  // Export button
  const btnExport = $('#btn-export-auditoria');
  if (btnExport) {
    btnExport.replaceWith(btnExport.cloneNode(true));
    $('#btn-export-auditoria').addEventListener('click', exportAuditCSV);
  }

  // Pagination
  const btnPrev = $('#audit-btn-prev');
  const btnNext = $('#audit-btn-next');

  if (btnPrev) {
    btnPrev.replaceWith(btnPrev.cloneNode(true));
    $('#audit-btn-prev').addEventListener('click', () => {
      if (adminAuditState.currentPage > 1) {
        loadAdminAuditPage(adminAuditState.currentPage - 1);
      }
    });
  }
  if (btnNext) {
    btnNext.replaceWith(btnNext.cloneNode(true));
    $('#audit-btn-next').addEventListener('click', () => {
      const totalPages = Math.ceil(adminAuditState.totalItems / adminAuditState.pageSize);
      if (adminAuditState.currentPage < totalPages) {
        loadAdminAuditPage(adminAuditState.currentPage + 1);
      }
    });
  }

  // Close modal handlers
  const modal = $('#audit-detail-modal');
  modal?.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
    btn.addEventListener('click', closeAuditDetailModal);
  });
}

async function loadAdminAuditPage(page) {
  adminAuditState.currentPage = page;

  const { usuario, accion, entidad, fechaDesde, fechaHasta } = adminAuditState.filters;

  try {
    const params = new URLSearchParams({
      limit: String(adminAuditState.pageSize),
      offset: String((page - 1) * adminAuditState.pageSize)
    });
    if (usuario) params.append('usuario', usuario);
    if (accion) params.append('accion', accion);
    if (entidad) params.append('entidad', entidad);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);

    const res = await GET(`/api/admin/auditoria?${params.toString()}`);
    adminAuditState.totalItems = res.total;
    renderAdminAuditTable(res.items);
    renderAdminAuditPagination();
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar auditoría');
    const tbody = $('#audit-tbody');
    const empty = $('#audit-empty');
    const table = $('#audit-table-container');
    if (tbody) tbody.innerHTML = '';
    if (table) table.hidden = true;
    if (empty) empty.hidden = false;
  }
}

function renderAdminAuditTable(logs) {
  const tbody = $('#audit-tbody');
  const empty = $('#audit-empty');
  const table = $('#audit-table-container');

  if (!logs.length) {
    if (tbody) tbody.innerHTML = '';
    if (table) table.hidden = true;
    if (empty) empty.hidden = false;
    return;
  }

  if (table) table.hidden = false;
  if (empty) empty.hidden = true;

  tbody.innerHTML = logs.map(log => `
    <tr data-audit-id="${log.id_auditoria}" style="cursor: pointer;">
      <td>${log.fecha ? fmtDateTime.format(new Date(log.fecha)) : ''}</td>
      <td>${esc(log.usuario_nombre || 'Sistema')}<br><small style="color: var(--color-text-secondary);">${esc(log.usuario_correo || '')}</small></td>
      <td><span class="badge badge--${log.accion?.replace(/_/g, '-') || 'custom'}">${esc(log.accion)}</span></td>
      <td>${esc(log.entidad || 'N/A')}${log.entidad_id ? ` #${log.entidad_id}` : ''}</td>
      <td>${esc(log.ip || 'N/A')}</td>
      <td>
        <button class="btn btn--ghost btn--sm btn-view-audit" data-audit-id="${log.id_auditoria}" aria-label="Ver detalles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  // Attach click listeners for view detail
  tbody.querySelectorAll('.btn-view-audit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAuditDetailModal(btn.dataset.auditId);
    });
  });

  // Also make rows clickable
  tbody.querySelectorAll('tr[data-audit-id]').forEach(row => {
    row.addEventListener('click', () => {
      openAuditDetailModal(row.dataset.auditId);
    });
  });
}

function renderAdminAuditPagination() {
  const pagination = $('#audit-pagination');
  const btnPrev = $('#audit-btn-prev');
  const btnNext = $('#audit-btn-next');
  const info = $('#audit-pagination-info');

  const totalPages = Math.ceil(adminAuditState.totalItems / adminAuditState.pageSize);

  if (totalPages <= 1) {
    if (pagination) pagination.hidden = true;
    return;
  }

  if (pagination) pagination.hidden = false;
  if (btnPrev) btnPrev.disabled = adminAuditState.currentPage <= 1;
  if (btnNext) btnNext.disabled = adminAuditState.currentPage >= totalPages;
  if (info) info.textContent = `Página ${adminAuditState.currentPage} de ${totalPages}`;
}

function openAuditDetailModal(auditId) {
  const modal = $('#audit-detail-modal');
  const body = $('#audit-detail-body');
  const title = $('#audit-detail-modal-title');

  if (!modal || !body) return;

  // Find the log data
  // We'll fetch it or use cached data - for now, fetch
  GET(`/api/admin/auditoria?limit=1&offset=0`).then(res => {
    const log = res.items.find(l => l.id_auditoria == auditId);
    if (!log) return;

    title.textContent = `Auditoría: ${esc(log.accion)}`;

    const formatJson = (obj) => {
      if (!obj) return '<em>Sin datos</em>';
      return '<pre style="background: var(--color-bg-secondary); padding: var(--space-3); border-radius: var(--radius-md); overflow-x: auto; font-size: var(--text-sm);">' + esc(JSON.stringify(obj, null, 2)) + '</pre>';
    };

    body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="detail-row">
          <span class="detail-label">Fecha</span>
          <span class="detail-value">${log.fecha ? fmtDateTime.format(new Date(log.fecha)) : 'N/A'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Usuario</span>
          <span class="detail-value">${esc(log.usuario_nombre || 'Sistema')} ${log.usuario_correo ? `(${esc(log.usuario_correo)})` : ''}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Acción</span>
          <span class="detail-value"><span class="badge badge--${log.accion?.replace(/_/g, '-') || 'custom'}">${esc(log.accion)}</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Entidad</span>
          <span class="detail-value">${esc(log.entidad || 'N/A')}${log.entidad_id ? ` #${log.entidad_id}` : ''}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">IP</span>
          <span class="detail-value">${esc(log.ip || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">User Agent</span>
          <span class="detail-value" style="font-size: var(--text-xs); word-break: break-all;">${esc(log.user_agent || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Datos anteriores</span>
          <span class="detail-value">${formatJson(log.datos_anteriores)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Datos nuevos</span>
          <span class="detail-value">${formatJson(log.datos_nuevos)}</span>
        </div>
      </div>
    `;

    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }).catch(e => {
    showToast(e.message, 'error', 'Error al cargar detalle');
  });
}

function closeAuditDetailModal() {
  const modal = $('#audit-detail-modal');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

async function exportAuditCSV() {
  const { usuario, accion, entidad, fechaDesde, fechaHasta } = adminAuditState.filters;

  try {
    const params = new URLSearchParams();
    if (usuario) params.append('usuario', usuario);
    if (accion) params.append('accion', accion);
    if (entidad) params.append('entidad', entidad);
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    params.append('limit', '10000'); // Large limit for export

    const res = await GET(`/api/admin/auditoria?${params.toString()}`);
    const logs = res.items;

    if (!logs.length) {
      showToast('No hay datos para exportar', 'info');
      return;
    }

    // Generate CSV
    const headers = ['Fecha', 'Usuario', 'Email', 'Acción', 'Entidad', 'Entidad ID', 'IP', 'User Agent', 'Datos Anteriores', 'Datos Nuevos'];
    const rows = logs.map(log => [
      log.fecha || '',
      log.usuario_nombre || '',
      log.usuario_correo || '',
      log.accion || '',
      log.entidad || '',
      log.entidad_id || '',
      log.ip || '',
      log.user_agent || '',
      log.datos_anteriores ? JSON.stringify(log.datos_anteriores).replace(/"/g, '""') : '',
      log.datos_nuevos ? JSON.stringify(log.datos_nuevos).replace(/"/g, '""') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast('Exportación completada', 'success');
  } catch (e) {
    showToast(e.message, 'error', 'Error al exportar');
  }
}

/* ---------- PAGE: TOKENS ---------- */
async function loadTokens() {
  try {
    const data = await GET('/api/tokens');
    renderTokens(data);
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar tokens');
  }
}

function renderTokens(data) {
  $('#saldo-tokens').textContent = data.saldo_tokens;
  $('#racha-dias').textContent = data.racha_dias;

  const list = $('#historial');
  if (!data.historial || !data.historial.length) {
    list.innerHTML = '<div class="empty-state" style="padding: var(--space-6); text-align: center;"><div class="empty-state__icon">🪙</div><h3 class="empty-state__title">Sin transacciones</h3><p class="empty-state__message">No hay historial de tokens aún.</p></div>';
    return;
  }

  list.innerHTML = data.historial.map(h => `
    <div class="transaction-item">
      <div class="transaction-item__info">
        <span class="transaction-item__motive">${esc(h.motivo)}</span>
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

/* ============================================================
   PAGE: CALENDARIO
   ============================================================ */

let calendarState = {
  currentDate: new Date(),
  view: 'month', // 'month' or 'week'
  tasksByDate: {}
};

async function loadCalendario() {
  // Initialize calendar state
  calendarState.currentDate = new Date();
  calendarState.view = 'month';

  await renderCalendar();
  attachCalendarListeners();
}

function attachCalendarListeners() {
  // View toggle buttons
  const btnMonth = $('#cal-view-month');
  const btnWeek = $('#cal-view-week');

  if (btnMonth) {
    btnMonth.replaceWith(btnMonth.cloneNode(true));
    $('#cal-view-month').addEventListener('click', () => {
      calendarState.view = 'month';
      updateViewToggle();
      renderCalendar();
    });
  }

  if (btnWeek) {
    btnWeek.replaceWith(btnWeek.cloneNode(true));
    $('#cal-view-week').addEventListener('click', () => {
      calendarState.view = 'week';
      updateViewToggle();
      renderCalendar();
    });
  }

  // Navigation buttons
  const btnPrev = $('#cal-prev');
  const btnNext = $('#cal-next');
  const btnToday = $('#cal-today');

  if (btnPrev) {
    btnPrev.replaceWith(btnPrev.cloneNode(true));
    $('#cal-prev').addEventListener('click', () => navigateCalendar(-1));
  }

  if (btnNext) {
    btnNext.replaceWith(btnNext.cloneNode(true));
    $('#cal-next').addEventListener('click', () => navigateCalendar(1));
  }

  if (btnToday) {
    btnToday.replaceWith(btnToday.cloneNode(true));
    $('#cal-today').addEventListener('click', () => {
      calendarState.currentDate = new Date();
      updateCalendarHeader();
      renderCalendar();
    });
  }

  // Close day detail modal when clicking backdrop
  const dayDetailModal = $('#cal-day-modal');
  if (dayDetailModal) {
    dayDetailModal.addEventListener('click', (e) => {
      if (e.target === dayDetailModal) {
        closeDayDetailModal();
      }
    });
  }
}

function updateViewToggle() {
  const btnMonth = $('#cal-view-month');
  const btnWeek = $('#cal-view-week');

  if (btnMonth) {
    btnMonth.setAttribute('aria-pressed', calendarState.view === 'month');
  }
  if (btnWeek) {
    btnWeek.setAttribute('aria-pressed', calendarState.view === 'week');
  }
}

function navigateCalendar(direction) {
  if (calendarState.view === 'month') {
    calendarState.currentDate.setMonth(calendarState.currentDate.getMonth() + direction);
  } else {
    calendarState.currentDate.setDate(calendarState.currentDate.getDate() + direction * 7);
  }
  updateCalendarHeader();
  renderCalendar();
}

function updateCalendarHeader() {
  const header = $('#cal-current-period');
  if (!header) return;

  if (calendarState.view === 'month') {
    const fmt = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });
    header.textContent = fmt.format(calendarState.currentDate);
  } else {
    // Week view - show week range
    const startOfWeek = getStartOfWeek(calendarState.currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const fmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
    const startStr = fmt.format(startOfWeek);
    const endStr = fmt.format(endOfWeek);

    const yearFmt = new Intl.DateTimeFormat('es-MX', { year: 'numeric' });
    header.textContent = `${startStr} - ${endStr} ${yearFmt.format(startOfWeek)}`;
  }
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function renderCalendar() {
  // Show loading
  const container = $('#calendar-container');
  if (!container) return;

  container.innerHTML = `
    <div class="calendar-loading" style="display:flex;align-items:center;justify-content:center;padding:var(--space-8);">
      <div class="spinner" style="width:32px;height:32px;border:3px solid var(--color-border);border-top-color:var(--color-primary);border-radius:50%;animation:spin 1s linear infinite;"></div>
    </div>
  `;

  try {
    // Fetch tasks for current month
    const year = calendarState.currentDate.getFullYear();
    const month = String(calendarState.currentDate.getMonth() + 1).padStart(2, '0');
    const mes = `${year}-${month}`;

    calendarState.tasksByDate = await GET(`/api/tareas/calendario?mes=${mes}`);

    if (calendarState.view === 'month') {
      renderMonthView();
    } else {
      renderWeekView();
    }

    updateCalendarHeader();
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar calendario');
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8);text-align:center;">
        <div class="empty-state__icon">📅</div>
        <h3 class="empty-state__title">Error al cargar</h3>
        <p class="empty-state__message">${esc(e.message)}</p>
      </div>
    `;
  }
}

function renderMonthView() {
  const container = $('#calendar-container');
  if (!container) return;

  const year = calendarState.currentDate.getFullYear();
  const month = calendarState.currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startOffset = startDay === 0 ? 6 : startDay - 1;

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  let html = `
    <div class="calendar-header" role="row">
      <div class="calendar-day-header" role="columnheader">Lun</div>
      <div class="calendar-day-header" role="columnheader">Mar</div>
      <div class="calendar-day-header" role="columnheader">Mié</div>
      <div class="calendar-day-header" role="columnheader">Jue</div>
      <div class="calendar-day-header" role="columnheader">Vie</div>
      <div class="calendar-day-header" role="columnheader">Sáb</div>
      <div class="calendar-day-header" role="columnheader">Dom</div>
    </div>
    <div class="calendar-grid" role="grid">
  `;

  let day = 1;
  let nextMonthDay = 1;

  // Generate 6 weeks (42 days)
  for (let week = 0; week < 6; week++) {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellIndex = week * 7 + dayOfWeek;
      let dayNum;
      let isCurrentMonth = true;
      let dateStr;

      if (cellIndex < startOffset) {
        // Previous month days
        dayNum = prevMonthLastDay - startOffset + cellIndex + 1;
        isCurrentMonth = false;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else if (day > daysInMonth) {
        // Next month days
        dayNum = nextMonthDay++;
        isCurrentMonth = false;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      } else {
        // Current month days
        dayNum = day++;
        dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      }

      const isToday = isTodayDate(dateStr);
      const tasks = calendarState.tasksByDate[dateStr] || [];
      const pendingTasks = tasks.filter(t => t.estado !== 'entregada');

      let classes = 'calendar-day';
      if (!isCurrentMonth) classes += ' calendar-day--other-month';
      if (isToday) classes += ' calendar-day--today';

      html += `
        <div class="${classes}" role="gridcell" tabindex="0" data-date="${dateStr}" data-has-tasks="${tasks.length > 0}">
          <div class="calendar-day__number">${dayNum}</div>
          <div class="calendar-day__tasks">
            ${renderDayTasks(pendingTasks.slice(0, 3))}
            ${tasks.length > 3 ? `<div class="calendar-day__more" data-date="${dateStr}">+${tasks.length - 3} más</div>` : ''}
          </div>
        </div>
      `;
    }
  }

  html += '</div>';
  container.innerHTML = html;

  // Attach click listeners to days
  container.querySelectorAll('.calendar-day').forEach(dayEl => {
    dayEl.addEventListener('click', () => openDayDetail(dayEl.dataset.date));
    dayEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDayDetail(dayEl.dataset.date);
      }
    });
  });

  // Attach click listeners to "more" links
  container.querySelectorAll('.calendar-day__more').forEach(moreEl => {
    moreEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openDayDetail(moreEl.dataset.date);
    });
  });
}

function renderDayTasks(tasks) {
  if (!tasks.length) return '';

  return tasks.map(t => {
    const isCustom = t.source === 'custom';
    const isEntregada = t.estado === 'entregada';
    const taskClass = `calendar-day__task calendar-day__task--${isCustom ? 'custom' : 'classroom'} ${isEntregada ? 'calendar-day__task--entregada' : ''}`;
    const timeStr = t.fecha_limite ? new Date(t.fecha_limite).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';

    return `
      <div class="${taskClass}" title="${esc(t.titulo)} ${timeStr}" data-task-id="${t.id_tarea}">
        ${esc(t.titulo)}
        ${timeStr ? `<span style="font-size:0.7em;margin-left:4px;">${timeStr}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderWeekView() {
  const container = $('#calendar-container');
  if (!container) return;

  const startOfWeek = getStartOfWeek(calendarState.currentDate);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Get all tasks for the week
  const weekTasks = [];
  for (const [dateStr, tasks] of Object.entries(calendarState.tasksByDate)) {
    const taskDate = new Date(dateStr);
    if (taskDate >= startOfWeek && taskDate <= endOfWeek) {
      tasks.forEach(t => weekTasks.push({ ...t, date: dateStr }));
    }
  }

  // Sort tasks by date and time
  weekTasks.sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));

  const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  let html = `
    <div class="week-header" role="row">
      <div class="week-header__time" role="columnheader">Hora</div>
      ${dayHeaders.map((day, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const isToday = isTodayDate(date.toISOString().slice(0, 10));
        return `<div class="week-header__day ${isToday ? 'week-header__day--today' : ''}" role="columnheader">${day} ${date.getDate()}</div>`;
      }).join('')}
    </div>
    <div class="week-grid" role="grid">
  `;

  // Time slots (6am to 11pm = 17 hours)
  for (let hour = 6; hour <= 22; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    html += `<div class="week-time-slot" role="rowheader">${timeStr}</div>`;

    for (let day = 0; day < 7; day++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().slice(0, 10);
      const isToday = isTodayDate(dateStr);

      html += `<div class="week-day-column ${isToday ? 'week-day-column--today' : ''}" role="gridcell" data-date="${dateStr}"></div>`;
    }
  }

  html += '</div>';
  container.innerHTML = html;

  // Place tasks in week grid
  placeTasksInWeekGrid(weekTasks, startOfWeek);
}

function placeTasksInWeekGrid(tasks, startOfWeek) {
  tasks.forEach(task => {
    const taskDate = new Date(task.fecha_limite);
    const dayIndex = (taskDate.getDay() + 6) % 7; // Monday = 0
    const hour = taskDate.getHours();
    const minute = taskDate.getMinutes();

    // Only show tasks between 6am and 10pm
    if (hour < 6 || hour > 22) return;

    const columnIndex = dayIndex + 1; // +1 for time column
    const rowIndex = (hour - 6) * 2 + (minute >= 30 ? 1 : 0); // 30-min slots

    const grid = document.querySelector('.week-grid');
    if (!grid) return;

    const cells = grid.querySelectorAll('.week-day-column');
    const cellIndex = rowIndex * 7 + dayIndex;
    const cell = cells[cellIndex];

    if (!cell) return;

    const isCustom = task.source === 'custom';
    const isEntregada = task.estado === 'entregada';
    const taskClass = `week-task week-task--${isCustom ? 'custom' : 'classroom'} ${isEntregada ? 'week-task--entregada' : ''}`;

    // Calculate top position within the cell (each cell is 60px = 1 hour)
    const topPx = (hour - 6) * 60 + (minute / 60) * 60;
    const heightPx = 50; // Approximate height for 1-hour task

    const taskEl = document.createElement('div');
    taskEl.className = taskClass;
    taskEl.style.top = `${topPx}px`;
    taskEl.style.height = `${heightPx}px`;
    taskEl.textContent = task.titulo;
    taskEl.title = `${task.titulo} - ${task.fecha_limite}`;
    taskEl.dataset.taskId = task.id_tarea;
    taskEl.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskDetail(task.id_tarea);
    });

    cell.appendChild(taskEl);
  });
}

function isTodayDate(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

function openDayDetail(dateStr) {
  const tasks = calendarState.tasksByDate[dateStr] || [];
  const modal = $('#cal-day-modal');
  const title = $('#cal-day-modal-title');
  const list = $('#cal-day-tasks');

  if (!modal || !title || !list) return;

  const fmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  title.textContent = fmt.format(new Date(dateStr + 'T00:00:00'));

  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state" style="padding:var(--space-4);text-align:center;"><p>No hay tareas para este día</p></div>';
  } else {
    list.innerHTML = tasks.map(t => {
      const isCustom = t.source === 'custom';
      const isEntregada = t.estado === 'entregada';
      const taskClass = `cal-day-task cal-day-task--${isCustom ? 'custom' : 'classroom'} ${isEntregada ? 'cal-day-task--entregada' : ''}`;
      const timeStr = t.fecha_limite ? new Date(t.fecha_limite).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
      const courseColor = courseColor(t.id_curso);

      return `
        <article class="${taskClass}" data-task-id="${t.id_tarea}" style="border-left-color: ${courseColor};" tabindex="0" role="button">
          <div class="cal-day-task__title">${esc(t.titulo)}</div>
          <div class="cal-day-task__meta">
            <span class="cal-day-task__course" style="color: ${courseColor};">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/></svg>
              ${esc(t.curso)}
            </span>
            ${timeStr ? `<span class="cal-day-task__time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${timeStr}
            </span>` : ''}
            <span class="badge badge--${t.estado_visible || t.estado}">${ETIQUETA_ESTADO[t.estado_visible || t.estado]}</span>
          </div>
        </article>
      `;
    }).join('');

    // Attach click listeners to tasks
    list.querySelectorAll('.cal-day-task').forEach(taskEl => {
      taskEl.addEventListener('click', () => {
        const taskId = taskEl.dataset.taskId;
        closeDayDetailModal();
        openTaskDetail(Number(taskId));
      });
      taskEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const taskId = taskEl.dataset.taskId;
          closeDayDetailModal();
          openTaskDetail(Number(taskId));
        }
      });
    });
  }

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDayDetailModal() {
  const modal = $('#cal-day-modal');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/* ============================================================
   PAGE: NOTIFICACIONES
   ============================================================ */

let notificationState = {
  currentTab: 'todas',
  currentPage: 1,
  pageSize: 20,
  totalItems: 0,
  isLoading: false
};

const NOTIFICATION_TABS = [
  { id: 'todas', label: 'Todas', type: null, leida: undefined },
  { id: 'no-leidas', label: 'No leídas', type: null, leida: false },
  { id: 'entregas', label: 'Entregas', type: 'entrega', leida: undefined },
  { id: 'recordatorios', label: 'Recordatorios', type: 'recordatorio', leida: undefined }
];

const NOTIFICATION_ICONS = {
  entrega: '✅',
  recordatorio: '⏰',
  vencida: '⛔',
  sistema: 'ℹ️',
  recompensa: '🎁'
};

const NOTIFICATION_ICON_CLASSES = {
  entrega: 'notification-item__icon--entrega',
  recordatorio: 'notification-item__icon--recordatorio',
  vencida: 'notification-item__icon--vencida',
  sistema: 'notification-item__icon--sistema',
  recompensa: 'notification-item__icon--recompensa'
};

async function loadNotificaciones() {
  notificationState.currentPage = 1;
  notificationState.currentTab = 'todas';
  await loadNotificationsForTab('todas');
  attachNotificationListeners();
}

function attachNotificationListeners() {
  // Tab buttons
  const tabButtons = document.querySelectorAll('.notification-tab');
  tabButtons.forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });

  document.querySelectorAll('.notification-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId);
    });
  });

  // Mark all as read button
  const btnMarkAllRead = $('#btn-mark-all-read');
  if (btnMarkAllRead) {
    btnMarkAllRead.replaceWith(btnMarkAllRead.cloneNode(true));
    $('#btn-mark-all-read').addEventListener('click', markAllAsRead);
  }

  // Pagination buttons
  const btnPrev = $('#notif-btn-prev');
  const btnNext = $('#notif-btn-next');

  if (btnPrev) {
    btnPrev.replaceWith(btnPrev.cloneNode(true));
    $('#notif-btn-prev').addEventListener('click', () => {
      if (notificationState.currentPage > 1) {
        notificationState.currentPage--;
        loadNotificationsForTab(notificationState.currentTab);
      }
    });
  }

  if (btnNext) {
    btnNext.replaceWith(btnNext.cloneNode(true));
    $('#notif-btn-next').addEventListener('click', () => {
      const totalPages = Math.ceil(notificationState.totalItems / notificationState.pageSize);
      if (notificationState.currentPage < totalPages) {
        notificationState.currentPage++;
        loadNotificationsForTab(notificationState.currentTab);
      }
    });
  }
}

function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.notification-tab').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.setAttribute('aria-selected', isActive);
  });

  // Update tab panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const isActive = panel.id === `panel-${tabId}`;
    panel.hidden = !isActive;
  });

  // Load notifications for the new tab
  notificationState.currentTab = tabId;
  notificationState.currentPage = 1;
  loadNotificationsForTab(tabId);
}

async function loadNotificationsForTab(tabId) {
  if (notificationState.isLoading) return;

  const tabConfig = NOTIFICATION_TABS.find(t => t.id === tabId);
  if (!tabConfig) return;

  notificationState.isLoading = true;

  // Show loading state
  const listEl = $(`#notif-list-${tabId}`);
  const emptyEl = $(`#empty-notif-${tabId}`);
  if (listEl) {
    listEl.innerHTML = `
      <div class="calendar-loading" style="display:flex;align-items:center;justify-content:center;padding:var(--space-8);">
        <div class="spinner" style="width:32px;height:32px;border:3px solid var(--color-border);border-top-color:var(--color-primary);border-radius:50%;animation:spin 1s linear infinite;"></div>
      </div>
    `;
    listEl.hidden = false;
  }
  if (emptyEl) emptyEl.hidden = true;

  try {
    const filtros = {
      limit: notificationState.pageSize,
      offset: (notificationState.currentPage - 1) * notificationState.pageSize
    };
    if (tabConfig.type) filtros.tipo = tabConfig.type;
    if (tabConfig.leida !== undefined) filtros.leida = tabConfig.leida;

    const res = await GET(`/api/notificaciones?${new URLSearchParams({
      tipo: filtros.tipo || '',
      leida: filtros.leida !== undefined ? String(filtros.leida) : '',
      limit: String(filtros.limit),
      offset: String(filtros.offset)
    })}`);

    notificationState.totalItems = res.total;
    renderNotifications(tabId, res.items);
    updatePagination();
  } catch (e) {
    showToast(e.message, 'error', 'Error al cargar notificaciones');
    const listEl = $(`#notif-list-${tabId}`);
    const emptyEl = $(`#empty-notif-${tabId}`);
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.querySelector('.empty-state__message').textContent = e.message;
    }
  } finally {
    notificationState.isLoading = false;
  }
}

function renderNotifications(tabId, items) {
  const listEl = $(`#notif-list-${tabId}`);
  const emptyEl = $(`#empty-notif-${tabId}`);

  if (!listEl) return;

  if (!items.length) {
    listEl.innerHTML = '';
    listEl.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  listEl.hidden = false;
  if (emptyEl) emptyEl.hidden = true;

  listEl.innerHTML = items.map(item => renderNotificationItem(item)).join('');

  // Attach click listeners to mark as read
  listEl.querySelectorAll('.notification-item').forEach((itemEl, index) => {
    const notificationId = itemEl.dataset.notificationId;
    itemEl.addEventListener('click', () => markAsRead(notificationId, itemEl));
  });
}

function renderNotificationItem(item) {
  const icon = NOTIFICATION_ICONS[item.tipo] || '🔔';
  const iconClass = NOTIFICATION_ICON_CLASSES[item.tipo] || '';
  const isUnread = !item.leida;
  const dateStr = new Date(item.fecha).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return `
    <article class="notification-item ${isUnread ? 'notification-item--unread' : ''}" data-notification-id="${item.id_notificacion}" role="listitem" tabindex="0">
      <div class="notification-item__icon ${iconClass}" aria-hidden="true">${icon}</div>
      <div class="notification-item__content">
        <h4 class="notification-item__title">${esc(item.titulo)}</h4>
        ${item.mensaje ? `<p class="notification-item__message">${esc(item.mensaje)}</p>` : ''}
        <div class="notification-item__meta">
          <span class="notification-item__time">${dateStr}</span>
          <span class="badge badge--${item.tipo}">${item.tipo}</span>
        </div>
      </div>
      ${isUnread ? '<div class="notification-item__unread-dot" aria-label="No leída"></div>' : ''}
    </article>
  `;
}

async function markAsRead(notificationId, itemEl) {
  if (!itemEl.classList.contains('notification-item--unread')) return;

  try {
    await PATCH(`/api/notificaciones/${notificationId}/leer`);
    itemEl.classList.remove('notification-item--unread');
    const dot = itemEl.querySelector('.notification-item__unread-dot');
    if (dot) dot.remove();

    // Update unread count in header
    const badge = $('#alert-badge');
    if (badge) {
      const count = parseInt(badge.textContent) - 1;
      badge.textContent = count > 0 ? count : '';
      badge.hidden = count === 0;
    }
    State.alertCount = count > 0 ? count : 0;
  } catch (e) {
    showToast(e.message, 'error', 'Error al marcar como leída');
  }
}

async function markAllAsRead() {
  try {
    const res = await POST('/api/notificaciones/leer-todas');
    showToast(`${res.count} notificaciones marcadas como leídas`, 'success');

    // Reload current tab
    loadNotificationsForTab(notificationState.currentTab);

    // Update unread count in header
    const badge = $('#alert-badge');
    if (badge) {
      badge.textContent = '';
      badge.hidden = true;
    }
    State.alertCount = 0;
  } catch (e) {
    showToast(e.message, 'error', 'Error al marcar todas como leídas');
  }
}

function updatePagination() {
  const paginationEl = $('#notif-pagination');
  const btnPrev = $('#notif-btn-prev');
  const btnNext = $('#notif-btn-next');
  const infoEl = $('#notif-pagination-info');

  if (!paginationEl) return;

  const totalPages = Math.ceil(notificationState.totalItems / notificationState.pageSize);

  if (totalPages <= 1) {
    paginationEl.hidden = true;
    return;
  }

  paginationEl.hidden = false;
  if (btnPrev) btnPrev.disabled = notificationState.currentPage <= 1;
  if (btnNext) btnNext.disabled = notificationState.currentPage >= totalPages;
  if (infoEl) infoEl.textContent = `Página ${notificationState.currentPage} de ${totalPages}`;
}

/* ---------- Alerts Polling ---------- */
function pollAlerts() {
  async function check() {
    try {
      const alertas = await GET('/api/alertas');
      const count = alertas.filter(a => !a.leida).length;
      if (count !== State.alertCount) {
        State.alertCount = count;
        const badge = $('#alert-badge');
        if (badge) {
          badge.textContent = count > 0 ? count : '';
          badge.hidden = count === 0;
        }
      }
    } catch { /* silencioso */ }
  }
  check();
  setInterval(check, 30000);
}

function refreshCurrentPage() {
  const page = pages[State.currentPage];
  if (page?.init) page.init();
}

/* ============================================================
   INITIALIZATION
   ============================================================ */
async function initApp() {
  initTheme();

  // Check auth state - validate JWT token from localStorage
  const user = await validateToken();

  if (user) {
    // Valid token - update UI and navigate to appropriate page
    updateUserUI(user);

    // Initial navigation - use hash or default based on role
    const initialPage = location.hash.slice(1);
    if (initialPage && pages[initialPage]) {
      navigate(initialPage, false);
    } else {
      // Default to agenda for students, admin-usuarios for admins
      navigate(user.rol === 'admin' ? 'admin-usuarios' : 'agenda', false);
    }
  } else {
    // No valid token - show login page
    updateUserUI(null);

    // Initial navigation - default to login
    const initialPage = location.hash.slice(1);
    if (initialPage && pages[initialPage] && PUBLIC_PAGES.includes(initialPage)) {
      navigate(initialPage, false);
    } else {
      navigate('login', false);
    }
  }

  // Start alerts polling
  pollAlerts();

  // Update header tokens periodically
  setInterval(updateHeaderTokens, 60000);

  // Validate token on visibility change (tab focus)
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const currentUser = await validateToken();
      if (!currentUser && !PUBLIC_PAGES.includes(State.currentPage)) {
        // Token expired while away, redirect to login
        navigate('login');
      } else if (currentUser) {
        updateUserUI(currentUser);
      }
    }
  });

  console.log('CAPU app initialized');

  // Check and show onboarding for new users
  if (user && !user.onboarding_completado) {
    setTimeout(() => showOnboarding(user), 1000);
  }
}

// Onboarding tour steps
const ONBOARDING_STEPS = [
  {
    element: '#header',
    title: '¡Bienvenido a CAPU!',
    content: 'Esta es la barra superior. Aquí encontrarás tu perfil, notificaciones y el menú principal.',
    position: 'bottom'
  },
  {
    element: '#page-agenda',
    title: 'Tu Agenda',
    content: 'Aquí verás todas tus tareas organizadas. Puedes filtrar por curso, estado y ver el progreso de cada una.',
    position: 'center'
  },
  {
    element: '#page-calendario',
    title: 'Vista de Calendario',
    content: 'Visualiza tus tareas en vista mensual o semanal. Haz clic en cualquier día para ver el detalle.',
    position: 'center'
  },
  {
    element: '#page-notificaciones',
    title: 'Centro de Notificaciones',
    content: 'Recibe alertas de entregas, recordatorios y tareas vencidas. Marca como leídas o haz clic para ver detalles.',
    position: 'center'
  },
  {
    element: '#page-tokens',
    title: 'Sistema de Tokens',
    content: 'Gana tokens por entregas a tiempo y cámbialos por recompensas. Mantén tu racha diaria para bonos extra.',
    position: 'center'
  },
  {
    element: '#page-perfil',
    title: 'Tu Perfil',
    content: 'Configura tus preferencias, conecta Google Classroom para sincronizar tareas automáticamente y gestiona tu cuenta.',
    position: 'center'
  }
];

let onboardingState = {
  currentStep: 0,
  overlay: null,
  tooltip: null
};

function showOnboarding(user) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.innerHTML = `
    <div class="onboarding-tooltip" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <header class="onboarding-tooltip__header">
        <h3 id="onboarding-title" class="onboarding-tooltip__title"></h3>
        <button class="onboarding-tooltip__skip" aria-label="Saltar tutorial">Saltar</button>
      </header>
      <div class="onboarding-tooltip__body">
        <p class="onboarding-tooltip__content"></p>
        <div class="onboarding-tooltip__progress" role="progressbar" aria-valuenow="1" aria-valuemin="1" aria-valuemax="${ONBOARDING_STEPS.length}">
          <span class="onboarding-tooltip__step"></span>
        </div>
      </div>
      <footer class="onboarding-tooltip__footer">
        <button class="btn btn--ghost onboarding-tooltip__prev" hidden>Anterior</button>
        <button class="btn btn--primary onboarding-tooltip__next">Siguiente</button>
      </footer>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  onboardingState.overlay = overlay;
  onboardingState.tooltip = overlay.querySelector('.onboarding-tooltip');
  onboardingState.currentStep = 0;

  // Attach event listeners
  overlay.querySelector('.onboarding-tooltip__skip').addEventListener('click', () => completeOnboarding(user));
  overlay.querySelector('.onboarding-tooltip__prev').addEventListener('click', () => previousStep());
  overlay.querySelector('.onboarding-tooltip__next').addEventListener('click', () => nextStep(user));

  // Close on overlay click (outside tooltip)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      completeOnboarding(user);
    }
  });

  // Handle ESC key
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      completeOnboarding(user);
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);

  showStep();
}

function showStep() {
  const step = ONBOARDING_STEPS[onboardingState.currentStep];
  const tooltip = onboardingState.tooltip;

  if (!step || !tooltip) return;

  // Update content
  tooltip.querySelector('.onboarding-tooltip__title').textContent = step.title;
  tooltip.querySelector('.onboarding-tooltip__content').textContent = step.content;
  tooltip.querySelector('.onboarding-tooltip__step').textContent = `Paso ${onboardingState.currentStep + 1} de ${ONBOARDING_STEPS.length}`;
  tooltip.querySelector('.onboarding-tooltip__progress').setAttribute('aria-valuenow', onboardingState.currentStep + 1);

  // Update buttons
  const prevBtn = tooltip.querySelector('.onboarding-tooltip__prev');
  const nextBtn = tooltip.querySelector('.onboarding-tooltip__next');

  prevBtn.hidden = onboardingState.currentStep === 0;
  nextBtn.textContent = onboardingState.currentStep === ONBOARDING_STEPS.length - 1 ? 'Finalizar' : 'Siguiente';

  // Position tooltip relative to target element
  const target = document.querySelector(step.element);
  if (target) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top, left;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 10;
        break;
      case 'center':
      default:
        top = (window.innerHeight - tooltipRect.height) / 2;
        left = (window.innerWidth - tooltipRect.width) / 2;
        break;
    }

    // Keep within viewport
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipRect.height - 10));
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  } else {
    // Center if target not found
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
  }

  // Highlight target element
  document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
  if (target) target.classList.add('onboarding-highlight');
}

function nextStep(user) {
  if (onboardingState.currentStep < ONBOARDING_STEPS.length - 1) {
    onboardingState.currentStep++;
    showStep();
  } else {
    completeOnboarding(user);
  }
}

function previousStep() {
  if (onboardingState.currentStep > 0) {
    onboardingState.currentStep--;
    showStep();
  }
}

async function completeOnboarding(user) {
  // Remove highlight
  document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));

  // Remove overlay
  if (onboardingState.overlay) {
    onboardingState.overlay.remove();
    onboardingState.overlay = null;
    onboardingState.tooltip = null;
  }
  document.body.style.overflow = '';

  // Mark onboarding as completed in backend
  try {
    await PATCH('/api/usuario/perfil', { onboarding_completado: 1 });
    user.onboarding_completado = 1;
    updateUserUI(user);
  } catch (e) {
    console.error('Error marking onboarding as completed:', e);
  }
}

// Add onboarding styles dynamically
const onboardingStyles = document.createElement('style');
onboardingStyles.textContent = `
.onboarding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  animation: fade-in 0.3s ease;
}

.onboarding-tooltip {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  max-width: 360px;
  box-shadow: var(--shadow-xl);
  position: absolute;
  animation: slide-up 0.3s ease;
}

.onboarding-tooltip__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
}

.onboarding-tooltip__title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
}

.onboarding-tooltip__skip {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-1);
}

.onboarding-tooltip__skip:hover {
  color: var(--color-text);
}

.onboarding-tooltip__content {
  margin: 0 0 var(--space-4);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.onboarding-tooltip__progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.onboarding-tooltip__footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.onboarding-highlight {
  position: relative;
  z-index: 10001 !important;
  box-shadow: 0 0 0 4px var(--color-primary) !important;
  border-radius: var(--radius-md) !important;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(onboardingStyles);

// Service Worker Registration (PWA/Offline Support - Fase 9)
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[SW] Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            showToast('Nueva versión disponible. Recarga la página.', 'info', 'Actualización', 10000);
          }
        });
      });

      // Listen for controller change (new SW took control)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  }
}

// Online/Offline detection
function setupOnlineOfflineDetection() {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    const indicator = $('#offline-indicator');

    if (indicator) {
      indicator.hidden = isOnline;
      indicator.setAttribute('aria-hidden', isOnline);
    }

    // Show toast when coming back online
    if (isOnline && !State.wasOnline) {
      showToast('Conexión restaurada', 'success');
      // Trigger background sync
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.sync.register('sync-tasks').catch(() => {});
        });
      }
    } else if (!isOnline && State.wasOnline) {
      showToast('Sin conexión. Trabajando en modo offline.', 'warning', 'Offline', 5000);
    }

    State.wasOnline = isOnline;
  };

  // Initial state
  State.wasOnline = navigator.onLine;

  // Listen for online/offline events
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Create offline indicator element if it doesn't exist
  if (!$('#offline-indicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'offline-indicator';
    indicator.hidden = true;
    indicator.setAttribute('aria-hidden', 'true');
    indicator.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
      <span>Sin conexión</span>
    `;
    document.body.appendChild(indicator);

    // Add styles for offline indicator
    const offlineStyles = document.createElement('style');
    offlineStyles.textContent = `
      .offline-indicator {
        position: fixed;
        bottom: var(--space-4);
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-error);
        color: white;
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slide-up 0.3s ease;
      }
      .offline-indicator[hidden] {
        display: none !important;
      }
      .offline-indicator svg {
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(offlineStyles);
  }

  updateOnlineStatus();
}

// Register SW and setup online/offline detection when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    setupOnlineOfflineDetection();
    initApp();
  });
} else {
  registerServiceWorker();
  setupOnlineOfflineDetection();
  initApp();
}

// Add event listeners for custom tasks
document.addEventListener('DOMContentLoaded', () => {
  // Create task button
  const btnCreateTask = $('#btn-create-task');
  if (btnCreateTask) {
    btnCreateTask.addEventListener('click', openCreateTaskModal);
  }

  // Sync button (header)
  const btnSync = $('#btn-sync');
  if (btnSync) {
    btnSync.addEventListener('click', async () => {
      try {
        const res = await POST('/api/sync');
        showToast(res.message || 'Sincronización completada', 'success');
        loadAgenda();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }

  // Sync button (empty state)
  const emptySyncBtn = $('#empty-sync-btn');
  if (emptySyncBtn) {
    emptySyncBtn.addEventListener('click', async () => {
      try {
        const res = await POST('/api/sync');
        showToast(res.message || 'Sincronización completada', 'success');
        loadAgenda();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }

  // Source filter change
  const fSource = $('#f-source');
  if (fSource) {
    fSource.addEventListener('change', loadTasks);
  }

  // Create task form submit
  const createTaskForm = $('#create-task-form');
  if (createTaskForm) {
    createTaskForm.addEventListener('submit', handleCreateTaskSubmit);
  }

  // Edit task form submit
  const editTaskForm = $('#edit-task-form');
  if (editTaskForm) {
    editTaskForm.addEventListener('submit', handleEditTaskSubmit);
  }

  // Edit task delete button
  const editTaskDelete = $('#edit-task-delete');
  if (editTaskDelete) {
    editTaskDelete.addEventListener('click', () => {
      const id = Number($('#edit-task-id').value);
      if (id) handleDeleteTaskCustom(id);
    });
  }
});

// Handle visibility change to refresh data
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && State.currentPage) {
    refreshCurrentPage();
  }
});

// Export for debugging
window.CAPU = { State, api: { GET, POST, PATCH, DELETE }, showToast, navigate, modals };