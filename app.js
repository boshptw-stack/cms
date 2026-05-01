/* ═══════════════════════════════════════════════════════════
   CONSTRUCTION MANAGEMENT SYSTEM — SHARED UTILITIES
   This file is loaded by every page (except login.html)
   ═══════════════════════════════════════════════════════════ */

// ── Session / Auth ────────────────────────────────────────

function getCurrentUser() {
  const user = localStorage.getItem("cms_user");
  return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
  localStorage.setItem("cms_user", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("cms_user");
  window.location.href = "login.html";
}

function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function requireRole(allowedRoles) {
  const user = requireLogin();
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) {
    showToast("Access denied. Required role: " + allowedRoles.join(", "), "error");
    return null;
  }
  return user;
}

function hasRole(role) {
  const user = getCurrentUser();
  return user && (user.role === role || user.role === "ADMIN");
}

// ── Navbar Setup ──────────────────────────────────────────

function setupNavbar(activePage) {
  const user = getCurrentUser();
  if (!user) return;

  // Set brand
  const brand = document.querySelector(".navbar-brand");
  if (brand) brand.innerHTML = `<span class="icon">🏗️</span> CMS`;

  // Set user info
  const userEl = document.querySelector(".navbar-user");
  if (userEl) {
    userEl.innerHTML = `
      <span>${user.name}</span>
      <span class="role-badge">${user.role}</span>
      <button class="btn btn-sm btn-outline" onclick="logout()" style="color:white;border-color:rgba(255,255,255,0.3)">Logout</button>
    `;
  }

  // Highlight active page
  document.querySelectorAll(".navbar-links a").forEach(link => {
    if (link.getAttribute("href") === activePage) {
      link.classList.add("active");
    }
  });

  // Hide admin link for non-admins
  const adminLink = document.querySelector('.navbar-links a[href="admin.html"]');
  if (adminLink && user.role !== "ADMIN") {
    adminLink.style.display = "none";
  }

  // Mobile toggle
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".navbar-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });
  }
}

// ── API Helpers (n8n Webhooks) ─────────────────────────────

async function apiGet(endpoint, params = {}) {
  try {
    params.path = endpoint;
    const query = new URLSearchParams(params).toString();
    const fullUrl = `${CONFIG.GAS_URL}?${query}`;
    const resp = await fetch(fullUrl, { redirect: 'follow' });
    const text = await resp.text();
    try { return JSON.parse(text); } catch (e) { console.error("Parse error:", text); return null; }
  } catch (err) {
    console.error("API GET Error:", err);
    return null;
  }
}

async function apiPost(endpoint, data = {}) {
  try {
    const user = getCurrentUser();
    if (user) {
      data._user = { name: user.name, email: user.email, role: user.role };
    }
    data.path = endpoint;
    const resp = await fetch(CONFIG.GAS_URL, {
      method: "POST",
      redirect: 'follow',
      body: JSON.stringify(data)
    });
    const text = await resp.text();
    try { return JSON.parse(text); } catch (e) { console.error("Parse error:", text); return null; }
  } catch (err) {
    console.error("API POST Error:", err);
    showToast("Failed to submit. Check connection.", "error");
    return null;
  }
}

// ── Toast Notifications ───────────────────────────────────

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || "ℹ️"}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Loading Overlay ───────────────────────────────────────

function showLoading(msg = "Loading...") {
  let overlay = document.querySelector(".loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `<div class="spinner"></div><span>${msg}</span>`;
  overlay.style.display = "flex";
}

function hideLoading() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) overlay.style.display = "none";
}

// ── Fill Select Dropdowns from Checklists ─────────────────

async function fillSelect(selectId, category, includeBlank = true) {
  const select = document.getElementById(selectId);
  if (!select) return;

  let items = [];
  try {
    const resp = await apiGet(ENDPOINTS.CHECKLIST_LIST, { category });
    if (resp && resp.data) {
      items = resp.data.map(item => item.value || item.Value);
    }
  } catch (e) {
    console.warn("Checklist fetch failed, using defaults");
  }

  // Fallback to defaults
  if (items.length === 0 && DEFAULT_CHECKLISTS[category]) {
    items = DEFAULT_CHECKLISTS[category];
  }

  select.innerHTML = "";
  if (includeBlank) {
    select.innerHTML = '<option value="">-- Select --</option>';
  }
  items.forEach(val => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    select.appendChild(opt);
  });
}

// ── Fill Checkbox Groups ──────────────────────────────────

async function fillCheckboxes(containerId, category, nameAttr) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let items = [];
  try {
    const resp = await apiGet(ENDPOINTS.CHECKLIST_LIST, { category });
    if (resp && resp.data) {
      items = resp.data.map(item => item.value || item.Value);
    }
  } catch (e) {
    console.warn("Checklist fetch failed, using defaults");
  }

  if (items.length === 0 && DEFAULT_CHECKLISTS[category]) {
    items = DEFAULT_CHECKLISTS[category];
  }

  container.innerHTML = "";
  items.forEach(val => {
    const label = document.createElement("label");
    label.className = "checkbox-item";
    label.innerHTML = `<input type="checkbox" name="${nameAttr}" value="${val}"> ${val}`;
    container.appendChild(label);
  });
}

// ── Get Checked Values ────────────────────────────────────

function getCheckedValues(name) {
  const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checked).map(cb => cb.value);
}

// ── Badge HTML Generator ──────────────────────────────────

function getBadgeHTML(status) {
  const map = {
    SUBMITTED: "submitted", OPEN: "open",
    PIC_APPROVED: "pending", SAFETY_APPROVED: "pending",
    PM_APPROVED: "approved", APPROVED: "approved",
    COMPLETED: "completed", CLOSED: "closed",
    REJECTED: "rejected", REVOKED: "revoked",
    RECTIFIED: "rectified",
    "IN PROGRESS": "progress", IN_PROGRESS: "progress",
    CRITICAL: "critical", MAJOR: "major", MINOR: "minor",
    LOW: "minor", MEDIUM: "pending", HIGH: "major", URGENT: "critical"
  };
  const cls = map[status] || "submitted";
  return `<span class="badge badge-${cls}">${status}</span>`;
}

// ── GPS / Geolocation ─────────────────────────────────────

function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ── Photo Upload Helpers ──────────────────────────────────

function setupPhotoUpload(inputId, previewId, maxPhotos = 20) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;

  // Store files array on the input element
  input._files = [];

  input.addEventListener("change", (e) => {
    const newFiles = Array.from(e.target.files);
    const remaining = maxPhotos - input._files.length;
    if (remaining <= 0) {
      showToast(`Maximum ${maxPhotos} photos allowed`, "warning");
      return;
    }
    const toAdd = newFiles.slice(0, remaining);
    input._files.push(...toAdd);
    renderPhotoPreviews(input, preview);
  });
}

function renderPhotoPreviews(input, preview) {
  preview.innerHTML = "";
  input._files.forEach((file, idx) => {
    const div = document.createElement("div");
    div.className = "preview-item";
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = "×";
    removeBtn.onclick = () => {
      input._files.splice(idx, 1);
      renderPhotoPreviews(input, preview);
    };
    div.appendChild(img);
    div.appendChild(removeBtn);
    preview.appendChild(div);
  });
}

function getPhotoFiles(inputId) {
  const input = document.getElementById(inputId);
  return input ? (input._files || []) : [];
}

// Convert files to base64 for n8n upload
async function filesToBase64(files) {
  const promises = files.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        data: reader.result.split(",")[1]  // Remove data:image/...;base64, prefix
      });
      reader.readAsDataURL(file);
    });
  });
  return Promise.all(promises);
}

// Upload photos via n8n webhook (returns array of URLs)
async function uploadPhotos(files, folder) {
  if (!files || files.length === 0) return [];

  const base64Files = await filesToBase64(files);
  const urls = [];

  for (const file of base64Files) {
    try {
      const resp = await apiPost(ENDPOINTS.UPLOAD_PHOTO, {
        fileName: file.name,
        fileType: file.type,
        fileData: file.data,
        folder: folder
      });
      if (resp && resp.url) {
        urls.push(resp.url);
      }
    } catch (e) {
      console.error("Photo upload failed:", file.name, e);
    }
  }
  return urls;
}

// ── Signature Pad ─────────────────────────────────────────

function initSignaturePad(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  // Set actual canvas dimensions
  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.strokeStyle = "#0B1220";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
  resize();
  window.addEventListener("resize", resize);

  let drawing = false;
  let lastX = 0, lastY = 0;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x; lastY = pos.y;
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x; lastY = pos.y;
  });
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("mouseleave", () => drawing = false);

  // Touch support
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    lastX = pos.x; lastY = pos.y;
  });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x; lastY = pos.y;
  });
  canvas.addEventListener("touchend", () => drawing = false);

  return {
    clear: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    isEmpty: () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return false;
      }
      return true;
    },
    toBase64: () => canvas.toDataURL("image/png")
  };
}

// ── Date Helpers ──────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString(CONFIG.DATE_FORMAT, {
    year: "numeric", month: "short", day: "numeric"
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString(CONFIG.DATE_FORMAT, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function nowISO() {
  return new Date().toISOString();
}

// ── ID Generators ─────────────────────────────────────────

function generateId(prefix) {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}-${datePart}-${rand}`;
}

// ── Table Helper ──────────────────────────────────────────

function renderTable(tableId, headers, rows) {
  const table = document.getElementById(tableId);
  if (!table) return;

  let html = "<thead><tr>";
  headers.forEach(h => { html += `<th>${h}</th>`; });
  html += "</tr></thead><tbody>";

  if (rows.length === 0) {
    html += `<tr><td colspan="${headers.length}" class="text-center text-muted" style="padding:32px">No records found</td></tr>`;
  } else {
    rows.forEach(row => {
      html += "<tr>";
      row.forEach(cell => { html += `<td>${cell}</td>`; });
      html += "</tr>";
    });
  }
  html += "</tbody>";
  table.innerHTML = html;
}

// ── Modal Helpers ─────────────────────────────────────────

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

// Close modal on overlay click
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) {
    e.target.classList.remove("active");
  }
});

// ── Tab Switching ─────────────────────────────────────────

function setupTabs(containerSelector) {
  const container = document.querySelector(containerSelector || ".tabs");
  if (!container) return;

  container.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active from all tabs
      container.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Show target content
      const target = btn.dataset.tab;
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
      const content = document.getElementById(target);
      if (content) content.classList.add("active");
    });
  });
}

// ── Form Validation ───────────────────────────────────────

function validateRequired(fields) {
  for (const field of fields) {
    const el = document.getElementById(field.id);
    if (!el) continue;
    const val = el.value.trim();
    if (!val) {
      showToast(`${field.label} is required`, "error");
      el.focus();
      return false;
    }
  }
  return true;
}

// ── Navbar HTML (shared across pages) ─────────────────────

function getNavbarHTML() {
  return `
    <nav class="navbar">
      <div class="navbar-brand"><span class="icon">🏗️</span> CMS</div>
      <button class="nav-toggle" aria-label="Menu">☰</button>
      <div class="navbar-links">
        <a href="dashboard.html">📊 Dashboard</a>
        <div class="nav-dropdown" id="ddSafety">
          <button class="nav-dropdown-btn" onclick="toggleDropdown('ddSafety')">🛡️ HSE Safety ▾</button>
          <div class="nav-dropdown-menu">
            <a href="ptw.html"><span class="dd-icon">📋</span><div><div class="dd-label">Permit to Work (PTW)</div><div class="dd-desc">Submit & manage work permits</div></div></a>
            <a href="tbm.html"><span class="dd-icon">🔧</span><div><div class="dd-label">Toolbox Meeting (TBM)</div><div class="dd-desc">Daily toolbox meeting records</div></div></a>
            <a href="safety.html"><span class="dd-icon">🛡️</span><div><div class="dd-label">Safety Inspection</div><div class="dd-desc">Daily site inspection reports</div></div></a>
          </div>
        </div>
        <div class="nav-dropdown" id="ddQuality">
          <button class="nav-dropdown-btn" onclick="toggleDropdown('ddQuality')">🔍 Quality ▾</button>
          <div class="nav-dropdown-menu">
            <a href="qaqc.html"><span class="dd-icon">🔍</span><div><div class="dd-label">Quality Inspection</div><div class="dd-desc">QAQC inspection records</div></div></a>
            <a href="defect.html"><span class="dd-icon">🐛</span><div><div class="dd-label">Defect Management</div><div class="dd-desc">Track & resolve defects</div></div></a>
          </div>
        </div>
        <a href="admin.html">⚙️ Admin</a>
      </div>
      <div class="navbar-user"></div>
    </nav>
    <div class="hazard-stripe"></div>
  `;
}

function toggleDropdown(id) {
  const all = document.querySelectorAll('.nav-dropdown');
  all.forEach(d => { if (d.id !== id) d.classList.remove('open'); });
  document.getElementById(id).classList.toggle('open');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-dropdown')) {
    document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  }
});
