// Supabase İstemci Kurulumu
const SUPABASE_URL = 'https://YOUR_SUPABASE_URL.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;
if (typeof window.supabase !== 'undefined') {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Global Uygulama Durumu (State)
let currentUser = null;
let timerInterval = null;
let timerSeconds = 25 * 60;
let isTimerRunning = false;
let activeSubject = 'Matematik';

// DOM Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupFormAutoCalculations();
});

// Soru ekleme formunda doğru/yanlış/boş girildiğinde qTotal alanını otomatik hesaplar
function setupFormAutoCalculations() {
  const ids = ['qCorrect', 'qWrong', 'qBlank'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', calculateTotalQuestions);
    }
  });
}

function calculateTotalQuestions() {
  const c = Number(document.getElementById('qCorrect')?.value) || 0;
  const w = Number(document.getElementById('qWrong')?.value) || 0;
  const b = Number(document.getElementById('qBlank')?.value) || 0;
  const totalInput = document.getElementById('qTotal');
  if (totalInput) {
    totalInput.value = c + w + b;
  }
}

async function initApp() {
  if (!supabase) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    showMainApp();
  } else {
    showAuth();
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      showMainApp();
    } else {
      currentUser = null;
      showAuth();
    }
  });
}

// Görünüm Geçişleri
function showAuth() {
  document.getElementById('authSection')?.classList.remove('hidden');
  document.getElementById('mainSection')?.classList.add('hidden');
  document.getElementById('bottomNav')?.classList.add('hidden');
}

function showMainApp() {
  document.getElementById('authSection')?.classList.add('hidden');
  document.getElementById('mainSection')?.classList.remove('hidden');
  document.getElementById('bottomNav')?.classList.remove('hidden');

  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.email.split('@')[0];
    document.getElementById('userAvatar').textContent = currentUser.email[0].toUpperCase();
  }

  loadDashboardData();
}

// Sekme Değiştirme
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const targetTab = document.getElementById(tabId + 'Tab');
  if (targetTab) targetTab.classList.remove('hidden');

  const activeBtn = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'plan') loadDailyPlan();
  if (tabId === 'stats') loadStats();
}

// Kimlik Doğrulama İşlemleri
async function handleLogin() {
  const email = document.getElementById('authEmail').value;
  const pass = document.getElementById('authPassword').value;

  if (!email || !pass) return alert('E-posta ve şifre giriniz.');

  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) alert('Giriş Hatası: ' + error.message);
}

async function handleSignUp() {
  const email = document.getElementById('authEmail').value;
  const pass = document.getElementById('authPassword').value;

  if (!email || !pass) return alert('E-posta ve şifre giriniz.');

  const { error } = await supabase.auth.signUp({ email, password: pass });
  if (error) alert('Kayıt Hatası: ' + error.message);
  else alert('Kayıt başarılı! Giriş yapabilirsiniz.');
}

async function handleLogout() {
  await supabase.auth.signOut();
}

// Pomodoro Sayaç Mantığı
function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      isTimerRunning = false;
      alert('Süre doldu! Mola vakti.');
      saveStudySession();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
}

function resetTimer() {
  pauseTimer();
  timerSeconds = 25 * 60;
  updateTimerDisplay();
}

function setTimerMinutes(mins) {
  pauseTimer();
  timerSeconds = mins * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = `${m}:${s}`;
}

async function saveStudySession() {
  if (!currentUser) return;
  await supabase.from('study_sessions').insert({
    user_id: currentUser.id,
    duration_minutes: 25,
    subject: activeSubject
  });
  loadDashboardData();
}

// Soru & Deneme Kayıt
async function addQuestion() {
  if (!currentUser) return;

  const subject = document.getElementById('qSubject').value;
  const topic = document.getElementById('qTopic').value;
  const correct = Number(document.getElementById('qCorrect').value) || 0;
  const wrong = Number(document.getElementById('qWrong').value) || 0;
  const blank = Number(document.getElementById('qBlank').value) || 0;
  let total = Number(document.getElementById('qTotal').value) || 0;

  if (total === 0) total = correct + wrong + blank;

  if (correct + wrong + blank > total) {
    return alert('Doğru + Yanlış + Boş sayısı toplam sorudan büyük olamaz!');
  }

  const { error } = await supabase.from('questions').insert({
    user_id: currentUser.id,
    subject,
    topic,
    total_questions: total,
    correct_count: correct,
    wrong_count: wrong,
    blank_count: blank
  });

  if (error) alert('Hata: ' + error.message);
  else {
    alert('Soru verisi eklendi!');
    document.getElementById('qTopic').value = '';
    document.getElementById('qCorrect').value = '';
    document.getElementById('qWrong').value = '';
    document.getElementById('qBlank').value = '';
    document.getElementById('qTotal').value = '';
    loadDashboardData();
  }
}

async function addExam() {
  if (!currentUser) return;

  const name = document.getElementById('examName').value;
  const turk = Number(document.getElementById('examTurkish').value) || 0;
  const math = Number(document.getElementById('examMath').value) || 0;
  const sci = Number(document.getElementById('examScience').value) || 0;
  const soc = Number(document.getElementById('examSocial').value) || 0;

  const totalNet = turk + math + sci + soc;

  const { error } = await supabase.from('exams').insert({
    user_id: currentUser.id,
    exam_name: name,
    turkish_net: turk,
    math_net: math,
    science_net: sci,
    social_net: soc,
    total_net: totalNet
  });

  if (error) alert('Hata: ' + error.message);
  else {
    alert('Deneme sonucu eklendi!');
    document.getElementById('examName').value = '';
    loadDashboardData();
  }
}

// Akıllı Günlük Plan Algoritması
async function loadDailyPlan() {
  if (!currentUser) return;

  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_plans')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('plan_date', today);

  if (error) return console.error(error);

  if (!data || data.length === 0) {
    await createTodayPlanIfNeeded(today);
  } else {
    renderPlanItems(data);
  }
}

async function createTodayPlanIfNeeded(dateStr) {
  const wakeTime = document.getElementById('wakeTime')?.value || "08:00";
  const sleepTime = document.getElementById('sleepTime')?.value || "23:00";

  let startMinutes = timeToMinutes(wakeTime);
  const endMinutes = timeToMinutes(sleepTime);

  const defaultTasks = [
    { title: 'Matematik - Problem Çözümü', duration: 60, type: 'study' },
    { title: 'Paragraf Rutini', duration: 30, type: 'study' },
    { title: 'Dinlenme & Mola', duration: 30, type: 'break' },
    { title: 'Fen Bilimleri - Konu Özet', duration: 45, type: 'study' },
    { title: 'Deneme Analizi / Yanlış Tekrarı', duration: 45, type: 'study' }
  ];

  const planInserts = [];

  for (const task of defaultTasks) {
    if (startMinutes + task.duration > endMinutes) break;

    const tStart = minutesToTime(startMinutes);
    const tEnd = minutesToTime(startMinutes + task.duration);

    planInserts.push({
      user_id: currentUser.id,
      plan_date: dateStr,
      time_slot: `${tStart} - ${tEnd}`,
      task_title: task.title,
      is_completed: false
    });

    startMinutes += task.duration + 15; // 15 dk mola
  }

  if (planInserts.length > 0) {
    await supabase.from('daily_plans').insert(planInserts);
    loadDailyPlan();
  }
}

async function refreshTodayPlan() {
  if (!currentUser) return;
  const today = new Date().toISOString().split('T')[0];
  await supabase.from('daily_plans').delete().eq('user_id', currentUser.id).eq('plan_date', today);
  await createTodayPlanIfNeeded(today);
}

function renderPlanItems(plans) {
  const container = document.getElementById('dailyPlanContainer');
  if (!container) return;

  container.innerHTML = '';
  plans.forEach(p => {
    const div = document.createElement('div');
    div.className = `plan-item ${p.is_completed ? 'done' : ''}`;
    div.innerHTML = `
      <div>
        <div class="plan-time">${p.time_slot}</div>
        <div class="plan-title">${p.task_title}</div>
      </div>
      <input type="checkbox" ${p.is_completed ? 'checked' : ''} onchange="togglePlan('${p.id}', this.checked)">
    `;
    container.appendChild(div);
  });
}

async function togglePlan(id, status) {
  await supabase.from('daily_plans').update({ is_completed: status }).eq('id', id);
  loadDailyPlan();
}

// Yardımcı Zaman Fonksiyonları
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const normalizedMins = (mins % 1440 + 1440) % 1440; // Gece yarısı taşmasını engeller
  const h = Math.floor(normalizedMins / 60).toString().padStart(2, '0');
  const m = (normalizedMins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// İstatistik & Dashboard Yükleme
async function loadDashboardData() {
  if (!currentUser) return;

  const { data: qData } = await supabase.from('questions').select('total_questions').eq('user_id', currentUser.id);
  const totalQ = qData ? qData.reduce((acc, curr) => acc + (curr.total_questions || 0), 0) : 0;
  
  const elQ = document.getElementById('dashTotalQuestions');
  if (elQ) elQ.textContent = totalQ;

  const { data: eData } = await supabase.from('exams').select('total_net').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(1);
  const lastNet = (eData && eData.length > 0) ? eData[0].total_net : 0;
  
  const elN = document.getElementById('dashLastNet');
  if (elN) elN.textContent = lastNet;
}

async function loadStats() {
  loadDashboardData();
}
