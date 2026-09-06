import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Heart, Send } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { VideoPlayer } from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getYouTubeVideoId } from "@/lib/youtube";
import { SUBJECT_AR, VIDEO_SECTION_LABELS } from "@/lib/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/videos/$subject/$section/$videoId")({
  head: () => ({
    meta: [
      { title: "تشغيل الفيديو — Study HUB Videos" },
      { name: "description", content: "شغّل الفيديو داخل Study HUB مع تحكم كامل ولايك وتعليقات." },
      { property: "og:title", content: "تشغيل الفيديو — Study HUB Videos" },
      { property: "og:description", content: "مشغل فيديو داخل المنصة بدعم Portrait وLandscape وFull Screen." },
    ],
  }),
  component: VideoWatchPage,
});

function VideoWatchPage() {
  const { subject, section, videoId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("*").eq("id", videoId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: likes } = useQuery({
    queryKey: ["video-likes", videoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("video_likes").select("user_id").eq("video_id", videoId);
      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["video-comments", videoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_comments")
        .select("id, body, created_at, user_id")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const liked = !!user && !!likes?.some((l) => l.user_id === user.id);

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("سجل الدخول أولاً");
      if (liked) {
        const { error } = await supabase
          .from("video_likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("video_likes")
          .insert({ video_id: videoId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["video-likes", videoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("سجل الدخول أولاً");
      const body = comment.trim();
      if (!body) throw new Error("اكتب تعليقك");
      const { error } = await supabase
        .from("video_comments")
        .insert({ video_id: videoId, user_id: user.id, body });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      void qc.invalidateQueries({ queryKey: ["video-comments", videoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ytId = video ? (video.video_id ?? getYouTubeVideoId(video.url)) : null;

  return (
    <AppShell
      title={video?.title ?? "🎬 تشغيل الفيديو"}
      subtitle={`${SUBJECT_AR[subject] ?? subject} · ${VIDEO_SECTION_LABELS[section] ?? section}`}
    >
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/videos/$subject/$section" params={{ subject, section }}>
          <ArrowRight className="mr-1 size-3.5" /> فيديوهات القسم
        </Link>
      </Button>

      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !video && (
        <div className="hub-card p-8 text-center">
          <p className="font-display text-lg font-bold">الفيديو غير موجود</p>
        </div>
      )}

      {video && (
        <>
          {ytId ? (
            <VideoPlayer videoId={ytId} title={video.title} />
          ) : (
            <div className="hub-card p-6 text-center text-sm text-muted-foreground">
              رابط الفيديو غير صالح — راجع الأدمن.
            </div>
          )}

          <section className="hub-card mt-4 p-4">
            <h2 className="font-display text-lg font-extrabold">{video.title}</h2>
            {video.description && (
              <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">{video.description}</p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <Button
                size="sm"
                variant={liked ? "default" : "outline"}
                className={liked ? "gradient-gold font-bold" : ""}
                onClick={() => toggleLike.mutate()}
              >
                <Heart className={liked ? "mr-1 size-4 fill-current" : "mr-1 size-4"} />
                {liked ? "أعجبني" : "لايك"} · {likes?.length ?? 0}
              </Button>
              <span className="text-xs text-muted-foreground">
                📅 {new Date(video.created_at).toLocaleDateString("ar-EG")}
              </span>
            </div>
          </section>

          <section className="hub-card mt-4 p-4">
            <h3 className="font-display mb-3 text-sm font-extrabold">
              💬 التعليقات ({comments?.length ?? 0})
            </h3>
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment.mutate()}
                placeholder="اكتب تعليقك…"
              />
              <Button size="icon" onClick={() => addComment.mutate()} disabled={addComment.isPending}>
                <Send className="size-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {!comments?.length && (
                <p className="text-sm text-muted-foreground">لا توجد تعليقات — كن أول من يعلّق.</p>
              )}
              {comments?.map((c) => (
                <div key={c.id} className="rounded-xl bg-secondary p-3">
                  <p className="text-sm text-secondary-foreground">{c.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("ar-EG")}
                    {user?.id === c.user_id && " · تعليقك"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
