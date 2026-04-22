"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  MessageCircle,
  Copy,
  Check,
  X,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import CommentThread from "@/components/CommentThread";

interface ShortData {
  id: string;
  title: string;
  description: string | null;
  imageKitUrl: string;
  hashtags: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  createdAt: string;
  creator: {
    id: string;
    clerkId: string;
    username: string;
    name: string | null;
    profilePictureUrl: string | null;
  };
  userLikeStatus?: "LIKE" | "DISLIKE" | null;
  likeStatus?: "LIKE" | "DISLIKE" | null;
  isFollowing?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ShortDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [shorts, setShorts] = useState<ShortData[]>([]);
  const [activeId, setActiveId] = useState<string>(params.id);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch initial short + first batch of feed
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Fetch the clicked short
        const shortRes = await fetch(`/api/shorts/${params.id}`);
        const clickedShort: ShortData = await shortRes.json();

        // Fetch recommendations feed
        const feedRes = await fetch(`/api/shorts/feed/recommendations?limit=10&offset=0`);
        const feedData = await feedRes.json();
        const feedShorts: ShortData[] = feedData.shorts || [];

        // Combine: clicked short first, then feed (no duplicates)
        const combined = [clickedShort];
        for (const s of feedShorts) {
          if (s.id !== clickedShort.id) combined.push(s);
        }

        setShorts(combined);
        setOffset(10);
        setHasMore(feedData.hasMore ?? false);
      } catch {
        toast.error("Failed to load shorts");
      }
      setLoading(false);
    }
    init();
  }, [params.id]);

  // Load more shorts
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/shorts/feed/recommendations?limit=10&offset=${offset}`);
      const data = await res.json();
      const newShorts: ShortData[] = data.shorts || [];

      setShorts((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const unique = newShorts.filter((s) => !existingIds.has(s.id));
        return [...prev, ...unique];
      });
      setOffset((prev) => prev + 10);
      setHasMore(data.hasMore ?? false);
    } catch {
      // ignore
    }
    setLoadingMore(false);
  }, [offset, loadingMore, hasMore]);

  // Intersection Observer to detect active short
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-short-id");
            if (id) {
              setActiveId(id);
              window.history.replaceState(null, "", `/shorts/${id}`);
            }
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    const items = container.querySelectorAll("[data-short-id]");
    items.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [shorts.length]);

  // Load more when near the end
  useEffect(() => {
    const idx = shorts.findIndex((s) => s.id === activeId);
    if (idx >= shorts.length - 3) {
      loadMore();
    }
  }, [activeId, shorts.length, loadMore]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-bg-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] bg-bg-primary">
      {/* Vertical snap-scroll feed */}
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {shorts.map((short) => (
          <ReelItem
            key={short.id}
            short={short}
            isActive={activeId === short.id}
            globalMuted={globalMuted}
            onToggleMute={() => setGlobalMuted((m) => !m)}
            user={user}
            queryClient={queryClient}
          />
        ))}

        {loadingMore && (
          <div className="flex h-20 items-center justify-center snap-start">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Individual Reel ────────────────────────────────────────────────
function ReelItem({
  short,
  isActive,
  globalMuted,
  onToggleMute,
  user,
  queryClient,
}: {
  short: ShortData;
  isActive: boolean;
  globalMuted: boolean;
  onToggleMute: () => void;
  user: ReturnType<typeof useUser>["user"];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Refetch detail for live like status
  const { data: detail } = useQuery<ShortData>({
    queryKey: ["short", short.id],
    queryFn: async () => {
      const res = await fetch(`/api/shorts/${short.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    initialData: short,
    staleTime: 0,
    enabled: isActive,
  });

  const s = detail || short;
  const userLikeStatus = s.userLikeStatus ?? s.likeStatus ?? null;
  const isOwnShort = user?.id === s.creator?.clerkId;
  const hashtags = s.hashtags ? s.hashtags.split(/[,\s]+/).filter(Boolean) : [];

  // Auto play/pause based on visibility
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      vid.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      vid.pause();
      vid.currentTime = 0;
      setIsPlaying(false);
      setCommentsOpen(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = globalMuted;
  }, [globalMuted]);

  // Register view once
  useEffect(() => {
    if (isActive) {
      fetch(`/api/shorts/${s.id}/view`, { method: "PUT" }).catch(() => {});
    }
  }, [isActive, s.id]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); setIsPlaying(true); }
    else { vid.pause(); setIsPlaying(false); }
  };

  const likeMutation = useMutation({
    mutationFn: async (type: "LIKE" | "DISLIKE") => {
      if (userLikeStatus === type) {
        const res = await fetch("/api/likes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shortId: s.id }) });
        if (!res.ok) throw new Error("Failed");
        return { action: "removed", type };
      }
      const res = await fetch("/api/likes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shortId: s.id, type }) });
      if (!res.ok) throw new Error("Failed");
      return { action: "set", type, ...(await res.json()) };
    },
    onMutate: async (type: "LIKE" | "DISLIKE") => {
      await queryClient.cancelQueries({ queryKey: ["short", s.id] });
      const prev = queryClient.getQueryData<ShortData>(["short", s.id]);
      if (prev) {
        const isRemoving = prev.userLikeStatus === type || prev.likeStatus === type;
        const oldType = prev.userLikeStatus ?? prev.likeStatus;
        queryClient.setQueryData<ShortData>(["short", s.id], {
          ...prev,
          userLikeStatus: isRemoving ? null : type,
          likeStatus: isRemoving ? null : type,
          likeCount: prev.likeCount
            + (type === "LIKE" && !isRemoving ? 1 : 0)
            + (type !== "LIKE" && oldType === "LIKE" ? -1 : 0)
            + (type === "LIKE" && isRemoving ? -1 : 0),
          dislikeCount: prev.dislikeCount
            + (type === "DISLIKE" && !isRemoving ? 1 : 0)
            + (type !== "DISLIKE" && oldType === "DISLIKE" ? -1 : 0)
            + (type === "DISLIKE" && isRemoving ? -1 : 0),
        });
      }
      return { prev };
    },
    onError: (_err, _type, context) => {
      if (context?.prev) queryClient.setQueryData(["short", s.id], context.prev);
      toast.error("Failed to update reaction");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["short", s.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const method = s.isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${s.creator.id}/follow`, { method });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["short", s.id] });
      toast.success(s.isFollowing ? "Unfollowed" : "Following!");
    },
    onError: () => toast.error("Failed to update follow"),
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/shares", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shortId: s.id }) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["short", s.id] });
      const prev = queryClient.getQueryData<ShortData>(["short", s.id]);
      if (prev) {
        queryClient.setQueryData<ShortData>(["short", s.id], { ...prev, shareCount: prev.shareCount + 1 });
      }
      return { prev };
    },
    onSuccess: (data) => {
      setShareLink(data.link || `${window.location.origin}/share/${data.token}`);
      setShareModalOpen(true);
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["short", s.id], context.prev);
      toast.error("Failed to share");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["short", s.id] });
    },
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy link"); }
  };

  return (
    <div
      data-short-id={s.id}
      className="h-[calc(100vh-4rem)] w-full flex items-center justify-center snap-start snap-always relative"
    >
      <div className="relative flex items-center gap-4 h-full py-4">
        {/* Video */}
        <div className="relative h-full max-h-[calc(100vh-6rem)] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-glass-lg">
          <video
            ref={videoRef}
            src={s.imageKitUrl}
            className="h-full w-full object-cover cursor-pointer"
            loop
            playsInline
            muted={globalMuted}
            onClick={togglePlay}
          />

          {/* Top controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <button onClick={() => window.location.href = "/dashboard"} className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-2">
              <button onClick={togglePlay} className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors cursor-pointer">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="white" />}
              </button>
              <button onClick={onToggleMute} className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors cursor-pointer">
                {globalMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-20">
            {/* Creator */}
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/profile/${s.creator.id}`} className="flex items-center gap-2 group">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-bg-tertiary border-2 border-white/30 shrink-0">
                  {s.creator.profilePictureUrl ? (
                    <Image src={s.creator.profilePictureUrl} alt="" width={32} height={32} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white">{s.creator.username.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <span className="text-sm font-semibold text-white group-hover:underline">@{s.creator.username}</span>
              </Link>
              {!isOwnShort && (
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${s.isFollowing ? "bg-white/20 text-white" : "bg-white text-black hover:bg-white/90"}`}
                >
                  {s.isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            <p className="text-sm font-medium text-white line-clamp-2">{s.title}</p>
            {s.description && <p className="text-xs text-white/70 line-clamp-1 mt-1">{s.description}</p>}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hashtags.slice(0, 4).map((tag) => (
                  <Link key={tag} href={`/search?q=${encodeURIComponent(tag.startsWith("#") ? tag : `#${tag}`)}`} className="text-xs font-medium text-white/80 hover:text-white">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex flex-col items-center gap-5">
          <ActionBtn active={userLikeStatus === "LIKE"} activeClass="bg-primary text-white" onClick={() => likeMutation.mutate("LIKE")} disabled={likeMutation.isPending} icon={<ThumbsUp className="h-5 w-5" />} label={formatCount(s.likeCount)} />
          <ActionBtn active={userLikeStatus === "DISLIKE"} activeClass="bg-error text-white" onClick={() => likeMutation.mutate("DISLIKE")} disabled={likeMutation.isPending} icon={<ThumbsDown className="h-5 w-5" />} label="Dislike" />
          <ActionBtn active={commentsOpen} activeClass="bg-primary text-white" onClick={() => setCommentsOpen(!commentsOpen)} icon={<MessageCircle className="h-5 w-5" />} label={formatCount(s.commentCount)} />
          <ActionBtn onClick={() => shareMutation.mutate()} disabled={shareMutation.isPending} icon={shareMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />} label={s.shareCount > 0 ? formatCount(s.shareCount) : "Share"} />

          <Link href={`/profile/${s.creator.id}`} className="mt-2">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary bg-bg-tertiary">
              {s.creator.profilePictureUrl ? (
                <Image src={s.creator.profilePictureUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm font-bold text-text-tertiary">{s.creator.username.charAt(0).toUpperCase()}</div>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute right-0 top-0 w-[400px] h-full border-l border-border bg-bg-secondary flex flex-col z-20"
          >
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-text-primary">
                Comments <span className="text-text-tertiary font-normal">{formatCount(s.commentCount)}</span>
              </h2>
              <button onClick={() => setCommentsOpen(false)} className="rounded-lg p-1.5 text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CommentThread shortId={s.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShareModalOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass rounded-2xl p-6 shadow-glass-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Share this Short</h3>
                <button onClick={() => setShareModalOpen(false)} className="rounded-lg p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-xs text-text-tertiary mb-3">This link expires in 24 hours</p>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={shareLink} className="flex-1 rounded-xl bg-bg-primary border border-border px-4 py-2.5 text-sm text-text-primary truncate focus:outline-none" />
                <button onClick={handleCopyLink} className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-light transition-colors flex items-center gap-1.5">
                  {copied ? <><Check className="h-4 w-4" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reusable Action Button ─────────────────────────────────────────
function ActionBtn({
  active,
  activeClass,
  onClick,
  disabled,
  icon,
  label,
}: {
  active?: boolean;
  activeClass?: string;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-1 group cursor-pointer">
      <div className={`rounded-full p-3 transition-colors ${active ? activeClass : "bg-bg-tertiary text-text-secondary group-hover:text-text-primary group-hover:bg-bg-secondary"}`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </button>
  );
}
