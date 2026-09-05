import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Lightning } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Loggy",
  description: "Create a Loggy account to start tracking your daily challenges.",
};

export default async function SignUpPage() {
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

      <SignUp
        fallbackRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
