import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Rocket } from "lucide-react";

import { FEATURES } from "@/lib/hub";
import { useAuth } from "@/hooks/useAuth";
import { StudyHubLogo } from "@/components/StudyHubLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study HUB — منصتك الدراسية الكاملة" },
      {
        name: "description",
        content:
          "ابدأ مع Study HUB: مكتبة، امتحانات، ذكاء اصطناعي، مهام، تركيز، ملاحظات، مترجم، أفضل المعلمين ودعم فني.",
      },
      { property: "og:title", content: "Study HUB — منصتك الدراسية الكاملة" },
      {
        property: "og:description",
        content: "كل أدوات الدراسة في مكان واحد: مكتبة، امتحانات، ذكاء اصطناعي وإحصائيات.",
      },
    ],
  }),
  component: WelcomeScreen,
});

function WelcomeScreen() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(60%_60%_at_50%_0%,var(--gold)/18%,transparent)]" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center md:py-20">
        <StudyHubLogo secretAccess />
        <p className="mt-8 text-xs font-bold tracking-[0.3em] text-primary uppercase">Welcome</p>
        <h1 className="font-display mt-3 text-4xl leading-tight font-extrabold md:text-6xl">
          أهلاً بك في <span className="text-gradient-gold">Study HUB</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
          منصة دراسية واحدة تجمع المكتبة، الامتحانات، الذكاء الاصطناعي، المهام، التركيز الدراسي،
          الملاحظات، المترجم، أفضل المعلمين، الإحصائيات والدعم الفني.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="gradient-gold shadow-gold font-bold" onClick={() => navigate({ to: "/auth" })}>
            <Rocket className="mr-2 size-4" /> Create Account
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
          >
            تسجيل الدخول
          </Button>
        </div>

        <div className="mt-14 grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.to} className="hub-card p-4 text-left">
              <div className="text-2xl">{f.emoji}</div>
              <p className="font-display mt-2 text-sm font-bold">{f.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{f.labelAr}</p>
            </div>
          ))}
        </div>

        <footer className="mt-16 text-xs text-muted-foreground">
          جميع الحقوق محفوظة © 2027 لتطبيق <span className="font-bold">Study HUB</span> — تم التطوير بواسطة Ahmed Shaaban &amp; Retaj Mohamed
        </footer>
      </div>
    </div>
  );
}
