import { api, ApiError, clearSession, downloadCsv, getProfile, getToken, setSession } from './api.js';

const ASSET_BASE = import.meta.env.BASE_URL || '/';
const LOGO_SRC = `${ASSET_BASE}assets/pitch-logo.png`;

function esc(v) {
  return String(v ?? '').replace(/[&<>'"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]
  ));
}

function money(v, currency = 'usd') {
  const amount = Number(v || 0);
  return `${currency.toUpperCase() === 'USD' ? '$' : `${currency} `}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove('show'), 2400);
}

function errorMessage(err) {
  if (err instanceof ApiError) return err.message;
  return err?.message || 'Something went wrong.';
}

function initials(name) {
  return String(name || 'A')
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function statusBadge(s) {
  const c = {
    Paid: 'paid',
    Unpaid: 'pending',
    Accepted: 'approved',
    Approved: 'approved',
    'Under Review': 'review',
    Submitted: 'new',
    Rejected: 'rejected',
    Withdrawn: 'inactive',
    Active: 'active',
    Inactive: 'inactive',
    Open: 'open',
    Closed: 'closed',
    administrator: 'approved',
    reviewer: 'review',
    finance: 'paid',
  }[s] || 'new';
  return `<span class="badge ${c}">${esc(s)}</span>`;
}

function can(permission) {
  const role = getProfile()?.role;
  const map = {
    administrator: true,
    reviewer: [
      'dashboard',
      'applications',
      'applications:write',
      'payments',
      'export:applications',
      'account',
    ],
    finance: ['dashboard', 'applications', 'payments', 'export:applications', 'export:payments', 'account'],
  };
  if (role === 'administrator') return true;
  return (map[role] || []).includes(permission);
}

function parseHash() {
  const raw = (location.hash || '').replace(/^#/, '');
  const [page, query] = raw.split('?');
  return { page: page || '', params: new URLSearchParams(query || '') };
}

function qs(obj) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
}

function nav(active) {
  const items = [
    ['dashboard', '▦', 'Dashboard', '#dashboard', 'dashboard'],
    ['applications', '▤', 'Applications', '#applications', 'applications'],
    ['payments', '▣', 'Payments', '#payments', 'payments'],
    ['events', '◫', 'Events', '#events', 'settings'],
    ['types', '◇', 'Types & Pricing', '#types_pricing', 'settings'],
    ['users', '♙', 'Admin Users', '#admin_users', 'settings'],
  ].filter((i) => can(i[4] === 'settings' ? 'settings' : i[4]));
  return `<aside class="sidebar" id="sidebar"><div class="brand"><img src="${LOGO_SRC}" alt="Pitch"></div><nav class="menu">${items
    .map(
      (i) =>
        `<a class="${active === i[0] ? 'active' : ''}" href="${i[3]}" onclick="closeMobileMenu()"><span class="ico">${i[1]}</span><span>${i[2]}</span></a>`,
    )
    .join('')}</nav><div class="sidebar-bottom"><strong>PitchXPO</strong>Admin Panel</div></aside><div class="mobile-overlay" id="mobileOverlay" onclick="closeMobileMenu()"></div>`;
}

function shell(active, content) {
  const a = getProfile() || { name: 'Admin', role: 'administrator' };
  return `<div class="shell">${nav(active)}<main class="main"><header class="topbar"><div class="top-left"><button class="mobile-menu-btn" aria-label="Open menu" onclick="openMobileMenu()">☰</button><div class="top-title">PitchXPO Admin</div></div><div class="user-wrap"><div class="user" onclick="toggleUserMenu()"><div class="avatar">${initials(a.name)}</div><div class="u"><strong>${esc(a.name)}</strong><span>${esc(a.role)}</span></div><span>⌄</span></div><div id="userMenu" class="dropdown hidden"><a href="#my_account" onclick="toggleUserMenu()">My Account</a><a href="#change_password" onclick="toggleUserMenu()">Change Password</a><button class="logout" onclick="logout()">Sign out</button></div></div></header>${content}</main></div><div class="modal-backdrop" id="modal"></div><div class="toast"></div>`;
}

function layout(title, active, inner) {
  document.title = `PitchXPO Admin — ${title}`;
  document.getElementById('root').innerHTML = shell(active, inner);
}

function toggleUserMenu() {
  document.getElementById('userMenu')?.classList.toggle('hidden');
}
function openMobileMenu() {
  document.getElementById('sidebar')?.classList.add('mobile-open');
  document.getElementById('mobileOverlay')?.classList.add('show');
}
function closeMobileMenu() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('mobileOverlay')?.classList.remove('show');
}
function closeModal() {
  document.getElementById('modal')?.classList.remove('show');
}
function openModal(title, body, foot = '') {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close" onclick="closeModal()">×</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  m.classList.add('show');
  m.onclick = (e) => {
    if (e.target === m) closeModal();
  };
}

function logout() {
  clearSession();
  location.hash = '#login';
  initLogin();
}

async function initDashboard() {
  layout(
    'Dashboard',
    'dashboard',
    `<section class="content"><div class="head-row"><div><div class="eyebrow">Overview</div><h1>Dashboard</h1><div class="sub">Loading live totals…</div></div></div><div class="panel"><div class="empty">Loading dashboard…</div></div></section>`,
  );
  try {
    const { dashboard } = await api.dashboard();
    const t = dashboard.totals;
    const recent = dashboard.recentPaid || [];
    const content = `<section class="content"><div class="head-row"><div><div class="eyebrow">Overview</div><h1>Dashboard</h1><div class="sub">Live application and payment overview from PostgreSQL</div></div></div>
      <div class="cards">
        <div class="card"><div class="card-label">Total Applications</div><div class="metric">${t.submissions}</div></div>
        <div class="card"><div class="card-label">Pending</div><div class="metric">${t.pending}</div><div class="metric-note">Submitted / under review</div></div>
        <div class="card"><div class="card-label">Approved</div><div class="metric">${t.approved}</div><div class="metric-note">Accepted</div></div>
        <div class="card"><div class="card-label">Rejected</div><div class="metric">${t.rejected}</div></div>
      </div>
      <div class="cards" style="grid-template-columns:repeat(2,1fr)">
        <div class="card"><div class="card-label">Paid</div><div class="metric">${t.paid}</div><div class="metric-note">Stripe-verified payments</div></div>
        <div class="card"><div class="card-label">Collected</div><div class="metric">${money(dashboard.revenue.paidTotal, dashboard.revenue.currency)}</div></div>
      </div>
      <div class="panel table-card"><div class="panel-pad"><div class="section-title"><h2>Recent paid applications</h2></div>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Applicant</th><th>Package</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead><tbody>
      ${
        recent
          .map(
            (x) =>
              `<tr><td class="strong">${esc(x.submissionId)}</td><td>${esc(x.startup?.name || x.founder?.name)}</td><td>${esc(x.package?.type)}</td><td>${money(x.package?.amount, x.package?.currency)}</td><td>${statusBadge(x.paymentStatus)}</td><td>${statusBadge(x.applicationStatus)}</td></tr>`,
          )
          .join('') || `<tr><td colspan="6"><div class="empty">No paid applications yet.</div></td></tr>`
      }
      </tbody></table></div></div></div></section>`;
    layout('Dashboard', 'dashboard', content);
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function initApplications() {
  const content = `<section class="content"><div class="head-row"><div><div class="eyebrow">Manage</div><h1>Applications</h1><div class="sub">PostgreSQL records — approve, reject, note, and download Excel reports</div></div>
    <div class="actions">${can('export:applications') ? '<button class="secondary" onclick="exportApplications()">Download Report</button>' : ''}</div></div>
    <div class="panel"><div class="toolbar">
      <input id="appSearch" class="input search" placeholder="Search name, ID or email...">
      <select id="appStatus"><option value="">All application status</option><option>Submitted</option><option>Under Review</option><option>Accepted</option><option>Rejected</option><option>Withdrawn</option></select>
      <select id="payStatus"><option value="">All payment status</option><option>Paid</option><option>Unpaid</option></select>
    </div>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>Applicant</th><th>Package</th><th>Amount</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody id="appRows"><tr><td colspan="7"><div class="empty">Loading applications…</div></td></tr></tbody></table></div>
    <div class="foot"><span id="appCount"></span><div class="actions"><button class="mini" id="prevPage">Prev</button><button class="mini" id="nextPage">Next</button></div></div></div></section>`;
  layout('Applications', 'applications', content);
  window.__appPage = 1;
  const reload = () => renderApplications();
  document.getElementById('appSearch').oninput = () => {
    clearTimeout(window.__appSearch);
    window.__appSearch = setTimeout(reload, 300);
  };
  document.getElementById('appStatus').onchange = reload;
  document.getElementById('payStatus').onchange = reload;
  document.getElementById('prevPage').onclick = () => {
    window.__appPage = Math.max(1, (window.__appPage || 1) - 1);
    reload();
  };
  document.getElementById('nextPage').onclick = () => {
    window.__appPage = (window.__appPage || 1) + 1;
    reload();
  };
  await renderApplications();
}

async function renderApplications() {
  const q = document.getElementById('appSearch')?.value || '';
  const status = document.getElementById('appStatus')?.value || '';
  const paymentStatus = document.getElementById('payStatus')?.value || '';
  const page = window.__appPage || 1;
  try {
    const data = await api.submissions(
      qs({ q, status, paymentStatus, page, limit: 20 }),
    );
    window.__appPage = data.page;
    const el = document.getElementById('appRows');
    if (!el) return;
    el.innerHTML =
      data.submissions
        .map(
          (x) =>
            `<tr><td class="strong">${esc(x.submissionId)}</td><td><div class="biz"><strong>${esc(x.startup?.name || x.founder?.name)}</strong><span>${esc(x.founder?.email)}</span></div></td><td>${esc(x.package?.type)}</td><td class="strong">${money(x.package?.amount, x.package?.currency)}</td><td>${statusBadge(x.paymentStatus)}</td><td>${statusBadge(x.applicationStatus)}</td><td><div class="actions-cell"><button class="mini primary-mini" onclick="viewApplication('${esc(x.submissionId)}')">View</button>${can('export:applications') ? `<button class="mini" onclick="exportApplicationReport('${esc(x.submissionId)}')">Download Report</button>` : ''}</div></td></tr>`,
        )
        .join('') || `<tr><td colspan="7"><div class="empty">No applications found.</div></td></tr>`;
    document.getElementById('appCount').textContent = `Page ${data.page} of ${data.totalPages} · ${data.total} application(s)`;
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function viewApplication(id) {
  try {
    const { submission: x } = await api.submission(id);
    const write = can('applications:write');
    const notes = (x.notes || [])
      .map((n) => `<div class="note-box"><strong>${esc(n.admin?.name || 'Admin')}</strong> · ${esc(n.createdAt)}<br>${esc(n.body)}</div>`)
      .join('') || '<div class="note-box">No notes yet.</div>';
    const history = (x.history || [])
      .map((h) => `<div class="list-row"><strong>${esc(h.fromStatus)} → ${esc(h.toStatus)}</strong><div class="right muted">${esc(h.source)}</div><div class="right muted">${esc(h.createdAt)}</div></div>`)
      .join('') || '<div class="muted small">No status history yet.</div>';
    openModal(
      `Application ${esc(x.submissionId)}`,
      `<div class="detail-grid">
        <div class="detail"><span>Applicant</span><strong>${esc(x.founder?.name)}</strong></div>
        <div class="detail"><span>Business</span><strong>${esc(x.startup?.name || '—')}</strong></div>
        <div class="detail"><span>Email</span><strong>${esc(x.founder?.email)}</strong></div>
        <div class="detail"><span>Phone</span><strong>${esc(x.founder?.phone || '—')}</strong></div>
        <div class="detail"><span>Package</span><strong>${esc(x.package?.type)}</strong></div>
        <div class="detail"><span>Amount</span><strong>${money(x.package?.amount, x.package?.currency)}</strong></div>
        <div class="detail"><span>Payment</span>${statusBadge(x.paymentStatus)}</div>
        <div class="detail"><span>Application status</span>${statusBadge(x.applicationStatus)}</div>
        <div class="detail"><span>Reference</span><strong>${esc(x.payment?.applicationReference || '—')}</strong></div>
        <div class="detail"><span>Receipt</span><strong>${esc(x.payment?.paymentReceipt || '—')}</strong></div>
        <div class="detail"><span>Stripe PI</span><strong>${esc(x.payment?.stripePaymentIntentId || '—')}</strong></div>
        <div class="detail"><span>Paid at</span><strong>${esc(x.payment?.paidAt || '—')}</strong></div>
      </div>
      <div class="section-title" style="margin-top:16px"><h2>History</h2></div>${history}
      <div class="section-title" style="margin-top:16px"><h2>Internal notes</h2></div>${notes}
      ${
        write
          ? `<div class="field full" style="margin-top:12px"><label>Add note</label><textarea id="noteBody" placeholder="Visible to operations and accounts only"></textarea></div>`
          : ''
      }`,
      `${can('export:applications') ? `<button class="secondary" onclick="exportApplicationReport('${esc(x.submissionId)}')">Download Report</button>` : ''}${write ? `<button class="secondary" onclick="addNote('${esc(x.submissionId)}')">Save note</button><button class="primary" onclick="setApplicationStatus('${esc(x.submissionId)}','Under Review')">Under Review</button><button class="primary" onclick="setApplicationStatus('${esc(x.submissionId)}','Accepted')">Accept</button><button class="danger" onclick="setApplicationStatus('${esc(x.submissionId)}','Rejected')">Reject</button>` : ''}<button class="secondary" onclick="closeModal()">Close</button>`,
    );
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function addNote(id) {
  const body = document.getElementById('noteBody')?.value || '';
  try {
    await api.addNote(id, body);
    toast('Note saved');
    await viewApplication(id);
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function setApplicationStatus(id, status) {
  try {
    await api.updateStatus(id, status);
    toast(`Marked ${status}`);
    closeModal();
    await renderApplications();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function exportApplications() {
  try {
    const query = qs({
      q: document.getElementById('appSearch')?.value,
      status: document.getElementById('appStatus')?.value,
      paymentStatus: document.getElementById('payStatus')?.value,
    });
    await downloadCsv(`/api/admin/export/applications${query}`, 'pitchxpo_applications.csv');
    toast('Application report downloaded. Open it in Excel.');
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function exportApplicationReport(id) {
  try {
    await downloadCsv(
      `/api/admin/export/applications/${encodeURIComponent(id)}`,
      `pitchxpo_application_${id}.csv`,
    );
    toast('Application report downloaded. Open it in Excel.');
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function initPayments() {
  const content = `<section class="content"><div class="head-row"><div><div class="eyebrow">Finance</div><h1>Payments</h1><div class="sub">Stripe-backed records only. Admins cannot mark a payment as Paid.</div></div>
    <div class="actions">${can('export:payments') ? '<button class="secondary" onclick="exportPayments()">Download Report</button>' : ''}</div></div>
    <div class="panel"><div class="toolbar">
      <input id="paySearch" class="input search" placeholder="Search applicant, ID or reference...">
      <select id="payFilter"><option value="">All</option><option>Paid</option><option>Unpaid</option></select>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Submission</th><th>Applicant</th><th>Amount</th><th>Status</th><th>Reference</th><th>Receipt</th><th>Paid at</th></tr></thead><tbody id="payRows"><tr><td colspan="7"><div class="empty">Loading payments…</div></td></tr></tbody></table></div>
    <div class="foot"><span id="payCount"></span></div></div></section>`;
  layout('Payments', 'payments', content);
  const reload = () => renderPayments();
  document.getElementById('paySearch').oninput = () => {
    clearTimeout(window.__paySearch);
    window.__paySearch = setTimeout(reload, 300);
  };
  document.getElementById('payFilter').onchange = reload;
  await renderPayments();
}

async function renderPayments() {
  try {
    const data = await api.payments(
      qs({
        q: document.getElementById('paySearch')?.value,
        paymentStatus: document.getElementById('payFilter')?.value,
        limit: 50,
      }),
    );
    const el = document.getElementById('payRows');
    el.innerHTML =
      data.payments
        .map(
          (x) =>
            `<tr><td class="strong">${esc(x.submissionId)}</td><td>${esc(x.applicant)}<div class="muted small">${esc(x.email)}</div></td><td class="strong">${money(x.amount, x.currency)}</td><td>${statusBadge(x.paymentStatus)}</td><td class="small">${esc(x.stripePaymentIntentId || x.applicationReference || '—')}</td><td class="small">${esc(x.paymentReceipt || '—')}</td><td>${esc(x.paidAt || '—')}</td></tr>`,
        )
        .join('') || `<tr><td colspan="7"><div class="empty">No payment records.</div></td></tr>`;
    document.getElementById('payCount').textContent = `${data.total} record(s)`;
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function exportPayments() {
  try {
    const query = qs({
      q: document.getElementById('paySearch')?.value,
      paymentStatus: document.getElementById('payFilter')?.value,
    });
    await downloadCsv(`/api/admin/export/payments${query}`, 'pitchxpo_payments.csv');
    toast('Payment report downloaded. Open it in Excel.');
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function initEvents() {
  if (!can('settings')) return initDashboard();
  const { events } = await api.events();
  const content = `<section class="content"><div class="head-row"><div><div class="eyebrow">Configuration</div><h1>Events</h1><div class="sub">Conclave dates and venues</div></div>
    <div class="actions"><button class="primary" onclick="openEventForm()">+ Add Event</button></div></div>
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>Event</th><th>From</th><th>To</th><th>Venue</th><th>Applications</th><th>Status</th><th></th></tr></thead><tbody>
    ${
      events
        .map(
          (x) =>
            `<tr><td class="strong">${esc(x.name)}</td><td>${esc(String(x.fromDate).slice(0, 10))}</td><td>${esc(String(x.toDate).slice(0, 10))}</td><td>${esc(x.venue)}</td><td>${x.applications}</td><td>${statusBadge(x.status)}</td><td><button class="mini" onclick='openEventForm(${JSON.stringify(x)})'>Edit</button><button class="mini danger-mini" onclick="removeEvent('${x.id}')">Delete</button></td></tr>`,
        )
        .join('') || `<tr><td colspan="7"><div class="empty">No events yet.</div></td></tr>`
    }
    </tbody></table></div></div></section>`;
  layout('Events', 'events', content);
}

function openEventForm(x = {}) {
  openModal(
    x.id ? 'Edit Event' : 'Add Event',
    `<form id="eventForm" class="form-grid">
      <div class="field full"><label>Name</label><input class="input" name="name" value="${esc(x.name || '')}" required></div>
      <div class="field"><label>From</label><input class="input" type="date" name="fromDate" value="${esc(String(x.fromDate || '').slice(0, 10))}" required></div>
      <div class="field"><label>To</label><input class="input" type="date" name="toDate" value="${esc(String(x.toDate || '').slice(0, 10))}" required></div>
      <div class="field"><label>Venue</label><input class="input" name="venue" value="${esc(x.venue || '')}" required></div>
      <div class="field"><label>Status</label><select name="status"><option ${x.status === 'Open' ? 'selected' : ''}>Open</option><option ${x.status === 'Closed' ? 'selected' : ''}>Closed</option></select></div>
    </form>`,
    `<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveEvent('${x.id || ''}')">Save</button>`,
  );
}

async function saveEvent(id) {
  const f = document.getElementById('eventForm');
  if (!f.reportValidity()) return;
  const o = Object.fromEntries(new FormData(f));
  try {
    if (id) await api.updateEvent(id, o);
    else await api.createEvent(o);
    closeModal();
    toast('Event saved');
    await initEvents();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function removeEvent(id) {
  if (!confirm('Delete this event?')) return;
  try {
    await api.deleteEvent(id);
    toast('Event deleted');
    await initEvents();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function initTypes() {
  if (!can('settings')) return initDashboard();
  const { categories } = await api.categories();
  const content = `<section class="content"><div class="head-row"><div><div class="eyebrow">Configuration</div><h1>Types & Pricing</h1><div class="sub">Application categories used by public registration</div></div>
    <div class="actions"><button class="primary" onclick="openTypeForm()">+ Add Category</button></div></div>
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>Category</th><th>Description</th><th>Price</th><th>Status</th><th></th></tr></thead><tbody>
    ${categories
      .map(
        (x) =>
          `<tr><td class="strong">${esc(x.name)}</td><td class="muted">${esc(x.description)}</td><td>${money(x.amount, x.currency)}</td><td>${statusBadge(x.active ? 'Active' : 'Inactive')}</td><td><button class="mini" onclick='openTypeForm(${JSON.stringify(x)})'>Edit</button><button class="mini danger-mini" onclick="removeType('${x.id}')">Delete</button></td></tr>`,
      )
      .join('')}
    </tbody></table></div></div></section>`;
  layout('Types & Pricing', 'types', content);
}

function openTypeForm(x = {}) {
  openModal(
    x.id ? 'Edit Category' : 'Add Category',
    `<form id="typeForm" class="form-grid">
      <div class="field"><label>Name</label><input class="input" name="name" value="${esc(x.name || '')}" required></div>
      <div class="field"><label>Price</label><input class="input" type="number" min="1" step="0.01" name="amount" value="${x.amount ?? 99}" required></div>
      <div class="field full"><label>Description</label><textarea name="description">${esc(x.description || '')}</textarea></div>
      <div class="field full"><label class="check"><input type="checkbox" name="active" ${x.active !== false ? 'checked' : ''}> Active</label></div>
    </form>`,
    `<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveType('${x.id || ''}')">Save</button>`,
  );
}

async function saveType(id) {
  const f = document.getElementById('typeForm');
  if (!f.reportValidity()) return;
  const o = Object.fromEntries(new FormData(f));
  o.amount = Number(o.amount);
  o.active = f.elements.active.checked;
  o.currency = 'usd';
  try {
    if (id) await api.updateCategory(id, o);
    else await api.createCategory(o);
    closeModal();
    toast('Category saved');
    await initTypes();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function removeType(id) {
  if (!confirm('Delete this category?')) return;
  try {
    await api.deleteCategory(id);
    await initTypes();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function initUsers() {
  if (!can('settings')) return initDashboard();
  const { users } = await api.users();
  const content = `<section class="content"><div class="head-row"><div><div class="eyebrow">Access Control</div><h1>Admin Users</h1><div class="sub">Roles: administrator, reviewer, finance</div></div>
    <div class="actions"><button class="primary" onclick="openUserForm()">+ Add Admin User</button></div></div>
    <div class="panel"><div class="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr></thead><tbody>
    ${users
      .map(
        (x) =>
          `<tr><td><div class="person"><div class="person-avatar">${initials(x.name)}</div><div><strong>${esc(x.name)}</strong><span>${esc(x.email)}</span></div></div></td><td>${statusBadge(x.role)}</td><td>${statusBadge(x.status === 'active' ? 'Active' : 'Inactive')}</td><td>${esc(x.lastLoginAt || 'Never')}</td><td><button class="mini" onclick='openUserForm(${JSON.stringify(x)})'>Edit</button><button class="mini danger-mini" onclick="removeUser('${x.id}')">Delete</button></td></tr>`,
      )
      .join('')}
    </tbody></table></div></div></section>`;
  layout('Admin Users', 'users', content);
}

function openUserForm(x = {}) {
  openModal(
    x.id ? 'Edit Admin User' : 'Add Admin User',
    `<form id="userForm" class="form-grid">
      <div class="field"><label>Name</label><input class="input" name="name" value="${esc(x.name || '')}" required></div>
      <div class="field"><label>Email</label><input class="input" type="email" name="email" value="${esc(x.email || '')}" required></div>
      ${x.id ? '' : '<div class="field"><label>Temporary password</label><input class="input" type="password" name="password" minlength="8" required></div>'}
      <div class="field"><label>Role</label><select name="role"><option value="administrator" ${x.role === 'administrator' ? 'selected' : ''}>administrator</option><option value="reviewer" ${x.role === 'reviewer' ? 'selected' : ''}>reviewer</option><option value="finance" ${x.role === 'finance' ? 'selected' : ''}>finance</option></select></div>
      <div class="field"><label>Status</label><select name="status"><option value="active" ${x.status !== 'inactive' ? 'selected' : ''}>active</option><option value="inactive" ${x.status === 'inactive' ? 'selected' : ''}>inactive</option></select></div>
    </form>`,
    `<button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="saveUser('${x.id || ''}')">Save</button>`,
  );
}

async function saveUser(id) {
  const f = document.getElementById('userForm');
  if (!f.reportValidity()) return;
  const o = Object.fromEntries(new FormData(f));
  try {
    if (id) await api.updateUser(id, o);
    else await api.createUser(o);
    closeModal();
    toast('Admin user saved');
    await initUsers();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function removeUser(id) {
  if (!confirm('Delete this admin user?')) return;
  try {
    await api.deleteUser(id);
    await initUsers();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function initAccount() {
  const a = getProfile() || {};
  const content = `<section class="content"><div class="head-row"><div><div class="eyebrow">Profile</div><h1>My Account</h1></div></div>
    <div class="account-grid"><div class="panel profile-card"><div class="big-avatar">${initials(a.name)}</div><h2>${esc(a.name)}</h2><div class="muted small">${esc(a.email)}</div><div style="margin-top:12px"><span class="role">${esc(a.role)}</span></div></div>
    <div class="panel" style="padding:24px"><form id="accountForm" class="form-grid">
      <div class="field"><label>Full Name</label><input class="input" name="name" value="${esc(a.name || '')}" required></div>
      <div class="field"><label>Phone</label><input class="input" name="phone" value="${esc(a.phone || '')}"></div>
      <div class="field"><label>Email</label><input class="input" value="${esc(a.email || '')}" readonly></div>
      <div class="field"><label>Role</label><input class="input" value="${esc(a.role || '')}" readonly></div>
    </form>
    <p class="sub">To change email, use the email form below (requires current password).</p>
    <form id="emailForm" class="form-grid" style="margin-top:16px">
      <div class="field"><label>Current password</label><input class="input" type="password" name="currentPassword" required></div>
      <div class="field"><label>New email</label><input class="input" type="email" name="newEmail" required></div>
    </form>
    <div class="actions" style="justify-content:flex-end;margin-top:22px"><button class="secondary" type="button" onclick="saveEmail()">Update email</button><button class="primary" type="button" onclick="saveAccount()">Save profile</button></div></div></div></section>`;
  layout('My Account', '', content);
}

async function saveAccount() {
  const f = document.getElementById('accountForm');
  const o = Object.fromEntries(new FormData(f));
  try {
    const res = await api.updateMe(o);
    setSession(getToken(), res.admin);
    toast('Profile updated');
    await initAccount();
  } catch (err) {
    toast(errorMessage(err));
  }
}

async function saveEmail() {
  const f = document.getElementById('emailForm');
  if (!f.reportValidity()) return;
  const o = Object.fromEntries(new FormData(f));
  try {
    const res = await api.changeEmail(o);
    setSession(getToken(), res.admin);
    toast('Email updated');
    await initAccount();
  } catch (err) {
    toast(errorMessage(err));
  }
}

function initChangePassword() {
  layout(
    'Change Password',
    '',
    `<section class="content"><div style="max-width:720px"><h1>Change Password</h1>
    <div class="panel" style="padding:24px"><form id="changeForm">
      <div class="field" style="margin-bottom:16px"><label>Current Password</label><input class="input" type="password" name="currentPassword" required></div>
      <div class="field" style="margin-bottom:16px"><label>New Password</label><input class="input" type="password" name="newPassword" minlength="8" required></div>
      <div class="actions" style="justify-content:flex-end;margin-top:22px"><button class="primary" type="button" onclick="savePassword()">Save Password</button></div>
    </form></div></div></section>`,
  );
}

async function savePassword() {
  const f = document.getElementById('changeForm');
  if (!f.reportValidity()) return;
  const o = Object.fromEntries(new FormData(f));
  try {
    await api.changePassword(o);
    toast('Password updated');
    f.reset();
  } catch (err) {
    toast(errorMessage(err));
  }
}

function initForgot() {
  document.getElementById('root').innerHTML = `<main class="content"><div class="forgot-card">
    <h1>Forgot password?</h1><p>Enter your admin email. If an account exists, a reset link will be sent.</p>
    <div class="field" style="margin-top:22px"><label>Email</label><input id="forgotEmail" class="input" type="email"></div>
    <button class="primary" style="width:100%;margin-top:8px" onclick="sendReset()">Send reset link</button>
    <p class="login-note"><a href="#login">Back to login</a></p>
  </div></main><div class="toast"></div>`;
}

async function sendReset() {
  const email = document.getElementById('forgotEmail').value;
  try {
    const res = await api.forgotPassword(email);
    toast(res.message || 'If an account exists, a reset link has been sent.');
  } catch (err) {
    toast(errorMessage(err));
  }
}

function initReset() {
  const { params } = parseHash();
  const token = params.get('token') || '';
  document.getElementById('root').innerHTML = `<main class="content"><div class="forgot-card">
    <h1>Set new password</h1>
    <div class="field"><label>New password</label><input id="resetNew" class="input" type="password" minlength="8"></div>
    <div class="field"><label>Confirm</label><input id="resetConfirm" class="input" type="password"></div>
    <button class="primary" style="width:100%;margin-top:8px" onclick="finishReset('${esc(token)}')">Reset password</button>
  </div></main><div class="toast"></div>`;
}

async function finishReset(token) {
  const a = document.getElementById('resetNew').value;
  const b = document.getElementById('resetConfirm').value;
  if (a !== b) return toast('Passwords do not match');
  try {
    await api.resetPassword({ token, newPassword: a });
    toast('Password has been reset');
    location.hash = '#login';
  } catch (err) {
    toast(errorMessage(err));
  }
}

function initLogin() {
  document.title = 'PitchXPO Admin — Login';
  document.getElementById('root').innerHTML = `<div class="login-page"><div class="login-shell">
    <section class="login-brand-side"><img src="${LOGO_SRC}" alt="Pitch"><h2>PitchXPO Admin Portal</h2><p>Sign in with your production admin account. Data is loaded from PostgreSQL.</p></section>
    <section class="login-form-side"><div class="eyebrow">Secure access</div><h1>Welcome back</h1>
    <div id="loginError" class="login-error">Invalid email or password.</div>
    <form class="login-form" id="loginForm">
      <div class="field"><label>Email Address</label><input id="loginEmail" class="input" type="email" required></div>
      <div class="field"><label>Password</label><input id="loginPassword" class="input" type="password" required></div>
      <div class="login-options"><span></span><a href="#forgot_password">Forgot password?</a></div>
      <button class="primary login-submit" type="submit">Sign In</button>
    </form></section></div></div><div class="toast"></div>`;
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(
        document.getElementById('loginEmail').value,
        document.getElementById('loginPassword').value,
      );
      setSession(res.token, res.admin);
      location.hash = '#dashboard';
      init();
    } catch (err) {
      document.getElementById('loginError').classList.add('show');
      document.getElementById('loginError').textContent = errorMessage(err);
    }
  });
}

async function init() {
  const { page } = parseHash();
  if (page.includes('login')) return initLogin();
  if (page.includes('forgot_password')) return initForgot();
  if (page.includes('reset_password')) return initReset();
  if (!getToken()) return initLogin();
  try {
    const me = await api.me();
    setSession(getToken(), me.admin);
  } catch {
    clearSession();
    return initLogin();
  }
  if (page.includes('change_password')) return initChangePassword();
  if (page.includes('my_account')) return initAccount();
  if (page.includes('applications')) return initApplications();
  if (page.includes('payments')) return initPayments();
  if (page.includes('events')) return initEvents();
  if (page.includes('types_pricing')) return initTypes();
  if (page.includes('admin_users')) return initUsers();
  return initDashboard();
}

window.addEventListener('hashchange', () => {
  closeMobileMenu();
  init();
});
document.addEventListener('click', (e) => {
  const w = document.querySelector('.user-wrap');
  const m = document.getElementById('userMenu');
  if (w && m && !w.contains(e.target)) m.classList.add('hidden');
});

window.pitchxpoInit = init;
Object.assign(window, {
  logout,
  closeMobileMenu,
  closeModal,
  openMobileMenu,
  toggleUserMenu,
  viewApplication,
  addNote,
  setApplicationStatus,
  exportApplications,
  exportApplicationReport,
  exportPayments,
  openEventForm,
  saveEvent,
  removeEvent,
  openTypeForm,
  saveType,
  removeType,
  openUserForm,
  saveUser,
  removeUser,
  saveAccount,
  saveEmail,
  savePassword,
  sendReset,
  finishReset,
});

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => window.pitchxpoInit(), { once: true });
} else {
  window.pitchxpoInit();
}
