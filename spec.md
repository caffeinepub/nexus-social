# Nexus Social

## Current State
Full social platform: posts, likes, flat comments, messaging, discussions, knowledge feed, real talks, notifications, user search.

## Requested Changes (Diff)

### Add
- Comment reply: each comment gets a Reply button opening an inline reply textarea
- Replies stored using prefix: __reply__{parentTimestamp}__{actualContent}
- Replies render indented under parent with "Replying to [Name]" label

### Modify
- PostCard.tsx: parse flat comments into threads, add per-comment reply state, inline input, indented rendering

### Remove
- Nothing

## Implementation Plan
1. Parse comments: top-level vs replies by __reply__ prefix detection
2. Render threaded: top-level comment + indented replies beneath
3. Reply button per comment -> inline textarea -> submit encodes as __reply__{ts}__{text}
4. Show "Replying to [Name]" in reply bubbles
