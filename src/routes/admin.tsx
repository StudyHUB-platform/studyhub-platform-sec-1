import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AnnouncementsAdmin,
  CommunityAdmin,
  LibraryAdmin,
  TeachersAdmin,
} from "@/components/admin/AdminSections";
import { ExamsAdmin, SupportAdmin } from "@/components/admin/ExamsAdmin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الأدمن — Study HUB Admin Panel" },
      { name: "description", content: "إدارة المكتبة والامتحانات والمعلمين والمجتمع والإشعارات والدعم." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة الأدمن — Study HUB" },
      { property: "og:description", content: "إدارة كل محتوى منصة Study HUB." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();

  if (!loading && !isAdmin) {
    return (
      <AppShell title="🔐 Admin Panel">
        <div className="hub-card mx-auto max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <p className="font-display mt-3 text-lg font-bold">غير مسموح بالدخول</p>
          <p className="mt-1 text-sm text-muted-foreground">
            هذه الصفحة للأدمن فقط. لو أنت الأدمن، سجل الدخول بحساب الأدمن.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="🔐 Admin Panel" subtitle="إدارة كل محتوى المنصة">
      <Tabs defaultValue="library">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="library">📚 المكتبة</TabsTrigger>
          <TabsTrigger value="exams">📝 الامتحانات</TabsTrigger>
          <TabsTrigger value="teachers">👨‍🏫 المعلمون</TabsTrigger>
          <TabsTrigger value="community">👥 المجتمع</TabsTrigger>
          <TabsTrigger value="notifications">🔔 الإشعارات</TabsTrigger>
          <TabsTrigger value="updates">📰 التحديثات</TabsTrigger>
          <TabsTrigger value="tips">💡 نصيحة اليوم</TabsTrigger>
          <TabsTrigger value="support">🆘 الدعم</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="library">
            <LibraryAdmin />
          </TabsContent>
          <TabsContent value="exams">
            <ExamsAdmin />
          </TabsContent>
          <TabsContent value="teachers">
            <TeachersAdmin />
          </TabsContent>
          <TabsContent value="community">
            <CommunityAdmin />
          </TabsContent>
          <TabsContent value="notifications">
            <AnnouncementsAdmin table="notifications" heading="🔔 إرسال إشعار" bodyLabel="نص الإشعار" />
          </TabsContent>
          <TabsContent value="updates">
            <AnnouncementsAdmin table="platform_updates" heading="📰 نشر تحديث" bodyLabel="تفاصيل التحديث" />
          </TabsContent>
          <TabsContent value="tips">
            <AnnouncementsAdmin table="admin_tips" heading="💡 نصيحة اليوم" bodyLabel="نص النصيحة" />
          </TabsContent>
          <TabsContent value="support">
            <SupportAdmin />
          </TabsContent>
        </div>
      </Tabs>
    </AppShell>
  );
}
