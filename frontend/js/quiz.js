// Handles: quiz, result, history pages
const page = document.body.dataset.page, out = $('#out'), badge = (p) => `<b class="${p ? 'pass' : 'fail'}">${p ? 'PASS' : 'FAIL'}</b>`;
async function sendEmailJsResult(result) {
  const config = window.QUIZ_ARENA_EMAILJS;
  if (!window.emailjs || !config?.publicKey || !config.serviceId || !config.templateId) {
    return { sent: false, message: 'EmailJS is unavailable. Check its script, public key, service ID, and template ID.' };
  }
  const user = getUser();
  let watchedVideos = [];
  try {
    const activity = await api('/videos/activity');
    watchedVideos = activity.filter(video => video.subject === result.subject && video.topic === result.topic).map(video => video.url).filter(Boolean).slice(0, 5);
  } catch { }
  const grade = result.passed ? 'PASS' : 'FAIL';
  const round = result.difficulty || 'Basic';
  const percentage = Number(result.percentage) || 0;
  const watchedVideoText = watchedVideos.length ? watchedVideos.join('\n') : 'None recorded';
  const message = `Hi ${user.name},\n\nSubject: ${result.subject}\nConcept / Topic: ${result.topic}\nRound: ${round}\nVideo language: ${result.language || 'English'}\nScore: ${result.correct}/${result.total}\nPercentage: ${percentage}%\nCorrect: ${result.correct}\nWrong: ${result.wrong}\nGrade: ${grade}\nWatched video links: ${watchedVideoText}`;
  const emailSubject = `Quiz Arena result: ${result.subject} - ${result.topic}`;
  try {
    await emailjs.send(config.serviceId, config.templateId, {
      to_email: user.email,
      to_name: user.name,
      user_email: user.email,
      user_name: user.name,
      subject: result.subject,
      email_subject: emailSubject,
      message,
      concept: result.topic,
      topic: result.topic,
      round,
      difficulty: round,
      language: result.language || 'English',
      video_language: result.language || 'English',
      quiz_subject: result.subject,
      quiz_topic: result.topic,
      subject_name: result.subject,
      score: `${result.correct}/${result.total}`,
      correct: result.correct,
      total: result.total,
      wrong: result.wrong,
      percentage,
      percent: percentage,
      percentage_text: `${percentage}%`,
      result: grade,
      grade,
      watched_videos: watchedVideoText,
      videos_watched: watchedVideoText
    }, { publicKey: config.publicKey });
    try {
      await api(`/results/detail/${result.id}/email-status`, { method: 'PATCH', body: { sent: true } });
    } catch {
      return { sent: true, message: `Result emailed to ${user.email}; history could not be updated.` };
    }
    return { sent: true, message: `Result emailed to ${user.email} using EmailJS.` };
  } catch (error) {
    return { sent: false, message: `EmailJS could not send the result: ${error.text || error.message || 'Check the service and template configuration.'}` };
  }
}
(async () => {
  if (!requireLogin()) return;
  try {
    if (page === 'quiz') {
      const sel = S.get('sel'); if (!sel || !sel.topic) return location.href = 'subject.html';
      const params = new URLSearchParams({ difficulty: sel.difficulty || 'Basic', language: sel.language || 'English' });
      out.innerHTML = `<p class="sub">Preparing your ${esc(sel.difficulty || 'Basic')} ${esc(sel.language || 'English')} quiz for ${esc(sel.topic.name)}…</p>`;
      const quiz = await api(`/quizzes/${sel.topic.id}?${params}`), ans = {}; let i = 0, left = quiz.timeLimitSeconds; const start = Date.now(); let done = false;
      const submit = async () => {
        if (done) return; done = true; clearInterval(tick);
        try {
          const r = await api(`/quizzes/${quiz.id}/submit`, { method: 'POST', body: { answers: ans, language: sel.language || 'English', difficulty: sel.difficulty || 'Basic', durationSeconds: Math.round((Date.now() - start) / 1000) } });
          S.set('emailMsg', { ...r.email, resultId: r.resultId }); location.href = 'result.html?id=' + r.resultId;
        } catch (e) { done = false; out.insertAdjacentHTML('beforeend', `<div class="msg err">${esc(e.message)}</div>`); }
      };
      const draw = () => {
        const q = quiz.questions[i], n = quiz.questions.length;
        out.innerHTML = `<div class="qhead"><span>${esc(quiz.subject)} · ${esc(quiz.topic)} · ${esc(sel.difficulty || 'Basic')} · English questions · ${esc(sel.language || 'English')} videos</span><span class="timer">⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</span></div>
          <div class="bar"><i style="width:${(i + 1) / n * 100}%"></i></div><p class="sub">Question ${i + 1} of ${n} · answered ${Object.keys(ans).length}</p>
          <h2>${esc(q.question)}</h2>${q.options.map((o, k) => `<button class="opt ${ans[q.id] === k ? 'sel' : ''}" data-k="${k}">${'ABCD'[k]}. ${esc(o)}</button>`).join('')}
          <div class="row"><button class="btn alt" id="pv" ${i ? '' : 'disabled'}>← Previous</button>${i < n - 1 ? '<button class="btn" id="nx">Next →</button>' : '<button class="btn ok" id="sb">Submit Quiz</button>'}</div>`;
        out.querySelectorAll('.opt').forEach(b => b.onclick = () => { ans[q.id] = +b.dataset.k; draw(); });
        $('#pv').onclick = () => { i--; draw(); }; if ($('#nx')) $('#nx').onclick = () => { i++; draw(); }; if ($('#sb')) $('#sb').onclick = submit;
      };
      const tick = setInterval(() => { left--; if (left <= 0) { submit(); } else { const t = out.querySelector('.timer'); if (t) t.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; } }, 1000);
      draw();
    } else if (page === 'result') {
      const r = await api('/results/detail/' + new URLSearchParams(location.search).get('id'));
      let em = S.get('emailMsg');
      if (em?.resultId === r.id && !em.sent && r.email_status !== 'sent' && window.QUIZ_ARENA_EMAILJS) {
        em = await sendEmailJsResult(r);
        S.set('emailMsg', em);
      }
      out.innerHTML = `<h2 style="text-align:center">${esc(r.subject)} · ${esc(r.topic)} · ${esc(r.difficulty || 'Basic')}</h2><div class="score ${r.passed ? 'pass' : 'fail'}">${r.correct}/${r.total}</div>
        <p style="text-align:center;font-size:1.3rem">${r.percentage}% — ${badge(r.passed)}</p>
        <div class="stats"><div><b>${r.total}</b>Total</div><div><b class="pass">${r.correct}</b>Correct</div><div><b class="fail">${r.wrong}</b>Wrong</div><div><b>${r.percentage}%</b>Percentage</div></div>
        ${em ? `<div class="msg ${em.sent ? 'ok' : 'warn'}">${esc(em.message)}</div>` : ''}
        <p class="sub">✔ Result saved to the database.</p><div class="row"><a class="btn" href="history.html">View history</a><a class="btn alt" href="subject.html">Take another quiz</a></div>`;
    } else if (page === 'history') {
      const rows = await api('/results/' + getUser().id);
      const videos = await api('/videos/activity');
      out.innerHTML = `${rows.length ? `<table><tr><th>Date</th><th>Subject</th><th>Topic</th><th>Level</th><th>Language</th><th>Score</th><th>%</th><th>Result</th><th>Email</th></tr>${rows.map(r => `<tr><td>${esc(r.created_at)}</td><td>${esc(r.subject)}</td><td>${esc(r.topic)}</td><td>${esc(r.difficulty || 'Basic')}</td><td>${esc(r.language)}</td><td>${r.correct}/${r.total}</td><td>${r.percentage}</td><td>${badge(r.passed)}</td><td>${r.email_status === 'sent' ? 'Sent' : 'Not sent'}</td></tr>`).join('')}</table>` : 'No quizzes taken yet. <a href="subject.html">Start one!</a>'}
        <h2>Watched videos</h2>${videos.length ? `<table><tr><th>Opened</th><th>Subject</th><th>Topic</th><th>Language</th><th>Video search</th></tr>${videos.map(v => `<tr><td>${esc(v.created_at)}</td><td>${esc(v.subject)}</td><td>${esc(v.topic)}</td><td>${esc(v.language)}</td><td><a href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">Open video results</a></td></tr>`).join('')}</table>` : '<p class="sub">No videos opened yet. Open a video from the recommendations page and it will appear here.</p>'}`;
    }
  } catch (e) { out.innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
})();
