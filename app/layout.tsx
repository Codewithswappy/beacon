import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beacon",
  description: "Your creative hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
         * Preconnect to Cloudinary CDN.
         *
         * Opens the TCP connection + TLS handshake to res.cloudinary.com BEFORE
         * the browser discovers the first image URL. This eliminates ~100–200 ms
         * of network setup time on every page load.
         *
         * crossOrigin="anonymous" is required for preconnect to a different
         * origin — without it the browser opens a separate connection anyway
         * and the hint is wasted.
         *
         * dns-prefetch is the lightweight fallback: resolves the DNS entry ahead
         * of time for browsers that don't act on preconnect (Safari < 12, etc.).
         */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-background text-foreground font-sans antialiased`}
      >
        <ThemeProvider>
          <TopNavBar />
          <main className="min-h-screen pb-24 md:pb-0">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
