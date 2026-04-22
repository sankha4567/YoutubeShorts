"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Search,
  Upload,
  Bell,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Navbar() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notifData } = useQuery<{ unreadCount: number }>({
    queryKey: ["notificationCount"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=1&offset=0&unreadOnly=true");
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
    enabled: !!isSignedIn,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifData?.unreadCount ?? 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass shadow-glass-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 text-xl font-bold"
          >
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Shorts
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden flex-1 max-w-md md:flex"
          >
            <div className="relative flex w-full gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search #hashtags or @users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-bg-secondary border border-border py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right Actions - Desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Link>
            <Link
              href="/upload"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <UserButton
              signInUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-text-secondary hover:bg-bg-tertiary md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border pb-4 pt-2 md:hidden animate-fade-in">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search #hashtags or @users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl bg-bg-secondary border border-border py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="flex flex-col gap-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              >
                <Home className="h-5 w-5" />
                Home
              </Link>
              <Link
                href="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              >
                <Upload className="h-5 w-5" />
                Upload
              </Link>
              <Link
                href="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              >
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                Notifications
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-3 px-3">
              <UserButton
                signInUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
              <span className="text-sm text-text-secondary">
                {user?.username || user?.firstName || "Profile"}
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
