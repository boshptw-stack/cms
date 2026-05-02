/* ============================================
   BOSH CMS — Google Apps Script Backend (Code.gs)
   
   SETUP:
   1. Go to https://script.google.com
   2. Create new project → paste this code
   3. Deploy → New Deployment → Web App
   4. Execute as: Me, Access: Anyone
   5. Copy the URL → update config.js GAS_URL
   
   GOOGLE SHEET TABS NEEDED:
   USERS, PTW, TBM, SAFETY, SAFETY_ISSUES,
   PROJECTS, PTW_CHECKLISTS, QAQC, DEFECT
   ============================================ */

const SHEET_ID = '1tfcQ64r5-WIdRfrBp_N07AGNYY8R67DSaS9DbLRWKgw';

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add headers based on tab name
    const headers = {
      'USERS': ['username','password','role','email','status','createdAt'],
      'PTW': ['id','type','location','startDate','endDate','description','workers','company','project','pic','ehs','pm','status','checklist','signature','submittedBy','submittedAt','approvals','rejectionReason','revokedBy','closedBy'],
      'TBM': ['id','date','topic','location','project','description','workers','company','hazards','ppe','feedback','conductor','signature','attendance','status','submittedAt','reviewedBy','reviewedAt'],
      'SAFETY': ['id','date','location','project','contractor','inspector','signature','status','issueCount','submittedAt'],
      'SAFETY_ISSUES': ['inspectionId','issueIndex','description','severity','status','rectifiedBy','rectifiedAt','closedBy','closedAt'],
      'PROJECTS': ['name','location','status','createdAt'],
      'PTW_CHECKLISTS': ['type','name','item1','item2','item3','item4','item5','item6','item7','item8','item9','item10','item11','item12','item13','item14','item15','item16','item17','item18','item19','item20','item21'],
      'QAQC': ['id','date','location','category','description','inspector','status','submittedAt'],
      'DEFECT': ['id','date','location','description','severity','status','assigned','reportedBy','submittedAt','updatedBy','updatedAt']
    };
    if (headers[name]) sheet.appendRow(headers[name]);
  }
  return sheet;
}

function getData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map(h => obj[h] || '');
  sheet.appendRow(row);
}

function updateRow(sheetName, matchField, matchValue, updates) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(matchField);
  if (colIdx === -1) return false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]) === String(matchValue)) {
      Object.entries(updates).forEach(([key, val]) => {
        const ci = headers.indexOf(key);
        if (ci !== -1) sheet.getRange(i + 1, ci + 1).setValue(val);
      });
      return true;
    }
  }
  return false;
}

function nextId(prefix, sheetName) {
  const data = getData(sheetName);
  if (!data.length) return prefix + '-001';
  const nums = data.map(r => parseInt(String(r.id).replace(prefix + '-', '')) || 0);
  return prefix + '-' + String(Math.max(...nums) + 1).padStart(3, '0');
}

// ---- HTTP HANDLERS ----
function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    switch (action) {
      case 'login':
        result = handleLogin(e.parameter.username, e.parameter.password);
        break;
      case 'getDashboard':
        result = getDashboard();
        break;
      case 'getPTW':
        result = { items: getData('PTW').reverse() };
        break;
      case 'getTBM':
        result = { items: getData('TBM').reverse() };
        break;
      case 'getSafetyInspections':
        result = getSafetyInspections();
        break;
      case 'getQAQC':
        result = { items: getData('QAQC').reverse() };
        break;
      case 'getDefects':
        result = { items: getData('DEFECT').reverse() };
        break;
      case 'getUsers':
        result = { items: getData('USERS').map(u => ({ username: u.username, role: u.role, email: u.email, status: u.status || 'Active' })) };
        break;
      case 'getProjects':
        result = { items: getData('PROJECTS') };
        break;
      case 'getChecklist':
        result = getChecklist(e.parameter.type);
        break;
      case 'getChecklists':
        result = { items: getChecklists(e.parameter.type) };
        break;
      case 'getPTWAnalytics':
        result = getPTWAnalytics();
        break;
      case 'getTBMAnalytics':
        result = getTBMAnalytics();
        break;
      case 'getSafetyAnalytics':
        result = getSafetyAnalytics();
        break;
      case 'ptwPDF':
        return generatePTWPDF(e.parameter.id);
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON' })).setMimeType(ContentService.MimeType.JSON);
  }
  let result;
  try {
    switch (body.action) {
      case 'submitPTW':
        result = submitPTW(body);
        break;
      case 'approvePTW':
        result = approvePTW(body);
        break;
      case 'rejectPTW':
        result = rejectPTW(body);
        break;
      case 'revokePTW':
        result = revokePTW(body);
        break;
      case 'closePTW':
        result = closePTW(body);
        break;
      case 'submitTBM':
        result = submitTBM(body);
        break;
      case 'submitInspection':
        result = submitInspection(body);
        break;
      case 'rectifyIssue':
        result = rectifyIssue(body);
        break;
      case 'closeIssue':
        result = closeIssue(body);
        break;
      case 'submitQAQC':
        result = submitQAQC(body);
        break;
      case 'submitDefect':
        result = submitDefect(body);
        break;
      case 'updateDefect':
        result = updateDefect(body);
        break;
      case 'addUser':
        result = addUser(body);
        break;
      case 'deleteUser':
        result = deleteUser(body);
        break;
      case 'addProject':
        result = addProject(body);
        break;
      default:
        result = { error: 'Unknown action: ' + body.action };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// ---- AUTH ----
function handleLogin(username, password) {
  const users = getData('USERS');
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (user) return { success: true, role: user.role, username: user.username };
  return { success: false, error: 'Invalid credentials' };
}

// ---- DASHBOARD ----
function getDashboard() {
  const ptw = getData('PTW');
  const tbm = getData('TBM');
  const safety = getData('SAFETY');
  const issues = getData('SAFETY_ISSUES');
  
  const activePTW = ptw.filter(p => p.status === 'Active' || p.status === 'Approved').length;
  const pending = ptw.filter(p => ['Pending PIC','Pending EHS','Pending PM'].includes(p.status)).length;
  const critical = issues.filter(i => i.severity === 'Critical' && i.status !== 'Closed').length;
  
  // Monthly trend (last 7 months)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    trend.push({
      m: months[m],
      p: ptw.filter(p => { const pd = new Date(p.submittedAt); return pd.getMonth() === m && pd.getFullYear() === y; }).length,
      t: tbm.filter(t => { const td = new Date(t.submittedAt); return td.getMonth() === m && td.getFullYear() === y; }).length,
      i: safety.filter(s => { const sd = new Date(s.submittedAt); return sd.getMonth() === m && sd.getFullYear() === y; }).length
    });
  }
  
  // PTW by status
  const byStatus = {};
  ptw.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1; });
  
  // PTW by type
  const byType = {};
  ptw.forEach(p => { byType[p.type] = (byType[p.type] || 0) + 1; });
  
  // Inspection results
  const inspResults = { Pass: 0, Fail: 0, Partial: 0 };
  safety.forEach(s => {
    const sIssues = issues.filter(i => i.inspectionId === s.id);
    const allClosed = sIssues.every(i => i.status === 'Closed');
    const anyOpen = sIssues.some(i => i.status === 'Open');
    if (sIssues.length === 0 || allClosed) inspResults.Pass++;
    else if (anyOpen) inspResults.Fail++;
    else inspResults.Partial++;
  });
  
  return {
    stats: { totalPTW: ptw.length, activePTW, tbm: tbm.length, inspections: safety.length, pending, critical },
    trend, byStatus, byType, inspResults,
    recent: ptw.slice(-5).reverse().map(p => ({
      id: p.id, type: p.type, loc: p.location, status: p.status,
      date: p.startDate, sup: p.submittedBy
    }))
  };
}

// ---- PTW ----
function submitPTW(data) {
  const id = nextId('PTW', 'PTW');
  appendRow('PTW', {
    id, type: data.type, location: data.location,
    startDate: data.startDate, endDate: data.endDate,
    description: data.description, workers: data.workers,
    company: data.company, project: data.project,
    pic: data.pic, status: 'Pending PIC',
    checklist: data.checklist, signature: data.signature,
    submittedBy: data.submittedBy, submittedAt: new Date().toISOString(),
    approvals: ''
  });
  return { success: true, id };
}

function approvePTW(data) {
  const ptw = getData('PTW').find(p => p.id === data.id);
  if (!ptw) return { error: 'PTW not found' };
  
  let newStatus;
  const approvalEntry = data.stage + ':' + data.approver + ':' + new Date().toISOString();
  const approvals = (ptw.approvals ? ptw.approvals + '|' : '') + approvalEntry;
  
  switch (data.stage) {
    case 'PIC': newStatus = 'Pending EHS'; break;
    case 'EHS': newStatus = 'Pending PM'; break;
    case 'PM': newStatus = 'Approved'; break;
    default: return { error: 'Invalid stage' };
  }
  
  updateRow('PTW', 'id', data.id, { status: newStatus, approvals });
  return { success: true };
}

function rejectPTW(data) {
  updateRow('PTW', 'id', data.id, { status: 'Rejected', rejectionReason: data.reason });
  return { success: true };
}

function revokePTW(data) {
  updateRow('PTW', 'id', data.id, { status: 'Revoked', revokedBy: data.revokedBy });
  return { success: true };
}

function closePTW(data) {
  updateRow('PTW', 'id', data.id, { status: 'Closed', closedBy: data.closedBy });
  return { success: true };
}

// ---- TBM ----
function submitTBM(data) {
  const id = nextId('TBM', 'TBM');
  const workerList = (data.workers || '').split(',').map(w => w.trim()).filter(Boolean);
  appendRow('TBM', {
    id, date: data.date, topic: data.topic, location: data.location,
    project: data.project, description: data.description,
    workers: data.workers, company: data.company,
    hazards: data.hazards, ppe: data.ppe, feedback: data.feedback,
    conductor: data.conductor, signature: data.signature,
    attendance: workerList.length, status: 'Completed',
    submittedAt: new Date().toISOString()
  });
  return { success: true, id };
}

// ---- SAFETY INSPECTION ----
function submitInspection(data) {
  const id = nextId('SI', 'SAFETY');
  const issues = JSON.parse(data.issues || '[]');
  
  appendRow('SAFETY', {
    id, date: data.date || new Date().toISOString().split('T')[0],
    location: data.location, project: data.project,
    contractor: data.contractor, inspector: data.inspector,
    signature: data.signature, status: 'Open',
    issueCount: issues.length, submittedAt: new Date().toISOString()
  });
  
  issues.forEach((issue, idx) => {
    appendRow('SAFETY_ISSUES', {
      inspectionId: id, issueIndex: idx,
      description: issue.desc, severity: issue.severity,
      status: 'Open'
    });
  });
  
  return { success: true, id };
}

function getSafetyInspections() {
  const inspections = getData('SAFETY');
  const issues = getData('SAFETY_ISSUES');
  
  return {
    items: inspections.reverse().map(insp => {
      const inspIssues = issues.filter(i => i.inspectionId === insp.id);
      const allClosed = inspIssues.length > 0 && inspIssues.every(i => i.status === 'Closed');
      const anyRect = inspIssues.some(i => i.status === 'Rectifying' || i.status === 'Rectified');
      let status = 'Open';
      if (allClosed) status = 'Closed';
      else if (anyRect) status = 'Rectifying';
      
      // Update status in sheet if changed
      if (status !== insp.status) {
        updateRow('SAFETY', 'id', insp.id, { status });
      }
      
      return {
        id: insp.id, date: insp.date, location: insp.location,
        issues: inspIssues.length, status, inspector: insp.inspector,
        severity: inspIssues.reduce((max, i) => {
          const sev = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (sev[i.severity] || 0) > (sev[max] || 0) ? i.severity : max;
        }, 'Low'),
        contractor: insp.contractor,
        items: inspIssues.map(i => ({
          desc: i.description, severity: i.severity, status: i.status
        }))
      };
    })
  };
}

function rectifyIssue(data) {
  const issues = getData('SAFETY_ISSUES');
  const issue = issues.find(i => i.inspectionId === data.inspId && String(i.issueIndex) === String(data.idx));
  if (!issue) return { error: 'Issue not found' };
  
  // Find the row and update
  const sheet = getSheet('SAFETY_ISSUES');
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.inspId && String(allData[i][1]) === String(data.idx)) {
      const statusCol = headers.indexOf('status');
      const rectByCol = headers.indexOf('rectifiedBy');
      const rectAtCol = headers.indexOf('rectifiedAt');
      sheet.getRange(i + 1, statusCol + 1).setValue('Rectifying');
      sheet.getRange(i + 1, rectByCol + 1).setValue(data.by);
      sheet.getRange(i + 1, rectAtCol + 1).setValue(new Date().toISOString());
      break;
    }
  }
  return { success: true };
}

function closeIssue(data) {
  const sheet = getSheet('SAFETY_ISSUES');
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.inspId && String(allData[i][1]) === String(data.idx)) {
      const statusCol = headers.indexOf('status');
      const closedByCol = headers.indexOf('closedBy');
      const closedAtCol = headers.indexOf('closedAt');
      sheet.getRange(i + 1, statusCol + 1).setValue('Closed');
      sheet.getRange(i + 1, closedByCol + 1).setValue(data.by);
      sheet.getRange(i + 1, closedAtCol + 1).setValue(new Date().toISOString());
      break;
    }
  }
  return { success: true };
}

// ---- QAQC ----
function submitQAQC(data) {
  const id = nextId('QA', 'QAQC');
  appendRow('QAQC', {
    id, date: new Date().toISOString().split('T')[0],
    location: data.location, category: data.category,
    description: data.description, inspector: data.inspector,
    status: 'Open', submittedAt: new Date().toISOString()
  });
  return { success: true, id };
}

// ---- DEFECT ----
function submitDefect(data) {
  const id = nextId('DEF', 'DEFECT');
  appendRow('DEFECT', {
    id, date: new Date().toISOString().split('T')[0],
    location: data.location, description: data.description,
    severity: data.severity, status: 'Open',
    assigned: data.assigned, reportedBy: data.reportedBy,
    submittedAt: new Date().toISOString()
  });
  return { success: true, id };
}

function updateDefect(data) {
  updateRow('DEFECT', 'id', data.id, {
    status: data.status,
    updatedBy: data.updatedBy,
    updatedAt: new Date().toISOString()
  });
  return { success: true };
}

// ---- ADMIN ----
function addUser(data) {
  const existing = getData('USERS').find(u => u.username.toLowerCase() === data.username.toLowerCase());
  if (existing) return { error: 'Username already exists' };
  appendRow('USERS', {
    username: data.username, password: data.password,
    role: data.role, email: data.email,
    status: 'Active', createdAt: new Date().toISOString()
  });
  return { success: true };
}

function deleteUser(data) {
  const sheet = getSheet('USERS');
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.username) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'User not found' };
}

function addProject(data) {
  appendRow('PROJECTS', {
    name: data.name, location: data.location,
    status: 'Active', createdAt: new Date().toISOString()
  });
  return { success: true };
}

// ---- CHECKLIST ----
function getChecklist(type) {
  const all = getData('PTW_CHECKLISTS');
  const match = all.filter(c => c.type === type);
  if (!match.length) return { items: null };
  const items = [];
  match.forEach(row => {
    for (let i = 1; i <= 21; i++) {
      const val = row['item' + i];
      if (val && String(val).trim()) items.push(String(val).trim());
    }
  });
  return { items };
}

function getChecklists(typeFilter) {
  const all = getData('PTW_CHECKLISTS');
  const filtered = typeFilter ? all.filter(c => c.type === typeFilter) : all;
  return filtered.map(row => {
    const items = [];
    for (let i = 1; i <= 21; i++) {
      const val = row['item' + i];
      if (val && String(val).trim()) items.push(String(val).trim());
    }
    return { type: row.type, name: row.name, items };
  });
}

// ---- ANALYTICS ----
function getPTWAnalytics() {
  const ptw = getData('PTW');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  
  const monthly = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth(); const y = d.getFullYear();
    const mData = ptw.filter(p => { const pd = new Date(p.submittedAt); return pd.getMonth() === m && pd.getFullYear() === y; });
    monthly.push({
      m: months[m],
      i: mData.length,
      c: mData.filter(p => p.status === 'Closed').length,
      e: mData.filter(p => p.status === 'Expired').length
    });
  }
  
  const byType = {}, byBlock = {}, byCompany = {};
  ptw.forEach(p => {
    byType[p.type] = (byType[p.type] || 0) + 1;
    const block = (p.location || '').split(' ')[0] + ' ' + ((p.location || '').split(' ')[1] || '');
    byBlock[block] = (byBlock[block] || 0) + 1;
    if (p.company) byCompany[p.company] = (byCompany[p.company] || 0) + 1;
  });
  
  // Top supervisors
  const supCount = {};
  ptw.forEach(p => { if (p.submittedBy) supCount[p.submittedBy] = (supCount[p.submittedBy] || 0) + 1; });
  const sups = Object.entries(supCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, c]) => {
    const closed = ptw.filter(p => p.submittedBy === n && p.status === 'Closed').length;
    return { n, c, p: c > 0 ? Math.round(closed / c * 100) : 0 };
  });
  
  return { monthly, byType, byBlock, byCompany, sups };
}

function getTBMAnalytics() {
  const tbm = getData('TBM');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  
  const monthly = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth(); const y = d.getFullYear();
    const mData = tbm.filter(t => { const td = new Date(t.submittedAt || t.date); return td.getMonth() === m && td.getFullYear() === y; });
    const totalAttend = mData.reduce((sum, t) => sum + (parseInt(t.attendance) || 0), 0);
    monthly.push({ m: months[m], s: mData.length, a: mData.length ? Math.round(totalAttend / mData.length) : 0 });
  }
  
  const byTopic = {}, byProject = {};
  tbm.forEach(t => {
    byTopic[t.topic] = (byTopic[t.topic] || 0) + 1;
    if (t.project) byProject[t.project] = (byProject[t.project] || 0) + 1;
  });
  
  return { monthly, byTopic, byProject };
}

function getSafetyAnalytics() {
  const safety = getData('SAFETY');
  const issues = getData('SAFETY_ISSUES');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  
  const monthly = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth(); const y = d.getFullYear();
    const mInsp = safety.filter(s => { const sd = new Date(s.submittedAt || s.date); return sd.getMonth() === m && sd.getFullYear() === y; });
    const mIssues = issues.filter(i => {
      const si = safety.find(s => s.id === i.inspectionId);
      if (!si) return false;
      const sd = new Date(si.submittedAt || si.date);
      return sd.getMonth() === m && sd.getFullYear() === y;
    });
    const closed = mIssues.filter(i => i.status === 'Closed').length;
    monthly.push({ m: months[m], n: mInsp.length, r: mIssues.length ? Math.round(closed / mIssues.length * 100) : 0 });
  }
  
  const bySev = {}, byStatus = {}, byContractor = {};
  issues.forEach(i => { bySev[i.severity] = (bySev[i.severity] || 0) + 1; byStatus[i.status] = (byStatus[i.status] || 0) + 1; });
  safety.forEach(s => { if (s.contractor) byContractor[s.contractor] = (byContractor[s.contractor] || 0) + 1; });
  
  // Top findings
  const findingCount = {};
  issues.forEach(i => {
    const key = i.description + '|||' + i.severity;
    findingCount[key] = (findingCount[key] || 0) + 1;
  });
  const findings = Object.entries(findingCount)
    .map(([k, c]) => { const [f, s] = k.split('|||'); return { f, c, s }; })
    .sort((a, b) => b.c - a.c).slice(0, 7);
  
  return { monthly, bySev, byStatus, byContractor, findings };
}

// ---- PTW PDF ----
function generatePTWPDF(id) {
  // For now, return a simple HTML-based PDF view
  const ptw = getData('PTW').find(p => p.id === id);
  if (!ptw) return ContentService.createTextOutput('PTW not found');
  
  const html = `<!DOCTYPE html><html><head><title>${ptw.id} - PTW</title>
    <style>body{font-family:Arial,sans-serif;margin:20px;color:#333}h1{color:#0B1220;border-bottom:3px solid #FBBF24;padding-bottom:8px}
    .row{display:flex;gap:20px;margin:8px 0}.field{flex:1}.label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px}.value{font-size:14px;font-weight:600;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin:12px 0}th,td{padding:8px;border:1px solid #ddd;text-align:left;font-size:12px}th{background:#f5f5f5}
    .badge{padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700}.approved{background:#D1FAE5;color:#059669}.pending{background:#FEF3C7;color:#D97706}
    .footer{margin-top:24px;padding-top:12px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center}</style>
  </head><body>
    <h1>🏗️ ${ptw.id} — Permit to Work</h1>
    <div class="row"><div class="field"><div class="label">Type</div><div class="value">${ptw.type}</div></div><div class="field"><div class="label">Status</div><div class="value"><span class="badge ${ptw.status==='Approved'?'approved':'pending'}">${ptw.status}</span></div></div></div>
    <div class="row"><div class="field"><div class="label">Location</div><div class="value">${ptw.location}</div></div><div class="field"><div class="label">Project</div><div class="value">${ptw.project || '-'}</div></div></div>
    <div class="row"><div class="field"><div class="label">Start</div><div class="value">${ptw.startDate}</div></div><div class="field"><div class="label">End</div><div class="value">${ptw.endDate}</div></div></div>
    <div class="row"><div class="field"><div class="label">Company</div><div class="value">${ptw.company || '-'}</div></div><div class="field"><div class="label">Workers</div><div class="value">${ptw.workers || '-'}</div></div></div>
    ${ptw.description ? `<div class="row"><div class="field"><div class="label">Description</div><div class="value">${ptw.description}</div></div></div>` : ''}
    ${ptw.approvals ? `<h3>Approval Trail</h3><table><tr><th>Stage</th><th>Approver</th><th>Date</th></tr>${ptw.approvals.split('|').map(a=>{const p=a.split(':');return `<tr><td>${p[0]}</td><td>${p[1]}</td><td>${p[2]?new Date(p[2]).toLocaleString():''}</td></tr>`;}).join('')}</table>` : ''}
    <div class="footer">BOSH Construction Management System — Generated ${new Date().toLocaleString()}</div>
  </body></html>`;
  
  return HtmlService.createHtmlOutput(html).setTitle(ptw.id + ' - PTW');
}

// ---- PTW EXPIRY CHECK (set up hourly trigger) ----
function checkPTWExpiry() {
  const ptw = getData('PTW');
  const now = new Date();
  const twoHours = 2 * 60 * 60 * 1000;
  
  ptw.forEach(p => {
    if (p.status === 'Active' || p.status === 'Approved') {
      const end = new Date(p.endDate);
      if (end - now < twoHours && end - now > 0) {
        // Send notification (you can customize this)
        Logger.log('PTW ' + p.id + ' expiring soon!');
        // Optionally send email:
        // MailApp.sendEmail(adminEmail, 'PTW Expiry Warning', 'PTW ' + p.id + ' expires at ' + end.toLocaleString());
      } else if (end < now) {
        updateRow('PTW', 'id', p.id, { status: 'Expired' });
      }
    }
  });
}

// ---- SETUP TRIGGER (run once manually) ----
function setupTriggers() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  // Add hourly PTW expiry check
  ScriptApp.newTrigger('checkPTWExpiry').timeBased().everyHours(1).create();
  Logger.log('Triggers set up successfully');
}
