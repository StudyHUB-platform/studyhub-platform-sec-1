import { GraduationCap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * Study HUB logo. Admin access is role-based on the server — there is no
 * secret passcode entry point anymore.
 */
export function StudyHubLogo({
  className,
  secretAccess = false,
  compact = false,
}: {
  className?: string;
  /** Deprecated: kept for call-site compatibility, has no effect. */
  secretAccess?: boolean;
  compact?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => void navigate({ to: "/dashboard" })}
        aria-label="Study HUB"
        className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition-transform active:scale-95"
      >
        <span className="gradient-gold shadow-gold flex size-10 items-center justify-center rounded-xl">
          <GraduationCap className="size-6 text-primary-foreground" />
        </span>
        {!compact && (
          <span className="font-display text-left text-lg leading-tight font-extrabold tracking-tight">
            <span className="text-gradient-gold">STUDY</span>{" "}
            <span className="text-current">HUB</span>
          </span>
        )}
      </button>
    </div>
  );
}
