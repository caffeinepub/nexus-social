import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import {
  CornerDownRight,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Post, UserProfile } from "../hooks/useQueries";
import {
  useAddComment,
  useDeletePost,
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
  userMap?: Map<string, UserProfile>;
}

function parseComment(content: string): {
  isReply: boolean;
  parentTimestamp: string | null;
  text: string;
} {
  if (content.startsWith("__reply__")) {
    const withoutPrefix = content.slice("__reply__".length);
    const sep = withoutPrefix.indexOf("__");
    if (sep !== -1) {
      return {
        isReply: true,
        parentTimestamp: withoutPrefix.slice(0, sep),
        text: withoutPrefix.slice(sep + 2),
      };
    }
  }
  return { isReply: false, parentTimestamp: null, text: content };
}

export default function PostCard({
  post,
  authorProfile,
  authorId,
  currentUserId,
  index,
  userMap = new Map(),
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likedLocally, setLikedLocally] = useState(false);
  const [localLikeOffset, setLocalLikeOffset] = useState(0);
  const [replyingTo, setReplyingTo] = useState<bigint | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: likeCount = BigInt(0) } = useGetPostLikes(post.id);
  const { data: comments = [] } = useGetComments(post.id);
  const likePost = useLikePost();
  const addComment = useAddComment();
  const deletePost = useDeletePost();

  const isOwner = authorId.toString() === currentUserId;

  // Build threaded structure
  const topLevelComments = comments.filter(
    (c) => !parseComment(c.content).isReply,
  );
  const repliesMap = new Map<string, typeof comments>();
  for (const c of comments) {
    const parsed = parseComment(c.content);
    if (parsed.isReply && parsed.parentTimestamp) {
      const arr = repliesMap.get(parsed.parentTimestamp) ?? [];
      arr.push(c);
      repliesMap.set(parsed.parentTimestamp, arr);
    }
  }

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

  const handleDelete = async () => {
    if (!confirm("Kya aap is post ko delete karna chahte hain?")) return;
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Post delete ho gayi!");
    } catch {
      toast.error("Post delete nahi hui");
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
      toast.error("Failed to add comment");
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replyingTo === null) return;
    try {
      await addComment.mutateAsync({
        postId: post.id,
        content: `__reply__${replyingTo.toString()}__${replyText.trim()}`,
      });
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply add ho gayi!");
    } catch {
      toast.error("Failed to add reply");
    }
  };

  const displayName =
    authorProfile?.displayName || `User ${authorId.toString().slice(0, 8)}`;
  const avatarUrl = authorProfile?.avatarBlob?.getDirectURL();
  const postImageUrl = post.imageBlob?.getDirectURL();
  const totalLikes = Number(likeCount) + localLikeOffset;
  const topLevelCount = topLevelComments.length;

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
            {isOwner && (
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
            {isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                  disabled={deletePost.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              </>
            )}
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
              {topLevelCount === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Koi comment nahi abhi tak. Pehle comment karo!
                </p>
              ) : (
                topLevelComments.map((c) => {
                  const commenterProfile = userMap.get(c.author.toString());
                  const commenterName =
                    commenterProfile?.displayName ||
                    `User ${c.author.toString().slice(0, 8)}`;
                  const commenterAvatar =
                    commenterProfile?.avatarBlob?.getDirectURL();
                  const isCurrentUser = c.author.toString() === currentUserId;
                  const tsKey = c.timestamp.toString();
                  const replies = repliesMap.get(tsKey) ?? [];
                  const isReplyingHere = replyingTo === c.timestamp;

                  return (
                    <div key={tsKey} data-ocid={`feed.item.${index + 1}.row`}>
                      {/* Top-level comment */}
                      <div className="flex gap-2">
                        <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                          {commenterAvatar && (
                            <AvatarImage
                              src={commenterAvatar}
                              alt={commenterName}
                            />
                          )}
                          <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-foreground">
                            {getInitials(commenterName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="bg-accent rounded-xl px-3 py-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs font-semibold text-foreground">
                                {commenterName}
                              </p>
                              {isCurrentUser && (
                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-foreground">
                              {c.content}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatTimestamp(c.timestamp)}
                            </p>
                          </div>
                          {/* Reply button + reply count */}
                          <div className="flex items-center gap-2 mt-1 ml-1">
                            <button
                              type="button"
                              className="text-[11px] text-muted-foreground hover:text-primary font-medium transition-colors"
                              onClick={() => {
                                if (isReplyingHere) {
                                  setReplyingTo(null);
                                  setReplyText("");
                                } else {
                                  setReplyingTo(c.timestamp);
                                  setReplyText("");
                                }
                              }}
                              data-ocid={`feed.item.${index + 1}.button`}
                            >
                              {isReplyingHere ? "Cancel" : "Reply"}
                            </button>
                            {replies.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                {replies.length}{" "}
                                {replies.length === 1 ? "reply" : "replies"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {replies.length > 0 && (
                        <div className="ml-9 mt-2 space-y-2">
                          {replies.map((r) => {
                            const parsed = parseComment(r.content);
                            const rProfile = userMap.get(r.author.toString());
                            const rName =
                              rProfile?.displayName ||
                              `User ${r.author.toString().slice(0, 8)}`;
                            const rAvatar =
                              rProfile?.avatarBlob?.getDirectURL();
                            const rIsMe = r.author.toString() === currentUserId;
                            return (
                              <div
                                key={r.timestamp.toString()}
                                className="flex gap-2"
                              >
                                <div className="flex flex-col items-center">
                                  <CornerDownRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                                </div>
                                <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                                  {rAvatar && (
                                    <AvatarImage src={rAvatar} alt={rName} />
                                  )}
                                  <AvatarFallback className="text-[8px] font-semibold bg-primary/10 text-foreground">
                                    {getInitials(rName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-muted-foreground mb-0.5">
                                    Replying to {commenterName}
                                  </p>
                                  <div className="bg-accent/60 rounded-xl px-3 py-1.5">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <p className="text-xs font-semibold text-foreground">
                                        {rName}
                                      </p>
                                      {rIsMe && (
                                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-foreground">
                                      {parsed.text}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {formatTimestamp(r.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline reply input */}
                      <AnimatePresence>
                        {isReplyingHere && (
                          <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            onSubmit={handleReply}
                            className="ml-9 mt-2 flex gap-2 overflow-hidden"
                          >
                            <Textarea
                              placeholder={`Reply to ${commenterName}…`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="resize-none min-h-[36px] h-9 py-2 text-xs rounded-full flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReply(e);
                                }
                                if (e.key === "Escape") {
                                  setReplyingTo(null);
                                  setReplyText("");
                                }
                              }}
                              data-ocid={`feed.item.${index + 1}.textarea`}
                            />
                            <div className="flex gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-full h-9 px-3 text-xs"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText("");
                                }}
                                data-ocid={`feed.item.${index + 1}.cancel_button`}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                className="rounded-full h-9 px-4 text-xs"
                                disabled={
                                  addComment.isPending || !replyText.trim()
                                }
                                data-ocid={`feed.item.${index + 1}.submit_button`}
                              >
                                {addComment.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Post"
                                )}
                              </Button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}

              {/* New comment input */}
              <form onSubmit={handleComment} className="flex gap-2">
                <Textarea
                  placeholder="Comment likho…"
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
