// app/dashboard/layout.tsx
// Shared layout for all authenticated app pages.

import { AppNav } from "@/components/AppNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh" style={{ background: "var(--surface-0)" }}>
      <AppNav />
      <main className="max-w-5xl mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
