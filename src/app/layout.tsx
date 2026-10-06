import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/site/site.css";

export const metadata: Metadata = {
  title: { default: "Wish Tale", template: "%s · Wish Tale" },
  description: "Interactive surprises for birthdays and every occasion: games, photos, your song and a letter, shared as one link.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Gloock&family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400;1,6..72,500&family=Figtree:wght@400;500;600;700&family=Homemade+Apple&family=Caprasimo&family=Cormorant:ital,wght@0,500;1,500&family=JetBrains+Mono&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
