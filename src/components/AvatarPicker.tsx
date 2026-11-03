import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AVATAR_COUNT, avatarUrl } from "@/lib/avatars";
import { cn } from "@/lib/utils";

/** 20-cartoon avatar picker, saved to the user's account. */
export function AvatarPicker() {
  const { profile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const selected = profile?.avatar_id ?? profile?.avatar_url ? (profile?.avatar_id ?? 1) : 1;

  const save = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_id: id })
        .eq("id", profile!.id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      toast.success("تم اختيار الشخصية");
      qc.setQueryData(["platform-visibility"], (old: unknown) => old); // keep cache warm
      await refreshProfile();
      void qc.invalidateQueries({ queryKey: ["honor"] });
      void qc.invalidateQueries({ queryKey: ["avatar", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <p className="font-display font-bold">🎭 Choose Your Avatar</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1).map((id) => (
          <button
            key={id}
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate(id)}
            className={cn(
              "game-avatar relative overflow-hidden rounded-2xl border-2 transition-transform active:scale-95",
              selected === id ? "border-primary ring-2 ring-primary shadow-gold" : "border-transparent hover:border-primary/40",
            )}
            aria-label={`Avatar ${id}`}
            aria-pressed={selected === id}
          >
            <img src={avatarUrl(id)} alt={`Avatar ${id}`} className="aspect-square w-full object-cover" loading="lazy" />
            {selected === id && (
              <span className="absolute bottom-1 right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
