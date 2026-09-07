const SUPABASE_URL = 'https://m2achilles-web.github.io/yks-kocum/'; // Kendi URL'in
const SUPABASE_ANON_KEY = 'sb_publishable_K2AIrHSs765CUXlGzqlCdg_ntTpKVXi'; // Kendi Anon Key'in

let supabase;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  alert("Supabase kütüphanesi yüklenemedi! Bağlantınızı kontrol edin.");
}

let currentAuthTab = 'login';

function switchAuthTab(mode) {
  currentAuthTab = mode;
  const loginBtn = document.getElementById('tabLoginBtn');
  const registerBtn = document.getElementById('tabRegisterBtn');
  const extraFields = document.getElementById('registerExtraFields');
  const primaryBtn = document.getElementById('authPrimaryBtn');

  if (mode === 'register') {
    loginBtn.classList.remove('active');
    registerBtn.classList.add('active');
    extraFields.classList.remove('hidden');
    primaryBtn.innerText = 'Kayıt Ol';
  } else {
    registerBtn.classList.remove('active');
    loginBtn.classList.add('active');
    extraFields.classList.add('hidden');
    primaryBtn.innerText = 'Giriş Yap';
  }
}
