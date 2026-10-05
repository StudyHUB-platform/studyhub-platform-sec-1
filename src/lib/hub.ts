import {
  BookOpen,
  Bot,
  Calculator,
  ClipboardList,
  FileText,
  GraduationCap,
  Headset,
  Languages,
  ListChecks,
  Megaphone,
  StickyNote,
  Timer,
  Users,
  BarChart3,
  Youtube,
  Trophy,
  Layers,
} from "lucide-react";

export const FEATURES = [
  {
    to: "/library",
    label: "Study HUB Library",
    labelAr: "مكتبة Study HUB",
    desc: "ملخصات، كتب خارجية، مراجعات ونماذج استرشادية لكل المواد.",
    icon: BookOpen,
    emoji: "📚",
    tone: "tone-blue",
  },
  {
    to: "/ai",
    label: "Study HUB AI",
    labelAr: "مساعد الذكاء الاصطناعي",
    desc: "مساعدك الذكي للمذاكرة، حل الأسئلة، شرح الدروس وتبسيط المعلومات.",
    icon: Bot,
    emoji: "🤖",
    tone: "tone-gold",
  },
  {
    to: "/videos",
    label: "Study HUB Videos",
    labelAr: "فيديوهات Study HUB",
    desc: "فيديوهات الشرح والحل والمراجعات السريعة والشهرية والنهائية لكل مادة.",
    icon: Youtube,
    emoji: "🎬",
    tone: "tone-red",
  },
  {
    to: "/exams",
    label: "Exams",
    labelAr: "الامتحانات",
    desc: "امتحانات إلكترونية بمؤقت زمني وتصحيح فوري ونتيجة مفصلة.",
    icon: FileText,
    emoji: "📝",
    tone: "tone-orange",
  },
  {
    to: "/flashcards",
    label: "Flash Cards",
    labelAr: "بطاقات المراجعة",
    desc: "اكتب الأسئلة التي تخطئ فيها وراجعها بكروت تنقلب مثل الألعاب.",
    icon: Layers,
    emoji: "🃏",
    tone: "tone-bluegray",
  },
  {
    to: "/champions",
    label: "Study HUB Champions League",
    labelAr: "دوري أبطال Study HUB 🏆",
    desc: "بطولة تعليمية لـ16 متسابق بأربع جولات وخريطة مواجهات حتى النهائي.",
    icon: Trophy,
    emoji: "🏆",
    tone: "tone-magenta",
  },
  {
    to: "/todo",
    label: "To-Do List",
    labelAr: "قائمة المهام",
    desc: "نظّم مهامك اليومية بالأولوية والتاريخ وتابع إنجازك.",
    icon: ListChecks,
    emoji: "✅",
    tone: "tone-lime",
  },
  {
    to: "/focus",
    label: "Study Focus",
    labelAr: "التركيز الدراسي",
    desc: "مؤقت مذاكرة وبريك قصير وطويل مع وضع الشاشة الكاملة.",
    icon: Timer,
    emoji: "⏱️",
    tone: "tone-sky",
  },
  {
    to: "/notes",
    label: "Notes",
    labelAr: "الملاحظات",
    desc: "اكتب ملاحظاتك ورتبها في بوردات لكل مادة.",
    icon: StickyNote,
    emoji: "🗒️",
    tone: "tone-pink",
  },
  {
    to: "/translator",
    label: "Translator",
    labelAr: "المترجم",
    desc: "ترجمة فورية بين أكثر من 25 لغة بضغطة واحدة.",
    icon: Languages,
    emoji: "🌐",
    tone: "tone-teal",
  },
  {
    to: "/teachers",
    label: "Best Teachers",
    labelAr: "أفضل المعلمين",
    desc: "أفضل المعلمين والقنوات التعليمية مرتبين حسب المادة.",
    icon: GraduationCap,
    emoji: "👨‍🏫",
    tone: "tone-rose",
  },
  {
    to: "/calculator",
    label: "Calculator",
    labelAr: "الآلة الحاسبة",
    desc: "آلة حاسبة علمية للعمليات الأساسية والدوال المتقدمة.",
    icon: Calculator,
    emoji: "🧮",
    tone: "tone-yellow",
  },
  {
    to: "/community",
    label: "Community",
    labelAr: "المجتمع",
    desc: "جروبات وقنوات واتساب وتليجرام الخاصة بالمنصة.",
    icon: Users,
    emoji: "👥",
    tone: "tone-green",
  },
  {
    to: "/support",
    label: "Study HUB Support",
    labelAr: "الدعم الفني",
    desc: "تواصل مباشر مع فريق الدعم لأي مشكلة أو اقتراح.",
    icon: Headset,
    emoji: "🎧",
    tone: "tone-indigo",
  },
  {
    to: "/statistics",
    label: "Statistics",
    labelAr: "الإحصائيات",
    desc: "تابع وقت مذاكرتك، درجاتك، إجاباتك الصحيحة والخاطئة.",
    icon: BarChart3,
    emoji: "📊",
    tone: "tone-purple",
  },
  {
    to: "/updates",
    label: "Latest Updates",
    labelAr: "آخر التحديثات",
    desc: "كل جديد في المنصة من ميزات وملفات وامتحانات.",
    icon: Megaphone,
    emoji: "📢",
    tone: "tone-turquoise",
  },
] as const;

export const SIDEBAR_EXTRA = [
  { to: "/todo", label: "To-Do", icon: ClipboardList },
] as const;

export const LIBRARY_CATEGORIES = [
  "Summaries",
  "External Books",
  "Evaluation Books",
  "Monthly Reviews",
  "Final Reviews",
  "Guidance Models",
  "Study HUB Posters",
] as const;

export const LIBRARY_CATEGORY_LABELS: Record<string, string> = {
  Summaries: "✍️ ملخصات",
  "External Books": "📖 كتب خارجية",
  "Evaluation Books": "📝 كتب تقييم",
  "Monthly Reviews": "📅 مراجعات شهرية",
  "Final Reviews": "📝 مراجعات نهائية",
  "Guidance Models": "📋 نماذج استرشادية",
  "Study HUB Posters": "🖼️ بوسترات Study HUB",
};

export const CORE_SUBJECTS = [
  "Arabic",
  "English",
  "History",
  "Math",
  "Combined Science",
  "Philosophy",
  "Al-Azhar",
] as const;

export const OTHER_SUBJECTS = [
  "Programming & Computer Science",
  "Islamic Religious Education",
  "Christian Religious Education",
  "English AL",
  "French",
  "German",
] as const;

export const ALL_SUBJECTS = [...CORE_SUBJECTS, ...OTHER_SUBJECTS];

export const SUBJECT_EMOJI: Record<string, string> = {
  Arabic: "📝",
  English: "🇬🇧",
  History: "🏛️",
  Math: "➗",
  "Combined Science": "🔬",
  Philosophy: "🧠",
  "Al-Azhar": "🕌",
  "Programming & Computer Science": "💻",
  "Islamic Religious Education": "🕌",
  "Christian Religious Education": "✝️",
  "English AL": "🇬🇧",
  French: "🇫🇷",
  German: "🇩🇪",
};

export const SUBJECT_AR: Record<string, string> = {
  Arabic: "اللغة العربية",
  English: "اللغة الإنجليزية",
  History: "التاريخ",
  Math: "الرياضيات",
  "Combined Science": "العلوم المدمجة",
  Philosophy: "الفلسفة والمنطق",
  "Al-Azhar": "الأزهر",
  "Programming & Computer Science": "البرمجة وعلوم الحاسب",
  "Islamic Religious Education": "التربية الإسلامية",
  "Christian Religious Education": "التربية المسيحية",
  "English AL": "اللغة الإنجليزية المتقدمة",
  French: "اللغة الفرنسية",
  German: "اللغة الألمانية",
};

export const FILE_TYPES = ["PDF", "Image", "Link"] as const;

/** Study HUB Videos — أقسام الفيديوهات */
export const VIDEO_SECTIONS = [
  "Explanation & Solutions",
  "Quick Reviews",
  "Monthly Reviews",
  "Final Reviews",
] as const;

export const VIDEO_SECTION_LABELS: Record<string, string> = {
  "Explanation & Solutions": "شرح وحل",
  "Quick Reviews": "مراجعات سريعة",
  "Monthly Reviews": "المراجعات الشهرية",
  "Final Reviews": "المراجعات النهائية",
};

export const VIDEO_SECTION_EMOJI: Record<string, string> = {
  "Explanation & Solutions": "📝",
  "Quick Reviews": "⚡",
  "Monthly Reviews": "📅",
  "Final Reviews": "🎯",
};

export const VIDEO_SECTION_DESC: Record<string, string> = {
  "Explanation & Solutions": "شرح الدروس وحل الأسئلة والتدريبات الخاصة بالمادة.",
  "Quick Reviews": "فيديوهات قصيرة وسريعة لمراجعة أهم النقاط قبل الامتحان.",
  "Monthly Reviews": "مراجعة محتوى الشهر وتجميع أهم النقاط والأسئلة.",
  "Final Reviews": "المراجعة النهائية الشاملة للمادة والاستعداد للامتحانات.",
};

export const FILE_TYPE_EMOJI: Record<string, string> = {
  PDF: "📄",
  Video: "🎥",
  Image: "🖼️",
  Link: "🔗",
};

export const COMMUNITY_PLATFORMS = [
  "WhatsApp Community",
  "WhatsApp Group",
  "WhatsApp Channel",
  "Telegram Group",
  "Telegram Channel",
  "YouTube Channel",
] as const;

export const TRANSLATE_LANGUAGES = [
  "Arabic",
  "English",
  "French",
  "German",
  "Spanish",
  "Italian",
  "Turkish",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Hindi",
  "Urdu",
  "Persian",
  "Portuguese",
  "Dutch",
  "Swedish",
  "Greek",
  "Hebrew",
  "Indonesian",
  "Malay",
  "Polish",
  "Romanian",
  "Ukrainian",
  "Bengali",
] as const;
