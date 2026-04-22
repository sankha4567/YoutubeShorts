"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Sparkles, Loader2 } from "lucide-react";
import ShortCard, { type ShortCardData } from "@/components/ShortCard";

type TabKey = "yours" | "recommendations";

interface FeedResponse {
  shorts: ShortCardData[];
  total: number;
  hasMore: boolean;
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "yours", label: "Your Shorts", icon: <Film className="h-4 w-4" /> },
  {
    key: "recommendations",
    label: "Recommendations",
    icon: <Sparkles className="h-4 w-4" />,
  },
];

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[9/16] w-full bg-bg-tertiary" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-bg-tertiary" />
          <div className="h-3 w-20 rounded bg-bg-tertiary" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 w-10 rounded bg-bg-tertiary" />
          <div className="h-3 w-10 rounded bg-bg-tertiary" />
          <div className="h-3 w-10 rounded bg-bg-tertiary" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("yours");
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["feed", activeTab],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/shorts/feed/${activeTab}?limit=10&offset=${pageParam}`
      );
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((acc, p) => acc + p.shorts.length, 0);
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const shorts = data?.pages.flatMap((page) => page.shorts) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Tabs */}
      <div className="mb-8 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "glass text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : isError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <p className="text-text-tertiary">
              Something went wrong. Please try again.
            </p>
          </motion.div>
        ) : shorts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="mb-4 rounded-full bg-bg-secondary p-6">
              <Film className="h-12 w-12 text-text-tertiary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {activeTab === "yours"
                ? "No shorts yet"
                : "No recommendations yet"}
            </h3>
            <p className="text-sm text-text-tertiary">
              {activeTab === "yours"
                ? "Upload your first short to get started!"
                : "Follow creators and watch shorts to get personalized recommendations."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shorts.map((short) => (
                <ShortCard key={short.id} short={short} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="h-10" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
