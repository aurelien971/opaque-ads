"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Logo from "@/components/Logo";

export default function Nav() {
  const { user } = useAuth();
  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0 border-b border-stroke">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} className="text-fg" />
          <span className="text-[17px] font-bold tracking-tight">OAISIS Labs</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/#how" className="hidden text-muted hover:text-fg sm:block">
            How it works
          </Link>
          <Link href="/pricing" className="hidden text-muted hover:text-fg sm:block">
            Pricing
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="glass-bright rounded-full px-4 py-1.5 font-semibold text-fg transition"
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
                className="glass-bright rounded-full px-4 py-1.5 font-semibold text-fg transition"
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
