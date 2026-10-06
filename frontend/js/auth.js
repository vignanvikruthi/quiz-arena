const f = $('#f'), m = $('#m');
f.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    if (document.body.dataset.page === 'registration') {
      if ($('#pw').value !== $('#pw2').value) return showMsg(m, 'Passwords do not match');
      await api('/auth/register', { method: 'POST', body: { name: $('#name').value, email: $('#email').value, password: $('#pw').value } });
      showMsg(m, 'Registered! Redirecting to login…', 'ok'); setTimeout(() => location.href = 'login.html', 900);
    } else {
      const d = await api('/auth/login', { method: 'POST', body: { email: $('#email').value, password: $('#pw').value } });
      localStorage.setItem('qa_token', d.token); localStorage.setItem('qa_user', JSON.stringify(d.user)); location.href = 'subject.html';
    }
  } catch (err) { showMsg(m, err.message); }
});
