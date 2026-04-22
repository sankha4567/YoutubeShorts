"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Eye } from "lucide-react";

export interface ShortCardData {
  id: string;
  title: string;
  description: string | null;
  imageKitUrl: string;
  hashtags: string[];
  creator: {
    id: string;
    username: string;
    profilePictureUrl: string | null;
  };
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  createdAt: string;
}

interface ShortCardProps {
  short: ShortCardData;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function ShortCard({ short }: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    videoRef.current?.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass glass-hover rounded-2xl overflow-hidden shadow-glass transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Thumbnail */}
      <Link href={`/shorts/${short.id}`} className="block">
        <div className="relative aspect-[9/16] w-full bg-bg-secondary overflow-hidden">
          <video
            ref={videoRef}
            src={short.imageKitUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          {!isHovering && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <p className="text-sm font-semibold text-white line-clamp-2 drop-shadow-lg">
              {short.title}
            </p>
          </div>
        </div>
      </Link>

      {/* Info Section */}
      <div className="p-3 space-y-2">
        {/* Creator */}
        <Link
          href={`/profile/${short.creator.id}`}
          className="flex items-center gap-2 group"
        >
          <div className="h-7 w-7 shrink-0 rounded-full bg-bg-tertiary overflow-hidden">
            {short.creator.profilePictureUrl ? (
              <img
                src={short.creator.profilePictureUrl}
                alt={short.creator.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-text-tertiary">
                {short.creator.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors truncate">
            @{short.creator.username}
          </span>
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-3 text-text-tertiary">
          <span className="flex items-center gap-1 text-xs">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(short.likeCount)}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatCount(short.commentCount)}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Share2 className="h-3.5 w-3.5" />
            {formatCount(short.shareCount)}
          </span>
          <span className="flex items-center gap-1 text-xs ml-auto">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(short.viewCount)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
