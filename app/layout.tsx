import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusicAI — Local AI Audio Studio",
  description: "Remove vocals, create instrumentals and separate music stems locally in your browser.",
  applicationName: "MusicAI",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://music-ai-casndrih.vercel.app"),
  openGraph: {
    title: "MusicAI — Local AI Audio Studio",
    description: "Separate vocals and instruments with browser-based AI. Your audio stays on your device.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
