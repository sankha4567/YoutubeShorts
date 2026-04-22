# YouTube Shorts Web App - Product Requirements Document (PRD)

**Project Name:** YouTube Shorts Platform  
**Tech Stack:** Next.js + React + TypeScript + Prisma + NeonDB + ImageKit.io + Clerk  
**Deployment:** Vercel  
**Status:** PRD Phase - Ready for Development

---

## **Table of Contents**

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [User Flows](#user-flows)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [UI/UX Design System](#uiux-design-system)
7. [Architecture Diagram](#architecture-diagram)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Specifications](#technical-specifications)
10. [Deployment Guide](#deployment-guide)

---

## **Executive Summary**

A modern YouTube Shorts clone built as a web application where users can:
- Authenticate via Clerk (email/password + Google OAuth)
- Upload short-form videos (max 60s, 20MB)
- Browse their own shorts and recommendations from others
- Like/dislike, comment (with nested replies), and share shorts
- Generate 24-hour shareable links with expiration
- Follow other users and build profiles
- Search shorts by hashtags and users

**Target Users:** Content creators and short-form video enthusiasts  
**MVP Scope:** All features listed above  
**Timeline:** 4-6 weeks development

---

## **Feature Overview**

### **1. Authentication & User Management**

#### **1.1 Sign Up / Login**
- Clerk handles email/password and Google OAuth
- No email verification required (Clerk default)
- Users redirected to dashboard after login

#### **1.2 User Profiles**
- **Profile Data:**
  - Profile picture (uploaded via ImageKit)
  - Bio (max 160 characters)
  - Follower count
  - Following count
  - Total shorts count
  - List of uploaded shorts
  - Follow/Unfollow button (if viewing other user's profile)

#### **1.3 Follow System**
- Users can follow/unfollow other users
- Follow count updates in real-time
- Followers appear in "Your Shorts" feed (from followed users)

---

### **2. Video Upload & Storage**

#### **2.1 Upload Form**
- Video file selector (max 20MB, max 60s duration)
- Title field (required)
- Description field (optional)
- Hashtags field (optional, comma-separated, e.g., #dance, #comedy, #music)
- Preview thumbnail from first frame
- Upload progress indicator

#### **2.2 Video Processing**
- ImageKit handles automatic compression and optimization
- Supported formats: MP4, MOV, WebM
- ImageKit generates multiple quality variants automatically
- Video stored with unique ID in ImageKit

#### **2.3 Metadata Storage**
- Stored in NeonDB (PostgreSQL):
  - Video ID (unique)
  - User ID (creator)
  - Title, description, hashtags
  - ImageKit URL
  - Created timestamp
  - View count
  - Like count
  - Comment count
  - Share count

---

### **3. Feed & Discovery**

#### **3.1 Two-Tab Feed System**

**Tab 1: "Your Shorts"**
- Chronological feed of user's own shorts + shorts from followed users
- Newest first
- Infinite scroll (lazy load 10 shorts at a time)

**Tab 2: "Recommendations"**
- Chronological feed of all shorts from users the current user doesn't follow
- Newest first
- Infinite scroll (lazy load 10 shorts at a time)

#### **3.2 Short Card Display**
- Video player (with play/pause)
- Creator name + profile picture (clickable)
- Title
- Description (truncated with "Show More")
- Like count, comment count, share count
- Like/Dislike buttons
- Comment button
- Share button
- Hashtags (clickable for search)

---

### **4. Social Features**

#### **4.1 Like/Dislike System**
- Users can like OR dislike a short (toggle)
- Like count displayed on short card
- No visibility of who liked (just total count)
- Dislike stored but count NOT displayed (internal tracking only)

#### **4.2 Comments**
- **Comment Creation:**
  - Text input below short
  - Submit button
  - Character limit: 500 characters
  
- **Comment Display:**
  - Nested/threaded comments (indented replies)
  - Username + profile picture + timestamp
  - Comment text
  - Edit button (only for own comments)
  - Delete button (only for own comments)
  - Reply button (opens reply form indented under parent comment)
  - Like count on comments (optional, nice-to-have)

- **Comment Management:**
  - Users can edit their own comments
  - Users can delete their own comments
  - Deleted comment shows "[deleted]" placeholder
  - Reply count displayed on parent comment

#### **4.3 Share System**
- **Generate Shareable Link:**
  - Click "Share" button
  - System generates unique token (36-character UUID)
  - Link format: `yourapp.com/share/{token}`
  - Link expires in 24 hours
  - Share link stored in database with expiration timestamp

- **Share Link Page (Public, No Login Required):**
  - Shows video preview (first frame as image)
  - Shows title, description, creator name
  - "View in App" button (redirects to login if not logged in, then to short)
  - Share count (visible to logged-in users only)
  - Shows "Link Expired" if 24 hours passed

- **Share Count:**
  - Incremented each time a share link is created
  - Displayed on short detail page
  - Not affected by multiple shares of same short

---

### **5. Search & Discovery**

#### **5.1 Hashtag Search**
- Click any hashtag → Search results
- Search box with "#" prefix
- Results show all shorts with that hashtag
- Case-insensitive matching
- Infinite scroll results

#### **5.2 Username Search**
- Search box with "@" prefix
- Exact username match only
- Shows user profile with all their shorts
- Can follow/unfollow from search results

#### **5.3 Search Page**
- Single search bar (detects # or @ prefix)
- Recent searches (stored in localStorage, last 5)
- Results update in real-time as user types

---

### **6. Notifications (In-App)**

#### **6.1 In-App Notification Center**
- Bell icon in navbar showing unread count
- Notification types:
  - Someone liked your short
  - Someone commented on your short
  - Someone replied to your comment
  - Someone started following you
  
- Notification details:
  - Username + profile picture of actor
  - Action (e.g., "liked your short")
  - Timestamp
  - Link to the short/comment
  
- Mark as read / Clear all notifications

---

### **7. Access Control & Privacy**

#### **7.1 Authentication Required**
- All shorts require login to view
- Share links require login to view full short
- Unauthorized users redirected to login page

#### **7.2 Cascade Deletion**
- When user deletes a short:
  - All likes deleted
  - All comments deleted
  - All share links invalidated
  - Video deleted from ImageKit
  - User's short count decremented

---

### **8. UI/UX Design System**

#### **8.1 Design Style**
- **Morphism Design:** Glassmorphism + soft shadows
- **Color Palette (Google Material Design inspired):**
  - Primary: #4F46E5 (Indigo)
  - Secondary: #06B6D4 (Cyan)
  - Accent: #EC4899 (Pink)
  - Background: #0F172A (Dark slate)
  - Surface: #1E293B (Darker slate)
  - Text: #F1F5F9 (Light)
  
- **Typography:**
  - Headings: Inter Bold (24px, 32px)
  - Body: Inter Regular (14px, 16px)
  - Small: Inter Regular (12px)

- **Components:**
  - Glassmorphism cards with backdrop blur
  - Soft shadows (0 10px 30px rgba(0,0,0,0.3))
  - Rounded corners (12px - 16px)
  - Smooth transitions (250ms ease)
  - Hover states with scale/shadow increase

#### **8.2 Page Structure**

**Navbar:**
- Logo (clickable to home)
- Search bar (center)
- User menu (profile, notifications, logout)
- Responsive (hamburger on mobile)

**Dashboard/Feed:**
- Two tabs: "Your Shorts" | "Recommendations"
- Infinite scroll grid
- Short cards with actions

**Upload Page:**
- Form with fields (title, description, hashtags)
- Video preview
- Upload progress

**Short Detail Page:**
- Large video player
- Creator info (profile, follow button)
- Title, description, hashtags
- Like/dislike, comment, share buttons
- Comments section (nested)
- Related shorts (recommendations)

**User Profile Page:**
- Profile picture, bio
- Follow/unfollow button
- Follower/following/shorts counts
- Grid of user's shorts

**Search Results Page:**
- List of results (users or shorts)
- Filter buttons

**Notifications Page:**
- List of notifications
- Mark as read, delete options

---

## **User Flows**

### **Flow 1: New User Sign-Up**
```
User lands on app
    ↓
Clerk auth page (email/password or Google)
    ↓
Profile setup (optional - name, picture, bio)
    ↓
Redirect to dashboard
    ↓
"Your Shorts" tab (empty initially)
    ↓
User can upload or browse recommendations
```

### **Flow 2: Upload a Short**
```
Click "Upload" button
    ↓
Select video file (max 20MB, 60s)
    ↓
Fill title, description, hashtags
    ↓
Preview video
    ↓
Click "Upload"
    ↓
ImageKit handles compression
    ↓
Store metadata in NeonDB
    ↓
Redirect to short detail page
    ↓
"Upload successful" toast notification
```

### **Flow 3: Browse & Interact with Shorts**
```
User on dashboard
    ↓
Scroll "Recommendations" tab
    ↓
See short from User B
    ↓
Options:
  → Like/dislike
  → Click to view detail page
  → Comment
  → Share (generate 24-hr link)
  → Click hashtag (search)
  → Click creator name (view profile)
```

### **Flow 4: Comment & Reply**
```
User on short detail page
    ↓
Scroll to comments section
    ↓
Type comment in input
    ↓
Click "Post"
    ↓
Comment appears in list
    ↓
Other user clicks "Reply"
    ↓
Reply input opens (indented)
    ↓
Reply appears under parent comment
```

### **Flow 5: Generate Shareable Link**
```
User on short detail page
    ↓
Click "Share" button
    ↓
System generates unique token
    ↓
Copy link shown: "yourapp.com/share/xyz123"
    ↓
Share link expires in 24 hours
    ↓
Anyone with link can access (after login)
    ↓
Share count incremented
```

### **Flow 6: View via Shareable Link**
```
User receives share link
    ↓
Click link: "yourapp.com/share/xyz123"
    ↓
System checks expiration (within 24 hours?)
    ↓
If expired: "Link expired" message
    ↓
If valid:
  → If not logged in: redirect to login
  → If logged in: show short detail page
  → Share count visible
```

### **Flow 7: Follow User**
```
User visits another user's profile
    ↓
Click "Follow" button
    ↓
Follow stored in database
    ↓
Button changes to "Following"
    ↓
Their shorts now appear in "Your Shorts" feed
    ↓
Notification sent to followed user
```

### **Flow 8: Search by Hashtag**
```
User clicks hashtag (#dance)
    ↓
Redirect to search results
    ↓
Show all shorts with #dance
    ↓
Infinite scroll to load more
    ↓
Interact with shorts normally
```

### **Flow 9: Search by Username**
```
User types "@username" in search
    ↓
Exact match returns that user's profile
    ↓
Show user info + all their shorts
    ↓
Can follow/view shorts
```

### **Flow 10: Delete a Short**
```
User on own short detail page
    ↓
Click "Delete" button
    ↓
Confirm dialog
    ↓
System cascade deletes:
  → All likes
  → All comments
  → All share links
  → Video from ImageKit
  → Short from database
    ↓
User's short count decremented
    ↓
Redirect to dashboard
```

---

## **Database Schema**

### **Prisma Models (schema.prisma)**

```prisma
// User model - stores user profile info
model User {
  id                String      @id @default(cuid())
  clerkId           String      @unique          // Clerk user ID
  email             String      @unique
  username          String      @unique
  name              String?
  bio               String?     @db.VarChar(160)
  profilePictureUrl String?     // ImageKit URL
  
  // Relations
  shorts            Short[]     @relation("creator")
  likes             Like[]
  comments          Comment[]
  followers         User[]      @relation("followers")
  following         User[]      @relation("followers")
  shareLinks        ShareLink[]
  notifications     Notification[]
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// Short model - stores short metadata
model Short {
  id                String      @id @default(cuid())
  creatorId         String
  creator           User        @relation("creator", fields: [creatorId], references: [id], onDelete: Cascade)
  
  title             String
  description       String?     @db.Text
  imageKitUrl       String      // Video URL from ImageKit
  imageKitFileId    String      // ImageKit file ID for deletion
  
  likes             Like[]      @relation("shortLikes")
  dislikes          Like[]      @relation("shortDislikes")
  comments          Comment[]   @relation("shortComments")
  shareLinks        ShareLink[] @relation("shortShareLinks")
  
  viewCount         Int         @default(0)
  likeCount         Int         @default(0)
  dislikeCount      Int         @default(0)
  commentCount      Int         @default(0)
  shareCount        Int         @default(0)
  
  hashtags          String      @default("")  // Comma-separated: #dance,#music,#comedy
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// Like model - stores likes and dislikes
model Like {
  id                String      @id @default(cuid())
  userId            String
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  shortId           String
  shortAsLike       Short?      @relation("shortLikes", fields: [shortId], references: [id], onDelete: Cascade)
  shortAsDislike    Short?      @relation("shortDislikes", fields: [shortId], references: [id], onDelete: Cascade)
  
  type              String      @db.Enum('LIKE', 'DISLIKE')  // LIKE or DISLIKE
  
  createdAt         DateTime    @default(now())
  
  @@unique([userId, shortId])   // One like/dislike per user per short
}

// Comment model - stores comments with nesting
model Comment {
  id                String      @id @default(cuid())
  userId            String
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  shortId           String
  short             Short       @relation("shortComments", fields: [shortId], references: [id], onDelete: Cascade)
  
  text              String      @db.VarChar(500)
  
  parentCommentId   String?     // For nested replies
  parentComment     Comment?    @relation("replies", fields: [parentCommentId], references: [id], onDelete: Cascade)
  replies           Comment[]   @relation("replies")
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

// ShareLink model - stores 24-hour shareable links
model ShareLink {
  id                String      @id @default(cuid())
  token             String      @unique @db.VarChar(36)  // UUID
  
  userId            String
  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  shortId           String
  short             Short       @relation("shortShareLinks", fields: [shortId], references: [id], onDelete: Cascade)
  
  expiresAt         DateTime    // 24 hours from creation
  
  createdAt         DateTime    @default(now())
}

// Follow model - stores follow relationships
model Follow {
  id                String      @id @default(cuid())
  followerId        String
  follower          User        @relation("following", fields: [followerId], references: [id], onDelete: Cascade)
  
  followingId       String
  following         User        @relation("followers", fields: [followingId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime    @default(now())
  
  @@unique([followerId, followingId])  // Can't follow same user twice
}

// Notification model - stores in-app notifications
model Notification {
  id                String      @id @default(cuid())
  
  recipientId       String
  recipient         User        @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  
  actorId           String      // User who performed the action (liked, commented, etc.)
  
  type              String      @db.Enum('LIKE', 'COMMENT', 'REPLY', 'FOLLOW')
  shortId           String?     // Related short (if applicable)
  commentId         String?     // Related comment (if applicable)
  
  isRead            Boolean     @default(false)
  
  createdAt         DateTime    @default(now())
}

// SearchHistory model - stores recent searches
model SearchHistory {
  id                String      @id @default(cuid())
  userId            String
  query             String
  type              String      @db.Enum('HASHTAG', 'USERNAME')  // What was searched
  
  createdAt         DateTime    @default(now())
  
  @@unique([userId, query])
}
```

### **Schema Relationships Diagram**

```
User (1) ─── (Many) Short (creator)
User (1) ─── (Many) Like
User (1) ─── (Many) Comment
User (1) ─── (Many) ShareLink
User (1) ─── (Many) Follow
User (1) ─── (Many) Notification

Short (1) ─── (Many) Like
Short (1) ─── (Many) Comment
Short (1) ─── (Many) ShareLink

Comment (1) ─── (Many) Comment (parent-child for replies)

Follow: User ─── User (self-referential)
```

---

## **API Endpoints**

### **Authentication Endpoints** (Clerk handles - no custom endpoints needed)

---

### **User Endpoints**

#### **GET `/api/users/profile`**
- Get current user profile
- **Query:** None
- **Response:**
  ```json
  {
    "id": "user123",
    "username": "john_doe",
    "name": "John Doe",
    "bio": "Creator",
    "profilePictureUrl": "https://imagekit.io/...",
    "followerCount": 150,
    "followingCount": 45,
    "shortCount": 12
  }
  ```

#### **GET `/api/users/[userId]`**
- Get any user's public profile
- **Query:** userId (string)
- **Response:** Same as above + isFollowing flag

#### **PUT `/api/users/profile`**
- Update current user profile
- **Body:**
  ```json
  {
    "name": "John Doe",
    "bio": "New bio",
    "profilePictureFile": <File>
  }
  ```
- **Response:** Updated user object

#### **POST `/api/users/[userId]/follow`**
- Follow a user
- **Query:** userId
- **Response:**
  ```json
  {
    "success": true,
    "message": "Now following user"
  }
  ```

#### **DELETE `/api/users/[userId]/follow`**
- Unfollow a user
- **Query:** userId
- **Response:** Success message

#### **GET `/api/users/followers`**
- Get current user's followers
- **Query:** limit, offset (pagination)
- **Response:** Array of follower objects

#### **GET `/api/users/following`**
- Get users current user is following
- **Query:** limit, offset
- **Response:** Array of following objects

---

### **Short Endpoints**

#### **POST `/api/shorts/upload`**
- Upload a new short
- **Body (multipart/form-data):**
  ```
  videoFile: <File>
  title: "My awesome short"
  description: "Check it out"
  hashtags: "#dance,#music,#viral"
  ```
- **Response:**
  ```json
  {
    "id": "short123",
    "title": "My awesome short",
    "imageKitUrl": "https://imagekit.io/...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
  ```

#### **GET `/api/shorts/[shortId]`**
- Get short details
- **Query:** shortId
- **Response:**
  ```json
  {
    "id": "short123",
    "title": "My awesome short",
    "description": "Check it out",
    "hashtags": ["#dance", "#music"],
    "imageKitUrl": "https://imagekit.io/...",
    "creator": { id, username, profilePictureUrl },
    "likeCount": 150,
    "dislikeCount": 5,
    "commentCount": 23,
    "shareCount": 12,
    "viewCount": 500,
    "userLikeStatus": "LIKE" | "DISLIKE" | null,
    "isFollowing": true/false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
  ```

#### **DELETE `/api/shorts/[shortId]`**
- Delete a short (creator only)
- **Query:** shortId
- **Response:** Success message

#### **GET `/api/shorts/feed/yours`**
- Get "Your Shorts" feed (own + followed users)
- **Query:** limit (default 10), offset (default 0)
- **Response:**
  ```json
  {
    "shorts": [{ short objects }],
    "hasMore": true,
    "total": 45
  }
  ```

#### **GET `/api/shorts/feed/recommendations`**
- Get "Recommendations" feed (chronological, non-followed users)
- **Query:** limit, offset
- **Response:** Same as "Your Shorts"

#### **PUT `/api/shorts/[shortId]/view`**
- Increment view count
- **Query:** shortId
- **Response:** Updated view count

#### **GET `/api/shorts/search`**
- Search shorts by hashtag
- **Query:** hashtag (with # prefix), limit, offset
- **Response:** Array of shorts matching hashtag

#### **GET `/api/shorts/user/[userId]`**
- Get all shorts from a user
- **Query:** userId, limit, offset
- **Response:** Array of user's shorts

---

### **Like/Dislike Endpoints**

#### **POST `/api/likes`**
- Like or dislike a short
- **Body:**
  ```json
  {
    "shortId": "short123",
    "type": "LIKE" | "DISLIKE"
  }
  ```
- **Response:**
  ```json
  {
    "id": "like123",
    "type": "LIKE",
    "shortLikeCount": 151
  }
  ```

#### **DELETE `/api/likes`**
- Remove like/dislike from short
- **Body:** { shortId }
- **Response:** Updated like count

#### **GET `/api/shorts/[shortId]/likes`**
- Get like/dislike status for short
- **Query:** shortId
- **Response:**
  ```json
  {
    "userLikeStatus": "LIKE" | "DISLIKE" | null,
    "likeCount": 150,
    "dislikeCount": 5
  }
  ```

---

### **Comment Endpoints**

#### **POST `/api/comments`**
- Create a comment
- **Body:**
  ```json
  {
    "shortId": "short123",
    "text": "Great short!",
    "parentCommentId": null (optional, for replies)
  }
  ```
- **Response:**
  ```json
  {
    "id": "comment123",
    "userId": "user123",
    "user": { username, profilePictureUrl },
    "text": "Great short!",
    "parentCommentId": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
  ```

#### **PUT `/api/comments/[commentId]`**
- Edit a comment (creator only)
- **Body:** { text: "Updated text" }
- **Response:** Updated comment object

#### **DELETE `/api/comments/[commentId]`**
- Delete a comment (creator only)
- **Query:** commentId
- **Response:** Success message

#### **GET `/api/shorts/[shortId]/comments`**
- Get all comments for a short (with nested replies)
- **Query:** shortId, limit, offset
- **Response:**
  ```json
  {
    "comments": [
      {
        "id": "comment1",
        "userId": "user1",
        "user": { username, profilePictureUrl },
        "text": "Great!",
        "parentCommentId": null,
        "replies": [
          {
            "id": "comment2",
            "userId": "user2",
            "text": "Thanks!",
            "parentCommentId": "comment1"
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 23
  }
  ```

#### **GET `/api/comments/[commentId]/replies`**
- Get all replies to a comment
- **Query:** commentId, limit, offset
- **Response:** Array of reply comments

---

### **Share Link Endpoints**

#### **POST `/api/shares`**
- Generate a 24-hour shareable link
- **Body:** { shortId }
- **Response:**
  ```json
  {
    "token": "xyz-abc-123-456",
    "link": "yourapp.com/share/xyz-abc-123-456",
    "expiresAt": "2024-01-16T10:30:00Z"
  }
  ```

#### **GET `/api/shares/[token]`**
- Get short details via share link (public endpoint, no auth required)
- **Query:** token
- **Response:**
  - If valid: Short object with share count
  - If expired: { error: "Link expired" }

#### **GET `/api/shorts/[shortId]/share-count`**
- Get share count for a short
- **Query:** shortId
- **Response:**
  ```json
  {
    "shareCount": 12
  }
  ```

---

### **Notification Endpoints**

#### **GET `/api/notifications`**
- Get all notifications for current user
- **Query:** limit, offset, unreadOnly (boolean)
- **Response:**
  ```json
  {
    "notifications": [
      {
        "id": "notif1",
        "type": "LIKE",
        "actor": { username, profilePictureUrl },
        "shortId": "short123",
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "unreadCount": 5
  }
  ```

#### **PUT `/api/notifications/[notificationId]/read`**
- Mark notification as read
- **Query:** notificationId
- **Response:** Success message

#### **PUT `/api/notifications/read-all`**
- Mark all notifications as read
- **Response:** Success message

#### **DELETE `/api/notifications/[notificationId]`**
- Delete a notification
- **Query:** notificationId
- **Response:** Success message

---

### **Search Endpoints**

#### **GET `/api/search`**
- Search by hashtag or username
- **Query:** 
  - q: "#dance" or "@john_doe"
  - type: "HASHTAG" | "USERNAME"
- **Response:**
  - For hashtag: Array of shorts
  - For username: User object + their shorts

#### **GET `/api/search/history`**
- Get recent searches for current user
- **Response:** Array of last 5 searches

#### **DELETE `/api/search/history/[query]`**
- Delete a search from history
- **Query:** query string
- **Response:** Success message

---

## **UI/UX Design System**

### **Color Palette**

```css
/* Primary Colors */
--color-primary: #4F46E5          /* Indigo */
--color-primary-light: #818CF8
--color-primary-dark: #3730A3

/* Secondary Colors */
--color-secondary: #06B6D4        /* Cyan */
--color-secondary-light: #22D3EE
--color-secondary-dark: #0891B2

/* Accent Colors */
--color-accent: #EC4899           /* Pink */
--color-accent-light: #F472B6
--color-accent-dark: #BE185D

/* Neutral Colors */
--color-bg-primary: #0F172A       /* Dark slate */
--color-bg-secondary: #1E293B     /* Darker slate */
--color-bg-tertiary: #334155      /* Slate */

--color-text-primary: #F1F5F9     /* Light gray */
--color-text-secondary: #CBD5E1   /* Medium gray */
--color-text-tertiary: #94A3B8    /* Dark gray */

--color-border: #475569           /* Slate */

/* Status Colors */
--color-success: #10B981          /* Green */
--color-warning: #F59E0B          /* Amber */
--color-error: #EF4444            /* Red */
--color-info: #3B82F6             /* Blue */
```

### **Typography**

```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

/* Heading Sizes */
--text-h1: 32px, font-weight: 700, line-height: 40px
--text-h2: 28px, font-weight: 700, line-height: 36px
--text-h3: 24px, font-weight: 600, line-height: 32px
--text-h4: 20px, font-weight: 600, line-height: 28px

/* Body Sizes */
--text-body-lg: 16px, font-weight: 400, line-height: 24px
--text-body-md: 14px, font-weight: 400, line-height: 20px
--text-body-sm: 12px, font-weight: 400, line-height: 16px
--text-body-xs: 11px, font-weight: 400, line-height: 14px

/* Button Text */
--text-button: 14px, font-weight: 600, letter-spacing: 0.5px
```

### **Spacing System**

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 12px
--spacing-lg: 16px
--spacing-xl: 24px
--spacing-2xl: 32px
--spacing-3xl: 48px
--spacing-4xl: 64px
```

### **Border Radius**

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 20px
--radius-full: 9999px
```

### **Shadows (Glassmorphism)**

```css
/* Card Shadow */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1)
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15)
--shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.3)
--shadow-xl: 0 20px 50px rgba(0, 0, 0, 0.4)

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.05)
--glass-border: rgba(255, 255, 255, 0.1)
--glass-blur: blur(10px)
```

### **Component Guidelines**

#### **Cards**
- Background: `--glass-bg` with `backdrop-filter: var(--glass-blur)`
- Border: 1px solid `--glass-border`
- Border-radius: `--radius-lg`
- Padding: `--spacing-lg`
- Shadow: `--shadow-md`
- Hover: Scale 1.02, shadow increase

#### **Buttons**
- Primary: Background `--color-primary`, text white
- Secondary: Background `--color-bg-tertiary`, text `--color-text-primary`
- Danger: Background `--color-error`, text white
- Padding: `--spacing-md` `--spacing-lg`
- Border-radius: `--radius-md`
- Transition: 250ms ease

#### **Input Fields**
- Background: `--color-bg-secondary`
- Border: 1px solid `--color-border`
- Focus: Border `--color-primary`, shadow subtle
- Padding: `--spacing-md`
- Border-radius: `--radius-md`

#### **Modals/Dialogs**
- Backdrop: rgba(0, 0, 0, 0.6) with blur
- Card: Glassmorphism style
- Animation: Scale + fade in 300ms

---

## **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Web Application                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Frontend (React Components + TypeScript)                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ├─ Pages/                                               │   │
│  │  │  ├─ dashboard/page.tsx     (Feed with tabs)          │   │
│  │  │  ├─ upload/page.tsx        (Upload form)             │   │
│  │  │  ├─ shorts/[id]/page.tsx   (Detail page)             │   │
│  │  │  ├─ profile/[id]/page.tsx  (User profile)            │   │
│  │  │  ├─ share/[token]/page.tsx (Shareable link)          │   │
│  │  │  ├─ search/page.tsx        (Search results)          │   │
│  │  │  └─ notifications/page.tsx (Notifications)           │   │
│  │  │                                                        │   │
│  │  ├─ components/                                           │   │
│  │  │  ├─ ShortCard.tsx                                     │   │
│  │  │  ├─ CommentThread.tsx                                 │   │
│  │  │  ├─ Navbar.tsx                                        │   │
│  │  │  └─ ... (other components)                            │   │
│  │  │                                                        │   │
│  │  └─ lib/                                                  │   │
│  │     ├─ hooks/          (Custom hooks)                    │   │
│  │     └─ utils/          (Utility functions)               │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Backend (Next.js API Routes)                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  app/api/                                                │   │
│  │  ├─ auth/            (Clerk middleware)                  │   │
│  │  ├─ shorts/          (Upload, get, delete)              │   │
│  │  ├─ likes/           (Like/dislike)                      │   │
│  │  ├─ comments/        (Create, edit, delete)             │   │
│  │  ├─ shares/          (Generate 24-hr links)             │   │
│  │  ├─ users/           (Profile, follow)                   │   │
│  │  ├─ notifications/   (Get, mark read)                    │   │
│  │  └─ search/          (Hashtag, username)                 │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                ↓                    ↓                ↓             │
└────────────────┼────────────────────┼────────────────┼─────────┘
                 ↓                    ↓                ↓
         ┌──────────────┐    ┌───────────────┐  ┌──────────────┐
         │  NeonDB      │    │  ImageKit.io  │  │   Clerk      │
         │(PostgreSQL)  │    │  (Video       │  │ (Auth +      │
         │              │    │   Storage)    │  │  User Data)  │
         │ - Users      │    │               │  │              │
         │ - Shorts     │    │ - Video Files │  │ - Tokens     │
         │ - Likes      │    │ - Compression │  │ - Sessions   │
         │ - Comments   │    │ - Quality     │  │              │
         │ - Follows    │    │   Variants    │  │              │
         │ - Shares     │    │               │  │              │
         │ - Notif.     │    │               │  │              │
         └──────────────┘    └───────────────┘  └──────────────┘

         ┌────────────────────────────────────────────────────────┐
         │  Vercel (Deployment)                                   │
         │  - Auto builds on git push                             │
         │  - API routes serverless functions                     │
         │  - Static assets CDN                                   │
         └────────────────────────────────────────────────────────┘
```

---

## **Implementation Roadmap**

### **Phase 1: Foundation (Week 1)**
- [ ] Set up Next.js project with TypeScript
- [ ] Configure Clerk authentication
- [ ] Set up Prisma + NeonDB
- [ ] Create database schema
- [ ] Build basic navbar + layout

### **Phase 2: User Management (Week 1-2)**
- [ ] User profile pages
- [ ] Edit profile (name, bio, picture)
- [ ] Follow/unfollow system
- [ ] Follower/following lists

### **Phase 3: Video Upload (Week 2)**
- [ ] Upload form UI
- [ ] ImageKit integration
- [ ] Video validation (size, duration)
- [ ] Metadata storage in NeonDB
- [ ] Upload progress indicator

### **Phase 4: Feed & Discovery (Week 2-3)**
- [ ] Dashboard with two tabs
- [ ] "Your Shorts" feed (chronological)
- [ ] "Recommendations" feed
- [ ] Infinite scroll implementation
- [ ] Short detail page

### **Phase 5: Social Features (Week 3)**
- [ ] Like/dislike system
- [ ] Comments (create, edit, delete)
- [ ] Nested replies
- [ ] Comment threads UI

### **Phase 6: Share System (Week 3-4)**
- [ ] Generate 24-hour shareable links
- [ ] Share link page (public)
- [ ] Link expiration logic
- [ ] Share count tracking

### **Phase 7: Search & Notifications (Week 4)**
- [ ] Hashtag search
- [ ] Username search
- [ ] Search history (localStorage)
- [ ] In-app notification center
- [ ] Notification types (like, comment, reply, follow)

### **Phase 8: UI/UX Polish (Week 4-5)**
- [ ] Glassmorphism design system
- [ ] Color palette implementation
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode (default)
- [ ] Smooth animations & transitions
- [ ] Loading states & skeletons

### **Phase 9: Testing & Bug Fixes (Week 5)**
- [ ] Unit tests (Jest + React Testing Library)
- [ ] Integration tests
- [ ] Bug fixes & edge cases
- [ ] Performance optimization
- [ ] SEO optimization

### **Phase 10: Deployment (Week 5-6)**
- [ ] Environment variables setup
- [ ] Deploy to Vercel
- [ ] Database backups
- [ ] Monitoring setup
- [ ] Launch!

---

## **Technical Specifications**

### **Frontend Technologies**

```json
{
  "nextjs": "^14.0.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.3.0",
  "clerkjs": "^4.0.0",
  "axios": "^1.4.0",
  "zustand": "^4.3.0",
  "react-query": "^3.39.0",
  "framer-motion": "^10.0.0",
  "imagekit-javascript": "^2.0.0"
}
```

### **Backend Technologies**

```json
{
  "nextjs": "^14.0.0",
  "@prisma/client": "^5.0.0",
  "prisma": "^5.0.0",
  "@clerk/nextjs": "^4.0.0",
  "imagekit": "^4.0.0",
  "uuid": "^9.0.0",
  "zod": "^3.22.0"
}
```

### **Database (NeonDB - PostgreSQL)**
- Connection pooling: PgBouncer (included in Neon)
- SSL enabled
- Backups: Automatic daily
- Timezone: UTC

### **Video Processing (ImageKit.io)**
- Auto compression
- Multi-quality variants
- Secure signed URLs
- CDN delivery
- File size limits: 20MB
- Duration validation: Client-side validation + server-side check

### **Authentication (Clerk)**
- Session tokens valid for 1 hour
- Refresh tokens for session renewal
- JWT encoding
- Email verification (optional)

### **Image/File Storage (ImageKit.io)**
- Profile pictures: Max 5MB, JPEG/PNG only
- Videos: Max 20MB, MP4/MOV/WebM
- Auto deletion on user/short deletion

### **Performance Targets**
- First Contentful Paint (FCP): < 2s
- Largest Contentful Paint (LCP): < 3s
- Cumulative Layout Shift (CLS): < 0.1
- API response time: < 500ms
- Database query time: < 200ms
- Video upload: < 30s for 20MB file

### **Security**
- HTTPS only
- CORS configured (only allow your domain)
- Rate limiting on API endpoints (100 requests/minute per IP)
- Input validation (Zod on backend)
- SQL injection prevention (Prisma ORM)
- XSS protection (React auto-escapes)
- CSRF tokens for form submissions

---

## **Deployment Guide**

### **Pre-Deployment Checklist**

1. **Environment Variables**
   ```bash
   # .env.local
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   
   DATABASE_URL=postgresql://user:password@host/dbname
   
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_...
   IMAGEKIT_PRIVATE_KEY=private_...
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/yourname/
   
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

2. **Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Build Verification**
   ```bash
   npm run build
   npm start
   ```

### **Deploy to Vercel**

1. **Connect GitHub Repository**
   - Sign in to Vercel
   - Import Next.js project from GitHub

2. **Add Environment Variables**
   - Add all `.env.local` variables in Vercel dashboard
   - Keep keys in sync between Vercel and local

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Output directory: `.next`
   - Install command: `npm ci`

4. **Deploy**
   - Vercel auto-deploys on push to main branch
   - Preview deployments for pull requests

5. **Monitor**
   - Check Vercel Analytics
   - Monitor API routes performance
   - Set up alerts for errors

### **Post-Deployment**

- Set up error tracking (Sentry)
- Configure logging (Vercel logs + custom logging)
- Set up uptime monitoring
- Create backup strategy for NeonDB
- Plan scaling strategy

---

## **Future Enhancements** (Post-MVP)

1. **Trending Page** - Top shorts by engagement
2. **Duets** - Create response videos to others' shorts
3. **Collabs** - Multiple users on one short
4. **Playlist** - Create collections of favorites
5. **Monetization** - Creator fund/ad revenue
6. **Analytics Dashboard** - View counts, engagement metrics
7. **Messaging** - Direct messages between users
8. **Live Streaming** - Stream to followers in real-time
9. **Mobile App** - React Native app (iOS/Android)
10. **Web3 Features** - NFT integration, blockchain storage

---

## **Success Metrics**

| Metric | Target |
|--------|--------|
| User sign-ups | 1000+ in first month |
| Daily Active Users | 30% of registered users |
| Average session duration | 20+ minutes |
| Video upload success rate | 99.5% |
| Page load time | < 2 seconds |
| API uptime | 99.9% |
| User engagement rate | 60%+ interacting with shorts |

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Status:** Ready for Development

---

**PRD Approved & Ready to Code! 🚀**