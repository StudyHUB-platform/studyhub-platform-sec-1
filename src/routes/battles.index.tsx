import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/battles")({
  head: () => ({
    meta: [
      { title: "Battles — Study HUB" },
      { name: "description", content: "منافسات أصدقاء Study HUB بالأسئلة والنقاط." },
      { property: "og:title", content: "Battles — Study HUB" },
      { property: "og:description", content: "Challenge • Compete • Win" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BattlesPage,
});

function BattlesPage() {
  return (
    <AppShell title="⚔️ Friends Battles" subtitle="Challenge • Compete • Win">
      <p className="text-sm text-muted-foreground">يتم تجهيز نظام المعارك في مرحلته.</p>
    </AppShell>
  );
}
