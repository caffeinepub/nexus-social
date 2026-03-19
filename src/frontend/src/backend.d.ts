import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type UserId = Principal;
export type Time = bigint;
export interface Comment {
    content: string;
    author: UserId;
    timestamp: Time;
    postId: bigint;
}
export interface Post {
    id: bigint;
    content: string;
    imageBlob?: ExternalBlob;
    author: UserId;
    timestamp: Time;
    category?: string;
}
export interface Notification {
    id: Time;
    user: UserId;
    message: string;
    timestamp: Time;
}
export interface Message {
    content: string;
    recipient: UserId;
    sender: UserId;
    timestamp: Time;
}
export interface UserProfile {
    bio: string;
    displayName: string;
    avatarBlob?: ExternalBlob;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(postId: bigint, content: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDiscussionPost(title: string, content: string, category: string): Promise<bigint>;
    createPost(content: string, imageBlob: ExternalBlob | null): Promise<bigint>;
    deletePost(postId: bigint): Promise<void>;
    followUser(target: UserId): Promise<void>;
    getAllPosts(): Promise<Array<Post>>;
    getAllUsers(): Promise<Array<[UserId, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: bigint): Promise<Array<Comment>>;
    getFeed(): Promise<Array<Post>>;
    getFollowedFeed(): Promise<Array<Post>>;
    getFollowers(userId: UserId): Promise<Array<UserId>>;
    getLikes(postId: bigint): Promise<bigint>;
    getMessages(userId: UserId): Promise<Array<Message>>;
    getNotifications(): Promise<Array<Notification>>;
    getPost(postId: bigint): Promise<Post>;
    getPostsByCategory(category: string): Promise<Array<Post>>;
    getProfile(userId: UserId): Promise<UserProfile>;
    getUserFeed(userId: UserId): Promise<Array<Post>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    likePost(postId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(recipient: UserId, content: string): Promise<void>;
    unfollowUser(target: UserId): Promise<void>;
    updateProfile(displayName: string, bio: string, avatarBlob: ExternalBlob | null): Promise<void>;
}
