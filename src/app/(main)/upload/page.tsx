"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Upload,
  X,
  Film,
  Clock,
  FileWarning,
  Loader2,
  Hash,
  Type,
  AlignLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DURATION = 60; // seconds
const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface UploadResponse {
  id: string;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video metadata"));
    };
    video.src = URL.createObjectURL(file);
  });
}

export default function UploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagsInput, setHashtagsInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setValidationError(
        "Invalid file type. Please upload MP4, MOV, or WebM."
      );
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      );
      return;
    }

    // Validate duration
    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_DURATION) {
        setValidationError(
          `Video too long (${Math.ceil(duration)}s). Maximum duration is ${MAX_DURATION}s.`
        );
        return;
      }
      setVideoDuration(Math.round(duration));
    } catch {
      setValidationError("Could not read video file. Please try another file.");
      return;
    }

    // Clean up old preview
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoDuration(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadMutation = useMutation<UploadResponse, Error>({
    mutationFn: async () => {
      if (!videoFile) throw new Error("No video file selected");
      if (!title.trim()) throw new Error("Title is required");

      const formData = new FormData();
      formData.append("videoFile", videoFile);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("hashtags", hashtagsInput.trim());

      // Use XMLHttpRequest to track upload progress
      return new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            let message = "Upload failed";
            try {
              const body = JSON.parse(xhr.responseText);
              message = body.error || message;
            } catch {
              // use default message
            }
            reject(new Error(message));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () =>
          reject(new Error("Upload cancelled"))
        );

        xhr.open("POST", "/api/shorts/upload");
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast.success("Short uploaded successfully!");
      // Reset form state
      clearFile();
      setTitle("");
      setDescription("");
      setHashtagsInput("");
      setUploadProgress(0);
      // Invalidate feed caches so dashboard shows the new short
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      router.push(`/shorts/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload short");
      setUploadProgress(0);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    uploadMutation.mutate();
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="mb-2 text-2xl font-bold text-text-primary">
          Upload Short
        </h1>
        <p className="mb-8 text-sm text-text-tertiary">
          Share a video up to 60 seconds long (max 20MB)
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload Area */}
          <div>
            {!videoFile ? (
              <label
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-bg-secondary py-16 transition-colors hover:border-primary hover:bg-bg-tertiary/50"
                htmlFor="video-upload"
              >
                <Upload className="mb-3 h-10 w-10 text-text-tertiary" />
                <p className="text-sm font-medium text-text-secondary">
                  Click to select a video
                </p>
                <p className="mt-1 text-xs text-text-tertiary">
                  MP4, MOV, or WebM - Max 20MB, 60s
                </p>
                <input
                  ref={fileInputRef}
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-bg-secondary">
                <video
                  src={videoPreviewUrl!}
                  controls
                  className="mx-auto max-h-80 rounded-2xl"
                />
                {!isUploading && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="flex items-center gap-4 px-4 py-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Film className="h-3.5 w-3.5" />
                    {videoFile.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileWarning className="h-3.5 w-3.5" />
                    {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  {videoDuration != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {videoDuration}s
                    </span>
                  )}
                </div>
              </div>
            )}

            {validationError && (
              <p className="mt-2 flex items-center gap-1 text-sm text-error">
                <FileWarning className="h-4 w-4" />
                {validationError}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-text-secondary"
            >
              <Type className="h-4 w-4" />
              Title <span className="text-error">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your short a catchy title"
              maxLength={100}
              required
              disabled={isUploading}
              className="w-full rounded-xl bg-bg-secondary border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-text-tertiary text-right">
              {title.length}/100
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-text-secondary"
            >
              <AlignLeft className="h-4 w-4" />
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this short about?"
              maxLength={500}
              rows={3}
              disabled={isUploading}
              className="w-full rounded-xl bg-bg-secondary border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors resize-none disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-text-tertiary text-right">
              {description.length}/500
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <label
              htmlFor="hashtags"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-text-secondary"
            >
              <Hash className="h-4 w-4" />
              Hashtags
            </label>
            <input
              id="hashtags"
              type="text"
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              placeholder="#funny #viral #trending"
              disabled={isUploading}
              className="w-full rounded-xl bg-bg-secondary border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Separate hashtags with spaces
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Uploading...</span>
                <span className="font-medium text-primary">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-tertiary">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!videoFile || !title.trim() || isUploading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Short
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
