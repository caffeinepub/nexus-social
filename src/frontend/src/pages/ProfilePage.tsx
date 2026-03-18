import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import { Camera, Edit3, Loader2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import PostCard from "../components/PostCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetFollowers,
  useGetUserFeed,
  useUpdateProfile,
} from "../hooks/useQueries";
import { getInitials } from "../utils/format";

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const currentPrincipal = identity?.getPrincipal() ?? null;
  const { data: userPosts = [], isLoading: postsLoading } = useGetUserFeed(
    currentPrincipal as unknown as Principal,
  );
  const { data: followers = [] } = useGetFollowers(
    currentPrincipal as unknown as Principal,
  );
  const updateProfile = useUpdateProfile();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const currentUserId = identity?.getPrincipal().toString() || "";

  const openEdit = () => {
    setEditName(profile?.displayName || "");
    setEditBio(profile?.bio || "");
    setNewAvatar(null);
    setAvatarPreview(null);
    setEditOpen(true);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewAvatar(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      let avatarBlob: ExternalBlob | null = null;
      if (newAvatar) {
        const bytes = new Uint8Array(await newAvatar.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
      }
      await updateProfile.mutateAsync({
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarBlob,
      });
      setEditOpen(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const avatarUrl = avatarPreview || profile?.avatarBlob?.getDirectURL();
  const displayName = profile?.displayName || "Anonymous";

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl shadow-card overflow-hidden"
      >
        {/* Cover */}
        <div className="h-28 bg-gradient-to-br from-primary/10 via-accent to-secondary" />

        <div className="px-6 pb-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-card shadow-card">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="mb-1 ml-auto">
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={openEdit}
                    data-ocid="profile.edit_button"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                    Edit profile
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="profile.dialog">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSave} className="space-y-4">
                    {/* Avatar upload */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className="relative cursor-pointer focus:outline-none"
                        onClick={() => fileRef.current?.click()}
                      >
                        <Avatar className="h-20 w-20">
                          {avatarPreview ? (
                            <AvatarImage src={avatarPreview} />
                          ) : profile?.avatarBlob ? (
                            <AvatarImage
                              src={profile.avatarBlob.getDirectURL()}
                            />
                          ) : null}
                          <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                            {getInitials(editName || displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarSelect}
                        data-ocid="profile.upload_button"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Display Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                        data-ocid="profile.input"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Bio</Label>
                      <Textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell people about yourself…"
                        rows={3}
                        className="resize-none"
                        data-ocid="profile.textarea"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full rounded-full"
                      disabled={updateProfile.isPending || !editName.trim()}
                      data-ocid="profile.save_button"
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-base font-bold text-foreground">
                {userPosts.length}
              </p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">
                {followers.length}
              </p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Your Posts</h2>
        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-4"
              >
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : userPosts.length === 0 ? (
          <div
            className="bg-card border border-border rounded-xl p-10 text-center"
            data-ocid="profile.empty_state"
          >
            <Edit3 className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No posts yet. Share what's on your mind!
            </p>
          </div>
        ) : (
          userPosts.map((post, i) => (
            <PostCard
              key={post.id.toString()}
              post={post}
              authorProfile={profile ?? undefined}
              authorId={currentPrincipal as unknown as Principal}
              currentUserId={currentUserId}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
