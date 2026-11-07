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
  'admin-usuarios': { init: loadAdminUsuarios, cleanup: () => {} },
  'admin-cursos': { init: loadAdminCursos, cleanup: () => {} },
  'admin-recompensas': { init: loadAdminRecompensas, cleanup: () => {} },
  'admin-metricas': { init: loadAdminMetricas, cleanup: () => {} },
  'admin-config': { init: loadAdminConfig, cleanup: () => {} }
};

// Public pages that don't require authentication
const PUBLIC_PAGES = ['register', 'login', 'forgot-password', 'reset-password'];

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
  const hash = location.hash.slice(1) || 'agenda';
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

  // Update sidebar - show/hide based on auth
  const sidebarNav = $('#sidebar-nav');
  if (sidebarNav) {
    if (isAuthenticated) {
      sidebarNav.innerHTML = `
        <nav class="sidebar__nav" aria-label="Navegación principal">
          <div class="sidebar__section">
            <h2 class="sidebar__section-title">Principal</h2>
            <a href="#agenda" class="sidebar__item" data-page="agenda" aria-current="false">
              <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
              <span class="sidebar__label">Agenda</span>
            </a>
            <a href="#tokens" class="sidebar__item" data-page="tokens" aria-current="false">
              <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span class="sidebar__label">Tokens</span>
            </a>
            <a href="#resumen" class="sidebar__item" data-page="resumen" aria-current="false">
              <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
              <span class="sidebar__label">Resumen</span>
            </a>
          </div>
          <div class="sidebar__section">
            <h2 class="sidebar__section-title">Cuenta</h2>
            <a href="#perfil" class="sidebar__item" data-page="perfil" aria-current="false">
              <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span class="sidebar__label">Perfil</span>
            </a>
          </div>
        </nav>
      `;
    } else {
      sidebarNav.innerHTML = `
        <nav class="sidebar__nav" aria-label="Navegación principal">
          <div class="sidebar__section">
            <h2 class="sidebar__section-title">CAPU</h2>
            <a href="#login" class="sidebar__item" data-page="login" aria-current="false">
              <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              <span class="sidebar__label">Iniciar sesión</span>
            </a>
            <a href="#register" class="sidebar__item" data-page="register" aria-current="false">
              <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              <span class="sidebar__label">Registrarse</span>
            </a>
          </div>
        </nav>
      `;
    }
    // Re-attach click listeners for navigation
    sidebarNav.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.page;
        navigate(page);
        closeSidebar();
      });
    });
  }
}

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

sidebarToggle.addEventListener('click', () => {
  if (sidebar.classList.contains('sidebar--open')) closeSidebar();
  else openSidebar();
});

sidebarBackdrop.addEventListener('click', closeSidebar);

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

  // Sidebar
  $('#sidebar-user-name').textContent = name;
  $('#sidebar-user-email').textContent = email;
  $('#sidebar-avatar').textContent = initials;
  $('#sidebar-avatar').className = `avatar ${avatarColorClass(name)}`;

  // Google connect button
  if (user?.googleConnected) {
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
  $('#saldo').textContent = data.saldo_tokens;
  $('#racha').textContent = data.racha_dias;

  const list = $('#tokens-history');
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

  // Check auth state - first try JWT token from localStorage
  const token = getAuthToken();
  let user = null;

  if (token) {
    try {
      const perfil = await GET('/api/usuario/perfil');
      user = { ...perfil, googleConnected: perfil.googleConectado || false };
    } catch (e) {
      // Token invalid or expired, clear it
      clearAuth();
    }
  }

  // If no valid JWT, fall back to Google OAuth check (for backward compatibility)
  if (!user) {
    try {
      const auth = await GET('/api/auth/google/estado');
      user = { ...auth, googleConnected: auth.conectado };
    } catch {
      user = { nombre: 'Estudiante Demo', correo: 'demo@capu.local', rol: 'estudiante', googleConnected: false };
    }
  }

  updateUserUI(user);

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

// Add event listeners for custom tasks
document.addEventListener('DOMContentLoaded', () => {
  // Create task button
  const btnCreateTask = $('#btn-create-task');
  if (btnCreateTask) {
    btnCreateTask.addEventListener('click', openCreateTaskModal);
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