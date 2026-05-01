/* ═══════════════════════════════════════════════════════════
   CONSTRUCTION MANAGEMENT SYSTEM — CONFIG
   
   HOW TO SET UP:
   1. Deploy Code.gs as Web App in Google Apps Script
   2. Copy the Web App URL
   3. Paste it below as GAS_URL
   4. That's it! Everything connects to your Google Sheet.
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  // ── Google Apps Script Web App URL ────────────────────
  // After deploying Code.gs, paste the URL here
  // It looks like: https://script.google.com/macros/s/XXXXX/exec
  GAS_URL: "https://script.google.com/macros/s/AKfycbzmpyJyKnLbm481LWEoT_KEhjO42_TksJDdErnNf9VvINrIKW2YOM9CLqP49XOQ53xdWw/exec",

  // ── Google Sheet ID ───────────────────────────────────
  SHEET_HSE_ID: "1tfcQ64r5-WIdRfrBp_N07AGNYY8R67DSaS9DbLRWKgw",

  // ── App Settings ──────────────────────────────────────
  APP_NAME: "Construction Management System",
  APP_SHORT: "CMS",
  TIMEZONE: "Asia/Singapore",
  DATE_FORMAT: "en-SG",
};

// ── API Helper — All requests go through GAS ──────────────
// GET requests use ?path=xxx
// POST requests send {path: "xxx", ...data}

const ENDPOINTS = {
  // Auth
  LOGIN:              "cms-login",

  // PTW
  PTW_SUBMIT:         "ptw-submit",
  PTW_LIST:           "ptw-list",
  PTW_APPROVE:        "ptw-approve",
  PTW_REVOKE:         "ptw-revoke",

  // TBM
  TBM_SUBMIT:         "tbm-submit",
  TBM_LIST:           "tbm-list",

  // Safety
  SAFETY_SUBMIT:      "safety-submit",
  SAFETY_LIST:        "safety-list",
  SAFETY_DETAIL:      "safety-detail",
  SAFETY_RECTIFY:     "safety-rectify",
  SAFETY_CLOSE:       "safety-close",
  SAFETY_REOPEN:      "safety-reopen",

  // QAQC
  QAQC_SUBMIT:        "qaqc-submit",
  QAQC_LIST:          "qaqc-list",

  // Defect
  DEFECT_SUBMIT:      "defect-submit",
  DEFECT_LIST:        "defect-list",
  DEFECT_UPDATE:      "defect-update",

  // Analytics
  ANALYTICS:          "analytics",

  // Checklist Admin
  CHECKLIST_LIST:     "checklist-list",
  CHECKLIST_ADD:      "checklist-add",
  CHECKLIST_DELETE:   "checklist-delete",

  // Photo Upload
  UPLOAD_PHOTO:       "upload-photo",

  // Users
  USER_LIST:          "user-list",
  ADD_USER:           "add-user",

  // PTW Checklists & Projects (from Sheet)
  PTW_CHECKLISTS:     "ptw-checklists",
  PROJECTS:           "projects",
};

// ── User Roles ────────────────────────────────────────────
const ROLES = {
  SUPERVISOR: { name: "Supervisor", icon: "👷", level: 1 },
  PIC:        { name: "Person In Charge", icon: "📋", level: 2 },
  EHS:        { name: "EHS Officer", icon: "🛡️", level: 3 },
  SAFETY:     { name: "Safety Officer", icon: "🛡️", level: 3 },
  PM:         { name: "Project Manager", icon: "🏗️", level: 4 },
  QAQC:       { name: "QA/QC Inspector", icon: "🔍", level: 5 },
  ADMIN:      { name: "Superadmin", icon: "⚙️", level: 99 },
};

// ── Default Checklists (fallback if GAS is unreachable) ───
const DEFAULT_CHECKLISTS = {
  WORK_TYPE: ["Hot Work","Cold Work","Confined Space","Working at Height","Excavation","Electrical Work","Lifting Operation","Painting/Coating","Demolition","General"],
  RISK_LEVEL: ["Low","Medium","High","Critical"],
  TYPE_OF_FINDING: ["Housekeeping","PPE Violation","Fall Protection","Scaffolding","Electrical","Fire Safety","Chemical Handling","Signage","Equipment","Environmental","Others"],
  SEVERITY: ["Minor","Major","Critical"],
  PPE: ["Safety Helmet","Safety Boots","Safety Vest","Safety Goggles","Ear Plugs","Gloves","Face Shield","Harness","Respirator"],
  PRIORITY: ["Low","Medium","High","Urgent"],
  SAFETY_CHECKLIST: ["PPE Compliance","Housekeeping","Barricade/Signage","Fire Extinguisher","First Aid Kit","Toolbox Meeting Done","Permit Displayed","Emergency Exit Clear"]
};

// ── PTW Status Flow ───────────────────────────────────────
const PTW_STATUS = {
  PENDING_PIC: "pending_pic",
  PENDING_EHS: "pending_ehs",
  PENDING_PM: "pending_pm",
  APPROVED: "approved",
  CLOSED: "closed",
  REJECTED: "rejected",
  REVOKED: "revoked"
};
