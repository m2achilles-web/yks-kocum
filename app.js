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

    let focusSeconds = Number(localStorage.getItem("yks_focus_remaining") || 1500);
    let focusRunning = localStorage.getItem("yks_focus_running") === "1";
    let focusInterval = null;
    let focusEndAt = Number(localStorage.getItem("yks_focus_end_at") || 0);
    let focusDuration = Number(localStorage.getItem("yks_focus_duration") || 1500);


    /*
      Yeni:
      Kullanıcının seçtiği plan dersleri
    */

    let selectedPlanSubjects = [];


    const today = () => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());

      const values = Object.fromEntries(
        parts
          .filter(part => part.type !== "literal")
          .map(part => [part.type, part.value])
      );

      return `${values.year}-${values.month}-${values.day}`;
    };


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
      "AYT Coğrafya",

      "YDT İngilizce",
      "YDT Almanca",
      "YDT Arapça"

    ];


    /* =====================================================
       DEFAULT PLAN SUBJECTS
    ===================================================== */

    const DEFAULT_PLAN_SUBJECTS = [

      "TYT Matematik",
      "TYT Türkçe"

    ];

    let activePlanGroup = "TYT";
    let activeQuestionGroup = "TYT";
    let planDraftSettings = {};

    function planGroupOf(subject){
      return String(subject || "").split(" ")[0].toUpperCase();
    }

    function switchQuestionGroup(group){
      activeQuestionGroup = group;
      document.querySelectorAll(".question-type-tab").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.questionGroup === group);
      });
      const select = document.getElementById("qSubject");
      if(select){
        const groups = Array.from(select.querySelectorAll("optgroup"));
        groups.forEach(g => {
          const isActive = String(g.label || "").trim().toUpperCase() === group;
          g.hidden = !isActive;
          g.querySelectorAll("option").forEach(o => o.hidden = !isActive);
        });
        const activeGroup = groups.find(g => String(g.label || "").trim().toUpperCase() === group);
        if(activeGroup && activeGroup.querySelector("option")){
          const first = activeGroup.querySelector("option");
          if(!select.value || !select.value.toUpperCase().startsWith(group + " ")) select.value = first.value;
        }
      }
    }

    function initQuestionGroup(){
      switchQuestionGroup(activeQuestionGroup);
    }

    function savePlanDraftLocal(){
      if(!currentUser) return;
      try{ localStorage.setItem("yksKocumV9_plan_draft_" + currentUser.id, JSON.stringify(planDraftSettings)); }catch(e){}
    }

    function loadPlanDraftLocal(){
      if(!currentUser) return;
      try{
        const raw = localStorage.getItem("yksKocumV9_plan_draft_" + currentUser.id);
        const parsed = raw ? JSON.parse(raw) : {};
        if(parsed && typeof parsed === "object") planDraftSettings = parsed;
      }catch(e){ planDraftSettings = {}; }
    }

    function filterPlanGroup(group){
      activePlanGroup = group;
      document.querySelectorAll(".plan-group-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.group === group));
      renderPlanSubjectEditor();
    }

    function setPlanDraft(subject, key, value){
      if(!planDraftSettings[subject]) planDraftSettings[subject] = {minutes:60, start:"18:00"};
      planDraftSettings[subject][key] = key === "minutes" ? Number(value) : value;
      savePlanDraftLocal();
      updatePlanDraft();
    }

    function updatePlanDraft(){
      const total = selectedPlanSubjects.reduce((sum, subject) => sum + Number(planDraftSettings[subject]?.minutes || 60), 0);
      const el = document.getElementById("planTotalHours");
      if(el) el.textContent = `${Math.floor(total/60)} saat ${total%60 ? total%60 + " dk" : ""}`.trim();
      updateSelectedPlanCount();
    }


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

      const userSuffix = currentUser?.id
        ? "_" + currentUser.id
        : "";

      return "yksKocumV6_" + name + userSuffix;

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

        const coachMoreCard = document.getElementById("coachPanelMoreCard");
        if(coachMoreCard) coachMoreCard.classList.remove("hidden");

      }else{

        badge.classList.add(
          "hidden"
        );

        section.classList.add(
          "hidden"
        );

        const coachMoreCard = document.getElementById("coachPanelMoreCard");
        if(coachMoreCard) coachMoreCard.classList.add("hidden");

      }

    }


    async function saveProfile(){

      if(!currentUser){
        toast("Önce giriş yapmalısın.");
        return;
      }

      const value = id => document.getElementById(id)?.value ?? "";
      const updated = {
        id: currentUser.id,
        username: value("profileUsername").trim() || "Öğrenci",
        field: value("profileField") || "Sayısal",
        target_rank: Number(value("profileRank")) || null,
        university: value("profileUniversity").trim(),
        department: value("profileDepartment").trim(),
        exam_date: value("profileExamDate") || null
      };

      const dailyHours = Number(value("profileHours")) || 0;
      const dailyQuestions = Number(value("profileQuestions")) || 0;

      // Önce temel profil alanlarını kaydet. Böylece eski Supabase şemasında
      // günlük hedef sütunları eksik olsa bile profilin tamamı başarısız olmaz.
      let { error } = await supabaseClient
        .from("profiles")
        .upsert(updated, { onConflict: "id" });

      if(error){
        console.error("Temel profil kaydedilemedi:", error);
        toast("Profil kaydedilemedi: " + (error.message || "Bilinmeyen hata"));
        return;
      }

      // Günlük hedefleri ayrı kaydet. Sütunlar eski veritabanında yoksa sadece
      // bu iki alan atlanır; kullanıcıya migration gerektiği açıkça bildirilir.
      let dailyError = null;
      const dailyResult = await supabaseClient
        .from("profiles")
        .update({ daily_hours: dailyHours, daily_questions: dailyQuestions })
        .eq("id", currentUser.id);
      dailyError = dailyResult.error || null;

      profile = {
        ...(profile || {}),
        ...updated,
        daily_hours: dailyHours,
        daily_questions: dailyQuestions
      };

      saveLocal();
      fillProfileUI();
      renderHome();

      if(dailyError){
        console.warn("Günlük hedef sütunları güncellenemedi:", dailyError);
        if(/daily_hours|daily_questions|schema cache|column/i.test(dailyError.message || "")){
          toast("Profil kaydedildi ✅ Günlük hedefler için Supabase migration'ını çalıştır.");
        }else{
          toast("Profil kaydedildi ✅ Günlük hedefler güncellenemedi.");
        }
      }else{
        toast("Profil kaydedildi ✅");
      }
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

        loadPlanDraftLocal();

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

      // Önce mevcut my_role RPC'sini dene. Eski projelerde RPC olmayabilir
      // veya farklı bir veri tipi dönebilir; bu durumda profil/metadata
      // üzerinden güvenli bir fallback kullanıyoruz.
      try{

        const { data, error } = await supabaseClient.rpc("my_role");

        if(!error && data){
          const raw = Array.isArray(data) ? data[0] : data;
          const roleValue = typeof raw === "object"
            ? (raw?.role || raw?.my_role || raw?.current_role)
            : raw;

          if(roleValue){
            currentRole = String(roleValue).toLowerCase().trim();
          }
        }

      }catch(e){
        console.warn("my_role RPC kullanılamadı, fallback deneniyor:", e);
      }

      // RPC user döndürdüyse bile profil rolünü kontrol et. Böylece
      // profiles.role = coach/admin olan eski kurulumlar da çalışır.
      if(!isStaff()){
        try{
          const { data: roleProfile, error: roleProfileError } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .maybeSingle();

          if(!roleProfileError && roleProfile?.role){
            currentRole = String(roleProfile.role).toLowerCase().trim();
          }
        }catch(e){
          console.warn("Profil rolü okunamadı:", e);
        }
      }

      // Son fallback: auth metadata içinde role varsa onu kullan.
      if(!isStaff()){
        const metadataRole =
          currentUser?.app_metadata?.role ||
          currentUser?.user_metadata?.role;

        if(metadataRole){
          currentRole = String(metadataRole).toLowerCase().trim();
        }
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

        // Profil satırı artık elimizde; rolü tekrar kontrol ederek eski
        // kurulumlarda profiles.role ile tanımlı koç/admin hesaplarını da yakala.
        if(!isStaff() && profile?.role){
          currentRole = String(profile.role).toLowerCase().trim();
          updateAdminBadge();
        }

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
        "profile",
        "more"

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

      if(page === "exams") {
        if(!document.querySelector("#examScoreFields .exam-net-input")) renderExamScoreFields();
        renderExams();
      }

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


    async function openCoachPanel(){
      if(!isStaff()){
        try{
          if(profile?.role) currentRole = String(profile.role).toLowerCase().trim();
          if(!isStaff()) await getRole();
        }catch(e){ console.warn(e); }
      }
      if(!isStaff()){ toast("Koç paneline erişim yetkin yok. Supabase profiles.role alanında coach veya admin olmalı."); return; }
      updateAdminBadge();
      showPage("profile");
      const admin = document.getElementById("adminSection");
      if(admin){
        admin.classList.remove("hidden");
        setTimeout(() => admin.scrollIntoView({behavior:"smooth", block:"start"}), 80);
      }
      loadAdminStats(false);
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
      const box = document.getElementById("planSubjectEditor");
      if(!box) return;
      if(!Object.keys(planDraftSettings).length) loadPlanDraftLocal();
      const visible = SUBJECTS.filter(subject => planGroupOf(subject) === activePlanGroup);
      box.innerHTML = visible.map(subject => {
        const checked = selectedPlanSubjects.includes(subject);
        const draft = planDraftSettings[subject] || {minutes:60, start:"18:00"};
        return `
          <div class="plan-subject-row ${checked ? "selected" : ""}">
            <label class="subject-check">
              <input type="checkbox" value="${escapeAttr(subject)}" ${checked ? "checked" : ""} onchange="togglePlanSubject(this)">
              <span>${escapeHtml(subject)}</span>
            </label>
            <select class="plan-duration" ${checked ? "" : "disabled"} onchange="setPlanDraft('${escapeAttr(subject)}','minutes',this.value)">
              ${[30,45,60,90,120,150,180,240].map(m => `<option value="${m}" ${Number(draft.minutes||60)===m?'selected':''}>${m} dk</option>`).join("")}
            </select>
            <input class="plan-start" type="time" value="${escapeAttr(draft.start || "18:00")}" ${checked ? "" : "disabled"} onchange="setPlanDraft('${escapeAttr(subject)}','start',this.value)">
          </div>`;
      }).join("");
      updatePlanDraft();
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
      const subject = input.value;
      if(input.checked){
        if(!selectedPlanSubjects.includes(subject)) selectedPlanSubjects.push(subject);
        if(!planDraftSettings[subject]) planDraftSettings[subject] = {minutes:60, start:"18:00"};
      }else{
        selectedPlanSubjects = selectedPlanSubjects.filter(item => item !== subject);
      }
      savePlanSubjectsLocal();
      savePlanDraftLocal();
      renderPlanSubjectEditor();
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

      if(!selectedPlanSubjects.length) loadPlanSubjects();
      if(!Object.keys(planDraftSettings).length) loadPlanDraftLocal();

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

            <button class="task-delete" type="button" title="Görevi sil" onclick="event.stopPropagation(); deleteTask('${escapeAttr(task.id)}')">🗑️</button>

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

            <button class="task-delete" type="button" title="Görevi sil" onclick="event.stopPropagation(); deleteTask('${escapeAttr(task.id)}')">🗑️</button>

          </div>

        `
          )
          .join("");

    }


    function renderAssignedHomeworks(){
      const box = document.getElementById("adminAssignedHomework");
      if(!box) return;
      const tasks = (dailyPlan?.tasks || []).filter(t => t && t.assigned_by);
      if(!tasks.length){ box.classList.add("hidden"); box.innerHTML=""; return; }
      box.classList.remove("hidden");
      box.innerHTML = `
        <div class="admin-assigned-title">🎓 Admin tarafından verilen ödevler</div>
        <div class="admin-assigned-list">${tasks.map(t => `
          <div class="admin-assigned-item ${t.done ? "done" : ""}">
            <div class="admin-assigned-icon">${t.done ? "✓" : "📚"}</div>
            <div class="admin-assigned-main">
              <strong>${escapeHtml(t.title || "Ödev")}</strong>
              <span>${escapeHtml(t.subject || "Genel")} ${t.topic ? "• " + escapeHtml(t.topic) : ""} • ${Number(t.minutes || 0)} dk</span>
            </div>
            <span class="admin-assigned-status">${t.done ? "Tamamlandı" : "Bekliyor"}</span>
          </div>`).join("")}</div>`;
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

      initQuestionGroup();

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

    let activeExamType = "TYT";

    function examFieldsFor(type){
      if(type === "AYT") return [
        ["AYT Matematik","math"],["AYT Fizik","physics"],["AYT Kimya","chemistry"],["AYT Biyoloji","biology"],
        ["AYT Edebiyat","literature"],["AYT Tarih","history"],["AYT Coğrafya","geography"]
      ];
      if(type === "YDT") return [["YDT Neti","ydt"]];
      return [["Türkçe","turkish"],["Matematik","math"],["Fen","science"],["Sosyal","social"]];
    }

    function switchExamType(type){
      activeExamType = type || "TYT";
      document.querySelectorAll(".exam-type-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.exam === activeExamType));
      const select = document.getElementById("examType");
      if(select) select.value = activeExamType;
      renderExamScoreFields();
      renderExams();
    }

    function renderExamScoreFields(){
      const box = document.getElementById("examScoreFields");
      if(!box) return;
      box.innerHTML = examFieldsFor(activeExamType).map(([label,key]) => `
        <div class="field exam-score-field">
          <label>${escapeHtml(label)} Neti</label>
          <input class="input exam-net-input" data-exam-key="${escapeAttr(key)}" type="number" min="0" step="0.25" value="0" oninput="updateExamTotal()">
        </div>`).join("");
      updateExamTotal();
    }

    function updateExamTotal(){
      const inputs = document.querySelectorAll("#examScoreFields .exam-net-input");
      let total = 0;
      inputs.forEach(input => total += Number(input.value) || 0);
      const max = activeExamType === "YDT" ? 80 : null;
      const info = document.getElementById("examTotalInfo");
      if(info) info.innerHTML = `Toplam net: <strong>${total.toFixed(2)}${max ? " / 80" : ""}</strong>`;
      return total;
    }

    async function addExam(){
      if(!currentUser) return;
      const name = document.getElementById("examName")?.value.trim();
      const date = document.getElementById("examDate")?.value || today();
      const type = document.getElementById("examType")?.value || activeExamType;
      activeExamType = type;
      if(!name){ toast("Deneme adı gir."); return; }

      const values = {};
      document.querySelectorAll("#examScoreFields .exam-net-input").forEach(input => {
        values[input.dataset.examKey] = Number(input.value) || 0;
      });
      if(type === "YDT" && (values.ydt || 0) > 80){ toast("YDT neti 80'i geçemez."); return; }

      const net = Object.values(values).reduce((sum,v) => sum + Number(v || 0), 0);
      const row = {
        user_id: currentUser.id, name, date, type,
        turkish: Number(values.turkish || 0),
        math: Number(values.math || 0),
        science: Number(values.science || 0),
        social: Number(values.social || 0),
        net: Number(net.toFixed(2)),
        details: JSON.stringify(values)
      };

      let result = await supabaseClient.from("exams").insert(row).select().single();
      if(result.error && /details/i.test(result.error.message || "")){
        const {details, ...legacyRow} = row;
        result = await supabaseClient.from("exams").insert(legacyRow).select().single();
      }
      if(result.error){ console.error(result.error); toast(result.error.message); return; }

      exams.unshift(result.data);
      saveLocal();
      document.getElementById("examName").value = "";
      renderExamScoreFields();
      checkBadges();
      renderExams();
      renderHome();
      toast("Deneme kaydedildi 📊");
    }

    function examDetailValues(e){
      try{
        if(e.details && typeof e.details === "string") return JSON.parse(e.details) || {};
        if(e.details && typeof e.details === "object") return e.details;
      }catch(err){}
      return {turkish:e.turkish, math:e.math, science:e.science, social:e.social};
    }

    function renderExamChart(){
      const box = document.getElementById("examChart");
      if(!box) return;
      const rows = exams.filter(e => (e.type || "TYT") === activeExamType).slice(0,10).reverse();
      if(!rows.length){ box.innerHTML = `<div class="exam-chart-empty">${activeExamType} için henüz deneme yok.</div>`; return; }
      const max = Math.max(1, ...rows.map(e => Number(e.net) || 0));
      box.innerHTML = rows.map(e => {
        const pct = Math.max(4, Math.min(100, (Number(e.net)||0) / max * 100));
        return `<div class="exam-chart-row"><div class="exam-chart-label">${escapeHtml(e.name || "Deneme")}<span>${Number(e.net||0).toFixed(2)}</span></div><div class="exam-chart-track"><div class="exam-chart-bar" style="width:${pct}%"></div></div></div>`;
      }).join("");
    }

    function renderExams(){
      const container = document.getElementById("examList");
      if(!container) return;
      const filtered = exams.filter(e => (e.type || "TYT") === activeExamType);
      const count = document.getElementById("examHistoryCount");
      if(count) count.textContent = `${filtered.length} kayıt`;
      if(!filtered.length) container.innerHTML = `<div style="color:var(--muted)">${activeExamType} için henüz deneme yok.</div>`;
      else container.innerHTML = filtered.slice(0,20).map(e => {
        const values = examDetailValues(e);
        const detail = examFieldsFor(activeExamType).map(([label,key]) => `${label}: ${Number(values[key] || 0).toFixed(2)}`).join(" · ");
        return `<div class="list-item"><div class="list-top"><div><div class="list-title">${escapeHtml(e.name || "Deneme")}</div><div class="list-meta">${escapeHtml(e.date || "")} · ${escapeHtml(e.type || activeExamType)}</div></div><div class="net">${Number(e.net || 0).toFixed(2)}</div></div><div class="list-meta">${escapeHtml(detail)}</div></div>`;
      }).join("");
      renderExamChart();
    }

    /* =====================================================
       FOCUS
    ===================================================== */

    function saveFocusState(){
      localStorage.setItem("yks_focus_remaining", String(Math.max(0, focusSeconds)));
      localStorage.setItem("yks_focus_running", focusRunning ? "1" : "0");
      localStorage.setItem("yks_focus_end_at", String(focusEndAt || 0));
      localStorage.setItem("yks_focus_duration", String(focusDuration));
    }
    function setFocusDuration(minutes){
      const value=Math.min(600,Math.max(1,Number(minutes)||25));
      if(focusRunning){ toast("Odak devam ederken süre değiştirilemez kanka."); const el=document.getElementById("focusMinutes"); if(el) el.value=Math.round(focusDuration/60); return; }
      focusDuration=Math.round(value*60); focusSeconds=focusDuration; saveFocusState(); updateTimer();
    }
    function toggleFocus(){ if(focusRunning) pauseFocus(); else startFocus(); }
    function startFocus(){
      if(focusSeconds<=0) focusSeconds=focusDuration;
      focusRunning=true; focusEndAt=Date.now()+focusSeconds*1000; saveFocusState();
      const btn=document.getElementById("timerStart"); if(btn) btn.textContent="Durdur";
      clearInterval(focusInterval); focusInterval=setInterval(updateFocusFromClock,250); updateFocusFromClock();
    }
    function updateFocusFromClock(){
      if(!focusRunning) return;
      focusSeconds=Math.max(0,Math.ceil((focusEndAt-Date.now())/1000)); updateTimer(); saveFocusState();
      if(focusSeconds<=0) finishFocus();
    }
    function pauseFocus(){
      if(focusRunning&&focusEndAt) focusSeconds=Math.max(0,Math.ceil((focusEndAt-Date.now())/1000));
      focusRunning=false; focusEndAt=0; clearInterval(focusInterval); focusInterval=null;
      const btn=document.getElementById("timerStart"); if(btn) btn.textContent="Başlat"; saveFocusState(); updateTimer();
    }
    function resetFocus(){ pauseFocus(); focusSeconds=focusDuration; saveFocusState(); updateTimer(); }
    async function finishFocus(){
      if(!focusRunning&&focusSeconds>0) return;
      focusRunning=false; focusEndAt=0; clearInterval(focusInterval); focusInterval=null; focusSeconds=0;
      const btn=document.getElementById("timerStart"); if(btn) btn.textContent="Başlat"; saveFocusState(); updateTimer();
      const total=Math.round(focusDuration);
      const row={user_id:currentUser.id,date:today(),minutes:Math.floor(total/60),seconds:total%60,task_id:null,label:"Odak çalışması"};
      const {data,error}=await supabaseClient.from("study_sessions").insert(row).select().single();
      if(!error&&data) studySessions.unshift(data); saveLocal(); checkBadges(); renderHome();
      toast(error?"Odak tamamlandı; kayıt sırasında bir sorun oldu.":"🎯 Odak tamamlandı, süre kaydedildi!");
      setTimeout(()=>{if(!focusRunning){focusSeconds=focusDuration;saveFocusState();updateTimer();}},500);
    }
    function updateTimer(){
      const total=Math.max(0,Math.floor(focusSeconds)); const el=document.getElementById("timer");
      if(el) el.textContent=String(Math.floor(total/60)).padStart(2,"0")+":"+String(total%60).padStart(2,"0");
      const input=document.getElementById("focusMinutes"); if(input&&!focusRunning) input.value=Math.round(focusDuration/60);
    }
    function restoreFocusTimer(){
      const input=document.getElementById("focusMinutes"); if(input) input.value=Math.round(focusDuration/60);
      if(focusRunning&&focusEndAt>Date.now()){ clearInterval(focusInterval); focusInterval=setInterval(updateFocusFromClock,250); updateFocusFromClock(); const btn=document.getElementById("timerStart"); if(btn) btn.textContent="Durdur"; }
      else if(focusRunning){ focusSeconds=0; finishFocus(); } else updateTimer();
    }
    window.addEventListener("load",restoreFocusTimer);

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
       ADMIN / ÖĞRENCİ YÖNETİMİ
    ===================================================== */

    let adminStudents = [];
    let adminStudentFilter = "";

    function isStaff(){
      return currentRole === "admin" || currentRole === "coach";
    }

    async function loadAdminStudents(){
      if(!isStaff()) return;

      const container = document.getElementById("adminStudentList");
      if(container) container.innerHTML = `<div style="color:var(--muted);padding:10px 0">Öğrenciler yükleniyor...</div>`;

      try{
        const { data: profilesData, error: profilesError } =
          await supabaseClient
            .from("profiles")
            .select("*")
            .order("username", { ascending:true });

        if(profilesError) throw profilesError;

        const profiles = profilesData || [];
        const ids = profiles.map(p => p.id).filter(Boolean);

        let plans = [], qs = [], examsData = [], sessions = [];

        if(ids.length){
          const [plansResult, qsResult, examsResult, sessionsResult] = await Promise.all([
            supabaseClient.from("daily_plans").select("user_id,plan_date,tasks").in("user_id", ids),
            supabaseClient.from("questions").select("id,user_id").in("user_id", ids),
            supabaseClient.from("exams").select("id,user_id,net").in("user_id", ids),
            supabaseClient.from("study_sessions").select("user_id,minutes,seconds,date,created_at").in("user_id", ids)
          ]);

          if(plansResult.error) console.warn("Admin plan verisi alınamadı:", plansResult.error);
          if(qsResult.error) console.warn("Admin soru verisi alınamadı:", qsResult.error);
          if(examsResult.error) console.warn("Admin deneme verisi alınamadı:", examsResult.error);
          if(sessionsResult.error) console.warn("Admin çalışma verisi alınamadı:", sessionsResult.error);

          plans = plansResult.data || [];
          qs = qsResult.data || [];
          examsData = examsResult.data || [];
          sessions = sessionsResult.data || [];
        }

        const byUser = {};
        profiles.forEach(p => {
          byUser[p.id] = {
            ...p,
            questionCount:0,
            examCount:0,
            studyMinutes:0,
            studyDaily:0,
            studyWeekly:0,
            studyMonthly:0,
            taskTotal:0,
            taskDone:0,
            lastPlanDate:null
          };
        });

        qs.forEach(q => { if(byUser[q.user_id]) byUser[q.user_id].questionCount++; });
        examsData.forEach(e => { if(byUser[e.user_id]) byUser[e.user_id].examCount++; });
        const now = new Date();
        const dayKey = now.toLocaleDateString("en-CA", {timeZone:"Europe/Istanbul"});
        const weekStart = new Date(now); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay()+6)%7));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        sessions.forEach(s => {
          if(!byUser[s.user_id]) return;
          const mins = Number(s.minutes || 0) + Number(s.seconds || 0) / 60;
          byUser[s.user_id].studyMinutes += mins;
          const rawDate = s.date || s.created_at;
          const d = rawDate ? new Date(String(rawDate).length===10 ? rawDate+"T00:00:00" : rawDate) : null;
          if(d && !Number.isNaN(d.getTime())){
            const localDay = d.toLocaleDateString("en-CA", {timeZone:"Europe/Istanbul"});
            if(localDay === dayKey) byUser[s.user_id].studyDaily += mins;
            if(d >= weekStart) byUser[s.user_id].studyWeekly += mins;
            if(d >= monthStart) byUser[s.user_id].studyMonthly += mins;
          }
        });
        plans.forEach(plan => {
          if(!byUser[plan.user_id]) return;
          const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
          byUser[plan.user_id].taskTotal += tasks.length;
          byUser[plan.user_id].taskDone += tasks.filter(t => t && t.done).length;
          if(plan.plan_date && (!byUser[plan.user_id].lastPlanDate || plan.plan_date > byUser[plan.user_id].lastPlanDate)){
            byUser[plan.user_id].lastPlanDate = plan.plan_date;
          }
        });

        adminStudents = Object.values(byUser);
        renderAdminStudents();

      }catch(error){
        console.error(error);
        if(container) container.innerHTML = `<div style="color:var(--danger);padding:10px 0">Öğrenciler yüklenemedi: ${escapeHtml(error?.message || "Bilinmeyen hata")}</div>`;
      }
    }

    function filterAdminStudents(value){
      adminStudentFilter = String(value || "").trim().toLocaleLowerCase("tr-TR");
      renderAdminStudents();
    }

    function renderAdminStudents(){
      const container = document.getElementById("adminStudentList");
      const countEl = document.getElementById("adminStudentCount");
      if(!container) return;

      const filtered = adminStudents.filter(student => {
        if(!adminStudentFilter) return true;
        const haystack = [
          student.username,
          student.email,
          student.field,
          student.university,
          student.department,
          student.target_rank,
          student.id
        ].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
        return haystack.includes(adminStudentFilter);
      });

      if(countEl) countEl.textContent = `${filtered.length} öğrenci`;

      if(!filtered.length){
        container.innerHTML = `<div style="color:var(--muted);padding:18px 0;text-align:center">${adminStudents.length ? "Aramana uygun öğrenci bulunamadı." : "Henüz öğrenci bulunmuyor."}</div>`;
        return;
      }

      container.innerHTML = filtered.map(student => {
        const progress = student.taskTotal ? Math.round(student.taskDone / student.taskTotal * 100) : 0;
        const name = student.username || "İsimsiz öğrenci";
        const email = student.email || "E-posta bilgisi yok";
        return `
          <div class="admin-student" onclick="showAdminStudent('${escapeAttr(student.id)}')">
            <div class="admin-student-avatar">${escapeHtml(name.charAt(0).toUpperCase())}</div>
            <div class="admin-student-main">
              <div class="admin-student-top">
                <strong>${escapeHtml(name)}</strong>
                <span class="admin-student-arrow">›</span>
              </div>
              <div class="admin-student-email">${escapeHtml(email)}</div>
              <div class="admin-student-meta">
                <span>${escapeHtml(student.field || "Alan yok")}</span>
                <span>•</span>
                <span>${student.questionCount} soru</span>
                <span>•</span>
                <span>G ${Math.round(student.studyDaily)} dk</span><span>H ${Math.round(student.studyWeekly)} dk</span><span>A ${Math.round(student.studyMonthly)} dk</span>
              </div>
              <div class="progress admin-student-progress"><div style="width:${progress}%"></div></div>
            </div>
          </div>`;
      }).join("");
    }

    async function showAdminStudent(id){
      const student = adminStudents.find(s => String(s.id) === String(id));
      if(!student) return;

      const modal = document.getElementById("adminStudentModal");
      const content = document.getElementById("adminStudentDetail");
      if(!modal || !content) return;

      modal.classList.remove("hidden");
      content.innerHTML = `<div class="admin-detail-loading">Öğrencinin koç verileri yükleniyor... ⏳</div>`;

      try{
        const [plansResult, questionsResult, examsResult, sessionsResult] = await Promise.all([
          supabaseClient.from("daily_plans").select("*").eq("user_id", student.id).order("plan_date", {ascending:false}),
          supabaseClient.from("questions").select("*").eq("user_id", student.id).order("date", {ascending:false}),
          supabaseClient.from("exams").select("*").eq("user_id", student.id).order("date", {ascending:false}),
          supabaseClient.from("study_sessions").select("*").eq("user_id", student.id).order("created_at", {ascending:false})
        ]);

        if(plansResult.error) throw plansResult.error;
        if(questionsResult.error) throw questionsResult.error;
        if(examsResult.error) throw examsResult.error;
        if(sessionsResult.error) throw sessionsResult.error;

        const plans = plansResult.data || [];
        const studentQuestions = questionsResult.data || [];
        const studentExams = examsResult.data || [];
        const sessions = sessionsResult.data || [];

        const allTasks = plans.flatMap(plan =>
          (Array.isArray(plan.tasks) ? plan.tasks : []).map(task => ({
            ...task,
            planDate: plan.plan_date
          }))
        );
        const doneTasks = allTasks.filter(t => t && t.done).length;
        const taskProgress = allTasks.length ? Math.round(doneTasks / allTasks.length * 100) : 0;
        const studyMinutes = sessions.reduce((sum, s) =>
          sum + Number(s.minutes || 0) + Number(s.seconds || 0) / 60, 0);

        const formatDate = value => {
          if(!value) return "-";
          const d = new Date(value + (String(value).length === 10 ? "T00:00:00" : ""));
          return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("tr-TR");
        };

        const taskRows = allTasks.slice(0, 30).map(task => `
          <div class="coach-row">
            <div class="coach-row-icon ${task.done ? "done" : ""}">${task.done ? "✓" : "○"}</div>
            <div class="coach-row-main">
              <strong>${escapeHtml(task.title || task.name || "Görev")}</strong>
              <span>${escapeHtml(task.subject || task.type || "Genel")} • ${escapeHtml(formatDate(task.planDate))}</span>
            </div>
          </div>`).join("");

        const examRows = studentExams.slice(0, 15).map(exam => `
          <div class="coach-row">
            <div class="coach-row-icon">📊</div>
            <div class="coach-row-main">
              <strong>${escapeHtml(exam.name || "Deneme")}</strong>
              <span>${escapeHtml(formatDate(exam.date))} • ${escapeHtml(String(exam.type || "Deneme"))} • Net: <b>${escapeHtml(String(exam.net ?? "-"))}</b></span>
            </div>
          </div>`).join("");

        const questionRows = studentQuestions.slice(0, 15).map(q => `
          <div class="coach-row">
            <div class="coach-row-icon">📝</div>
            <div class="coach-row-main">
              <strong>${escapeHtml(q.subject || "Ders")} — ${escapeHtml(q.topic || "Konu belirtilmemiş")}</strong>
              <span>${escapeHtml(formatDate(q.date))} • ${escapeHtml(String(q.total ?? 0))} soru • Doğru: ${escapeHtml(String(q.correct ?? 0))} • Yanlış: ${escapeHtml(String(q.wrong ?? 0))} • Net: ${escapeHtml(String(q.net ?? "-"))}</span>
            </div>
          </div>`).join("");

        content.innerHTML = `
          <div class="admin-detail-head">
            <div class="admin-student-avatar large">${escapeHtml((student.username || "Ö").charAt(0).toUpperCase())}</div>
            <div class="admin-detail-identity">
              <h3>${escapeHtml(student.username || "İsimsiz öğrenci")}</h3>
              <div class="admin-student-email">${escapeHtml(student.email || "E-posta bilgisi yok")}</div>
              <div class="admin-detail-badge">🎓 Koç görünümü</div>
            </div>
          </div>

          <div class="stats coach-stats" style="margin-top:14px">
            <div class="stat"><div class="stat-label">Çözülen soru</div><div class="stat-value">${studentQuestions.length}</div></div>
            <div class="stat"><div class="stat-label">Deneme</div><div class="stat-value">${studentExams.length}</div></div>
            <div class="stat"><div class="stat-label">Çalışma</div><div class="stat-value">${Math.round(studyMinutes)} dk</div></div>
            <div class="stat"><div class="stat-label">Görev</div><div class="stat-value">${taskProgress}%</div></div>
          </div>

          <div class="coach-period-grid">
            <div><span>Günlük</span><strong>${Math.round(student.studyDaily || 0)} dk</strong></div>
            <div><span>Haftalık</span><strong>${Math.round(student.studyWeekly || 0)} dk</strong></div>
            <div><span>Aylık</span><strong>${Math.round(student.studyMonthly || 0)} dk</strong></div>
          </div>

          <div class="admin-detail-grid">
            <div><span>Alan</span><strong>${escapeHtml(student.field || "-")}</strong></div>
            <div><span>Hedef sıralama</span><strong>${escapeHtml(student.target_rank || "-")}</strong></div>
            <div><span>Üniversite</span><strong>${escapeHtml(student.university || "-")}</strong></div>
            <div><span>Bölüm</span><strong>${escapeHtml(student.department || "-")}</strong></div>
            <div><span>Günlük saat</span><strong>${escapeHtml(String(student.daily_hours ?? "-"))}</strong></div>
            <div><span>Günlük soru</span><strong>${escapeHtml(String(student.daily_questions ?? "-"))}</strong></div>
          </div>

          <div class="coach-section">
            <div class="coach-section-head"><h4>📋 Görevler</h4><span>${doneTasks}/${allTasks.length} tamamlandı</span></div>
            <div class="progress coach-progress"><div style="width:${taskProgress}%"></div></div>
            <div class="coach-list">${taskRows || `<div class="coach-empty">Bu öğrencinin kayıtlı görevi yok.</div>`}</div>
          </div>

          <div class="coach-section">
            <div class="coach-section-head"><h4>📊 Denemeler</h4><span>${studentExams.length} kayıt</span></div>
            <div class="coach-list">${examRows || `<div class="coach-empty">Henüz deneme kaydı yok.</div>`}</div>
          </div>

          <div class="coach-section">
            <div class="coach-section-head"><h4>📝 Soru Çalışmaları</h4><span>${studentQuestions.length} kayıt</span></div>
            <div class="coach-list">${questionRows || `<div class="coach-empty">Henüz soru çalışması yok.</div>`}</div>
          </div>

          <div class="admin-detail-note">Son plan: ${escapeHtml(student.lastPlanDate || "Henüz plan yok")} • Toplam ${allTasks.length} görev</div>
        `;
      }catch(error){
        console.error(error);
        content.innerHTML = `<div class="admin-detail-error">Öğrenci verileri yüklenemedi.<br><small>${escapeHtml(error?.message || "Bilinmeyen hata")}</small></div>`;
      }
    }

    function applyHomeworkPreset(){
      const type = document.getElementById("adminHomeworkType")?.value || "custom";
      const title = document.getElementById("adminHomeworkTitle");
      const topic = document.getElementById("adminHomeworkTopic");
      const minutes = document.getElementById("adminHomeworkMinutes");
      const subject = document.getElementById("adminHomeworkSubject");
      if(!title || !minutes) return;
      const presets = {
        questions: {title:"20 Soru Çözümü", topic:"Belirlenen konudan 20 soru çöz", minutes:40},
        exam: {title:"1 Deneme Çözümü", topic:"Bir TYT/AYT denemesi çöz ve sonucunu kaydet", minutes:120},
        study: {title:"Konu Çalışması", topic:"Belirlenen konuyu çalış ve kısa tekrar yap", minutes:60},
        custom: {title:"", topic:"", minutes:30}
      };
      const p = presets[type] || presets.custom;
      title.value = p.title;
      topic.value = p.topic;
      minutes.value = p.minutes;
      if(type === "questions" && !subject.value) subject.value = "Matematik";
      if(type === "exam" && !subject.value) subject.value = "TYT";
    }

    async function assignHomeworkToStudent(studentId){
      if(!isStaff() || !currentUser){ toast("Yetkin yok."); return; }

      const student = adminStudents.find(s => String(s.id) === String(studentId));
      if(!student) return;

      const titleEl = document.getElementById("adminHomeworkTitle");
      const subjectEl = document.getElementById("adminHomeworkSubject");
      const topicEl = document.getElementById("adminHomeworkTopic");
      const dateEl = document.getElementById("adminHomeworkDate");
      const minutesEl = document.getElementById("adminHomeworkMinutes");
      const button = document.getElementById("adminHomeworkSubmit");

      const title = String(titleEl?.value || "").trim();
      const subject = String(subjectEl?.value || "").trim();
      const topic = String(topicEl?.value || "").trim();
      const planDate = String(dateEl?.value || today());
      const minutes = Math.max(5, Number(minutesEl?.value || 30));

      if(!title){ toast("Ödev başlığını yaz kanka."); titleEl?.focus(); return; }
      if(!planDate){ toast("Ödev tarihini seç."); return; }

      if(button){ button.disabled = true; button.textContent = "Gönderiliyor..."; }

      try{
        const { data: existingPlan, error: planError } = await supabaseClient
          .from("daily_plans")
          .select("*")
          .eq("user_id", student.id)
          .eq("plan_date", planDate)
          .maybeSingle();

        if(planError) throw planError;

        const oldTasks = Array.isArray(existingPlan?.tasks) ? existingPlan.tasks : [];
        const task = {
          id: "homework_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
          date: planDate,
          time: "",
          title,
          subject: subject || "Genel",
          topic,
          minutes,
          done: false,
          type: "homework",
          assigned_by: currentUser.id,
          assigned_at: new Date().toISOString()
        };

        const payload = existingPlan ? {
          ...existingPlan,
          tasks: [...oldTasks, task],
          updated_at: new Date().toISOString()
        } : {
          user_id: student.id,
          plan_date: planDate,
          hours: Number(student.daily_hours || 0),
          start_time: "09:00",
          subjects: subject ? [subject] : [],
          tasks: [task],
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseClient
          .from("daily_plans")
          .upsert(payload, { onConflict: "user_id,plan_date" })
          .select()
          .single();

        if(error) throw error;

        toast(`${student.username || "Öğrenci"} için ödev verildi. 📚`);
        if(titleEl) titleEl.value = "";
        if(topicEl) topicEl.value = "";
        if(minutesEl) minutesEl.value = "30";
        if(dateEl) dateEl.value = planDate;
        await loadAdminStudents();
        await showAdminStudent(student.id);
      }catch(error){
        console.error("Ödev verilemedi:", error);
        toast(error?.message || "Ödev verilirken hata oluştu.");
      }finally{
        if(button){ button.disabled = false; button.textContent = "📚 Ödevi Öğrenciye Ver"; }
      }
    }

    function closeAdminStudent(){
      document.getElementById("adminStudentModal")?.classList.add("hidden");
    }

    async function loadAdminStats(showMessage = true){
      if(!isStaff()){
        if(showMessage) toast("Yetkin yok.");
        return;
      }

      try{
        const [profilesResult, questionsResult, examsResult, sessionsResult] = await Promise.all([
          supabaseClient.from("profiles").select("id"),
          supabaseClient.from("questions").select("id"),
          supabaseClient.from("exams").select("id"),
          supabaseClient.from("study_sessions").select("minutes,seconds")
        ]);

        if(profilesResult.error) throw profilesResult.error;
        if(questionsResult.error) throw questionsResult.error;
        if(examsResult.error) throw examsResult.error;
        if(sessionsResult.error) throw sessionsResult.error;

        document.getElementById("adminUsers").textContent = profilesResult.data?.length || 0;
        document.getElementById("adminQuestions").textContent = questionsResult.data?.length || 0;
        document.getElementById("adminExams").textContent = examsResult.data?.length || 0;

        const minutes = (sessionsResult.data || []).reduce((sum, s) =>
          sum + Number(s.minutes || 0) + Number(s.seconds || 0) / 60, 0);
        document.getElementById("adminMinutes").textContent = Math.round(minutes);

        await loadAdminStudents();
        if(showMessage) toast("Admin paneli güncellendi. 👑");
      }catch(error){
        console.error(error);
        if(showMessage) toast(error.message || "Admin verileri yüklenemedi.");
      }
    }

    /* =====================================================
       GÖREV SİLME / TEMİZLEME
    ===================================================== */

    async function deleteTask(id){
      if(!dailyPlan?.tasks) return;
      const oldTasks = [...dailyPlan.tasks];
      const index = oldTasks.findIndex(t => String(t.id) === String(id));
      if(index < 0) return;

      if(!confirm("Bu görevi silmek istediğine emin misin?")) return;

      dailyPlan.tasks = oldTasks.filter((_, i) => i !== index);
      await persistDailyPlanTasks(oldTasks, "Görev silinemedi.");
    }

    async function clearAllTasks(){
      if(!dailyPlan?.tasks?.length){
        toast("Silinecek görev yok.");
        return;
      }
      if(!confirm("Bugünün TÜM görevleri silinecek. Emin misin?")) return;

      const oldTasks = [...dailyPlan.tasks];
      dailyPlan.tasks = [];
      await persistDailyPlanTasks(oldTasks, "Görevler temizlenemedi.");
    }

    async function persistDailyPlanTasks(previousTasks, errorMessage){
      const { data, error } = await supabaseClient
        .from("daily_plans")
        .upsert({
          ...dailyPlan,
          tasks: dailyPlan.tasks,
          updated_at: new Date().toISOString()
        }, { onConflict:"user_id,plan_date" })
        .select()
        .single();

      if(error){
        console.error(error);
        dailyPlan.tasks = previousTasks;
        toast(errorMessage);
        renderPlanTasks();
        renderTodayTasks();
        return false;
      }

      dailyPlan = data || dailyPlan;
      saveLocal();
      renderPlanTasks();
      renderTodayTasks();
      toast("Görev güncellendi. 🗑️");
      return true;
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
