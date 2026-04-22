"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  UserCircle,
  Users,
  Video,
  Calendar,
  Edit3,
  X,
  Loader2,
  Play,
  Eye,
  Heart,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  shortCount: number;
  isFollowing: boolean;
}

interface CurrentUserProfile extends UserProfile {
  clerkId: string;
}

interface ShortItem {
  id: string;
  title: string;
  description: string | null;
  imageKitUrl: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    name: string | null;
    profilePictureUrl: string | null;
  };
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Fetch current user to check if this is own profile
  const { data: currentUser } = useQuery<CurrentUserProfile>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/users/profile");
      if (!res.ok) throw new Error("Failed to fetch current user");
      return res.json();
    },
  });

  const isOwnProfile = currentUser?.id === id;

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: ["userProfile", id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return res.json();
    },
    enabled: !!id,
  });

  // Fetch user's shorts
  const { data: userShortsData, isLoading: userShortsLoading } = useQuery<{
    shorts: ShortItem[];
    total: number;
    hasMore: boolean;
  }>({
    queryKey: ["userShorts", id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}/shorts?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch user shorts");
      return res.json();
    },
    enabled: !!id,
  });

  const userShorts = userShortsData?.shorts || [];

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${id}/follow`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to follow");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", id] });
      toast.success("Following!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${id}/follow`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unfollow");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", id] });
      toast.success("Unfollowed");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Edit profile mutation
  const editMutation = useMutation({
    mutationFn: async (data: { name: string; bio: string }) => {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", id] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setEditModalOpen(false);
      toast.success("Profile updated!");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/users/delete-account", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Account deleted successfully");
      signOut({ redirectUrl: "/" });
    },
    onError: () => {
      toast.error("Failed to delete account");
    },
  });

  const openEditModal = () => {
    setEditName(profile?.name || "");
    setEditBio(profile?.bio || "");
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editMutation.mutate({ name: editName, bio: editBio });
  };

  const handleFollowToggle = () => {
    if (profile?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
        {/* Profile skeleton */}
        <div className="glass rounded-2xl p-8 shadow-glass-lg">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="h-28 w-28 rounded-full bg-bg-tertiary animate-pulse" />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="h-7 w-48 rounded bg-bg-tertiary animate-pulse mx-auto sm:mx-0" />
              <div className="h-5 w-32 rounded bg-bg-tertiary animate-pulse mx-auto sm:mx-0" />
              <div className="h-4 w-64 rounded bg-bg-tertiary animate-pulse mx-auto sm:mx-0" />
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 w-12 rounded bg-bg-tertiary animate-pulse mx-auto" />
                <div className="mt-1 h-4 w-16 rounded bg-bg-tertiary animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Shorts grid skeleton */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] rounded-xl bg-bg-tertiary animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <UserCircle className="h-16 w-16 text-text-tertiary" />
        <h2 className="text-xl font-semibold text-text-primary">
          User Not Found
        </h2>
        <p className="text-text-secondary">
          This profile doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
      {/* Profile Card */}
      <div className="glass rounded-2xl p-8 shadow-glass-lg">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative h-28 w-28 shrink-0">
            {profile.profilePictureUrl ? (
              <Image
                src={profile.profilePictureUrl}
                alt={profile.username}
                fill
                className="rounded-full object-cover border-4 border-primary/30"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-bg-tertiary border-4 border-primary/30">
                <UserCircle className="h-16 w-16 text-text-tertiary" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {profile.name || profile.username}
                </h1>
                <p className="text-text-tertiary">@{profile.username}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={openEditModal}
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="flex items-center gap-2 rounded-xl border border-error/50 px-4 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    disabled={
                      followMutation.isPending || unfollowMutation.isPending
                    }
                    className={`flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      profile.isFollowing
                        ? "border border-border text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                        : "bg-primary text-white hover:bg-primary-light"
                    }`}
                  >
                    {followMutation.isPending || unfollowMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {profile.isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 text-text-secondary">{profile.bio}</p>
            )}

            {/* Joined date */}
            <div className="mt-2 flex items-center justify-center gap-1 text-sm text-text-tertiary sm:justify-start">
              <Calendar className="h-3.5 w-3.5" />
              Joined {formatDate(profile.createdAt)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 flex justify-center gap-8 border-t border-border pt-6">
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary">
              {profile.followerCount}
            </p>
            <p className="flex items-center gap-1 text-sm text-text-tertiary">
              <Users className="h-3.5 w-3.5" />
              Followers
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary">
              {profile.followingCount}
            </p>
            <p className="flex items-center gap-1 text-sm text-text-tertiary">
              <Users className="h-3.5 w-3.5" />
              Following
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary">
              {profile.shortCount}
            </p>
            <p className="flex items-center gap-1 text-sm text-text-tertiary">
              <Video className="h-3.5 w-3.5" />
              Shorts
            </p>
          </div>
        </div>
      </div>

      {/* User's Shorts */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Shorts
        </h2>

        {userShortsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[9/16] rounded-xl bg-bg-tertiary animate-pulse"
              />
            ))}
          </div>
        ) : userShorts && userShorts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {userShorts.map((short) => (
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
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium text-white line-clamp-2">
                    {short.title}
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
                {/* Play icon center */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="rounded-full bg-black/50 p-3">
                    <Play className="h-6 w-6 text-white" fill="white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl glass py-16">
            <Video className="h-12 w-12 text-text-tertiary" />
            <p className="mt-3 text-text-secondary">No shorts yet</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-6 shadow-glass-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">
                  Edit Profile
                </h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg p-1 text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full rounded-xl bg-bg-secondary border border-border px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    maxLength={160}
                    rows={3}
                    className="w-full rounded-xl bg-bg-secondary border border-border px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                  <p className="mt-1 text-xs text-text-tertiary text-right">
                    {editBio.length}/160
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {editMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass rounded-2xl p-6 shadow-glass-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 mb-4">
                  <AlertTriangle className="h-6 w-6 text-error" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Delete Account
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                  This will permanently delete your account, all your shorts,
                  comments, likes, and followers. This action cannot be undone.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="flex-1 rounded-xl bg-error py-2.5 text-sm font-semibold text-white hover:bg-error/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleteMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
