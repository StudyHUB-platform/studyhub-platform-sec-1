export const LEVEL_TIERS = [
  { name: "مبتدئ", badge: "🌱" },
  { name: "متعلم", badge: "📘" },
  { name: "مجتهد", badge: "✏️" },
  { name: "مثابر", badge: "💪" },
  { name: "متفوق", badge: "⭐" },
  { name: "نابغ", badge: "💡" },
  { name: "خبير", badge: "🎓" },
  { name: "عبقري", badge: "🧠" },
  { name: "أسطورة", badge: "👑" },
  { name: "بطل Study HUB", badge: "🏆" },
] as const;

export function levelInfo(level: number) {
  const l = Math.min(50, Math.max(1, level));
  const tier = LEVEL_TIERS[Math.floor((l - 1) / 5)]!;
  const rank = ((l - 1) % 5) + 1;
  return { level: l, tier: Math.floor((l - 1) / 5) + 1, name: rank === 1 ? tier.name : `${tier.name} ${rank}`, badge: tier.badge };
}

export type MyStats = {
  public_id: string;
  shards: number;
  xp: number;
  level: number;
  pending_level: number;
  xp_in_level: number;
  xp_needed: number;
  streak: number;
  studied_today: boolean;
};
