// Handles: subject, topic, language, learning, videos pages (selection is kept in sessionStorage under "sel")
const page = document.body.dataset.page, sel = S.get('sel') || {}, list = $('#list'), m = $('#m');
const tile = (icon, name, extra = '') => `<div class="card pick"><div class="ic">${icon}</div><h3>${esc(name)}</h3><small class="sub">${extra}</small></div>`;
(async () => {
  if (page === 'index') return;
  if (!requireLogin()) return;
  try {
    if (page === 'subject') {
      const subs = await api('/subjects'); list.innerHTML = subs.map(s => tile(s.icon, s.name)).join('');
      [...list.children].forEach((el, i) => el.onclick = () => { S.set('sel', { subject: subs[i] }); location.href = 'topic.html'; });
    } else if (page === 'topic') {
      if (!sel.subject) return location.href = 'subject.html';
      const d = await api(`/subjects/${sel.subject.id}/topics`); $('#t').textContent = d.subject.name + ' — choose a topic';
      list.innerHTML = d.topics.map(t => tile('📘', t.name)).join('');
      [...list.children].forEach((el, i) => el.onclick = () => { S.set('sel', { ...sel, topic: d.topics[i] }); location.href = 'language.html'; });
    } else if (page === 'language') {
      if (!sel.topic) return location.href = 'subject.html';
      const levels = [
        ['Basic', 'Start with core ideas, definitions, and guided examples.'],
        ['Intermediate', 'Build on fundamentals with practical examples and problem solving.'],
        ['Advanced', 'Explore deeper concepts, edge cases, and technical applications.']
      ];
      let difficulty = sel.difficulty || 'Basic';
      const drawLevels = () => {
        $('#levels').innerHTML = levels.map(([name]) => `<button type="button" class="btn ${difficulty === name ? '' : 'alt'}" aria-pressed="${difficulty === name}">${name}</button>`).join('');
        $('#level-info').textContent = levels.find(([name]) => name === difficulty)[1];
        [...$('#levels').children].forEach((button, index) => button.onclick = () => { difficulty = levels[index][0]; drawLevels(); });
      };
      drawLevels();
      const L = [['English', 'A'], ['Telugu', 'తె'], ['Hindi', 'हि'], ['Tamil', 'த'], ['Malayalam', 'മ']];
      list.innerHTML = L.map(l => tile(l[1], l[0])).join('');
      [...list.children].forEach((el, i) => el.onclick = () => { S.set('sel', { ...sel, difficulty, language: L[i][0], ai: null }); location.href = 'videos.html'; });
    } else if (page === 'learning') {
      if (!sel.language) return location.href = 'subject.html';
      // Fetch AI keywords (English text only, language only affects video recommendations)
      if (!sel.ai) {
        $('#out').innerHTML = '<p class="sub">Loading AI recommendations…</p>';
        try {
          const ai = await api('/ai/recommend', { method: 'POST', body: { subject: sel.subject.name, topic: sel.topic.name, language: sel.language, difficulty: sel.difficulty || 'Basic' } });
          S.set('sel', { ...sel, ai });
        } catch (e) { /* proceed without AI keywords */ }
      }
      location.replace('videos.html');

    } else if (page === 'videos') {
      if (!sel.language) return location.href = 'subject.html';
      const currentSel = S.get('sel') || sel;
      $('#ctx').textContent = `${currentSel.subject.name} · ${currentSel.topic.name} · ${currentSel.language}`;

      // Use AI video keywords if available (they are in English but search in the chosen language)
      const keywords = (currentSel.ai && currentSel.ai.videoKeywords) || [];
      const { videos } = await api('/videos/recommend', {
        method: 'POST',
        body: {
          subject: currentSel.subject.name,
          topic: currentSel.topic.name,
          language: currentSel.language,
          difficulty: currentSel.difficulty || 'Basic',
          keywords
        }
      });

      list.innerHTML = videos.map(v =>
        `<div class="card">
          <span class="badge">${esc(v.type)}</span>
          <h3>${esc(v.title)}</h3>
          <p class="sub" style="font-size:.75rem;margin:4px 0 10px;word-break:break-all">${esc(v.url.split('?')[1] ? '▶ YouTube · ' + currentSel.language : '')}</p>
          <button class="btn" style="width:100%" data-url="${esc(v.url)}">▶ Watch in ${esc(currentSel.language)}</button>
        </div>`
      ).join('');

      // Update the "Start Quiz" button
      const rowEl = $('.row') || document.createElement('div');
      rowEl.innerHTML = `<a class="btn ok" href="quiz.html">Take ${esc(currentSel.difficulty || 'Basic')} Quiz →</a>`;

      list.querySelectorAll('button[data-url]').forEach(b => b.onclick = async () => {
        window.open(b.dataset.url, '_blank', 'noopener');
        try {
          await api('/videos/activity', { method: 'POST', body: { topicId: currentSel.topic.id, language: currentSel.language, action: 'watch_video', url: b.dataset.url } });
        } catch (e) { if (m) showMsg(m, e.message); }
      });
    }
  } catch (e) { (m || $('#out')).innerHTML = `<div class="msg err">${esc(e.message)}</div>`; }
})();
