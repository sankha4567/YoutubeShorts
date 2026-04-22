import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
      <div className="text-center max-w-2xl animate-fade-in">
        <h1 className="mb-4 text-5xl font-bold sm:text-6xl">
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Shorts
          </span>
        </h1>
        <p className="mb-8 text-lg text-text-secondary sm:text-xl">
          Share your story in 60 seconds. Upload, discover, and engage with
          short-form video content.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="rounded-xl bg-primary px-8 py-3 text-lg font-semibold text-white shadow-glass-lg hover:bg-primary-light transition-all hover:scale-105"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-border px-8 py-3 text-lg font-semibold text-text-primary hover:bg-bg-secondary transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
