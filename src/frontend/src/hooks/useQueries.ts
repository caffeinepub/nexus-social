import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message, Notification, Post, UserProfile } from "../backend";
import { useActor } from "./useActor";

export type { UserProfile, Post, Message, Notification };

export function useGetFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      if (!actor) return [];
      const posts = await actor.getFeed();
      return [...posts].sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<[Principal, UserProfile][]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      const notifs = await actor.getNotifications();
      return [...notifs].sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useGetMessages(userId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const msgs = await actor.getMessages(userId);
      return [...msgs].sort((a, b) => Number(a.timestamp - b.timestamp));
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 10_000,
  });
}

export function useGetPostLikes(postId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["likes", postId.toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getLikes(postId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetComments(postId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["comments", postId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      const comments = await actor.getComments(postId);
      return [...comments].sort((a, b) => Number(a.timestamp - b.timestamp));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserFeed(userId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Post[]>({
    queryKey: ["userFeed", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const posts = await actor.getUserFeed(userId);
      return [...posts].sort((a, b) => Number(b.timestamp - a.timestamp));
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useGetFollowers(userId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["followers", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getFollowers(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      content,
      imageBlob,
    }: {
      content: string;
      imageBlob: import("../backend").ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createPost(content, imageBlob);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["userFeed"] });
    },
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.likePost(postId);
    },
    onSuccess: (_data, postId) => {
      qc.invalidateQueries({ queryKey: ["likes", postId.toString()] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      content,
    }: { postId: bigint; content: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addComment(postId, content);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.postId.toString()] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      recipient,
      content,
    }: {
      recipient: Principal;
      content: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendMessage(recipient, content);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["messages", vars.recipient.toString()],
      });
    },
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.followUser(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
      qc.invalidateQueries({ queryKey: ["followers"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.unfollowUser(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
      qc.invalidateQueries({ queryKey: ["followers"] });
    },
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      displayName,
      bio,
      avatarBlob,
    }: {
      displayName: string;
      bio: string;
      avatarBlob: import("../backend").ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProfile(displayName, bio, avatarBlob);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}
