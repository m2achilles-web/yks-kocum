const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let userRole = 'student'; // 'student' veya 'coach'
let isSignUpMode = false;

let chartInstance = null;
let timerInterval = null;
let seconds = 0;

// SAYFA YÜKLENİRKEN AUTH KONTROLÜ
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await fetchUserProfile();
  }
});

// AUTH İŞLEMLERİ (Giriş / Kayıt Modu Değişimi)
function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  document.getElementById('authTitle').innerText = isSignUpMode ? 'Kayıt Ol' : 'Giriş Yap';
  document.getElementById('authPrimaryBtn').innerText = isSignUpMode ? 'Kayıt Ol' : 'Giriş Yap';
  document.getElementById('authToggleText').innerHTML = isSignUpMode ? 'Zaten hesabın var mı? **Giriş Yap**' : 'Hesabın yok mu? **Kayıt Ol**';
  document.getElementById('roleSelectGroup').classList.toggle('hidden', !isSignUpMode);
}

async function handleAuth() {
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;

  if (!email || !password) return alert('E-posta ve şifre giriniz.');

  if (isSignUpMode) {
    const role = document.getElementById('authRole').value;
    const fullName = document.getElementById('authName').value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: role } }
    });

    if (error) return alert('Kayıt Hatası: ' + error.message);
    
    // Profiles tablosuna kullanıcı bilgisi yaz
    if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, full_name: fullName, role: role }]);
    }
    alert('Kayıt başarılı! Giriş yapabilirsiniz.');
    toggleAuthMode();

  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('Giriş Hatası: ' + error.message);
    currentUser = data.user;
    await fetchUserProfile();
  }
}

async function fetchUserProfile() {
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
  
  userRole = data ? data.role : (currentUser.user_metadata.role || 'student');
  
  // UI Düzenlemeleri
  document.getElementById('authOverlay').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.getElementById('bottomNav').classList.remove('hidden');

  const roleBadge = document.getElementById('roleBadge');
  roleBadge.innerText = userRole === 'coach' ? 'KOÇ' : 'ÖĞRENCİ';

  if (userRole === 'coach') {
    document.getElementById('adminPanelCard').classList.remove('hidden');
    document.getElementById('coachAnalyticsCard').classList.remove('hidden');
    document.getElementById('studentTargetCard').classList.add('hidden');
    loadStudentsList();
  } else {
    document.getElementById('adminPanelCard').classList.add('hidden');
    document.getElementById('coachAnalyticsCard').classList.add('hidden');
    document.getElementById('studentTargetCard').classList.remove('hidden');
  }

  fetchAssignments();
}

async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}

function switchPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + pageId).classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (pageId === 'deneme') loadExamData('tyt');
  if (pageId === 'koc') fetchAssignments();
  if (pageId === 'yanlis') fetchWrongQuestions();
}

// DENEME NETLERİ
async function loadExamData(examType = 'tyt') {
  const { data } = await supabase.from('exams').select('*').eq('user_id', currentUser.id).eq('type', examType).order('created_at', { ascending: true });
  const labels = data ? data.map(item => item.name) : [];
  const scores = data ? data.map(item => item.net_score) : [];
  renderChart(labels, scores);
}

function renderChart(labels, scores) {
  const canvas = document.getElementById('netChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Henüz Veri Yok'],
      datasets: [{ label: 'Net', data: scores.length ? scores : [0], borderColor: '#4f46e5', fill: true }]
    }
  });
}

function switchExamTab(type, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadExamData(type);
}

async function addExamNet() {
  const type = document.getElementById('examType').value;
  const name = document.getElementById('examNameInput').value;
  const net = parseFloat(document.getElementById('examNetInput').value);

  if (!name || isNaN(net)) return alert('Eksiksiz girin.');

  await supabase.from('exams').insert([{ user_id: currentUser.id, type, name, net_score: net }]);
  document.getElementById('examNameInput').value = '';
  document.getElementById('examNetInput').value = '';
  loadExamData(type);
}

// KOÇ ÖDEV ATAMA & ÖĞRENCİ SEÇİMİ
async function loadStudentsList() {
  const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
  const coachSelect = document.getElementById('coachStudentSelect');
  const assignSelect = document.getElementById('selectStudentForAssignment');

  coachSelect.innerHTML = '<option value="">Öğrenci Seçin...</option>';
  assignSelect.innerHTML = '<option value="">Öğrenci Seçin...</option>';

  if (data) {
    data.forEach(s => {
      const opt = `<option value="${s.id}">${s.full_name || s.id}</option>`;
      coachSelect.innerHTML += opt;
      assignSelect.innerHTML += opt;
    });
  }
}

async function createAssignment() {
  const studentId = document.getElementById('selectStudentForAssignment').value;
  const type = document.getElementById('assignmentTypeSelect').value;
  const title = document.getElementById('assignmentTitleInput').value;
  const description = document.getElementById('assignmentDescInput').value;

  if (!studentId || !title) return alert('Öğrenci ve başlık zorunludur.');

  await supabase.from('assignments').insert([{ student_id: studentId, coach_id: currentUser.id, exam_type: type, title, description, is_completed: false }]);
  alert('Ödev atandı!');
  document.getElementById('assignmentTitleInput').value = '';
  document.getElementById('assignmentDescInput').value = '';
}

async function fetchAssignments() {
  let query = supabase.from('assignments').select('*');
  if (userRole === 'student') query = query.eq('student_id', currentUser.id);

  const { data } = await query;
  const list = document.getElementById('assignmentList');
  const homeList = document.getElementById('homeTaskList');
  list.innerHTML = '';
  if (homeList) homeList.innerHTML = '';

  if (!data || data.length === 0) {
    list.innerHTML = '<p style="font-size:12px; color:var(--muted);">Atanmış ödev bulunmuyor.</p>';
    if (homeList) homeList.innerHTML = '<p style="font-size:12px; color:var(--muted);">Henüz bir göreviniz yok.</p>';
    return;
  }

  data.forEach(item => {
    const html = `
      <div class="item-row">
        <div>
          <strong>${item.title}</strong>
          <div style="font-size:12px; color:var(--muted);">${item.description || ''}</div>
        </div>
        ${userRole === 'student' ? `<button class="icon-btn" onclick="completeAssignment(${item.id})">${item.is_completed ? '✅ Tamamlandı' : 'Tamamla'}</button>` : ''}
      </div>
    `;
    list.innerHTML += html;
    if (homeList && !item.is_completed) homeList.innerHTML += html;
  });
}

async function completeAssignment(id) {
  await supabase.from('assignments').update({ is_completed: true }).eq('id', id);
  fetchAssignments();
}

// ÖĞRENCİ İLERLEME TAKİBİ (Sadece Koç)
async function loadStudentProgress(studentId) {
  if (!studentId) return;
  const { data } = await supabase.from('study_sessions').select('*').eq('user_id', studentId);

  let daily = 0, weekly = 0, monthly = 0;
  const now = new Date();

  if (data) {
    data.forEach(s => {
      const date = new Date(s.created_at);
      const diffDays = (now - date) / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) daily += s.duration_seconds;
      if (diffDays <= 7) weekly += s.duration_seconds;
      if (diffDays <= 30) monthly += s.duration_seconds;
    });
  }

  document.getElementById('dailyTime').innerText = `${Math.floor(daily/3600)} sa ${Math.floor((daily%3600)/60)} dk`;
  document.getElementById('weeklyTime').innerText = `${Math.floor(weekly/3600)} sa ${Math.floor((weekly%3600)/60)} dk`;
  document.getElementById('monthlyTime').innerText = `${Math.floor(monthly/3600)} sa ${Math.floor((monthly%3600)/60)} dk`;
}

// KRONOMETRE & SÜRE KAYDI
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => { seconds++; updateTimerDisplay(); }, 1000);
}

async function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;

  if (seconds > 0) {
    await supabase.from('study_sessions').insert([{ user_id: currentUser.id, duration_seconds: seconds }]);
    alert('Çalışma süreniz kaydedildi!');
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  seconds = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').innerText = `${hrs}:${mins}:${secs}`;
}

// ÖĞRENCİ HEDEF KAYDETME
async function saveTarget() {
  const department = document.getElementById('targetDepartmentInput').value;
  const rank = document.getElementById('targetRankInput').value;

  await supabase.from('profiles').update({ target_department: department, target_rank: rank }).eq('id', currentUser.id);
  alert('Hedefleriniz kaydedildi!');
}

// YANLIŞ KUTUSU
async function uploadWrongQuestion() {
  const fileInput = document.getElementById('questionImageInput');
  const lesson = document.getElementById('wrongQuestionLesson').value;
  const file = fileInput.files[0];
  if (!file) return alert('Dosya seçin.');

  const fileName = `${Date.now()}_${file.name}`;
  await supabase.storage.from('question-images').upload(fileName, file);
  const { data } = supabase.storage.from('question-images').getPublicUrl(fileName);

  await supabase.from('wrong_questions').insert([{ user_id: currentUser.id, lesson, image_url: data.publicUrl }]);
  fileInput.value = '';
  fetchWrongQuestions();
}

async function fetchWrongQuestions() {
  const { data } = await supabase.from('wrong_questions').select('*').eq('user_id', currentUser.id);
  const gallery = document.getElementById('wrongQuestionsGallery');
  gallery.innerHTML = '';
  if (data) {
    data.forEach(item => {
      gallery.innerHTML += `<div class="gallery-item"><img src="${item.image_url}"></div>`;
    });
  }
}
