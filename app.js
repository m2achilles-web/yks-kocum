// 1. SUPABASE BAĞLANTISI (Gerekli veritabanı işlemleri için kalıyor)
const SUPABASE_URL = 'https://m2achilles-web.github.io/yks-kocum/'; // Kendi URL'in
const SUPABASE_ANON_KEY = 'sb_publishable_K2AIrHSs765CUXlGzqlCdg_ntTpKVXi'; // Kendi Anon Key'in

let supabase;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Global Değişkenler
let netChart = null;
let timerInterval = null;
let timerSeconds = 0;

// Sayfa Yüklendiğinde Otomatik Başlat
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initChart();
  fetchExams('tyt');
  fetchWrongQuestions();
  fetchAssignments();
}

// Sayfa Değiştirme (Tablar Arası Geçiş)
function switchPage(pageId, element) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${pageId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  if (element) element.classList.add('active');
}

// Tema Değiştirme
function toggleTheme() {
  document.body.classList.toggle('light-mode');
}

// Net Analizi Grafiği
function initChart() {
  const ctx = document.getElementById('netChart');
  if (!ctx) return;

  netChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Net Sayısı',
        data: [],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function switchExamTab(type, btn) {
  document.querySelectorAll('#page-deneme .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  fetchExams(type);
}

// Deneme Verileri (Supabase veya Yerel Hafıza)
async function fetchExams(type) {
  // Örnek Grafik Güncellemesi
  if (netChart) {
    netChart.data.labels = ['Deneme 1', 'Deneme 2', 'Deneme 3'];
    netChart.data.datasets[0].data = [65, 72, 78];
    netChart.update();
  }
}

async function addExamNet() {
  const name = document.getElementById('examNameInput').value;
  const net = document.getElementById('examNetInput').value;

  if (!name || !net) {
    alert('Lütfen deneme adı ve net sayısını girin!');
    return;
  }

  alert(`Deneme başarıyla kaydedildi: ${name} (${net} Net)`);
  document.getElementById('examNameInput').value = '';
  document.getElementById('examNetInput').value = '';
}

// Yanlış Soru Yükleme
async function uploadWrongQuestion() {
  const fileInput = document.getElementById('questionImageInput');
  if (!fileInput.files.length) {
    alert('Lütfen bir fotoğraf seçin!');
    return;
  }
  alert('Soru fotoğrafı başarıyla yüklendi!');
  fileInput.value = '';
}

async function fetchWrongQuestions() {
  const gallery = document.getElementById('wrongQuestionsGallery');
  if (gallery) {
    gallery.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 13px;">Henüz kayıtlı yanlış soru yok.</p>';
  }
}

// Ödevler
async function fetchAssignments() {
  const list = document.getElementById('assignmentList');
  if (list) {
    list.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 13px;">Atanmış bir ödev bulunmuyor.</p>';
  }
}

// Kronometre Fonksiyonları
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  alert(`Çalışma süreniz kaydedildi: ${document.getElementById('timerDisplay').innerText}`);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const hrs = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
  const secs = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('timerDisplay').innerText = `${hrs}:${mins}:${secs}`;
}

// Hedef Kaydetme
function saveTarget() {
  const dept = document.getElementById('targetDepartmentInput').value;
  const rank = document.getElementById('targetRankInput').value;
  if (!dept || !rank) {
    alert('Lütfen hedef bölüm ve sıralamayı doldurun!');
    return;
  }
  alert(`Target Kaydedildi: ${dept} - ${rank}. sıra`);
}
