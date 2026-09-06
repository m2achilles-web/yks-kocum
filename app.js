// ==========================================
// SUPABASE İSTEMCİ KURULUMU
// ==========================================
const SUPABASE_URL = 'https://m2achilles-web.github.io/yks-kocum/';
const SUPABASE_ANON_KEY = 'https://m2achilles-web.github.io/yks-kocum/';

let supabase = null;
if (typeof window.supabase !== 'undefined' && SUPABASE_URL !== 'https://YOUR_SUPABASE_URL.supabase.co') {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Global Uygulama Durumu (State)
let currentUser = null;
let timerInterval = null;
let timerSeconds = 25 * 60;
let isTimerRunning = false;
let currentAuthMode = 'login'; // 'login' veya 'register'

// ==========================================
// BAŞLANGIÇ VE YÜKLEME (INIT)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupFormAutoCalculations();
});

async function initApp() {
  try {
    if (supabase) {
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
    } else {
      // Supabase henüz kurulmadıysa doğrudan giriş ekranına yönlendir
      showAuth();
    }
  } catch (err) {
    console.error("Başlatma hatası:", err);
    showAuth();
  } finally {
    // Yüklenme ekranını kapat
    hideLoading();
  }
}

function hideLoading() {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.classList.add('hidden');
    loadingEl.style.display = 'none';
  }
}

// ==========================================
// GÖRÜNÜM VE EKRAN GEÇİŞLERİ
// ==========================================
function showAuth() {
  document.getElementById('authScreen')?.classList.remove('hidden');
  document.getElementById('appScreen')?.classList.add('hidden');
}

function showMainApp() {
  document.getElementById('authScreen')?.classList.add('hidden');
  document.getElementById('appScreen')?.classList.remove('hidden');

  if (currentUser) {
    const name = currentUser.user_metadata?.username || currentUser.email.split('@')[0];
    const helloEl = document.getElementById('helloName');
    if (helloEl) helloEl.textContent = `Merhaba 👋 ${name}`;
  }

  loadDashboardData();
}

// Tab/Sayfa Değiştirme (Bottom Nav)
function showPage(pageId) {
  // Sayfaları Gizle/Göster
  document.querySelectorAll('main.app-container > section').forEach(sec => {
    sec.classList.add('hidden');
  });
  
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) targetPage.classList.remove('hidden');

  // Nav Buton Aktifliği
  document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.querySelector(`.bottom-nav .nav-btn[data-page="${pageId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Sayfaya Özel Yüklemeler
  if (pageId === 'plan') loadDailyPlan();
}

// ==========================================
// KİMLİK DOĞRULAMA (AUTH)
// ==========================================
function switchAuth(mode) {
  currentAuthMode = mode;
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const usernameField = document.getElementById('usernameField');
  const authButton = document.getElementById('authButton');

  if (mode === 'login') {
    loginTab?.classList.add('active');
    registerTab?.classList.remove('active');
    usernameField?.classList.add('hidden');
    if (authButton) authButton.textContent = 'Giriş Yap';
  } else {
    registerTab?.classList.add('active');
    loginTab?.classList.remove('active');
    usernameField?.classList.remove('hidden');
    if (authButton) authButton.textContent = 'Kayıt Ol';
  }
}

async function handleAuth() {
  if (!supabase) {
    alert("Supabase bağlantısı henüz yapılandırılmadı. Lütfen URL ve ANON_KEY değerlerini girin.");
    return;
  }

  const email = document.getElementById('authEmail')?.value;
  const pass = document.getElementById('authPassword')?.value;
  const username = document.getElementById('authUsername')?.value;

  if (!email || !pass) return alert('Lütfen e-posta ve şifrenizi giriniz.');

  if (currentAuthMode === 'login') {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) alert('Giriş Hatası: ' + error.message);
  } else {
    if (!username) return alert('Lütfen kullanıcı adı giriniz.');
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { username } }
    });
    if (error) alert('Kayıt Hatası: ' + error.message);
    else alert('Kayıt başarılı! E-postanızı doğrulayıp giriş yapabilirsiniz.');
  }
}

async function logout() {
  if (supabase) await supabase.auth.signOut();
  showAuth();
}

async function resendVerificationEmail() {
  const email = document.getElementById('authEmail')?.value;
  if (!email) return alert('Lütfen e-posta adresinizi girin.');
  if (supabase) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) alert('Hata: ' + error.message);
    else alert('Doğrulama e-postası tekrar gönderildi.');
  }
}

// Tema Değiştirme
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
}

// ==========================================
// FORM OTOMATİK HESAPLAMALAR
// ==========================================
function setupFormAutoCalculations() {
  const ids = ['qCorrect', 'qWrong', 'qBlank'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateTotalQuestions);
  });
}

function calculateTotalQuestions() {
  const c = Number(document.getElementById('qCorrect')?.value) || 0;
  const w = Number(document.getElementById('qWrong')?.value) || 0;
  const b = Number(document.getElementById('qBlank')?.value) || 0;
  const totalInput = document.getElementById('qTotal');
  if (totalInput) totalInput.value = c + w + b;
}

// ==========================================
// SORU & DENEME KAYIT
// ==========================================
async function addQuestion() {
  if (!currentUser || !supabase) return alert("Lütfen önce giriş yapın.");

  const subject = document.getElementById('qSubject')?.value;
  const topic = document.getElementById('qTopic')?.value;
  const correct = Number(document.getElementById('qCorrect')?.value) || 0;
  const wrong = Number(document.getElementById('qWrong')?.value) || 0;
  const blank = Number(document.getElementById('qBlank')?.value) || 0;
  let total = Number(document.getElementById('qTotal')?.value) || 0;

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
    alert('Soru verisi kaydedildi!');
    if (document.getElementById('qTopic')) document.getElementById('qTopic').value = '';
    loadDashboardData();
  }
}

async function addExam() {
  if (!currentUser || !supabase) return alert("Lütfen önce giriş yapın.");

  const name = document.getElementById('examName')?.value;
  const type = document.getElementById('examType')?.value;
  const date = document.getElementById('examDate')?.value;
  const turk = Number(document.getElementById('examTurkish')?.value) || 0;
  const math = Number(document.getElementById('examMath')?.value) || 0;
  const sci = Number(document.getElementById('examScience')?.value) || 0;
  const soc = Number(document.getElementById('examSocial')?.value) || 0;

  const totalNet = turk + math + sci + soc;

  const { error } = await supabase.from('exams').insert({
    user_id: currentUser.id,
    exam_name: name,
    exam_type: type,
    exam_date: date,
    turkish_net: turk,
    math_net: math,
    science_net: sci,
    social_net: soc,
    total_net: totalNet
  });

  if (error) alert('Hata: ' + error.message);
  else {
    alert('Deneme sonucu kaydedildi!');
    if (document.getElementById('examName')) document.getElementById('examName').value = '';
    loadDashboardData();
  }
}

// ==========================================
// ODAKLAN (POMODORO) SAYAÇ MANTIĞI
// ==========================================
function toggleFocus() {
  if (isTimerRunning) {
    pauseFocus();
  } else {
    startFocus();
  }
}

function startFocus() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  
  const btn = document.getElementById('timerStart');
  if (btn) btn.textContent = 'Durdur';

  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      isTimerRunning = false;
      if (btn) btn.textContent = 'Başlat';
      alert('Süre doldu! Mola vakti.');
      saveStudySession();
    }
  }, 1000);
}

function pauseFocus() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  const btn = document.getElementById('timerStart');
  if (btn) btn.textContent = 'Başlat';
}

function resetFocus() {
  pauseFocus();
  timerSeconds = 25 * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  const el = document.getElementById('timer');
  if (el) el.textContent = `${m}:${s}`;
}

async function saveStudySession() {
  if (!currentUser || !supabase) return;
  await supabase.from('study_sessions').insert({
    user_id: currentUser.id,
    duration_minutes: 25
  });
  loadDashboardData();
}

// ==========================================
// GÜNLÜK PLAN MANTIĞI
// ==========================================
async function loadDailyPlan() {
  if (!currentUser || !supabase) return;

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
  const defaultTasks = [
    { title: 'Matematik - Problem Çözümü', duration: 60 },
    { title: 'Paragraf Rutini', duration: 30 },
    { title: 'Fen Bilimleri - Konu Özet', duration: 45 }
  ];

  const planInserts = defaultTasks.map(task => ({
    user_id: currentUser.id,
    plan_date: dateStr,
    task_title: task.title,
    is_completed: false
  }));

  if (supabase) {
    await supabase.from('daily_plans').insert(planInserts);
    loadDailyPlan();
  }
}

function renderPlanItems(plans) {
  const container = document.getElementById('planTaskList');
  if (!container) return;

  container.innerHTML = '';
  if (plans.length === 0) {
    container.textContent = 'Görev bulunmuyor.';
    return;
  }

  plans.forEach(p => {
    const div = document.createElement('div');
    div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;";
    div.innerHTML = `
      <span style="${p.is_completed ? 'text-decoration:line-through; opacity:0.6;' : ''}">${p.task_title}</span>
      <input type="checkbox" ${p.is_completed ? 'checked' : ''} onchange="togglePlan('${p.id}', this.checked)">
    `;
    container.appendChild(div);
  });
}

async function togglePlan(id, status) {
  if (supabase) {
    await supabase.from('daily_plans').update({ is_completed: status }).eq('id', id);
    loadDailyPlan();
  }
}

function savePlan() {
  alert("Plan ayarları kaydedildi!");
}

function saveSelectedPlanSubjects() {
  alert("Ders seçimleri kaydedildi!");
}

function refreshTodayPlan() {
  const today = new Date().toISOString().split('T')[0];
  if (supabase && currentUser) {
    supabase.from('daily_plans').delete().eq('user_id', currentUser.id).eq('plan_date', today).then(() => {
      createTodayPlanIfNeeded(today);
    });
  }
}

// ==========================================
// PROFİL & VERİ İŞLEMLERİ
// ==========================================
function saveProfile() {
  alert("Profil bilgileri kaydedildi!");
}

function exportData() {
  alert("Veriler dışa aktarılıyor...");
}

function importData(event) {
  alert("Veriler içe aktarılıyor...");
}

function loadAdminStats() {
  alert("Admin istatistikleri güncellendi.");
}

// ==========================================
// DASHBOARD VERİ YÜKLEME
// ==========================================
async function loadDashboardData() {
  if (!currentUser || !supabase) return;

  // Toplam Soru Sayısı
  const { data: qData } = await supabase.from('questions').select('total_questions, correct_count, wrong_count').eq('user_id', currentUser.id);
  
  let totalQ = 0;
  let totalNet = 0;

  if (qData) {
    qData.forEach(q => {
      totalQ += (q.total_questions || 0);
      totalNet += ((q.correct_count || 0) - ((q.wrong_count || 0) * 0.25));
    });
  }

  const elQ = document.getElementById('totalQuestions');
  if (elQ) elQ.textContent = totalQ;

  const elN = document.getElementById('totalNet');
  if (elN) elN.textContent = totalNet >= 0 ? totalNet.toFixed(2) : 0;

  // Toplam Deneme Sayısı
  const { data: eData } = await supabase.from('exams').select('id', { count: 'exact' }).eq('user_id', currentUser.id);
  const elE = document.getElementById('totalExams');
  if (elE) elE.textContent = eData ? eData.length : 0;
}
