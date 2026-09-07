// 1. Supabase Başlatma
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let chartInstance = null;

// Tema Geçişi
function toggleTheme() {
  document.body.classList.toggle('dark');
}

// Sayfa Navigasyonu
function switchPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById('page-' + pageId).classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (pageId === 'deneme') {
    loadExamData('tyt');
  } else if (pageId === 'koc') {
    fetchAssignments();
  }
}

// 2. SUPABASE: Deneme Netlerini Çekme ve Grafiğe Basma
async function loadExamData(examType = 'tyt') {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('type', examType)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Denemeler çekilemedi:', error.message);
    return;
  }

  const labels = data.map(item => item.name);
  const netScores = data.map(item => item.net_score);

  renderChart(labels, netScores);
}

function renderChart(labels, scores) {
  const canvas = document.getElementById('netChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['Deneme 1', 'Deneme 2'],
      datasets: [{
        label: 'Net İlerlemesi',
        data: scores.length ? scores : [0, 0],
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

// Deneme Sekmeleri Geçişi (TYT | AYT | YDT)
function switchExamTab(type, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadExamData(type);
}

// 3. SUPABASE: Yeni Deneme Neti Kaydetme
async function addExamNet() {
  const type = document.getElementById('examType').value;
  const name = document.querySelector('input[placeholder*="Deneme Adı"]').value;
  const net = parseFloat(document.querySelector('input[placeholder*="Net Sayısı"]').value);

  if (!name || isNaN(net)) {
    alert('Lütfen deneme adını ve net sayısını tam girin.');
    return;
  }

  const { error } = await supabase
    .from('exams')
    .insert([{ type, name, net_score: net }]);

  if (error) {
    alert('Net kaydedilirken hata oluştu: ' + error.message);
  } else {
    alert('Deneme neti başarıyla eklendi!');
    loadExamData(type);
  }
}

// 4. SUPABASE: Koçun Ödev Ataması
async function createAssignment() {
  const type = document.querySelector('#page-koc select').value;
  const title = document.querySelector('input[placeholder*="Ödev Başlığı"]').value;
  const description = document.querySelector('textarea').value;

  if (!title || type === 'Ders Türü Seçin') {
    alert('Lütfen ders türünü ve ödev başlığını girin.');
    return;
  }

  const { error } = await supabase
    .from('assignments')
    .insert([{ exam_type: type, title, description, is_completed: false }]);

  if (error) {
    alert('Ödev atanamadı: ' + error.message);
  } else {
    alert('Ödev öğrenciye gönderildi!');
    fetchAssignments();
  }
}

// 5. SUPABASE: Ödevleri Listeleme
async function fetchAssignments() {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Ödevler alınamadı:', error.message);
    return;
  }

  // Burada gelen ödev verilerini HTML dinamik listesine dönüştürebilirsin.
  console.log('Gelen Ödevler:', data);
}
