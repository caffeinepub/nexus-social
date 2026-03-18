import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@dfinity/principal";
import { Search, UserCheck, UserPlus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useFollowUser, useGetAllUsers } from "../hooks/useQueries";
import { getInitials } from "../utils/format";

export default function ExplorePage() {
  const { identity } = useInternetIdentity();
  const { data: allUsers = [], isLoading } = useGetAllUsers();
  const followUser = useFollowUser();
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const currentUserId = identity?.getPrincipal().toString() || "";

  const otherUsers = allUsers.filter(
    ([uid]) => uid.toString() !== currentUserId,
  );
  const filtered = searchQuery
    ? otherUsers.filter(
        ([, prof]) =>
          prof.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.bio.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : otherUsers;

  const handleFollow = async (uid: Principal) => {
    const key = uid.toString();
    if (followed.has(key)) return;
    setFollowed((prev) => new Set([...prev, key]));
    try {
      await followUser.mutateAsync(uid);
      toast.success("Following!");
    } catch {
      setFollowed((prev) => {
        const s = new Set(prev);
        s.delete(key);
        return s;
      });
      toast.error("Failed to follow user");
    }
  };

  // Sample users shown when no real users exist
  const SAMPLE_USERS = [
    {
      id: "s1",
      name: "Alex Rivera",
      bio: "Software engineer. Coffee addict. Building the future one commit at a time.",
      posts: 24,
    },
    {
      id: "s2",
      name: "Maya Chen",
      bio: "Designer & creative director. I make things look beautiful and work intuitively.",
      posts: 18,
    },
    {
      id: "s3",
      name: "Jordan Kim",
      bio: "Founder @BuildWithAI. Previously @GoogleX. Writing about tech, culture, and ideas.",
      posts: 57,
    },
    {
      id: "s4",
      name: "Sam Okonkwo",
      bio: "Athlete, entrepreneur, and community builder. Passionate about fitness and wellness.",
      posts: 31,
    },
    {
      id: "s5",
      name: "Riley Park",
      bio: "Journalist covering emerging tech & digital rights. Bylines in The Atlantic, Wired.",
      posts: 43,
    },
    {
      id: "s6",
      name: "Casey Lim",
      bio: "Full-stack developer. Open source enthusiast. Building in public.",
      posts: 12,
    },
  ];

  const showSamples = !isLoading && filtered.length === 0 && !searchQuery;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Explore People</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover and connect with others on Nexus
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or bio…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-full"
          data-ocid="explore.search_input"
        />
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="explore.loading_state"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-1.5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : showSamples ? (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            ✨ Sample profiles — invite friends to join Nexus
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_USERS.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-5 shadow-card"
                data-ocid={`explore.item.${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {getInitials(user.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.posts} posts
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                  {user.bio}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 rounded-full text-xs"
                  disabled
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Follow
                </Button>
              </motion.div>
            ))}
          </div>
        </>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" data-ocid="explore.empty_state">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">
            No users found for "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(([uid, prof], i) => {
            const key = uid.toString();
            const isFollowed = followed.has(key);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-xl p-5 shadow-card"
                data-ocid={`explore.item.${i + 1}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    {prof.avatarBlob && (
                      <AvatarImage src={prof.avatarBlob.getDirectURL()} />
                    )}
                    <AvatarFallback className="text-sm font-bold bg-primary/10 text-foreground">
                      {getInitials(prof.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {prof.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {key.slice(0, 12)}…
                    </p>
                  </div>
                </div>
                {prof.bio && (
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                    {prof.bio}
                  </p>
                )}
                <Button
                  size="sm"
                  variant={isFollowed ? "secondary" : "outline"}
                  className="w-full mt-3 rounded-full text-xs"
                  onClick={() => handleFollow(uid as unknown as Principal)}
                  disabled={isFollowed || followUser.isPending}
                  data-ocid={`explore.item.${i + 1}.button`}
                >
                  {isFollowed ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      Follow
                    </>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
