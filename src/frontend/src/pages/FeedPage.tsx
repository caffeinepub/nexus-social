import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import { Link } from "@tanstack/react-router";
import { Image, Loader2, Plus, Send, Users } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import PostCard from "../components/PostCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreatePost,
  useGetAllUsers,
  useGetCallerUserProfile,
  useGetFeed,
  useSendMessage,
} from "../hooks/useQueries";
import { getInitials } from "../utils/format";

// Sample posts shown when feed is empty
const SAMPLE_POSTS = [
  {
    id: BigInt(-1),
    content:
      "Just shipped a major update to our distributed storage layer — zero downtime migration across 47 nodes. Sometimes I can't believe we built this! 🚀",
    author: "sample-1",
    authorName: "Alex Rivera",
    timestamp: BigInt(Date.now() - 1_800_000) * BigInt(1_000_000),
    image: "/assets/generated/sample-post-1.dim_800x450.jpg",
  },
  {
    id: BigInt(-2),
    content:
      "Found the most incredible coffee spot this morning. The barista does these intricate latte art designs that take like 5 minutes each. Totally worth the wait ☕",
    author: "sample-2",
    authorName: "Maya Chen",
    timestamp: BigInt(Date.now() - 7_200_000) * BigInt(1_000_000),
    image: "/assets/generated/sample-post-2.dim_800x450.jpg",
  },
  {
    id: BigInt(-3),
    content:
      "Hot take: the best way to learn a new programming language is to immediately try to build something you care about with it. Tutorials are fine, but nothing beats genuine motivation.",
    author: "sample-3",
    authorName: "Jordan Kim",
    timestamp: BigInt(Date.now() - 14_400_000) * BigInt(1_000_000),
    image: null,
  },
  {
    id: BigInt(-4),
    content:
      "Reminder that you don't need to be productive every single day. Rest is part of the process. Took the afternoon off and went hiking — came back with clearer thoughts than any sprint planning session could produce.",
    author: "sample-4",
    authorName: "Sam Okonkwo",
    timestamp: BigInt(Date.now() - 28_800_000) * BigInt(1_000_000),
    image: null,
  },
];

const SAMPLE_MESSAGES = [
  {
    id: "s1",
    name: "Alex Rivera",
    preview: "Just saw your update — amazing work!",
    online: true,
  },
  {
    id: "s2",
    name: "Maya Chen",
    preview: "Are you going to the meetup next week?",
    online: false,
  },
  {
    id: "s3",
    name: "Jordan Kim",
    preview: "Thanks for the code review feedback 🙌",
    online: true,
  },
];

export default function FeedPage() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const { data: posts, isLoading: postsLoading } = useGetFeed();
  const { data: allUsers = [] } = useGetAllUsers();
  const createPost = useCreatePost();
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = identity?.getPrincipal().toString() || "";
  const userMap = new Map<string, (typeof allUsers)[0][1]>(
    allUsers.map(([uid, prof]) => [uid.toString(), prof]),
  );

  // People to display: other users excluding self, max 5
  const otherUsers = allUsers
    .filter(([uid]) => uid.toString() !== currentUserId)
    .slice(0, 5);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!postContent.trim() && !selectedImage) return;
    try {
      let imageBlob: ExternalBlob | null = null;
      if (selectedImage) {
        const bytes = new Uint8Array(await selectedImage.arrayBuffer());
        imageBlob = ExternalBlob.fromBytes(bytes);
      }
      await createPost.mutateAsync({ content: postContent.trim(), imageBlob });
      setPostContent("");
      setSelectedImage(null);
      setImagePreview(null);
      toast.success("Post published!");
    } catch {
      toast.error("Failed to create post. Please try again.");
    }
  };

  const avatarUrl = profile?.avatarBlob?.getDirectURL();
  const displayName = profile?.displayName || "You";
  const hasPosts = posts && posts.length > 0;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Main feed column */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Composer */}
          <div className="bg-card border border-border rounded-xl shadow-card p-4">
            <div className="flex gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="resize-none border-0 bg-accent/50 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-border min-h-[44px]"
                  data-ocid="feed.textarea"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) handlePost();
                  }}
                />
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 rounded-lg object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    data-ocid="feed.upload_button"
                  >
                    <Image className="h-4 w-4" />
                    <span>Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    size="sm"
                    className="rounded-full h-8 px-4 text-xs font-semibold"
                    onClick={handlePost}
                    disabled={
                      createPost.isPending ||
                      (!postContent.trim() && !selectedImage)
                    }
                    data-ocid="feed.submit_button"
                  >
                    {createPost.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {postsLoading ? (
            <div className="space-y-4" data-ocid="feed.loading_state">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : hasPosts ? (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <PostCard
                  key={post.id.toString()}
                  post={post}
                  authorProfile={userMap.get(post.author.toString())}
                  authorId={post.author as unknown as Principal}
                  currentUserId={currentUserId}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4" data-ocid="feed.empty_state">
              <p className="text-xs text-muted-foreground text-center py-2">
                ✨ Sample feed — create your first post above
              </p>
              {SAMPLE_POSTS.map((sp, i) => (
                <motion.article
                  key={sp.id.toString()}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
                  data-ocid={`feed.item.${i + 1}`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-foreground">
                        {getInitials(sp.authorName)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{sp.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(
                          (Date.now() -
                            Number(sp.timestamp / BigInt(1_000_000))) /
                            60_000,
                        )}
                        m ago
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-3">
                    <p className="text-sm leading-relaxed">{sp.content}</p>
                  </div>
                  {sp.image && (
                    <div className="mx-4 mb-3 rounded-lg overflow-hidden border border-border">
                      <img
                        src={sp.image}
                        alt=""
                        className="w-full object-cover max-h-72"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex gap-1 px-3 py-2 border-t border-border">
                    {["❤️ Like", "💬 Comment", "↗ Share"].map((action) => (
                      <button
                        type="button"
                        key={action}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="w-72 shrink-0 hidden lg:block space-y-4">
          {/* Members stat card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-xl shadow-card p-4"
            data-ocid="feed.card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">
                  {allUsers.length}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registered Members
                </p>
              </div>
            </div>
          </motion.div>

          {/* People */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
            data-ocid="feed.people.card"
          >
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                People
              </h2>
            </div>
            <div className="divide-y divide-border">
              {otherUsers.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground px-4 py-3"
                  data-ocid="feed.people.empty_state"
                >
                  No members yet
                </p>
              ) : (
                otherUsers.map(([uid, person], i) => {
                  const name = person.displayName || uid.toString().slice(0, 8);
                  const avatarBlobUrl = person.avatarBlob?.getDirectURL();
                  return (
                    <div
                      key={uid.toString()}
                      className="flex items-center gap-3 px-4 py-2.5"
                      data-ocid={`feed.people.item.${i + 1}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        {avatarBlobUrl && (
                          <AvatarImage src={avatarBlobUrl} alt={name} />
                        )}
                        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-foreground">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="flex-1 min-w-0 text-xs font-semibold text-foreground truncate">
                        {name}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2.5 text-[10px] font-semibold rounded-full shrink-0"
                        onClick={() => toast.success(`Following ${name}!`)}
                        data-ocid={`feed.people.toggle.${i + 1}`}
                      >
                        Follow
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Messages */}
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden sticky top-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Messages
              </h2>
              <Link to="/messages">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs rounded-full"
                  data-ocid="feed.primary_button"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {SAMPLE_MESSAGES.map((m, i) => (
                <Link
                  to="/messages"
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                  data-ocid={`feed.messages.item.${i + 1}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-foreground">
                        {getInitials(m.name)}
                      </span>
                    </div>
                    {m.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-online rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.preview}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border">
              <Link
                to="/messages"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="feed.messages.link"
              >
                View all messages →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
