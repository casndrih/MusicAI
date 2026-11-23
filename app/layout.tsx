import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusicAI — Reimagine your sound",
  description: "Turn any track into a fresh genre, mood, and sound with AI-powered music remixing.",
  applicationName: "MusicAI",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "MusicAI — Reimagine your sound",
    description: "Upload a track. Choose a direction. Hear a new version.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
