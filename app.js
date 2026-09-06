let focusDuration = 1500;
let focusEndAt = 0;

// ===============================
// KONU TAKİP SİSTEMİ
// ===============================

const TOPIC_DATA = {
  TYT: {
    "Türkçe": [
      "Sözcükte Anlam",
      "Cümlede Anlam",
      "Paragraf",
      "Ses Bilgisi",
      "Yazım Kuralları",
      "Noktalama İşaretleri",
      "Sözcük Türleri",
      "İsimler",
      "Sıfatlar",
      "Zamirler",
      "Zarflar",
      "Edat - Bağlaç - Ünlem",
      "Fiiller",
      "Fiilimsiler",
      "Ekler",
      "Cümlenin Ögeleri",
      "Cümle Türleri",
      "Anlatım Bozuklukları"
    ],

    "Matematik": [
      "Temel Kavramlar",
      "Sayı Basamakları",
      "Bölme ve Bölünebilme",
      "EBOB - EKOK",
      "Rasyonel Sayılar",
      "Basit Eşitsizlikler",
      "Mutlak Değer",
      "Üslü Sayılar",
      "Köklü Sayılar",
      "Çarpanlara Ayırma",
      "Oran - Orantı",
      "Denklem Çözme",
      "Problemler",
      "Kümeler",
      "Kartezyen Çarpım",
      "Mantık",
      "Fonksiyonlar",
      "Permütasyon",
      "Kombinasyon",
      "Olasılık",
      "İstatistik"
    ],

    "Geometri": [
      "Doğruda Açılar",
      "Üçgende Açılar",
      "Üçgende Kenar - Açı İlişkileri",
      "Üçgende Alan",
      "Üçgende Benzerlik",
      "Dörtgenler",
      "Paralelkenar",
      "Dikdörtgen",
      "Kare",
      "Yamuk",
      "Çokgenler",
      "Çember ve Daire",
      "Analitik Geometri",
      "Katı Cisimler"
    ],

    "Fizik": [
      "Fizik Bilimine Giriş",
      "Madde ve Özellikleri",
      "Hareket ve Kuvvet",
      "Enerji",
      "Isı ve Sıcaklık",
      "Elektrik",
      "Manyetizma",
      "Basınç",
      "Kaldırma Kuvveti",
      "Dalgalar",
      "Optik"
    ],

    "Kimya": [
      "Kimya Bilimi",
      "Atom ve Periyodik Sistem",
      "Kimyasal Türler Arası Etkileşimler",
      "Maddenin Halleri",
      "Doğa ve Kimya",
      "Kimyanın Temel Kanunları",
      "Kimyasal Hesaplamalar",
      "Karışımlar",
      "Asitler, Bazlar ve Tuzlar",
      "Kimya Her Yerde"
    ],

    "Biyoloji": [
      "Biyoloji Bilimine Giriş",
      "Hücre",
      "Canlıların Temel Bileşenleri",
      "Hücre Bölünmeleri",
      "Kalıtım",
      "Ekosistem Ekolojisi",
      "Canlıların Sınıflandırılması",
      "Hücre Zarından Madde Geçişi",
      "Bitki Biyolojisi",
      "Canlılarda Enerji Dönüşümleri"
    ],

    "Tarih": [
      "Tarih Bilimine Giriş",
      "İlk Çağ Medeniyetleri",
      "İslamiyet Öncesi Türk Tarihi",
      "İslam Tarihi",
      "Türklerin İslamiyet'i Kabulü",
      "İlk Türk-İslam Devletleri",
      "Osmanlı Devleti",
      "Osmanlı Kültür ve Medeniyeti",
      "Milli Mücadele",
      "Atatürk İlke ve İnkılapları",
      "Cumhuriyet Dönemi"
    ],

    "Coğrafya": [
      "Doğa ve İnsan",
      "Dünya'nın Şekli ve Hareketleri",
      "Harita Bilgisi",
      "İklim Bilgisi",
      "Yer Şekilleri",
      "Nüfus",
      "Göç",
      "Yerleşme",
      "Türkiye'nin Coğrafi Konumu",
      "Türkiye'nin İklimi",
      "Ekonomik Faaliyetler",
      "Doğal Afetler"
    ],

    "Felsefe": [
      "Felsefeyi Tanıma",
      "Bilgi Felsefesi",
      "Bilim Felsefesi",
      "Varlık Felsefesi",
      "Ahlak Felsefesi",
      "Sanat Felsefesi",
      "Din Felsefesi",
      "Siyaset Felsefesi"
    ],

    "Din Kültürü": [
      "Bilgi ve İnanç",
      "Din ve İslam",
      "İslam ve İbadet",
      "Ahlak ve Değerler",
      "Allah - İnsan İlişkisi",
      "Hz. Muhammed",
      "Vahiy ve Akıl",
      "İslam Düşüncesinde Yorumlar"
    ]
  },

  AYT: {
    "Matematik": [
      "Fonksiyonlar",
      "Polinomlar",
      "İkinci Dereceden Denklemler",
      "Karmaşık Sayılar",
      "Parabol",
      "Eşitsizlikler",
      "Trigonometri",
      "Logaritma",
      "Diziler",
      "Limit",
      "Türev",
      "İntegral",
      "Permütasyon",
      "Kombinasyon",
      "Binom",
      "Olasılık"
    ],

    "Geometri": [
      "Üçgenler",
      "Dörtgenler",
      "Çokgenler",
      "Çember ve Daire",
      "Analitik Geometri",
      "Dönüşümler",
      "Katı Cisimler"
    ],

    "Fizik": [
      "Vektörler",
      "Kuvvet ve Hareket",
      "Newton Yasaları",
      "Bir Boyutta Hareket",
      "İki Boyutta Hareket",
      "Enerji ve Hareket",
      "İtme ve Momentum",
      "Tork ve Denge",
      "Elektrik Alan",
      "Elektriksel Potansiyel",
      "Manyetik Alan",
      "Elektromanyetik İndüksiyon",
      "Alternatif Akım",
      "Dalgalar",
      "Optik",
      "Modern Fizik",
      "Atom Fiziğine Giriş"
    ],

    "Kimya": [
      "Modern Atom Teorisi",
      "Gazlar",
      "Sıvı Çözeltiler",
      "Kimyasal Tepkimelerde Enerji",
      "Kimyasal Tepkimelerde Hız",
      "Kimyasal Denge",
      "Asit-Baz Dengesi",
      "Çözünürlük Dengesi",
      "Elektrokimya",
      "Organik Kimya"
    ],

    "Biyoloji": [
      "Sinir Sistemi",
      "Endokrin Sistem",
      "Duyu Organları",
      "Destek ve Hareket Sistemi",
      "Sindirim Sistemi",
      "Dolaşım Sistemi",
      "Solunum Sistemi",
      "Üriner Sistem",
      "Üreme Sistemi",
      "Embriyonik Gelişim",
      "Komünite ve Popülasyon Ekolojisi",
      "Genetik",
      "DNA ve RNA",
      "Protein Sentezi",
      "Fotosentez",
      "Hücresel Solunum",
      "Bitki Biyolojisi"
    ],

    "Türk Dili ve Edebiyatı": [
      "Edebiyat Bilgileri",
      "Şiir Bilgisi",
      "Söz Sanatları",
      "İslamiyet Öncesi Türk Edebiyatı",
      "Geçiş Dönemi",
      "Halk Edebiyatı",
      "Divan Edebiyatı",
      "Tanzimat Edebiyatı",
      "Servetifünun",
      "Fecriati",
      "Milli Edebiyat",
      "Cumhuriyet Dönemi",
      "Cumhuriyet Şiiri",
      "Cumhuriyet Romanı",
      "Cumhuriyet Tiyatrosu",
      "Edebi Akımlar",
      "Yazar - Eser Bilgisi"
    ],

    "Tarih": [
      "İlk Türk Devletleri",
      "Türk-İslam Devletleri",
      "Osmanlı Siyasi Tarihi",
      "Osmanlı Kültür ve Medeniyeti",
      "Avrupa Tarihi",
      "19. Yüzyılda Osmanlı",
      "20. Yüzyılda Osmanlı",
      "Milli Mücadele",
      "Atatürk Dönemi",
      "İkinci Dünya Savaşı",
      "Soğuk Savaş",
      "Çağdaş Türk ve Dünya Tarihi"
    ],

    "Coğrafya": [
      "Ekosistem",
      "Nüfus Politikaları",
      "Şehirleşme",
      "Ekonomik Faaliyetler",
      "Türkiye'nin Ekonomisi",
      "Tarım",
      "Hayvancılık",
      "Madenler ve Enerji",
      "Sanayi",
      "Ulaşım",
      "Ticaret",
      "Turizm",
      "Küresel Ticaret",
      "Çevre Sorunları",
      "Doğal Kaynaklar"
    ],

    "Felsefe Grubu": [
      "Felsefe",
      "Psikoloji",
      "Sosyoloji",
      "Mantık"
    ],

    "Din Kültürü": [
      "İslam Düşüncesinde Yorumlar",
      "İslam Felsefesi",
      "Din ve Bilim",
      "İslam ve Estetik",
      "Yaşayan Dinler",
      "Kur'an ve Yorumu"
    ]
  },

  YDT: {
    "İngilizce": [
      "Vocabulary",
      "Grammar",
      "Tenses",
      "Modals",
      "Passive Voice",
      "Conditionals",
      "Relative Clauses",
      "Noun Clauses",
      "Adjective Clauses",
      "Adverbs",
      "Prepositions",
      "Conjunctions",
      "Cloze Test",
      "Sentence Completion",
      "Paragraph Completion",
      "Translation",
      "Reading Comprehension",
      "Dialogue Completion",
      "Restatement",
      "Situation",
      "Odd One Out",
      "Irrelevant Sentence",
      "Paragraph Questions"
    ]
  }
};


// ===============================
// YARDIMCI FONKSİYONLAR
// ===============================

function topicKey(subject, topic){
  return `${subject}::${topic}`;
}


function normalizeTopicState(state){

  const s = String(state || "")
    .toLowerCase()
    .trim();

  if(
    s === "completed" ||
    s === "complete" ||
    s === "done" ||
    s === "tamamlandı" ||
    s === "tamamlandi"
  ){
    return "completed";
  }

  if(
    s === "in_progress" ||
    s === "in-progress" ||
    s === "progress" ||
    s === "devam" ||
    s === "devam ediyor"
  ){
    return "in_progress";
  }

  return "not_started";
}


function topicStateText(state){

  state = normalizeTopicState(state);

  if(state === "completed"){
    return "✅ Tamamlandı";
  }

  if(state === "in_progress"){
    return "🟡 Devam Ediyor";
  }

  return "⬜ Başlanmadı";
}


// ===============================
// TYT / AYT / YDT İLERLEME
// ===============================

function getPhaseStats(phase){

  let total = 0;
  let completed = 0;

  const subjects = TOPIC_DATA[phase] || {};

  Object.entries(subjects).forEach(
    ([subject, topicList]) => {

      total += topicList.length;

      topicList.forEach(topic => {

        const state = normalizeTopicState(
          topics[topicKey(subject, topic)]
        );

        if(state === "completed"){
          completed++;
        }

      });

    }
  );

  return {
    total,
    completed,
    percent: total
      ? Math.round((completed / total) * 100)
      : 0
  };
}


// ===============================
// KONU TAKİP ANA EKRANI
// ===============================

function renderTopicTracker(){

  const container =
    document.getElementById("topics") ||
    document.getElementById("topicTracker");

  if(!container){
    return;
  }

  const phases = [
    "TYT",
    "AYT",
    "YDT"
  ];

  let html = `

    <div class="topic-tracker">

      <div class="topic-header">

        <h2>📚 Konu Takip</h2>

        <p>
          Tüm YKS konularındaki ilerlemeni takip et.
        </p>

      </div>

      <div class="topic-overall">
  `;


  phases.forEach(phase => {

    const stats =
      getPhaseStats(phase);

    html += `

      <div class="topic-overall-card">

        <div class="topic-overall-title">
          ${phase}
        </div>

        <div class="topic-progress">

          <div
            class="topic-progress-fill"
            style="width:${stats.percent}%"
          ></div>

        </div>

        <strong>
          %${stats.percent}
        </strong>

        <small>
          ${stats.completed}/${stats.total} konu
        </small>

      </div>
    `;

  });


  html += `

      </div>

      <div class="topic-tabs">

        ${phases.map(
          (phase, index) => `

            <button
              class="topic-phase-btn ${
                index === 0 ? "active" : ""
              }"
              onclick="openTopicPhase('${phase}', this)"
            >
              ${phase}
            </button>

        `
        ).join("")}

      </div>

      <div id="topicPhaseContent"></div>

    </div>
  `;


  container.innerHTML = html;

  openTopicPhase("TYT");
}


// ===============================
// FAZ / DERSLER
// ===============================

function openTopicPhase(
  phase,
  button
){

  const content =
    document.getElementById(
      "topicPhaseContent"
    );

  if(!content){
    return;
  }


  document
    .querySelectorAll(
      ".topic-phase-btn"
    )
    .forEach(btn => {

      btn.classList.remove(
        "active"
      );

    });


  if(button){

    button.classList.add(
      "active"
    );

  }


  const subjects =
    TOPIC_DATA[phase] || {};


  let html = `

    <div class="topic-phase-title">

      <h3>
        ${phase} Konuları
      </h3>

      <span>
        ${Object.keys(subjects).length} ders
      </span>

    </div>
  `;


  Object.entries(subjects)
    .forEach(
      ([subject, topicList]) => {

        let completed = 0;


        topicList.forEach(topic => {

          const state =
            normalizeTopicState(
              topics[
                topicKey(
                  subject,
                  topic
                )
              ]
            );

          if(
            state === "completed"
          ){
            completed++;
          }

        });


        const percent =
          topicList.length
            ? Math.round(
                (
                  completed /
                  topicList.length
                ) * 100
              )
            : 0;


        html += `

          <div class="topic-subject-card">

            <div class="topic-subject-head">

              <div>

                <h4>
                  ${subject}
                </h4>

                <small>
                  ${completed}/${topicList.length}
                  tamamlandı
                </small>

              </div>

              <strong>
                %${percent}
              </strong>

            </div>


            <div class="topic-progress">

              <div
                class="topic-progress-fill"
                style="width:${percent}%"
              ></div>

            </div>


            <div class="topic-list">
        `;


        topicList.forEach(topic => {

          const key =
            topicKey(
              subject,
              topic
            );

          const state =
            normalizeTopicState(
              topics[key]
            );


          html += `

            <div class="topic-row">

              <span class="topic-name">
                ${topic}
              </span>

              <div class="topic-actions">

                <button
                  class="topic-state-btn ${
                    state === "not_started"
                      ? "selected"
                      : ""
                  }"
                  onclick="setTopicState(
                    '${escapeTopic(subject)}',
                    '${escapeTopic(topic)}',
                    'not_started'
                  )"
                  title="Başlanmadı"
                >
                  ⬜
                </button>


                <button
                  class="topic-state-btn ${
                    state === "in_progress"
                      ? "selected"
                      : ""
                  }"
                  onclick="setTopicState(
                    '${escapeTopic(subject)}',
                    '${escapeTopic(topic)}',
                    'in_progress'
                  )"
                  title="Devam Ediyor"
                >
                  🟡
                </button>


                <button
                  class="topic-state-btn ${
                    state === "completed"
                      ? "selected"
                      : ""
                  }"
                  onclick="setTopicState(
                    '${escapeTopic(subject)}',
                    '${escapeTopic(topic)}',
                    'completed'
                  )"
                  title="Tamamlandı"
                >
                  ✅
                </button>

              </div>

            </div>
          `;

        });


        html += `

            </div>

            <button
              class="topic-complete-all"
              onclick="completeAllTopics(
                '${escapeTopic(subject)}'
              )"
            >
              ✓ Bu dersin tümünü tamamla
            </button>

          </div>
        `;

      }
    );


  content.innerHTML = html;
}


// ===============================
// ESCAPE
// ===============================

function escapeTopic(value){

  return String(value)
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    );
}


// ===============================
// KONU DURUMU KAYDET
// ===============================

async function setTopicState(
  subject,
  topic,
  state
){

  if(!currentUser){

    if(typeof toast === "function"){
      toast(
        "Önce giriş yapmalısın."
      );
    }

    return;
  }


  const key =
    topicKey(
      subject,
      topic
    );

  const oldState =
    topics[key];


  // Önce ekranı güncelle
  topics[key] = state;

  saveLocal();

  renderTopicTracker();


  try {

    const {
      data: existing,
      error: findError
    } =
      await supabaseClient

        .from("topics")

        .select("id")

        .eq(
          "user_id",
          currentUser.id
        )

        .eq(
          "subject",
          subject
        )

        .eq(
          "topic",
          topic
        )

        .maybeSingle();


    if(findError){
      throw findError;
    }


    if(existing){

      const {
        error
      } =
        await supabaseClient

          .from("topics")

          .update({
            state: state
          })

          .eq(
            "id",
            existing.id
          );


      if(error){
        throw error;
      }

    }

    else{

      const {
        error
      } =
        await supabaseClient

          .from("topics")

          .insert({

            user_id:
              currentUser.id,

            subject:
              subject,

            topic:
              topic,

            state:
              state

          });


      if(error){
        throw error;
      }

    }


  }

  catch(error){

    console.error(
      "Konu kaydedilemedi:",
      error
    );


    topics[key] =
      oldState;


    saveLocal();

    renderTopicTracker();


    if(typeof toast === "function"){

      toast(
        "Konu kaydedilemedi."
      );

    }

  }

}


// ===============================
// DERSİ TAMAMLA
// ===============================

async function completeAllTopics(
  subject
){

  let phase = null;


  for(
    const p of Object.keys(
      TOPIC_DATA
    )
  ){

    if(
      TOPIC_DATA[p][subject]
    ){

      phase = p;

      break;
    }

  }


  if(!phase){
    return;
  }


  const topicList =
    TOPIC_DATA[phase][subject];


  for(
    const topic of topicList
  ){

    await setTopicState(
      subject,
      topic,
      "completed"
    );

  }


  if(typeof toast === "function"){

    toast(
      `${subject} tamamlandı! 🎉`
    );

  }


  renderTopicTracker();
}
