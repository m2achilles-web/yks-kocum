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

      const pages = [

        "home",
        "plan",
        "questions",
        "exams",
        "focus",
        "badges",
        "profile"

      ];

      pages.forEach(
        p => {

          const element =
            document.getElementById(
              "page-" + p
            );

          if(element){

            element.classList.toggle(
              "hidden",
              p !== page
            );

          }

        }
      );

      document
        .querySelectorAll(
          ".nav-btn"
        )
        .forEach(
          btn => {

            btn.classList.toggle(
              "active",
              btn.dataset.page === page
            );

          }
        );

      window.scrollTo({

        top:0,

        behavior:"smooth"

      });

      if(page === "home")
        renderHome();

      if(page === "plan")
        renderPlan();

      if(page === "questions")
        renderQuestions();

      if(page === "exams")
        renderExams();

      if(page === "badges")
        renderBadges();

      if(
        page === "profile" &&
        (
          currentRole === "admin" ||
          currentRole === "coach"
        )
      ){

        loadAdminStats(false);

      }

    }


    /* =====================================================
       HOME
    ===================================================== */

    function renderHome(){

      const totalQuestions =
        questions.reduce(

          (sum,q) =>
            sum +
            Number(
              q.total || 0
            ),

          0

        );

      const totalNet =
        questions.reduce(

          (sum,q) =>
            sum +
            Number(
              q.net || 0
            ),

          0

        );

      const totalMinutes =
        studySessions.reduce(

          (sum,s) =>
            sum +
            Number(
              s.minutes || 0
            ) +
            Number(
              s.seconds || 0
            ) / 60,

          0

        );

      document.getElementById(
        "totalQuestions"
      ).textContent =
        totalQuestions;

      document.getElementById(
        "totalNet"
      ).textContent =
        totalNet.toFixed(2);

      document.getElementById(
        "totalExams"
      ).textContent =
        exams.length;

      document.getElementById(
        "totalMinutes"
      ).textContent =
        Math.round(
          totalMinutes
        ) +
        " dk";

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


        if(error){

          console.error(error);

          toast(
            "Dersler kaydedilemedi: " +
            error.message
          );

          return;

        }


        if(data){

          dailyPlan =
            data;

        }

      }


      saveLocal();


      const status =
        document.getElementById(
          "planSaveStatus"
        );

      if(status){

        status.textContent =
          "✓ Ders tercihlerin kaydedildi.";

        setTimeout(
          () => {

            status.textContent = "";

          },
          3000
        );

      }


      renderPlan();

      toast(
        "Dersler kaydedildi 📚"
      );

    }


    /* =====================================================
       PLAN - REFRESH
    ===================================================== */

    async function refreshTodayPlan(){

      if(!currentUser)
        return;


      if(
        !selectedPlanSubjects.length
      ){

        toast(
          "Önce en az bir ders seç."
        );

        return;

      }


      const hours =
        Number(
          document.getElementById(
            "planHours"
          ).value
        ) ||
        Number(
          profile?.daily_hours ||
          4
        );


      const start =
        document.getElementById(
          "planStart"
        ).value ||
        dailyPlan?.start_time ||
        "18:00";


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
            selectedPlanSubjects.length
          )
        );


      const tasks =
        selectedPlanSubjects.map(
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


      const newPlan = {

        user_id:
          currentUser.id,

        plan_date:
          today(),

        hours,

        start_time:
          start,

        subjects:
          [...selectedPlanSubjects],

        tasks,

        updated_at:
          new Date()
            .toISOString()

      };


      const {
        data,
        error
      } =
        await supabaseClient
          .from("daily_plans")
          .upsert(

            newPlan,

            {
              onConflict:
                "user_id,plan_date"
            }

          )
          .select()
          .single();


      if(error){

        console.error(error);

        toast(
          "Plan yenilenemedi: " +
          error.message
        );

        return;

      }


      dailyPlan =
        data || newPlan;


      savePlanSubjectsLocal();

      saveLocal();

      renderPlan();

      renderHome();

      toast(
        "Plan seçtiğin derslere göre yenilendi 🔄"
      );

    }


    /* =====================================================
       PLAN
    ===================================================== */

    function renderPlan(){

      document.getElementById(
        "planDateLabel"
      ).textContent =
        new Date()
          .toLocaleDateString(
            "tr-TR"
          );


      /*
        Dersleri yükle
      */

      loadPlanSubjects();


      /*
        Editor
      */

      renderPlanSubjectEditor();


      if(!dailyPlan){

        document.getElementById(
          "planTaskList"
        ).innerHTML =
          "Bugün için plan yok.";

        return;

      }


      document.getElementById(
        "planHours"
      ).value =
        dailyPlan.hours ||
        0;


      document.getElementById(
        "planStart"
      ).value =
        dailyPlan.start_time ||
        "18:00";


      /*
        Eski multi-select'i de
        seçilen derslerle senkron tut.
      */

      const selected =
        dailyPlan.subjects ||
        selectedPlanSubjects ||
        [];


      Array.from(
        document
          .getElementById(
            "planSubjects"
          )
          .options
      ).forEach(
        option => {

          option.selected =
            selected.includes(
              option.value
            );

        }
      );


      renderPlanTasks();

    }


    function renderPlanTasks(){

      const list =
        document.getElementById(
          "planTaskList"
        );


      const tasks =
        dailyPlan?.tasks ||
        [];


      if(!tasks.length){

        list.innerHTML =
          `<div style="color:var(--muted)">
            Görev bulunmuyor.
          </div>`;

        document.getElementById(
          "planProgressText"
        ).textContent =
          "0 / 0";

        return;

      }


      const done =
        tasks.filter(
          t => t.done
        ).length;


      document.getElementById(
        "planProgressText"
      ).textContent =
        done +
        " / " +
        tasks.length;


      list.innerHTML =
        tasks.map(
          task => `

          <div
            class="task ${
              task.done
                ? "done"
                : ""
            }"
            onclick="toggleTask('${escapeAttr(task.id)}')">

            <div class="task-check">
              ${
                task.done
                  ? "✓"
                  : ""
              }
            </div>

            <div class="task-info">

              <div class="task-name">

                ${
                  escapeHtml(
                    task.subject ||
                    "Ders"
                  )
                }

              </div>

              <div class="task-meta">

                ${
                  escapeHtml(
                    task.time ||
                    ""
                  )
                }

                ·

                ${
                  Number(
                    task.minutes ||
                    0
                  )
                }

                dakika

              </div>

            </div>

          </div>

        `
        ).join("");

    }


    function renderTodayTasks(){

      const container =
        document.getElementById(
          "todayTasks"
        );


      const tasks =
        dailyPlan?.tasks ||
        [];


      if(!tasks.length){

        container.innerHTML =
          `<div style="color:var(--muted);font-size:13px">
            Bugün için görev yok.
          </div>`;


        document.getElementById(
          "todayProgressBar"
        ).style.width =
          "0%";


        document.getElementById(
          "todayPlanProgress"
        ).textContent =
          "0%";


        return;

      }


      const done =
        tasks.filter(
          t => t.done
        ).length;


      const percent =
        Math.round(
          done /
          tasks.length *
          100
        );


      document.getElementById(
        "todayProgressBar"
      ).style.width =
        percent +
        "%";


      document.getElementById(
        "todayPlanProgress"
      ).textContent =
        percent +
        "%";


      container.innerHTML =
        tasks
          .slice(0,4)
          .map(
            task => `

          <div
            class="task ${
              task.done
                ? "done"
                : ""
            }"
            onclick="toggleTask('${escapeAttr(task.id)}')">

            <div class="task-check">

              ${
                task.done
                  ? "✓"
                  : ""
              }

            </div>

            <div class="task-info">

              <div class="task-name">

                ${
                  escapeHtml(
                    task.subject ||
                    "Ders"
                  )
                }

              </div>

              <div class="task-meta">

                ${
                  escapeHtml(
                    task.time ||
                    ""
                  )
                }

                ·

                ${
                  task.minutes ||
                  0
                }

                dk

              </div>

            </div>

          </div>

        `
          )
          .join("");

    }


    /* =====================================================
       PLAN - NORMAL SAVE
    ===================================================== */

    async function savePlan(){

      const select =
        document.getElementById(
          "planSubjects"
        );


      const subjects =
        Array.from(
          select.selectedOptions
        )
        .map(
          option =>
            option.value
        );


      if(!subjects.length){

        toast(
          "En az bir ders seç."
        );

        return;

      }


      const hours =
        Number(
          document.getElementById(
            "planHours"
          ).value
        ) || 0;


      const start =
        document.getElementById(
          "planStart"
        ).value ||
        "18:00";


      /*
        Yeni ders seçimlerini ana sisteme aktar.
      */

      selectedPlanSubjects =
        [...subjects];


      savePlanSubjectsLocal();


      const minutesPerSubject =
        Math.max(
          15,
          Math.floor(
            hours *
            60 /
            subjects.length
          )
        );


      /*
        Mevcut görevlerin tamamlanma durumunu koru.
      */

      const oldTasks =
        dailyPlan?.tasks ||
        [];


      const tasks =
        subjects.map(
          (
            subject,
            index
          ) => {

            const previous =
              oldTasks.find(
                task =>
                  task.subject ===
                  subject
              );


            const startMinutes =
              timeToMinutes(
                start
              ) +
              index *
              minutesPerSubject;


            return {

              id:
                previous?.id ||
                (
                  "task_" +
                  Date.now() +
                  "_" +
                  index
                ),

              date:
                today(),

              time:
                minutesToTime(
                  startMinutes
                ),

              subject,

              topic:
                previous?.topic ||
                "",

              minutes:
                minutesPerSubject,

              done:
                previous?.done ||
                false

            };

          }
        );


      const newPlan = {

        user_id:
          currentUser.id,

        plan_date:
          today(),

        hours,

        start_time:
          start,

        subjects,

        tasks,

        updated_at:
          new Date()
            .toISOString()

      };


      const {
        data,
        error
      } =
        await supabaseClient
          .from("daily_plans")
          .upsert(

            newPlan,

            {
              onConflict:
                "user_id,plan_date"
            }

          )
          .select()
          .single();


      if(error){

        console.error(error);

        toast(
          error.message
        );

        return;

      }


      dailyPlan =
        data || newPlan;


      saveLocal();

      renderPlan();

      renderHome();

      toast(
        "Plan kaydedildi 📅"
      );

    }


    async function toggleTask(id){

      if(!dailyPlan?.tasks)
        return;


      const task =
        dailyPlan.tasks.find(
          t =>
            String(t.id) ===
            String(id)
        );


      if(!task)
        return;


      task.done =
        !task.done;


      const {
        error
      } =
        await supabaseClient
          .from("daily_plans")
          .upsert(

            {

              ...dailyPlan,

              updated_at:
                new Date()
                  .toISOString()

            },

            {
              onConflict:
                "user_id,plan_date"
            }

          );


      if(error){

        console.error(error);

        task.done =
          !task.done;

        toast(
          "Görev güncellenemedi."
        );

        return;

      }


      saveLocal();

      renderPlanTasks();

      renderTodayTasks();

    }


    /* =====================================================
       QUESTIONS
    ===================================================== */

    async function addQuestion(){

      const subject =
        document.getElementById(
          "qSubject"
        ).value;

      const topic =
        document.getElementById(
          "qTopic"
        ).value.trim();

      const total =
        Number(
          document.getElementById(
            "qTotal"
          ).value
        ) || 0;

      const correct =
        Number(
          document.getElementById(
            "qCorrect"
          ).value
        ) || 0;

      const wrong =
        Number(
          document.getElementById(
            "qWrong"
          ).value
        ) || 0;

      const blank =
        Number(
          document.getElementById(
            "qBlank"
          ).value
        ) || 0;


      if(total <= 0){

        toast(
          "Toplam soru sayısını gir."
        );

        return;

      }


      if(
        correct +
        wrong +
        blank >
        total
      ){

        toast(
          "Doğru + yanlış + boş toplamı soru sayısını geçemez."
        );

        return;

      }


      const net =
        correct -
        wrong / 4;


      const row = {

        user_id:
          currentUser.id,

        date:
          today(),

        subject,

        topic,

        total,

        correct,

        wrong,

        blank,

        net:
          Number(
            net.toFixed(2)
          )

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
          error.message
        );

        return;

      }


      questions.unshift(
        data
      );


      saveLocal();


      document.getElementById(
        "qTopic"
      ).value = "";


      checkBadges();

      renderQuestions();

      renderHome();


      toast(
        "Soru kaydı eklendi 🎯"
      );

    }


    function renderQuestions(){

      const container =
        document.getElementById(
          "questionList"
        );


      if(!questions.length){

        container.innerHTML =
          `<div style="color:var(--muted)">
            Henüz soru kaydı yok.
          </div>`;

        return;

      }


      container.innerHTML =
        questions
          .slice(0,15)
          .map(
            q => `

            <div class="list-item">

              <div class="list-top">

                <div>

                  <div class="list-title">

                    ${
                      escapeHtml(
                        q.subject
                      )
                    }

                  </div>

                  <div class="list-meta">

                    ${
                      escapeHtml(
                        q.topic ||
                        "Konu belirtilmedi"
                      )
                    }

                    ·

                    ${
                      q.date ||
                      ""
                    }

                  </div>

                </div>

                <div class="net">

                  ${
                    Number(
                      q.net ||
                      0
                    ).toFixed(2)
                  }

                </div>

              </div>

              <div class="list-meta">

                ${
                  q.total
                }
                soru

                ·

                ${
                  q.correct
                }
                doğru

                ·

                ${
                  q.wrong
                }
                yanlış

                ·

                ${
                  q.blank
                }
                boş

              </div>

            </div>

          `
          )
          .join("");

    }


    /* =====================================================
       EXAMS
    ===================================================== */

    async function addExam(){

      const name =
        document.getElementById(
          "examName"
        ).value.trim();


      const date =
        document.getElementById(
          "examDate"
        ).value ||
        today();


      const type =
        document.getElementById(
          "examType"
        ).value;


      const turkish =
        Number(
          document.getElementById(
            "examTurkish"
          ).value
        ) || 0;


      const math =
        Number(
          document.getElementById(
            "examMath"
          ).value
        ) || 0;


      const science =
        Number(
          document.getElementById(
            "examScience"
          ).value
        ) || 0;


      const social =
        Number(
          document.getElementById(
            "examSocial"
          ).value
        ) || 0;


      if(!name){

        toast(
          "Deneme adı gir."
        );

        return;

      }


      const net =
        turkish +
        math +
        science +
        social;


      const row = {

        user_id:
          currentUser.id,

        name,

        date,

        type,

        turkish,

        math,

        science,

        social,

        net:
          Number(
            net.toFixed(2)
          )

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
          error.message
        );

        return;

      }


      exams.unshift(
        data
      );


      saveLocal();


      document.getElementById(
        "examName"
      ).value = "";


      checkBadges();

      renderExams();

      renderHome();


      toast(
        "Deneme kaydedildi 📊"
      );

    }


    function renderExams(){

      const container =
        document.getElementById(
          "examList"
        );


      if(!exams.length){

        container.innerHTML =
          `<div style="color:var(--muted)">
            Henüz deneme yok.
          </div>`;

        return;

      }


      container.innerHTML =
        exams
          .map(
            e => `

          <div class="list-item">

            <div class="list-top">

              <div>

                <div class="list-title">

                  ${
                    escapeHtml(
                      e.name
                    )
                  }

                </div>

                <div class="list-meta">

                  ${
                    e.type ||
                    ""
                  }

                  ·

                  ${
                    e.date ||
                    ""
                  }

                </div>

              </div>

              <div class="net">

                ${
                  Number(
                    e.net ||
                    0
                  ).toFixed(2)
                }

              </div>

            </div>

            <div class="list-meta">

              Türkçe ${
                e.turkish ||
                0
              }

              · Mat ${
                e.math ||
                0
              }

              · Fen ${
                e.science ||
                0
              }

              · Sosyal ${
                e.social ||
                0
              }

            </div>

          </div>

        `
          )
          .join("");

    }


    /* =====================================================
       FOCUS
    ===================================================== */

    function toggleFocus(){

      if(focusRunning){

        pauseFocus();

      }else{

        startFocus();

      }

    }


    function startFocus(){

      focusRunning = true;

      document.getElementById(
        "timerStart"
      ).textContent =
        "Durdur";


      focusInterval =
        setInterval(
          () => {

            if(
              focusSeconds >
              0
            ){

              focusSeconds--;

              updateTimer();

            }else{

              finishFocus();

            }

          },
          1000
        );

    }


    function pauseFocus(){

      focusRunning = false;

      clearInterval(
        focusInterval
      );

      document.getElementById(
        "timerStart"
      ).textContent =
        "Başlat";

    }


    function resetFocus(){

      pauseFocus();

      focusSeconds =
        1500;

      updateTimer();

    }


    async function finishFocus(){

      pauseFocus();

      focusSeconds =
        1500;

      updateTimer();


      const row = {

        user_id:
          currentUser.id,

        date:
          today(),

        minutes:25,

        seconds:0,

        task_id:null,

        label:
          "Odak çalışması"

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


      if(
        !error &&
        data
      ){

        studySessions.unshift(
          data
        );

      }


      saveLocal();

      checkBadges();

      renderHome();


      toast(
        "25 dakikalık çalışma tamamlandı! 🔥"
      );

    }


    function updateTimer(){

      const minutes =
        Math.floor(
          focusSeconds /
          60
        )
        .toString()
        .padStart(
          2,
          "0"
        );


      const seconds =
        (
          focusSeconds %
          60
        )
        .toString()
        .padStart(
          2,
          "0"
        );


      document.getElementById(
        "timer"
      ).textContent =
        minutes +
        ":" +
        seconds;

    }


    /* =====================================================
       BADGES
    ===================================================== */

    async function checkBadges(){

      const totalQuestions =
        questions.reduce(

          (sum,q) =>
            sum +
            Number(
              q.total ||
              0
            ),

          0

        );


      const keys = [];


      if(totalQuestions >= 1)
        keys.push("first");


      if(totalQuestions >= 100)
        keys.push("q100");


      if(totalQuestions >= 500)
        keys.push("q500");


      if(totalQuestions >= 1000)
        keys.push("q1000");


      if(exams.length >= 1)
        keys.push("exam");


      if(
        calculateStreak() >= 7
      )
        keys.push("streak7");


      const doneTopics =
        Object.values(topics)
          .filter(
            state =>
              state ===
              "done"
          )
          .length;


      if(
        doneTopics >= 25
      )
        keys.push("topics25");


      if(
        exams.some(
          exam =>
            Number(
              exam.net ||
              0
            ) >= 100
        )
      ){

        keys.push("net100");

      }


      for(
        const key of keys
      ){

        const exists =
          badges.some(
            b =>
              b.badge_key ===
              key
          );


        if(exists)
          continue;


        const {
          data,
          error
        } =
          await supabaseClient
            .from("badges")
            .insert({

              user_id:
                currentUser.id,

              badge_key:
                key

            })
            .select()
            .single();


        if(
          !error &&
          data
        ){

          badges.push(
            data
          );

        }

      }


      saveLocal();

      renderBadges();

    }


    function renderBadges(){

      const container =
        document.getElementById(
          "badgeList"
        );


      const earned =
        new Set(

          badges.map(
            b =>
              b.badge_key
          )

        );


      document.getElementById(
        "badgeCount"
      ).textContent =
        earned.size +
        " / " +
        BADGE_DEFINITIONS.length;


      container.innerHTML =
        BADGE_DEFINITIONS
          .map(
            badge => {

              const unlocked =
                earned.has(
                  badge.key
                );


              return `

              <div
                class="badge ${
                  unlocked
                    ? ""
                    : "locked"
                }">

                <div class="badge-icon">

                  ${
                    badge.icon
                  }

                </div>

                <div class="badge-name">

                  ${
                    badge.name
                  }

                </div>

                <div
                  style="
                    margin-top:5px;
                    color:var(--muted);
                    font-size:10px;
                  ">

                  ${
                    badge.description
                  }

                </div>

              </div>

            `;

            }
          )
          .join("");

    }


    /* =====================================================
       ADMIN
    ===================================================== */

    async function loadAdminStats(
      showMessage = true
    ){

      if(
        currentRole !== "admin" &&
        currentRole !== "coach"
      ){

        if(showMessage)
          toast(
            "Yetkin yok."
          );

        return;

      }


      try{

        const [

          profilesResult,

          questionsResult,

          examsResult,

          sessionsResult

        ] =
          await Promise.all([

            supabaseClient
              .from("profiles")
              .select("id"),

            supabaseClient
              .from("questions")
              .select("id"),

            supabaseClient
              .from("exams")
              .select("id"),

            supabaseClient
              .from("study_sessions")
              .select(
                "minutes,seconds"
              )

          ]);


        if(
          profilesResult.error
        )
          throw profilesResult.error;


        if(
          questionsResult.error
        )
          throw questionsResult.error;


        if(
          examsResult.error
        )
          throw examsResult.error;


        if(
          sessionsResult.error
        )
          throw sessionsResult.error;


        document.getElementById(
          "adminUsers"
        ).textContent =
          profilesResult.data
            ?.length ||
          0;


        document.getElementById(
          "adminQuestions"
        ).textContent =
          questionsResult.data
            ?.length ||
          0;


        document.getElementById(
          "adminExams"
        ).textContent =
          examsResult.data
            ?.length ||
          0;


        const minutes =
          (
            sessionsResult.data ||
            []
          )
          .reduce(

            (
              sum,
              s
            ) =>
              sum +
              Number(
                s.minutes ||
                0
              ) +
              Number(
                s.seconds ||
                0
              ) / 60,

            0

          );


        document.getElementById(
          "adminMinutes"
        ).textContent =
          Math.round(
            minutes
          );


        if(showMessage)
          toast(
            "Admin istatistikleri güncellendi."
          );


      }catch(error){

        console.error(error);

        if(showMessage)
          toast(
            error.message
          );

      }

    }


    /* =====================================================
       EXPORT / IMPORT
    ===================================================== */

    function exportData(){

      const data = {

        version:6,

        exportedAt:
          new Date()
            .toISOString(),

        profile,

        questions,

        exams,

        wrongs,

        topics,

        studySessions,

        dailyPlan,

        badges,

        selectedPlanSubjects

      };


      const blob =
        new Blob(

          [
            JSON.stringify(
              data,
              null,
              2
            )
          ],

          {
            type:
              "application/json"
          }

        );


      const url =
        URL.createObjectURL(
          blob
        );


      const a =
        document.createElement(
          "a"
        );


      a.href =
        url;


      a.download =
        "yks-kocum-yedek.json";


      a.click();


      URL.revokeObjectURL(
        url
      );


      toast(
        "Yedek dışa aktarıldı."
      );

    }


    async function importData(
      event
    ){

      const file =
        event.target.files?.[0];


      if(!file)
        return;


      try{

        const text =
          await file.text();


        const data =
          JSON.parse(text);


        if(data.profile)
          profile =
            data.profile;


        if(
          Array.isArray(
            data.questions
          )
        )
          questions =
            data.questions;


        if(
          Array.isArray(
            data.exams
          )
        )
          exams =
            data.exams;


        if(
          Array.isArray(
            data.wrongs
          )
        )
          wrongs =
            data.wrongs;


        if(data.topics)
          topics =
            data.topics;


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
