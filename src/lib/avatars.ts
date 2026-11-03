import avatar01 from "@/assets/avatars/avatar-01.png.asset.json";
import avatar02 from "@/assets/avatars/avatar-02.png.asset.json";
import avatar03 from "@/assets/avatars/avatar-03.png.asset.json";
import avatar04 from "@/assets/avatars/avatar-04.png.asset.json";
import avatar05 from "@/assets/avatars/avatar-05.png.asset.json";
import avatar06 from "@/assets/avatars/avatar-06.png.asset.json";
import avatar07 from "@/assets/avatars/avatar-07.png.asset.json";
import avatar08 from "@/assets/avatars/avatar-08.png.asset.json";
import avatar09 from "@/assets/avatars/avatar-09.png.asset.json";
import avatar10 from "@/assets/avatars/avatar-10.png.asset.json";
import avatar11 from "@/assets/avatars/avatar-11.png.asset.json";
import avatar12 from "@/assets/avatars/avatar-12.png.asset.json";
import avatar13 from "@/assets/avatars/avatar-13.png.asset.json";
import avatar14 from "@/assets/avatars/avatar-14.png.asset.json";
import avatar15 from "@/assets/avatars/avatar-15.png.asset.json";
import avatar16 from "@/assets/avatars/avatar-16.png.asset.json";
import avatar17 from "@/assets/avatars/avatar-17.png.asset.json";
import avatar18 from "@/assets/avatars/avatar-18.png.asset.json";
import avatar19 from "@/assets/avatars/avatar-19.png.asset.json";
import avatar20 from "@/assets/avatars/avatar-20.png.asset.json";

type Pointer = { url: string };

const pointers: Pointer[] = [
  avatar01, avatar02, avatar03, avatar04, avatar05,
  avatar06, avatar07, avatar08, avatar09, avatar10,
  avatar11, avatar12, avatar13, avatar14, avatar15,
  avatar16, avatar17, avatar18, avatar19, avatar20,
];

export const AVATAR_COUNT = 20;

/** Unified avatar source — use in Profile, Top 10, Battles, results, everywhere. */
export function avatarUrl(id: number | null | undefined): string {
  const idx = Math.min(Math.max(Number(id) || 1, 1), AVATAR_COUNT);
  return pointers[idx - 1]!.url;
}
