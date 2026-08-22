import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.oaisislabs.com"),
  title: "Opaque Studio — AI creatives, published to TikTok",
  description:
    "Generate scroll-stopping before/after video creatives with AI, add music, and publish them straight to your TikTok account. The creative engine built to grow Opaque, open to every marketer.",
  icons: { icon: "/app-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={serif.variable}>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
