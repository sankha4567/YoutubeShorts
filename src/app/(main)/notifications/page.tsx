"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  Bell,
  Heart,
  MessageCircle,
  Reply,
  UserPlus,
  CheckCheck,
  UserCircle,
  Loader2,
} from "lucide-react";

interface NotificationActor {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  type: "LIKE" | "COMMENT" | "REPLY" | "FOLLOW";
  shortId: string | null;
  commentId: string | null;
  isRead: boolean;
  createdAt: string;
  actor: NotificationActor | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const NOTIFICATION_CONFIG: Record<
  string,
  { icon: typeof Heart; text: string; color: string }
> = {
  LIKE: { icon: Heart, text: "liked your short", color: "text-accent" },
  COMMENT: {
    icon: MessageCircle,
    text: "commented on your short",
    color: "text-primary-light",
  },
  REPLY: {
    icon: Reply,
    text: "replied to your comment",
    color: "text-success",
  },
  FOLLOW: {
    icon: UserPlus,
    text: "started following you",
    color: "text-primary-light",
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      const offset = (pageParam as number) * 20;
      const res = await fetch(
        `/api/notifications?limit=20&offset=${offset}`
      );
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.notifications.length < 20) return undefined;
      return allPages.length;
    },
  });

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(
        `/api/notifications/${notificationId}/read`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    if (notification.type === "FOLLOW" && notification.actor) {
      router.push(`/profile/${notification.actorId}`);
    } else if (notification.shortId) {
      router.push(`/shorts/${notification.shortId}`);
    }
  };

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

  const allNotifications =
    data?.pages.flatMap((page) => page.notifications) || [];
  const unreadCount = data?.pages[0]?.unreadCount || 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary-light" />
          <h1 className="text-2xl font-bold text-text-primary">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl glass p-4"
            >
              <div className="h-12 w-12 rounded-full bg-bg-tertiary animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-bg-tertiary animate-pulse" />
                <div className="h-3 w-1/4 rounded bg-bg-tertiary animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && allNotifications.length > 0 && (
        <div className="space-y-1">
          {allNotifications.map((notification, index) => {
            const config = NOTIFICATION_CONFIG[notification.type];
            const Icon = config?.icon || Bell;

            return (
              <motion.button
                key={notification.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors ${
                  notification.isRead
                    ? "hover:bg-bg-secondary/50"
                    : "bg-bg-tertiary/40 hover:bg-bg-tertiary/60"
                }`}
              >
                {/* Actor Avatar */}
                <div className="relative shrink-0">
                  <div className="relative h-12 w-12">
                    {notification.actor?.profilePictureUrl ? (
                      <Image
                        src={notification.actor.profilePictureUrl}
                        alt={notification.actor.username}
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-bg-tertiary">
                        <UserCircle className="h-7 w-7 text-text-tertiary" />
                      </div>
                    )}
                  </div>
                  {/* Type icon badge */}
                  <div
                    className={`absolute -bottom-1 -right-1 rounded-full bg-bg-primary p-1 ${config?.color || "text-text-tertiary"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">
                      {notification.actor?.username || "Someone"}
                    </span>{" "}
                    {config?.text || "interacted with you"}
                  </p>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && allNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl glass py-20">
          <Bell className="h-14 w-14 text-text-tertiary" />
          <p className="mt-4 text-lg font-medium text-text-secondary">
            No notifications yet
          </p>
          <p className="mt-1 text-sm text-text-tertiary">
            When someone interacts with your content, you&apos;ll see it here
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
