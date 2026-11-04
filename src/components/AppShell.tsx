import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Home,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  User as UserIcon,
  X,
  Trophy,
  LogIn,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { FEATURES } from "@/lib/hub";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSectionVisible, useVisibleFeatures } from "@/hooks/usePlatformVisibility";
import { avatarUrl } from "@/lib/avatars";
import { supabase } from "@/integrations/supabase/client";
import { StudyHubLogo } from "@/components/StudyHubLogo";
import { SmartAssistant } from "@/components/SmartAssistant";
import { BottomNav, LevelUpDialog, ShardsCounter } from "@/components/Gamification";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const dark = localStorage.getItem("studyhub-theme") === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("studyhub-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };
  return { isDark, toggle };
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();
  const visibleFeatures = useVisibleFeatures();
  const items = [{ to: "/dashboard", label: "Home", icon: Home }, ...visibleFeatures];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "gradient-gold text-primary-foreground shadow-gold"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <div className="my-2 h-px bg-sidebar-border" />
      <Link
        to="/honor"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent"
      >
        <Trophy className="size-4.5" /> Top 10 / Honor Board
      </Link>
      <Link
        to="/profile"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent"
      >
        <UserIcon className="size-4.5" /> Profile
      </Link>
      {isAdmin && (
        <Link
          to="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent"
        >
          <Shield className="size-4.5" /> Admin Panel
        </Link>
      )}
    </nav>
  );
}

function NotificationsBell() {
  const { data } = useQuery({
    queryKey: ["notifications", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {!!data?.length && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3 font-display font-bold">🔔 Notifications</div>
        <div className="max-h-80 overflow-y-auto">
          {!data?.length && (
            <p className="p-4 text-sm text-muted-foreground">لا توجد إشعارات حتى الآن.</p>
          )}
          {data?.map((n) => (
            <div key={n.id} className="border-b border-border/60 px-4 py-3 last:border-0">
              <p className="text-sm font-bold text-primary">{n.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { session, loading, profile, isAdmin, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { visible, loading: visLoading } = useSectionVisible(pathname);
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <StudyHubLogo className="mb-6 px-1" />
        <div className="flex-1 overflow-y-auto pr-1">
          <NavLinks />
        </div>
        <p className="pt-3 text-[10px] leading-relaxed text-sidebar-foreground/60">
          © 2027 جميع حقوق النشر محفوظة لتطبيق <span className="font-bold">Study HUB</span>
          <br />
          Developed by Ahmed Shaaban &amp; Retaj Mohamed
        </p>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-72 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground">
            <div className="mb-6 flex items-center justify-between">
              <StudyHubLogo />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="pb-16 lg:pl-64 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <StudyHubLogo compact />
          <div className="ml-auto flex items-center gap-1">
            {session && <ShardsCounter />}
            <NotificationsBell />
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
              {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Profile" className="rounded-full">
                  {session && profile ? (
                    <img
                      src={avatarUrl(profile.avatar_id)}
                      alt="Your avatar"
                      className="size-8 rounded-full border-2 border-primary object-cover"
                    />
                  ) : (
                    <span className="gradient-gold flex size-8 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                      {profile?.full_name?.slice(0, 1).toUpperCase() ?? "?"}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {session ? (
                  <>
                    <DropdownMenuLabel className="truncate">
                      {profile?.full_name ?? session.user.email ?? session.user.phone}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                      <UserIcon className="mr-2 size-4" /> Profile
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                        <Shield className="mr-2 size-4" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await signOut();
                        void navigate({ to: "/auth", replace: true });
                      }}
                    >
                      <LogOut className="mr-2 size-4" /> Sign out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel>زائر — تصفح بدون حساب</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/auth" })}>
                      <LogIn className="mr-2 size-4" /> تسجيل الدخول / حساب جديد
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {!session && (
            <p className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              👋 تقدر تتصفح كزائر — سجّل حساب لحفظ تقدمك
            </p>
          )}
          {!visLoading && !visible ? (
            <div className="hub-card mx-auto max-w-md p-8 text-center">
              <p className="font-display text-lg font-bold">🔒 هذا القسم مخفي حاليًا</p>
              <p className="mt-1 text-sm text-muted-foreground">
                تم إخفاء القسم من إدارة المنصة. بياناتك فيه محفوظة وسيظهر مرة أخرى عند إعادة تفعيله.
              </p>
              <Button className="gradient-gold mt-4 font-bold" onClick={() => navigate({ to: "/dashboard" })}>
                العودة للرئيسية
              </Button>
            </div>
          ) : (
            children
          )}
        </main>

        <DevelopersFooter />
      </div>

      {session && (
        <>
          <SmartAssistant />
          <LevelUpDialog />
        </>
      )}
      <BottomNav />
    </div>
  );
}

/** Footer with the Developers credit — can be hidden from the admin panel. */
function DevelopersFooter() {
  const { data: vis } = usePlatformVisibility();
  const enabled = vis?.values["developers_footer"] !== "0";
  if (!enabled) return null;
  return (
    <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
      <p className="font-bold">
        © 2027 جميع حقوق النشر محفوظة لتطبيق <span className="font-bold">Study HUB</span>
      </p>
      <p className="mt-1">Developed by Ahmed Shaaban &amp; Retaj Mohamed</p>
    </footer>
  );
}

