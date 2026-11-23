import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, AudioWaveform, Code2, Music2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About the Developer — MusicAI",
  description: "About the independent developer behind MusicAI."
};

export default function AboutPage() {
  return <main className="about-page">
    <div className="about-topbar">
      <Link className="brand" href="/"><span className="brand-mark"><AudioWaveform size={22}/></span><span>Music<span className="brand-accent">AI</span></span></Link>
      <Link className="about-back" href="/"><ArrowLeft size={15}/> Back to MusicAI</Link>
    </div>
    <section className="about-hero">
      <div className="about-hero-glow"/>
      <div className="eyebrow"><span className="eyebrow-dot"/> ABOUT THE PROJECT</div>
      <h1>Built with curiosity.<br/><em>Made for music.</em></h1>
      <p>MusicAI is an independent project designed and developed by <strong>Casper Ndrih</strong>. It brings browser-based audio tools together in one simple workspace.</p>
      <Link className="button button-primary" href="/#remixer"><Sparkles size={17}/> Try MusicAI <ArrowUpRight size={16}/></Link>
    </section>
    <section className="about-content">
      <div className="about-story-grid">
        <article className="about-story">
          <span className="about-story-icon"><Code2 size={20}/></span>
          <span className="muted-label">THE BUILD</span>
          <h3>Designed and developed independently.</h3>
          <p>MusicAI combines a focused interface with browser-based audio processing, so source recordings can stay on your device during separation.</p>
        </article>
        <article className="about-story">
          <span className="about-story-icon"><Music2 size={20}/></span>
          <span className="muted-label">THE IDEA</span>
          <h3>Explore another side of a song.</h3>
          <p>Separate vocals and instruments, identify recordings and explore official music previews from one place.</p>
        </article>
      </div>
    </section>
    <footer className="about-footer"><Link className="brand" href="/"><span className="brand-mark"><AudioWaveform size={20}/></span><span>Music<span className="brand-accent">AI</span></span></Link><span>Independent project by Casper Ndrih.</span></footer>
  </main>;
}
