// Handles: admin-login and admin pages
const page = document.body.dataset.page;
if (page === 'admin-login') {
  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const d = await api('/admin/login', { method: 'POST', body: { email: $('#email').value, password: $('#pw').value } }); localStorage.setItem('qa_admin_token', d.token); location.href = 'admin.html'; }
    catch (err) { showMsg($('#m'), err.message); }
  });
} else (async () => {
  if (!localStorage.getItem('qa_admin_token')) return location.href = 'admin-login.html';
  const get = (p) => api(p, { admin: true }), out = $('#out');
  const table = (rows, cols) => rows.length ? `<table><tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(c[1](r))}</td>`).join('')}</tr>`).join('')}</table>` : 'No data yet.';
  const views = {
    Users: async () => table(await get('/admin/users'), [['ID', r => r.id], ['Name', r => r.name], ['Email', r => r.email], ['Joined', r => r.created_at], ['Attempts', r => r.attempts]]),
    Results: async () => table(await get('/admin/results'), [['Date', r => r.created_at], ['Student', r => r.name], ['Subject', r => r.subject], ['Topic', r => r.topic], ['Lang', r => r.language], ['Score', r => r.correct + '/' + r.total], ['%', r => r.percentage], ['Result', r => r.passed ? 'PASS' : 'FAIL'], ['Email', r => r.email_status]]),
    'Learning Activity': async () => table(await get('/admin/activity'), [['Date', r => r.created_at], ['Student', r => r.name], ['Topic', r => r.topic], ['Lang', r => r.language], ['Action', r => r.action]]),
    Statistics: async () => { const s = await get('/admin/stats'); return `<p>Pass rate: <b>${s.passRate}%</b></p>` + table(s.bySubject, [['Subject', r => r.subject], ['Attempts', r => r.attempts], ['Avg %', r => r.avg ?? '-']]); }
  };
  try {
    const s = await get('/admin/stats');
    $('#cards').innerHTML = [['Total Users', s.totalUsers], ['Quiz Attempts', s.totalAttempts], ['Average Score', s.averageScore + '%'], ['Learning Activities', s.learningActivities]].map(c => `<div><b>${esc(c[1])}</b>${c[0]}</div>`).join('');
    const show = async (name) => { $('#tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.textContent === name)); out.innerHTML = await views[name](); };
    $('#tabs').innerHTML = Object.keys(views).map(n => `<button class="btn alt">${n}</button>`).join('');
    $('#tabs').querySelectorAll('button').forEach(b => b.onclick = () => show(b.textContent).catch(e => out.innerHTML = esc(e.message)));
    show('Users');
  } catch (e) { out.innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
})();
