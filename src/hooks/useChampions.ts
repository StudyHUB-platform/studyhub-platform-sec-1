import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { RoundRow } from "@/lib/champions";
import type { ClMatch, ClPerson } from "@/components/champions/Bracket";

export function useChampions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["champions", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      await supabase.rpc("cl_refresh");
      const [me, settings, count, rounds, people, matches, attempts] = await Promise.all([
        supabase.from("cl_participants").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("cl_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.rpc("cl_participant_count"),
        supabase.from("cl_rounds").select("*").order("round"),
        supabase.rpc("cl_bracket_participants"),
        supabase.from("cl_matches").select("id, round, slot, p1, p2, winner, decided_at").order("round"),
        supabase
          .from("cl_attempts")
          .select("id, round, participant_id, user_id, match_id, started_at, submitted_at, deadline, score, total, percentage, status"),
      ]);
      const map = new Map<string, ClPerson>();
      ((people.data ?? []) as ClPerson[]).forEach((p) => map.set(p.id, p));
      return {
        me: me.data,
        settings: settings.data,
        count: (count.data as number) ?? 0,
        rounds: (rounds.data ?? []) as RoundRow[],
        people: map,
        matches: (matches.data ?? []) as (ClMatch & { decided_at: string | null })[],
        attempts: attempts.data ?? [],
      };
    },
  });
}
