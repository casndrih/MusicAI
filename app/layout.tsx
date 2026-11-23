import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MusicAI — AI Song Remix Studio",
  description: "Reimagine your music with AI. Upload a track, choose a new direction and create alternate remix takes.",
  applicationName: "MusicAI",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://music-ai-casndrih.vercel.app"),
  openGraph: {
    title: "MusicAI — AI Song Remix Studio",
    description: "Upload a track. Describe a new sound. Explore AI-generated remix takes.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
