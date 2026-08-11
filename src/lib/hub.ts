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
  { to: "/library", label: "Study HUB Library", labelAr: "مكتبة Study HUB", icon: BookOpen, emoji: "📚", tone: "tone-blue" },
  { to: "/ai", label: "Study HUB AI", labelAr: "مساعد الذكاء الاصطناعي", icon: Bot, emoji: "🤖", tone: "tone-purple" },
  { to: "/exams", label: "Exams", labelAr: "الامتحانات", icon: FileText, emoji: "📝", tone: "tone-orange" },
  { to: "/todo", label: "To-Do List", labelAr: "قائمة المهام", icon: ListChecks, emoji: "✅", tone: "tone-green" },
  { to: "/focus", label: "Study Focus", labelAr: "التركيز الدراسي", icon: Timer, emoji: "⏱️", tone: "tone-sky" },
  { to: "/notes", label: "Notes", labelAr: "الملاحظات", icon: StickyNote, emoji: "🗒️", tone: "tone-pink" },
  { to: "/translator", label: "Translator", labelAr: "المترجم", icon: Languages, emoji: "🌐", tone: "tone-teal" },
  { to: "/teachers", label: "Best Teachers", labelAr: "أفضل المعلمين", icon: GraduationCap, emoji: "👨‍🏫", tone: "tone-indigo" },
  { to: "/calculator", label: "Calculator", labelAr: "الآلة الحاسبة", icon: Calculator, emoji: "🧮", tone: "tone-orange" },
  { to: "/community", label: "Community", labelAr: "المجتمع", icon: Users, emoji: "👥", tone: "tone-green" },
  { to: "/support", label: "Study HUB Support", labelAr: "الدعم الفني", icon: LifeBuoy, emoji: "🆘", tone: "tone-sky" },
  { to: "/statistics", label: "Statistics", labelAr: "الإحصائيات", icon: BarChart3, emoji: "📊", tone: "tone-indigo" },
  { to: "/updates", label: "Latest Updates", labelAr: "آخر التحديثات", icon: Megaphone, emoji: "📰", tone: "tone-purple" },
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
