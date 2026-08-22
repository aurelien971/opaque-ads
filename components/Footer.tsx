import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stroke/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-bold text-fg">Opaque Studio</span>
          <span className="ml-3">
            © {new Date().getFullYear()} OAISIS Labs. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/pricing" className="hover:text-fg">
            Pricing
          </Link>
          <Link href="/terms" className="hover:text-fg">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-fg">
            Privacy Policy
          </Link>
          <Link href="/data-deletion" className="hover:text-fg">
            Data Deletion
          </Link>
          <a href="mailto:nicolle.aurelien@gmail.com" className="hover:text-fg">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
