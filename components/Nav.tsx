"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import OrbitMark from "@/components/OrbitMark";

export default function Nav() {
  const { user } = useAuth();
  return (
    <header>
      <nav className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-6 md:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <OrbitMark size={26} />
          <span className="text-[16px] font-medium tracking-[0.01em]">OAISIS Labs</span>
        </Link>
        <div className="flex items-center gap-[30px] text-[14px] text-[#6C6A5F]">
          <Link href="/#journey" className="hidden transition hover:text-accent sm:block">How it works</Link>
          <Link href="/pricing" className="hidden transition hover:text-accent sm:block">Pricing</Link>
          {user ? (
            <Link href="/dashboard" className="pill-primary px-5 py-2.5 text-[14px] font-medium">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="transition hover:text-accent">Sign in</Link>
              <Link href="/signup" className="pill-primary px-5 py-2.5 text-[14px] font-medium">Start free</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
