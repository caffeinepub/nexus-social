import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserId = Principal;

  type UserProfile = {
    displayName : Text;
    bio : Text;
    avatarBlob : ?Storage.ExternalBlob;
  };

  type Post = {
    id : Nat;
    author : UserId;
    content : Text;
    imageBlob : ?Storage.ExternalBlob;
    timestamp : Time.Time;
    category : ?Text;
  };

  type Comment = {
    postId : Nat;
    author : UserId;
    content : Text;
    timestamp : Time.Time;
  };

  type Message = {
    sender : UserId;
    recipient : UserId;
    content : Text;
    timestamp : Time.Time;
  };

  type Notification = {
    id : Time.Time;
    user : UserId;
    message : Text;
    timestamp : Time.Time;
  };

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be logged in");
    };
  };

  let userProfiles = Map.empty<UserId, UserProfile>();
  var nextPostId = 0;
  let posts = Map.empty<Nat, Post>();
  let likes = Map.empty<Nat, Set.Set<UserId>>();
  let comments = Map.empty<Nat, List.List<Comment>>();
  let followers = Map.empty<UserId, Set.Set<UserId>>();
  let messages = Map.empty<UserId, List.List<Message>>();
  let notifications = Map.empty<UserId, List.List<Notification>>();

  public shared ({ caller }) func updateProfile(displayName : Text, bio : Text, avatarBlob : ?Storage.ExternalBlob) : async () {
    requireAuth(caller);
    let profile : UserProfile = { displayName; bio; avatarBlob };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { return null };
    userProfiles.get(caller);
  };

  public query (_) func saveCallerUserProfile(_profile : UserProfile) : async () {
    Runtime.trap("Use updateProfile instead");
  };

  public query ({ caller = _ }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public query ({ caller = _ }) func getProfile(userId : UserId) : async UserProfile {
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func createPost(content : Text, imageBlob : ?Storage.ExternalBlob) : async Nat {
    requireAuth(caller);
    let post : Post = {
      id = nextPostId;
      author = caller;
      content;
      imageBlob;
      timestamp = Time.now();
      category = null;
    };
    posts.add(nextPostId, post);
    nextPostId += 1;
    post.id;
  };

  public shared ({ caller }) func createDiscussionPost(title : Text, content : Text, category : Text) : async Nat {
    requireAuth(caller);
    let post : Post = {
      id = nextPostId;
      author = caller;
      content = title # "\n" # content;
      imageBlob = null;
      timestamp = Time.now();
      category = ?category;
    };
    posts.add(nextPostId, post);
    nextPostId += 1;
    post.id;
  };

  public query ({ caller = _ }) func getPostsByCategory(category : Text) : async [Post] {
    let filteredPosts = posts.values().filter(
      func(post) {
        switch (post.category) {
          case (null) { false };
          case (?cat) { cat == category };
        };
      }
    );
    filteredPosts.toArray().sort(
      func(post1, post2) {
        if (post1.timestamp > post2.timestamp) { #less } else {
          if (post1.timestamp < post2.timestamp) { #greater } else { #equal };
        };
      }
    );
  };

  public shared ({ caller }) func deletePost(postId : Nat) : async () {
    requireAuth(caller);
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        if (post.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the author can delete this post");
        };
        posts.remove(postId);
        likes.remove(postId);
        comments.remove(postId);
      };
    };
  };

  public query ({ caller = _ }) func getPost(postId : Nat) : async Post {
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { post };
    };
  };

  public query ({ caller = _ }) func getAllPosts() : async [Post] {
    posts.values().toArray();
  };

  public shared ({ caller }) func likePost(postId : Nat) : async () {
    requireAuth(caller);
    let currentLikes = switch (likes.get(postId)) {
      case (null) { Set.empty<UserId>() };
      case (?set) { set };
    };
    if (currentLikes.contains(caller)) { Runtime.trap("Already liked") };
    currentLikes.add(caller);
    likes.add(postId, currentLikes);
    sendNotification(caller, postId, "Your post was liked!");
  };

  public query ({ caller = _ }) func getLikes(postId : Nat) : async Nat {
    switch (likes.get(postId)) {
      case (null) { 0 };
      case (?set) { set.size() };
    };
  };

  public shared ({ caller }) func addComment(postId : Nat, content : Text) : async () {
    requireAuth(caller);
    let comment : Comment = { postId; author = caller; content; timestamp = Time.now() };
    let existingComments = switch (comments.get(postId)) {
      case (null) { List.empty<Comment>() };
      case (?list) { list };
    };
    existingComments.add(comment);
    comments.add(postId, existingComments);
    sendNotification(caller, postId, "You received a new comment!");
  };

  public query ({ caller = _ }) func getComments(postId : Nat) : async [Comment] {
    switch (comments.get(postId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  public shared ({ caller }) func followUser(target : UserId) : async () {
    requireAuth(caller);
    let currentFollowers = switch (followers.get(target)) {
      case (null) { Set.empty<UserId>() };
      case (?set) { set };
    };
    if (currentFollowers.contains(caller)) { Runtime.trap("Already following") };
    currentFollowers.add(caller);
    followers.add(target, currentFollowers);
    sendUserNotification(target, "You have a new follower!");
  };

  public shared ({ caller }) func unfollowUser(target : UserId) : async () {
    requireAuth(caller);
    switch (followers.get(target)) {
      case (null) { Runtime.trap("Not following") };
      case (?set) {
        if (set.contains(caller)) {
          set.remove(caller);
          followers.add(target, set);
        } else { Runtime.trap("Not following") };
      };
    };
  };

  public query ({ caller = _ }) func getFollowers(userId : UserId) : async [UserId] {
    switch (followers.get(userId)) {
      case (null) { [] };
      case (?set) { set.values().toArray() };
    };
  };

  public shared ({ caller }) func sendMessage(recipient : UserId, content : Text) : async () {
    requireAuth(caller);
    let message : Message = { sender = caller; recipient; content; timestamp = Time.now() };
    let existingMessages = switch (messages.get(recipient)) {
      case (null) { List.empty<Message>() };
      case (?list) { list };
    };
    existingMessages.add(message);
    messages.add(recipient, existingMessages);
  };

  public query ({ caller }) func getMessages(userId : UserId) : async [Message] {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own messages");
    };
    switch (messages.get(userId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  func sendNotification(caller : UserId, postId : Nat, message : Text) {
    switch (posts.get(postId)) {
      case (null) { () };
      case (?post) { sendUserNotification(post.author, message) };
    };
  };

  func sendUserNotification(user : UserId, message : Text) {
    let notification : Notification = {
      id = Time.now();
      user;
      message;
      timestamp = Time.now();
    };
    let existingNotifications = switch (notifications.get(user)) {
      case (null) { List.empty<Notification>() };
      case (?list) { list };
    };
    existingNotifications.add(notification);
    notifications.add(user, existingNotifications);
  };

  public query ({ caller }) func getNotifications() : async [Notification] {
    if (caller.isAnonymous()) { return [] };
    switch (notifications.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray().reverse() };
    };
  };

  module Post {
    public func compareByTimeDesc(post1 : Post, post2 : Post) : Order.Order {
      if (post1.timestamp > post2.timestamp) { #less } else {
        if (post1.timestamp < post2.timestamp) { #greater } else { #equal };
      };
    };
  };

  public query ({ caller = _ }) func getFeed() : async [Post] {
    posts.values().toArray().sort(Post.compareByTimeDesc);
  };

  public query ({ caller = _ }) func getUserFeed(userId : UserId) : async [Post] {
    posts.values().filter(func(post) { post.author == userId }).toArray().sort(Post.compareByTimeDesc);
  };

  public query ({ caller }) func getFollowedFeed() : async [Post] {
    if (caller.isAnonymous()) { return [] };
    let followedUsers = switch (followers.get(caller)) {
      case (null) { Set.empty<UserId>() };
      case (?set) { set };
    };
    posts.values().filter(func(post) { followedUsers.contains(post.author) }).toArray().sort(Post.compareByTimeDesc);
  };

  public query ({ caller = _ }) func getAllUsers() : async [(UserId, UserProfile)] {
    userProfiles.toArray();
  };
};
