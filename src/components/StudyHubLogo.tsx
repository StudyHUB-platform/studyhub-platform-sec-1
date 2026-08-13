import { GraduationCap, Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { unlockAdminAccess } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/useAuth";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const ADMIN_UNLOCK_KEY = "studyhub-admin-unlocked";

/**
 * Study HUB logo. Secret admin access: tap it 10 times to open a passcode
 * prompt; the correct passcode opens the Admin Panel.
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
  const unlock = useServerFn(unlockAdminAccess);
  const { session, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const clicks = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

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
      setOpen(true);
    }
  };

  const submit = async () => {
    if (!session) {
      toast.error("سجّل الدخول أولاً ثم افتح لوحة الأدمن");
      setOpen(false);
      void navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      await unlock({ data: { passcode: code.trim() } });
      sessionStorage.setItem(ADMIN_UNLOCK_KEY, "1");
      await refreshProfile();
      setCode("");
      setOpen(false);
      toast.success("تم فتح لوحة الأدمن");
      void navigate({ to: "/admin" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "كلمة السر غير صحيحة");
    } finally {
      setBusy(false);
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
            <span className="text-current">HUB</span>
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Lock className="size-4 text-primary" /> 🔐 Admin Panel Login
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">اكتب كلمة سر الأدمن للدخول للوحة التحكم.</p>
          <Input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="••••••••"
          />
          <Button className="gradient-gold font-bold" disabled={busy} onClick={() => void submit()}>
            دخول لوحة الأدمن
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
