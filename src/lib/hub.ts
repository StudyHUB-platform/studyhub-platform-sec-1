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
    to: "/exams",
    label: "Exams",
    labelAr: "الامتحانات",
    desc: "امتحانات إلكترونية بمؤقت زمني وتصحيح فوري ونتيجة مفصلة.",
    icon: FileText,
    emoji: "📝",
    tone: "tone-orange",
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
  "Programming & Computer Science": "البرمجة وعلوم الحاسب",
  "Islamic Religious Education": "التربية الإسلامية",
  "Christian Religious Education": "التربية المسيحية",
  "English AL": "اللغة الإنجليزية المتقدمة",
  French: "اللغة الفرنسية",
  German: "اللغة الألمانية",
};

export const FILE_TYPES = ["PDF", "Video", "Image", "Link"] as const;

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
