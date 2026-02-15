import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHORT Scanner v1.0.0 - Crypto SHORT Setup Scanner",
  description: "Professional cryptocurrency SHORT setup scanner with technical analysis, indicators, and risk management. Find the best shorting opportunities.",
  keywords: ["crypto", "scanner", "short", "trading", "cryptocurrency", "technical analysis", "RSI", "MACD"],
  authors: [{ name: "SHORT Scanner Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SHORT Scanner v1.0.0",
    description: "Professional crypto SHORT setup scanner",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
