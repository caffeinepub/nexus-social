import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Ghost, Loader2, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddReaction,
  useCreateShadowPost,
  useGetReactions,
  useGetRealTalksFeed,
} from "../hooks/useQueries";

const SHADOW_TAGS = [
  "Student",
  "Overthinker",
  "Anonymous User",
  "Dreamer",
  "Night Owl",
];

const REACTIONS = [
  { key: "I relate", emoji: "🫂", label: "I relate" },
  { key: "Stay strong", emoji: "💪", label: "Stay strong" },
  { key: "Help", emoji: "❤️", label: "Help" },
];

const TAG_COLORS: Record<string, string> = {
  Student: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Overthinker: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "Anonymous User": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  Dreamer: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Night Owl": "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

function pickRandomTag(): string {
  return SHADOW_TAGS[Math.floor(Math.random() * SHADOW_TAGS.length)];
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function ReactionBar({ postId }: { postId: bigint }) {
  const { data: reactions = {} } = useGetReactions(postId);
  const addReaction = useAddReaction();

  const handleReact = async (key: string) => {
    try {
      await addReaction.mutateAsync({ postId, reaction: key });
    } catch {
      toast.error("Could not add reaction");
    }
  };

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-white/5">
      {REACTIONS.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => handleReact(r.key)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
          data-ocid="realtalk.reaction.button"
        >
          <span>{r.emoji}</span>
          <span>{r.label}</span>
          {(reactions[r.key] ?? 0) > 0 && (
            <span className="ml-0.5 bg-white/10 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {reactions[r.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function RealTalksPage() {
  const { data: posts, isLoading } = useGetRealTalksFeed();
  const createShadowPost = useCreateShadowPost();
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const tag = pickRandomTag();
    try {
      await createShadowPost.mutateAsync({
        content: content.trim(),
        randomTag: tag,
      });
      setContent("");
      toast.success("Posted anonymously");
    } catch {
      toast.error("Failed to post. Try again.");
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.12 0.018 265) 0%, oklch(0.10 0.014 280) 50%, oklch(0.12 0.016 250) 100%)",
      }}
      data-ocid="realtalk.page"
    >
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Ghost className="h-5 w-5 text-slate-300" />
            </div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "oklch(0.92 0.008 260)" }}
            >
              Real Talks
            </h1>
          </div>
          <p className="text-sm" style={{ color: "oklch(0.60 0.008 265)" }}>
            A safe space — share your thoughts anonymously 🤫
          </p>
        </motion.div>

        {/* Composer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 mb-6 overflow-hidden"
          style={{ background: "oklch(0.17 0.012 265 / 0.8)" }}
          data-ocid="realtalk.panel"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: "oklch(0.55 0.008 265)" }}
              >
                You will appear as a random tag — completely anonymous
              </span>
            </div>
            <Textarea
              placeholder="What's on your mind? No one will know it's you..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border-0 text-sm min-h-[88px] rounded-xl placeholder:text-slate-600"
              style={{
                background: "oklch(0.13 0.010 265 / 0.6)",
                color: "oklch(0.88 0.006 260)",
              }}
              data-ocid="realtalk.textarea"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleSubmit();
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Ghost
                  className="h-3.5 w-3.5"
                  style={{ color: "oklch(0.50 0.015 280)" }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: "oklch(0.50 0.008 265)" }}
                >
                  Identity hidden
                </span>
              </div>
              <Button
                size="sm"
                className="rounded-full h-8 px-4 text-xs font-semibold"
                style={{
                  background: "oklch(0.30 0.030 270)",
                  color: "oklch(0.90 0.008 260)",
                  border: "1px solid oklch(0.40 0.020 270)",
                }}
                onClick={handleSubmit}
                disabled={createShadowPost.isPending || !content.trim()}
                data-ocid="realtalk.submit_button"
              >
                {createShadowPost.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Post Anonymously
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4" data-ocid="realtalk.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 p-4 space-y-3"
                style={{ background: "oklch(0.17 0.012 265 / 0.6)" }}
              >
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-3 w-full bg-white/10" />
                <Skeleton className="h-3 w-4/5 bg-white/10" />
              </div>
            ))}
          </div>
        ) : !posts || posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
            data-ocid="realtalk.empty_state"
          >
            <Ghost
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "oklch(0.35 0.010 265)" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(0.50 0.008 265)" }}
            >
              No anonymous posts yet
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "oklch(0.40 0.006 265)" }}
            >
              Be the first to share something real
            </p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-4">
              {posts.map((post, i) => {
                const tag = (post as any).title || pickRandomTag();
                const tagStyle =
                  TAG_COLORS[tag] ?? TAG_COLORS["Anonymous User"];
                return (
                  <motion.article
                    key={post.id.toString()}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 overflow-hidden"
                    style={{ background: "oklch(0.17 0.012 265 / 0.75)" }}
                    data-ocid={`realtalk.item.${i + 1}`}
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Anonymous avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-white/10"
                          style={{ background: "oklch(0.20 0.018 270)" }}
                        >
                          <Ghost
                            className="h-4 w-4"
                            style={{ color: "oklch(0.55 0.015 275)" }}
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${tagStyle}`}
                          >
                            {tag}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{ color: "oklch(0.45 0.006 265)" }}
                          >
                            {formatTime(post.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "oklch(0.82 0.006 260)" }}
                      >
                        {post.content}
                      </p>
                    </div>
                    <ReactionBar postId={post.id} />
                  </motion.article>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
