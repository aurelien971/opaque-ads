"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Nav() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-stroke/60 bg-ink/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="mercury-bg inline-block h-5 w-5 rounded-full border-2 border-ink ring-2 ring-accent/40" />
          <span className="mercury-text text-[17px] font-bold">Opaque Studio</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/#features" className="hidden text-muted hover:text-fg sm:block">
            Features
          </Link>
          <Link href="/pricing" className="hidden text-muted hover:text-fg sm:block">
            Pricing
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-accent px-4 py-1.5 font-semibold text-ink hover:bg-deep hover:text-fg"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-muted hover:text-fg">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-4 py-1.5 font-semibold text-ink hover:bg-deep hover:text-fg"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
