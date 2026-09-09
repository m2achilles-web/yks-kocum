/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
  "https://wcjusyzrlnnbtwyjypnm.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_K2AIrHSs765CUXlGzqlCdg_ntTpKVXi";

const SITE_URL =
  "https://m2achilles-web.github.io/yks-kocum/";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );


/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null;
let currentRole = "user";
let currentAuthMode = "login";

let profile = null;

let questions = [];
let exams = [];
let wrongs = [];
let topics = {};
let studySessions = [];
let dailyPlan = null;
let badges = [];

let focusSeconds = 1500;
let focusRunning = false;
let focusInterval = null;


/*
  Yeni:
  Kullanıcının seçtiği plan dersleri
*/

let selectedPlanSubjects = [];


const today = () =>
  new Date().toISOString().slice(0,10);


/* =====================================================
   DEFAULT PROFILE
===================================================== */

const DEFAULT_PROFILE = {

  username: "Öğrenci",

  field: "Sayısal",

  exam_date: "",

  university: "",

  department: "",

  target_rank: "",

  daily_hours: 4,

  daily_questions: 100,

  daily_topics: 2

};


/* =====================================================
   SUBJECTS
===================================================== */

const SUBJECTS = [

  "TYT Türkçe",
  "TYT Matematik",
  "TYT Fen",
  "TYT Sosyal",

  "AYT Matematik",
  "AYT Fizik",
  "AYT Kimya",
  "AYT Biyoloji",

  "AYT Edebiyat",
  "AYT Tarih",
  "AYT Coğrafya"

];


/* =====================================================
   DEFAULT PLAN SUBJECTS
===================================================== */

const DEFAULT_PLAN_SUBJECTS = [

  "TYT Matematik",
  "TYT Türkçe"

];


/* =====================================================
   BADGES
===================================================== */

const BADGE_DEFINITIONS = [

  {
    key:"first",
    icon:"🎯",
    name:"İlk Adım",
    description:"İlk soru kaydını oluştur."
  },

  {
    key:"q100",
    icon:"💯",
    name:"100 Soru",
    description:"Toplam 100 soru çöz."
  },

  {
    key:"q500",
    icon:"🔥",
    name:"500 Soru",
    description:"Toplam 500 soru çöz."
  },

  {
    key:"q1000",
    icon:"🚀",
    name:"1000 Soru",
    description:"Toplam 1000 soru çöz."
  },

  {
    key:"exam",
    icon:"📊",
    name:"İlk Deneme",
    description:"İlk denemeni kaydet."
  },

  {
    key:"streak7",
    icon:"⚡",
    name:"7 Gün Seri",
    description:"7 gün çalışma serisine ulaş."
  },

  {
    key:"topics25",
    icon:"📚",
    name:"25 Konu",
    description:"25 konuyu tamamla."
  },

  {
    key:"net100",
    icon:"🏆",
    name:"100 Net",
    description:"Bir denemede 100 nete ulaş."
  }

];


/* =====================================================
   PLAN SUBJECT LOCAL KEY
===================================================== */

function planSubjectsKey(){

  if(!currentUser)
    return "yksKocumV6_plan_subjects";

  return (
    "yksKocumV6_plan_subjects_" +
    currentUser.id
  );

}


/* =====================================================
   LOAD PLAN SUBJECTS
===================================================== */

function loadPlanSubjects(){

  let loaded = null;

  /*
    Önce günlük planın subjects alanına bak.
  */

  if(
    dailyPlan &&
    Array.isArray(
      dailyPlan.subjects
    ) &&
    dailyPlan.subjects.length
  ){

    loaded =
      dailyPlan.subjects;

  }


  /*
    Sonra localStorage'a bak.
  */

  if(!loaded){

    try{

      const raw =
        localStorage.getItem(
          planSubjectsKey()
        );

      if(raw){

        const parsed =
          JSON.parse(raw);

        if(
          Array.isArray(parsed) &&
          parsed.length
        ){

          loaded = parsed;

        }

      }

    }catch(error){

      console.warn(
        "Plan dersleri okunamadı:",
        error
      );

    }

  }


  /*
    Hiçbir şey yoksa varsayılan dersler.
  */

  selectedPlanSubjects =
    loaded
      ? loaded.filter(
          subject =>
            SUBJECTS.includes(
              subject
            )
        )
      : [...DEFAULT_PLAN_SUBJECTS];


  if(!selectedPlanSubjects.length){

    selectedPlanSubjects =
      [...DEFAULT_PLAN_SUBJECTS];

  }

}


/* =====================================================
   SAVE PLAN SUBJECTS LOCAL
===================================================== */

function savePlanSubjectsLocal(){

  try{

    localStorage.setItem(
      planSubjectsKey(),
      JSON.stringify(
        selectedPlanSubjects
      )
    );

  }catch(error){

    console.warn(
      "Plan dersleri kaydedilemedi:",
      error
    );

  }

}


/* =====================================================
   LOCAL CACHE
===================================================== */

function localKey(name){

  return "yksKocumV6_" + name;

}


function saveLocal(){

  try{

    localStorage.setItem(
      localKey("cache"),
      JSON.stringify({

        profile,
        questions,
        exams,
        wrongs,
        topics,
        studySessions,
        dailyPlan,
        badges,
        selectedPlanSubjects

      })
    );

  }catch(e){}

}


function loadLocal(){

  try{

    const raw =
      localStorage.getItem(
        localKey("cache")
      );

    if(!raw)
      return;

    const data =
      JSON.parse(raw);

    profile =
      data.profile || null;

    questions =
      data.questions || [];

    exams =
      data.exams || [];

    wrongs =
      data.wrongs || [];

    topics =
      data.topics || {};

    studySessions =
      data.studySessions || [];

    dailyPlan =
      data.dailyPlan || null;

    badges =
      data.badges || [];

    if(
      Array.isArray(
        data.selectedPlanSubjects
      )
    ){

      selectedPlanSubjects =
        data.selectedPlanSubjects;

    }

  }catch(e){

    console.error(e);

  }

}


/* =====================================================
   AUTH UI
===================================================== */

function switchAuth(mode){

  currentAuthMode = mode;

  document
    .getElementById("loginTab")
    .classList
    .toggle(
      "active",
      mode === "login"
    );

  document
    .getElementById("registerTab")
    .classList
    .toggle(
      "active",
      mode === "register"
    );

  document
    .getElementById("usernameField")
    .classList
    .toggle(
      "hidden",
      mode !== "register"
    );

  document
    .getElementById("authButton")
    .textContent =
      mode === "register"
        ? "Kayıt Ol"
        : "Giriş Yap";

  document
    .getElementById("resendBox")
    .classList
    .toggle(
      "hidden",
      mode !== "register"
    );

  document
    .getElementById("authMessage")
    .classList
    .add("hidden");

}


function showAuthMessage(message){

  const el =
    document.getElementById(
      "authMessage"
    );

  el.textContent =
    message;

  el.classList.remove(
    "hidden"
  );

}


/* =====================================================
   RESEND VERIFICATION EMAIL
===================================================== */

async function resendVerificationEmail(){

  const email =
    document
      .getElementById("authEmail")
      .value
      .trim();

  if(!email){

    showAuthMessage(
      "Önce e-posta adresini yaz kankam."
    );

    return;

  }

  const button =
    document.getElementById(
      "resendEmailBtn"
    );

  button.disabled = true;

  button.textContent =
    "📨 Gönderiliyor...";

  try{

    const {
      error
    } =
      await supabaseClient.auth.resend({

        type:"signup",

        email:email,

        options:{
          emailRedirectTo:SITE_URL
        }

      });

    if(error)
      throw error;

    showAuthMessage(
      "✅ Doğrulama e-postası tekrar gönderildi. Gelen kutunu ve Spam/Gereksiz klasörünü kontrol et."
    );

    toast(
      "Doğrulama maili tekrar gönderildi 📩"
    );

  }catch(error){

    console.error(error);

    showAuthMessage(
      "❌ Mail tekrar gönderilemedi: " +
      (
        error?.message ||
        "Bilinmeyen hata"
      )
    );

  }finally{

    button.disabled = false;

    button.textContent =
      "📩 Doğrulama e-postasını tekrar gönder";

  }

}


/* =====================================================
   AUTH
===================================================== */

async function handleAuth(){

  const email =
    document
      .getElementById("authEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("authPassword")
      .value;

  const username =
    document
      .getElementById("authUsername")
      .value
      .trim();

  if(!email || !password){

    showAuthMessage(
      "E-posta ve şifre gerekli."
    );

    return;

  }

  if(password.length < 6){

    showAuthMessage(
      "Şifre en az 6 karakter olmalı."
    );

    return;

  }

  const button =
    document.getElementById(
      "authButton"
    );

  button.disabled = true;

  button.textContent =
    "Bekleyin...";

  try{

    if(
      currentAuthMode ===
      "register"
    ){

      if(!username){

        showAuthMessage(
          "Kullanıcı adı gir."
        );

        button.disabled = false;

        button.textContent =
          "Kayıt Ol";

        return;

      }

      const result =
        await supabaseClient.auth.signUp({

          email,

          password,

          options:{

            emailRedirectTo:
              SITE_URL,

            data:{
              username
            }

          }

        });

      if(result.error)
        throw result.error;

      showAuthMessage(
        "Kayıt başarılı! 📩 E-posta adresine doğrulama bağlantısı gönderildi. Mail gelmezse aşağıdaki butondan tekrar gönderebilirsin."
      );

      document
        .getElementById("resendBox")
        .classList
        .remove("hidden");

      button.textContent =
        "E-posta Gönderildi";

    }else{

      const result =
        await supabaseClient.auth.signInWithPassword({

          email,

          password

        });

      if(result.error)
        throw result.error;

      currentUser =
        result.data.user;

      await bootApp();

    }

  }catch(error){

    console.error(error);

    showAuthMessage(
      getFriendlyAuthError(error)
    );

  }finally{

    if(
      currentAuthMode ===
      "login"
    ){

      button.disabled = false;

      button.textContent =
        "Giriş Yap";

    }

  }

}


function getFriendlyAuthError(error){

  const message =
    error?.message || "";

  const lower =
    message.toLowerCase();

  if(
    lower.includes(
      "email not confirmed"
    )
  ){

    document
      .getElementById("resendBox")
      .classList
      .remove("hidden");

    return "E-posta adresin henüz doğrulanmamış. Doğrulama mailini tekrar gönderebilirsin.";

  }

  if(
    lower.includes(
      "invalid login credentials"
    )
  ){

    return "E-posta veya şifre hatalı.";

  }

  if(
    lower.includes(
      "user already registered"
    )
  ){

    document
      .getElementById("resendBox")
      .classList
      .remove("hidden");

    return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene veya doğrulama mailini tekrar gönder.";

  }

  return (
    message ||
    "Bir hata oluştu."
  );

}


/* =====================================================
   LOGOUT
===================================================== */

async function logout(){

  await supabaseClient.auth.signOut();

  currentUser = null;

  currentRole = "user";

  selectedPlanSubjects = [];

  document
    .getElementById("appScreen")
    .classList
    .add("hidden");

  document
    .getElementById("authScreen")
    .classList
    .remove("hidden");

  document
    .getElementById("adminBadge")
    .classList
    .add("hidden");

  document
    .getElementById("adminSection")
    .classList
    .add("hidden");

  switchAuth("login");

}


/* =====================================================
   PROFILE
===================================================== */

async function loadProfile(){

  if(!currentUser)
    return;

  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();

  if(error)
    console.error(error);

  if(data){

    profile = data;

  }else{

    profile = {

      id:
        currentUser.id,

      ...DEFAULT_PROFILE

    };

    const {
      error:insertError
    } =
      await supabaseClient
        .from("profiles")
        .upsert(profile);

    if(insertError)
      console.error(
        insertError
      );

  }

  fillProfileUI();

}


function fillProfileUI(){

  profile =
    Object.assign(
      {},
      DEFAULT_PROFILE,
      profile || {}
    );

  document.getElementById(
    "helloName"
  ).textContent =
    "Merhaba, " +
    (
      profile.username ||
      "Öğrenci"
    ) +
    " 👋";

  updateAdminBadge();

  document.getElementById(
    "profileUsername"
  ).value =
    profile.username || "";

  document.getElementById(
    "profileField"
  ).value =
    profile.field ||
    "Sayısal";

  document.getElementById(
    "profileRank"
  ).value =
    profile.target_rank ||
    "";

  document.getElementById(
    "profileHours"
  ).value =
    profile.daily_hours ??
    4;

  document.getElementById(
    "profileQuestions"
  ).value =
    profile.daily_questions ??
    100;

  document.getElementById(
    "profileUniversity"
  ).value =
    profile.university ||
    "";

  document.getElementById(
    "profileDepartment"
  ).value =
    profile.department ||
    "";

  document.getElementById(
    "profileExamDate"
  ).value =
    profile.exam_date ||
    "";

  document.getElementById(
    "heroQuestions"
  ).textContent =
    (
      profile.daily_questions ||
      0
    ) +
    " soru";

  document.getElementById(
    "heroHours"
  ).textContent =
    "Günlük hedef: " +
    (
      profile.daily_hours ||
      0
    ) +
    " saat";

}


/* =====================================================
   ADMIN BADGE
===================================================== */

function updateAdminBadge(){

  const badge =
    document.getElementById(
      "adminBadge"
    );

  const section =
    document.getElementById(
      "adminSection"
    );

  if(
    currentRole === "admin" ||
    currentRole === "coach"
  ){

    badge.classList.remove(
      "hidden"
    );

    section.classList.remove(
      "hidden"
    );

  }else{

    badge.classList.add(
      "hidden"
    );

    section.classList.add(
      "hidden"
    );

  }

}
      }

    }


    async function saveProfile(){

      const updated = {

        id:
          currentUser.id,

        username:
          document
            .getElementById(
              "profileUsername"
            )
            .value
            .trim() ||
          "Öğrenci",

        field:
          document
            .getElementById(
              "profileField"
            )
            .value,

        target_rank:
          Number(
            document
              .getElementById(
                "profileRank"
              )
              .value
          ) || null,

        daily_hours:
          Number(
            document
              .getElementById(
                "profileHours"
              )
              .value
          ) || 0,

        daily_questions:
          Number(
            document
              .getElementById(
                "profileQuestions"
              )
              .value
          ) || 0,

        university:
          document
            .getElementById(
              "profileUniversity"
            )
            .value
            .trim(),

        department:
          document
            .getElementById(
              "profileDepartment"
            )
            .value
            .trim(),

        exam_date:
          document
            .getElementById(
              "profileExamDate"
            )
            .value ||
          null

      };

      const {
        error
      } =
        await supabaseClient
          .from("profiles")
          .upsert(updated);

      if(error){

        console.error(error);

        toast(error.message);

        return;
      }

      profile = {

        ...profile,

        ...updated

      };

      saveLocal();

      fillProfileUI();

      toast(
        "Profil kaydedildi ✅"
      );

      renderHome();

    }


    /* =====================================================
       CLOUD LOAD
    ===================================================== */

    async function loadCloudData(){

      if(!currentUser)
        return;

      try{

        const [
          q,
          e,
          w,
          t,
          s,
          p,
          b
        ] =
          await Promise.all([

            supabaseClient
              .from("questions")
              .select("*")
              .eq(
                "user_id",
                currentUser.id
              )
              .order(
                "date",
                {
                  ascending:false
                }
              ),

            supabaseClient
              .from("exams")
              .select("*")
              .eq(
                "user_id",
                currentUser.id
              )
              .order(
                "date",
                {
                  ascending:false
                }
              ),

            supabaseClient
              .from("wrongs")
              .select("*")
              .eq(
                "user_id",
                currentUser.id
              )
              .order(
                "date",
                {
                  ascending:false
                }
              ),

            supabaseClient
              .from("topics")
              .select("*")
              .eq(
                "user_id",
                currentUser.id
              ),

            supabaseClient
              .from("study_sessions")
              .select("*")
              .eq(
                "user_id",
                currentUser.id
              )
              .order(
                "date",
                {
                  ascending:false
                }
              ),

            supabaseClient
              .from("daily_plans")
              .select("*")
              .eq(
                "user_id",
                currentUser.id
              )
              .eq(
                "plan_date",
                today()
              )
              .maybeSingle(),

            supabaseClient
              .from("badges")
              .select("*")
              .eq(
                "user_id",
                currentUser.id
              )

          ]);

        if(q.data)
          questions = q.data;

        if(e.data)
          exams = e.data;

        if(w.data)
          wrongs = w.data;

        if(t.data){

          topics = {};

          t.data.forEach(
            row => {

              topics[
                row.subject +
                "::" +
                row.topic
              ] =
                row.state;

            }
          );

        }

        if(s.data)
          studySessions = s.data;

        if(p.data)
          dailyPlan = p.data;

        if(b.data)
          badges = b.data;

        /*
          Buluttan günlük plan geldiyse
          ders seçimlerini de al.
        */

        if(
          dailyPlan &&
          Array.isArray(
            dailyPlan.subjects
          ) &&
          dailyPlan.subjects.length
        ){

          selectedPlanSubjects =
            dailyPlan.subjects;

          savePlanSubjectsLocal();

        }else{

          loadPlanSubjects();

        }

        saveLocal();

      }catch(error){

        console.error(error);

        toast(
          "Bulut verileri yüklenirken sorun oldu."
        );

      }

    }


    /* =====================================================
       ROLE
    ===================================================== */

    async function getRole(){

      currentRole = "user";

      try{

        const {
          data,
          error
        } =
          await supabaseClient
            .rpc("my_role");

        if(
          !error &&
          data
        ){

          currentRole =
            String(data)
              .toLowerCase()
              .trim();

        }

      }catch(e){

        console.error(
          "Rol alınamadı:",
          e
        );

        currentRole = "user";

      }

      updateAdminBadge();

    }


    /* =====================================================
       BOOT
    ===================================================== */

    async function bootApp(){

      document
        .getElementById("authScreen")
        .classList
        .add("hidden");

      document
        .getElementById("appScreen")
        .classList
        .remove("hidden");

      try{

        loadLocal();

        await getRole();

        await loadProfile();

        await loadCloudData();

        await createTodayPlanIfNeeded();

        renderAll();

        if(
          currentRole === "admin" ||
          currentRole === "coach"
        ){

          await loadAdminStats(false);

        }

      }catch(error){

        console.error(error);

        toast(
          "Uygulama yüklenirken hata oluştu."
        );

      }finally{

        document
          .getElementById("loading")
          .classList
          .add("hidden");

      }

    }


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function showPage(page){

      document
        .querySelectorAll(
          ".page"
        )
        .forEach(
          el =>
            el.classList.add(
              "hidden"
            )
        );

      const target =
        document.getElementById(
          page
        );

      if(target)
        target.classList.remove(
          "hidden"
        );

      document
        .querySelectorAll(
          ".nav-btn"
        )
        .forEach(
          btn => {

            btn.classList.toggle(
              "active",
              btn.dataset.page ===
              page
            );

          }
        );

      if(page === "home")
        renderHome();

      if(page === "questions")
        renderQuestions();

      if(page === "wrong")
        renderWrongQuestions();

      if(page === "exam")
        renderExams();

      if(page === "study")
        renderStudy();

      if(page === "plan")
        renderPlan();

      if(page === "stats")
        renderStats();

      if(page === "focus")
        restoreFocusTimer();

      if(page === "profile")
        fillProfileUI();

      if(
        page === "admin" &&
        isStaff()
      ){

        loadAdminStats(false);

      }

    }


    function renderAll(){

      fillProfileUI();

      renderHome();

      renderQuestions();

      renderWrongQuestions();

      renderExams();

      renderStudy();

      renderPlan();

      renderStats();

      renderFocusPage();

      updateAdminBadge();

    }


    /* =====================================================
       HOME
    ===================================================== */

    function renderHome(){

      const todayQuestions =
        questions.filter(
          q =>
            q.date ===
            today()
        ).length;

      const todayStudy =
        studySessions
          .filter(
            s =>
              s.date ===
              today()
          )
          .reduce(
            (
              sum,
              s
            ) =>
              sum +
              Number(
                s.minutes || 0
              ),
            0
          );

      const todayExams =
        exams.filter(
          e =>
            e.date ===
            today()
        ).length;

      const qEl =
        document.getElementById(
          "homeQuestions"
        );

      const sEl =
        document.getElementById(
          "homeStudy"
        );

      const eEl =
        document.getElementById(
          "homeExams"
        );

      if(qEl)
        qEl.textContent =
          todayQuestions;

      if(sEl)
        sEl.textContent =
          todayStudy +
          " dk";

      if(eEl)
        eEl.textContent =
          todayExams;

      const streak =
        calculateStreak();

      document.getElementById(
        "streakText"
      ).textContent =
        streak +
        " gün seri";

      renderTodayTasks();

    }


    function calculateStreak(){

      const days =
        new Set();

      questions.forEach(
        q => {

          if(q.date)
            days.add(q.date);

        }
      );

      studySessions.forEach(
        s => {

          if(s.date)
            days.add(s.date);

        }
      );

      exams.forEach(
        e => {

          if(e.date)
            days.add(e.date);

        }
      );

      let count = 0;

      let cursor =
        new Date();

      while(true){

        const key =
          cursor
            .toISOString()
            .slice(0,10);

        if(
          days.has(key)
        ){

          count++;

          cursor.setDate(
            cursor.getDate() - 1
          );

        }else{

          break;

        }

      }

      return count;

    }


    /* =====================================================
       PLAN - CREATE
    ===================================================== */

    async function createTodayPlanIfNeeded(){

      if(!currentUser)
        return;


      /*
        Ders seçimlerini yükle
      */

      loadPlanSubjects();


      /*
        Eğer bugünün planı zaten varsa
        onu kullan.
      */

      if(dailyPlan){

        /*
          Eski planda subjects yoksa
          seçilen dersleri ekle.
        */

        if(
          !Array.isArray(
            dailyPlan.subjects
          ) ||
          !dailyPlan.subjects.length
        ){

          dailyPlan.subjects =
            [...selectedPlanSubjects];

        }

        return;
      }


      const hours =
        Number(
          profile?.daily_hours ||
          4
        );


      const start =
        "18:00";


      const subjects =
        selectedPlanSubjects.length
          ? [...selectedPlanSubjects]
          : [...DEFAULT_PLAN_SUBJECTS];


      const totalMinutes =
        Math.max(
          15,
          Math.round(
            hours * 60
          )
        );


      const minutesPerSubject =
        Math.max(
          15,
          Math.floor(
            totalMinutes /
            subjects.length
          )
        );


      const tasks =
        subjects.map(
          (
            subject,
            index
          ) => {

            const startMinutes =
              timeToMinutes(start) +
              index *
              minutesPerSubject;

            return {

              id:
                "task_" +
                Date.now() +
                "_" +
                index,

              date:
                today(),

              time:
                minutesToTime(
                  startMinutes
                ),

              subject,

              topic:"",

              minutes:
                minutesPerSubject,

              done:false

            };

          }
        );


      dailyPlan = {

        user_id:
          currentUser.id,

        plan_date:
          today(),

        hours,

        start_time:
          start,

        subjects,

        tasks

      };


      const {
        data,
        error
      } =
        await supabaseClient
          .from("daily_plans")
          .upsert(

            dailyPlan,

            {
              onConflict:
                "user_id,plan_date"
            }

          )
          .select()
          .single();


      if(!error && data){

        dailyPlan = data;

      }else if(error){

        console.error(
          "Plan oluşturulamadı:",
          error
        );

      }


      savePlanSubjectsLocal();

      saveLocal();

    }


    /* =====================================================
       PLAN - EDITOR
    ===================================================== */

    function renderPlanSubjectEditor(){

      const box =
        document.getElementById(
          "planSubjectEditor"
        );

      if(!box)
        return;


      if(
        !selectedPlanSubjects.length
      ){

        loadPlanSubjects();

      }


      box.innerHTML =
        SUBJECTS.map(
          subject => {

            const checked =
              selectedPlanSubjects.includes(
                subject
              );

            return `

              <label
                class="subject-option ${
                  checked
                    ? "selected"
                    : ""
                }">

                <input
                  type="checkbox"
                  value="${escapeHtml(subject)}"
                  ${checked ? "checked" : ""}
                  onchange="togglePlanSubject(this)">

                <span>
                  ${escapeHtml(subject)}
                </span>

              </label>

            `;

          }
        ).join("");


      updateSelectedPlanCount();

    }


    function updateSelectedPlanCount(){

      const counter =
        document.getElementById(
          "selectedPlanCount"
        );

      if(counter){

        counter.textContent =
          selectedPlanSubjects.length;

      }

    }


    function togglePlanSubject(input){

      const subject =
        input.value;


      if(input.checked){

        if(
          !selectedPlanSubjects.includes(
            subject
          )
        ){

          selectedPlanSubjects.push(
            subject
          );

        }

      }else{

        selectedPlanSubjects =
          selectedPlanSubjects.filter(
            item =>
              item !== subject
          );

      }


      input
        .closest(
          ".subject-option"
        )
        ?.classList.toggle(
          "selected",
          input.checked
        );


      updateSelectedPlanCount();

    }


    /* =====================================================
       PLAN - SAVE SUBJECTS
    ===================================================== */

    async function saveSelectedPlanSubjects(){

      if(!currentUser)
        return;


      if(
        !selectedPlanSubjects.length
      ){

        toast(
          "En az bir ders seçmelisin."
        );

        return;

      }


      savePlanSubjectsLocal();


      /*
        Mevcut plan varsa subjects alanını
        güncelle fakat görevleri bozma.
      */

      if(dailyPlan){

        dailyPlan.subjects =
          [...selectedPlanSubjects];

        const {
          data,
          error
        } =
          await supabaseClient
            .from("daily_plans")
            .upsert(

              {

                ...dailyPlan,

                subjects:
                  [...selectedPlanSubjects],

                updated_at:
                  new Date()
                    .toISOString()

              },

              {
                onConflict:
                  "user_id,plan_date"
              }

            )
            .select()
            .single();


        if(!error && data){

          dailyPlan = data;

        }else if(error){

          console.error(
            "Ders planı kaydedilemedi:",
            error
          );

          toast(
            error.message ||
            "Plan kaydedilemedi."
          );

          return;

        }

      }


      renderPlanSubjectEditor();

      renderPlan();

      toast(
        "Ders planı kaydedildi ✅"
      );

    }
    function renderPlan(){

      const container =
        document.getElementById(
          "planTasks"
        );

      if(!container)
        return;

      if(!dailyPlan){

        container.innerHTML =
          `<div class="empty-state">
             Henüz günlük plan yok.
           </div>`;

        return;
      }

      const tasks =
        Array.isArray(
          dailyPlan.tasks
        )
          ? dailyPlan.tasks
          : [];

      if(!tasks.length){

        container.innerHTML =
          `<div class="empty-state">
             Bugün için görev bulunmuyor.
           </div>`;

        return;
      }

      container.innerHTML =
        tasks
          .map(
            task => {

              const done =
                Boolean(
                  task.done
                );

              return `
                <div class="task-card ${
                  done ? "completed" : ""
                }">

                  <div class="task-check"
                       onclick="toggleTask('${escapeAttr(task.id)}')">
                    ${done ? "✓" : ""}
                  </div>

                  <div class="task-main">

                    <div class="task-title">
                      ${escapeHtml(
                        task.title ||
                        task.subject ||
                        "Görev"
                      )}
                    </div>

                    <div class="task-meta">

                      ${
                        task.time
                          ? `<span>🕐 ${escapeHtml(task.time)}</span>`
                          : ""
                      }

                      ${
                        task.subject
                          ? `<span>📚 ${escapeHtml(task.subject)}</span>`
                          : ""
                      }

                      ${
                        task.minutes
                          ? `<span>⏱️ ${Number(task.minutes)} dk</span>`
                          : ""
                      }

                    </div>

                    ${
                      task.topic
                        ? `<div class="task-topic">
                             ${escapeHtml(task.topic)}
                           </div>`
                        : ""
                    }

                  </div>

                  <button
                    class="task-delete"
                    onclick="deleteTask('${escapeAttr(task.id)}')"
                    title="Görevi sil">
                    🗑️
                  </button>

                </div>
              `;

            }
          )
          .join("");

    }


    async function toggleTask(id){

      if(!dailyPlan)
        return;

      const task =
        dailyPlan.tasks?.find(
          t =>
            String(t.id) ===
            String(id)
        );

      if(!task)
        return;

      task.done =
        !task.done;

      dailyPlan.updated_at =
        new Date()
          .toISOString();

      const {
        data,
        error
      } =
        await supabaseClient
          .from("daily_plans")
          .upsert(
            dailyPlan,
            {
              onConflict:
                "user_id,plan_date"
            }
          )
          .select()
          .single();

      if(error){

        console.error(error);

        task.done =
          !task.done;

        toast(
          "Görev güncellenemedi."
        );

        return;
      }

      if(data)
        dailyPlan = data;

      saveLocal();

      renderTodayTasks();

      renderPlan();

      toast(
        task.done
          ? "Görev tamamlandı ✅"
          : "Görev geri alındı"
      );

    }


    async function deleteTask(id){

      if(!dailyPlan)
        return;

      const oldTasks =
        Array.isArray(
          dailyPlan.tasks
        )
          ? [...dailyPlan.tasks]
          : [];

      const exists =
        oldTasks.some(
          task =>
            String(task.id) ===
            String(id)
        );

      if(!exists)
        return;

      dailyPlan.tasks =
        oldTasks.filter(
          task =>
            String(task.id) !==
            String(id)
        );

      dailyPlan.updated_at =
        new Date()
          .toISOString();

      const {
        data,
        error
      } =
        await supabaseClient
          .from("daily_plans")
          .upsert(
            dailyPlan,
            {
              onConflict:
                "user_id,plan_date"
            }
          )
          .select()
          .single();

      if(error){

        console.error(
          "Görev silinemedi:",
          error
        );

        dailyPlan.tasks =
          oldTasks;

        toast(
          "Görev silinemedi."
        );

        return;
      }

      if(data)
        dailyPlan = data;

      saveLocal();

      renderTodayTasks();

      renderPlan();

      toast(
        "Görev silindi 🗑️"
      );

    }


    async function clearAllTasks(){

      if(!dailyPlan)
        return;

      const tasks =
        Array.isArray(
          dailyPlan.tasks
        )
          ? dailyPlan.tasks
          : [];

      if(!tasks.length){

        toast(
          "Silinecek görev yok."
        );

        return;
      }

      const confirmed =
        confirm(
          "Bugünkü tüm görevler silinsin mi?"
        );

      if(!confirmed)
        return;

      const oldTasks =
        [...tasks];

      dailyPlan.tasks =
        [];

      dailyPlan.updated_at =
        new Date()
          .toISOString();

      const {
        data,
        error
      } =
        await supabaseClient
          .from("daily_plans")
          .upsert(
            dailyPlan,
            {
              onConflict:
                "user_id,plan_date"
            }
          )
          .select()
          .single();

      if(error){

        console.error(
          "Görevler temizlenemedi:",
          error
        );

        dailyPlan.tasks =
          oldTasks;

        toast(
          "Görevler silinemedi."
        );

        return;
      }

      if(data)
        dailyPlan = data;

      saveLocal();

      renderTodayTasks();

      renderPlan();

      toast(
        "Tüm görevler temizlendi 🧹"
      );

    }


    function renderTodayTasks(){

      const container =
        document.getElementById(
          "todayTasks"
        );

      if(!container)
        return;

      const tasks =
        Array.isArray(
          dailyPlan?.tasks
        )
          ? dailyPlan.tasks
          : [];

      if(!tasks.length){

        container.innerHTML =
          `<div class="empty-state">
             Bugün için görev yok.
           </div>`;

      }else{

        container.innerHTML =
          tasks
            .map(
              task => {

                const done =
                  Boolean(
                    task.done
                  );

                return `
                  <div class="today-task ${
                    done ? "done" : ""
                  }">

                    <button
                      class="today-task-check"
                      onclick="toggleTask('${escapeAttr(task.id)}')">
                      ${done ? "✓" : ""}
                    </button>

                    <div class="today-task-content">

                      <div class="today-task-title">
                        ${escapeHtml(
                          task.title ||
                          task.subject ||
                          "Görev"
                        )}
                      </div>

                      <div class="today-task-meta">

                        ${
                          task.time
                            ? `🕐 ${escapeHtml(task.time)}`
                            : ""
                        }

                        ${
                          task.minutes
                            ? ` · ${Number(task.minutes)} dk`
                            : ""
                        }

                      </div>

                    </div>

                    <button
                      class="today-task-delete"
                      onclick="deleteTask('${escapeAttr(task.id)}')">
                      🗑️
                    </button>

                  </div>
                `;

              }
            )
            .join("");

      }

      renderAssignedHomeworks();

    }


    function renderAssignedHomeworks(){

      const container =
        document.getElementById(
          "adminAssignedHomework"
        );

      if(!container)
        return;

      const tasks =
        Array.isArray(
          dailyPlan?.tasks
        )
          ? dailyPlan.tasks
          : [];

      const assigned =
        tasks.filter(
          task =>
            task.assigned_by
        );

      if(!assigned.length){

        container.classList.add(
          "hidden"
        );

        container.innerHTML =
          "";

        return;
      }

      container.classList.remove(
        "hidden"
      );

      container.innerHTML = `
        <div class="assigned-homework-title">
          🎓 Admin tarafından verilen ödevler
        </div>

        <div class="assigned-homework-list">

          ${
            assigned
              .map(
                task => {

                  const done =
                    Boolean(
                      task.done
                    );

                  return `
                    <div class="assigned-homework-card ${
                      done ? "done" : ""
                    }">

                      <div class="assigned-homework-icon">
                        📚
                      </div>

                      <div class="assigned-homework-content">

                        <div class="assigned-homework-name">
                          ${escapeHtml(
                            task.title ||
                            "Ödev"
                          )}
                        </div>

                        ${
                          task.subject
                            ? `<div class="assigned-homework-subject">
                                 ${escapeHtml(task.subject)}
                               </div>`
                            : ""
                        }

                        ${
                          task.topic
                            ? `<div class="assigned-homework-topic">
                                 ${escapeHtml(task.topic)}
                               </div>`
                            : ""
                        }

                        ${
                          task.minutes
                            ? `<div class="assigned-homework-time">
                                 ⏱️ ${Number(task.minutes)} dk
                               </div>`
                            : ""
                        }

                      </div>

                      <div class="assigned-homework-status">
                        ${
                          done
                            ? "Tamamlandı ✅"
                            : "Bekliyor"
                        }
                      </div>

                    </div>
                  `;

                }
              )
              .join("")
          }

        </div>
      `;

    }


    /* =====================================================
       QUESTIONS
    ===================================================== */

    function renderQuestions(){

      const list =
        document.getElementById(
          "questionList"
        );

      if(!list)
        return;

      const sorted =
        [...questions]
          .sort(
            (
              a,
              b
            ) =>
              String(
                b.date || ""
              ).localeCompare(
                String(
                  a.date || ""
                )
              )
          );

      if(!sorted.length){

        list.innerHTML =
          `<div class="empty-state">
             Henüz soru kaydı yok.
           </div>`;

        return;
      }

      list.innerHTML =
        sorted
          .map(
            q => `

              <div class="data-card">

                <div class="data-card-main">

                  <strong>
                    ${escapeHtml(
                      q.subject ||
                      "Ders"
                    )}
                  </strong>

                  ${
                    q.topic
                      ? `<span>
                           ${escapeHtml(q.topic)}
                         </span>`
                      : ""
                  }

                </div>

                <div class="data-card-value">
                  ${Number(q.count || 0)}
                </div>

                <div class="data-card-date">
                  ${escapeHtml(
                    q.date || ""
                  )}
                </div>

              </div>

            `
          )
          .join("");

    }


    async function addQuestions(){

      if(!currentUser)
        return;

      const subject =
        document
          .getElementById(
            "questionSubject"
          )
          ?.value;

      const topic =
        document
          .getElementById(
            "questionTopic"
          )
          ?.value
          .trim();

      const count =
        Number(
          document
            .getElementById(
              "questionCount"
            )
            ?.value
        );

      if(
        !subject ||
        !count ||
        count < 1
      ){

        toast(
          "Ders ve soru sayısını gir."
        );

        return;
      }

      const row = {

        user_id:
          currentUser.id,

        date:
          today(),

        subject,

        topic:
          topic || "",

        count

      };

      const {
        data,
        error
      } =
        await supabaseClient
          .from("questions")
          .insert(row)
          .select()
          .single();

      if(error){

        console.error(error);

        toast(
          error.message ||
          "Sorular kaydedilemedi."
        );

        return;
      }

      if(data)
        questions.unshift(
          data
        );

      saveLocal();

      const input =
        document.getElementById(
          "questionCount"
        );

      if(input)
        input.value =
          "";

      renderQuestions();

      renderHome();

      renderStats();

      toast(
        `${count} soru kaydedildi ✅`
      );

    }


    /* =====================================================
       WRONG QUESTIONS
    ===================================================== */

    function renderWrongQuestions(){

      const list =
        document.getElementById(
          "wrongList"
        );

      if(!list)
        return;

      if(!wrongs.length){

        list.innerHTML =
          `<div class="empty-state">
             Yanlış soru kaydı yok.
           </div>`;

        return;
      }

      list.innerHTML =
        wrongs
          .map(
            wrong => `

              <div class="data-card">

                <div class="data-card-main">

                  <strong>
                    ${escapeHtml(
                      wrong.subject ||
                      "Ders"
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      wrong.topic ||
                      "Konu belirtilmedi"
                    )}
                  </span>

                </div>

                <div class="data-card-date">
                  ${escapeHtml(
                    wrong.date || ""
                  )}
                </div>

              </div>

            `
          )
          .join("");

    }


    async function addWrongQuestion(){

      if(!currentUser)
        return;

      const subject =
        document
          .getElementById(
            "wrongSubject"
          )
          ?.value;

      const topic =
        document
          .getElementById(
            "wrongTopic"
          )
          ?.value
          .trim();

      if(!subject){

        toast(
          "Ders seç."
        );

        return;
      }

      const row = {

        user_id:
          currentUser.id,

        date:
          today(),

        subject,

        topic:
          topic || ""

      };

      const {
        data,
        error
      } =
        await supabaseClient
          .from("wrongs")
          .insert(row)
          .select()
          .single();

      if(error){

        console.error(error);

        toast(
          error.message ||
          "Yanlış kaydedilemedi."
        );

        return;
      }

      if(data)
        wrongs.unshift(
          data
        );

      saveLocal();

      renderWrongQuestions();

      toast(
        "Yanlış soru kaydedildi ✅"
      );

    }


    /* =====================================================
       EXAMS
    ===================================================== */

    function renderExams(){

      const list =
        document.getElementById(
          "examList"
        );

      if(!list)
        return;

      if(!exams.length){

        list.innerHTML =
          `<div class="empty-state">
             Henüz deneme kaydı yok.
           </div>`;

        return;
      }

      list.innerHTML =
        exams
          .map(
            exam => `

              <div class="data-card">

                <div class="data-card-main">

                  <strong>
                    ${escapeHtml(
                      exam.name ||
                      exam.title ||
                      "Deneme"
                    )}
                  </strong>

                  <span>
                    ${
                      exam.net != null
                        ? `Net: ${Number(exam.net).toFixed(2)}`
                        : ""
                    }
                  </span>

                </div>

                <div class="data-card-value">
                  ${
                    exam.total != null
                      ? Number(exam.total)
                      : "-"
                  }
                </div>

                <div class="data-card-date">
                  ${escapeHtml(
                    exam.date || ""
                  )}
                </div>

              </div>

            `
          )
          .join("");

    }


    async function addExam(){

      if(!currentUser)
        return;

      const name =
        document
          .getElementById(
            "examName"
          )
          ?.value
          .trim();

      const correct =
        Number(
          document
            .getElementById(
              "examCorrect"
            )
            ?.value
        ) || 0;

      const wrong =
        Number(
          document
            .getElementById(
              "examWrong"
            )
            ?.value
        ) || 0;

      const empty =
        Number(
          document
            .getElementById(
              "examEmpty"
            )
            ?.value
        ) || 0;

      if(!name){

        toast(
          "Deneme adını gir."
        );

        return;
      }

      const net =
        correct -
        wrong / 4;

      const total =
        correct +
        wrong +
        empty;

      const row = {

        user_id:
          currentUser.id,

        date:
          today(),

        name,

        correct,

        wrong,

        empty,

        total,

        net

      };

      const {
        data,
        error
      } =
        await supabaseClient
          .from("exams")
          .insert(row)
          .select()
          .single();

      if(error){

        console.error(error);

        toast(
          error.message ||
          "Deneme kaydedilemedi."
        );

        return;
      }

      if(data)
        exams.unshift(
          data
        );

      saveLocal();

      [
        "examName",
        "examCorrect",
        "examWrong",
        "examEmpty"
      ].forEach(
        id => {

          const el =
            document.getElementById(
              id
            );

          if(el)
            el.value = "";

        }
      );

      renderExams();

      renderHome();

      renderStats();

      toast(
        "Deneme kaydedildi ✅"
      );

    }


    /* =====================================================
       STUDY
    ===================================================== */

    function renderStudy(){

      const list =
        document.getElementById(
          "studyList"
        );

      if(!list)
        return;

      if(!studySessions.length){

        list.innerHTML =
          `<div class="empty-state">
             Henüz çalışma kaydı yok.
           </div>`;

        return;
      }

      list.innerHTML =
        studySessions
          .map(
            session => `

              <div class="data-card">

                <div class="data-card-main">

                  <strong>
                    ${escapeHtml(
                      session.subject ||
                      "Ders"
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      session.topic ||
                      ""
                    )}
                  </span>

                </div>

                <div class="data-card-value">
                  ${Number(
                    session.minutes || 0
                  )} dk
                </div>

                <div class="data-card-date">
                  ${escapeHtml(
                    session.date || ""
                  )}
                </div>

              </div>

            `
          )
          .join("");

    }


    async function addStudySession(){

      if(!currentUser)
        return;

      const subject =
        document
          .getElementById(
            "studySubject"
          )
          ?.value;

      const topic =
        document
          .getElementById(
            "studyTopic"
          )
          ?.value
          .trim();

      const minutes =
        Number(
          document
            .getElementById(
              "studyMinutes"
            )
            ?.value
        );

      if(
        !minutes ||
        minutes < 1
      ){

        toast(
          "Çalışma süresini gir."
        );

        return;
      }

      const row = {

        user_id:
          currentUser.id,

        date:
          today(),

        subject:
          subject || "Genel",

        topic:
          topic || "",

        minutes

      };

      const {
        data,
        error
      } =
        await supabaseClient
          .from("study_sessions")
          .insert(row)
          .select()
          .single();

      if(error){

        console.error(error);

        toast(
          error.message ||
          "Çalışma kaydı eklenemedi."
        );

        return;
      }

      if(data)
        studySessions.unshift(
          data
        );

      saveLocal();

      renderStudy();

      renderHome();

      renderStats();

      const minutesInput =
        document.getElementById(
          "studyMinutes"
        );

      if(minutesInput)
        minutesInput.value =
          "";

      toast(
        "Çalışma kaydedildi ✅"
      );

    }


    /* =====================================================
       STATS
    ===================================================== */

    function renderStats(){

      const totalQuestions =
        questions.reduce(
          (
            sum,
            q
          ) =>
            sum +
            Number(
              q.count || 0
            ),
          0
        );

      const totalStudy =
        studySessions.reduce(
          (
            sum,
            s
          ) =>
            sum +
            Number(
              s.minutes || 0
            ),
          0
        );

      const totalExams =
        exams.length;

      const qEl =
        document.getElementById(
          "statsQuestions"
        );

      const sEl =
        document.getElementById(
          "statsStudy"
        );

      const eEl =
        document.getElementById(
          "statsExams"
        );

      if(qEl)
        qEl.textContent =
          totalQuestions;

      if(sEl)
        sEl.textContent =
          totalStudy +
          " dk";

      if(eEl)
        eEl.textContent =
          totalExams;

      const weekly =
        {};

      studySessions.forEach(
        session => {

          const date =
            session.date;

          if(!date)
            return;

          weekly[date] =
            (
              weekly[date] ||
              0
            ) +
            Number(
              session.minutes || 0
            );

        }
      );

      const weekList =
        document.getElementById(
          "weeklyStudy"
        );

      if(
        weekList
      ){

        const entries =
          Object.entries(
            weekly
          )
          .sort(
            (
              a,
              b
            ) =>
              b[0].localeCompare(
                a[0]
              )
          )
          .slice(
            0,
            7
          );

        weekList.innerHTML =
          entries.length
            ? entries
                .map(
                  item => `
                    <div class="stat-row">

                      <span>
                        ${escapeHtml(
                          item[0]
                        )}
                      </span>

                      <strong>
                        ${Number(
                          item[1]
                        )} dk
                      </strong>

                    </div>
                  `
                )
                .join("")
            : `
                <div class="empty-state">
                  Henüz çalışma verisi yok.
                </div>
              `;

      }

    }


    /* =====================================================
       FOCUS MODE
    ===================================================== */

    function renderFocusPage(){

      restoreFocusTimer();

    }


    function saveFocusState(){

      localStorage.setItem(
        "yks_focus_remaining",
        String(
          Math.max(
            0,
            Math.ceil(
              focusSeconds
            )
          )
        )
      );

      localStorage.setItem(
        "yks_focus_running",
        focusRunning
          ? "1"
          : "0"
      );

      localStorage.setItem(
        "yks_focus_end_at",
        String(
          focusEndAt || 0
        )
      );

      localStorage.setItem(
        "yks_focus_duration",
        String(
          focusDuration
        )
      );

    }


    function setFocusDuration(minutes){

      const value =
        Math.min(
          600,
          Math.max(
            1,
            Number(minutes) ||
            25
          )
        );

      if(focusRunning){

        toast(
          "Önce odak modunu duraklat."
        );

        const input =
          document.getElementById(
            "focusMinutes"
          );

        if(input){

          input.value =
            Math.round(
              focusDuration /
              60
            );

        }

        return;

      }

      focusDuration =
        Math.round(
          value * 60
        );

      focusSeconds =
        focusDuration;

      focusEndAt =
        0;

      saveFocusState();

      updateTimer();

    }


    function toggleFocus(){

      if(
        focusRunning
      ){

        pauseFocus();

      }else{

        startFocus();

      }

    }


    function startFocus(){

      if(
        focusSeconds <= 0 ||
        focusSeconds >
          focusDuration
      ){

        focusSeconds =
          focusDuration;

      }

      focusRunning =
        true;

      focusEndAt =
        Date.now() +
        focusSeconds * 1000;

      saveFocusState();

      if(
        focusInterval
      )
        clearInterval(
          focusInterval
        );

      focusInterval =
        setInterval(
          updateFocusFromClock,
          250
        );

      updateFocusFromClock();

    }


    function updateFocusFromClock(){

      if(!focusRunning)
        return;

      const remaining =
        Math.max(
          0,
          (
            focusEndAt -
            Date.now()
          ) / 1000
        );

      focusSeconds =
        remaining;

      updateTimer();

      saveFocusState();

      if(
        remaining <= 0
      ){

        finishFocus();

      }

    }


    function pauseFocus(){

      if(
        !focusRunning
      )
        return;

      updateFocusFromClock();

      focusRunning =
        false;

      focusSeconds =
        Math.max(
          0,
          focusSeconds
        );

      focusEndAt =
        0;

      saveFocusState();

      if(
        focusInterval
      ){

        clearInterval(
          focusInterval
        );

        focusInterval =
          null;

      }

      updateTimer();

    }


    function resetFocus(){

      focusRunning =
        false;

      focusSeconds =
        focusDuration;

      focusEndAt =
        0;

      saveFocusState();

      if(
        focusInterval
      ){

        clearInterval(
          focusInterval
        );

        focusInterval =
          null;

      }

      updateTimer();

    }


    async function finishFocus(){

      if(
        !focusRunning &&
        focusSeconds > 0
      )
        return;

      focusRunning =
        false;

      focusSeconds =
        0;

      focusEndAt =
        0;

      saveFocusState();

      if(
        focusInterval
      ){

        clearInterval(
          focusInterval
        );

        focusInterval =
          null;

      }

      updateTimer();

      if(currentUser){

        const minutes =
          Math.max(
            1,
            Math.round(
              focusDuration /
              60
            )
          );

        const row = {

          user_id:
            currentUser.id,

          date:
            today(),

          subject:
            "Odak Modu",

          topic:
            "Odaklanma çalışması",

          minutes

        };

        const {
          data,
          error
        } =
          await supabaseClient
            .from(
              "study_sessions"
            )
            .insert(row)
            .select()
            .single();

        if(!error && data){

          studySessions.unshift(
            data
          );

          saveLocal();

          renderStudy();

          renderHome();

          renderStats();

        }else if(error){

          console.error(
            "Odak çalışması kaydedilemedi:",
            error
          );

        }

      }

      toast(
        "Odak süresi tamamlandı 🎯"
      );

      setTimeout(
        () => {

          focusSeconds =
            focusDuration;

          focusEndAt =
            0;

          saveFocusState();

          updateTimer();

        },
        500
      );

    }


    function updateTimer(){

      const timer =
        document.getElementById(
          "timer"
        );

      if(!timer)
        return;

      const seconds =
        Math.max(
          0,
          Math.ceil(
            focusSeconds
          )
        );

      const minutes =
        Math.floor(
          seconds / 60
        );

      const remaining =
        seconds % 60;

      timer.textContent =
        String(minutes)
          .padStart(2,"0") +
        ":" +
        String(remaining)
          .padStart(2,"0");

      const button =
        document.getElementById(
          "focusButton"
        );

      if(button){

        button.textContent =
          focusRunning
            ? "⏸️ Duraklat"
            : "▶️ Başlat";

      }

      const status =
        document.getElementById(
          "focusStatus"
        );

      if(status){

        status.textContent =
          focusRunning
            ? "Odaklanıyorsun..."
            : "Hazır";

      }

      const input =
        document.getElementById(
          "focusMinutes"
        );

      if(
        input &&
        !focusRunning
      ){

        input.value =
          Math.round(
            focusDuration /
            60
          );

      }

    }


    function restoreFocusTimer(){

      focusDuration =
        Number(
          localStorage.getItem(
            "yks_focus_duration"
          )
        ) ||
        1500;

      focusRunning =
        localStorage.getItem(
          "yks_focus_running"
        ) === "1";

      focusEndAt =
        Number(
          localStorage.getItem(
            "yks_focus_end_at"
          )
        ) ||
        0;

      focusSeconds =
        Number(
          localStorage.getItem(
            "yks_focus_remaining"
          )
        ) ||
        focusDuration;

      if(
        focusRunning &&
        focusEndAt
      ){

        const remaining =
          Math.max(
            0,
            (
              focusEndAt -
              Date.now()
            ) / 1000
          );

        focusSeconds =
          remaining;

        if(
          remaining <= 0
        ){

          finishFocus();

          return;

        }

        if(
          focusInterval
        )
          clearInterval(
            focusInterval
          );

        focusInterval =
          setInterval(
            updateFocusFromClock,
            250
          );

      }

      updateTimer();

    }


    window.addEventListener(
      "load",
      restoreFocusTimer
    );


    /* =====================================================
       ADMIN
    ===================================================== */

    function isStaff(){

      return (
        currentRole ===
          "admin" ||
        currentRole ===
          "coach"
      );

    }


    async function loadAdminStats(
      showLoading = true
    ){

      if(!isStaff())
        return;

      if(showLoading)
        toast(
          "Admin verileri yükleniyor..."
        );

      try{

        const [
          usersRes,
          questionsRes,
          examsRes,
          studyRes
        ] =
          await Promise.all([

            supabaseClient
              .from("profiles")
              .select(
                "*"
              )
              .order(
                "username",
                {
                  ascending:true
                }
              ),

            supabaseClient
              .from("questions")
              .select(
                "user_id,count"
              ),

            supabaseClient
              .from("exams")
              .select(
                "user_id,net"
              ),

            supabaseClient
              .from("study_sessions")
              .select(
                "user_id,minutes,date,subject,topic"
              )

          ]);

        if(
          usersRes.error
        )
          throw usersRes.error;

        adminStudents =
          usersRes.data ||
          [];

        adminQuestions =
          questionsRes.data ||
          [];

        adminExams =
          examsRes.data ||
          [];

        adminStudySessions =
          studyRes.data ||
          [];

        renderAdminStats();

        renderAdminStudents();

      }catch(error){

        console.error(
          "Admin verileri yüklenemedi:",
          error
        );

        toast(
          error.message ||
          "Admin verileri yüklenemedi."
        );

      }

    }
        if(
          Array.isArray(
            data.studySessions
          )
        )
          studySessions =
            data.studySessions;


        if(data.dailyPlan)
          dailyPlan =
            data.dailyPlan;


        if(
          Array.isArray(
            data.badges
          )
        )
          badges =
            data.badges;


        if(
          Array.isArray(
            data.selectedPlanSubjects
          )
        ){

          selectedPlanSubjects =
            data.selectedPlanSubjects;

          savePlanSubjectsLocal();

        }else{

          loadPlanSubjects();

        }


        saveLocal();

        fillProfileUI();

        renderAll();


        toast(
          "Yedek içe aktarıldı. ☁️"
        );


      }catch(error){

        console.error(error);

        toast(
          "Geçersiz JSON dosyası."
        );

      }


      event.target.value = "";

    }


    /* =====================================================
       THEME
    ===================================================== */

    function toggleTheme(){

      document.body.classList.toggle(
        "dark"
      );


      localStorage.setItem(

        localKey("dark"),

        document.body.classList.contains(
          "dark"
        )
          ? "1"
          : "0"

      );

    }


    function loadTheme(){

      const dark =
        localStorage.getItem(
          localKey("dark")
        ) === "1";


      document.body.classList.toggle(
        "dark",
        dark
      );

    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function timeToMinutes(
      time
    ){

      const parts =
        String(time)
          .split(":")
          .map(Number);


      return (

        (parts[0] || 0) *
        60 +

        (parts[1] || 0)

      );

    }


    function minutesToTime(
      total
    ){

      /*
        24 saati aşarsa ertesi güne
        sarmasını engellemek için.
      */

      total =
        Math.max(
          0,
          total
        );


      if(total >= 1440){

        total =
          total % 1440;

      }


      const h =
        Math.floor(
          total / 60
        )
        .toString()
        .padStart(
          2,
          "0"
        );


      const m =
        (
          total %
          60
        )
        .toString()
        .padStart(
          2,
          "0"
        );


      return h +
        ":" +
        m;

    }


    function escapeHtml(
      value
    ){

      return String(
        value ?? ""
      )

        .replaceAll(
          "&",
          "&amp;"
        )

        .replaceAll(
          "<",
          "&lt;"
        )

        .replaceAll(
          ">",
          "&gt;"
        )

        .replaceAll(
          '"',
          "&quot;"
        )

        .replaceAll(
          "'",
          "&#039;"
        );

    }


    function escapeAttr(
      value
    ){

      return String(
        value ?? ""
      )

        .replaceAll(
          "\\",
          "\\\\"
        )

        .replaceAll(
          "'",
          "\\'"
        );

    }


    let toastTimer =
      null;


    function toast(
      message
    ){

      const el =
        document.getElementById(
          "toast"
        );


      el.textContent =
        message;


      el.classList.add(
        "show"
      );


      clearTimeout(
        toastTimer
      );


      toastTimer =
        setTimeout(
          () => {

            el.classList.remove(
              "show"
            );

          },
          2500
        );

    }


    /* =====================================================
       RENDER ALL
    ===================================================== */

    function renderAll(){

      renderHome();

      renderPlan();

      renderQuestions();

      renderExams();

      renderBadges();

      updateTimer();

      updateAdminBadge();

    }


    /* =====================================================
       AUTH STATE
    ===================================================== */

    supabaseClient.auth.onAuthStateChange(

      async (
        event,
        session
      ) => {

        if(
          session &&
          session.user
        ){

          currentUser =
            session.user;


          if(
            document
              .getElementById(
                "appScreen"
              )
              .classList
              .contains(
                "hidden"
              )
          ){

            await bootApp();

          }

        }else{

          currentUser =
            null;

          currentRole =
            "user";

          selectedPlanSubjects =
            [];


          document
            .getElementById(
              "loading"
            )
            .classList
            .add("hidden");


          document
            .getElementById(
              "appScreen"
            )
            .classList
            .add("hidden");


          document
            .getElementById(
              "authScreen"
            )
            .classList
            .remove("hidden");


          document
            .getElementById(
              "adminBadge"
            )
            .classList
            .add("hidden");


          document
            .getElementById(
              "adminSection"
            )
            .classList
            .add("hidden");

        }

      }

    );


    /* =====================================================
       START
    ===================================================== */

    async function start(){

      loadTheme();


      document.getElementById(
        "examDate"
      ).value =
        today();


      switchAuth(
        "login"
      );


      const {
        data
      } =
        await supabaseClient
          .auth
          .getSession();


      if(
        data?.session?.user
      ){

        currentUser =
          data.session.user;

        await bootApp();

      }else{

        document
          .getElementById(
            "loading"
          )
          .classList
          .add("hidden");

        document
          .getElementById(
            "authScreen"
          )
          .classList
          .remove("hidden");

      }

    }


    start();
