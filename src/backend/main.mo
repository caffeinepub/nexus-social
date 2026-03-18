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

  // Types
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

  // Storage
  let userProfiles = Map.empty<UserId, UserProfile>();
  var nextPostId = 0;
  let posts = Map.empty<Nat, Post>();
  let likes = Map.empty<Nat, Set.Set<UserId>>();
  let comments = Map.empty<Nat, List.List<Comment>>();
  let followers = Map.empty<UserId, Set.Set<UserId>>();
  let messages = Map.empty<UserId, List.List<Message>>();
  let notifications = Map.empty<UserId, List.List<Notification>>();

  // Profile
  public shared ({ caller }) func updateProfile(displayName : Text, bio : Text, avatarBlob : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profile");
    };

    let profile : UserProfile = {
      displayName;
      bio;
      avatarBlob;
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    Runtime.trap("Use updateProfile instead");
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getProfile(userId : UserId) : async UserProfile {
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) { profile };
    };
  };

  // Posts
  public shared ({ caller }) func createPost(content : Text, imageBlob : ?Storage.ExternalBlob) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    let post : Post = {
      id = nextPostId;
      author = caller;
      content;
      imageBlob;
      timestamp = Time.now();
    };

    posts.add(nextPostId, post);
    nextPostId += 1;
    post.id;
  };

  public query ({ caller }) func getPost(postId : Nat) : async Post {
    switch (posts.get(postId)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { post };
    };
  };

  public query ({ caller }) func getAllPosts() : async [Post] {
    posts.values().toArray();
  };

  // Likes
  public shared ({ caller }) func likePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like posts");
    };

    let currentLikes = switch (likes.get(postId)) {
      case (null) { Set.empty<UserId>() };
      case (?set) { set };
    };

    if (currentLikes.contains(caller)) { Runtime.trap("Already liked") };

    currentLikes.add(caller);
    likes.add(postId, currentLikes);

    // Notification
    sendNotification(
      caller,
      postId,
      "Your post was liked!"
    );
  };

  public query ({ caller }) func getLikes(postId : Nat) : async Nat {
    switch (likes.get(postId)) {
      case (null) { 0 };
      case (?set) { set.size() };
    };
  };

  // Comments
  public shared ({ caller }) func addComment(postId : Nat, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can comment");
    };

    let comment : Comment = {
      postId;
      author = caller;
      content;
      timestamp = Time.now();
    };

    let existingComments = switch (comments.get(postId)) {
      case (null) { List.empty<Comment>() };
      case (?list) { list };
    };

    existingComments.add(comment);
    comments.add(postId, existingComments);

    // Notification
    sendNotification(
      caller,
      postId,
      "You received a new comment!"
    );
  };

  public query ({ caller }) func getComments(postId : Nat) : async [Comment] {
    switch (comments.get(postId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Follows
  public shared ({ caller }) func followUser(target : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can follow others");
    };

    let currentFollowers = switch (followers.get(target)) {
      case (null) { Set.empty<UserId>() };
      case (?set) { set };
    };

    if (currentFollowers.contains(caller)) { Runtime.trap("Already following") };

    currentFollowers.add(caller);
    followers.add(target, currentFollowers);

    sendUserNotification(
      target,
      "You have a new follower!"
    );
  };

  public shared ({ caller }) func unfollowUser(target : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfollow");
    };

    switch (followers.get(target)) {
      case (null) { Runtime.trap("Not following") };
      case (?set) {
        if (set.contains(caller)) {
          set.remove(caller);
          followers.add(target, set);
        } else {
          Runtime.trap("Not following");
        };
      };
    };
  };

  public query ({ caller }) func getFollowers(userId : UserId) : async [UserId] {
    switch (followers.get(userId)) {
      case (null) { [] };
      case (?set) { set.values().toArray() };
    };
  };

  // Messages
  public shared ({ caller }) func sendMessage(recipient : UserId, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let message : Message = {
      sender = caller;
      recipient;
      content;
      timestamp = Time.now();
    };

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

  // Notifications
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };

    switch (notifications.get(caller)) {
      case (null) { [] };
      case (?list) {
        let array = list.toArray();
        let reversed = array.reverse();
        reversed;
      };
    };
  };

  // Feeds and Discovery
  module Post {
    public func compareByTimeDesc(post1 : Post, post2 : Post) : Order.Order {
      if (post1.timestamp > post2.timestamp) { #less } else {
        if (post1.timestamp < post2.timestamp) { #greater } else {
          #equal;
        };
      };
    };
  };

  public query ({ caller }) func getFeed() : async [Post] {
    posts.values().toArray().sort(Post.compareByTimeDesc);
  };

  public query ({ caller }) func getUserFeed(userId : UserId) : async [Post] {
    let filteredPosts = posts.values().filter(
      func(post) { post.author == userId }
    );
    filteredPosts.toArray().sort(Post.compareByTimeDesc);
  };

  public query ({ caller }) func getFollowedFeed() : async [Post] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view followed feed");
    };

    let followedUsers = switch (followers.get(caller)) {
      case (null) { Set.empty<UserId>() };
      case (?set) { set };
    };

    let filteredPosts = posts.values().filter(
      func(post) { followedUsers.contains(post.author) }
    );
    filteredPosts.toArray().sort(Post.compareByTimeDesc);
  };

  public query ({ caller }) func getAllUsers() : async [(UserId, UserProfile)] {
    userProfiles.toArray();
  };
};
