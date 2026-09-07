let netChart = null;
let timerInterval = null;
let timerSeconds = 0;

document.addEventListener('DOMContentLoaded', () => {
  initChart();
});

// Sayfa Geçiş Fonksiyonu
function switchPage(pageId, btnElement) {
  // Tüm sayfaları gizle
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  
  // Seçilen sayfayı aç
  const selectedPage = document.getElementById(`page-${pageId}`);
  if (selectedPage) selectedPage.classList.remove('hidden');

  // Buton renklerini güncelle
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
}

// Grafik
function initChart() {
  const ctx = document.getElementById('netChart');
  if (!ctx) return;
  netChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Deneme 1', 'Deneme 2', 'Deneme 3'],
      datasets: [{ label: 'TYT Net', data: [60, 68, 75], borderColor: '#4f46e5', tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function switchExamTab(type, btn) {
  document.querySelectorAll('#page-deneme .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function addExamNet() {
  const name = document.getElementById('examNameInput').value;
  const net = document.getElementById('examNetInput').value;
  if (!name || !net) return alert('Lütfen bilgileri doldurun!');
  alert(`Deneme Kaydedildi: ${name} (${net} Net)`);
}

function uploadWrongQuestion() { alert('Soru başarıyla yüklendi!'); }

// Kronometre
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds++;
    const hrs = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    document.getElementById('timerDisplay').innerText = `${hrs}:${mins}:${secs}`;
  }, 1000);
}
function stopTimer() { clearInterval(timerInterval); timerInterval = null; }
function resetTimer() { stopTimer(); timerSeconds = 0; document.getElementById('timerDisplay').innerText = "00:00:00"; }
