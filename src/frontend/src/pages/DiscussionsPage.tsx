import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Heart,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useCreateDiscussionPost,
  useGetAllUsers,
  useGetComments,
  useGetPostLikes,
  useGetPostsByCategory,
  useLikePost,
} from "../hooks/useQueries";
import type { Post } from "../hooks/useQueries";
import { formatTimestamp, getInitials } from "../utils/format";

const CATEGORIES = [
  {
    key: "education",
    label: "Education & Knowledge",
    description: "Seekho, sikhao, aur knowledge share karo",
    icon: BookOpen,
    bannerClass: "from-blue-600 to-indigo-700",
    accentClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
    submitClass: "bg-blue-600 hover:bg-blue-700 text-white",
    tabActiveClass: "bg-blue-600 text-white",
  },
  {
    key: "emotions",
    label: "Emotions & Support",
    description: "Apni feelings share karo, dil ki baat karo, support lo",
    icon: HeartHandshake,
    bannerClass: "from-rose-500 to-pink-600",
    accentClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
    submitClass: "bg-rose-500 hover:bg-rose-600 text-white",
    tabActiveClass: "bg-rose-500 text-white",
  },
];

function DiscussionCard({
  post,
  index,
  currentUserId,
  allUsers,
}: {
  post: Post;
  index: number;
  currentUserId: string;
  allUsers: [
    import("@dfinity/principal").Principal,
    import("../hooks/useQueries").UserProfile,
  ][];
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likedLocally, setLikedLocally] = useState(false);
  const [localLikeOffset, setLocalLikeOffset] = useState(0);

  const { data: likeCount = BigInt(0) } = useGetPostLikes(post.id);
  const { data: comments = [] } = useGetComments(post.id);
  const likePost = useLikePost();
  const addComment = useAddComment();

  const authorEntry = allUsers.find(
    ([p]) => p.toString() === post.author.toString(),
  );
  const authorProfile = authorEntry?.[1];
  const displayName =
    authorProfile?.displayName || `User ${post.author.toString().slice(0, 8)}`;
  const avatarUrl = authorProfile?.avatarBlob?.getDirectURL();

  const lines = post.content.split("\n");
  const title = lines[0];
  const body = lines.slice(1).join("\n").trim();

  const totalLikes = Number(likeCount) + localLikeOffset;

  const handleLike = async () => {
    if (likedLocally) return;
    setLikedLocally(true);
    setLocalLikeOffset((p) => p + 1);
    try {
      await likePost.mutateAsync(post.id);
    } catch {
      setLikedLocally(false);
      setLocalLikeOffset((p) => p - 1);
      toast.error("Like nahi hua");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({
        postId: post.id,
        content: commentText.trim(),
      });
      setCommentText("");
      toast.success("Comment add ho gaya!");
    } catch {
      toast.error("Comment nahi ho paya");
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
      data-ocid={`discussions.item.${index + 1}`}
    >
      <div className="flex items-start gap-3 p-4">
        <Avatar className="h-9 w-9 shrink-0">
          {avatarUrl && <img src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate">
              {displayName}
            </span>
            {post.author.toString() === currentUserId && (
              <span className="text-[10px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(post.timestamp)}
          </p>
        </div>
      </div>

      <div className="px-4 pb-3">
        {title && (
          <p className="text-sm font-bold text-foreground mb-1">{title}</p>
        )}
        {body && (
          <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {body}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-colors ${
            likedLocally
              ? "text-red-500 hover:text-red-500 bg-red-50 hover:bg-red-50 dark:bg-red-950/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={handleLike}
          disabled={likedLocally}
          data-ocid={`discussions.item.${index + 1}.toggle`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${likedLocally ? "fill-current" : ""}`}
          />
          {totalLikes > 0 && <span>{totalLikes}</span>}
          <span>Like</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setShowComments((v) => !v)}
          data-ocid={`discussions.item.${index + 1}.button`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {comments.length > 0 && <span>{comments.length}</span>}
          <span>Comment</span>
        </Button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Koi comment nahi abhi. Pehle aap karo!
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={`${c.timestamp}`}
                    className="flex gap-2"
                    data-ocid={`discussions.item.${index + 1}.row`}
                  >
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-semibold text-foreground">
                        {c.author.toString().slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="bg-accent rounded-lg px-3 py-2 flex-1">
                      <p className="text-xs text-foreground">{c.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatTimestamp(c.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <form onSubmit={handleComment} className="flex gap-2">
                <Textarea
                  placeholder="Comment likhein…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="resize-none min-h-[36px] h-9 py-2 text-xs rounded-full"
                  data-ocid={`discussions.item.${index + 1}.textarea`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full h-9 px-4 text-xs shrink-0"
                  disabled={addComment.isPending || !commentText.trim()}
                  data-ocid={`discussions.item.${index + 1}.submit_button`}
                >
                  {addComment.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function CategorySection({
  categoryKey,
  currentUserId,
  allUsers,
}: {
  categoryKey: string;
  currentUserId: string;
  allUsers: [
    import("@dfinity/principal").Principal,
    import("../hooks/useQueries").UserProfile,
  ][];
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const cat = CATEGORIES.find((c) => c.key === categoryKey)!;
  const { data: posts = [], isLoading } = useGetPostsByCategory(categoryKey);
  const createPost = useCreateDiscussionPost();
  const Icon = cat.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title zaroori hai");
      return;
    }
    const content = body.trim()
      ? `${title.trim()}\n${body.trim()}`
      : title.trim();
    try {
      await createPost.mutateAsync({
        title: title.trim(),
        content,
        category: categoryKey,
      });
      setTitle("");
      setBody("");
      toast.success("Discussion post ho gayi!");
    } catch {
      toast.error("Post nahi ho payi, dobara try karo");
    }
  };

  const sortedPosts = [...posts].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  return (
    <div className="space-y-4">
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`bg-gradient-to-r ${cat.bannerClass} rounded-xl p-5 text-white flex items-center gap-4`}
      >
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">{cat.label}</h2>
          <p className="text-white/80 text-sm">{cat.description}</p>
        </div>
      </motion.div>

      {/* New discussion form */}
      <div
        className="bg-card border border-border rounded-xl p-4 space-y-3"
        data-ocid="discussions.panel"
      >
        <h3 className="text-sm font-semibold text-foreground">
          Nayi Discussion Shuru Karo
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder={
              categoryKey === "education"
                ? "Topic ya sawaal likhein (e.g. AI kya hai?)"
                : "Apni baat share karo…"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm"
            data-ocid="discussions.input"
          />
          <Textarea
            placeholder="Aur detail mein likho (optional)…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            data-ocid="discussions.textarea"
          />
          <Button
            type="submit"
            size="sm"
            className={`rounded-full px-6 text-xs font-semibold ${cat.submitClass}`}
            disabled={createPost.isPending || !title.trim()}
            data-ocid="discussions.submit_button"
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Posting…
              </>
            ) : (
              "Post Discussion"
            )}
          </Button>
        </form>
      </div>

      {/* Posts feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div
            className="flex justify-center py-12"
            data-ocid="discussions.loading_state"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sortedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-3"
            data-ocid="discussions.empty_state"
          >
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center border-2 ${cat.accentClass}`}
            >
              <Icon className="h-7 w-7" />
            </div>
            <p className="text-base font-semibold text-foreground">
              Koi discussion nahi abhi
            </p>
            <p className="text-sm text-muted-foreground">
              Pehli discussion shuru karo!
            </p>
          </motion.div>
        ) : (
          sortedPosts.map((post, idx) => (
            <DiscussionCard
              key={post.id.toString()}
              post={post}
              index={idx}
              currentUserId={currentUserId}
              allUsers={allUsers}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function DiscussionsPage() {
  const [activeTab, setActiveTab] = useState("education");
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const { data: allUsers = [] } = useGetAllUsers();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Discussions</h1>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Apni baat share karo — seekho, sikhao, aur support lo
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 bg-accent/40 p-1 rounded-xl">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.key;
          return (
            <button
              type="button"
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `${cat.tabActiveClass} shadow-sm`
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{cat.label}</span>
              <span className="sm:hidden">
                {cat.key === "education" ? "Education" : "Emotions"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active category content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <CategorySection
            categoryKey={activeTab}
            currentUserId={currentUserId}
            allUsers={allUsers}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
