// Curated name lexicon + helpers. Imported by the browser AND by scripts/build.mjs (no DOM access here).
// conf: "verified" = well-attested etymology; "likely" = widely held but family-dependent. Anything else is AI-generated and shown as unverified.

export const LM = {
  te: { n: 'Telugu', nat: 'తెలుగు', tts: 'te-IN' },
  hi: { n: 'Hindi', nat: 'हिन्दी', tts: 'hi-IN' },
  ta: { n: 'Tamil', nat: 'தமிழ்', tts: 'ta-IN' },
  ar: { n: 'Arabic', nat: 'العربية', tts: 'ar-SA' },
  zh: { n: 'Mandarin', nat: '中文', tts: 'zh-CN' },
  ja: { n: 'Japanese', nat: '日本語', tts: 'ja-JP' },
  ko: { n: 'Korean', nat: '한국어', tts: 'ko-KR' },
  ru: { n: 'Russian', nat: 'Русский', tts: 'ru-RU' },
  fr: { n: 'French', nat: 'Français', tts: 'fr-FR' },
  es: { n: 'Spanish', nat: 'Español', tts: 'es-ES' },
};
export const LM_ORDER = ['te', 'hi', 'ta', 'ar', 'zh', 'ja', 'ko', 'ru', 'fr', 'es'];

export const NAMES = {
  nikhil: {
    t: 'Nikhil', origin: 'Sanskrit निखिल (nikhila)', fam: 'Indo-Aryan', en: 'whole, entire, complete', conf: 'verified',
    note: 'Sanskrit nikhila means "entire, all". A widely used given name across India.',
    scripts: { te: 'నిఖిల్', hi: 'निखिल', ta: 'நிகில்', ar: 'نيخيل', zh: '尼基尔', ja: 'ニキル', ko: '니킬', ru: 'Нихил' },
    gloss: { te: 'సంపూర్ణమైన, మొత్తం', hi: 'संपूर्ण, समस्त', ta: 'முழுமையான', ar: 'كامل، شامل', zh: '完整、全部 (wánzhěng)', ja: '完全な・すべて (kanzen)', fr: 'entier, complet', es: 'entero, completo', ru: 'целый, полный' },
  },
  chary: {
    t: 'Chary', origin: 'Sanskrit आचार्य (ācārya) → Telugu/Tamil చారి / ஆசாரி', fam: 'Indo-Aryan → Dravidian usage', en: 'teacher, master, learned craftsman', conf: 'likely',
    note: 'A clipped form of ācārya, "one who teaches by example". Widely used as a surname or honorific in Telugu- and Tamil-speaking communities (notably among Vishwakarma families). Exact family lineage varies.',
    scripts: { te: 'చారి', hi: 'चारी', ta: 'சாரி', ar: 'تشاري', zh: '查里', ja: 'チャリー', ko: '차리', ru: 'Чари' },
    gloss: { te: 'ఆచార్యుడు, గురువు', hi: 'आचार्य, गुरु', ta: 'ஆசிரியர், ஆசாரி', ar: 'معلّم، أستاذ', zh: '导师、师傅', ja: '師匠・教師', fr: 'maître, enseignant', es: 'maestro, instructor', ru: 'наставник, учитель' },
  },
  sriramoju: {
    t: 'Sriramoju', origin: 'Telugu compound: శ్రీ (Sri) + రామ (Rama) + ఓజు (oju)', fam: 'Indo-Aryan + Dravidian usage', en: 'the auspicious Rama + "oju" (craftsman-teacher title)', conf: 'likely',
    note: 'Sri = auspicious, prosperity; Rama = pleasing, delightful (also the deity Rama). "Oju/Oja" is a Telugu family title commonly linked to Sanskrit upādhyāya/ojhā ("teacher"); the exact derivation of "oju" varies by family, so that part is marked Likely, not Verified.',
    parts: [
      { t: 'Sri', s: 'శ్రీ', m: 'auspicious, prosperity, honorific' },
      { t: 'Rama', s: 'రామ', m: 'pleasing, charming, delightful' },
      { t: 'Oju', s: 'ఓజు', m: 'teacher / craftsman title (likely)' },
    ],
    scripts: { te: 'శ్రీరామోజు', hi: 'श्रीरामोजू', ta: 'ஸ்ரீராமோஜு', ar: 'سريراموجو', zh: '斯里拉莫朱', ja: 'シュリーラモージュ', ko: '스리라모주', ru: 'Шрирамоджу' },
    gloss: { te: 'శ్రీ రాముని (పవిత్ర) + ఓజు (గురువు–శిల్పి బిరుదు)', hi: 'श्री राम + ओजू (गुरु–शिल्पी उपाधि)', ta: 'புனித ராமன் + ஓஜு (ஆசிரியர்–கலைஞர் பட்டம்)', ar: 'راما المقدّس + لقب «أوجو» (معلّم حِرفي)', zh: '神圣的罗摩 + “奥朱”(师匠称号)', ja: '聖なるラーマ+「オジュ」(師匠の称号)', fr: 'le saint Rama + « oju » (titre de maître-artisan)', es: 'el sagrado Rama + «oju» (título de maestro artesano)', ru: 'священный Рама + «оджу» (титул мастера-наставника)' },
  },
  rama: {
    t: 'Rama', origin: 'Sanskrit राम (rāma)', fam: 'Indo-Aryan', en: 'pleasing, charming, delightful', conf: 'verified',
    note: 'Also the name of the epic hero of the Ramayana.',
    scripts: { te: 'రామ', hi: 'राम', ta: 'ராமா', ar: 'راما', zh: '罗摩', ja: 'ラーマ', ko: '라마', ru: 'Рама' },
    gloss: { te: 'మనోహరుడు, ఆనందకరమైన', hi: 'मनोहर, सुखद', ta: 'மனங்கவரும்', ar: 'ساحر، مبهج', zh: '迷人的、令人愉悦的', ja: '魅力的な・喜ばしい', fr: 'charmant, délicieux', es: 'encantador, placentero', ru: 'очаровательный, приятный' },
  },
  arjun: {
    t: 'Arjun', origin: 'Sanskrit अर्जुन (arjuna)', fam: 'Indo-Aryan', en: 'bright, shining, white, clear', conf: 'verified',
    note: 'Name of the Pandava archer in the Mahabharata.',
    scripts: { te: 'అర్జున్', hi: 'अर्जुन', ta: 'அர்ஜுன்', ar: 'أرجون', zh: '阿尔琼', ja: 'アルジュン', ko: '아르준', ru: 'Арджун' },
    gloss: { te: 'ప్రకాశవంతమైన, తెల్లని', hi: 'उज्ज्वल, श्वेत', ta: 'ஒளிமிக்க', ar: 'مشرق، ناصع', zh: '明亮的、洁白的', ja: '輝く・白い', fr: 'brillant, clair', es: 'brillante, claro', ru: 'яркий, светлый' },
  },
  priya: {
    t: 'Priya', origin: 'Sanskrit प्रिया (priyā)', fam: 'Indo-Aryan', en: 'beloved, dear', conf: 'verified', note: 'Feminine form of priya, "dear".',
    scripts: { te: 'ప్రియ', hi: 'प्रिया', ta: 'பிரியா', ar: 'بريا', zh: '普丽娅', ja: 'プリヤ', ko: '프리야', ru: 'Прия' },
    gloss: { te: 'ప్రియమైన', hi: 'प्रिय, प्यारी', ta: 'அன்பான', ar: 'حبيبة', zh: '亲爱的', ja: '愛しい', fr: 'bien-aimée', es: 'querida', ru: 'любимая' },
  },
  muhammad: {
    t: 'Muhammad', origin: 'Arabic محمد (muḥammad), from the root ḥ-m-d "to praise"', fam: 'Semitic', en: 'praiseworthy, commendable', conf: 'verified',
    note: 'Passive participle of the root ḥ-m-d. Many spellings exist: Mohammed, Mohammad, Muhammed.',
    scripts: { te: 'ముహమ్మద్', hi: 'मुहम्मद', ta: 'முகமது', ar: 'محمد', zh: '穆罕默德', ja: 'ムハンマド', ko: '무함마드', ru: 'Мухаммед' },
    gloss: { te: 'ప్రశంసనీయుడు', hi: 'प्रशंसनीय', ta: 'புகழத்தக்கவர்', ar: 'الجدير بالحمد', zh: '值得赞美的', ja: '称賛に値する', fr: 'digne de louanges', es: 'digno de alabanza', ru: 'достойный хвалы' },
  },
  sofia: {
    t: 'Sofia', origin: 'Greek σοφία (sophía)', fam: 'Hellenic', en: 'wisdom', conf: 'verified', note: 'Spelled Sophia in many languages.',
    scripts: { te: 'సోఫియా', hi: 'सोफिया', ta: 'சோபியா', ar: 'صوفيا', zh: '索菲亚', ja: 'ソフィア', ko: '소피아', ru: 'София' },
    gloss: { te: 'జ్ఞానం', hi: 'प्रज्ञा, बुद्धि', ta: 'ஞானம்', ar: 'حكمة', zh: '智慧', ja: '知恵', fr: 'sagesse', es: 'sabiduría', ru: 'мудрость' },
  },
  wei: {
    t: 'Wei', origin: 'Chinese 伟 (wěi); other characters share the sound', fam: 'Sino-Tibetan', en: 'great, mighty (varies by character)', conf: 'likely',
    note: 'Pronounced alike by many characters (伟, 威, 维…); the meaning depends on the written character — a classic polysemy case.',
    scripts: { te: 'వే', hi: 'वेई', ta: 'வெய்', ar: 'وي', zh: '伟', ja: 'ウェイ', ko: '웨이', ru: 'Вэй' },
    gloss: { te: 'గొప్ప', hi: 'महान', ta: 'பெரிய', ar: 'عظيم', zh: '伟大、宏伟', ja: '偉大な', fr: 'grand, imposant', es: 'grande, imponente', ru: 'великий' },
  },
};
// --- additional curated names ---
Object.assign(NAMES, {
 "krishna": {
  "t": "Krishna",
  "origin": "Sanskrit कृष्ण (kṛṣṇa)",
  "fam": "Indo-Aryan",
  "en": "dark, black; all-attractive",
  "conf": "verified",
  "note": "Literally \"dark\". Name of the deity Krishna, traditionally also glossed \"all-attractive\".",
  "scripts": {
   "te": "కృష్ణ",
   "hi": "कृष्ण",
   "ta": "கிருஷ்ணா",
   "ar": "كريشنا",
   "zh": "克里希纳",
   "ja": "クリシュナ",
   "ko": "크리슈나",
   "ru": "Кришна"
  },
  "gloss": {
   "te": "నలుపు, ఆకర్షించేవాడు",
   "hi": "श्याम, सर्वाकर्षक",
   "ta": "கருமை, அனைவரையும் கவர்பவர்",
   "ar": "أسود، الجذّاب",
   "zh": "黑色的、有魅力的",
   "ja": "黒い・魅力に満ちた",
   "fr": "sombre, tout-attirant",
   "es": "oscuro, de atractivo universal",
   "ru": "тёмный, всепривлекающий"
  }
 },
 "lakshmi": {
  "t": "Lakshmi",
  "origin": "Sanskrit लक्ष्मी (lakṣmī)",
  "fam": "Indo-Aryan",
  "en": "sign, goal; prosperity, good fortune",
  "conf": "verified",
  "note": "Name of the goddess of wealth and fortune; from lakṣ \"to mark, to aim at\".",
  "scripts": {
   "te": "లక్ష్మి",
   "hi": "लक्ष्मी",
   "ta": "லட்சுமி",
   "ar": "لاكشمي",
   "zh": "拉克希米",
   "ja": "ラクシュミー",
   "ko": "락슈미",
   "ru": "Лакшми"
  },
  "gloss": {
   "te": "సిరి, సంపద",
   "hi": "समृद्धि, सौभाग्य",
   "ta": "செல்வம், அதிர்ஷ்டம்",
   "ar": "ازدهار، ثروة",
   "zh": "繁荣、财富",
   "ja": "繁栄・富",
   "fr": "prospérité, fortune",
   "es": "prosperidad, fortuna",
   "ru": "процветание, богатство"
  }
 },
 "ananya": {
  "t": "Ananya",
  "origin": "Sanskrit अनन्या (ananyā)",
  "fam": "Indo-Aryan",
  "en": "unique, without another",
  "conf": "verified",
  "note": "From an- \"not\" + anya \"other\": one of a kind. Used for girls.",
  "scripts": {
   "te": "అనన్య",
   "hi": "अनन्या",
   "ta": "அனன்யா",
   "ar": "أنانيا",
   "zh": "阿南雅",
   "ja": "アナーニャ",
   "ko": "아난야",
   "ru": "Ананья"
  },
  "gloss": {
   "te": "ప్రత్యేకమైన",
   "hi": "अद्वितीय",
   "ta": "தனித்துவமான",
   "ar": "فريدة، لا مثيل لها",
   "zh": "独一无二的",
   "ja": "唯一無二の",
   "fr": "unique",
   "es": "única",
   "ru": "уникальная"
  }
 },
 "aditya": {
  "t": "Aditya",
  "origin": "Sanskrit आदित्य (āditya)",
  "fam": "Indo-Aryan",
  "en": "son of Aditi; the sun",
  "conf": "verified",
  "note": "Epithet of the sun god, \"belonging to Aditi\". Common given name for boys.",
  "scripts": {
   "te": "ఆదిత్య",
   "hi": "आदित्य",
   "ta": "ஆதித்யா",
   "ar": "أديتيا",
   "zh": "阿迪蒂亚",
   "ja": "アーディティヤ",
   "ko": "아디티야",
   "ru": "Адитья"
  },
  "gloss": {
   "te": "సూర్యుడు",
   "hi": "सूर्य",
   "ta": "சூரியன்",
   "ar": "الشمس",
   "zh": "太阳",
   "ja": "太陽",
   "fr": "soleil",
   "es": "sol",
   "ru": "солнце"
  }
 },
 "kavya": {
  "t": "Kavya",
  "origin": "Sanskrit काव्य (kāvya)",
  "fam": "Indo-Aryan",
  "en": "poetry, poetic work",
  "conf": "verified",
  "note": "Kāvya is classical Sanskrit poetry; used as a feminine given name.",
  "scripts": {
   "te": "కావ్య",
   "hi": "काव्य",
   "ta": "காவ்யா",
   "ar": "كافيا",
   "zh": "卡维亚",
   "ja": "カヴィヤ",
   "ko": "카비야",
   "ru": "Кавья"
  },
  "gloss": {
   "te": "కవిత్వం, కావ్యం",
   "hi": "काव्य, कविता",
   "ta": "கவிதை",
   "ar": "شعر، قصيدة",
   "zh": "诗歌",
   "ja": "詩",
   "fr": "poésie",
   "es": "poesía",
   "ru": "поэзия"
  }
 },
 "ravi": {
  "t": "Ravi",
  "origin": "Sanskrit रवि (ravi)",
  "fam": "Indo-Aryan",
  "en": "the sun",
  "conf": "verified",
  "note": "A plain Sanskrit word for the sun; also the name of the sun god in some traditions.",
  "scripts": {
   "te": "రవి",
   "hi": "रवि",
   "ta": "ரவி",
   "ar": "رافي",
   "zh": "拉维",
   "ja": "ラヴィ",
   "ko": "라비",
   "ru": "Рави"
  },
  "gloss": {
   "te": "సూర్యుడు",
   "hi": "सूर्य",
   "ta": "சூரியன்",
   "ar": "الشمس",
   "zh": "太阳",
   "ja": "太陽",
   "fr": "soleil",
   "es": "sol",
   "ru": "солнце"
  }
 },
 "surya": {
  "t": "Surya",
  "origin": "Sanskrit सूर्य (sūrya)",
  "fam": "Indo-Aryan",
  "en": "the sun; the sun god",
  "conf": "verified",
  "note": "Name of the Vedic sun deity. Spelled Surya, Suriya or Soorya.",
  "scripts": {
   "te": "సూర్య",
   "hi": "सूर्य",
   "ta": "சூர்யா",
   "ar": "سورايا",
   "zh": "苏里亚",
   "ja": "スーリヤ",
   "ko": "수리야",
   "ru": "Сурья"
  },
  "gloss": {
   "te": "సూర్యుడు",
   "hi": "सूर्य",
   "ta": "சூரியன்",
   "ar": "الشمس",
   "zh": "太阳",
   "ja": "太陽",
   "fr": "soleil",
   "es": "sol",
   "ru": "солнце"
  }
 },
 "vikram": {
  "t": "Vikram",
  "origin": "Sanskrit विक्रम (vikrama)",
  "fam": "Indo-Aryan",
  "en": "valour, heroic stride",
  "conf": "verified",
  "note": "From vi- + kram \"to step\": a bold stride, hence courage. Also the name of the legendary king Vikramaditya.",
  "scripts": {
   "te": "విక్రమ్",
   "hi": "विक्रम",
   "ta": "விக்ரம்",
   "ar": "فيكرام",
   "zh": "维克拉姆",
   "ja": "ヴィクラム",
   "ko": "비크람",
   "ru": "Викрам"
  },
  "gloss": {
   "te": "శౌర్యం, పరాక్రమం",
   "hi": "पराक्रम, शौर्य",
   "ta": "வீரம்",
   "ar": "شجاعة، بسالة",
   "zh": "勇武、英勇",
   "ja": "武勇",
   "fr": "vaillance",
   "es": "valentía",
   "ru": "доблесть"
  }
 },
 "anil": {
  "t": "Anil",
  "origin": "Sanskrit अनिल (anila)",
  "fam": "Indo-Aryan",
  "en": "wind, air",
  "conf": "verified",
  "note": "Anila is the wind, also an epithet of the wind god Vayu.",
  "scripts": {
   "te": "అనిల్",
   "hi": "अनिल",
   "ta": "அனில்",
   "ar": "أنيل",
   "zh": "阿尼尔",
   "ja": "アニル",
   "ko": "아닐",
   "ru": "Анил"
  },
  "gloss": {
   "te": "గాలి",
   "hi": "वायु, पवन",
   "ta": "காற்று",
   "ar": "ريح، هواء",
   "zh": "风、空气",
   "ja": "風",
   "fr": "vent, air",
   "es": "viento, aire",
   "ru": "ветер"
  }
 },
 "deepak": {
  "t": "Deepak",
  "origin": "Sanskrit दीपक (dīpaka)",
  "fam": "Indo-Aryan",
  "en": "lamp; that which illuminates",
  "conf": "verified",
  "note": "From dīp \"to shine\". Spelled Deepak, Dipak or Deepak.",
  "scripts": {
   "te": "దీపక్",
   "hi": "दीपक",
   "ta": "தீபக்",
   "ar": "ديباك",
   "zh": "迪帕克",
   "ja": "ディーパク",
   "ko": "디팍",
   "ru": "Дипак"
  },
  "gloss": {
   "te": "దీపం",
   "hi": "दीपक, प्रकाश देने वाला",
   "ta": "விளக்கு",
   "ar": "مصباح، منير",
   "zh": "灯、照亮者",
   "ja": "灯火",
   "fr": "lampe, ce qui éclaire",
   "es": "lámpara, quien ilumina",
   "ru": "светильник"
  }
 },
 "sita": {
  "t": "Sita",
  "origin": "Sanskrit सीता (sītā)",
  "fam": "Indo-Aryan",
  "en": "furrow",
  "conf": "verified",
  "note": "Sītā is \"the furrow\", linked to the plough line in the Ramayana, where she is the heroine.",
  "scripts": {
   "te": "సీత",
   "hi": "सीता",
   "ta": "சீதை",
   "ar": "سيتا",
   "zh": "悉多",
   "ja": "シーター",
   "ko": "시타",
   "ru": "Сита"
  },
  "gloss": {
   "te": "నాగటి చాలు",
   "hi": "हल की रेखा",
   "ta": "உழவுசால்",
   "ar": "ثلم المحراث",
   "zh": "犁沟",
   "ja": "畝",
   "fr": "sillon",
   "es": "surco",
   "ru": "борозда"
  }
 },
 "ali": {
  "t": "Ali",
  "origin": "Arabic علي (ʿalī)",
  "fam": "Semitic",
  "en": "high, elevated, noble",
  "conf": "verified",
  "note": "From the root ʿ-l-w \"to be high\". Widely used across the Muslim world; also a Turkish and South Asian given name.",
  "scripts": {
   "te": "అలీ",
   "hi": "अली",
   "ta": "அலி",
   "ar": "علي",
   "zh": "阿里",
   "ja": "アリー",
   "ko": "알리",
   "ru": "Али"
  },
  "gloss": {
   "te": "ఉన్నతమైన",
   "hi": "उच्च, श्रेष्ठ",
   "ta": "உயர்ந்த",
   "ar": "عالٍ، رفيع",
   "zh": "崇高的",
   "ja": "高貴な",
   "fr": "élevé, noble",
   "es": "elevado, noble",
   "ru": "высокий, возвышенный"
  }
 },
 "aisha": {
  "t": "Aisha",
  "origin": "Arabic عائشة (ʿāʾisha)",
  "fam": "Semitic",
  "en": "living, alive",
  "conf": "likely",
  "note": "Usually derived from the root ʿ-y-sh \"to live\"; meanings such as \"prosperous\" also appear. Spellings: Aisha, Ayesha, Aysha.",
  "scripts": {
   "te": "ఆయిషా",
   "hi": "आइशा",
   "ta": "ஆயிஷா",
   "ar": "عائشة",
   "zh": "艾莎",
   "ja": "アイシャ",
   "ko": "아이샤",
   "ru": "Аиша"
  },
  "gloss": {
   "te": "జీవించే",
   "hi": "जीवित",
   "ta": "உயிருள்ள",
   "ar": "الحيّة",
   "zh": "有生命的",
   "ja": "生きている",
   "fr": "vivante",
   "es": "viva",
   "ru": "живая"
  }
 },
 "alexander": {
  "t": "Alexander",
  "origin": "Greek Ἀλέξανδρος (Aléxandros)",
  "fam": "Hellenic",
  "en": "defender of men",
  "conf": "verified",
  "note": "From alexein \"to defend\" + anēr, andros \"man\". Alexandra is the feminine form; Sikandar and Iskandar are the Persian and Arabic forms.",
  "scripts": {
   "te": "అలెగ్జాండర్",
   "hi": "अलेक्जेंडर",
   "ta": "அலெக்சாண்டர்",
   "ar": "الإسكندر",
   "zh": "亚历山大",
   "ja": "アレクサンダー",
   "ko": "알렉산더",
   "ru": "Александр"
  },
  "gloss": {
   "te": "మానవుల రక్షకుడు",
   "hi": "मनुष्यों का रक्षक",
   "ta": "மனிதர்களின் காவலன்",
   "ar": "حامي الرجال",
   "zh": "人类的保卫者",
   "ja": "人々の守護者",
   "fr": "défenseur des hommes",
   "es": "defensor de los hombres",
   "ru": "защитник людей"
  }
 },
 "daniel": {
  "t": "Daniel",
  "origin": "Hebrew דניאל (Dāniyyēʾl)",
  "fam": "Semitic",
  "en": "God is my judge",
  "conf": "verified",
  "note": "From dan \"he judged\" + El \"God\". Biblical prophet; also Danyal in Arabic and Persian.",
  "scripts": {
   "te": "డేనియల్",
   "hi": "डैनियल",
   "ta": "டேனியல்",
   "ar": "دانيال",
   "zh": "丹尼尔",
   "ja": "ダニエル",
   "ko": "다니엘",
   "ru": "Даниил"
  },
  "gloss": {
   "te": "దేవుడే నా న్యాయమూర్తి",
   "hi": "परमेश्वर मेरा न्यायाधीश है",
   "ta": "கடவுளே என் நீதிபதி",
   "ar": "الله قاضيّ",
   "zh": "神是我的审判者",
   "ja": "神はわが裁き主",
   "fr": "Dieu est mon juge",
   "es": "Dios es mi juez",
   "ru": "Бог — мой судья"
  }
 },
 "anna": {
  "t": "Anna",
  "origin": "Hebrew חַנָּה (Ḥannāh)",
  "fam": "Semitic",
  "en": "grace, favour",
  "conf": "verified",
  "note": "Anna is the Greek and Latin form of Hannah. Unrelated homonym: Sanskrit anna means \"food\".",
  "scripts": {
   "te": "అన్నా",
   "hi": "अन्ना",
   "ta": "அன்னா",
   "ar": "آنا",
   "zh": "安娜",
   "ja": "アンナ",
   "ko": "안나",
   "ru": "Анна"
  },
  "gloss": {
   "te": "దయ, కరుణ",
   "hi": "अनुग्रह, कृपा",
   "ta": "அருள்",
   "ar": "نعمة، لطف",
   "zh": "恩典、优雅",
   "ja": "恵み",
   "fr": "grâce, faveur",
   "es": "gracia, favor",
   "ru": "милость, благодать"
  }
 },
  nani: {
    t: 'Nani', origin: 'Telugu నాని (affectionate pet name); also Hindi/Urdu nānī', fam: 'Dravidian / Indo-Aryan', en: 'pet name, "dear one" (Telugu); maternal grandmother (Hindi/Urdu)', conf: 'likely',
    note: 'In Telugu-speaking regions Nani is mostly an affectionate short name or nickname given to a child and often kept as a stage name; it is not a single fixed dictionary word. In Hindi and Urdu, nānī means maternal grandmother. Meaning depends on usage.',
    scripts: { te: 'నాని', hi: 'नानी', ta: 'நானி', ar: 'ناني', zh: '纳尼', ja: 'ナニ', ko: '나니', ru: 'Нани' },
    gloss: { te: 'ముద్దు పేరు', hi: 'प्यार का नाम; नानी', ta: 'செல்லப் பெயர்', ar: 'اسم تدليل', zh: '昵称、爱称', ja: '愛称', fr: 'petit nom affectueux', es: 'apodo cariñoso', ru: 'ласковое прозвище' },
  },
  ravi: {
    t: 'Ravi', origin: 'Sanskrit रवि (ravi)', fam: 'Indo-Aryan', en: 'the sun', conf: 'verified', note: 'A classical Sanskrit word for the sun, widely used across India as a masculine name.',
    scripts: { te: 'రవి', hi: 'रवि', ta: 'ரவி', ar: 'رافي', zh: '拉维', ja: 'ラヴィ', ko: '라비', ru: 'Рави' },
    gloss: { te: 'సూర్యుడు', hi: 'सूर्य', ta: 'சூரியன்', ar: 'الشمس', zh: '太阳', ja: '太陽', fr: 'le soleil', es: 'el sol', ru: 'солнце' },
  },
  kiran: {
    t: 'Kiran', origin: 'Sanskrit किरण (kiraṇa)', fam: 'Indo-Aryan', en: 'ray of light', conf: 'verified', note: 'Used for both men and women across India.',
    scripts: { te: 'కిరణ్', hi: 'किरण', ta: 'கிரண்', ar: 'كيران', zh: '基兰', ja: 'キラン', ko: '키란', ru: 'Киран' },
    gloss: { te: 'కాంతి కిరణం', hi: 'प्रकाश की किरण', ta: 'ஒளிக்கதிர்', ar: 'شعاع ضوء', zh: '光线', ja: '光線', fr: 'rayon de lumière', es: 'rayo de luz', ru: 'луч света' },
  },
  anil: {
    t: 'Anil', origin: 'Sanskrit अनिल (anila)', fam: 'Indo-Aryan', en: 'wind, air', conf: 'verified', note: 'Anila is also a name of the wind deity Vayu.',
    scripts: { te: 'అనిల్', hi: 'अनिल', ta: 'அனில்', ar: 'أنيل', zh: '阿尼尔', ja: 'アニル', ko: '아닐', ru: 'Анил' },
    gloss: { te: 'గాలి', hi: 'वायु, हवा', ta: 'காற்று', ar: 'الريح', zh: '风', ja: '風', fr: 'vent, air', es: 'viento', ru: 'ветер' },
  },
  teja: {
    t: 'Teja', origin: 'Sanskrit तेजस् (tejas)', fam: 'Indo-Aryan', en: 'radiance, brilliance', conf: 'verified', note: 'Popular in Telugu-speaking states, often as Teja or Tejaswi.',
    scripts: { te: 'తేజ', hi: 'तेज', ta: 'தேஜா', ar: 'تيجا', zh: '特贾', ja: 'テージャ', ko: '테자', ru: 'Теджа' },
    gloss: { te: 'తేజస్సు, కాంతి', hi: 'तेज, चमक', ta: 'ஒளி, பிரகாசம்', ar: 'إشراق', zh: '光辉', ja: '輝き', fr: 'éclat', es: 'resplandor', ru: 'сияние' },
  },
  harsha: {
    t: 'Harsha', origin: 'Sanskrit हर्ष (harṣa)', fam: 'Indo-Aryan', en: 'joy, delight', conf: 'verified', note: 'Also the name of the 7th-century emperor Harsha of Kanauj.',
    scripts: { te: 'హర్ష', hi: 'हर्ष', ta: 'ஹர்ஷா', ar: 'هارشا', zh: '哈莎', ja: 'ハルシャ', ko: '하르샤', ru: 'Харша' },
    gloss: { te: 'ఆనందం', hi: 'आनंद, हर्ष', ta: 'மகிழ்ச்சி', ar: 'فرح', zh: '喜悦', ja: '喜び', fr: 'joie', es: 'alegría', ru: 'радость' },
  },
  sai: {
    t: 'Sai', origin: 'Indian usage, popularised by Sai Baba of Shirdi (etymology debated)', fam: 'Indian (disputed)', en: 'saint, revered one (as used in Sai Baba)', conf: 'likely', note: 'Very common in Telugu states after Sai Baba of Shirdi. The etymology of "Sai" is debated; one account derives it from Persian sā\'ī, "mendicant".',
    scripts: { te: 'సాయి', hi: 'साई', ta: 'சாய்', ar: 'ساي', zh: '赛', ja: 'サイ', ko: '사이', ru: 'Саи' },
    gloss: { te: 'పూజనీయుడు, సాధువు', hi: 'संत, पूज्य', ta: 'துறவி', ar: 'قديس', zh: '圣者', ja: '聖者', fr: 'saint, vénéré', es: 'santo, venerado', ru: 'святой' },
  }
});
for (const [key, v] of Object.entries(NAMES)) v.key = key;

export const ALIAS = { mohammed: 'muhammad', mohammad: 'muhammad', muhammed: 'muhammad', mohamed: 'muhammad', arjuna: 'arjun', sophia: 'sofia', sriram: 'sriramoju', nikhill: 'nikhil', chari: 'chary', laxmi: 'lakshmi', ayesha: 'aisha', aaisha: 'aisha', sitha: 'sita', danial: 'daniel', suriya: 'surya', soorya: 'surya', deepack: 'deepak', dipak: 'deepak', iskandar: 'alexander', sikandar: 'alexander', hannah: 'anna' };

export const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

const lev = (a, b) => {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
};

export function findName(raw) {
  const k = norm(raw);
  if (k && NAMES[k]) return NAMES[k];
  if (k && ALIAS[k]) return NAMES[ALIAS[k]];
  const trimmed = String(raw).trim();
  for (const n of Object.values(NAMES)) if (Object.values(n.scripts).includes(trimmed)) return n;
  return null;
}

export function suggest(raw) {
  const k = norm(raw);
  if (k.length < 4) return null;
  let best = null, bd = 2;
  for (const key of Object.keys(NAMES)) { const d = lev(k, key); if (d < bd) { bd = d; best = NAMES[key]; } }
  return best;
}

export const numMean = {
  1: 'Leader, initiator', 2: 'Diplomat, harmony-seeker', 3: 'Expressive, creative', 4: 'Builder, disciplined', 5: 'Adaptable, free-spirited',
  6: 'Nurturer, responsible', 7: 'Seeker, analytical', 8: 'Achiever, authoritative', 9: 'Humanitarian, complete',
  11: 'Master number: intuitive illuminator', 22: 'Master number: master builder', 33: 'Master number: master teacher',
};

export function numerology(s) {
  const l = norm(s);
  if (!l) return null;
  let sum = 0;
  for (const c of l) sum += ((c.charCodeAt(0) - 97) % 9) + 1;
  let n = sum;
  while (n > 9 && ![11, 22, 33].includes(n)) n = String(n).split('').reduce((a, b) => a + +b, 0);
  return { sum, n, m: numMean[n] };
}
