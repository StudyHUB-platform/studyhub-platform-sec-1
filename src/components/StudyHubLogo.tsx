import { GraduationCap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Study HUB logo. Secret admin access: tap it 10 times to reveal the
 * Admin Panel login button (spec §26).
 */
export function StudyHubLogo({
  className,
  secretAccess = false,
  compact = false,
}: {
  className?: string;
  secretAccess?: boolean;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleClick = () => {
    if (!secretAccess) {
      void navigate({ to: "/dashboard" });
      return;
    }
    clicks.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      clicks.current = 0;
    }, 3000);
    if (clicks.current >= 10) {
      clicks.current = 0;
      setRevealed(true);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Study HUB"
        className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition-transform active:scale-95"
      >
        <span className="gradient-gold shadow-gold flex size-10 items-center justify-center rounded-xl">
          <GraduationCap className="size-6 text-primary-foreground" />
        </span>
        {!compact && (
          <span className="font-display text-left text-lg leading-tight font-extrabold tracking-tight">
            <span className="text-gradient-gold">STUDY</span>{" "}
            <span className="text-foreground">HUB</span>
          </span>
        )}
      </button>
      {revealed && (
        <button
          type="button"
          onClick={() => navigate({ to: "/admin" })}
          className="rounded-lg border border-primary/60 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
        >
          🔐 Admin Panel Login
        </button>
      )}
    </div>
  );
}
