// Shared helpers: API calls, session state, header
const API = (window.QUIZ_ARENA_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
const S = { get: k => JSON.parse(sessionStorage.getItem(k) || 'null'), set: (k, v) => sessionStorage.setItem(k, JSON.stringify(v)) };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getUser = () => JSON.parse(localStorage.getItem('qa_user') || 'null');
async function api(path, { method = 'GET', body, admin = false } = {}) {
  const token = localStorage.getItem(admin ? 'qa_admin_token' : 'qa_token');
  let r; try {
    r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch { throw new Error('Cannot reach the backend. Is it running on http://localhost:3000 ?'); }
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && !path.includes('/login')) { admin ? (location.href = 'admin-login.html') : (localStorage.clear(), location.href = 'login.html'); }
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
function requireLogin() { if (!getUser()) { location.href = 'login.html'; return false; } return true; }
function showMsg(el, text, type = 'err') { el.innerHTML = `<div class="msg ${type}">${esc(text)}</div>`; }
function logout() { localStorage.removeItem('qa_user'); localStorage.removeItem('qa_token'); sessionStorage.clear(); location.href = 'index.html'; }
function renderHeader() {
  const u = getUser(), admin = document.body.dataset.page.startsWith('admin');
  $('#hdr').innerHTML = `<a class="brand" href="index.html"><b>QUIZ ARENA</b><small>WATCH • LEARN • PLAY</small></a><nav>` +
    (admin ? `<a href="index.html">Home</a>` + (localStorage.getItem('qa_admin_token') && document.body.dataset.page === 'admin' ? `<button onclick="localStorage.removeItem('qa_admin_token');location.href='admin-login.html'">Logout</button>` : '')
    : u ? `<a href="subject.html">Learn</a><a href="history.html">History</a><span class="badge">${esc(u.name)}</span><button onclick="logout()">Logout</button>`
    : `<a href="login.html">Login</a><a href="registration.html">Register</a><a href="admin-login.html">Admin</a>`) + `</nav>`;
}
renderHeader();
