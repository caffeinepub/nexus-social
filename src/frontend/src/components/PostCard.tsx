import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import {
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Post, UserProfile } from "../hooks/useQueries";
import {
  useAddComment,
  useGetComments,
  useGetPostLikes,
  useLikePost,
} from "../hooks/useQueries";
import { formatTimestamp, getInitials } from "../utils/format";

interface Props {
  post: Post;
  authorProfile: UserProfile | undefined;
  authorId: Principal;
  currentUserId: string;
  index: number;
}

export default function PostCard({
  post,
  authorProfile,
  authorId,
  currentUserId,
  index,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likedLocally, setLikedLocally] = useState(false);
  const [localLikeOffset, setLocalLikeOffset] = useState(0);

  const { data: likeCount = BigInt(0) } = useGetPostLikes(post.id);
  const { data: comments = [] } = useGetComments(post.id);
  const likePost = useLikePost();
  const addComment = useAddComment();

  const handleLike = async () => {
    if (likedLocally) return;
    setLikedLocally(true);
    setLocalLikeOffset((p) => p + 1);
    try {
      await likePost.mutateAsync(post.id);
    } catch {
      setLikedLocally(false);
      setLocalLikeOffset((p) => p - 1);
      toast.error("Failed to like post");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
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
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const displayName =
    authorProfile?.displayName || `User ${authorId.toString().slice(0, 8)}`;
  const avatarUrl = authorProfile?.avatarBlob?.getDirectURL();
  const postImageUrl = post.imageBlob?.getDirectURL();
  const totalLikes = Number(likeCount) + localLikeOffset;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
      data-ocid={`feed.item.${index + 1}`}
    >
      {/* Post header */}
      <div className="flex items-start gap-3 p-4">
        <Avatar className="h-9 w-9 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate">
              {displayName}
            </span>
            {authorId.toString() === currentUserId && (
              <span className="text-[10px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                You
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(post.timestamp)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full shrink-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShare}>
              Share post
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(post.content)}
            >
              Copy text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post image */}
      {postImageUrl && (
        <div className="mx-4 mb-3 rounded-lg overflow-hidden border border-border">
          <img
            src={postImageUrl}
            alt="Shared media"
            className="w-full object-cover max-h-80"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
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
          data-ocid={`feed.item.${index + 1}.toggle`}
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
          data-ocid={`feed.item.${index + 1}.button`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {comments.length > 0 && <span>{comments.length}</span>}
          <span>Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={handleShare}
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </Button>
      </div>

      {/* Comments section */}
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
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={`${c.timestamp}`}
                    className="flex gap-2"
                    data-ocid={`feed.item.${index + 1}.row`}
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
                  placeholder="Write a comment…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="resize-none min-h-[36px] h-9 py-2 text-xs rounded-full"
                  data-ocid={`feed.item.${index + 1}.textarea`}
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
                  data-ocid={`feed.item.${index + 1}.submit_button`}
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
