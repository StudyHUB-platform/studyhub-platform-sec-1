import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { MyStats } from "@/lib/gamification";

export function useMyStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-stats", user?.id],
    enabled: !!user,
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_stats");
      if (error) throw error;
      return data as unknown as MyStats;
    },
  });
}
