// Supabase İstemci Yapılandırması (Kendi URL ve Anon Key bilgilerini buraya eklediğinden emin ol)
const SUPABASE_URL = 'sb_publishable_K2AIrHSs765CUXlGzqlCdg_ntTpKVXi';
const SUPABASE_ANON_KEY = 'sb_publishable_K2AIrHSs765CUXlGzqlCdg_ntTpKVXi';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();

    // Giriş Formu Dinleyicisi
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert('Giriş Hatası: ' + error.message);
            } else {
                checkUserSession();
            }
        });
    }

    // Kayıt Formu Dinleyicisi
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: { role: 'student' }
                }
            });
            
            if (error) {
                alert('Kayıt Hatası: ' + error.message);
            } else {
                alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
                // Eğer otomatik oturum açılıyorsa checkUserSession çağrılabilir
            }
        });
    }

    // Çıkış Butonu
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
});

// Oturum ve Rol Kontrolü Fonksiyonu
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();

    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (!session) {
        if (authContainer) authContainer.style.display = 'block';
        if (appContainer) appContainer.style.display = 'none';
        return;
    }

    // Kullanıcı oturum açtıysa arayüzü değiştir
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    // Profiles tablosundan kullanıcının rolünü çekelim
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error('Profil bilgisi çekilemedi:', error.message);
        return;
    }

    const userRole = profile ? profile.role : 'student';

    // Role göre panelleri yönet
    const coachPanel = document.getElementById('coach-panel');
    const studentPanel = document.getElementById('student-panel');

    if (userRole === 'coach') {
        if (coachPanel) coachPanel.style.display = 'block';
        if (studentPanel) studentPanel.style.display = 'none';
        loadCoachDashboard();
    } else {
        if (coachPanel) coachPanel.style.display = 'none';
        if (studentPanel) studentPanel.style.display = 'block';
        loadStudentDashboard(session.user.id);
    }
}

// Koç Paneli Verilerini Yükleme (Öğrenci Listesi)
async function loadCoachDashboard() {
    const studentListEl = document.getElementById('student-list');
    if (!studentListEl) return;

    studentListEl.innerHTML = '<li>Öğrenciler yükleniyor...</li>';

    // Sadece rolü student olanları çekiyoruz
    const { data: students, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

    if (error) {
        studentListEl.innerHTML = `<li>Hata: ${error.message}</li>`;
        return;
    }

    if.students = students || [];
    if (students.length === 0) {
        studentListEl.innerHTML = '<li>Kayıtlı öğrenci bulunmuyor.</li>';
        return;
    }

    studentListEl.innerHTML = '';
    students.forEach(student => {
        const li = document.createElement('li');
        li.textContent = `Öğrenci ID: ${student.id} (Rol: ${student.role})`;
        studentListEl.appendChild(li);
    });
}

// Öğrenci Paneli Verilerini Yükleme
async function loadStudentDashboard(userId) {
    const studentInfoEl = document.getElementById('student-info');
    if (studentInfoEl) {
        studentInfoEl.textContent = `Hoş geldin! Kullanıcı ID: ${userId}`;
    }
}
