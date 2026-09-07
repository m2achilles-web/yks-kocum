// Supabase İstemci Yapılandırması
const SUPABASE_URL = 'https://wcjusyzrlnnbtwyjypnm.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_K2AIrHSs765CUXlGzqlCdg_ntTpKVXi';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sayfa tamamen yüklendiğinde çalıştır
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM yüklendi, script çalışıyor!");
    checkUserSession();

    // Giriş İşlemi
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            console.log("Giriş yapılıyor:", email);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert('Giriş Hatası: ' + error.message);
            } else {
                window.location.reload();
            }
        });
    } else {
        console.error("HATA: 'login-form' id'li form HTML'de bulunamadı!");
    }

    // Kayıt İşlemi
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            console.log("Kayıt olunuyor:", email);
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { role: 'student' } }
            });
            
            if (error) {
                alert('Kayıt Hatası: ' + error.message);
            } else {
                alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            }
        });
    } else {
        console.error("HATA: 'signup-form' id'li form HTML'de bulunamadı!");
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

// Oturum ve Rol Kontrolü
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();

    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (!session) {
        if (authContainer) authContainer.style.display = 'block';
        if (appContainer) appContainer.style.display = 'none';
        return;
    }

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error('Profil çekilemedi:', error.message);
        return;
    }

    const userRole = profile ? profile.role : 'student';
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

async function loadCoachDashboard() {
    const studentListEl = document.getElementById('student-list');
    if (!studentListEl) return;

    studentListEl.innerHTML = '<li>Öğrenciler yükleniyor...</li>';

    const { data: students, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

    if (error) {
        studentListEl.innerHTML = `<li>Hata: ${error.message}</li>`;
        return;
    }

    const studentList = students || [];
    if (studentList.length === 0) {
        studentListEl.innerHTML = '<li>Kayıtlı öğrenci bulunmuyor.</li>';
        return;
    }

    studentListEl.innerHTML = '';
    studentList.forEach(student => {
        const li = document.createElement('li');
        li.textContent = `Öğrenci ID: ${student.id}`;
        studentListEl.appendChild(li);
    });
}

async function loadStudentDashboard(userId) {
    const studentInfoEl = document.getElementById('student-info');
    if (studentInfoEl) {
        studentInfoEl.textContent = `Hoş geldin! ID: ${userId}`;
    }
}
