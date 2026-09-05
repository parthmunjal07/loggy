import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Lightning } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Loggy",
  description: "Sign in to your Loggy account to track daily habits and challenges.",
};

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-4 selection:bg-[var(--accent)] selection:text-zinc-950"
      style={{ background: "var(--surface-0)" }}
    >
      <div className="mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-sm tracking-tight text-[var(--text-primary)]"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
            <Lightning size={18} weight="fill" />
          </div>
          <span className="text-base font-bold">Loggy</span>
        </Link>
      </div>

      <SignIn
        fallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
