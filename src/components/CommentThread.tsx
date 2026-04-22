"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Reply,
  Pencil,
  Trash2,
  Send,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    profilePictureUrl: string | null;
  };
  replies?: Comment[];
  parentCommentId: string | null;
}

interface CommentsResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}

interface CommentThreadProps {
  shortId: string;
}

function CommentItem({
  comment,
  shortId,
  depth = 0,
}: {
  comment: Comment;
  shortId: string;
  depth?: number;
}) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.text);

  const isOwner = user?.id === comment.user.id;

  const replyMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortId,
          text,
          parentCommentId: comment.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to post reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", shortId] });
      queryClient.invalidateQueries({ queryKey: ["short", shortId] });
      setReplyText("");
      setIsReplying(false);
    },
    onError: () => toast.error("Failed to post reply"),
  });

  const editMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to edit comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", shortId] });
      setIsEditing(false);
    },
    onError: () => toast.error("Failed to update comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", shortId] });
      queryClient.invalidateQueries({ queryKey: ["short", shortId] });
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) replyMutation.mutate(replyText.trim());
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim()) editMutation.mutate(editText.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={depth > 0 ? "ml-8 border-l border-border pl-4" : ""}
    >
      <div className="py-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="h-8 w-8 shrink-0 rounded-full bg-bg-tertiary overflow-hidden">
            {comment.user.profilePictureUrl ? (
              <img
                src={comment.user.profilePictureUrl}
                alt={comment.user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-text-tertiary">
                {comment.user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                @{comment.user.username}
              </span>
              <span className="text-xs text-text-tertiary">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {comment.createdAt !== comment.updatedAt && (
                <span className="text-xs text-text-tertiary">(edited)</span>
              )}
            </div>

            {/* Content / Edit Form */}
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full rounded-lg bg-bg-secondary border border-border px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none resize-none"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-light transition-colors disabled:opacity-50"
                  >
                    {editMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.text);
                    }}
                    className="rounded-lg bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap break-words">
                {comment.text}
              </p>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-3 mt-2">
                {depth < 2 && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1 text-xs text-text-tertiary hover:text-primary transition-colors cursor-pointer"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Reply
                  </button>
                )}
                {isOwner && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 text-xs text-text-tertiary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this comment?"))
                          deleteMutation.mutate();
                      }}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-xs text-text-tertiary hover:text-error transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reply Form */}
            <AnimatePresence>
              {isReplying && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleReplySubmit}
                  className="mt-3 overflow-hidden"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 rounded-lg bg-bg-secondary border border-border px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || replyMutation.isPending}
                      className="shrink-0 rounded-lg bg-primary p-2 text-white hover:bg-primary-light transition-colors disabled:opacity-50"
                    >
                      {replyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReplying(false);
                        setReplyText("");
                      }}
                      className="shrink-0 rounded-lg bg-bg-tertiary p-2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              shortId={shortId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function CommentThread({ shortId }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery<CommentsResponse>({
    queryKey: ["comments", shortId, offset],
    queryFn: async () => {
      const res = await fetch(
        `/api/shorts/${shortId}/comments?limit=20&offset=${offset}`
      );
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  const { user } = useUser();

  const postMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortId, text }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: ["comments", shortId, offset] });
      const prev = queryClient.getQueryData<CommentsResponse>(["comments", shortId, offset]);
      if (prev) {
        const optimisticComment: Comment = {
          id: `temp-${Date.now()}`,
          text,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: user?.id || "",
            username: user?.username || user?.firstName || "you",
            profilePictureUrl: user?.imageUrl || null,
          },
          replies: [],
          parentCommentId: null,
        };
        queryClient.setQueryData<CommentsResponse>(["comments", shortId, offset], {
          ...prev,
          comments: [optimisticComment, ...prev.comments],
          total: prev.total + 1,
        });
      }
      setNewComment("");
      return { prev };
    },
    onError: (_err, _text, context) => {
      if (context?.prev) queryClient.setQueryData(["comments", shortId, offset], context.prev);
      toast.error("Failed to post comment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", shortId] });
      queryClient.invalidateQueries({ queryKey: ["short", shortId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) postMutation.mutate(newComment.trim());
  };

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
        <MessageCircle className="h-5 w-5" />
        Comments
        {data?.total != null && (
          <span className="text-sm font-normal text-text-tertiary">
            ({data.total})
          </span>
        )}
      </h3>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-xl bg-bg-secondary border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || postMutation.isPending}
          className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-light transition-colors disabled:opacity-50"
        >
          {postMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-bg-tertiary" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-bg-tertiary" />
                <div className="h-3 w-full rounded bg-bg-tertiary" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.comments && data.comments.length > 0 ? (
        <>
          <div className="divide-y divide-border/50">
            {data.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                shortId={shortId}
              />
            ))}
          </div>

          {data.hasMore && (
            <button
              onClick={() => setOffset((prev) => prev + 20)}
              disabled={isFetching}
              className="w-full rounded-xl bg-bg-secondary py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
            >
              {isFetching ? "Loading..." : "Load more comments"}
            </button>
          )}
        </>
      ) : (
        <p className="py-8 text-center text-sm text-text-tertiary">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}
