# Nexus Social

## Current State
Fresh build. Previous builds had recurring issues with profile modal bug and failed generation.

## Requested Changes (Diff)

### Add
- Full user authentication with persistent profile (name, bio, avatar)
- Posts feed with image support, likes, comments (with user names/avatars)
- Post deletion (own posts only)
- Private messaging between users
- Following system
- Notifications
- People section (desktop: right sidebar, mobile: above feed) with follow buttons
- Registered members counter
- User search by name (header search bar, visible on mobile and desktop)
- Discussions section: Education & Knowledge + Emotions & Support tabs
- Knowledge Feed with categories: Science, Technology, Health, History, General
- Dual Identity System: Public mode + Shadow/Anonymous mode
  - Post toggle: "Post as Public" or "Post as Shadow"
  - Shadow posts show random tag (Student, Overthinker, Anonymous User) -- no identity
  - "Real Talks" tab in navbar for shadow posts
  - Reactions on shadow posts: "I relate", "Stay strong", "Help"
  - Backend stores shadow posts without exposing identity in frontend
- Profile modal: only shown once, never reappears after save

### Modify
N/A (fresh build)

### Remove
N/A

## Implementation Plan
1. Backend: user profiles, posts (public/shadow), comments, likes, messages, follows, notifications, discussions, knowledge posts, shadow reactions
2. Frontend: auth flow with one-time profile setup, main feed, Real Talks feed, Discussions page, Knowledge Feed, private messaging, people section, user search, post creation with public/shadow toggle
3. Profile modal stored in stable memory so it never reappears after first save
4. Shadow posts: backend stores author principal but frontend never receives identity data for shadow posts
