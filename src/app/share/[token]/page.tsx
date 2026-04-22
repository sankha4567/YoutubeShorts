"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Play,
  Clock,
  UserCircle,
  Home,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  AlertTriangle,
} from "lucide-react";

interface ShareShort {
  id: string;
  title: string;
  description: string | null;
  imageKitUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    name: string | null;
    profilePictureUrl: string | null;
  };
}

interface ShareResponse {
  short: ShareShort;
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const { data, isLoading, error } = useQuery<ShareResponse>({
    queryKey: ["share", token],
    queryFn: async () => {
      const res = await fetch(`/api/shares/${token}`);
      if (res.status === 410) {
        throw new Error("EXPIRED");
      }
      if (!res.ok) throw new Error("NOT_FOUND");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const isExpired = error?.message === "EXPIRED";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
        <div className="w-full max-w-md glass rounded-2xl p-8 shadow-glass-lg animate-fade-in">
          <div className="aspect-[9/16] w-full rounded-xl bg-bg-tertiary animate-pulse" />
          <div className="mt-6 space-y-3">
            <div className="h-6 w-3/4 rounded bg-bg-tertiary animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-bg-tertiary animate-pulse" />
            <div className="h-4 w-full rounded bg-bg-tertiary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Expired state
  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm glass rounded-2xl p-8 shadow-glass-lg text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
            <Clock className="h-10 w-10 text-error" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-text-primary">
            Link Expired
          </h1>
          <p className="mt-2 text-text-secondary">
            This share link has expired and is no longer available.
          </p>
          <Link
            href="/"
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </motion.div>
      </div>
    );
  }

  // Error / not found state
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm glass rounded-2xl p-8 shadow-glass-lg text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-10 w-10 text-error" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-text-primary">
            Not Found
          </h1>
          <p className="mt-2 text-text-secondary">
            This share link doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const { short } = data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md glass rounded-2xl shadow-glass-lg overflow-hidden"
      >
        {/* Video Preview */}
        <div className="relative aspect-[9/16] w-full bg-black">
          <video
            src={short.imageKitUrl}
            className="h-full w-full object-contain"
            controls
            preload="metadata"
            poster={`${short.imageKitUrl}?tr=so-0`}
          />
        </div>

        {/* Info */}
        <div className="p-6">
          {/* Creator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative h-10 w-10 shrink-0">
              {short.creator.profilePictureUrl ? (
                <Image
                  src={short.creator.profilePictureUrl}
                  alt={short.creator.username}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-bg-tertiary">
                  <UserCircle className="h-6 w-6 text-text-tertiary" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">
                {short.creator.name || short.creator.username}
              </p>
              <p className="text-sm text-text-tertiary">
                @{short.creator.username}
              </p>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-lg font-bold text-text-primary">
            {short.title}
          </h1>

          {/* Description */}
          {short.description && (
            <p className="mt-2 text-sm text-text-secondary">
              {short.description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 text-sm text-text-tertiary">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {short.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {short.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {short.commentCount}
            </span>
            <span className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              {short.shareCount}
            </span>
          </div>

          {/* View in App Button */}
          <button
            onClick={() => router.replace(`/shorts/${short.id}`)}
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-light transition-colors w-full"
          >
            <Play className="h-4 w-4" />
            View in App
          </button>
        </div>
      </motion.div>
    </div>
  );
}
