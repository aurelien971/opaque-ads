import Link from "next/link";
import OrbitMark from "@/components/OrbitMark";

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(22,21,15,0.1)]">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-6 py-[30px] text-[13px] text-faint sm:flex-row sm:items-center sm:justify-between md:px-12">
        <div className="flex items-center gap-2">
          <OrbitMark size={18} ringWidth={1.2} ring="rgba(22,21,15,0.28)" dot="#8A8779" />
          <span>OAISIS Labs</span>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/pricing" className="hover:text-fg">Pricing</Link>
          <Link href="/terms" className="hover:text-fg">Terms</Link>
          <Link href="/privacy" className="hover:text-fg">Privacy</Link>
          <Link href="/data-deletion" className="hover:text-fg">Data deletion</Link>
          <a href="mailto:nicolle.aurelien@gmail.com" className="hover:text-fg">Contact</a>
          <span>Not affiliated with TikTok.</span>
        </div>
      </div>
    </footer>
  );
}
