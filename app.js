/* ============================================
   BOSH CMS — Shared JavaScript
   API Layer · Auth · UI Utilities
   ============================================ */

// ---- CONFIG ----
const CONFIG = {
  SHEET_ID: '1tfcQ64r5-WIdRfrBp_N07AGNYY8R67DSaS9DbLRWKgw',
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzmpyJyKnLbm481LWEoT_KEhjO42_TksJDdErnNf9VvINrIKW2YOM9CLqP49XOQ53xdWw/exec',
  BASE_PATH: '/cms/'
};

// ---- AUTH ----
const Auth = {
  getUser() {
    const u = sessionStorage.getItem('cms_user');
    return u ? JSON.parse(u) : null;
  },
  setUser(user) {
    sessionStorage.setItem('cms_user', JSON.stringify(user));
  },
  logout() {
    sessionStorage.removeItem('cms_user');
    window.location.href = CONFIG.BASE_PATH + 'index.html';
  },
  requireAuth() {
    if (!this.getUser()) {
      window.location.href = CONFIG.BASE_PATH + 'index.html';
      return false;
    }
    return true;
  }
};

// ---- API LAYER ----
const API = {
  async call(action, params = {}) {
    try {
      const url = new URL(CONFIG.SCRIPT_URL);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const resp = await fetch(url.toString());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error(`API Error [${action}]:`, err);
      return null;
    }
  },
  async post(action, data = {}) {
    try {
      const resp = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...data })
      });
      return await resp.json();
    } catch (err) {
      console.error(`API POST Error [${action}]:`, err);
      return null;
    }
  },
  // Convenience methods
  async getDashboardData() { return this.call('getDashboard'); },
  async getPTWData(filters) { return this.call('getPTW', filters); },
  async getTBMData(filters) { return this.call('getTBM', filters); },
  async getSafetyData(filters) { return this.call('getSafetyInspection', filters); },
  async getPTWAnalytics(filters) { return this.call('getPTWAnalytics', filters); },
  async getTBMAnalytics(filters) { return this.call('getTBMAnalytics', filters); },
  async getSafetyAnalytics(filters) { return this.call('getSafetyAnalytics', filters); },
};

// ---- DEMO DATA (fallback when API unavailable) ----
const DemoData = {
  dashboard: {
    stats: {
      totalPTW: 247, activePTW: 38, totalTBM: 156, totalInspections: 89,
      pendingApproval: 12, criticalFindings: 5, complianceRate: 94, safeManHours: 15420
    },
    ptwByStatus: { active: 38, closed: 185, expired: 16, pending: 8 },
    ptwByType: { hot_work: 45, confined: 32, electrical: 28, excavation: 22, general: 120 },
    monthlyTrend: [
      { month: 'Jan', ptw: 18, tbm: 12, inspections: 8 },
      { month: 'Feb', ptw: 22, tbm: 15, inspections: 10 },
      { month: 'Mar', ptw: 28, tbm: 18, inspections: 12 },
      { month: 'Apr', ptw: 35, tbm: 22, inspections: 14 },
      { month: 'May', ptw: 42, tbm: 25, inspections: 16 },
      { month: 'Jun', ptw: 38, tbm: 28, inspections: 11 },
      { month: 'Jul', ptw: 45, tbm: 30, inspections: 18 }
    ],
    recentPTW: [
      { id: 'PTW-247', type: 'Hot Work', location: 'Block A L5', status: 'Active', date: '2026-04-30', supervisor: 'Ahmad' },
      { id: 'PTW-246', type: 'Confined Space', location: 'Block B B1', status: 'Pending', date: '2026-04-29', supervisor: 'Raj' },
      { id: 'PTW-245', type: 'Electrical', location: 'Block C L3', status: 'Active', date: '2026-04-28', supervisor: 'Lim' },
      { id: 'PTW-244', type: 'General', location: 'Block A L2', status: 'Closed', date: '2026-04-27', supervisor: 'Ali' },
      { id: 'PTW-243', type: 'Excavation', location: 'Block D G', status: 'Expired', date: '2026-04-26', supervisor: 'Tan' }
    ],
    inspectionResults: { pass: 72, fail: 8, partial: 9 },
    safetyFindings: [
      { category: 'Housekeeping', count: 18, severity: 'Low' },
      { category: 'PPE Compliance', count: 12, severity: 'Medium' },
      { category: 'Fall Protection', count: 8, severity: 'High' },
      { category: 'Electrical', count: 5, severity: 'Critical' },
      { category: 'Fire Safety', count: 7, severity: 'Medium' }
    ]
  },
  ptwAnalytics: {
    stats: { total: 247, active: 38, avgDuration: 4.2, renewalRate: 18 },
    byType: { hot_work: 45, confined: 32, electrical: 28, excavation: 22, general: 120 },
    byBlock: { 'Block A': 82, 'Block B': 65, 'Block C': 48, 'Block D': 52 },
    monthly: [
      { month: 'Jan', issued: 18, closed: 15, expired: 2 },
      { month: 'Feb', issued: 22, closed: 19, expired: 1 },
      { month: 'Mar', issued: 28, closed: 24, expired: 3 },
      { month: 'Apr', issued: 35, closed: 30, expired: 2 },
      { month: 'May', issued: 42, closed: 38, expired: 4 },
      { month: 'Jun', issued: 38, closed: 34, expired: 2 },
      { month: 'Jul', issued: 45, closed: 40, expired: 2 }
    ],
    topSupervisors: [
      { name: 'Ahmad Bin Hassan', count: 42, completion: 95 },
      { name: 'Raj Kumar', count: 38, completion: 92 },
      { name: 'Lim Wei Ming', count: 35, completion: 97 },
      { name: 'Ali Ibrahim', count: 32, completion: 88 },
      { name: 'Tan Ah Kow', count: 28, completion: 94 }
    ]
  },
  tbmAnalytics: {
    stats: { total: 156, thisMonth: 28, avgAttendance: 18, completionRate: 92 },
    byTopic: { 'Working at Height': 28, 'Electrical Safety': 24, 'Fire Prevention': 22, 'PPE Usage': 20, 'Chemical Handling': 18, 'Housekeeping': 16, 'Heat Stress': 14, 'Other': 14 },
    attendance: [
      { month: 'Jan', count: 12, avg: 16 },
      { month: 'Feb', count: 15, avg: 17 },
      { month: 'Mar', count: 18, avg: 19 },
      { month: 'Apr', count: 22, avg: 18 },
      { month: 'May', count: 25, avg: 20 },
      { month: 'Jun', count: 28, avg: 17 },
      { month: 'Jul', count: 30, avg: 18 }
    ],
    byBlock: { 'Block A': 48, 'Block B': 38, 'Block C': 35, 'Block D': 35 }
  },
  safetyAnalytics: {
    stats: { total: 89, passRate: 81, criticalFindings: 5, avgScore: 87 },
    results: { pass: 72, fail: 8, partial: 9 },
    byCategory: {
      'Housekeeping': { total: 18, pass: 15, fail: 3 },
      'PPE Compliance': { total: 16, pass: 13, fail: 3 },
      'Fall Protection': { total: 14, pass: 10, fail: 4 },
      'Fire Safety': { total: 12, pass: 10, fail: 2 },
      'Electrical': { total: 10, pass: 8, fail: 2 },
      'Scaffolding': { total: 10, pass: 9, fail: 1 },
      'Excavation': { total: 9, pass: 7, fail: 2 }
    },
    monthly: [
      { month: 'Jan', inspections: 8, passRate: 75 },
      { month: 'Feb', inspections: 10, passRate: 78 },
      { month: 'Mar', inspections: 12, passRate: 80 },
      { month: 'Apr', inspections: 14, passRate: 82 },
      { month: 'May', inspections: 16, passRate: 85 },
      { month: 'Jun', inspections: 11, passRate: 83 },
      { month: 'Jul', inspections: 18, passRate: 88 }
    ],
    topFindings: [
      { finding: 'Missing barricade at opening', count: 8, severity: 'High' },
      { finding: 'Improper PPE usage', count: 7, severity: 'Medium' },
      { finding: 'Blocked emergency exit', count: 5, severity: 'Critical' },
      { finding: 'Unsecured scaffolding', count: 5, severity: 'High' },
      { finding: 'Expired fire extinguisher', count: 4, severity: 'Medium' }
    ]
  }
};

// ---- UI UTILITIES ----

// Scroll-triggered animation observer
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.stat-card, .chart-card, .table-card, .analytics-hero').forEach(el => {
    observer.observe(el);
  });
}

// Count-up animation
function animateCountUp(element, target, duration = 1200, prefix = '', suffix = '') {
  const start = 0;
  const startTime = performance.now();
  const isFloat = target % 1 !== 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    element.textContent = prefix + (isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Init count-ups when visible
function initCountUps() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        animateCountUp(el, target, 1200, prefix, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.count-up').forEach(el => observer.observe(el));
}

// Toast notification
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Loading overlay
function showLoading(text = 'Loading data...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="spinner"></div><div class="loading-text">${text}</div>`;
    document.body.appendChild(overlay);
  }
  overlay.classList.remove('hidden');
}
function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ---- SIDEBAR RENDERER ----
function renderSidebar(activePage) {
  const user = Auth.getUser() || { username: 'User', role: 'Viewer' };
  const initials = user.username.substring(0, 2).toUpperCase();

  const navItems = [
    { section: 'Overview', items: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard', href: 'dashboard.html' }
    ]},
    { section: 'Modules', items: [
      { id: 'ptw', icon: '📋', label: 'PTW', href: 'ptw.html' },
      { id: 'tbm', icon: '👷', label: 'TBM', href: 'tbm.html' },
      { id: 'safety', icon: '🛡️', label: 'Safety Inspection', href: 'safety.html' },
    ]},
    { section: 'Analytics', items: [
      { id: 'ptw-analytics', icon: '📈', label: 'PTW Analytics', href: 'ptw-analytics.html' },
      { id: 'tbm-analytics', icon: '📉', label: 'TBM Analytics', href: 'tbm-analytics.html' },
      { id: 'safety-analytics', icon: '🔍', label: 'Inspection Analytics', href: 'safety-analytics.html' },
    ]}
  ];

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="logo-icon">🏗️</div>
      <div class="logo-text">
        <h2>BOSH CMS</h2>
        <span>Construction Management</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${navItems.map(section => `
        <div class="nav-section">
          <div class="nav-section-title">${section.section}</div>
          ${section.items.map(item => `
            <a href="${CONFIG.BASE_PATH}${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </div>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="user-info" onclick="Auth.logout()" title="Click to logout">
        <div class="user-avatar">${initials}</div>
        <div class="user-details">
          <div class="name">${user.username}</div>
          <div class="role">${user.role} · Sign Out</div>
        </div>
      </div>
    </div>
  `;
  document.body.querySelector('.app-layout').prepend(sidebar);
}

// ---- MOBILE TOGGLE ----
function initMobileMenu() {
  const toggle = document.querySelector('.mobile-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
}

// ---- CHART.JS THEME DEFAULTS ----
function setChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#8b98b0';
  Chart.defaults.borderColor = '#1e2d45';
  Chart.defaults.font.family = "'DM Sans', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = '#1a2234';
  Chart.defaults.plugins.tooltip.borderColor = '#2a3f5f';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: '600' };
  Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
  Chart.defaults.scale.grid = { color: 'rgba(30,45,69,0.5)', drawBorder: false };
  Chart.defaults.elements.bar.borderRadius = 4;
  Chart.defaults.elements.line.tension = 0.35;
  Chart.defaults.animation.duration = 1000;
  Chart.defaults.animation.easing = 'easeOutQuart';
}

// ---- CHART COLOR PALETTE ----
const CHART_COLORS = {
  blue: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', solid: '#3b82f6' },
  green: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', solid: '#10b981' },
  amber: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', solid: '#f59e0b' },
  red: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', solid: '#ef4444' },
  purple: { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6', solid: '#8b5cf6' },
  cyan: { bg: 'rgba(6,182,212,0.15)', border: '#06b6d4', solid: '#06b6d4' },
  pink: { bg: 'rgba(236,72,153,0.15)', border: '#ec4899', solid: '#ec4899' },
  gray: { bg: 'rgba(107,114,128,0.15)', border: '#6b7280', solid: '#6b7280' }
};

// Gradient fill for area charts
function createGradient(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, color.bg);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  return gradient;
}

// ---- BADGE HELPER ----
function statusBadge(status) {
  const s = (status || '').toLowerCase();
  let cls = 'badge-draft';
  if (['active','approved','open','pass','passed'].includes(s)) cls = 'badge-active';
  else if (['pending','review','in review'].includes(s)) cls = 'badge-pending';
  else if (['closed','expired','fail','failed','rejected'].includes(s)) cls = 'badge-closed';
  return `<span class="badge ${cls}">${status}</span>`;
}

// Severity badge
function severityBadge(sev) {
  const s = (sev || '').toLowerCase();
  const colors = {
    low: 'badge-active', medium: 'badge-pending',
    high: 'badge-closed', critical: 'badge-closed'
  };
  return `<span class="badge ${colors[s] || 'badge-draft'}">${sev}</span>`;
}

// ---- FORMAT HELPERS ----
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---- PAGE INIT ----
function initPage(activePage) {
  if (!Auth.requireAuth()) return false;
  renderSidebar(activePage);
  initMobileMenu();
  setChartDefaults();
  // Delay scroll animations slightly so DOM settles
  requestAnimationFrame(() => {
    initScrollAnimations();
    initCountUps();
  });
  return true;
}
