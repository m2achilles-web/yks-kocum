// SUPABASE BAĞLANTI AYARLARI (Kendi anahtarlarını yapıştır)
const SUPABASE_URL = 'https://xxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOi...';

// Supabase İstemcisi
const _supabase = (typeof supabase !== 'undefined' && SUPABASE_URL !== 'https://xxxx.supabase.co') 
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

// DERS KÜTÜPHANESİ
const LESSON_DATA = {
  tyt: {
    "Türkçe": ["Paragraf", "Dil Bilgisi", "Sözcükte Anlam"],
    "Matematik": ["Temel Kavramlar", "Problemler", "Kümeler"],
    "Geometri": ["Üçgenler", "Çokgenler", "Analitik Geometri"],
    "Fizik": ["Vektörler", "Hareket", "Optik"],
    "Kimya": ["Kimyasal Türler", "Mol Kavramı", "Asit-Baz"],
    "Biyoloji": ["Hücre", "Mitoz-Mayoz", "Ekoloji"],
    "Tarih": ["İlk Türk Devletleri", "Osmanlı Tarihi"],
    "Coğrafya": ["Harita Bilgisi", "İklim"]
  },
  ayt: {
    "Matematik": ["Türev", "İntegral", "Limit", "Trigonometri"],
    "Geometri": ["Çember-Daire", "Katı Cisimler"],
    "Fizik": ["Atışlar", "Tork", "Elektrik ve Manyetizma"],
    "Kimya": ["Açık Kimya", "Organik Kimya"],
    "Biyoloji": ["Sistemler", "Genetik koda giriş"],
    "Edebiyat": ["Divan Edebiyatı", "Tanzimat"]
  },
  ydt: {
    "İngilizce": ["Grammar", "Reading Passage", "Vocabulary"]
  }
};

let studentsList = [];

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
document.addEventListener('DOMContentLoaded', async () => {
  loadFromLocalStorage();
  updatePlanLessons();
  updateSoruLessons();
  renderExamInputs();
  renderAll();
  
  await fetchStudentsFromSupabase();

  if (appState.timer.isRunning) {
    runTimerLoop();
  }
});

// SAYFA GEÇİŞİ (Eksik Sayfa Hatasını Engeller)
function switchPage(pageId, btnElement) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  } else {
    console.error(`Hata: 'page-${pageId}' ID'li sayfa bulunamadı.`);
    return;
  }

  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  if (pageId === 'exams') renderChart();
}

// SUPABASE'DEN ÖĞRENCİ ÇEKME (profiles Tablosu)
async function fetchStudentsFromSupabase() {
  const select = document.getElementById('coachStudentSelect');

  if (!_supabase) {
    console.warn("Supabase URL ve KEY bilgileri eksik!");
    if (select) select.innerHTML = `<option value="">Supabase Bilgileri Eksik</option>`;
    return;
  }

  try {
    const { data, error } = await _supabase.from('profiles').select('*');
    
    if (error) {
      console.error("Supabase Hatası:", error);
      if (select) select.innerHTML = `<option value="">Hata: ${error.message}</option>`;
      return;
    }

    if (data && data.length > 0) {
      studentsList = data;
      populateStudentDropdown();
    } else {
      if (select) select.innerHTML = `<option value="">profiles Tablosunda Öğrenci Yok</option>`;
    }
  } catch (err) {
    console.error("Bağlantı Hatası:", err);
    if (select) select.innerHTML = `<option value="">Bağlantı Sağlanamadı</option>`;
  }
}

function populateStudentDropdown() {
  const select = document.getElementById('coachStudentSelect');
  if (!select) return;

  if (studentsList.length === 0) {
    select.innerHTML = `<option value="">Kayıtlı öğrenci bulunamadı</option>`;
    return;
  }

  select.innerHTML = studentsList.map(s => {
    const name = s.full_name || s.name || s.email || 'Öğrenci #' + s.id;
    return `<option value="${s.id}">${name}</option>`;
  }).join('');

  renderCoachPanel();
}

function renderCoachPanel() {
  const select = document.getElementById('coachStudentSelect');
  if (!select || !select.value) return;

  const selectedStudent = studentsList.find(s => String(s.id) === String(select.value));
  if (!selectedStudent) return;

  document.getElementById('coachOverview').innerHTML = `
    <div class="list-item"><span>Alan / Hedef Sıralama:</span> <strong>${selectedStudent.field || '-'} / ${selectedStudent.target_rank || '-'}</strong></div>
    <div class="list-item"><span>Hedef Üniversite:</span> <strong>${selectedStudent.target_uni || '-'} ${selectedStudent.target_dept || ''}</strong></div>
    <div class="list-item"><span>E-posta:</span> <strong>${selectedStudent.email || '-'}</strong></div>
  `;
}

// HELPER DERS DOLDURMALARI
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

// PLAN VE SORU EKLEME
function addPlan() {
  const lesson = document.getElementById('planLessonSelect').value;
  const hours = parseFloat(document.getElementById('planHoursInput').value);
  if (!hours) return alert('Saat girin!');

  appState.plans.push({ id: Date.now(), lesson, hours, completed: false });
  saveAndRender();
  document.getElementById('planHoursInput').value = '';
}

function togglePlan(id) {
  const plan = appState.plans.find(p => p.id === id);
  if (plan) plan.completed = !plan.completed;
  saveAndRender();
}

function addQuestionRecord() {
  const lesson = document.getElementById('soruLessonSelect').value;
  const topic = document.getElementById('soruTopicSelect').value;
  const d = parseInt(document.getElementById('soruDogru').value) || 0;
  const y = parseInt(document.getElementById('soruYanlis').value) || 0;
  const b = parseInt(document.getElementById('soruBos').value) || 0;

  appState.questions.push({ id: Date.now(), lesson, topic, d, y, b });
  saveAndRender();
  document.getElementById('soruDogru').value = '';
  document.getElementById('soruYanlis').value = '';
  document.getElementById('soruBos').value = '';
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

  appState.exams.push({ id: Date.now(), cat, title, lessonNets, totalNet });
  saveAndRender();
  document.getElementById('examTitle').value = '';
}

// KRONOMETRE
function startTimer() {
  if (appState.timer.isRunning) return;
  appState.timer.isRunning = true;
  appState.timer.startTime = Date.now();
  saveToLocalStorage();
  runTimerLoop();
}

function stopTimer() {
  if (!appState.timer.isRunning) return;
  appState.timer.accumulatedTime += Date.now() - appState.timer.startTime;
  appState.timer.isRunning = false;
  clearInterval(timerInterval);
  saveAndRender();
}

function resetTimer() {
  appState.timer = { startTime: 0, accumulatedTime: 0, isRunning: false };
  clearInterval(timerInterval);
  saveAndRender();
}

function runTimerLoop() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    let totalMs = appState.timer.accumulatedTime;
    if (appState.timer.isRunning) totalMs += Date.now() - appState.timer.startTime;

    const secs = Math.floor((totalMs / 1000) % 60);
    const mins = Math.floor((totalMs / (1000 * 60)) % 60);
    const hrs = Math.floor(totalMs / (1000 * 60 * 60));
    
    const formatted = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    if (document.getElementById('timerDisplay')) document.getElementById('timerDisplay').innerText = formatted;
    if (document.getElementById('homeTotalStudyTime')) document.getElementById('homeTotalStudyTime').innerText = formatted;
  }, 1000);
}

function saveProfile() {
  appState.profile.name = document.getElementById('profileName').value || "Öğrenci";
  appState.profile.field = document.getElementById('profileField').value;
  appState.profile.uni = document.getElementById('targetUni').value;
  appState.profile.dept = document.getElementById('targetDept').value;
  appState.profile.rank = document.getElementById('targetRank').value;

  saveAndRender();
  alert('Profil güncellendi!');
}

function renderAll() {
  document.getElementById('topbarUsername').innerText = appState.profile.name;
  document.getElementById('topbarTargetInfo').innerText = appState.profile.dept ? `${appState.profile.uni} ${appState.profile.dept}` : "Hedef Belirtilmedi";

  document.getElementById('profileName').value = appState.profile.name;
  document.getElementById('profileField').value = appState.profile.field;
  document.getElementById('targetUni').value = appState.profile.uni;
  document.getElementById('targetDept').value = appState.profile.dept;
  document.getElementById('targetRank').value = appState.profile.rank;

  // Planlar
  const total = appState.plans.length;
  const completed = appState.plans.filter(p => p.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const bar = document.getElementById('dailyProgressBar');
  bar.style.width = `${percent}%`;
  bar.innerText = `${percent}%`;

  const planHtml = appState.plans.map(p => `
    <div class="list-item">
      <span>${p.lesson} - ${p.hours} Saat</span>
      <input type="checkbox" ${p.completed ? 'checked' : ''} onchange="togglePlan(${p.id})" style="width:auto; margin:0;">
    </div>
  `).join('') || '<p style="font-size:12px; color:var(--text-muted);">Plan yok.</p>';

  document.getElementById('planList').innerHTML = planHtml;
  document.getElementById('homeTaskList').innerHTML = planHtml;

  // Soru Geçmişi
  document.getElementById('questionHistoryList').innerHTML = appState.questions.slice(-5).reverse().map(q => `
    <div class="list-item">
      <div><strong>${q.lesson}</strong> (${q.topic})</div>
      <div style="color:var(--success);">${q.d}D / ${q.y}Y / ${q.b}B</div>
    </div>
  `).join('') || '<p style="font-size:12px; color:var(--text-muted);">Kayıt yok.</p>';

  // Deneme Geçmişi
  document.getElementById('examHistoryList').innerHTML = appState.exams.slice(-5).reverse().map(e => `
    <div class="list-item">
      <div><strong>${e.title} (${e.cat.toUpperCase()})</strong></div>
      <div style="color:#818cf8; font-weight:bold;">${e.totalNet} Net</div>
    </div>
  `).join('') || '<p style="font-size:12px; color:var(--text-muted);">Deneme yok.</p>';

  renderChart();
}

function renderChart() {
  const canvas = document.getElementById('netChart');
  if (!canvas) return;

  if (netChart) netChart.destroy();

  netChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: appState.exams.length ? appState.exams.map(e => e.title) : ['Deneme Yok'],
      datasets: [{
        label: 'Netler',
        data: appState.exams.length ? appState.exams.map(e => e.totalNet) : [0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function saveToLocalStorage() { localStorage.setItem('yks_app_state', JSON.stringify(appState)); }
function loadFromLocalStorage() {
  const saved = localStorage.getItem('yks_app_state');
  if (saved) appState = JSON.parse(saved);
}
function saveAndRender() { saveToLocalStorage(); renderAll(); }
