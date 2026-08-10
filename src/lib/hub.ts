import {
  BookOpen,
  Bot,
  Calculator,
  ClipboardList,
  FileText,
  GraduationCap,
  LifeBuoy,
  Languages,
  ListChecks,
  Megaphone,
  StickyNote,
  Timer,
  Users,
  BarChart3,
} from "lucide-react";

export const FEATURES = [
  { to: "/library", label: "Study HUB Library", labelAr: "مكتبة Study HUB", icon: BookOpen, emoji: "📚" },
  { to: "/ai", label: "Study HUB AI", labelAr: "مساعد الذكاء الاصطناعي", icon: Bot, emoji: "🤖" },
  { to: "/exams", label: "Exams", labelAr: "الامتحانات", icon: FileText, emoji: "📝" },
  { to: "/todo", label: "To-Do List", labelAr: "قائمة المهام", icon: ListChecks, emoji: "✅" },
  { to: "/focus", label: "Study Focus", labelAr: "التركيز الدراسي", icon: Timer, emoji: "⏱️" },
  { to: "/notes", label: "Notes", labelAr: "الملاحظات", icon: StickyNote, emoji: "🗒️" },
  { to: "/translator", label: "Translator", labelAr: "المترجم", icon: Languages, emoji: "🌐" },
  { to: "/teachers", label: "Best Teachers", labelAr: "أفضل المعلمين", icon: GraduationCap, emoji: "👨‍🏫" },
  { to: "/calculator", label: "Calculator", labelAr: "الآلة الحاسبة", icon: Calculator, emoji: "🧮" },
  { to: "/community", label: "Community", labelAr: "المجتمع", icon: Users, emoji: "👥" },
  { to: "/support", label: "Study HUB Support", labelAr: "الدعم الفني", icon: LifeBuoy, emoji: "🆘" },
  { to: "/statistics", label: "Statistics", labelAr: "الإحصائيات", icon: BarChart3, emoji: "📊" },
  { to: "/updates", label: "Latest Updates", labelAr: "آخر التحديثات", icon: Megaphone, emoji: "📰" },
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
  Arabic: "✍️",
  English: "🇬🇧",
  History: "🏺",
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
