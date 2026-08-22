import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.oaisislabs.com"),
  title: "OAISIS Labs — Schedule your TikTok videos. They post themselves.",
  description:
    "Upload your videos in bulk, set a posting calendar, and OAISIS Labs publishes them to your TikTok account on schedule — then shows you how each one performed.",
  icons: { icon: "/favicon.svg" },
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
