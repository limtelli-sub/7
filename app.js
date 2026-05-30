/* ==============================
   앱 상태 관리
============================== */
let appState = {
  totalScore: 0,
  quizCount: 0,
  perfectCount: 0,
  termsViewed: 0,
  diagnosisCount: 0,
  speedCount: 0,
  quizHistory: [],
  unlockedAchievements: []
};

// 로컬 스토리지에서 불러오기
function loadState() {
  const saved = localStorage.getItem('semilearn_state');
  if (saved) {
    try { appState = { ...appState, ...JSON.parse(saved) }; }
    catch (e) { console.warn('state load error'); }
  }
}

function saveState() {
  localStorage.setItem('semilearn_state', JSON.stringify(appState));
}

/* ==============================
   페이지 라우터
============================== */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('page-' + pageId).classList.add('active');
  const navBtn = document.getElementById('nav-' + pageId);
  if (navBtn) navBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageId === 'progress') renderProgress();
  if (pageId === 'glossary') renderGlossary();
  if (pageId === 'defect') renderDefects();
}

/* ==============================
   점수 업데이트
============================== */
function updateScoreDisplay() {
  document.getElementById('total-score').textContent = appState.totalScore;
  const homeScore = document.getElementById('stat-score-home');
  if (homeScore) homeScore.textContent = appState.totalScore;
  const ptsDisplay = document.getElementById('pts-display');
  if (ptsDisplay) ptsDisplay.textContent = appState.totalScore;
}

/* ==============================
   홈 - 오늘의 상식
============================== */
function renderDailyTip() {
  const idx = new Date().getDay() % DAILY_TIPS.length;
  const tip = DAILY_TIPS[idx];
  document.getElementById('tip-title').textContent = tip.title;
  document.getElementById('tip-desc').textContent = tip.desc;
  const te = document.querySelector('.tip-emoji');
  if (te) te.textContent = tip.emoji;
}

/* ==============================
   용어 사전
============================== */
let currentCategory = 'all';

function renderGlossary(filter = '') {
  const grid = document.getElementById('glossary-grid');
  const search = filter || document.getElementById('glossary-search').value.toLowerCase();

  const filtered = GLOSSARY_DATA.filter(t => {
    const matchCat = currentCategory === 'all' || t.category === currentCategory;
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search) ||
      t.eng.toLowerCase().includes(search) ||
      t.simple.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">
      <div style="font-size:3rem;margin-bottom:12px">🔍</div>
      <p>검색 결과가 없어요. 다른 키워드로 찾아보세요!</p>
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(term => `
    <div class="term-card" onclick="openTermModal('${term.id}')" id="term-${term.id}">
      <div class="term-card-top">
        <div class="term-emoji">${term.emoji}</div>
        <div class="term-title-group">
          <div class="term-name">${term.name}</div>
          <div class="term-eng">${term.eng}</div>
        </div>
        <span class="term-tag tag-${term.category}">${getCategoryLabel(term.category)}</span>
      </div>
      <div class="term-simple">${term.simple}</div>
      <div class="term-analogy-preview">
        <span>💡</span> <span style="color:var(--accent3)">비유로 쉽게 이해하기 →</span>
      </div>
    </div>
  `).join('');
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGlossary();
}

function filterGlossary() {
  renderGlossary();
}

function getCategoryLabel(cat) {
  return { basic: '🌱 기초', process: '⚙️ 공정', defect: '🔴 불량', ai: '🤖 AI' }[cat] || cat;
}

/* ==============================
   용어 모달
============================== */
let currentTermId = null;

function openTermModal(termId) {
  const term = GLOSSARY_DATA.find(t => t.id === termId);
  if (!term) return;
  currentTermId = termId;

  document.getElementById('modal-icon').textContent = term.emoji;
  document.getElementById('modal-term').textContent = term.name;
  document.getElementById('modal-category').innerHTML =
    `<span class="term-tag tag-${term.category}">${getCategoryLabel(term.category)}</span>`;
  document.getElementById('modal-simple-text').textContent = term.simple;
  document.getElementById('modal-analogy-text').textContent = term.analogy;
  document.getElementById('modal-detail-text').textContent = term.detail;

  document.getElementById('term-modal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // 조회 카운트
  appState.termsViewed = (appState.termsViewed || 0) + 1;
  saveState();
  checkAchievements();
}

function closeModal() {
  document.getElementById('term-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function quizOnTerm() {
  closeModal();
  showPage('quiz');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ==============================
   불량 진단 페이지
============================== */
function renderDefects() {
  const list = document.getElementById('defect-list');
  if (list.dataset.rendered === '1') return;
  list.dataset.rendered = '1';

  list.innerHTML = DEFECT_DATA.map(d => `
    <div class="defect-card">
      <div class="defect-header">
        <div class="defect-icon">${d.icon}</div>
        <div class="defect-title">${d.title}</div>
        <span class="defect-severity sev-${d.severity}">
          ${{ high: '⚠️ 심각', medium: '🔶 중간', low: '🟢 낮음' }[d.severity]}
        </span>
      </div>
      <div class="defect-desc">${d.desc}</div>
      <div class="defect-cause-label">🔍 주요 원인</div>
      <ul class="defect-causes">${d.causes.map(c => `<li>${c}</li>`).join('')}</ul>
      <div class="defect-analogy-box">${d.analogy}</div>
    </div>
  `).join('');
}

/* ==============================
   불량 시뮬레이터
============================== */
let selectedSymptoms = new Set();

function toggleSymptom(btn, key) {
  if (selectedSymptoms.has(key)) {
    selectedSymptoms.delete(key);
    btn.classList.remove('selected');
  } else {
    selectedSymptoms.add(key);
    btn.classList.add('selected');
  }
  document.getElementById('diagnose-btn').disabled = selectedSymptoms.size === 0;
}

function runDiagnosis() {
  if (selectedSymptoms.size === 0) return;

  const resultDiv = document.getElementById('diagnosis-result');
  resultDiv.style.display = 'block';
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // AI 진단 로직
  let result;
  if (selectedSymptoms.size >= 3) {
    result = DIAGNOSIS_RESULTS['multiple'];
  } else {
    const key = [...selectedSymptoms][0];
    result = DIAGNOSIS_RESULTS[key] || DIAGNOSIS_RESULTS['multiple'];
  }

  // 애니메이션 효과
  resultDiv.innerHTML = `
    <div style="text-align:center;padding:20px 0;color:var(--accent);font-size:1rem;">
      🤖 AI 분석 중...
    </div>`;

  setTimeout(() => {
    resultDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-size:2rem">🤖</span>
        <h3 style="color:var(--accent)">${result.title}</h3>
      </div>
      <p style="color:var(--text-sub);line-height:1.8;margin-bottom:16px">${result.desc}</p>
      <div style="background:rgba(6,214,160,0.08);border-left:3px solid var(--accent3);
                  border-radius:0 8px 8px 0;padding:14px 16px;
                  color:var(--accent3);font-size:0.9rem;line-height:1.7">
        ${result.action}
      </div>
      <div style="margin-top:16px;padding:12px 16px;
                  background:rgba(245,158,11,0.08);border-radius:10px;
                  font-size:0.85rem;color:var(--gold)">
        ⭐ 진단 완료! 불량 진단 카운트가 올라갑니다.
      </div>`;

    appState.diagnosisCount = (appState.diagnosisCount || 0) + 1;
    saveState();
    checkAchievements();
  }, 1200);
}

/* ==============================
   퀴즈 시스템
============================== */
let quizState = {
  difficulty: null,
  questions: [],
  current: 0,
  score: 0,
  correctCount: 0,
  timer: null,
  timeLeft: 30,
  answered: false,
  startTime: null
};

function selectDifficulty(diff) {
  quizState.difficulty = diff;
  document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('diff-' + diff).classList.add('selected');
  document.getElementById('start-quiz-btn').disabled = false;
}

function startQuiz() {
  if (!quizState.difficulty) return;

  // 문제 셔플
  const pool = [...QUIZ_DATA[quizState.difficulty]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  quizState.questions = pool;
  quizState.current = 0;
  quizState.score = 0;
  quizState.correctCount = 0;
  quizState.startTime = Date.now();

  document.getElementById('quiz-start').style.display = 'none';
  document.getElementById('quiz-playing').style.display = 'block';
  document.getElementById('quiz-results').style.display = 'none';
  document.getElementById('quiz-total').textContent = quizState.questions.length;

  renderQuestion();
}

function renderQuestion() {
  const q = quizState.questions[quizState.current];
  const total = quizState.questions.length;

  quizState.answered = false;
  document.getElementById('quiz-feedback').style.display = 'none';
  document.getElementById('question-card').style.opacity = '1';

  // 진행 표시
  document.getElementById('quiz-current').textContent = quizState.current + 1;
  const pct = (quizState.current / total) * 100;
  document.getElementById('quiz-progress-fill').style.width = pct + '%';

  // 질문
  document.getElementById('question-category').textContent = q.category;
  document.getElementById('question-text').textContent = q.question;

  // 보기
  const letters = ['A', 'B', 'C', 'D'];
  const optGrid = document.getElementById('options-grid');
  optGrid.innerHTML = q.options.map((opt, i) => `
    <button class="option-btn" id="opt-${i}" onclick="selectAnswer(${i})">
      <span class="option-letter">${letters[i]}</span>
      <span>${opt}</span>
    </button>
  `).join('');

  // 타이머
  clearInterval(quizState.timer);
  quizState.timeLeft = 30;
  updateTimer();
  quizState.timer = setInterval(() => {
    quizState.timeLeft--;
    updateTimer();
    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timer);
      if (!quizState.answered) timeOut();
    }
  }, 1000);
}

function updateTimer() {
  const el = document.getElementById('quiz-timer');
  el.textContent = '⏱️ ' + quizState.timeLeft;
  el.classList.toggle('danger', quizState.timeLeft <= 10);
}

function selectAnswer(idx) {
  if (quizState.answered) return;
  quizState.answered = true;
  clearInterval(quizState.timer);

  const q = quizState.questions[quizState.current];
  const isCorrect = idx === q.answer;
  const elapsed = (Date.now() - quizState.startTime) / 1000;

  // 버튼 시각화
  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add('correct');
    else if (i === idx && !isCorrect) btn.classList.add('wrong');
  });

  // 피드백
  const fb = document.getElementById('quiz-feedback');
  document.getElementById('feedback-icon').textContent = isCorrect ? '🎉' : '😢';
  document.getElementById('feedback-text').textContent = isCorrect ? '정답입니다! 대단해요!' : `오답이에요. 정답은 "${q.options[q.answer]}"`;
  document.getElementById('feedback-explanation').textContent = q.explanation;

  const nextBtn = document.getElementById('btn-next');
  const isLast = quizState.current === quizState.questions.length - 1;
  nextBtn.textContent = isLast ? '결과 보기 🏁' : '다음 문제 →';
  fb.style.display = 'block';

  if (isCorrect) {
    quizState.correctCount++;
    // 속도 보너스
    if (quizState.timeLeft >= 20) appState.speedCount = (appState.speedCount || 0) + 1;
    else appState.speedCount = 0;
  }
}

function timeOut() {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.current];
  document.querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add('correct');
  });

  const fb = document.getElementById('quiz-feedback');
  document.getElementById('feedback-icon').textContent = '⏰';
  document.getElementById('feedback-text').textContent = '시간 초과! 다음엔 빠르게 풀어봐요!';
  document.getElementById('feedback-explanation').textContent = q.explanation;

  const isLast = quizState.current === quizState.questions.length - 1;
  document.getElementById('btn-next').textContent = isLast ? '결과 보기 🏁' : '다음 문제 →';
  fb.style.display = 'block';
}

function nextQuestion() {
  quizState.current++;
  if (quizState.current >= quizState.questions.length) {
    showResults();
  } else {
    document.getElementById('quiz-feedback').style.display = 'none';
    renderQuestion();
  }
}

function showResults() {
  clearInterval(quizState.timer);
  document.getElementById('quiz-playing').style.display = 'none';
  document.getElementById('quiz-results').style.display = 'block';

  const total = quizState.questions.length;
  const correct = quizState.correctCount;
  const pct = Math.round((correct / total) * 100);
  const pts = correct * getDifficultyPts();

  // 이모지 & 메시지
  let emoji, title, msg;
  if (pct === 100) {
    emoji = '🏆'; title = '완벽해요!';
    msg = `모든 문제를 맞히셨네요! 반도체 실력이 정말 대단해요! 꾸준히 공부하면 전문가가 될 수 있어요! 🌟`;
  } else if (pct >= 70) {
    emoji = '🎉'; title = '잘 하셨어요!';
    msg = `${pct}% 정답률이에요! 틀린 문제를 다시 공부하면 다음엔 만점도 가능해요! 💪`;
  } else if (pct >= 40) {
    emoji = '📚'; title = '조금 더 공부해요!';
    msg = `${pct}% 정답률이에요. 용어 사전을 다시 읽고 도전해보세요! 파이팅! 🔥`;
  } else {
    emoji = '🌱'; title = '시작이 반이에요!';
    msg = `처음은 누구나 어렵습니다. 용어 사전부터 차근차근 읽어보고 다시 도전해보세요! 💡`;
  }

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-title').textContent = title;
  document.getElementById('results-message').textContent = msg;
  document.getElementById('results-score').textContent = correct;
  document.getElementById('correct-count').textContent = correct;
  document.getElementById('wrong-count').textContent = total - correct;
  document.getElementById('earned-pts').textContent = `+${pts}`;

  // 점수 누적
  appState.totalScore += pts;
  appState.quizCount = (appState.quizCount || 0) + 1;
  if (correct === total) appState.perfectCount = (appState.perfectCount || 0) + 1;

  // 히스토리 저장
  appState.quizHistory = appState.quizHistory || [];
  appState.quizHistory.unshift({
    date: new Date().toLocaleDateString('ko-KR'),
    difficulty: quizState.difficulty,
    score: correct,
    total: total,
    pts: pts
  });
  if (appState.quizHistory.length > 10) appState.quizHistory.pop();

  saveState();
  updateScoreDisplay();
  checkAchievements();

  // 점수 카운트업 애니메이션
  animateNumber('results-score', 0, correct, 800);
}

function getDifficultyPts() {
  return { easy: 10, medium: 20, hard: 30 }[quizState.difficulty] || 10;
}

function animateNumber(id, from, to, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function update(time) {
    const p = Math.min((time - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * p);
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function retryQuiz() {
  document.getElementById('quiz-results').style.display = 'none';
  document.getElementById('quiz-start').style.display = 'block';
  document.querySelectorAll('.difficulty-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('start-quiz-btn').disabled = true;
  quizState.difficulty = null;
}

/* ==============================
   학습 기록 페이지
============================== */
const LEVELS = [
  { min: 0,    icon: '🌱', name: '반도체 새싹',    desc: '반도체의 세계에 첫발을 내딛었어요!' },
  { min: 100,  icon: '🔬', name: '탐구자',          desc: '기초를 익히고 있어요. 계속 도전하세요!' },
  { min: 300,  icon: '⚙️', name: '공정 견습생',    desc: '공정 개념을 알기 시작했어요!' },
  { min: 600,  icon: '💡', name: '반도체 학생',     desc: '꾸준한 학습이 실력을 만들어요!' },
  { min: 1000, icon: '🏭', name: '공정 엔지니어',  desc: '이제 반도체 공정을 이해하는 수준이에요!' },
  { min: 2000, icon: '🤖', name: 'AI 진단 전문가', desc: 'AI 불량 진단까지 이해하는 고급 학습자!' },
  { min: 3500, icon: '🏆', name: '반도체 마스터',  desc: '당신은 반도체 전문가입니다!' }
];

function getCurrentLevel(score) {
  let level = LEVELS[0];
  for (const lv of LEVELS) {
    if (score >= lv.min) level = lv;
  }
  return level;
}

function getNextLevel(score) {
  for (const lv of LEVELS) {
    if (lv.min > score) return lv;
  }
  return null;
}

function renderProgress() {
  const score = appState.totalScore || 0;
  const level = getCurrentLevel(score);
  const next = getNextLevel(score);

  document.getElementById('level-badge').textContent = level.icon;
  document.getElementById('level-name').textContent = level.name;
  document.getElementById('level-desc').textContent = level.desc;
  document.getElementById('pts-display').textContent = score;

  if (next) {
    const prev = level.min;
    const pct = Math.min(((score - prev) / (next.min - prev)) * 100, 100);
    document.getElementById('level-progress-fill').style.width = pct + '%';
    document.getElementById('next-level-pts').textContent =
      `다음 레벨 "${next.name}" ${next.icon} 까지 ${next.min - score}점 필요`;
  } else {
    document.getElementById('level-progress-fill').style.width = '100%';
    document.getElementById('next-level-pts').textContent = '🏆 최고 레벨 달성!';
  }

  // 퀴즈 히스토리
  renderQuizHistory();

  // 뱃지
  renderAchievements();
}

function renderQuizHistory() {
  const container = document.getElementById('quiz-history-list');
  const history = appState.quizHistory || [];

  if (history.length === 0) {
    container.innerHTML = `
      <div class="empty-history">
        <span>📝</span>
        <p>아직 퀴즈를 풀지 않았어요.<br/>퀴즈를 풀고 결과를 확인해보세요!</p>
        <button class="btn-primary" onclick="showPage('quiz')">퀴즈 하러 가기 🧠</button>
      </div>`;
    return;
  }

  const diffLabel = { easy: '🌱 초급', medium: '🔥 중급', hard: '⚡ 고급' };
  container.innerHTML = history.map((h, i) => `
    <div class="history-item">
      <div class="history-icon">${h.score === h.total ? '🏆' : h.score >= h.total * 0.7 ? '🎉' : '📚'}</div>
      <div class="history-info">
        <strong>${diffLabel[h.difficulty] || h.difficulty} · ${h.score}/${h.total}문제 정답</strong>
        <span>${h.date} · +${h.pts}pts 획득</span>
      </div>
      <div class="history-score">${Math.round((h.score / h.total) * 100)}%</div>
    </div>
  `).join('');
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = a.condition(appState);
    return `
      <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${a.icon}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${unlocked ? a.desc : '???'}</div>
      </div>`;
  }).join('');
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!appState.unlockedAchievements.includes(a.id) && a.condition(appState)) {
      appState.unlockedAchievements.push(a.id);
      showAchievementToast(a);
    }
  });
  saveState();
}

function showAchievementToast(achievement) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:32px; right:32px; z-index:9999;
    background:linear-gradient(135deg,#0d1b33,#0f2040);
    border:1px solid var(--gold);
    border-radius:16px; padding:16px 20px;
    display:flex; align-items:center; gap:14px;
    box-shadow:0 0 40px rgba(245,158,11,0.3);
    animation:slideInRight 0.4s cubic-bezier(.4,0,.2,1);
    max-width:320px;
  `;
  toast.innerHTML = `
    <div style="font-size:2.2rem">${achievement.icon}</div>
    <div>
      <div style="color:var(--gold);font-weight:700;font-size:0.95rem">🏆 뱃지 획득!</div>
      <div style="font-weight:700;margin:2px 0">${achievement.name}</div>
      <div style="color:var(--text-sub);font-size:0.82rem">${achievement.desc}</div>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `@keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ==============================
   앱 초기화
============================== */
function initApp() {
  loadState();
  updateScoreDisplay();
  renderDailyTip();
  renderGlossary();

  // 모달 ESC 키
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // 파티클 배경 애니메이션 (홈 히어로)
  animateHeroParticles();
}

function animateHeroParticles() {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 4 + 2;
    dot.style.cssText = `
      position:absolute;
      width:${size}px; height:${size}px;
      background:rgba(0,180,255,${Math.random() * 0.5 + 0.1});
      border-radius:50%;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation:floatDot ${Math.random() * 8 + 6}s ease-in-out infinite;
      animation-delay:${Math.random() * -8}s;
      pointer-events:none;
    `;
    hero.appendChild(dot);
  }

  const s = document.createElement('style');
  s.textContent = `
    @keyframes floatDot {
      0%,100% { transform: translate(0,0) scale(1); opacity:0.3; }
      33%      { transform: translate(${Math.random()*40-20}px,${Math.random()*-40-10}px) scale(1.3); opacity:0.8; }
      66%      { transform: translate(${Math.random()*40-20}px,${Math.random()*20+5}px) scale(0.8); opacity:0.5; }
    }`;
  document.head.appendChild(s);
}

// DOM 준비되면 초기화
document.addEventListener('DOMContentLoaded', initApp);
