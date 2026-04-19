import type { Metadata } from "next";
import { VT323, Share_Tech_Mono, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap" });
const shareTechMono = Share_Tech_Mono({ weight: "400", subsets: ["latin"], variable: "--font-mono", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "TrainIQ",
  description: "KI-gestützter Trainingscoach für Ausdauersportler",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TrainIQ" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`${vt323.variable} ${shareTechMono.variable} ${inter.variable} font-sans bg-bg text-textMain`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
