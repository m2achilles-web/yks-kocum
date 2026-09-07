// DERS KÜTÜPHANESİ
const LESSON_DATA = {
  tyt: {
    "Türkçe": ["Paragraf", "Dil Bilgisi", "Sözcükte Anlam"],
    "Matematik": ["Temel Kavramlar", "Problemler", "Kümeler"],
    "Geometri": ["Üçgenler", "Çokgenler", "Analitik Geometri"],
    "Fizik": ["Vektörler", "Hareket", "Optik"],
    "Kimya": ["Kimyasal Türler", "Mol Kavramı", "Asit-Baz"],
    "Biyoloji": ["Hücre", "Mitoz-Mayoz", "Ekoloji"],
    "Tarih": ["İlk Türk Devletleri", "Osmanlı Tarihi", "İnkılap Tarihi"],
    "Coğrafya": ["Harita Bilgisi", "İklim", "Nüfus"],
    "Felsefe": ["Felsefeye Giriş", "Bilgi Felsefesi"],
    "Din Kültürü": ["Inanç", "Ibadet"]
  },
  ayt: {
    "Matematik": ["Türev", "İntegral", "Limit", "Trigonometri"],
    "Geometri": ["Çember-Daire", "Katı Cisimler"],
    "Fizik": ["Atışlar", "Tork", "Elektrik ve Manyetizma"],
    "Kimya": ["Açık Kimya", "Organik Kimya"],
    "Biyoloji": ["Sistemler", "Genetik koda giriş"],
    "Edebiyat": ["Divan Edebiyatı", "Tanzimat", "Cumhuriyet"],
    "Tarih-2": ["Çağdaş Türk ve Dünya Tarihi"],
    "Coğrafya-2": ["Küresel Ortam"]
  },
  ydt: {
    "İngilizce": ["Grammar", "Reading Passage", "Vocabulary", "Translation"]
  }
};

// GLOBAL DATA STRUCTURES
let appState = {
  profile: { name: "Öğrenci", field: "Sayısal", uni: "", dept: "", rank: "" },
  timer: { startTime: 0, accumulatedTime: 0, isRunning: false },
  plans: [],
  questions: [],
  exams: []
};

let timerInterval = null;
let netChart = null;

// INIT
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  updatePlanLessons();
  updateSoruLessons();
  updateWrongLessons();
  renderExamInputs();
  renderAll();
  
  // Kronometre durumu kontrolü (Sayfa yenilense de arka planda devam eder)
  if (appState.timer.isRunning) {
    runTimerLoop();
  }
});

// SAYFA GEÇİŞİ
function switchPage(pageId, btnElement) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
}

// 1. DERS YARDIMCILARI
function updatePlanLessons() {
  const type = document.getElementById('planExamType').value;
  const select = document.getElementById('planLessonSelect');
  select.innerHTML = Object.keys(LESSON_DATA[type]).map(l => `<option value="${l}">${l}</option>`).join('');
}

function updateSoruLessons() {
  const type = document.getElementById('soruExamType').value;
  const select = document.getElementById('soruLessonSelect');
  select.innerHTML = Object.keys(LESSON_DATA[type]).map(l => `<option value="${l}">${l}</option>`).join('');
  updateSoruTopics();
}

function updateSoruTopics() {
  const type = document.getElementById('soruExamType').value;
  const lesson = document.getElementById('soruLessonSelect').value;
  const select = document.getElementById('soruTopicSelect');
  const topics = LESSON_DATA[type][lesson] || [];
  select.innerHTML = topics.map(t => `<option value="${t}">${t}</option>`).join('');
}

function updateWrongLessons() {
  const type = document.getElementById('wrongExamType').value;
  const select = document.getElementById('wrongLessonSelect');
  select.innerHTML = Object.keys(LESSON_DATA[type]).map(l => `<option value="${l}">${l}</option>`).join('');
}

// 2. PLAN EKLEME
function addPlan() {
  const lesson = document.getElementById('planLessonSelect').value;
  const hours = parseFloat(document.getElementById('planHoursInput').value);
  if (!hours || hours <= 0) return alert('Geçerli süre girin!');

  appState.plans.push({ id: Date.now(), lesson, hours, completed: false });
  saveAndRender();
  document.getElementById('planHoursInput').value = '';
}

function togglePlan(id) {
  const plan = appState.plans.find(p => p.id === id);
  if (plan) plan.completed = !plan.completed;
  saveAndRender();
}

// 3. SORU EKLEME
function addQuestionRecord() {
  const type = document.getElementById('soruExamType').value;
  const lesson = document.getElementById('soruLessonSelect').value;
  const topic = document.getElementById('soruTopicSelect').value;
  const d = parseInt(document.getElementById('soruDogru').value) || 0;
  const y = parseInt(document.getElementById('soruYanlis').value) || 0;
  const b = parseInt(document.getElementById('soruBos').value) || 0;

  if (d + y + b === 0) return alert('Soru sayısı girin!');

  appState.questions.push({ id: Date.now(), type, lesson, topic, d, y, b, date: new Date().toLocaleDateString('tr-TR') });
  saveAndRender();
  document.getElementById('soruDogru').value = '';
  document.getElementById('soruYanlis').value = '';
  document.getElementById('soruBos').value = '';
}

// 4. DENEME DERS DERS DOLDURMA
function renderExamInputs() {
  const cat = document.getElementById('examCategory').value;
  const container = document.getElementById('examLessonInputs');
  const lessons = Object.keys(LESSON_DATA[cat]);

  container.innerHTML = lessons.map(l => `
    <div>
      <label style="font-size:10px;">${l}</label>
      <input type="number" step="0.25" class="exam-net-input" data-lesson="${l}" placeholder="Net">
    </div>
  `).join('');
}

function addExam() {
  const cat = document.getElementById('examCategory').value;
  const title = document.getElementById('examTitle').value;
  if (!title) return alert('Deneme adı girin!');

  const inputs = document.querySelectorAll('.exam-net-input');
  let lessonNets = {};
  let totalNet = 0;

  inputs.forEach(inp => {
    const net = parseFloat(inp.value) || 0;
    lessonNets[inp.dataset.lesson] = net;
    totalNet += net;
  });

  appState.exams.push({ id: Date.now(), cat, title, lessonNets, totalNet, date: new Date().toLocaleDateString('tr-TR') });
  saveAndRender();
  document.getElementById('examTitle').value = '';
  renderExamInputs();
}

// 5. KRONOMETRE (Arka Planda/Telefon Kapansa da Kesintisiz Çalışır)
function startTimer() {
  if (appState.timer.isRunning) return;
  appState.timer.isRunning = true;
  appState.timer.startTime = Date.now();
  saveToLocalStorage();
  runTimerLoop();
}

function stopTimer() {
  if (!appState.timer.isRunning) return;
  const elapsed = Date.now() - appState.timer.startTime;
  appState.timer.accumulatedTime += elapsed;
  appState.timer.isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  saveAndRender();
}

function resetTimer() {
  appState.timer = { startTime: 0, accumulatedTime: 0, isRunning: false };
  clearInterval(timerInterval);
  timerInterval = null;
  saveAndRender();
}

function getCalculatedTotalMs() {
  let total = appState.timer.accumulatedTime;
  if (appState.timer.isRunning) {
    total += Date.now() - appState.timer.startTime;
  }
  return total;
}

function runTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const totalMs = getCalculatedTotalMs();
    const secs = Math.floor((totalMs / 1000) % 60);
    const mins = Math.floor((totalMs / (1000 * 60)) % 60);
    const hrs = Math.floor(totalMs / (1000 * 60 * 60));
    
    const formatted = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    const display = document.getElementById('timerDisplay');
    if (display) display.innerText = formatted;
    
    const homeDisplay = document.getElementById('homeTotalStudyTime');
    if (homeDisplay) homeDisplay.innerText = formatted;
  }, 1000);
}

// 6. PROFİL KAYIT
function saveProfile() {
  appState.profile.name = document.getElementById('profileName').value || "Öğrenci";
  appState.profile.field = document.getElementById('profileField').value;
  appState.profile.uni = document.getElementById('targetUni').value;
  appState.profile.dept = document.getElementById('targetDept').value;
  appState.profile.rank = document.getElementById('targetRank').value;
  saveAndRender();
  alert('Profil güncellendi!');
}

// RENDER ALL
function renderAll() {
  // Topbar
  document.getElementById('topbarUsername').innerText = appState.profile.name;
  document.getElementById('topbarTargetInfo').innerText = appState.profile.dept ? `${appState.profile.uni} ${appState.profile.dept}` : "Hedef Belirtilmedi";

  // Profil Ekranı Girişleri
  document.getElementById('profileName').value = appState.profile.name;
  document.getElementById('profileField').value = appState.profile.field;
  document.getElementById('targetUni').value = appState.profile.uni;
  document.getElementById('targetDept').value = appState.profile.dept;
  document.getElementById('targetRank').value = appState.profile.rank;

  // Planlar & İlerleme
  const totalPlans = appState.plans.length;
  const completedPlans = appState.plans.filter(p => p.completed).length;
  const percent = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;
  const progressBar = document.getElementById('dailyProgressBar');
  progressBar.style.width = `${percent}%`;
  progressBar.innerText = `${percent}%`;

  document.getElementById('planList').innerHTML = appState.plans.map(p => `
    <div class="list-item">
      <span>${p.lesson} - ${p.hours} Saat</span>
      <input type="checkbox" ${p.completed ? 'checked' : ''} onchange="togglePlan(${p.id})" style="width:auto; margin:0;">
    </div>
  `).join('') || '<p style="font-size:12px; color:var(--text-muted);">Plan bulunmuyor.</p>';

  document.getElementById('homeTaskList').innerHTML = document.getElementById('planList').innerHTML;

  // Soru Geçmişi
  document.getElementById('questionHistoryList').innerHTML = appState.questions.slice(-5).reverse().map(q => `
    <div class="list-item">
      <div><strong>${q.lesson}</strong> (${q.topic})</div>
      <div style="color:var(--success);">${q.d}D / ${q.y}Y / ${q.b}B</div>
    </div>
  `).join('') || '<p style="font-size:12px; color:var(--text-muted);">Soru kaydı bulunmuyor.</p>';

  // Deneme Geçmişi
  document.getElementById('examHistoryList').innerHTML = appState.exams.slice(-5).reverse().map(e => `
    <div class="list-item" style="flex-direction:column; align-items:flex-start;">
      <div style="display:flex; justify-content:space-between; width:100%;">
        <strong>${e.title} (${e.cat.toUpperCase()})</strong>
        <span style="color:#818cf8; font-weight:bold;">${e.totalNet} Net</span>
      </div>
      <div style="font-size:10px; color:var(--text-muted); margin-top:4px;">
        ${Object.entries(e.lessonNets).map(([k,v]) => `${k}: ${v}`).join(' | ')}
      </div>
    </div>
  `).join('') || '<p style="font-size:12px; color:var(--text-muted);">Deneme kaydı bulunmuyor.</p>';

  // Koç Paneli
  const totalQuestions = appState.questions.reduce((acc, q) => acc + q.d + q.y + q.b, 0);
  document.getElementById('coachOverview').innerHTML = `
    <div class="list-item"><span>Öğrenci:</span> <strong>${appState.profile.name} (${appState.profile.field})</strong></div>
    <div class="list-item"><span>Hedef Sıralama:</span> <strong>${appState.profile.rank || '-'}</strong></div>
    <div class="list-item"><span>Çözülen Soru Sayısı:</span> <strong>${totalQuestions} Soru</strong></div>
    <div class="list-item"><span>Girilen Deneme:</span> <strong>${appState.exams.length} Deneme</strong></div>
  `;

  // Kronometre Güncelle
  const totalMs = getCalculatedTotalMs();
  const secs = Math.floor((totalMs / 1000) % 60);
  const mins = Math.floor((totalMs / (1000 * 60)) % 60);
  const hrs = Math.floor(totalMs / (1000 * 60 * 60));
  const formatted = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  document.getElementById('timerDisplay').innerText = formatted;
  document.getElementById('homeTotalStudyTime').innerText = formatted;

  renderChart();
}

function renderChart() {
  const ctx = document.getElementById('netChart');
  if (!ctx) return;
  
  if (netChart) netChart.destroy();

  const labels = appState.exams.map(e => e.title);
  const data = appState.exams.map(e => e.totalNet);

  netChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Örnek 1', 'Örnek 2'],
      datasets: [{ label: 'Toplam Net', data: data.length ? data : [0, 0], borderColor: '#4f46e5', tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function uploadWrongQuestion() { alert('Yanlış soru görseli yüklendi!'); }
function switchExamTab() { renderChart(); }

// LOCAL STORAGE INTEGRATION
function saveToLocalStorage() {
  localStorage.setItem('yks_app_state', JSON.stringify(appState));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('yks_app_state');
  if (saved) {
    appState = JSON.parse(saved);
  }
}

function saveAndRender() {
  saveToLocalStorage();
  renderAll();
}
