# YouTube Shorts

A modern short-form video sharing platform built with Next.js. Users can upload 60-second videos, follow creators, like and comment (with nested replies), and generate 24-hour shareable links.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Auth:** Clerk
- **Database:** NeonDB (PostgreSQL) via Prisma 7
- **Media Storage:** ImageKit.io
- **State / Data:** Zustand + TanStack Query
- **Animation:** Framer Motion

## Features

- Email/password and Google OAuth via Clerk
- Upload shorts (max 20 MB, 60 s) with ImageKit compression
- Two-tab feed: "Your Shorts" (own + followed) and "Recommendations"
- Like / dislike, threaded comments, follow system
- Hashtag and username search
- 24-hour expiring shareable links at `/share/[token]`
- In-app notifications (likes, comments, replies, follows)
- Glassmorphism dark UI

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Database (NeonDB)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# ImageKit
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id/

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run database migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Sign-in / sign-up routes
│   ├── (main)/          # Authenticated app (dashboard, profile, upload, etc.)
│   ├── api/             # Route handlers (shorts, likes, comments, shares, webhooks)
│   └── share/[token]/   # Public share-link landing page
├── components/          # Reusable UI components
├── lib/                 # Clients, hooks, utils, providers
└── middleware.ts        # Clerk route protection

prisma/
├── schema.prisma        # Data model
└── migrations/          # Migration history
```

## Deployment

Deploy on [Vercel](https://vercel.com):

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add all `.env.local` variables in the Vercel project settings.
4. Set the Clerk webhook URL to `https://<your-domain>/api/webhooks/clerk`.

Vercel will auto-deploy on every push to the default branch.

## License

Private project. All rights reserved.
