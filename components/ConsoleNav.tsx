"use client";
// The console's own chrome: a dark ink bar, clearly not the marketing site.
// Tabs for the console's sections, the signed-in account on the right.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import OrbitMark from "@/components/OrbitMark";

const TABS = [
  { href: "/dashboard", label: "Studio" },
  { href: "/dashboard/analytics", label: "Analytics" },
];

export default function ConsoleNav() {
  const path = usePathname();
  const { user } = useAuth();
  return (
    <header className="bg-[#16150F] text-[#F4F1EA]">
      <nav className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-6 py-3.5 md:px-12">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5" title="Back to the website">
            <OrbitMark size={22} ring="rgba(244,241,234,0.35)" dot="#F4F1EA" />
            <span className="hidden text-[15px] font-medium sm:block">OAISIS Labs</span>
            <span className="mono !text-[9px] !tracking-[0.25em]" style={{ color: "rgba(244,241,234,0.45)" }}>Console</span>
          </Link>
          <div className="flex items-center gap-1">
            {TABS.map((t) => {
              const active = path === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="rounded-full px-4 py-1.5 text-[13px] font-medium transition"
                  style={active ? { background: "#F4F1EA", color: "#16150F" } : { color: "rgba(244,241,234,0.65)" }}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px]" style={{ color: "rgba(244,241,234,0.55)" }}>
          <span className="hidden md:block">{user?.email}</span>
          <button onClick={() => signOut(auth)} className="transition hover:text-[#F4F1EA]">Sign out</button>
        </div>
      </nav>
    </header>
  );
}
