"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Clock,
  UserCircle,
  Hash,
  Play,
  Eye,
  Heart,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface ShortResult {
  id: string;
  title: string;
  description: string | null;
  imageKitUrl: string;
  viewCount: number;
  likeCount: number;
  hashtags: string;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    name: string | null;
    profilePictureUrl: string | null;
  };
}

interface UserResult {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
}

interface SearchResponse {
  type: "hashtag" | "user" | "general";
  results: ShortResult[] | UserResult[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

function removeRecentSearch(query: string) {
  const recent = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setInputValue(q);
    setActiveQuery(q);
  }, [searchParams]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<SearchResponse>({
    queryKey: ["search", activeQuery],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(activeQuery)}&page=${pageParam}&limit=20`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: !!activeQuery.trim(),
  });

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setRecentSearches(getRecentSearches());
    setShowRecent(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleRecentClick = (query: string) => {
    setInputValue(query);
    setShowRecent(false);
    addRecentSearch(query);
    setRecentSearches(getRecentSearches());
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleRemoveRecent = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    removeRecentSearch(query);
    setRecentSearches(getRecentSearches());
  };

  const searchType = data?.pages[0]?.type;
  const allResults = data?.pages.flatMap((page) => page.results as (ShortResult | UserResult)[]) || [];
  const totalCount = data?.pages[0]?.pagination.totalCount || 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 animate-fade-in">
      {/* Search Input */}
      <div className="relative mb-8">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setShowRecent(true)}
              onBlur={() => setTimeout(() => setShowRecent(false), 200)}
              placeholder="Search #hashtags, @users, or video titles..."
              className="w-full rounded-2xl glass border border-border py-3.5 pl-12 pr-12 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors shadow-glass"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue("");
                  inputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </form>

        {/* Recent Searches Dropdown */}
        <AnimatePresence>
          {showRecent && !inputValue && recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-0 right-0 top-full z-10 mt-2 glass rounded-xl border border-border shadow-glass-lg overflow-hidden"
            >
              <div className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((query) => (
                <button
                  key={query}
                  onClick={() => handleRecentClick(query)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                >
                  <Clock className="h-4 w-4 shrink-0 text-text-tertiary" />
                  <span className="flex-1 truncate">{query}</span>
                  <button
                    onClick={(e) => handleRemoveRecent(e, query)}
                    className="shrink-0 rounded p-0.5 text-text-tertiary hover:text-error transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Header */}
      {activeQuery && !isLoading && (
        <div className="mb-6 flex items-center gap-2">
          {searchType === "hashtag" ? (
            <Hash className="h-5 w-5 text-primary-light" />
          ) : searchType === "user" ? (
            <UserCircle className="h-5 w-5 text-primary-light" />
          ) : (
            <TrendingUp className="h-5 w-5 text-primary-light" />
          )}
          <h2 className="text-lg font-semibold text-text-primary">
            {totalCount} result{totalCount !== 1 ? "s" : ""} for &quot;{activeQuery}&quot;
          </h2>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] rounded-xl bg-bg-tertiary animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center rounded-xl glass py-16">
          <p className="text-error font-medium">Search failed</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Please try again later
          </p>
        </div>
      )}

      {/* User Results */}
      {searchType === "user" && allResults.length > 0 && (
        <div className="space-y-3">
          {(allResults as UserResult[]).map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-bg-tertiary/50 transition-colors border border-transparent hover:border-border"
            >
              <div className="relative h-14 w-14 shrink-0">
                {user.profilePictureUrl ? (
                  <Image
                    src={user.profilePictureUrl}
                    alt={user.username}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-bg-tertiary">
                    <UserCircle className="h-8 w-8 text-text-tertiary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary truncate">
                  {user.name || user.username}
                </p>
                <p className="text-sm text-text-tertiary">@{user.username}</p>
                {user.bio && (
                  <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Shorts Results (hashtag or general) */}
      {(searchType === "hashtag" || searchType === "general") &&
        allResults.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(allResults as ShortResult[]).map((short) => (
              <Link
                key={short.id}
                href={`/shorts/${short.id}`}
                className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-bg-secondary border border-border hover:border-primary/50 transition-all"
              >
                <video
                  src={short.imageKitUrl}
                  className="h-full w-full object-cover"
                  muted
                  preload="metadata"
                  onMouseOver={(e) =>
                    (e.target as HTMLVideoElement).play()
                  }
                  onMouseOut={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.pause();
                    video.currentTime = 0;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium text-white line-clamp-2">
                    {short.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-300">
                    @{short.creator.username}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-300">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {short.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {short.likeCount}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="rounded-full bg-black/50 p-3">
                    <Play className="h-6 w-6 text-white" fill="white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      {/* No Results */}
      {!isLoading && activeQuery && allResults.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl glass py-16">
          <Search className="h-12 w-12 text-text-tertiary" />
          <p className="mt-3 text-text-secondary font-medium">
            No results found
          </p>
          <p className="mt-1 text-sm text-text-tertiary">
            Try a different search term
          </p>
        </div>
      )}

      {/* Empty state - no query */}
      {!activeQuery && (
        <div className="flex flex-col items-center justify-center rounded-xl glass py-16">
          <Search className="h-12 w-12 text-text-tertiary" />
          <p className="mt-3 text-text-secondary font-medium">
            Search for content
          </p>
          <p className="mt-1 text-sm text-text-tertiary text-center">
            Use <span className="text-primary-light">#hashtags</span> to find
            videos or <span className="text-primary-light">@username</span> to
            find people
          </p>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-light" />
        )}
      </div>
    </div>
  );
}
