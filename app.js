/* ============================================
   BOSH CMS v2 — Shared Application Layer
   Auth · API · Sidebar · Animations · Utilities
   ============================================ */

// ---- AUTH ----
const Auth = {
  get() { const u = sessionStorage.getItem('cms_user'); return u ? JSON.parse(u) : null; },
  set(user) { sessionStorage.setItem('cms_user', JSON.stringify(user)); },
  logout() { sessionStorage.removeItem('cms_user'); location.href = CONFIG.BASE_PATH + 'index.html'; },
  require() { if (!this.get()) { location.href = CONFIG.BASE_PATH + 'index.html'; return false; } return true; },
  hasRole(...roles) { const u = this.get(); return u && roles.some(r => u.role.toLowerCase().includes(r.toLowerCase())); }
};

// ---- API LAYER ----
const API = {
  async get(action, params = {}) {
    try {
      const url = new URL(CONFIG.GAS_URL);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') url.searchParams.set(k, String(v)); });
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { console.warn('API.get error:', action, e); return null; }
  },
  async post(action, data = {}) {
    try {
      const r = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...data })
      });
      return await r.json();
    } catch (e) { console.warn('API.post error:', action, e); return null; }
  }
};

// ---- SIDEBAR ----
function buildSidebar(active) {
  const u = Auth.get() || { username: 'User', role: 'Viewer' };
  const ini = u.username.substring(0, 2).toUpperCase();
  const B = CONFIG.BASE_PATH;
  const nav = [
    { group: 'Overview', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', href: 'dashboard.html' }
    ]},
    { group: 'HSE Safety', items: [
      { id: 'ptw', icon: '📋', label: 'PTW', href: 'ptw.html' },
      { id: 'tbm', icon: '👷', label: 'Toolbox Meeting', href: 'tbm.html' },
      { id: 'safety', icon: '🛡️', label: 'Safety Inspection', href: 'safety.html' }
    ]},
    { group: 'Quality', items: [
      { id: 'qaqc', icon: '🔍', label: 'Quality Inspection', href: 'qaqc.html' },
      { id: 'defect', icon: '🐛', label: 'Defect Management', href: 'defect.html' }
    ]},
    { group: 'Analytics', items: [
      { id: 'ptw-analytics', icon: '📈', label: 'PTW Analytics', href: 'ptw-analytics.html' },
      { id: 'tbm-analytics', icon: '📉', label: 'TBM Analytics', href: 'tbm-analytics.html' },
      { id: 'safety-analytics', icon: '🔎', label: 'Inspection Analytics', href: 'safety-analytics.html' }
    ]},
    { group: 'System', items: [
      { id: 'admin', icon: '⚙️', label: 'Admin', href: 'admin.html' }
    ]}
  ];

  const el = document.createElement('aside');
  el.className = 'sidebar';
  el.id = 'sidebar';
  el.innerHTML = `
    <div class="sidebar-brand"><div class="logo">🏗️</div><div><h2>BOSH CMS</h2><span>Construction Mgmt</span></div></div>
    <nav class="sidebar-nav">
      ${nav.map(g => `<div class="nav-group"><div class="nav-group-title">${g.group}</div>
        ${g.items.map(i => `<a href="${B}${i.href}" class="nav-link ${active === i.id ? 'active' : ''}"><span class="icon">${i.icon}</span>${i.label}</a>`).join('')}
      </div>`).join('')}
    </nav>
    <div class="sidebar-footer"><div class="sidebar-user">
      <div class="user-avatar">${ini}</div>
      <div class="user-meta"><div class="name">${u.username}</div><div class="role">${u.role}</div></div>
      <button class="logout-btn" onclick="Auth.logout()">Exit</button>
    </div></div>`;
  document.querySelector('.app').prepend(el);
}

// ---- SCROLL ANIMATION ----
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) { setTimeout(() => e.target.classList.add('show'), i * 50); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.stat, .card, .table-card, .hero-banner').forEach(el => obs.observe(el));
}

// ---- COUNT-UP ----
function countUp(el, target, dur = 1000, prefix = '', suffix = '') {
  const start = performance.now();
  const isF = target % 1 !== 0;
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const v = target * ease;
    el.textContent = prefix + (isF ? v.toFixed(1) : Math.floor(v).toLocaleString()) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}
function initCountUps() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        countUp(el, parseFloat(el.dataset.v), 1100, el.dataset.pre || '', el.dataset.suf || '');
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-v]').forEach(el => obs.observe(el));
}

// ---- TOAST ----
function toast(msg, type = 'info') {
  let w = document.querySelector('.toast-wrap');
  if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; t.style.transition = 'all .25s'; setTimeout(() => t.remove(), 250); }, 3500);
}

// ---- LOADING ----
function showLoad(text) {
  let l = document.querySelector('.loading');
  if (!l) { l = document.createElement('div'); l.className = 'loading'; l.innerHTML = `<div class="spinner"></div><p>${text || 'Loading...'}</p>`; document.body.appendChild(l); }
  l.classList.remove('hide');
  l.querySelector('p').textContent = text || 'Loading...';
}
function hideLoad() { const l = document.querySelector('.loading'); if (l) l.classList.add('hide'); }

// ---- MODAL ----
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---- BADGE HELPERS ----
function statusBadge(s) {
  const l = (s || '').toLowerCase();
  if (['active','approved','open','pass','passed','completed','closed'].includes(l)) {
    if (l === 'closed') return `<span class="badge b-blue">${s}</span>`;
    return `<span class="badge b-green">${s}</span>`;
  }
  if (['pending','review','in progress','in review','rectify'].includes(l)) return `<span class="badge b-yellow">${s}</span>`;
  if (['expired','fail','failed','rejected','revoked','overdue'].includes(l)) return `<span class="badge b-red">${s}</span>`;
  if (['draft'].includes(l)) return `<span class="badge b-gray">${s}</span>`;
  return `<span class="badge b-gray">${s}</span>`;
}
function sevBadge(s) {
  const l = (s || '').toLowerCase();
  if (l === 'critical') return `<span class="badge b-red">${s}</span>`;
  if (l === 'high') return `<span class="badge b-red">${s}</span>`;
  if (l === 'medium') return `<span class="badge b-yellow">${s}</span>`;
  return `<span class="badge b-green">${s}</span>`;
}

// ---- DATE FORMAT ----
function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---- CHART.JS DEFAULTS ----
function initChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#94A3B8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = '#162037';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 6;
  Chart.defaults.plugins.tooltip.padding = 8;
  Chart.defaults.scale.grid = { color: 'rgba(255,255,255,0.04)' };
  Chart.defaults.elements.bar.borderRadius = 3;
  Chart.defaults.elements.line.tension = 0.35;
  Chart.defaults.animation.duration = 900;
  Chart.defaults.animation.easing = 'easeOutQuart';
}

const C = {
  yellow: { bg: 'rgba(251,191,36,.15)', border: '#FBBF24', solid: '#FBBF24' },
  blue:   { bg: 'rgba(59,130,246,.15)', border: '#3B82F6', solid: '#3B82F6' },
  green:  { bg: 'rgba(16,185,129,.15)', border: '#10B981', solid: '#10B981' },
  red:    { bg: 'rgba(239,68,68,.15)', border: '#EF4444', solid: '#EF4444' },
  purple: { bg: 'rgba(139,92,246,.15)', border: '#8B5CF6', solid: '#8B5CF6' },
  cyan:   { bg: 'rgba(6,182,212,.15)', border: '#06B6D4', solid: '#06B6D4' },
  amber:  { bg: 'rgba(245,158,11,.15)', border: '#F59E0B', solid: '#F59E0B' },
  gray:   { bg: 'rgba(100,116,139,.15)', border: '#64748B', solid: '#64748B' }
};
function gradient(ctx, col) {
  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, col.bg); g.addColorStop(1, 'rgba(0,0,0,0)');
  return g;
}

// ---- MOBILE MENU ----
function initMobile() {
  document.querySelectorAll('.mobile-menu').forEach(b => {
    b.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  });
}

// ---- PAGE INIT ----
function initPage(pageId) {
  if (!Auth.require()) return false;
  buildSidebar(pageId);
  initMobile();
  initChartDefaults();
  requestAnimationFrame(() => { initReveal(); initCountUps(); });
  return true;
}

// ---- PHOTO HANDLING ----
function setupPhotoUpload(inputId, previewId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('change', (e) => {
    const preview = document.getElementById(previewId);
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.className = 'photo-thumb';
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

// ---- SIGNATURE PAD (simple) ----
class SignaturePad {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.drawing = false;
    this.resize();
    this.canvas.addEventListener('mousedown', (e) => this.start(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.drawing = false);
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); this.start(e.touches[0]); });
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.draw(e.touches[0]); });
    this.canvas.addEventListener('touchend', () => this.drawing = false);
    window.addEventListener('resize', () => this.resize());
  }
  resize() { const r = this.canvas.getBoundingClientRect(); this.canvas.width = r.width; this.canvas.height = r.height; }
  start(e) { this.drawing = true; const r = this.canvas.getBoundingClientRect(); this.ctx.beginPath(); this.ctx.moveTo(e.clientX - r.left, e.clientY - r.top); }
  draw(e) { if (!this.drawing) return; const r = this.canvas.getBoundingClientRect(); this.ctx.lineTo(e.clientX - r.left, e.clientY - r.top); this.ctx.strokeStyle = '#FBBF24'; this.ctx.lineWidth = 2; this.ctx.lineCap = 'round'; this.ctx.stroke(); }
  clear() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  toDataURL() { return this.canvas.toDataURL(); }
  isEmpty() { const d = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data; return !d.some((v, i) => i % 4 === 3 && v > 0); }
}
