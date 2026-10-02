export const CL_ROUNDS = [
  { round: 1, medal: "🥇", en: "Exam 1 — Round of 16", ar: "دور الـ16", matches: 8 },
  { round: 2, medal: "🥈", en: "Exam 2 — Quarterfinals", ar: "ربع النهائي", matches: 4 },
  { round: 3, medal: "🥉", en: "Exam 3 — Semifinals", ar: "نصف النهائي", matches: 2 },
  { round: 4, medal: "🏆", en: "Exam 4 — Final", ar: "النهائي", matches: 1 },
] as const;

export const CL_SUBJECTS = [
  { key: "arabic", flag: "🇪🇬", ar: "اللغة العربية", en: "Arabic", count: 3, split: false },
  { key: "english", flag: "🇬🇧", ar: "اللغة الإنجليزية", en: "English", count: 3, split: false },
  { key: "history", flag: "📜", ar: "التاريخ", en: "History", count: 3, split: false },
  { key: "math", flag: "➗", ar: "الرياضيات", en: "Math", count: 3, split: true },
  { key: "science", flag: "🔬", ar: "العلوم المتكاملة", en: "Integrated Science", count: 3, split: true },
  { key: "philosophy", flag: "🧠", ar: "الفلسفة والمنطق", en: "Philosophy & Logic", count: 3, split: false },
] as const;

export const subjectLabel = (key: string) => {
  const s = CL_SUBJECTS.find((x) => x.key === key);
  return s ? `${s.flag} ${s.ar}` : key;
};

export const TRACK_AR: Record<string, string> = { all: "الكل", general: "عام", languages: "لغات" };
export const GENDER_AR: Record<string, string> = { boy: "ولد 👦", girl: "بنت 👧" };

export const CL_EMOJIS = [
  "😀","😎","🤓","🥳","😇","🤩","🦁","🐯","🦊","🐼","🐨","🐸","🐵","🦄","🐲","🦅",
  "🦉","🐬","🦈","🐙","🦋","🐝","🌟","🔥","⚡","🌈","❄️","🌙","☀️","🍀","🌹","🌻",
  "🍎","🍓","🍉","🍕","🍩","⚽","🏀","🎾","🎯","🎮","🎧","🎨","🚀","✈️","🚗","⛵",
  "💎","👑","🎩","🧠","📚","✏️","🔬","🧪","🧩","🎸","🥇","🛡️","⚔️","🗝️","💡","🎈",
];

export type RoundRow = {
  round: number;
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number;
  question_limit: number | null;
  is_open: boolean;
};

export type RoundState = "not_started" | "live" | "ended";

export function roundState(r: RoundRow | undefined, now = Date.now()): RoundState {
  if (!r?.start_at || !r.end_at) return "not_started";
  if (now >= new Date(r.end_at).getTime()) return "ended";
  if (now >= new Date(r.start_at).getTime()) return "live";
  return "not_started";
}

export const ROUND_STATE_AR: Record<RoundState, string> = {
  not_started: "⏳ الجولة لم تبدأ بعد",
  live: "🟢 الجولة بدأت",
  ended: "🔴 انتهت الجولة",
};

export const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })
    : "لم يحدد بعد";

export function fmtElapsed(start: string, end: string | null) {
  if (!end) return "—";
  const s = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} دقيقة`;
}

// in-memory marker: an attempt is "live" only while opened from this page session.
export const liveAttempt: { id: string | null } = { id: null };
