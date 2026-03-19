import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  FlaskConical,
  Globe,
  Heart,
  Landmark,
  Lightbulb,
  Loader2,
  MessageCircle,
  Monitor,
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

const KNOWLEDGE_CATEGORIES = [
  {
    key: "knowledge_science",
    label: "Science",
    icon: FlaskConical,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    tabActive: "bg-blue-600 text-white shadow-sm",
  },
  {
    key: "knowledge_technology",
    label: "Technology",
    icon: Monitor,
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    tabActive: "bg-purple-600 text-white shadow-sm",
  },
  {
    key: "knowledge_health",
    label: "Health",
    icon: Heart,
    color:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
    tabActive: "bg-green-600 text-white shadow-sm",
  },
  {
    key: "knowledge_history",
    label: "History",
    icon: Landmark,
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    tabActive: "bg-amber-500 text-white shadow-sm",
  },
  {
    key: "knowledge_general",
    label: "General",
    icon: Globe,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300",
    badgeClass:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700",
    tabActive: "bg-gray-600 text-white shadow-sm",
  },
];

function getCatMeta(key: string) {
  return (
    KNOWLEDGE_CATEGORIES.find((c) => c.key === key) ?? KNOWLEDGE_CATEGORIES[4]
  );
}

// ---- KnowledgeCard ----
function KnowledgeCard({
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

  const catMeta = getCatMeta(post.category ?? "knowledge_general");
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

  const Icon = catMeta.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
      data-ocid={`knowledge.item.${index + 1}`}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar className="h-9 w-9 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
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
        <Badge
          variant="outline"
          className={`text-[10px] px-2 py-0.5 shrink-0 flex items-center gap-1 ${catMeta.badgeClass}`}
        >
          <Icon className="h-3 w-3" />
          {catMeta.label}
        </Badge>
      </div>

      <div className="px-4 pb-3">
        {title && (
          <p className="text-sm font-bold text-foreground mb-1 leading-snug">
            {title}
          </p>
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
          data-ocid={`knowledge.item.${index + 1}.toggle`}
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
          data-ocid={`knowledge.item.${index + 1}.button`}
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
                    data-ocid={`knowledge.item.${index + 1}.row`}
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
                  data-ocid={`knowledge.item.${index + 1}.textarea`}
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
                  data-ocid={`knowledge.item.${index + 1}.submit_button`}
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

// ---- All-categories fetcher (always fetch all, merge for "all" tab) ----
function KnowledgeFeed({
  activeCategory,
  currentUserId,
  allUsers,
}: {
  activeCategory: string;
  currentUserId: string;
  allUsers: [
    import("@dfinity/principal").Principal,
    import("../hooks/useQueries").UserProfile,
  ][];
}) {
  const sciencePosts = useGetPostsByCategory("knowledge_science");
  const techPosts = useGetPostsByCategory("knowledge_technology");
  const healthPosts = useGetPostsByCategory("knowledge_health");
  const historyPosts = useGetPostsByCategory("knowledge_history");
  const generalPosts = useGetPostsByCategory("knowledge_general");

  const allCatResults = [
    sciencePosts,
    techPosts,
    healthPosts,
    historyPosts,
    generalPosts,
  ];

  let posts: Post[];
  let isLoading: boolean;

  if (activeCategory === "all") {
    isLoading = allCatResults.some((r) => r.isLoading);
    const merged = allCatResults.flatMap((r) => r.data ?? []);
    posts = [...merged].sort((a, b) => Number(b.timestamp - a.timestamp));
  } else {
    const catIndex = [
      "knowledge_science",
      "knowledge_technology",
      "knowledge_health",
      "knowledge_history",
      "knowledge_general",
    ].indexOf(activeCategory);
    const result = allCatResults[catIndex];
    isLoading = result?.isLoading ?? false;
    posts = result?.data ?? [];
  }

  if (isLoading) {
    return (
      <div
        className="flex justify-center py-16"
        data-ocid="knowledge.loading_state"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16 space-y-3"
        data-ocid="knowledge.empty_state"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-accent flex items-center justify-center">
          <Lightbulb className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold text-foreground">
          Koi post nahi abhi
        </p>
        <p className="text-sm text-muted-foreground">
          Pehli knowledge post share karo!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, idx) => (
        <KnowledgeCard
          key={post.id.toString()}
          post={post}
          index={idx}
          currentUserId={currentUserId}
          allUsers={allUsers}
        />
      ))}
    </div>
  );
}

// ---- Main Page ----
export default function KnowledgePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postCategory, setPostCategory] = useState("knowledge_general");

  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const { data: allUsers = [] } = useGetAllUsers();
  const createPost = useCreateDiscussionPost();

  const TABS = [
    { key: "all", label: "All", icon: BookOpen },
    ...KNOWLEDGE_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      icon: c.icon,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      toast.error("Title zaroori hai");
      return;
    }
    const content = postBody.trim()
      ? `${postTitle.trim()}\n${postBody.trim()}`
      : postTitle.trim();
    try {
      await createPost.mutateAsync({
        title: postTitle.trim(),
        content,
        category: postCategory,
      });
      setPostTitle("");
      setPostBody("");
      toast.success("Knowledge post share ho gayi! 🎉");
    } catch {
      toast.error("Post nahi ho payi, dobara try karo");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">Knowledge Feed</h1>
          <Lightbulb className="h-5 w-5 text-amber-500" />
        </div>
        <p className="text-sm text-muted-foreground">
          Science, Technology, Health, History — sab kuch share karo
        </p>
      </motion.div>

      {/* Category filter tabs */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        data-ocid="knowledge.tab"
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeCategory === key;
          const catMeta = KNOWLEDGE_CATEGORIES.find((c) => c.key === key);
          const activeClass =
            catMeta?.tabActive ??
            "bg-primary text-primary-foreground shadow-sm";
          return (
            <button
              type="button"
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? activeClass
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Create post form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-4 space-y-3"
        data-ocid="knowledge.panel"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center shrink-0">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Knowledge Share Karo
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Title: kya share karna chahte ho? (e.g. Photosynthesis kya hai?)"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            className="text-sm"
            data-ocid="knowledge.input"
          />
          <Textarea
            placeholder="Aur detail mein samjhao (optional)…"
            value={postBody}
            onChange={(e) => setPostBody(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            data-ocid="knowledge.textarea"
          />
          <div className="flex items-center gap-2">
            <Select value={postCategory} onValueChange={setPostCategory}>
              <SelectTrigger
                className="h-8 text-xs rounded-full w-44"
                data-ocid="knowledge.select"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {KNOWLEDGE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem
                      key={cat.key}
                      value={cat.key}
                      className="text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {cat.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="sm"
              className="rounded-full px-5 text-xs font-semibold ml-auto"
              disabled={createPost.isPending || !postTitle.trim()}
              data-ocid="knowledge.submit_button"
            >
              {createPost.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Posting…
                </>
              ) : (
                "Share Knowledge"
              )}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Feed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <KnowledgeFeed
            activeCategory={activeCategory}
            currentUserId={currentUserId}
            allUsers={allUsers}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
